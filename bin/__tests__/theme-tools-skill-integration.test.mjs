import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

test("every canonical skill routes through the theme.tools ecosystem contract", () => {
  const root = resolve(import.meta.dirname, "../..");
  const result = spawnSync(process.execPath, ["bin/check-theme-tools-skill-integration.mjs"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /PASS theme\.tools skill integration/);
});
