import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { compileOperationalChangeTrace } from '../bin/compile-operational-change-trace.ts';
import { createRunState, recordExternalDeliveryEdgeInRun, verifyRunState } from '../bin/orchestration-run-state.ts';
import { queryDeliveryTrace } from '../bin/openspec-delivery-compiler.ts';
import { validateDeliveryTraceInstance } from '../bin/validate-delivery-trace.ts';

const root = join(import.meta.dirname, '..');
const schema = JSON.parse(readFileSync(join(root, 'schemas/delivery-trace.schema.json'), 'utf8'));
const ledgerPath = join(root, 'openspec/changes/operational-prompt-hydration-workflow/delivery-trace.json');
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));

test('operational change ledger covers all requirements and tasks without fabricated closure', () => {
  assert.deepEqual(validateDeliveryTraceInstance(schema, ledger), []);
  assert.equal(ledger.records.length, 56);
  assert.equal(new Set(ledger.records.map((record: any) => record.requirement.id)).size, 28);
  assert.equal(ledger.records.some((record: any) => record.integration.status === 'integrated'), false);
  assert.equal(ledger.records.some((record: any) => record.delivery.release.status === 'published'), false);
  assert.equal(ledger.records.some((record: any) => record.delivery.consumers.some((consumer: any) => consumer.status === 'adopted')), false);
  assert.equal(ledger.records.some((record: any) => record.delivery.production.status === 'observed'), false);
});

test('change trace is queryable and preserves exact release and verification blockers', () => {
  assert.equal(queryDeliveryTrace(ledger, { taskId: 'TASK-8.3' }).length, 1);
  assert.equal(queryDeliveryTrace(ledger, { requirementId: 'REQ-OPH-12' }).length > 0, true);
  const release = queryDeliveryTrace(ledger, { taskId: 'TASK-8.3' })[0];
  assert.equal(release.delivery.release.status, 'blocked'); assert.equal(release.delivery.release.version, '1.0.1');
  for (const id of ['TASK-9.3', 'TASK-10.3', 'TASK-10.4']) assert.equal(queryDeliveryTrace(ledger, { taskId: id })[0].blockers[0].status, 'active');
});

test('checked boxes do not imply integrated delivery and compiler output is reproducible', () => {
  const checkedWithoutVerification = ledger.records.filter((record: any) => record.implementation.state === 'implemented' && record.verification.status !== 'pass');
  assert.ok(checkedWithoutVerification.length > 0);
  const revision = ledger.sourceRevision;
  assert.match(revision, /^[a-f0-9]{40}$/);
  assert.deepEqual(compileOperationalChangeTrace(root, revision, schema), ledger);
});

test('external delivery edge persists once and resumes idempotently', () => {
  const initial = createRunState('external-edge-test', 'operational-prompt-hydration-workflow');
  const input = { sourceCommit: 'a'.repeat(40), package: '@theme.tools/sdk', publishedVersion: null, consumer: 'fixture-consumer', evidenceRefs: ['EVIDENCE:task-8.3-blocked-release.json'], recordedAt: '2026-11-25T18:30:00.000Z' };
  const first = recordExternalDeliveryEdgeInRun(initial, input);
  const second = recordExternalDeliveryEdgeInRun(first.state, input);
  assert.equal(first.disposition, 'recorded'); assert.equal(second.disposition, 'existing');
  assert.equal(second.state.externalDeliveryEdges.length, 1); assert.equal(second.edge.nextAction, 'observe-published-version'); assert.equal(second.edge.resumable, true);
  assert.doesNotThrow(() => verifyRunState(second.state));
});
