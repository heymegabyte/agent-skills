import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import type { AssumptionLedgerEntry } from './prompt-hydrator.ts';
import type { ImprovementPhaseState } from './recursive-improvement.ts';

export type LearningKind = 'general-procedure' | 'project-fact' | 'preference';
export type LearningScope = 'global' | 'project' | 'request';
export interface LearningCandidate {
  id: string; kind: LearningKind; key: string; value: string; scope: LearningScope; projectId?: string;
  explicit: boolean; confidence: number; provenanceIds: string[]; sourceRevision: string;
  privacy: 'public' | 'private' | 'secret'; assumptionId?: string; improvementCandidateId?: string;
}
export interface LearningRecord extends LearningCandidate {
  destination: 'canonical-skill' | 'project-doc' | 'scoped-preference-store';
  revision: number; priorRevision: number | null; recordedAt: string; digest: string;
}
export interface LearningStore { schemaVersion: 1; records: LearningRecord[]; stateDigest: string }

const canonical = (value: unknown): string => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object' ? `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}` : JSON.stringify(value);
const digest = (value: unknown): string => `sha256:${createHash('sha256').update(canonical(value)).digest('hex')}`;
const storeDigest = (store: Omit<LearningStore, 'stateDigest'> | LearningStore): string => {
  const { stateDigest: _ignored, ...payload } = store as LearningStore; return digest(payload);
};
const SECRET_VALUE = /(?:\b(?:password|secret|token|api[-_]?key|private[-_]?key)\s*[=:]\s*\S+|\bgh[pousr]_[A-Za-z0-9_]{20,}\b|\bsk-(?:live|test|proj)-[A-Za-z0-9_-]{16,}\b|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i;
const PRIVATE_CONTEXT = /\b(?:private conversation|medical record|health record|ssn|social security number|credit card number|private message|confidential transcript)\b/i;

export function createLearningStore(): LearningStore { const payload = { schemaVersion: 1 as const, records: [] }; return { ...payload, stateDigest: storeDigest(payload) }; }
export function verifyLearningStore(store: LearningStore): void {
  if (storeDigest(store) !== store.stateDigest) throw new Error('learning store digest mismatch');
  const identities = new Set<string>();
  for (const record of store.records) {
    const identity = `${record.destination}\0${record.scope}\0${record.projectId ?? ''}\0${record.key}\0${record.revision}`;
    if (identities.has(identity)) throw new Error('duplicate learning revision'); identities.add(identity);
    if (record.digest !== digest({ ...record, digest: undefined })) throw new Error(`learning record digest mismatch: ${record.id}`);
  }
}
function destination(candidate: LearningCandidate): LearningRecord['destination'] {
  if (candidate.kind === 'general-procedure') return 'canonical-skill';
  if (candidate.kind === 'project-fact') return 'project-doc';
  return 'scoped-preference-store';
}
function validateCandidate(candidate: LearningCandidate): void {
  if (!candidate.id.trim() || !candidate.key.trim() || !candidate.value.trim() || !candidate.provenanceIds.length) throw new Error('learning requires identity, value, and provenance');
  if (!/^[a-f0-9]{40}$/.test(candidate.sourceRevision)) throw new Error('learning requires an exact source revision');
  if (candidate.privacy !== 'public' || SECRET_VALUE.test(candidate.value) || PRIVATE_CONTEXT.test(candidate.value)) throw new Error('secrets and private context cannot enter learning stores');
  if (!candidate.explicit && candidate.confidence < .7) throw new Error('inferred learning is below the persistence confidence floor');
  if (candidate.kind === 'project-fact' && (!candidate.projectId || candidate.scope !== 'project')) throw new Error('project facts require project scope and identity');
  if (candidate.kind === 'general-procedure' && candidate.scope !== 'global') throw new Error('general procedures belong to canonical global skills');
  if (candidate.scope === 'project' && !candidate.projectId) throw new Error('project-scoped learning requires project identity');
}
export function applyScopedLearning(store: LearningStore, candidate: LearningCandidate, options: { recordedAt: string; expectedRevision?: number } ): { store: LearningStore; record: LearningRecord } {
  verifyLearningStore(store); validateCandidate(candidate);
  const target = destination(candidate);
  const matching = store.records.filter((record) => record.destination === target && record.scope === candidate.scope && record.projectId === candidate.projectId && record.key === candidate.key);
  const current = matching.at(-1);
  if (options.expectedRevision !== undefined && options.expectedRevision !== (current?.revision ?? 0)) throw new Error('learning revision conflict');
  const revision = (current?.revision ?? 0) + 1;
  const payload = { ...structuredClone(candidate), destination: target, revision, priorRevision: current?.revision ?? null, recordedAt: options.recordedAt };
  const record: LearningRecord = { ...payload, digest: digest({ ...payload, digest: undefined }) };
  const nextPayload = { schemaVersion: 1 as const, records: [...store.records, record] };
  return { record, store: { ...nextPayload, stateDigest: storeDigest(nextPayload) } };
}
export function saveLearningStore(path: string, store: LearningStore): void { verifyLearningStore(store); mkdirSync(dirname(path), { recursive: true }); const temporary = `${path}.${process.pid}.tmp`; writeFileSync(temporary, `${JSON.stringify(store, null, 2)}\n`); renameSync(temporary, path); }
export function loadLearningStore(path: string): LearningStore { const store = JSON.parse(readFileSync(path, 'utf8')) as LearningStore; verifyLearningStore(store); return store; }

export function learningCandidatesFromAssumptions(entries: readonly AssumptionLedgerEntry[], context: { projectId: string; sourceRevision: string }): LearningCandidate[] {
  return entries.filter((entry) => entry.resolutionState === 'resolved' || (entry.resolutionState === 'accepted-for-progress' && entry.progressAllowed && entry.confidence >= .7)).map((entry) => ({
    id: `LEARNING-${entry.id}`, kind: 'project-fact', key: `assumption:${entry.id}`, value: entry.assumption, scope: 'project', projectId: context.projectId,
    explicit: entry.resolutionState === 'resolved', confidence: entry.confidence, provenanceIds: entry.evidenceIds, sourceRevision: context.sourceRevision, privacy: 'public', assumptionId: entry.id,
  }));
}
export function learningCandidatesFromImprovements(state: ImprovementPhaseState): LearningCandidate[] {
  return state.rankedCandidates.filter((candidate) => candidate.disposition === 'accepted').map((candidate) => ({
    id: `LEARNING-${candidate.id}`, kind: 'project-fact', key: `improvement:${candidate.id}`, value: candidate.summary, scope: 'project', projectId: state.changeId, explicit: false,
    confidence: candidate.confidence, provenanceIds: [...candidate.evidenceIds, ...candidate.authority.evidenceIds], sourceRevision: state.sourceRevision, privacy: 'public', improvementCandidateId: candidate.id,
  }));
}
