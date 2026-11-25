import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateMaintenanceAdmission } from '../bin/maintenance-recursion.mjs';
import {
  admitMaintenanceInRun,
  createRunState,
  digest,
  dispatchReadyTaskInRun,
  registerDurableTask,
  verifyRunState,
} from '../bin/orchestration-run-state.ts';

test('all governed maintenance kinds suppress only an equivalent identity and evidence revision', () => {
  for (const kind of ['maintenance', 'learning', 'triad-sync', 'improvement', 'prompt-hook']) {
    const triggerId = `${kind}:refresh`;
    const identity = `${kind}@revision-a#${triggerId}`;
    const suppressed = evaluateMaintenanceAdmission({ kind, evidenceRevision: 'revision-a', triggerId, depth: 1, coveredIdentities: [identity] });
    assert.equal(suppressed.admitted, false, kind);
    assert.equal(suppressed.reason, 'equivalent-trigger-covered', kind);
    const refreshed = evaluateMaintenanceAdmission({ kind, evidenceRevision: 'revision-b', triggerId, depth: 1, coveredIdentities: [identity] });
    assert.equal(refreshed.admitted, true, `${kind} must reopen for new evidence`);
  }
});

test('active prompt hook identity does not suppress unrelated maintenance', () => {
  const active = 'prompt-hook@revision-a#prompt-hook:hydrate';
  assert.equal(evaluateMaintenanceAdmission({ kind: 'prompt-hook', evidenceRevision: 'revision-a', triggerId: 'prompt-hook:hydrate', depth: 1 }, active).admitted, false);
  assert.equal(evaluateMaintenanceAdmission({ kind: 'learning', evidenceRevision: 'revision-a', triggerId: 'learning:docs', depth: 1 }, active).admitted, true);
});

test('run-state suppression is checkpointed while unrelated ready work continues', () => {
  const taskDigest = digest({ task: 'unrelated' });
  let state = registerDurableTask(createRunState('run-recursion', 'recursion'), { taskId: 'unrelated', taskDigest, owner: 'worker-a' });
  const first = admitMaintenanceInRun(state, { kind: 'triad-sync', evidenceRevision: 'revision-a', triggerId: 'triad-sync:refresh', recursionDepth: 0 });
  assert.equal(first.admitted, true);
  const repeated = admitMaintenanceInRun(first.state, { kind: 'triad-sync', evidenceRevision: 'revision-a', triggerId: 'triad-sync:refresh', recursionDepth: 1 });
  assert.equal(repeated.admitted, false);
  assert.equal(repeated.reason, 'equivalent-trigger-covered');
  state = dispatchReadyTaskInRun(repeated.state, {
    taskId: 'unrelated', taskDigest, workerId: 'worker-a', centralOwner: 'integration-writer', objective: 'Run unrelated ready work',
    ownedPaths: ['src/unrelated.ts'], acceptance: ['node --test unrelated'], now: '2026-11-25T14:00:00.000Z',
  }).state;
  assert.equal(state.dispatchExecutions.at(-1)?.status, 'running');
  assert.doesNotThrow(() => verifyRunState(state));
});

test('new evidence revision is admitted and excessive recursion fails closed', () => {
  const initial = createRunState('run-revision', 'recursion');
  const first = admitMaintenanceInRun(initial, { kind: 'learning', evidenceRevision: 'revision-a', triggerId: 'learning:refresh', recursionDepth: 0 });
  const refreshed = admitMaintenanceInRun(first.state, { kind: 'learning', evidenceRevision: 'revision-b', triggerId: 'learning:refresh', recursionDepth: 1 });
  assert.equal(refreshed.admitted, true);
  const excessive = admitMaintenanceInRun(refreshed.state, { kind: 'learning', evidenceRevision: 'revision-c', triggerId: 'learning:refresh', recursionDepth: 5 });
  assert.equal(excessive.admitted, false);
  assert.equal(excessive.reason, 'recursion-depth-exceeded');
});
