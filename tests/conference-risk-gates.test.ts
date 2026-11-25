import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { classifyConferenceRisk, evaluateConferenceRiskGate, planConferenceCapabilities, type ConferenceRiskCategory, type Specialist } from '../bin/evidence-gated-deliberation.ts';

const fixture = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'orchestration', 'risk-gates.json'), 'utf8')) as {
  cases: Array<{ id: string; prompt: string; category: ConferenceRiskCategory }>;
};
const participants: Specialist[] = [
  { id: 'codex-architect', family: 'codex', expertise: ['security'], architectEligible: true },
  { id: 'claude-architect', family: 'claude', expertise: ['product'], architectEligible: true },
  { id: 'gemini-verifier', family: 'gemini', expertise: ['verification'], architectEligible: false },
];
const independentPlan = planConferenceCapabilities([
  { family: 'codex', available: true, slots: 1, evidence: 'codex-authenticated' },
  { family: 'claude', available: true, slots: 1, evidence: 'claude-authenticated' },
  { family: 'gemini', available: true, slots: 1, evidence: 'gemini-authenticated' },
], participants);

test('risk classification covers every protected conference category', () => {
  for (const scenario of fixture.cases) assert.ok(classifyConferenceRisk(scenario.prompt).includes(scenario.category), scenario.id);
});

test('protected work blocks without explicit scoped authority and attributable review', () => {
  for (const scenario of fixture.cases) {
    const missing = evaluateConferenceRiskGate(scenario.prompt, undefined, independentPlan);
    assert.equal(missing.decision, 'block');
    assert.ok(missing.blockers.some((blocker) => blocker.includes('authority')));
    const wrongScope = evaluateConferenceRiskGate(scenario.prompt, {
      authorized: true,
      authorityEvidence: 'receipt:owner-authority',
      grantedScopes: [],
      reviewerFamilies: ['codex', 'claude'],
      passed: true,
      evidence: ['review:one'],
    }, independentPlan);
    assert.equal(wrongScope.decision, 'block');
    assert.ok(wrongScope.blockers.some((blocker) => blocker.includes(scenario.category)));
  }
});

test('capability fallback cannot masquerade as independent high-risk verification', () => {
  const singlePlan = planConferenceCapabilities([{ family: 'codex', available: true, slots: 1, evidence: 'codex-only' }], [participants[0]]);
  const result = evaluateConferenceRiskGate('Change authentication security', {
    authorized: true,
    authorityEvidence: 'receipt:owner-authority',
    grantedScopes: ['auth-security'],
    reviewerFamilies: ['codex'],
    passed: true,
    evidence: ['review:codex-sequential'],
  }, singlePlan);
  assert.equal(result.decision, 'block');
  assert.match(result.blockers.join('; '), /independent verification/);
});

test('protected work proceeds only with exact authority scope and two-family review evidence', () => {
  const result = evaluateConferenceRiskGate('Change authentication security', {
    authorized: true,
    authorityEvidence: 'receipt:owner-authority',
    grantedScopes: ['auth-security'],
    reviewerFamilies: ['codex', 'claude'],
    passed: true,
    evidence: ['review:codex', 'review:claude'],
  }, independentPlan);
  assert.equal(result.decision, 'allow');
  assert.deepEqual(result.blockers, []);
  assert.equal(result.receiptId.length, 64);
});
