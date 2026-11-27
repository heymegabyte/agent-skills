#!/usr/bin/env node
// Disposable-fixture test for bin/change-ownership.ts — proves the atomic one-owner claim.
// Run: node bin/change-ownership.test.mjs   (exit 0 = all pass)
import { mkdtempSync, mkdirSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, spawn } from "node:child_process";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "change-ownership.ts");
const ID = "fixture-change";
let pass = 0;
let failc = 0;
function ok(name, cond) { cond ? (pass++, console.log(`  ok   ${name}`)) : (failc++, console.error(`  FAIL ${name}`)); }

function newRoot() {
  const root = mkdtempSync(join(tmpdir(), "co-test-"));
  mkdirSync(join(root, "openspec", "changes", ID), { recursive: true });
  writeFileSync(join(root, "openspec", "changes", ID, "proposal.md"), "# fixture\n");
  return root;
}
const run = (root, args) => spawnSync("node", [CLI, ...args, "--root", root], { encoding: "utf8" });

// 1. Concurrent claims — EXACTLY ONE wins (the atomicity guarantee).
await (async () => {
  const root = newRoot();
  const N = 12;
  const kids = Array.from({ length: N }, (_, i) =>
    new Promise((res) => {
      const c = spawn("node", [CLI, "claim", ID, "--owner", `inst-${i}`, "--root", root], { stdio: "ignore" });
      c.on("close", (code) => res(code));
    }),
  );
  const codes = await Promise.all(kids);
  const winners = codes.filter((c) => c === 0).length;
  const refused = codes.filter((c) => c === 3).length;
  ok(`concurrent claims: exactly 1 winner (got ${winners})`, winners === 1);
  ok(`concurrent claims: ${N - 1} refused with exit 3 (got ${refused})`, refused === N - 1);
  rmSync(root, { recursive: true, force: true });
})();

// 2. Second (sequential) claim by a different owner is refused (exit 3); state unchanged.
{
  const root = newRoot();
  ok("first claim succeeds (exit 0)", run(root, ["claim", ID, "--owner", "A"]).status === 0);
  ok("different-owner claim refused (exit 3)", run(root, ["claim", ID, "--owner", "B"]).status === 3);
  ok("same-owner re-claim is idempotent (exit 0)", run(root, ["claim", ID, "--owner", "A"]).status === 0);
  ok("show reports owner A", /owned by A/.test(run(root, ["show", ID]).stdout));
  rmSync(root, { recursive: true, force: true });
}

// 3. Release is owner-gated; transfer ends prior ownership + records handoff.
{
  const root = newRoot();
  run(root, ["claim", ID, "--owner", "A"]);
  ok("non-owner release refused (exit 4)", run(root, ["release", ID, "--owner", "B"]).status === 4);
  ok("transfer A->B by wrong from refused (exit 4)", run(root, ["transfer", ID, "--from", "X", "--to", "B"]).status === 4);
  ok("transfer A->B succeeds (exit 0)", run(root, ["transfer", ID, "--from", "A", "--to", "B"]).status === 0);
  const show = run(root, ["show", ID, "--json"]).stdout;
  ok("after transfer owner is B", /"owner":\s*"B"/.test(show));
  ok("handoff recorded (A->B)", /"from":\s*"A"[\s\S]*"to":\s*"B"/.test(show));
  ok("B can now claim-release cycle (release exit 0)", run(root, ["release", ID, "--owner", "B"]).status === 0);
  ok("after release the change is unowned (re-claim exit 0)", run(root, ["claim", ID, "--owner", "C"]).status === 0);
  rmSync(root, { recursive: true, force: true });
}

// 4. Unknown change id → not-found (exit 5).
{
  const root = newRoot();
  ok("unknown change id → exit 5", run(root, ["claim", "does-not-exist", "--owner", "A"]).status === 5);
  rmSync(root, { recursive: true, force: true });
}

console.log(`\nchange-ownership.test: ${pass} passed, ${failc} failed`);
process.exit(failc === 0 ? 0 : 1);
