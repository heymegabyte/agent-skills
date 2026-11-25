import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';

const root = join(import.meta.dirname, '..');
const schema = JSON.parse(readFileSync(join(root, 'schemas/product-completeness-review.schema.json'), 'utf8'));
const receipt = JSON.parse(readFileSync(join(root, 'openspec/changes/operational-prompt-hydration-workflow/evidence/task-10.4-product-completeness-review.json'), 'utf8'));

test('task 10.4 product/completeness review covers every requirement and task without false PASS', () => {
  assert.deepEqual(validateSchemaInstance(schema, receipt), []);
  assert.equal(receipt.requirementAssessments.length, 28);
  const statuses = receipt.requirementAssessments.reduce((counts: Record<string, number>, item: { status: string }) => ({ ...counts, [item.status]: (counts[item.status] ?? 0) + 1 }), {});
  assert.deepEqual(statuses, { pass: 19, fail: 5, blocked: 2, partial: 2 });
  const taskIds = receipt.taskAssessmentGroups.flatMap((group: { taskIds: string[] }) => group.taskIds);
  assert.equal(taskIds.length, 56);
  assert.equal(new Set(taskIds).size, 56);
  assert.equal(receipt.verdict.status, 'FAIL_ACTION_REQUIRED');
  assert.equal(receipt.verdict.archiveReady, false);
  assert.match(receipt.reviewer.signatureDigest, /^sha256:[a-f0-9]{64}$/);
  const signed = [receipt.reviewer.identity, receipt.reviewer.signedAt, receipt.evidenceSnapshot.reviewInputDigest].join('|');
  assert.equal(receipt.reviewer.signatureDigest, `sha256:${createHash('sha256').update(signed).digest('hex')}`);
  assert.ok(receipt.findings.some((finding: { id: string }) => finding.id === 'PC-001'));
  assert.ok(receipt.findings.some((finding: { id: string }) => finding.id === 'PC-006'));
});

