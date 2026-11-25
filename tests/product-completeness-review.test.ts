import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';

const root = join(import.meta.dirname, '..');
const schema = JSON.parse(readFileSync(join(root, 'schemas/product-completeness-review.schema.json'), 'utf8'));
const receipt = JSON.parse(readFileSync(join(root, 'openspec/changes/operational-prompt-hydration-workflow/evidence/task-10.4-product-completeness-review.json'), 'utf8'));

test('task 10.4 final re-review proves all internal requirements and preserves only the external release edge', () => {
  assert.deepEqual(validateSchemaInstance(schema, receipt), []);
  assert.equal(receipt.requirementAssessments.length, 28);
  const statuses = receipt.requirementAssessments.reduce((counts: Record<string, number>, item: { status: string }) => ({ ...counts, [item.status]: (counts[item.status] ?? 0) + 1 }), {});
  assert.deepEqual(statuses, { pass: 26, blocked: 2 });
  const taskIds = receipt.taskAssessmentGroups.flatMap((group: { taskIds: string[] }) => group.taskIds);
  assert.equal(taskIds.length, 56);
  assert.equal(new Set(taskIds).size, 56);
  assert.equal(receipt.verdict.status, 'PASS_WITH_BLOCKED_EXTERNAL_EDGE');
  assert.equal(receipt.verdict.archiveReady, false);
  assert.equal(receipt.evidenceSnapshot.reviewedRevision, 'b57f593caa92835d166aa7024944582887bc4ed2');
  assert.equal(receipt.evidenceSnapshot.hostedCiRun.conclusion, 'success');
  assert.equal(receipt.traceAssessment.actualChangeLedgerPresent, true);
  assert.equal(receipt.traceAssessment.status, 'pass');
  assert.deepEqual(receipt.traceAssessment.reviewedLedger, {
    sourceRevision: 'b57f593caa92835d166aa7024944582887bc4ed2',
    records: 56,
    implementedVerifiedIntegrated: 49,
    verificationUnverified: 7,
    integrationPending: 7,
    remotePending: 7,
  });
  assert.equal(receipt.evidenceSnapshot.deliveryTraceDigest, 'sha256:5289b6aa930b9894b4550b26a6f951067fd346acf90055df52c3dfbccdf7f118');
  assert.match(receipt.reviewer.signatureDigest, /^sha256:[a-f0-9]{64}$/);
  const signed = [receipt.reviewer.identity, receipt.reviewer.signedAt, receipt.evidenceSnapshot.reviewInputDigest].join('|');
  assert.equal(receipt.reviewer.signatureDigest, `sha256:${createHash('sha256').update(signed).digest('hex')}`);
  assert.ok(!receipt.findings.some((finding: { id: string }) => finding.id === 'PC-001'));
  assert.ok(receipt.findings.some((finding: { id: string }) => finding.id === 'PC-006'));
  assert.ok(!receipt.findings.some((finding: { id: string }) => ['PC-002', 'PC-003', 'PC-004', 'PC-005'].includes(finding.id)));
});

