import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const runbook = readFileSync(join(root, 'control-plane', 'INSTRUCTION-POLICY.md'), 'utf8');
const readme = readFileSync(join(root, 'README.md'), 'utf8');

test('runbook covers supported layers, provider limits, ownership, lifecycle, and troubleshooting', () => {
  for (const required of [
    'Supported layers', 'user-controlled-customization-only', 'Explicit-source fleet preflight',
    'Update from remote main', 'Roll back to a verified revision', 'Troubleshooting source selection',
    'duplicate-managed-block', 'foreign-managed-digest', 'Paperclip', 'OpenClaw',
  ]) assert.ok(runbook.includes(required), `missing ${required}`);
  assert.match(readme, /instruction policy operations runbook/);
});

test('documentation preserves the provider authority and evidence boundary', () => {
  assert.match(runbook, /does \*\*not\*\* modify, replace, or claim authority over provider-controlled/);
  assert.match(runbook, /Instruction-file presence is not runtime-loading proof/);
  assert.match(runbook, /do not prove that a provider loaded the policy/);
  assert.doesNotMatch(runbook, /(?:OPENAI|ANTHROPIC|DEEPSEEK)_API_KEY/);
  assert.doesNotMatch(runbook, /cat\s+>[^>]/);
  assert.doesNotMatch(runbook, /git\s+(?:reset\s+--hard|push\s+--force)/);
});

test('all documented bash recipes are syntactically executable', () => {
  const blocks = [...runbook.matchAll(/```bash\n([\s\S]*?)```/g)].map((match) => match[1]);
  assert.ok(blocks.length >= 4);
  const directory = mkdtempSync(join(tmpdir(), 'instruction-policy-docs-'));
  blocks.forEach((block, index) => {
    const path = join(directory, `recipe-${index}.sh`);
    writeFileSync(path, `#!/bin/bash\nset -euo pipefail\n${block}`);
    const checked = spawnSync('bash', ['-n', path], { encoding: 'utf8' });
    assert.equal(checked.status, 0, `recipe ${index}: ${checked.stderr}`);
  });
});

test('documented commands use explicit source and revision inputs', () => {
  assert.match(runbook, /--source-root "\$POLICY_REPO"/);
  assert.match(runbook, /--expected-revision "\$POLICY_REVISION"/);
  assert.match(runbook, /--check-publish-instructions/);
  assert.match(runbook, /--publish-instructions/);
  assert.doesNotMatch(runbook, /source-root "?~\/\.agentskills/);
});
