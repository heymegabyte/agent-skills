import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'config', 'prompt-hydration-entrypoints.json'), 'utf8')) as {
  stage: string;
  entrypoints: Array<{ harness: string; support: string; nativePromptHook: boolean; command: string }>;
};

test('entrypoint manifest reports one native hook and honest explicit wrappers', () => {
  assert.equal(manifest.stage, 'Prompt Hydration');
  assert.deepEqual(manifest.entrypoints.filter((entry) => entry.nativePromptHook).map((entry) => entry.harness), ['claude']);
  for (const entry of manifest.entrypoints.filter((candidate) => candidate.harness !== 'claude')) {
    assert.equal(entry.support, 'explicit-wrapper');
    assert.equal(entry.nativePromptHook, false);
    assert.match(entry.command, new RegExp(`prompt-hydration-entry\\.mjs --harness ${entry.harness}$`));
  }
  const hookManifest = JSON.parse(readFileSync(join(root, 'hooks', 'hooks.json'), 'utf8'));
  assert.match(hookManifest.hooks.UserPromptSubmit[0].hooks[0].command, /prompt-hydration-hook\.mjs/);
});

test('every non-native supported harness hydrates a narrow engineering request through the wrapper', () => {
  for (const entry of manifest.entrypoints.filter((candidate) => !candidate.nativePromptHook)) {
    const run = spawnSync(process.execPath, [join(root, 'bin', 'prompt-hydration-entry.mjs'), '--harness', entry.harness], {
      cwd: root,
      input: JSON.stringify({ prompt: 'Fix the mega menu title changing on hover', cwd: root }),
      encoding: 'utf8',
      timeout: 20_000,
    });
    assert.equal(run.status, 0, `${entry.harness}: ${run.stderr}`);
    const receipt = JSON.parse(run.stdout);
    assert.equal(receipt.harness, entry.harness);
    assert.equal(receipt.support, 'explicit-wrapper');
    assert.equal(receipt.nativePromptHook, false);
    assert.equal(receipt.status, 'hydrated');
    assert.equal(receipt.stage, 'Prompt Hydration');
    assert.ok(receipt.hydrationId);
    assert.deepEqual(Object.keys(receipt.focusedPlan).sort(), ['context', 'impact', 'improvementReview', 'regressionEvidence']);
  }
});

test('material wrapper hydration retains expanded coverage without a focused plan', () => {
  const run = spawnSync(process.execPath, [join(root, 'bin', 'prompt-hydration-entry.mjs'), '--harness', 'coordinator'], {
    cwd: root,
    input: JSON.stringify({ prompt: 'Architect a durable provider integration platform', cwd: root }),
    encoding: 'utf8',
    timeout: 20_000,
  });
  assert.equal(run.status, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(receipt.focusedPlan, null);
  assert.equal(receipt.coverageMatrix.length, 12);
  assert.ok(receipt.coverageMatrix.filter((row: { applicability: string }) => row.applicability === 'applicable').length >= 8);
});

test('equivalent recursive maintenance is suppressed by native and wrapper entrypoints', () => {
  const maintenance = { triggerId: 'triad-sync:revision-42', depth: 1, coveredTriggerIds: ['triad-sync:revision-42'] };
  const wrapper = spawnSync(process.execPath, [join(root, 'bin', 'prompt-hydration-entry.mjs'), '--harness', 'worker'], {
    cwd: root,
    input: JSON.stringify({ prompt: 'Update generated maintenance outputs', cwd: root, maintenance }),
    encoding: 'utf8',
    timeout: 5_000,
  });
  assert.equal(wrapper.status, 0, wrapper.stderr);
  assert.equal(JSON.parse(wrapper.stdout).status, 'suppressed-recursive-maintenance');

  const hook = spawnSync(process.execPath, [join(root, 'bin', 'prompt-hydration-hook.mjs')], {
    cwd: root,
    input: JSON.stringify({ prompt: 'Update generated maintenance outputs', cwd: root, maintenance }),
    encoding: 'utf8',
    timeout: 5_000,
  });
  assert.equal(hook.status, 0, hook.stderr);
  assert.match(JSON.parse(hook.stdout).hookSpecificOutput.additionalContext, /suppressed an equivalent recursive maintenance invocation/);
});
