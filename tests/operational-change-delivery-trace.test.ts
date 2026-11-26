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

test('operational change ledger covers all requirements and tasks with exact integrated evidence', () => {
  assert.deepEqual(validateDeliveryTraceInstance(schema, ledger), []);
  assert.equal(ledger.records.length, 56);
  assert.equal(new Set(ledger.records.map((record: any) => record.requirement.id)).size, 28);
  assert.equal(ledger.sourceRevision, 'b57f593caa92835d166aa7024944582887bc4ed2');
  assert.equal(ledger.records.some((record: any) => record.delivery.release.status === 'published'), false);
  assert.equal(ledger.records.some((record: any) => record.delivery.consumers.some((consumer: any) => consumer.status === 'adopted')), false);
  assert.equal(ledger.records.some((record: any) => record.delivery.production.status === 'observed'), false);
});

test('checked tasks use real paths, passing verification, and exact remote integration', () => {
  const taskText = readFileSync(join(root, 'openspec/changes/operational-prompt-hydration-workflow/tasks.md'), 'utf8');
  const checked = new Set([...taskText.matchAll(/^- \[x\] (\d+\.\d+) /gm)].map((match) => `TASK-${match[1]}`));
  assert.equal(checked.size, 52);
  for (const record of ledger.records.filter((item: any) => checked.has(item.task.id))) {
    assert.equal(record.implementation.state, 'implemented', record.task.id);
    assert.ok(record.implementation.codePaths.length > 0, record.task.id);
    assert.equal(record.implementation.codePaths.some((path: string) => path.includes('task-scopes/')), false, record.task.id);
    assert.equal(record.verification.status, 'pass', record.task.id);
    assert.ok(record.verification.receipts.length > 0, record.task.id);
    assert.equal(record.verification.receipts.every((receipt: any) => receipt.status === 'pass'), true, record.task.id);
    assert.equal(record.integration.status, 'integrated', record.task.id);
    const expected = record.task.id === 'TASK-8.2' ? '43e1cd10c3cc5bf0b76f06ddcdcd179e511a3295' : record.task.id === 'TASK-10.6' ? '6169d32967677d876488a2268004f8374c5d7f0a' : ['TASK-10.4', 'TASK-10.5'].includes(record.task.id) ? '04490ce5d118939a051b0c6fb51c786bec96c2f9' : 'b57f593caa92835d166aa7024944582887bc4ed2';
    assert.equal(record.integration.integratedCommit, expected, record.task.id);
    assert.equal(record.integration.testedTree, expected, record.task.id);
    assert.equal(record.integration.remote.status, 'observed-main', record.task.id);
    assert.equal(record.integration.remote.observedSha, expected, record.task.id);
  }
});

test('change trace is queryable and preserves only exact blocked and pending tasks', () => {
  assert.equal(queryDeliveryTrace(ledger, { taskId: 'TASK-8.3' }).length, 1);
  assert.equal(queryDeliveryTrace(ledger, { requirementId: 'REQ-OPH-12' }).length > 0, true);
  const release = queryDeliveryTrace(ledger, { taskId: 'TASK-8.3' })[0];
  assert.equal(release.delivery.release.status, 'blocked'); assert.equal(release.delivery.release.version, '1.0.1');
  for (const id of ['TASK-8.3', 'TASK-8.4', 'TASK-8.5', 'TASK-10.7']) {
    const record = queryDeliveryTrace(ledger, { taskId: id })[0];
    assert.equal(record.integration.status, 'pending', id);
    assert.equal(record.blockers[0].status, 'active', id);
  }
  for (const id of ['TASK-9.3', 'TASK-10.3']) {
    const record = queryDeliveryTrace(ledger, { taskId: id })[0];
    assert.equal(record.blockers.length, 0, id);
    assert.equal(record.verification.status, 'pass', id);
    assert.equal(record.integration.status, 'integrated', id);
  }
});

test('compiler output is reproducible and independent of the mutable review receipt', () => {
  assert.deepEqual(compileOperationalChangeTrace(root, ledger.sourceRevision, schema), ledger);
  assert.equal(JSON.stringify(ledger).includes('task-10.4-architecture-verification-codex.json'), false);
  assert.throws(() => compileOperationalChangeTrace(root, 'a'.repeat(40), schema), /must be integrated main/);
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
