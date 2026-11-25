import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  claimIntegrationWriterLease,
  claimRepositoryIntegrationWriterLease,
  claimRepositoryIntegrationWriterLeaseAtPath,
  createRunState,
  heartbeatRepositoryIntegrationWriterLease,
  loadRunState,
  releaseRepositoryIntegrationWriterLease,
  saveRunState,
  transitionRun,
  verifyRunState,
} from '../bin/orchestration-run-state.ts';

const repository = 'heymegabyte/agent-skills';

test('exactly one claimant holds a repository lease and collision is attributable', () => {
  const initial = createRunState('coordinator', 'writer-leases');
  const first = claimRepositoryIntegrationWriterLease(initial, { repository, claimantRunId: 'run-a', now: '2026-11-25T10:00:00.000Z', ttlMs: 60_000 });
  assert.equal(first.granted, true);
  assert.equal(first.disposition, 'granted');
  const second = claimRepositoryIntegrationWriterLease(first.state, { repository, claimantRunId: 'run-b', now: '2026-11-25T10:00:01.000Z', ttlMs: 60_000 });
  assert.equal(second.granted, false);
  assert.equal(second.disposition, 'collision-waiting');
  assert.equal(second.receipt.kind, 'collision');
  assert.equal(second.receipt.claimantRunId, 'run-b');
  assert.equal(second.receipt.holderRunId, 'run-a');
  assert.equal(second.state.integrationWriterLeases.filter((lease) => lease.status === 'active').length, 1);
  assert.throws(() => claimRepositoryIntegrationWriterLease(second.state, { repository, claimantRunId: 'run-c', now: '2026-11-25T10:00:02.000Z', ttlMs: 60_000 }, initial.stateDigest), /stale state transition/);
});

test('holder heartbeat renews the lease and non-holder cannot heartbeat or release it', () => {
  const claimed = claimRepositoryIntegrationWriterLease(createRunState('coordinator-heartbeat', 'writer-leases'), { repository, claimantRunId: 'run-a', now: '2026-11-25T10:00:00.000Z', ttlMs: 10_000 });
  const renewed = heartbeatRepositoryIntegrationWriterLease(claimed.state, { repository, holderRunId: 'run-a', now: '2026-11-25T10:00:05.000Z', ttlMs: 20_000 });
  const lease = renewed.integrationWriterLeases.find((candidate) => candidate.status === 'active')!;
  assert.equal(lease.heartbeatAt, '2026-11-25T10:00:05.000Z');
  assert.equal(lease.expiresAt, '2026-11-25T10:00:25.000Z');
  assert.throws(() => heartbeatRepositoryIntegrationWriterLease(renewed, { repository, holderRunId: 'run-b', now: '2026-11-25T10:00:06.000Z', ttlMs: 20_000 }), /not held by claimant/);
  assert.throws(() => releaseRepositoryIntegrationWriterLease(renewed, { repository, holderRunId: 'run-b', now: '2026-11-25T10:00:06.000Z' }), /not held by claimant/);
});

test('expired lease recovers with a new generation and survives persistence', () => {
  const first = claimRepositoryIntegrationWriterLease(createRunState('coordinator-recovery', 'writer-leases'), { repository, claimantRunId: 'run-a', now: '2026-11-25T10:00:00.000Z', ttlMs: 5_000 });
  const recovered = claimRepositoryIntegrationWriterLease(first.state, { repository, claimantRunId: 'run-b', now: '2026-11-25T10:00:06.000Z', ttlMs: 10_000 });
  assert.equal(recovered.disposition, 'recovered-expired');
  assert.equal(recovered.lease.generation, 2);
  assert.equal(recovered.state.integrationWriterLeases.find((lease) => lease.holderRunId === 'run-a')?.status, 'recovered');
  assert.equal(recovered.state.integrationWriterLeaseReceipts.at(-2)?.kind, 'recovery');
  assert.equal(recovered.state.integrationWriterLeaseReceipts.at(-1)?.kind, 'claim');
  const released = releaseRepositoryIntegrationWriterLease(recovered.state, { repository, holderRunId: 'run-b', now: '2026-11-25T10:00:07.000Z' });
  assert.equal(released.integrationWriterLeases.filter((lease) => lease.status === 'active').length, 0);
  assert.equal(released.integrationWriterLeaseReceipts.at(-1)?.kind, 'release');

  const path = join(mkdtempSync(join(tmpdir(), 'writer-lease-state-')), 'run.json');
  saveRunState(path, released);
  const loaded = loadRunState(path);
  assert.deepEqual(loaded, released);
  assert.doesNotThrow(() => verifyRunState(loaded));
});

test('controlled competing-writer contract uses the production lease primitive', () => {
  const result = claimIntegrationWriterLease({ repository, claimants: ['run-a', 'run-b'], now: '2026-11-25T10:00:00.000Z' });
  assert.deepEqual({ granted: result.granted, waiting: result.waiting, collisionReceipt: Boolean(result.collisionReceipt) }, { granted: 1, waiting: 1, collisionReceipt: true });
});

test('lease checkpoints remain valid across orchestration phase transitions', () => {
  const claimed = claimRepositoryIntegrationWriterLease(createRunState('coordinator-phases', 'writer-leases'), { repository, claimantRunId: 'run-a', now: '2026-11-25T10:00:00.000Z', ttlMs: 60_000 });
  let state = transitionRun(claimed.state, 'estate-inventory', { inventory: { entries: ['repo'] } }, '2026-11-25T10:00:01.000Z');
  state = heartbeatRepositoryIntegrationWriterLease(state, { repository, holderRunId: 'run-a', now: '2026-11-25T10:00:02.000Z', ttlMs: 60_000 });
  state = transitionRun(state, 'research', { research: ['receipt'] }, '2026-11-25T10:00:03.000Z');
  assert.doesNotThrow(() => verifyRunState(state));
});

test('path-backed claims serialize through an exclusive state lock and atomic rename', () => {
  const path = join(mkdtempSync(join(tmpdir(), 'writer-lease-atomic-')), 'run.json');
  saveRunState(path, createRunState('coordinator-atomic', 'writer-leases'));
  const first = claimRepositoryIntegrationWriterLeaseAtPath(path, { repository, claimantRunId: 'run-a', now: '2026-11-25T10:00:00.000Z', ttlMs: 60_000 });
  const second = claimRepositoryIntegrationWriterLeaseAtPath(path, { repository, claimantRunId: 'run-b', now: '2026-11-25T10:00:01.000Z', ttlMs: 60_000 });
  assert.equal(first.granted, true);
  assert.equal(second.granted, false);
  const persisted = loadRunState(path);
  assert.equal(persisted.integrationWriterLeases.filter((lease) => lease.status === 'active').length, 1);
  assert.equal(persisted.integrationWriterLeaseReceipts.at(-1)?.kind, 'collision');
});
