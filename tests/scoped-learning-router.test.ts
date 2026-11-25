import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { createRunState } from '../bin/orchestration-run-state.ts';
import {
  applyScopedLearning, createLearningStore, learningCandidatesFromAssumptions,
  learningCandidatesFromImprovements, loadLearningStore, saveLearningStore, type LearningCandidate,
} from '../bin/scoped-learning-router.ts';
import { evaluateImprovementPhase, type DurableImprovementCandidate } from '../bin/recursive-improvement.ts';

const fixture = JSON.parse(readFileSync(new URL('../fixtures/prompt-hydration/operational-contract/scoped-learning.json', import.meta.url), 'utf8')) as {
  sourceRevision: string; recordedAt: string; candidates: Array<Omit<LearningCandidate, 'sourceRevision'>>;
};
const candidate = (index: number): LearningCandidate => ({ ...fixture.candidates[index], sourceRevision: fixture.sourceRevision });
const improvements = JSON.parse(readFileSync(new URL('../fixtures/orchestration/improvement-phase/candidates.json', import.meta.url), 'utf8')) as { runId: string; runStateDigest: string; changeId: string; sourceRevision: string; evaluatedAt: string; policy: { confidenceFloor: number; valueFloor: number; maxCost: number; maxWip: number }; candidates: DurableImprovementCandidate[] };

describe('scoped learning router', () => {
  it('routes procedures, project facts, and preferences to distinct destinations', () => {
    let store = createLearningStore();
    const destinations: string[] = [];
    for (let index = 0; index < fixture.candidates.length; index += 1) {
      const result = applyScopedLearning(store, candidate(index), { recordedAt: fixture.recordedAt }); store = result.store; destinations.push(result.record.destination);
    }
    assert.deepEqual(destinations, ['canonical-skill', 'project-doc', 'scoped-preference-store']);
  });

  it('applies a scoped correction only to its exact destination, scope, project, and key', () => {
    let store = createLearningStore();
    for (let index = 0; index < fixture.candidates.length; index += 1) store = applyScopedLearning(store, candidate(index), { recordedAt: fixture.recordedAt }).store;
    const before = structuredClone(store.records);
    const correction = { ...candidate(2), value: 'Keep Google, GitHub, and magic-link sign-in together.', provenanceIds: ['EVIDENCE:SCOPED-CORRECTION'] };
    const result = applyScopedLearning(store, correction, { recordedAt: '2026-11-25T16:05:00.000Z', expectedRevision: 1 });
    assert.equal(result.record.revision, 2); assert.equal(result.record.priorRevision, 1);
    assert.deepEqual(result.store.records.filter((record) => record.key !== correction.key), before.filter((record) => record.key !== correction.key));
    assert.equal(result.store.records.filter((record) => record.key === correction.key).length, 2);
    assert.throws(() => applyScopedLearning(result.store, { ...correction, projectId: 'other-project' }, { recordedAt: fixture.recordedAt, expectedRevision: 1 }), /revision conflict/);
  });

  it('rejects secrets, private context, and low-confidence inference', () => {
    const store = createLearningStore();
    assert.throws(() => applyScopedLearning(store, { ...candidate(2), value: 'api_key=sk-live-abcdefghijklmnop' }, { recordedAt: fixture.recordedAt }), /secrets and private context/);
    assert.throws(() => applyScopedLearning(store, { ...candidate(2), value: 'Private conversation transcript', privacy: 'private' }, { recordedAt: fixture.recordedAt }), /secrets and private context/);
    assert.throws(() => applyScopedLearning(store, { ...candidate(2), explicit: false, confidence: .5 }, { recordedAt: fixture.recordedAt }), /confidence floor/);
  });

  it('persists revisioned provenance and promotes only eligible assumptions', () => {
    const run = createRunState('learning-run', 'learning-change', [{ id: 'accepted', assumption: 'The project retains its taxonomy.', confidence: .8, reversibility: 'reversible', basis: 'repository evidence', consequence: 'routing remains stable', resolutionState: 'accepted-for-progress', correctionScope: 'project', progressAllowed: true, evidenceIds: ['EVIDENCE:TAXONOMY'] }, { id: 'unresolved', assumption: 'Maybe replace the taxonomy.', confidence: .4, reversibility: 'costly', basis: 'speculation', consequence: 'large migration', resolutionState: 'unresolved', correctionScope: 'project', progressAllowed: false, evidenceIds: ['EVIDENCE:SPECULATION'] }]);
    const candidates = learningCandidatesFromAssumptions(run.assumptionLedger, { projectId: 'megabyte-space', sourceRevision: fixture.sourceRevision });
    assert.deepEqual(candidates.map(({ assumptionId }) => assumptionId), ['accepted']);
    const stored = applyScopedLearning(createLearningStore(), candidates[0], { recordedAt: fixture.recordedAt }).store;
    const path = join(mkdtempSync(join(tmpdir(), 'scoped-learning-')), 'store.json'); saveLearningStore(path, stored);
    const loaded = loadLearningStore(path); assert.deepEqual(loaded.records[0].provenanceIds, ['EVIDENCE:TAXONOMY']); assert.equal(loaded.records[0].revision, 1);
  });

  it('hands accepted improvements to project learning without promoting rejected ideas globally', () => {
    const candidates = learningCandidatesFromImprovements(evaluateImprovementPhase(improvements));
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].kind, 'project-fact'); assert.equal(candidates[0].scope, 'project'); assert.equal(candidates[0].projectId, improvements.changeId);
    assert.ok(candidates[0].provenanceIds.includes('EVIDENCE:RETRY-GAP'));
  });
});
