import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createRunState, digest, loadRunState, saveRunState, transitionRun, verifyRunState } from '../bin/orchestration-run-state.ts';
import { createArchitectAssignment, validateArchitectAssignment } from '../bin/validate-architect-assignment.ts';
import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';

test('orchestration schema declares every governed receipt family and closes architect families', () => {
  const schema = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'schemas', 'orchestration-run.schema.json'), 'utf8'));
  for (const definition of ['phaseReceipt', 'evidence', 'providerInvocation', 'architectAssignment', 'deliberation', 'taskGraph', 'nodeExecution', 'integration', 'blocker']) assert.ok(schema.$defs[definition], `missing ${definition}`);
  assert.deepEqual(schema.$defs.architectAssignment.properties.modelFamily.enum, ['claude', 'codex', 'gemini', 'antigravity']);
  assert.equal(schema.$defs.architectAssignment.additionalProperties, false);
  assert.equal(schema.additionalProperties, false);
});

test('orchestration schema accepts a positive run and rejects hostile fixtures', () => {
  const schema = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'schemas', 'orchestration-run.schema.json'), 'utf8'));
  const positive = createRunState('run-schema', 'change-schema');
  assert.deepEqual(validateSchemaInstance(schema, positive), []);
  const missingIdentity = structuredClone(positive) as Record<string, unknown>; delete missingIdentity.runId;
  assert.ok(validateSchemaInstance(schema, missingIdentity).some((error) => error.includes('runId: required')));
  assert.ok(validateSchemaInstance(schema, { ...positive, unexpectedAuthority: true }).some((error) => error.includes('additional property')));
  const hostileAssignment = { ...positive, architectAssignments: [{ assignmentId: 'fake', changeId: 'change-schema', architectId: 'worker', modelFamily: 'opencode-deepseek', assignedBy: 'self', authorityEvidence: 'label only', assignedAt: 'not-a-date', status: 'active', digest: 'fabricated' }] };
  const hostileErrors = validateSchemaInstance(schema, hostileAssignment);
  assert.ok(hostileErrors.some((error) => error.includes('modelFamily: enum')));
  assert.ok(hostileErrors.some((error) => error.includes('assignedAt: date-time')));
  assert.ok(hostileErrors.some((error) => error.includes('digest: pattern')));
});

test('persisted transitions are monotonic, digest-bound, and reload safely', () => {
  const initial = createRunState('run-1', 'change-1');
  const inventory = transitionRun(initial, 'estate-inventory', { inventory: { entries: ['repo'] } }, '2026-11-22T00:00:00.000Z');
  const research = transitionRun(inventory, 'research', { research: ['primary-source'] }, '2026-11-22T00:01:00.000Z');
  verifyRunState(research);
  const path = join(mkdtempSync(join(tmpdir(), 'orchestration-state-')), 'run.json');
  saveRunState(path, research);
  assert.deepEqual(loadRunState(path), research);
  assert.throws(() => transitionRun(initial, 'research', {}), /expected transition/);
  assert.throws(() => transitionRun(research, 'estate-inventory', {}), /expected transition/);
  assert.throws(() => transitionRun(research, 'saturation-gate', {}, undefined, inventory.stateDigest), /stale state/);
});

test('tampering, receipt replay, and mismatched run receipts fail closed', () => {
  const initial = createRunState('run-2', 'change-2');
  const inventory = transitionRun(initial, 'estate-inventory', { inventory: { entries: ['repo'] } }, '2026-11-22T00:00:00.000Z');
  const tampered = structuredClone(inventory);
  tampered.receipts[0].inputDigest = digest({ fabricated: true });
  assert.throws(() => verifyRunState(tampered), /state digest mismatch|receipt digest mismatch/);
  const replayed = structuredClone(inventory);
  replayed.receipts.push(replayed.receipts[0]); replayed.sequence = 2;
  replayed.stateDigest = digest({ fabricated: 'state' });
  assert.throws(() => verifyRunState(replayed), /state digest mismatch|invalid receipt chain/);
  const mismatch = structuredClone(inventory);
  mismatch.receipts[0].runId = 'another-run';
  assert.throws(() => verifyRunState(mismatch), /state digest mismatch|invalid receipt chain/);
  const forgedIntermediate = structuredClone(inventory);
  forgedIntermediate.receipts[0].stateDigest = digest({ forged: true });
  assert.throws(() => verifyRunState(forgedIntermediate), /receipt state digest mismatch/);
});

test('architect authority requires a change-bound digest receipt and rejects OpenCode or labels', () => {
  const authorityEvidence = 'User explicitly assigned Codex in conversation receipt turn-42.';
  const trusted = { source: 'host-user-message' as const, changeId: 'change-3', assignedBy: 'repository-owner', evidenceDigest: digest(authorityEvidence) };
  const valid = createArchitectAssignment({ assignmentId: 'assign-1', changeId: 'change-3', architectId: 'codex-architect', modelFamily: 'codex', assignedBy: 'repository-owner', authorityEvidence, assignedAt: '2026-11-22T00:00:00.000Z' }, trusted);
  assert.doesNotThrow(() => validateArchitectAssignment(valid, 'change-3', trusted));
  assert.throws(() => validateArchitectAssignment({ ...valid, modelFamily: 'opencode-deepseek' }, 'change-3', trusted), /ineligible/);
  assert.throws(() => validateArchitectAssignment({ ...valid, authorityEvidence: '' }, 'change-3', trusted), /explicit authority/);
  assert.throws(() => validateArchitectAssignment({ ...valid, digest: 'sha256:' + '0'.repeat(64) }, 'change-3', trusted), /digest mismatch/);
  assert.throws(() => validateArchitectAssignment(valid, 'other-change', trusted), /not bound/);
  assert.throws(() => validateArchitectAssignment(valid, 'change-3', { ...trusted, evidenceDigest: digest('forged') }), /trusted authority/);
  assert.throws(() => validateArchitectAssignment('**Architect Role:** assigned' as never, 'change-3', trusted), /receipt is required/);
});

test('empty or externally blocked phase evidence cannot reach completion', () => {
  const initial = createRunState('run-gates', 'change-gates');
  assert.throws(() => transitionRun(initial, 'estate-inventory', {}), /inventory evidence/);
  const inventory = transitionRun(initial, 'estate-inventory', { inventory: { entries: ['repo'] } });
  const research = transitionRun(inventory, 'research', { research: ['receipt'] });
  assert.throws(() => transitionRun(research, 'saturation-gate', { saturation: { ready: true, dispositions: [{ status: 'externally-blocked' }] } }), /blocked saturation/);
});
