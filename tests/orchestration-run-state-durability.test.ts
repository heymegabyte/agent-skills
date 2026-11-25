import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  createRunState,
  digest,
  loadRunState,
  registerDurableTask,
  saveRunState,
  setMaintenanceContext,
  stableDispatchId,
  transitionRun,
  transitionDurableTask,
  verifyRunState,
} from '../bin/orchestration-run-state.ts';
import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';

const taskDigestA = digest({ task: 'a', contract: 1 });
const taskDigestB = digest({ task: 'b', contract: 1 });

test('dispatch identity is stable and task-digest bound', () => {
  assert.equal(stableDispatchId('run', 'task', taskDigestA), stableDispatchId('run', 'task', taskDigestA));
  assert.notEqual(stableDispatchId('run', 'task', taskDigestA), stableDispatchId('run', 'task', taskDigestB));
});

test('durable task ownership, readiness, evidence, and checkpoints survive interruption', () => {
  let state = createRunState('run-durable', 'change-durable');
  state = registerDurableTask(state, { taskId: 'a', taskDigest: taskDigestA, owner: 'worker-a', evidenceRefs: ['contract:a'] }, '2026-11-25T01:00:00.000Z');
  state = registerDurableTask(state, { taskId: 'b', taskDigest: taskDigestB, owner: 'worker-b', dependsOn: ['a'] }, '2026-11-25T01:01:00.000Z');
  assert.equal(state.taskStates.find((task) => task.taskId === 'a')?.dependencyReadiness, 'ready');
  assert.equal(state.taskStates.find((task) => task.taskId === 'b')?.dependencyReadiness, 'waiting');
  assert.throws(() => transitionDurableTask(state, 'b', 'running'), /dependencies are not ready/);

  state = transitionDurableTask(state, 'a', 'running', [], '2026-11-25T01:02:00.000Z');
  state = transitionDurableTask(state, 'a', 'succeeded', ['test:a'], '2026-11-25T01:03:00.000Z');
  assert.equal(state.taskStates.find((task) => task.taskId === 'b')?.dependencyReadiness, 'ready');
  state = setMaintenanceContext(state, { triggerId: 'policy-sync:revision-a', recursionDepth: 1, coveredTriggerIds: ['policy-sync:revision-previous'] }, '2026-11-25T01:04:00.000Z');

  const path = join(mkdtempSync(join(tmpdir(), 'durable-run-')), 'state.json');
  saveRunState(path, state);
  const resumed = loadRunState(path);
  assert.deepEqual(resumed, state);
  assert.equal(resumed.checkpoints.length, 5);
  assert.equal(resumed.checkpoints.at(-1)?.priorCheckpointId, resumed.checkpoints.at(-2)?.checkpointId);
  assert.deepEqual(resumed.evidenceReferences, ['contract:a', 'test:a']);
  assert.equal(resumed.maintenance.triggerId, 'policy-sync:revision-a');

  const runningB = transitionDurableTask(resumed, 'b', 'running', [], '2026-11-25T01:05:00.000Z');
  assert.equal(runningB.taskStates.find((task) => task.taskId === 'b')?.status, 'running');
});

test('invalid durable transitions and stale writes fail closed', () => {
  const initial = createRunState('run-invalid', 'change-invalid');
  const registered = registerDurableTask(initial, { taskId: 'a', taskDigest: taskDigestA, owner: 'worker-a' });
  assert.throws(() => registerDurableTask(registered, { taskId: 'a', taskDigest: taskDigestA, owner: 'worker-b' }), /duplicate task identity/);
  assert.throws(() => transitionDurableTask(registered, 'a', 'succeeded', ['fake']), /invalid task transition/);
  assert.throws(() => transitionDurableTask(registered, 'a', 'running', [], undefined, initial.stateDigest), /stale state transition/);
  const running = transitionDurableTask(registered, 'a', 'running');
  assert.throws(() => transitionDurableTask(running, 'a', 'succeeded'), /requires evidence references/);
  assert.throws(() => setMaintenanceContext(running, { triggerId: '', recursionDepth: -1, coveredTriggerIds: [] }), /trigger identity/);
});

test('phase receipts resume from the exact durable checkpoint boundary', () => {
  let state = createRunState('run-boundary', 'change-boundary');
  state = registerDurableTask(state, { taskId: 'a', taskDigest: taskDigestA, owner: 'worker-a' }, '2026-11-25T02:00:00.000Z');
  state = transitionRun(state, 'estate-inventory', { inventory: { entries: ['repo'] } }, '2026-11-25T02:01:00.000Z');
  assert.doesNotThrow(() => verifyRunState(state));
  state = setMaintenanceContext(state, { triggerId: 'docs:revision-a', recursionDepth: 1, coveredTriggerIds: [] }, '2026-11-25T02:02:00.000Z');
  state = transitionRun(state, 'research', { research: ['primary-source'] }, '2026-11-25T02:03:00.000Z');
  assert.doesNotThrow(() => verifyRunState(state));
});

test('tampered ownership, dispatch identity, readiness, and checkpoints are rejected', () => {
  const registered = registerDurableTask(createRunState('run-tamper', 'change-tamper'), { taskId: 'a', taskDigest: taskDigestA, owner: 'worker-a' });
  for (const mutate of [
    (state: typeof registered) => { state.taskStates[0].owner = ''; },
    (state: typeof registered) => { state.taskStates[0].dispatchId = digest('forged'); },
    (state: typeof registered) => { state.taskStates[0].dependencyReadiness = 'blocked'; },
    (state: typeof registered) => { state.checkpoints[0].action = 'forged'; },
  ]) {
    const tampered = structuredClone(registered);
    mutate(tampered);
    assert.throws(() => verifyRunState(tampered));
  }
});

test('orchestration schema requires the durable state families', () => {
  const schema = JSON.parse(readFileSync(join(rootPath(), 'schemas', 'orchestration-run.schema.json'), 'utf8'));
  const state = createRunState('run-schema-durable', 'change-schema-durable');
  assert.deepEqual(validateSchemaInstance(schema, state), []);
  const missing = structuredClone(state) as Record<string, unknown>;
  delete missing.checkpoints;
  assert.ok(validateSchemaInstance(schema, missing).some((error) => error.includes('checkpoints: required')));
  for (const definition of ['durableTaskState', 'atomicCheckpoint', 'maintenanceContext']) assert.ok(schema.$defs[definition]);
});

function rootPath(): string {
  return join(import.meta.dirname, '..');
}
