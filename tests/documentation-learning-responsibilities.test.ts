import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { issueConcurrentResponsibilityReceipt, planConcurrentResponsibilities, verifyConcurrentResponsibilityReceipts } from '../bin/documentation-learning-responsibilities.ts';
import { completeTaskDispatch, createRunState, digest, dispatchReadyTaskInRun, registerDurableTask } from '../bin/orchestration-run-state.ts';

const sourceRevision = '3333333333333333333333333333333333333333';
const receipt = (kind: 'documentation' | 'learning', status: 'updated' | 'verified-no-change' = 'updated') => issueConcurrentResponsibilityReceipt({ kind, status, targets: [kind === 'documentation' ? 'control-plane/RUNTIME.md' : 'project:control-plane'], evidenceIds: [`EVIDENCE:${kind.toUpperCase()}`], obsoleteGuidanceRemoved: status === 'updated' && kind === 'documentation' ? ['single-receipt completion guidance'] : [], rationale: status === 'updated' ? `${kind} synchronized with behavior` : `review found no ${kind} change`, sourceRevision, recordedAt: '2026-11-25T17:00:00.000Z' });

describe('concurrent documentation and learning responsibilities', () => {
  it('requires both typed receipts for behavioral changes', () => {
    const plan = planConcurrentResponsibilities({ affectedPaths: ['bin/runtime.ts'], documentationPaths: ['control-plane/RUNTIME.md'], learningScope: 'project:control-plane' });
    assert.equal(plan.responsibilities.every((item) => item.applicability === 'required'), true);
    assert.throws(() => verifyConcurrentResponsibilityReceipts(plan, [receipt('documentation')]), /missing learning receipt/);
    assert.doesNotThrow(() => verifyConcurrentResponsibilityReceipts(plan, [receipt('documentation'), receipt('learning')]));
  });

  it('allows explicit verified-no-change receipts but rejects blocked responsibilities', () => {
    const plan = planConcurrentResponsibilities({ affectedPaths: ['schemas/run.json'] });
    assert.doesNotThrow(() => verifyConcurrentResponsibilityReceipts(plan, [receipt('documentation', 'verified-no-change'), receipt('learning', 'verified-no-change')]));
    const blocked = issueConcurrentResponsibilityReceipt({ ...receipt('learning'), status: 'blocked', rationale: 'Learning destination unavailable', receiptDigest: undefined as never });
    assert.throws(() => verifyConcurrentResponsibilityReceipts(plan, [receipt('documentation'), blocked]), /is blocked/);
  });

  it('places concurrent responsibilities in worker briefs and prevents receipt-less completion', () => {
    const taskDigest = digest({ task: 'behavioral' });
    const registered = registerDurableTask(createRunState('run-doc-learning', 'doc-learning'), { taskId: 'behavioral', taskDigest, owner: 'worker' });
    const launched = dispatchReadyTaskInRun(registered, { taskId: 'behavioral', taskDigest, workerId: 'worker', centralOwner: 'integration-writer', objective: 'Change runtime behavior', ownedPaths: ['bin/runtime.ts'], documentationPaths: ['control-plane/RUNTIME.md'], learningScope: 'project:control-plane', acceptance: ['node --test'], now: '2026-11-25T17:00:00.000Z' });
    assert.equal(launched.execution.brief.concurrentResponsibilities.responsibilities.length, 2);
    assert.throws(() => completeTaskDispatch(launched.state, { dispatchId: launched.execution.dispatchId, workerId: 'worker', receiptRef: 'verify:pass', now: '2026-11-25T17:01:00.000Z' }), /documentation receipt/);
    assert.doesNotThrow(() => completeTaskDispatch(launched.state, { dispatchId: launched.execution.dispatchId, workerId: 'worker', receiptRef: 'verify:pass', documentationReceiptRef: receipt('documentation').receiptDigest, learningReceiptRef: receipt('learning').receiptDigest, now: '2026-11-25T17:01:00.000Z' }));
  });
});
