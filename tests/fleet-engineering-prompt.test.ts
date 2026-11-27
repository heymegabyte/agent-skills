import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { runFleet55RepoMultiAxisConvergence } from "../bin/fleet-55-repo-multi-axis-converger.ts";

test("fleet bootstrap writes current engineering instructions and preserves existing instructions", async () => {
  const reposRoot = mkdtempSync(join(tmpdir(), "fleet-engineering-prompt-"));
  try {
    const newRepository = join(reposRoot, "sample.site");
    const existingRepository = join(reposRoot, "existing.site");
    mkdirSync(newRepository);
    mkdirSync(existingRepository);
    const existingInstructions = "# Existing local engineering instructions\n";
    writeFileSync(join(existingRepository, "AGENTS.md"), existingInstructions);

    const summary = await runFleet55RepoMultiAxisConvergence({ reposRoot });

    assert.equal(summary.agentsMdConverged, 2);
    const generated = readFileSync(join(newRepository, "AGENTS.md"), "utf8");
    assert.match(generated, /React 19 \+ Vite with `@theme\.tools\/ui` \(`ui\.theme\.tools`\) as the exclusive component system/);
    assert.match(generated, /Dispatch independent work concurrently at intake and whenever a dependency clears/);
    assert.match(generated, /Delegate every suitable task to OpenCode with DeepSeek via LiteLLM/);
    assert.match(generated, /Use Codex, Gemini, or Claude when specialist capability or independent review materially improves the result/);
    assert.doesNotMatch(generated, /Angular|Spartan UI|shadcn\/ui|Off-Peak/);
    assert.equal(readFileSync(join(existingRepository, "AGENTS.md"), "utf8"), existingInstructions);
  } finally {
    rmSync(reposRoot, { recursive: true, force: true });
  }
});
