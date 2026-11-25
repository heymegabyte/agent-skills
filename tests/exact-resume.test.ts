import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  claimRepositoryIntegrationWriterLease,
  completeTaskDispatch,
  createRunState,
  digest,
  dispatchReadyTaskInRun,
  registerDurableTask,
  resumeRunFromCheckpoint,
  loadRunState,
  saveRunState,
  verifyRunState,
  type ReadyTaskDispatchInput,
  type RunState,
} from '../bin/orchestration-run-state.ts';

const matrix = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'orchestration', 'operational-contract', 'resume-crash-matrix.json'), 'utf8'));
const expected = (id: string) => matrix.cases.find((candidate: { id: string }) => candidate.id === id).expected;
const taskDigest = digest({ task: 'resume-a' });
const brief = (now: string): ReadyTaskDispatchInput => ({ taskId: 'a', taskDigest, workerId: 'worker-a', centralOwner: 'integration-writer', objective: 'Resume task a', ownedPaths: ['src/a.ts'], acceptance: ['node --test a'], evidenceRefs: ['contract:a'], now });

function resume(state: RunState, overrides: Partial<Parameters<typeof resumeRunFromCheckpoint>[1]> = {}) {
  return resumeRunFromCheckpoint(state, {
    expectedStateDigest: state.stateDigest,
    expectedCheckpointId: state.checkpoints.at(-1)!.checkpointId,
    now: '2026-11-25T13:00:20.000Z',
    stallAfterMs: 10_000,
    centralOwner: 'integration-writer',
    blockedExternalEdges: [],
    ...overrides,
  });
}

test('crash before first dispatch launches the one unfinished ready task', () => {
  const state = registerDurableTask(createRunState('resume-before', 'resume'), { taskId: 'a', taskDigest, owner: 'worker-a' }, '2026-11-25T13:00:00.000Z');
  const path = join(mkdtempSync(join(tmpdir(), 'resume-crash-')), 'run.json');
  saveRunState(path, state);
  const result = resume(loadRunState(path), { readyBriefs: [brief('2026-11-25T13:00:20.000Z')] });
  assert.deepEqual({ launched: result.launched.length, reused: result.reused.length, inFlight: result.inFlight.length }, expected('before-first-dispatch'));
  assert.equal(result.state.dispatchExecutions.filter((execution) => execution.status === 'running').length, 1);
});

test('fresh in-flight dispatch is preserved and not relaunched', () => {
  const registered = registerDurableTask(createRunState('resume-inflight', 'resume'), { taskId: 'a', taskDigest, owner: 'worker-a' }, '2026-11-25T13:00:00.000Z');
  const launched = dispatchReadyTaskInRun(registered, brief('2026-11-25T13:00:01.000Z'));
  const result = resume(launched.state, { now: '2026-11-25T13:00:05.000Z' });
  assert.deepEqual({ launched: result.launched.length, reused: result.reused.length, inFlight: result.inFlight.length }, expected('after-dispatch-before-receipt'));
  assert.equal(result.state.dispatchExecutions.length, 1);
});

test('stalled execution reassigns exactly once from its persisted brief', () => {
  const registered = registerDurableTask(createRunState('resume-stalled', 'resume'), { taskId: 'a', taskDigest, owner: 'worker-a' }, '2026-11-25T13:00:00.000Z');
  const launched = dispatchReadyTaskInRun(registered, brief('2026-11-25T13:00:01.000Z'));
  const result = resume(launched.state, { reassignmentWorkers: { [launched.execution.dispatchId]: 'worker-b' } });
  assert.deepEqual({ launched: result.launched.length, reused: result.reused.length, inFlight: result.inFlight.length }, expected('after-stall'));
  assert.equal(result.state.dispatchExecutions.at(-1)?.attempt, 2);
  assert.equal(result.state.dispatchExecutions.filter((execution) => execution.status === 'running').length, 1);
});

test('completed receipt is reused and never relaunched', () => {
  const registered = registerDurableTask(createRunState('resume-complete', 'resume'), { taskId: 'a', taskDigest, owner: 'worker-a' }, '2026-11-25T13:00:00.000Z');
  const launched = dispatchReadyTaskInRun(registered, brief('2026-11-25T13:00:01.000Z'));
  const completed = completeTaskDispatch(launched.state, { dispatchId: launched.execution.dispatchId, workerId: 'worker-a', receiptRef: 'receipt:a:pass', documentationReceiptRef: 'docs:a:pass', learningReceiptRef: 'learning:a:pass', now: '2026-11-25T13:00:02.000Z' });
  const result = resume(completed);
  assert.deepEqual({ launched: result.launched.length, reused: result.reused.length, inFlight: result.inFlight.length }, expected('after-completion-receipt'));
  assert.deepEqual(result.reused, ['receipt:a:pass']);
});

test('blocked external edges and absent briefs remain exact resumable blockers', () => {
  const state = registerDurableTask(createRunState('resume-blocked', 'resume'), { taskId: 'a', taskDigest, owner: 'worker-a' }, '2026-11-25T13:00:00.000Z');
  const result = resume(state, { blockedExternalEdges: ['release:@theme.tools/ui:published-version'] });
  assert.equal(result.preservedBlocked.includes('release:@theme.tools/ui:published-version'), expected('blocked-external-edge').preserved);
  assert.ok(result.preservedBlocked.some((edge) => edge.startsWith('missing-brief:')));
});

test('safe leases restore while expired leases remain explicitly recoverable', () => {
  let safe = createRunState('resume-lease-safe', 'resume');
  safe = claimRepositoryIntegrationWriterLease(safe, { repository: 'repo-safe', claimantRunId: 'run-a', now: '2026-11-25T13:00:00.000Z', ttlMs: 60_000 }).state;
  safe = claimRepositoryIntegrationWriterLease(safe, { repository: 'repo-expired', claimantRunId: 'run-a', now: '2026-11-25T12:59:00.000Z', ttlMs: 10_000 }).state;
  const result = resume(safe);
  assert.deepEqual({ restored: result.restoredLeases.length, recoverable: result.recoverableLeases.length }, expected('lease-boundary'));
});

test('resume rejects stale state or checkpoint digests and preserves a valid state', () => {
  const state = registerDurableTask(createRunState('resume-digest', 'resume'), { taskId: 'a', taskDigest, owner: 'worker-a' });
  assert.throws(() => resume(state, { expectedStateDigest: digest('stale') }), /state digest mismatch/);
  assert.throws(() => resume(state, { expectedCheckpointId: digest('stale') }), /checkpoint digest mismatch/);
  assert.doesNotThrow(() => verifyRunState(state));
});
