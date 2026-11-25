import assert from 'node:assert/strict';
import test from 'node:test';

import {
  completeTaskDispatch,
  createRunState,
  digest,
  dispatchReadyTaskInRun,
  reassignStalledTaskDispatch,
  registerDurableTask,
  requiresCentralOwnership,
  verifyRunState,
} from '../bin/orchestration-run-state.ts';

const taskA = digest({ task: 'a' });
const taskB = digest({ task: 'b' });
const baseInput = (taskId: string, taskDigest: string, workerId: string, now: string) => ({
  taskId, taskDigest, workerId, centralOwner: 'integration-writer', objective: `Implement ${taskId}`,
  ownedPaths: [`src/${taskId}.ts`], acceptance: [`node --test ${taskId}`], evidenceRefs: [`contract:${taskId}`], now,
});

test('duplicate event returns the existing execution without a second launch', () => {
  const registered = registerDurableTask(createRunState('run-dispatch', 'dispatch'), { taskId: 'a', taskDigest: taskA, owner: 'worker-a' });
  const first = dispatchReadyTaskInRun(registered, baseInput('a', taskA, 'worker-a', '2026-11-25T12:00:00.000Z'));
  const second = dispatchReadyTaskInRun(first.state, baseInput('a', taskA, 'worker-a', '2026-11-25T12:00:01.000Z'));
  assert.equal(first.launched, true);
  assert.equal(second.launched, false);
  assert.equal(second.disposition, 'existing-execution');
  assert.equal(second.state.dispatchExecutions.length, 1);
});

test('completed receipt is reused by duplicate delivery', () => {
  const registered = registerDurableTask(createRunState('run-complete', 'dispatch'), { taskId: 'a', taskDigest: taskA, owner: 'worker-a' });
  const launched = dispatchReadyTaskInRun(registered, baseInput('a', taskA, 'worker-a', '2026-11-25T12:00:00.000Z'));
  const completed = completeTaskDispatch(launched.state, { dispatchId: launched.execution.dispatchId, workerId: 'worker-a', receiptRef: 'test:a:pass', documentationReceiptRef: 'docs:a:pass', learningReceiptRef: 'learning:a:pass', now: '2026-11-25T12:00:10.000Z' });
  const duplicate = dispatchReadyTaskInRun(completed, baseInput('a', taskA, 'worker-a', '2026-11-25T12:00:11.000Z'));
  assert.equal(duplicate.launched, false);
  assert.equal(duplicate.disposition, 'completed-receipt-reused');
  assert.equal(duplicate.execution.completedReceiptRef, 'test:a:pass');
});

test('independent ready tasks dispatch in the same wave', () => {
  let state = createRunState('run-wave', 'dispatch');
  state = registerDurableTask(state, { taskId: 'a', taskDigest: taskA, owner: 'worker-a' });
  state = registerDurableTask(state, { taskId: 'b', taskDigest: taskB, owner: 'worker-b' });
  const a = dispatchReadyTaskInRun(state, baseInput('a', taskA, 'worker-a', '2026-11-25T12:00:00.000Z'));
  const b = dispatchReadyTaskInRun(a.state, baseInput('b', taskB, 'worker-b', '2026-11-25T12:00:00.000Z'));
  assert.equal(b.state.dispatchExecutions.filter((execution) => execution.status === 'running').length, 2);
  assert.doesNotThrow(() => verifyRunState(b.state));
});

test('shared schemas, lockfiles, workflows, and releases remain centrally owned', () => {
  for (const path of ['schemas/run.json', 'pnpm-lock.yaml', '.github/workflows/release.yml', '.changeset/next.md', 'releases/v1.json']) assert.equal(requiresCentralOwnership(path), true, path);
  let state = registerDurableTask(createRunState('run-central', 'dispatch'), { taskId: 'a', taskDigest: taskA, owner: 'integration-writer' });
  const input = { ...baseInput('a', taskA, 'worker-a', '2026-11-25T12:00:00.000Z'), ownedPaths: ['schemas/run.json'] };
  assert.throws(() => dispatchReadyTaskInRun(state, input), /central integration owner/);
  const central = dispatchReadyTaskInRun(state, { ...input, workerId: 'integration-writer' });
  assert.equal(central.launched, true);
});

test('worker briefs are bounded and stalled work reassigns without duplicate active execution', () => {
  const state = registerDurableTask(createRunState('run-reassign', 'dispatch'), { taskId: 'a', taskDigest: taskA, owner: 'worker-a' });
  assert.throws(() => dispatchReadyTaskInRun(state, { ...baseInput('a', taskA, 'worker-a', '2026-11-25T12:00:00.000Z'), objective: 'x'.repeat(1000), maxBriefBytes: 100 }), /exceeds configured byte bound/);
  const launched = dispatchReadyTaskInRun(state, baseInput('a', taskA, 'worker-a', '2026-11-25T12:00:00.000Z'));
  assert.throws(() => reassignStalledTaskDispatch(launched.state, { dispatchId: launched.execution.dispatchId, newWorkerId: 'worker-b', centralOwner: 'integration-writer', now: '2026-11-25T12:00:01.000Z', stallAfterMs: 10_000 }), /not stalled/);
  const reassigned = reassignStalledTaskDispatch(launched.state, { dispatchId: launched.execution.dispatchId, newWorkerId: 'worker-b', centralOwner: 'integration-writer', now: '2026-11-25T12:00:20.000Z', stallAfterMs: 10_000 });
  assert.equal(reassigned.execution.attempt, 2);
  assert.equal(reassigned.state.dispatchExecutions.filter((execution) => execution.status === 'running').length, 1);
  assert.equal(reassigned.state.dispatchExecutions.filter((execution) => execution.status === 'stalled').length, 1);
});

test('dependency DAG blocks downstream dispatch until completion evidence exists', () => {
  let state = createRunState('run-dag', 'dispatch');
  state = registerDurableTask(state, { taskId: 'a', taskDigest: taskA, owner: 'worker-a' });
  state = registerDurableTask(state, { taskId: 'b', taskDigest: taskB, owner: 'worker-b', dependsOn: ['a'] });
  assert.throws(() => dispatchReadyTaskInRun(state, baseInput('b', taskB, 'worker-b', '2026-11-25T12:00:00.000Z')), /not ready/);
  const a = dispatchReadyTaskInRun(state, baseInput('a', taskA, 'worker-a', '2026-11-25T12:00:01.000Z'));
  state = completeTaskDispatch(a.state, { dispatchId: a.execution.dispatchId, workerId: 'worker-a', receiptRef: 'test:a:pass', documentationReceiptRef: 'docs:a:pass', learningReceiptRef: 'learning:a:pass', now: '2026-11-25T12:00:02.000Z' });
  const b = dispatchReadyTaskInRun(state, baseInput('b', taskB, 'worker-b', '2026-11-25T12:00:03.000Z'));
  assert.equal(b.launched, true);
});
