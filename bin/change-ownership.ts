#!/usr/bin/env node
// bin/change-ownership.ts — atomic one-owner-per-OpenSpec-change claim lock.
//
// Enforces the change-ownership invariant (`rules/openspec-change-ownership.md`): each ACTIVE OpenSpec
// change has exactly ONE owning agent instance. The claim is a REAL atomic lock — an exclusive create
// (`O_CREAT|O_EXCL` via the `wx` flag) of `openspec/changes/<id>/owner.json` — not a mutable YAML field
// or a separate checkout (which do not provide atomicity). Two concurrent `claim`s → exactly one wins.
//
// Usage:
//   change-ownership claim    <id> --owner <instance> [--deps a,b] [--areas x,y] [--note "..."]
//   change-ownership release  <id> --owner <instance>
//   change-ownership transfer <id> --from <instance> --to <instance> [--note "..."]
//   change-ownership show     <id> [--json]
//   change-ownership list     [--json]
//   (global: --root <openspec-root>  default: cwd; must contain openspec/changes/)
//
// Exit codes: 0 ok · 2 usage · 3 refused (already owned by another instance) · 4 not-owner · 5 not-found
import { existsSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

interface Handoff {
  from: string;
  to: string;
  at: string;
  note?: string;
}
interface Owner {
  changeId: string;
  owner: string;
  state: "active" | "released";
  dependencies: string[];
  allowedWriteAreas: string[];
  claimedAt: string;
  updatedAt: string;
  handoff: Handoff[];
}

function fail(code: number, msg: string): never {
  process.stderr.write(`change-ownership: ${msg}\n`);
  process.exit(code);
}

function parseArgs(argv: readonly string[]): { positional: string[]; flags: Record<string, string> } {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        flags[key] = "true";
      } else {
        flags[key] = next;
        i++;
      }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

function changesDir(root: string): string {
  const dir = join(root, "openspec", "changes");
  if (!existsSync(dir)) fail(5, `no openspec/changes under root: ${root}`);
  return dir;
}
function changeDir(root: string, id: string): string {
  const dir = join(changesDir(root), id);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) fail(5, `change not found: ${id}`);
  return dir;
}
function ownerPath(root: string, id: string): string {
  return join(changeDir(root, id), "owner.json");
}
function readOwner(path: string): Owner | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Owner;
  } catch {
    fail(1, `corrupt owner.json: ${path}`);
  }
}
function list(v: string | undefined): string[] {
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

function cmdClaim(root: string, id: string, flags: Record<string, string>): void {
  const owner = flags.owner;
  if (!owner || owner === "true") fail(2, "claim requires --owner <instance>");
  const path = ownerPath(root, id);
  const now = new Date().toISOString();
  const record: Owner = {
    changeId: id,
    owner,
    state: "active",
    dependencies: list(flags.deps),
    allowedWriteAreas: list(flags.areas),
    claimedAt: now,
    updatedAt: now,
    handoff: [],
  };
  try {
    // Atomic: exclusive create. If the file already exists, this throws EEXIST — no TOCTOU race.
    writeFileSync(path, JSON.stringify(record, null, 2) + "\n", { flag: "wx" });
    process.stdout.write(`claimed ${id} by ${owner}\n`);
    process.exit(0);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    const cur = readOwner(path);
    if (cur && cur.state === "active" && cur.owner === owner) {
      process.stdout.write(`already owned by ${owner} (idempotent)\n`);
      process.exit(0);
    }
    fail(3, `refused — ${id} is owned by ${cur?.owner ?? "unknown"} (serialize: wait or transfer)`);
  }
}

function cmdRelease(root: string, id: string, flags: Record<string, string>): void {
  const owner = flags.owner;
  if (!owner || owner === "true") fail(2, "release requires --owner <instance>");
  const path = ownerPath(root, id);
  const cur = readOwner(path);
  if (!cur) fail(5, `not owned: ${id}`);
  if (cur.owner !== owner) fail(4, `not-owner — ${id} is owned by ${cur.owner}, not ${owner}`);
  rmSync(path);
  process.stdout.write(`released ${id}\n`);
  process.exit(0);
}

function cmdTransfer(root: string, id: string, flags: Record<string, string>): void {
  const from = flags.from;
  const to = flags.to;
  if (!from || from === "true" || !to || to === "true") fail(2, "transfer requires --from <instance> --to <instance>");
  const path = ownerPath(root, id);
  const cur = readOwner(path);
  if (!cur) fail(5, `not owned: ${id}`);
  if (cur.owner !== from) fail(4, `not-owner — ${id} is owned by ${cur.owner}, not ${from}`);
  const now = new Date().toISOString();
  // End prior ownership and assign the replacement atomically within a single rewrite.
  const next: Owner = {
    ...cur,
    owner: to,
    state: "active",
    updatedAt: now,
    handoff: [...cur.handoff, { from, to, at: now, ...(flags.note && flags.note !== "true" ? { note: flags.note } : {}) }],
  };
  writeFileSync(path, JSON.stringify(next, null, 2) + "\n");
  process.stdout.write(`transferred ${id}: ${from} -> ${to}\n`);
  process.exit(0);
}

function cmdShow(root: string, id: string, flags: Record<string, string>): void {
  const cur = readOwner(ownerPath(root, id));
  if (flags.json === "true") {
    process.stdout.write(JSON.stringify({ changeId: id, owned: !!cur, owner: cur }, null, 2) + "\n");
  } else {
    process.stdout.write(cur ? `${id}: owned by ${cur.owner} (${cur.state}, since ${cur.claimedAt})\n` : `${id}: unowned\n`);
  }
  process.exit(0);
}

function cmdList(root: string, flags: Record<string, string>): void {
  const dir = changesDir(root);
  const owned: Owner[] = [];
  for (const id of readdirSync(dir)) {
    const p = join(dir, id, "owner.json");
    const o = readOwner(p);
    if (o) owned.push(o);
  }
  if (flags.json === "true") {
    process.stdout.write(JSON.stringify({ count: owned.length, owned }, null, 2) + "\n");
  } else if (owned.length === 0) {
    process.stdout.write("no owned changes\n");
  } else {
    for (const o of owned) process.stdout.write(`${o.changeId}\t${o.owner}\t${o.state}\n`);
  }
  process.exit(0);
}

function main(): void {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const root = flags.root && flags.root !== "true" ? flags.root : process.cwd();
  const cmd = positional[0];
  const id = positional[1];
  switch (cmd) {
    case "claim": if (!id) fail(2, "claim requires <change-id>"); return cmdClaim(root, id, flags);
    case "release": if (!id) fail(2, "release requires <change-id>"); return cmdRelease(root, id, flags);
    case "transfer": if (!id) fail(2, "transfer requires <change-id>"); return cmdTransfer(root, id, flags);
    case "show": if (!id) fail(2, "show requires <change-id>"); return cmdShow(root, id, flags);
    case "list": return cmdList(root, flags);
    default: fail(2, "usage: change-ownership <claim|release|transfer|show|list> [args] (see header)");
  }
}

main();
