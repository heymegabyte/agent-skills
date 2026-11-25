import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const runbook = readFileSync(join(root, 'control-plane', 'DURABLE-EXECUTION.md'), 'utf8');
const releaseRole = readFileSync(join(root, 'agents', 'release-manager.md'), 'utf8');

test('runbook names every governed runtime transition and recovery surface', () => {
  for (const name of [
    'registerDurableTask', 'dispatchReadyTaskInRun', 'claimRepositoryIntegrationWriterLease',
    'saveRunState', 'loadRunState', 'resumeRunFromCheckpoint', 'reassignStalledTaskDispatch',
    'prepareReconciliationWorktree', 'replayTaskCommits', 'affectedChecks', 'planTestedTreePush',
    'executeTestedTreePush', 'observeRemoteAndCi',
  ]) assert.match(runbook, new RegExp(`\\b${name}\\b`), name);
  for (const section of ['Bounded task briefs and ownership', 'Integration-writer lease', 'Worker handoff', 'Failure recovery', 'Executable simulations']) assert.ok(runbook.includes(section));
});

test('documented transitions match the runtime safety boundaries', () => {
  assert.match(runbook, /pending \+ ready -> running -> succeeded with evidence/);
  assert.match(runbook, /one active lease exists per repository/);
  assert.match(runbook, /remote SHA equals the tested commit/);
  assert.match(runbook, /never rebased, reset, stashed or blanket-staged/);
  assert.match(runbook, /never force-push/);
  assert.match(releaseRole, /DURABLE-EXECUTION\.md/);
});

test('runbook simulation commands are syntactically executable and use only controlled tests', () => {
  const blocks = [...runbook.matchAll(/```bash\n([\s\S]*?)```/g)].map((match) => match[1]);
  assert.equal(blocks.length, 1);
  const path = join(mkdtempSync(join(tmpdir(), 'durable-docs-')), 'simulation.sh');
  writeFileSync(path, `#!/bin/bash\nset -euo pipefail\n${blocks[0]}`);
  const syntax = spawnSync('bash', ['-n', path], { encoding: 'utf8' });
  assert.equal(syntax.status, 0, syntax.stderr);
  assert.doesNotMatch(blocks[0], /(?:push|fetch|deploy|curl|gh\s)/);
  for (const fixture of ['orchestration-run-state-durability', 'integration-writer-leases', 'idempotent-task-dispatch', 'exact-resume', 'maintenance-recursion-guards', 'git-reconciliation']) assert.match(blocks[0], new RegExp(fixture));
});
