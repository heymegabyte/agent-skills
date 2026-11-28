import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const script = fileURLToPath(new URL("../bin/push-generated-instructions.sh", import.meta.url));
const target = "refs/heads/main";

function command(cwd, file, args) {
  const result = spawnSync(file, args, { cwd, encoding: "utf8" });
  if (result.error) throw result.error;
  return result;
}

function git(cwd, ...args) {
  const result = command(cwd, "git", args);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function commitFile(cwd, file, contents) {
  writeFileSync(join(cwd, file), contents);
  git(cwd, "add", file);
  git(cwd, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.test", "commit", "-m", "Fixture revision");
}

function fixture(use) {
  const root = mkdtempSync(join(tmpdir(), "generated-instruction-push-"));
  try {
    const remote = join(root, "remote.git");
    const checkout = join(root, "checkout");
    git(root, "init", "--bare", "--initial-branch=main", remote);
    git(root, "init", "--initial-branch=main", checkout);
    commitFile(checkout, "canonical.txt", "initial");
    const source = git(checkout, "rev-parse", "HEAD");
    git(checkout, "remote", "add", "origin", remote);
    git(checkout, "push", "origin", "HEAD:" + target);
    git(checkout, "checkout", "--detach");
    use({ root, remote, checkout, source });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function stageGenerated(checkout) {
  writeFileSync(join(checkout, "generated.txt"), "derived from canonical source");
  git(checkout, "add", "generated.txt");
}

test("an unchanged source succeeds without an origin", () => fixture(({ checkout, source }) => {
  git(checkout, "remote", "remove", "origin");
  const result = command(checkout, "bash", [script, target, source]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Generated instructions unchanged/);
  assert.equal(git(checkout, "rev-parse", "HEAD"), source);
}));

test("publishes generated changes for the validated detached revision", () => fixture(({ checkout, remote, source }) => {
  stageGenerated(checkout);
  const invalid = command(checkout, "bash", [script, target, "different-source"]);
  assert.notEqual(invalid.status, 0);
  assert.equal(git(remote, "rev-parse", target), source);
  const result = command(checkout, "bash", [script, target, source]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Published generated instructions/);
  assert.equal(git(remote, "rev-parse", target), git(checkout, "rev-parse", "HEAD"));
  assert.equal(git(remote, "show", target + ":generated.txt"), "derived from canonical source");
}));

test("reports a rejected push and preserves a newer canonical revision", () => fixture(({ root, checkout, remote, source }) => {
  const successor = join(root, "successor");
  git(root, "clone", remote, successor);
  commitFile(successor, "canonical.txt", "newer");
  const newer = git(successor, "rev-parse", "HEAD");
  git(successor, "push", "origin", "HEAD:" + target);
  stageGenerated(checkout);
  const result = command(checkout, "bash", [script, target, source]);
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stdout, /Published generated instructions/);
  assert.match(result.stderr, /rejected/);
  assert.equal(git(remote, "rev-parse", target), newer);
  assert.equal(git(remote, "show", target + ":canonical.txt"), "newer");
}));
