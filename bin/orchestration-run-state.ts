import { createHash } from 'node:crypto';
import { closeSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import type { AssumptionLedgerEntry } from './prompt-hydrator.ts';
import { planConcurrentResponsibilities, type ConcurrentResponsibilityPlan } from './documentation-learning-responsibilities.ts';
export { recordGitIntegration } from './git-reconciliation.ts';

export const RUN_PHASES = ['intake', 'estate-inventory', 'research', 'saturation-gate', 'independent-briefs', 'heterogeneous-conference', 'architecture-fixed-point', 'architect-assignment', 'openspec-compilation', 'contract-freeze', 'swarm-execution', 'integration', 'adversarial-verification', 'complete'] as const;
export type RunPhase = typeof RUN_PHASES[number];

export type DurableTaskStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'blocked';
export type DependencyReadiness = 'ready' | 'waiting' | 'blocked';
export interface DurableTaskState {
  taskId: string;
  taskDigest: string;
  dispatchId: string;
  owner: string;
  dependsOn: string[];
  dependencyReadiness: DependencyReadiness;
  status: DurableTaskStatus;
  evidenceRefs: string[];
}
export type MaintenanceKind = 'maintenance' | 'learning' | 'triad-sync' | 'improvement' | 'prompt-hook' | 'run';
export interface MaintenanceContext { kind: MaintenanceKind; evidenceRevision: string; triggerId: string; recursionDepth: number; coveredTriggerIds: string[] }
export type WriterLeaseStatus = 'active' | 'released' | 'recovered';
export interface IntegrationWriterLease {
  leaseId: string;
  repository: string;
  holderRunId: string;
  generation: number;
  acquiredAt: string;
  heartbeatAt: string;
  expiresAt: string;
  status: WriterLeaseStatus;
}
export type WriterLeaseReceiptKind = 'claim' | 'collision' | 'heartbeat' | 'release' | 'recovery';
export interface IntegrationWriterLeaseReceipt {
  receiptId: string;
  kind: WriterLeaseReceiptKind;
  repository: string;
  claimantRunId: string;
  holderRunId: string;
  leaseId: string;
  generation: number;
  recordedAt: string;
}
export interface WorkerBrief {
  dispatchId: string; taskId: string; taskDigest: string; objective: string; owner: string;
  ownedPaths: string[]; acceptance: string[]; evidenceRefs: string[];
  concurrentResponsibilities: ConcurrentResponsibilityPlan;
}
export interface DispatchExecution {
  dispatchId: string; taskId: string; taskDigest: string; workerId: string; attempt: number;
  status: 'running' | 'completed' | 'stalled' | 'failed'; brief: WorkerBrief;
  assignedAt: string; lastHeartbeatAt: string; completedReceiptRef?: string;
}
export interface ExternalDeliveryEdge {
  edgeId: string; sourceCommit: string; package: string; publishedVersion: string | null; consumer: string;
  status: 'blocked' | 'ready'; nextAction: 'observe-published-version' | 'verify-consumer-adoption'; resumable: true; evidenceRefs: string[];
}
export interface AtomicCheckpoint {
  checkpointId: string;
  priorCheckpointId: string | null;
  action: string;
  phase: RunPhase;
  taskStateDigest: string;
  maintenanceDigest: string;
  evidenceRefs: string[];
  taskStates: DurableTaskState[];
  maintenance: MaintenanceContext;
  evidenceReferences: string[];
  integrationWriterLeases: IntegrationWriterLease[];
  integrationWriterLeaseReceipts: IntegrationWriterLeaseReceipt[];
  dispatchExecutions: DispatchExecution[];
  externalDeliveryEdges: ExternalDeliveryEdge[];
  recordedAt: string;
}

export interface PhaseReceipt { receiptId: string; runId: string; sequence: number; fromPhase: RunPhase; toPhase: RunPhase; priorStateDigest: string; inputDigest: string; stateDigest: string; recordedAt: string }
export interface RunState { schemaVersion: 1; runId: string; changeId: string; phase: RunPhase; sequence: number; stateDigest: string; receipts: PhaseReceipt[]; phaseEvidence: Partial<Record<RunPhase, { inputDigest: string; recordedAt: string }>>; assumptionLedger: AssumptionLedgerEntry[]; evidence: unknown[]; evidenceReferences: string[]; providerInvocations: unknown[]; architectAssignments: unknown[]; deliberations: unknown[]; taskGraph: { digest: string; nodes: unknown[] }; taskStates: DurableTaskState[]; checkpoints: AtomicCheckpoint[]; maintenance: MaintenanceContext; integrationWriterLeases: IntegrationWriterLease[]; integrationWriterLeaseReceipts: IntegrationWriterLeaseReceipt[]; dispatchExecutions: DispatchExecution[]; externalDeliveryEdges: ExternalDeliveryEdge[]; nodeExecutions: unknown[]; integrations: unknown[]; blockers: unknown[] }

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value);
}

export function digest(value: unknown): string { return `sha256:${createHash('sha256').update(canonical(value)).digest('hex')}`; }
function statePayload(state: Omit<RunState, 'stateDigest'> | RunState): unknown {
  const { stateDigest: _stateDigest, ...rest } = state as RunState;
  return { ...rest, receipts: rest.receipts.map(({ stateDigest: _receiptStateDigest, ...receipt }) => receipt) };
}

export function createRunState(runId: string, changeId: string, assumptionLedger: AssumptionLedgerEntry[] = []): RunState {
  if (!runId.trim() || !changeId.trim()) throw new Error('runId and changeId are required');
  validateAssumptionLedger(assumptionLedger);
  const state = { schemaVersion: 1 as const, runId, changeId, phase: 'intake' as const, sequence: 0, receipts: [], phaseEvidence: {}, assumptionLedger: structuredClone(assumptionLedger), evidence: [], evidenceReferences: [], providerInvocations: [], architectAssignments: [], deliberations: [], taskGraph: { digest: digest([]), nodes: [] }, taskStates: [], checkpoints: [], maintenance: { kind: 'run' as const, evidenceRevision: changeId, triggerId: `run:${runId}`, recursionDepth: 0, coveredTriggerIds: [] }, integrationWriterLeases: [], integrationWriterLeaseReceipts: [], dispatchExecutions: [], externalDeliveryEdges: [], nodeExecutions: [], integrations: [], blockers: [] };
  return { ...state, stateDigest: digest(statePayload(state)) };
}

export function validateAssumptionLedger(entries: AssumptionLedgerEntry[]): void {
  for (const entry of entries) {
    if (!entry.id?.trim() || !entry.assumption?.trim() || !entry.basis?.trim() || !entry.consequence?.trim()) throw new Error('assumption ledger entries require identity, assumption, basis, and consequence');
    if (!Number.isFinite(entry.confidence) || entry.confidence < 0 || entry.confidence > 1) throw new Error(`invalid assumption confidence: ${entry.id}`);
    const mayProceed = entry.resolutionState === 'resolved'
      || (entry.resolutionState === 'accepted-for-progress' && entry.reversibility === 'reversible' && entry.confidence >= 0.7);
    if (entry.progressAllowed !== mayProceed) throw new Error(`assumption progress disposition is inconsistent: ${entry.id}`);
    if (!entry.evidenceIds.length) throw new Error(`assumption evidence is required: ${entry.id}`);
  }
}

export function assumptionsPermitProgress(entries: AssumptionLedgerEntry[]): boolean {
  validateAssumptionLedger(entries);
  return entries.every((entry) => entry.progressAllowed || entry.resolutionState !== 'unresolved');
}

export function verifyRunState(state: RunState): void {
  validateAssumptionLedger(state.assumptionLedger);
  verifyDurableState(state);
  if (digest(statePayload(state)) !== state.stateDigest) throw new Error('state digest mismatch');
  if (state.sequence !== state.receipts.length) throw new Error('receipt sequence mismatch');
  let prior = createRunState(state.runId, state.changeId, state.assumptionLedger);
  for (const receipt of state.receipts) {
    if (receipt.priorStateDigest !== prior.stateDigest) {
      const applicable = state.checkpoints.filter((item) => item.phase === prior.phase && item.recordedAt <= receipt.recordedAt);
      const boundary = applicable.at(-1);
      if (boundary) {
        const checkpointIndex = state.checkpoints.findIndex((item) => item.checkpointId === boundary.checkpointId);
        const hydrated = {
          ...prior,
          taskStates: structuredClone(boundary.taskStates),
          maintenance: structuredClone(boundary.maintenance),
          evidenceReferences: [...boundary.evidenceReferences],
          integrationWriterLeases: structuredClone(boundary.integrationWriterLeases),
          integrationWriterLeaseReceipts: structuredClone(boundary.integrationWriterLeaseReceipts),
          dispatchExecutions: structuredClone(boundary.dispatchExecutions),
          externalDeliveryEdges: structuredClone(boundary.externalDeliveryEdges),
          checkpoints: structuredClone(state.checkpoints.slice(0, checkpointIndex + 1)),
        };
        prior = { ...hydrated, stateDigest: digest(statePayload(hydrated)) };
      }
    }
    if (receipt.runId !== state.runId || receipt.sequence !== prior.sequence + 1 || receipt.fromPhase !== prior.phase || receipt.priorStateDigest !== prior.stateDigest) throw new Error('invalid receipt chain');
    const expected = RUN_PHASES[RUN_PHASES.indexOf(prior.phase) + 1];
    if (receipt.toPhase !== expected) throw new Error('non-monotonic phase transition');
    const receiptPayload = { runId: receipt.runId, sequence: receipt.sequence, fromPhase: receipt.fromPhase, toPhase: receipt.toPhase, priorStateDigest: receipt.priorStateDigest, inputDigest: receipt.inputDigest, recordedAt: receipt.recordedAt };
    if (digest(receiptPayload) !== receipt.receiptId) throw new Error('receipt digest mismatch');
    const advanced = {
      ...prior,
      phase: receipt.toPhase,
      sequence: receipt.sequence,
      phaseEvidence: { ...prior.phaseEvidence, [receipt.toPhase]: { inputDigest: receipt.inputDigest, recordedAt: receipt.recordedAt } },
      receipts: [...prior.receipts, receipt],
      stateDigest: receipt.stateDigest,
    };
    if (digest(statePayload(advanced)) !== receipt.stateDigest) throw new Error('receipt state digest mismatch');
    prior = advanced;
  }
  if (prior.phase !== state.phase) throw new Error('phase does not match receipt chain');
}

function requireDigest(value: string, label: string): void {
  if (!/^sha256:[0-9a-f]{64}$/.test(value)) throw new Error(`${label} must be a SHA-256 digest`);
}

export function stableDispatchId(runId: string, taskId: string, taskDigest: string): string {
  if (!runId.trim() || !taskId.trim()) throw new Error('runId and taskId are required for dispatch identity');
  requireDigest(taskDigest, 'taskDigest');
  return digest({ runId, taskId, taskDigest });
}

function readiness(task: DurableTaskState, tasks: DurableTaskState[]): DependencyReadiness {
  const dependencies = task.dependsOn.map((id) => tasks.find((candidate) => candidate.taskId === id));
  if (dependencies.some((dependency) => dependency?.status === 'failed' || dependency?.status === 'blocked')) return 'blocked';
  if (dependencies.some((dependency) => !dependency || dependency.status !== 'succeeded')) return 'waiting';
  return 'ready';
}

function withReadiness(tasks: DurableTaskState[]): DurableTaskState[] {
  return tasks.map((task) => ({ ...task, dependencyReadiness: readiness(task, tasks) }));
}

function checkpoint(state: RunState, action: string, recordedAt: string, evidenceRefs: string[]): RunState {
  const priorCheckpointId = state.checkpoints.at(-1)?.checkpointId ?? null;
  const payload = {
    priorCheckpointId,
    action,
    phase: state.phase,
    taskStateDigest: digest(state.taskStates),
    maintenanceDigest: digest(state.maintenance),
    evidenceRefs: [...evidenceRefs],
    taskStates: structuredClone(state.taskStates),
    maintenance: structuredClone(state.maintenance),
    evidenceReferences: [...state.evidenceReferences],
    integrationWriterLeases: structuredClone(state.integrationWriterLeases),
    integrationWriterLeaseReceipts: structuredClone(state.integrationWriterLeaseReceipts),
    dispatchExecutions: structuredClone(state.dispatchExecutions),
    externalDeliveryEdges: structuredClone(state.externalDeliveryEdges),
    recordedAt,
  };
  const next = { ...state, checkpoints: [...state.checkpoints, { ...payload, checkpointId: digest(payload) }] };
  return { ...next, stateDigest: digest(statePayload(next)) };
}

function externalDeliveryEdgeId(input: { sourceCommit: string; package: string; consumer: string }): string {
  return digest({ edge: 'release-to-consumer', sourceCommit: input.sourceCommit, package: input.package, consumer: input.consumer });
}

export function recordExternalDeliveryEdgeInRun(state: RunState, input: { sourceCommit: string; package: string; publishedVersion: string | null; consumer: string; evidenceRefs?: string[]; recordedAt?: string }, expectedStateDigest = state.stateDigest): { state: RunState; edge: ExternalDeliveryEdge; disposition: 'recorded' | 'existing' } {
  verifyRunState(state);
  if (expectedStateDigest !== state.stateDigest) throw new Error('stale state transition');
  if (!/^[a-f0-9]{40}$/.test(input.sourceCommit) || !input.package.trim() || !input.consumer.trim()) throw new Error('external delivery edge requires exact source commit, package, and consumer');
  const edgeId = externalDeliveryEdgeId(input);
  const expected: ExternalDeliveryEdge = { edgeId, sourceCommit: input.sourceCommit, package: input.package, publishedVersion: input.publishedVersion, consumer: input.consumer, status: input.publishedVersion ? 'ready' : 'blocked', nextAction: input.publishedVersion ? 'verify-consumer-adoption' : 'observe-published-version', resumable: true, evidenceRefs: [...new Set(input.evidenceRefs ?? [])] };
  const existing = state.externalDeliveryEdges.find((edge) => edge.edgeId === edgeId);
  if (existing) {
    if (existing.publishedVersion !== expected.publishedVersion) throw new Error('external delivery edge update requires an explicit evidence-bearing transition');
    return { state, edge: existing, disposition: 'existing' };
  }
  const next = { ...state, externalDeliveryEdges: [...state.externalDeliveryEdges, expected], evidenceReferences: [...new Set([...state.evidenceReferences, ...expected.evidenceRefs])] };
  const checked = checkpoint({ ...next, stateDigest: digest(statePayload(next)) }, `external-delivery-edge:${edgeId}`, input.recordedAt ?? new Date().toISOString(), expected.evidenceRefs);
  return { state: checked, edge: expected, disposition: 'recorded' };
}

export function recordExternalDeliveryEdge(input: { sourceCommit: string; package: string; publishedVersion: string | null; consumer: string }): { status: 'blocked' | 'ready'; nextAction: 'observe-published-version' | 'verify-consumer-adoption'; resumable: true } {
  const state = createRunState(`external-edge:${digest(input).slice(-12)}`, 'controlled-external-delivery');
  const { edge } = recordExternalDeliveryEdgeInRun(state, { ...input, recordedAt: '1970-01-01T00:00:00.000Z' });
  return { status: edge.status, nextAction: edge.nextAction, resumable: edge.resumable };
}

export function registerDurableTask(
  state: RunState,
  input: { taskId: string; taskDigest: string; owner: string; dependsOn?: string[]; evidenceRefs?: string[] },
  recordedAt = new Date().toISOString(),
  expectedStateDigest = state.stateDigest,
): RunState {
  verifyRunState(state);
  if (expectedStateDigest !== state.stateDigest) throw new Error('stale state transition');
  if (!input.taskId.trim() || !input.owner.trim()) throw new Error('task identity and owner are required');
  requireDigest(input.taskDigest, 'taskDigest');
  if (state.taskStates.some((task) => task.taskId === input.taskId)) throw new Error(`duplicate task identity: ${input.taskId}`);
  const dependsOn = [...new Set(input.dependsOn ?? [])];
  if (dependsOn.includes(input.taskId)) throw new Error('task cannot depend on itself');
  const evidenceRefs = [...new Set(input.evidenceRefs ?? [])];
  const task: DurableTaskState = {
    taskId: input.taskId,
    taskDigest: input.taskDigest,
    dispatchId: stableDispatchId(state.runId, input.taskId, input.taskDigest),
    owner: input.owner,
    dependsOn,
    dependencyReadiness: 'waiting',
    status: 'pending',
    evidenceRefs,
  };
  const tasks = withReadiness([...state.taskStates, task]);
  const next = { ...state, taskStates: tasks, evidenceReferences: [...new Set([...state.evidenceReferences, ...evidenceRefs])] };
  return checkpoint({ ...next, stateDigest: digest(statePayload(next)) }, `register-task:${input.taskId}`, recordedAt, evidenceRefs);
}

const TASK_TRANSITIONS: Record<DurableTaskStatus, DurableTaskStatus[]> = {
  pending: ['running', 'blocked'],
  running: ['succeeded', 'failed', 'blocked'],
  succeeded: [],
  failed: [],
  blocked: [],
};

export function transitionDurableTask(
  state: RunState,
  taskId: string,
  status: DurableTaskStatus,
  evidenceRefs: string[] = [],
  recordedAt = new Date().toISOString(),
  expectedStateDigest = state.stateDigest,
): RunState {
  verifyRunState(state);
  if (expectedStateDigest !== state.stateDigest) throw new Error('stale state transition');
  const current = state.taskStates.find((task) => task.taskId === taskId);
  if (!current) throw new Error(`unknown task: ${taskId}`);
  if (!TASK_TRANSITIONS[current.status].includes(status)) throw new Error(`invalid task transition: ${current.status} -> ${status}`);
  if (status === 'running' && current.dependencyReadiness !== 'ready') throw new Error(`task dependencies are not ready: ${taskId}`);
  const refs = [...new Set(evidenceRefs)];
  if (status === 'succeeded' && refs.length === 0) throw new Error('succeeded task requires evidence references');
  const tasks = withReadiness(state.taskStates.map((task) => task.taskId === taskId
    ? { ...task, status, evidenceRefs: [...new Set([...task.evidenceRefs, ...refs])] }
    : task));
  const next = { ...state, taskStates: tasks, evidenceReferences: [...new Set([...state.evidenceReferences, ...refs])] };
  return checkpoint({ ...next, stateDigest: digest(statePayload(next)) }, `task-transition:${taskId}:${status}`, recordedAt, refs);
}

export function setMaintenanceContext(
  state: RunState,
  maintenance: Omit<MaintenanceContext, 'kind' | 'evidenceRevision'> & Partial<Pick<MaintenanceContext, 'kind' | 'evidenceRevision'>>,
  recordedAt = new Date().toISOString(),
  expectedStateDigest = state.stateDigest,
): RunState {
  verifyRunState(state);
  if (expectedStateDigest !== state.stateDigest) throw new Error('stale state transition');
  if (!maintenance.triggerId.trim()) throw new Error('maintenance trigger identity is required');
  if (!Number.isInteger(maintenance.recursionDepth) || maintenance.recursionDepth < 0) throw new Error('maintenance recursion depth must be a non-negative integer');
  const inferredKind = maintenance.triggerId.split(':', 1)[0] as MaintenanceKind;
  const kind = maintenance.kind ?? (['maintenance', 'learning', 'triad-sync', 'improvement', 'prompt-hook'].includes(inferredKind) ? inferredKind : 'maintenance');
  const evidenceRevision = maintenance.evidenceRevision?.trim() || (maintenance.triggerId.includes(':') ? maintenance.triggerId.slice(maintenance.triggerId.indexOf(':') + 1) : 'unversioned');
  const normalized: MaintenanceContext = { ...maintenance, kind, evidenceRevision, coveredTriggerIds: [...new Set(maintenance.coveredTriggerIds)] };
  const next = { ...state, maintenance: normalized };
  return checkpoint({ ...next, stateDigest: digest(statePayload(next)) }, `maintenance:${normalized.triggerId}`, recordedAt, []);
}

export function admitMaintenanceInRun(state: RunState, input: { kind: Exclude<MaintenanceKind, 'run'>; evidenceRevision: string; triggerId: string; recursionDepth: number; seenTriggerIds?: string[] }, recordedAt = new Date().toISOString()): { state: RunState; admitted: boolean; reason: 'admitted' | 'equivalent-trigger-covered' | 'recursion-depth-exceeded' } {
  verifyRunState(state);
  if (!input.triggerId.trim() || !input.evidenceRevision.trim()) throw new Error('maintenance trigger and evidence revision are required');
  const identity = `${input.kind}@${input.evidenceRevision}#${input.triggerId}`;
  const seen = new Set([...(input.seenTriggerIds ?? []), ...state.maintenance.coveredTriggerIds]);
  if (input.recursionDepth > 4) return { state, admitted: false, reason: 'recursion-depth-exceeded' };
  if (seen.has(identity) || seen.has(input.triggerId)) {
    const suppressed = setMaintenanceContext(state, { kind: input.kind, evidenceRevision: input.evidenceRevision, triggerId: input.triggerId, recursionDepth: input.recursionDepth, coveredTriggerIds: [...seen, identity] }, recordedAt);
    return { state: suppressed, admitted: false, reason: 'equivalent-trigger-covered' };
  }
  const admitted = setMaintenanceContext(state, { kind: input.kind, evidenceRevision: input.evidenceRevision, triggerId: input.triggerId, recursionDepth: input.recursionDepth, coveredTriggerIds: [...seen, identity] }, recordedAt);
  return { state: admitted, admitted: true, reason: 'admitted' };
}

export function admitMaintenanceTrigger(input: { triggerId: string; recursionDepth: number; seenTriggerIds: string[]; kind?: Exclude<MaintenanceKind, 'run'>; evidenceRevision?: string }): { admitted: boolean; reason: string } {
  const kind = input.kind ?? ((input.triggerId.split(':', 1)[0] || 'maintenance') as Exclude<MaintenanceKind, 'run'>);
  const evidenceRevision = input.evidenceRevision ?? (input.triggerId.includes(':') ? input.triggerId.slice(input.triggerId.indexOf(':') + 1) : 'unversioned');
  const identity = `${kind}@${evidenceRevision}#${input.triggerId}`;
  if (input.recursionDepth > 4) return { admitted: false, reason: 'recursion-depth-exceeded' };
  if (input.seenTriggerIds.includes(input.triggerId) || input.seenTriggerIds.includes(identity)) return { admitted: false, reason: 'equivalent-trigger-covered' };
  return { admitted: true, reason: 'admitted' };
}

function leaseTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO date-time`);
  return parsed;
}

function writerLeaseId(repository: string, holderRunId: string, generation: number, acquiredAt: string): string {
  return digest({ repository, holderRunId, generation, acquiredAt });
}

function writerLeaseReceipt(input: Omit<IntegrationWriterLeaseReceipt, 'receiptId'>): IntegrationWriterLeaseReceipt {
  return { ...input, receiptId: digest(input) };
}

function checkpointLeaseMutation(state: RunState, action: string, recordedAt: string): RunState {
  const next = { ...state, stateDigest: digest(statePayload(state)) };
  return checkpoint(next, action, recordedAt, []);
}

export interface WriterLeaseMutationResult {
  state: RunState;
  granted: boolean;
  disposition: 'granted' | 'existing-holder' | 'collision-waiting' | 'recovered-expired';
  lease: IntegrationWriterLease;
  receipt: IntegrationWriterLeaseReceipt;
}

export function claimRepositoryIntegrationWriterLease(
  state: RunState,
  input: { repository: string; claimantRunId: string; now: string; ttlMs: number },
  expectedStateDigest = state.stateDigest,
): WriterLeaseMutationResult {
  verifyRunState(state);
  if (expectedStateDigest !== state.stateDigest) throw new Error('stale state transition');
  if (!input.repository.trim() || !input.claimantRunId.trim()) throw new Error('repository and claimant are required');
  const nowMs = leaseTimestamp(input.now, 'lease claim time');
  if (!Number.isInteger(input.ttlMs) || input.ttlMs <= 0) throw new Error('lease ttl must be a positive integer');
  const active = state.integrationWriterLeases.find((lease) => lease.repository === input.repository && lease.status === 'active');
  if (active && Date.parse(active.expiresAt) > nowMs) {
    const kind: WriterLeaseReceiptKind = active.holderRunId === input.claimantRunId ? 'heartbeat' : 'collision';
    const receipt = writerLeaseReceipt({ kind, repository: input.repository, claimantRunId: input.claimantRunId, holderRunId: active.holderRunId, leaseId: active.leaseId, generation: active.generation, recordedAt: input.now });
    if (kind === 'collision') {
      const collisionState = { ...state, integrationWriterLeaseReceipts: [...state.integrationWriterLeaseReceipts, receipt] };
      return { state: checkpointLeaseMutation(collisionState, `writer-collision:${input.repository}:${input.claimantRunId}`, input.now), granted: false, disposition: 'collision-waiting', lease: active, receipt };
    }
    return { state, granted: true, disposition: 'existing-holder', lease: active, receipt };
  }

  const generation = (state.integrationWriterLeases.filter((lease) => lease.repository === input.repository).at(-1)?.generation ?? 0) + 1;
  let leases = state.integrationWriterLeases;
  let receipts = state.integrationWriterLeaseReceipts;
  let disposition: WriterLeaseMutationResult['disposition'] = 'granted';
  if (active) {
    const recovered = { ...active, status: 'recovered' as const };
    leases = leases.map((lease) => lease.leaseId === active.leaseId ? recovered : lease);
    const recovery = writerLeaseReceipt({ kind: 'recovery', repository: input.repository, claimantRunId: input.claimantRunId, holderRunId: active.holderRunId, leaseId: active.leaseId, generation: active.generation, recordedAt: input.now });
    receipts = [...receipts, recovery];
    disposition = 'recovered-expired';
  }
  const expiresAt = new Date(nowMs + input.ttlMs).toISOString();
  const lease: IntegrationWriterLease = {
    leaseId: writerLeaseId(input.repository, input.claimantRunId, generation, input.now), repository: input.repository,
    holderRunId: input.claimantRunId, generation, acquiredAt: input.now, heartbeatAt: input.now, expiresAt, status: 'active',
  };
  const receipt = writerLeaseReceipt({ kind: 'claim', repository: input.repository, claimantRunId: input.claimantRunId, holderRunId: input.claimantRunId, leaseId: lease.leaseId, generation, recordedAt: input.now });
  const claimed = { ...state, integrationWriterLeases: [...leases, lease], integrationWriterLeaseReceipts: [...receipts, receipt] };
  return { state: checkpointLeaseMutation(claimed, `writer-claim:${input.repository}:${input.claimantRunId}`, input.now), granted: true, disposition, lease, receipt };
}

export function heartbeatRepositoryIntegrationWriterLease(
  state: RunState,
  input: { repository: string; holderRunId: string; now: string; ttlMs: number },
  expectedStateDigest = state.stateDigest,
): RunState {
  verifyRunState(state);
  if (expectedStateDigest !== state.stateDigest) throw new Error('stale state transition');
  const nowMs = leaseTimestamp(input.now, 'lease heartbeat time');
  if (!Number.isInteger(input.ttlMs) || input.ttlMs <= 0) throw new Error('lease ttl must be a positive integer');
  const active = state.integrationWriterLeases.find((lease) => lease.repository === input.repository && lease.status === 'active');
  if (!active || active.holderRunId !== input.holderRunId) throw new Error('integration writer lease is not held by claimant');
  if (Date.parse(active.expiresAt) <= nowMs) throw new Error('integration writer lease has expired');
  const renewed = { ...active, heartbeatAt: input.now, expiresAt: new Date(nowMs + input.ttlMs).toISOString() };
  const receipt = writerLeaseReceipt({ kind: 'heartbeat', repository: input.repository, claimantRunId: input.holderRunId, holderRunId: input.holderRunId, leaseId: active.leaseId, generation: active.generation, recordedAt: input.now });
  const next = { ...state, integrationWriterLeases: state.integrationWriterLeases.map((lease) => lease.leaseId === active.leaseId ? renewed : lease), integrationWriterLeaseReceipts: [...state.integrationWriterLeaseReceipts, receipt] };
  return checkpointLeaseMutation(next, `writer-heartbeat:${input.repository}:${input.holderRunId}`, input.now);
}

export function releaseRepositoryIntegrationWriterLease(
  state: RunState,
  input: { repository: string; holderRunId: string; now: string },
  expectedStateDigest = state.stateDigest,
): RunState {
  verifyRunState(state);
  if (expectedStateDigest !== state.stateDigest) throw new Error('stale state transition');
  leaseTimestamp(input.now, 'lease release time');
  const active = state.integrationWriterLeases.find((lease) => lease.repository === input.repository && lease.status === 'active');
  if (!active || active.holderRunId !== input.holderRunId) throw new Error('integration writer lease is not held by claimant');
  const released = { ...active, status: 'released' as const };
  const receipt = writerLeaseReceipt({ kind: 'release', repository: input.repository, claimantRunId: input.holderRunId, holderRunId: input.holderRunId, leaseId: active.leaseId, generation: active.generation, recordedAt: input.now });
  const next = { ...state, integrationWriterLeases: state.integrationWriterLeases.map((lease) => lease.leaseId === active.leaseId ? released : lease), integrationWriterLeaseReceipts: [...state.integrationWriterLeaseReceipts, receipt] };
  return checkpointLeaseMutation(next, `writer-release:${input.repository}:${input.holderRunId}`, input.now);
}

export function claimIntegrationWriterLease(input: { repository: string; claimants: string[]; now: string }): { granted: number; waiting: number; collisionReceipt: IntegrationWriterLeaseReceipt | null } {
  let state = createRunState(`lease-fixture:${digest(input).slice(-12)}`, 'controlled-competing-writers');
  let granted = 0;
  let waiting = 0;
  let collisionReceipt: IntegrationWriterLeaseReceipt | null = null;
  for (const claimantRunId of input.claimants) {
    const result = claimRepositoryIntegrationWriterLease(state, { repository: input.repository, claimantRunId, now: input.now, ttlMs: 60_000 });
    state = result.state;
    if (result.granted && result.disposition !== 'existing-holder') granted += 1;
    if (!result.granted) { waiting += 1; collisionReceipt = result.receipt; }
  }
  return { granted, waiting, collisionReceipt };
}

function withRunStateLock<T>(path: string, mutation: (state: RunState) => { state: RunState; result: T }): T {
  const lockPath = `${path}.writer-lease.lock`;
  let descriptor: number;
  try {
    descriptor = openSync(lockPath, 'wx', 0o600);
  } catch {
    throw new Error(`integration writer state lock is already held: ${lockPath}`);
  }
  try {
    const mutated = mutation(loadRunState(path));
    saveRunState(path, mutated.state);
    return mutated.result;
  } finally {
    closeSync(descriptor);
    unlinkSync(lockPath);
  }
}

export function claimRepositoryIntegrationWriterLeaseAtPath(path: string, input: { repository: string; claimantRunId: string; now: string; ttlMs: number }): WriterLeaseMutationResult {
  return withRunStateLock(path, (state) => {
    const result = claimRepositoryIntegrationWriterLease(state, input);
    return { state: result.state, result };
  });
}

export function heartbeatRepositoryIntegrationWriterLeaseAtPath(path: string, input: { repository: string; holderRunId: string; now: string; ttlMs: number }): RunState {
  return withRunStateLock(path, (state) => {
    const next = heartbeatRepositoryIntegrationWriterLease(state, input);
    return { state: next, result: next };
  });
}

export function releaseRepositoryIntegrationWriterLeaseAtPath(path: string, input: { repository: string; holderRunId: string; now: string }): RunState {
  return withRunStateLock(path, (state) => {
    const next = releaseRepositoryIntegrationWriterLease(state, input);
    return { state: next, result: next };
  });
}

const CENTRAL_PATH_PATTERNS = [
  /(^|\/)schemas\//, /(^|\/)(?:package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/,
  /(^|\/)\.changeset\//, /(^|\/)releases?\//, /(^|\/)release(?:\.|-|\/)/, /(^|\/)\.github\/workflows\//,
];
export function requiresCentralOwnership(path: string): boolean { return CENTRAL_PATH_PATTERNS.some((pattern) => pattern.test(path)); }

export interface DispatchMutationResult { state: RunState; launched: boolean; disposition: 'launched' | 'existing-execution' | 'completed-receipt-reused'; execution: DispatchExecution }
export interface ReadyTaskDispatchInput {
  taskId: string; taskDigest: string; workerId: string; centralOwner: string; objective: string;
  ownedPaths: string[]; acceptance: string[]; evidenceRefs?: string[]; now: string; maxBriefBytes?: number;
  behavioralChange?: boolean; documentationPaths?: string[]; learningScope?: string;
}

export function dispatchReadyTaskInRun(state: RunState, input: ReadyTaskDispatchInput, expectedStateDigest = state.stateDigest): DispatchMutationResult {
  verifyRunState(state);
  if (expectedStateDigest !== state.stateDigest) throw new Error('stale state transition');
  leaseTimestamp(input.now, 'dispatch time');
  const task = state.taskStates.find((candidate) => candidate.taskId === input.taskId);
  if (!task || task.taskDigest !== input.taskDigest) throw new Error('dispatch task identity or digest mismatch');
  const existing = [...state.dispatchExecutions].reverse().find((execution) => execution.dispatchId === task.dispatchId);
  if (existing?.status === 'completed') return { state, launched: false, disposition: 'completed-receipt-reused', execution: existing };
  if (existing?.status === 'running') return { state, launched: false, disposition: 'existing-execution', execution: existing };
  if (task.status !== 'pending' || task.dependencyReadiness !== 'ready') throw new Error('task is not ready for dispatch');
  if (input.ownedPaths.some(requiresCentralOwnership) && input.workerId !== input.centralOwner) throw new Error('central integration owner is required for shared schema, lockfile, workflow, or release paths');
  const brief: WorkerBrief = { dispatchId: task.dispatchId, taskId: task.taskId, taskDigest: task.taskDigest, objective: input.objective.trim(), owner: task.owner, ownedPaths: [...new Set(input.ownedPaths)], acceptance: [...input.acceptance], evidenceRefs: [...new Set(input.evidenceRefs ?? [])], concurrentResponsibilities: planConcurrentResponsibilities({ affectedPaths: input.ownedPaths, behavioralChange: input.behavioralChange, documentationPaths: input.documentationPaths, learningScope: input.learningScope }) };
  if (!brief.objective || !brief.ownedPaths.length || !brief.acceptance.length) throw new Error('bounded worker brief requires objective, owned paths, and acceptance');
  if (Buffer.byteLength(JSON.stringify(brief)) > (input.maxBriefBytes ?? 16_384)) throw new Error('worker brief exceeds configured byte bound');
  const attempt = Math.max(0, ...state.dispatchExecutions.filter((execution) => execution.dispatchId === task.dispatchId).map((execution) => execution.attempt)) + 1;
  const execution: DispatchExecution = { dispatchId: task.dispatchId, taskId: task.taskId, taskDigest: task.taskDigest, workerId: input.workerId, attempt, status: 'running', brief, assignedAt: input.now, lastHeartbeatAt: input.now };
  const tasks = withReadiness(state.taskStates.map((candidate) => candidate.taskId === task.taskId ? { ...candidate, status: 'running' as const } : candidate));
  const next = { ...state, taskStates: tasks, dispatchExecutions: [...state.dispatchExecutions, execution] };
  const checked = checkpoint({ ...next, stateDigest: digest(statePayload(next)) }, `dispatch:${task.dispatchId}:${attempt}`, input.now, brief.evidenceRefs);
  return { state: checked, launched: true, disposition: 'launched', execution };
}

export function completeTaskDispatch(state: RunState, input: { dispatchId: string; workerId: string; receiptRef: string; documentationReceiptRef?: string; learningReceiptRef?: string; now: string }, expectedStateDigest = state.stateDigest): RunState {
  verifyRunState(state);
  if (expectedStateDigest !== state.stateDigest) throw new Error('stale state transition');
  if (!input.receiptRef.trim()) throw new Error('completed dispatch requires a receipt reference');
  const index = state.dispatchExecutions.findLastIndex((execution) => execution.dispatchId === input.dispatchId);
  const current = state.dispatchExecutions[index];
  if (!current || current.status !== 'running' || current.workerId !== input.workerId) throw new Error('running dispatch is not held by worker');
  if (current.brief.concurrentResponsibilities.responsibilities.some((item) => item.kind === 'documentation' && item.applicability === 'required') && !input.documentationReceiptRef?.trim()) throw new Error('behavioral task completion requires documentation receipt');
  if (current.brief.concurrentResponsibilities.responsibilities.some((item) => item.kind === 'learning' && item.applicability === 'required') && !input.learningReceiptRef?.trim()) throw new Error('behavioral task completion requires learning receipt');
  const executions = state.dispatchExecutions.map((execution, candidate) => candidate === index ? { ...execution, status: 'completed' as const, completedReceiptRef: input.receiptRef, lastHeartbeatAt: input.now } : execution);
  const completionRefs = [input.receiptRef, input.documentationReceiptRef, input.learningReceiptRef].filter((item): item is string => Boolean(item));
  const tasks = withReadiness(state.taskStates.map((task) => task.taskId === current.taskId ? { ...task, status: 'succeeded' as const, evidenceRefs: [...new Set([...task.evidenceRefs, ...completionRefs])] } : task));
  const next = { ...state, dispatchExecutions: executions, taskStates: tasks, evidenceReferences: [...new Set([...state.evidenceReferences, ...completionRefs])] };
  return checkpoint({ ...next, stateDigest: digest(statePayload(next)) }, `dispatch-complete:${input.dispatchId}`, input.now, completionRefs);
}

export function reassignStalledTaskDispatch(state: RunState, input: { dispatchId: string; newWorkerId: string; centralOwner: string; now: string; stallAfterMs: number }, expectedStateDigest = state.stateDigest): DispatchMutationResult {
  verifyRunState(state);
  if (expectedStateDigest !== state.stateDigest) throw new Error('stale state transition');
  const nowMs = leaseTimestamp(input.now, 'reassignment time');
  const index = state.dispatchExecutions.findLastIndex((execution) => execution.dispatchId === input.dispatchId);
  const current = state.dispatchExecutions[index];
  if (!current || current.status !== 'running') throw new Error('running dispatch is required for reassignment');
  if (!Number.isInteger(input.stallAfterMs) || input.stallAfterMs <= 0 || nowMs - Date.parse(current.lastHeartbeatAt) < input.stallAfterMs) throw new Error('dispatch is not stalled');
  if (current.brief.ownedPaths.some(requiresCentralOwnership) && input.newWorkerId !== input.centralOwner) throw new Error('central integration owner is required for reassignment');
  const stalled = state.dispatchExecutions.map((execution, candidate) => candidate === index ? { ...execution, status: 'stalled' as const } : execution);
  const execution: DispatchExecution = { ...current, workerId: input.newWorkerId, attempt: current.attempt + 1, status: 'running', assignedAt: input.now, lastHeartbeatAt: input.now, completedReceiptRef: undefined };
  const next = { ...state, dispatchExecutions: [...stalled, execution] };
  return { state: checkpoint({ ...next, stateDigest: digest(statePayload(next)) }, `dispatch-reassign:${input.dispatchId}:${execution.attempt}`, input.now, []), launched: true, disposition: 'launched', execution };
}

const CONTROLLED_DISPATCHES = new Set<string>();
export function dispatchReadyTask(input: { runId: string; taskId: string; taskDigest: string }): { launched: boolean; disposition: 'launched' | 'existing-execution' } {
  const dispatchId = stableDispatchId(input.runId, input.taskId, input.taskDigest);
  if (CONTROLLED_DISPATCHES.has(dispatchId)) return { launched: false, disposition: 'existing-execution' };
  CONTROLLED_DISPATCHES.add(dispatchId);
  return { launched: true, disposition: 'launched' };
}

export interface ExactResumeResult {
  state: RunState;
  reused: string[];
  launched: string[];
  inFlight: string[];
  preservedBlocked: string[];
  restoredLeases: string[];
  recoverableLeases: string[];
}

export function resumeRunFromCheckpoint(state: RunState, input: {
  expectedStateDigest: string;
  expectedCheckpointId: string;
  now: string;
  stallAfterMs: number;
  centralOwner: string;
  readyBriefs?: ReadyTaskDispatchInput[];
  reassignmentWorkers?: Record<string, string>;
  blockedExternalEdges?: string[];
}): ExactResumeResult {
  verifyRunState(state);
  if (input.expectedStateDigest !== state.stateDigest) throw new Error('resume state digest mismatch');
  const checkpointId = state.checkpoints.at(-1)?.checkpointId;
  if (!checkpointId || checkpointId !== input.expectedCheckpointId) throw new Error('resume checkpoint digest mismatch');
  const nowMs = leaseTimestamp(input.now, 'resume time');
  if (!Number.isInteger(input.stallAfterMs) || input.stallAfterMs <= 0) throw new Error('resume stall threshold must be positive');
  let next = state;
  const reused: string[] = [];
  const launched: string[] = [];
  const inFlight: string[] = [];
  const preservedBlocked = [...new Set(input.blockedExternalEdges ?? [])];
  const restoredLeases = state.integrationWriterLeases.filter((lease) => lease.status === 'active' && Date.parse(lease.expiresAt) > nowMs).map((lease) => lease.leaseId);
  const recoverableLeases = state.integrationWriterLeases.filter((lease) => lease.status === 'active' && Date.parse(lease.expiresAt) <= nowMs).map((lease) => lease.leaseId);
  const briefs = new Map((input.readyBriefs ?? []).map((brief) => [brief.taskId, brief]));

  for (const task of state.taskStates) {
    const executions = next.dispatchExecutions.filter((execution) => execution.dispatchId === task.dispatchId);
    const latest = executions.at(-1);
    if (latest?.status === 'completed') {
      reused.push(latest.completedReceiptRef!);
      continue;
    }
    if (latest?.status === 'running') {
      if (nowMs - Date.parse(latest.lastHeartbeatAt) < input.stallAfterMs) {
        inFlight.push(latest.dispatchId);
        continue;
      }
      const newWorkerId = input.reassignmentWorkers?.[latest.dispatchId];
      if (!newWorkerId) {
        preservedBlocked.push(`stalled-without-reassignment:${latest.dispatchId}`);
        continue;
      }
      const reassigned = reassignStalledTaskDispatch(next, { dispatchId: latest.dispatchId, newWorkerId, centralOwner: input.centralOwner, now: input.now, stallAfterMs: input.stallAfterMs });
      next = reassigned.state;
      launched.push(reassigned.execution.dispatchId);
      continue;
    }
    if (task.status !== 'pending' || task.dependencyReadiness !== 'ready') {
      preservedBlocked.push(`not-ready:${task.dispatchId}`);
      continue;
    }
    const brief = briefs.get(task.taskId);
    if (!brief) {
      preservedBlocked.push(`missing-brief:${task.dispatchId}`);
      continue;
    }
    const dispatched = dispatchReadyTaskInRun(next, { ...brief, now: input.now });
    next = dispatched.state;
    if (dispatched.launched) launched.push(dispatched.execution.dispatchId);
  }
  return {
    state: next,
    reused: [...new Set(reused)],
    launched: [...new Set(launched)],
    inFlight: [...new Set(inFlight)],
    preservedBlocked: [...new Set(preservedBlocked)],
    restoredLeases,
    recoverableLeases,
  };
}

export function resumeReadyTasks(input: { completedDispatchIds: string[]; unfinishedReadyDispatchIds: string[]; blockedDispatchIds: string[] }): { reused: string[]; launched: string[]; preservedBlocked: string[] } {
  return { reused: [...input.completedDispatchIds], launched: [...input.unfinishedReadyDispatchIds], preservedBlocked: [...input.blockedDispatchIds] };
}

function verifyDurableState(state: RunState): void {
  if (!state.maintenance?.triggerId?.trim() || !state.maintenance.kind || !state.maintenance.evidenceRevision?.trim() || !Number.isInteger(state.maintenance.recursionDepth) || state.maintenance.recursionDepth < 0) throw new Error('invalid maintenance context');
  if (new Set(state.maintenance.coveredTriggerIds).size !== state.maintenance.coveredTriggerIds.length) throw new Error('duplicate covered maintenance trigger');
  const taskIds = new Set<string>();
  const dispatchIds = new Set<string>();
  for (const task of state.taskStates) {
    if (!task.taskId.trim() || !task.owner.trim()) throw new Error('invalid durable task identity or ownership');
    requireDigest(task.taskDigest, 'taskDigest');
    if (taskIds.has(task.taskId)) throw new Error('duplicate durable task identity');
    if (dispatchIds.has(task.dispatchId)) throw new Error('duplicate dispatch identity');
    taskIds.add(task.taskId); dispatchIds.add(task.dispatchId);
    if (task.dispatchId !== stableDispatchId(state.runId, task.taskId, task.taskDigest)) throw new Error('dispatch identity mismatch');
    if (new Set(task.dependsOn).size !== task.dependsOn.length || task.dependsOn.includes(task.taskId)) throw new Error('invalid task dependencies');
    if (task.dependencyReadiness !== readiness(task, state.taskStates)) throw new Error('dependency readiness mismatch');
    if (task.status === 'running' && task.dependencyReadiness !== 'ready') throw new Error('running task dependencies are not ready');
    if (task.status === 'succeeded' && task.evidenceRefs.length === 0) throw new Error('succeeded task has no evidence reference');
  }
  let priorCheckpointId: string | null = null;
  for (const item of state.checkpoints) {
    const { checkpointId, ...payload } = item;
    if (item.priorCheckpointId !== priorCheckpointId || checkpointId !== digest(payload)) throw new Error('invalid checkpoint chain');
    requireDigest(item.taskStateDigest, 'checkpoint taskStateDigest');
    requireDigest(item.maintenanceDigest, 'checkpoint maintenanceDigest');
    if (item.taskStateDigest !== digest(item.taskStates) || item.maintenanceDigest !== digest(item.maintenance)) throw new Error('checkpoint snapshot digest mismatch');
    priorCheckpointId = checkpointId;
  }
  const last = state.checkpoints.at(-1);
  if (last && (last.taskStateDigest !== digest(state.taskStates) || last.maintenanceDigest !== digest(state.maintenance)
    || digest(last.integrationWriterLeases) !== digest(state.integrationWriterLeases)
    || digest(last.integrationWriterLeaseReceipts) !== digest(state.integrationWriterLeaseReceipts)
    || digest(last.dispatchExecutions) !== digest(state.dispatchExecutions)
    || digest(last.externalDeliveryEdges) !== digest(state.externalDeliveryEdges))) throw new Error('checkpoint does not match current durable state');
  for (const reference of state.evidenceReferences) if (!reference.trim()) throw new Error('empty evidence reference');
  verifyWriterLeases(state);
  verifyDispatchExecutions(state);
  const edgeIds = new Set<string>();
  for (const edge of state.externalDeliveryEdges) {
    if (edge.edgeId !== externalDeliveryEdgeId(edge) || edgeIds.has(edge.edgeId) || !/^[a-f0-9]{40}$/.test(edge.sourceCommit) || !edge.package.trim() || !edge.consumer.trim()) throw new Error('invalid external delivery edge');
    if ((edge.publishedVersion === null) !== (edge.status === 'blocked' && edge.nextAction === 'observe-published-version')) throw new Error('external delivery edge state is inconsistent');
    edgeIds.add(edge.edgeId);
  }
}

function verifyDispatchExecutions(state: RunState): void {
  for (const execution of state.dispatchExecutions) {
    const task = state.taskStates.find((candidate) => candidate.taskId === execution.taskId);
    if (!task || execution.dispatchId !== task.dispatchId || execution.taskDigest !== task.taskDigest || execution.attempt < 1 || !execution.workerId.trim()) throw new Error('invalid dispatch execution identity');
    leaseTimestamp(execution.assignedAt, 'dispatch assignedAt'); leaseTimestamp(execution.lastHeartbeatAt, 'dispatch lastHeartbeatAt');
    if (execution.status === 'completed' && !execution.completedReceiptRef?.trim()) throw new Error('completed dispatch has no receipt');
    if (Buffer.byteLength(JSON.stringify(execution.brief)) > 16_384) throw new Error('persisted worker brief exceeds byte bound');
  }
  for (const dispatchId of new Set(state.dispatchExecutions.map((execution) => execution.dispatchId))) {
    const active = state.dispatchExecutions.filter((execution) => execution.dispatchId === dispatchId && execution.status === 'running');
    if (active.length > 1) throw new Error('duplicate active task dispatch');
  }
}

function verifyWriterLeases(state: RunState): void {
  const activeByRepository = new Set<string>();
  const leaseIds = new Set<string>();
  for (const lease of state.integrationWriterLeases) {
    if (!lease.repository.trim() || !lease.holderRunId.trim() || !Number.isInteger(lease.generation) || lease.generation < 1) throw new Error('invalid integration writer lease');
    leaseTimestamp(lease.acquiredAt, 'lease acquiredAt'); leaseTimestamp(lease.heartbeatAt, 'lease heartbeatAt'); leaseTimestamp(lease.expiresAt, 'lease expiresAt');
    if (lease.leaseId !== writerLeaseId(lease.repository, lease.holderRunId, lease.generation, lease.acquiredAt) || leaseIds.has(lease.leaseId)) throw new Error('invalid or duplicate integration writer lease identity');
    leaseIds.add(lease.leaseId);
    if (lease.status === 'active') {
      if (activeByRepository.has(lease.repository)) throw new Error('multiple active integration writers for repository');
      activeByRepository.add(lease.repository);
    }
  }
  for (const receipt of state.integrationWriterLeaseReceipts) {
    const { receiptId, ...payload } = receipt;
    if (receiptId !== digest(payload) || !leaseIds.has(receipt.leaseId)) throw new Error('invalid integration writer lease receipt');
  }
}

export function transitionRun(state: RunState, toPhase: RunPhase, input: unknown, recordedAt = new Date().toISOString(), expectedStateDigest = state.stateDigest): RunState {
  verifyRunState(state);
  if (expectedStateDigest !== state.stateDigest) throw new Error('stale state transition');
  const expected = RUN_PHASES[RUN_PHASES.indexOf(state.phase) + 1];
  if (toPhase !== expected) throw new Error(`expected transition to ${expected ?? 'no later phase'}`);
  assertPhaseEvidence(toPhase, input, state);
  const receiptPayload = { runId: state.runId, sequence: state.sequence + 1, fromPhase: state.phase, toPhase, priorStateDigest: state.stateDigest, inputDigest: digest(input), recordedAt };
  const receiptBase = { ...receiptPayload, receiptId: digest(receiptPayload) };
  const nextWithoutDigest = { ...state, phase: toPhase, sequence: state.sequence + 1, phaseEvidence: { ...state.phaseEvidence, [toPhase]: { inputDigest: receiptPayload.inputDigest, recordedAt } }, receipts: [...state.receipts, { ...receiptBase, stateDigest: '' }] };
  const nextDigest = digest(statePayload(nextWithoutDigest));
  const receipt = { ...receiptBase, stateDigest: nextDigest };
  return { ...nextWithoutDigest, receipts: [...state.receipts, receipt], stateDigest: nextDigest };
}

function assertPhaseEvidence(phase: RunPhase, value: unknown, state: RunState): void {
  const input = value && typeof value === 'object' ? value as Record<string, any> : {};
  const nonempty = (candidate: unknown) => Array.isArray(candidate) && candidate.length > 0;
  if (phase === 'estate-inventory' && !nonempty(input.inventory?.entries)) throw new Error('estate inventory evidence is required');
  if (phase === 'research' && !nonempty(input.research)) throw new Error('executed research receipts are required');
  if (phase === 'saturation-gate') {
    if (input.saturation?.ready !== true) throw new Error('saturation gate is not ready');
    if ((input.saturation.dispositions ?? []).some((row: any) => row.status === 'missing' || row.status === 'externally-blocked')) throw new Error('blocked saturation cannot advance to conference');
  }
  if (phase === 'independent-briefs') {
    const families = new Set((input.briefs ?? []).map((item: any) => item.family));
    if (families.size < 3) {
      const mode = input.execution?.mode;
      const supportedFallback = ['two-agent', 'combined-role', 'sequential-single-agent'].includes(mode);
      const responsibilities = new Set((input.execution?.assignments ?? []).map((item: any) => item.responsibility));
      const completeResponsibilities = ['lead-resolution', 'product-completeness', 'architecture-verification'].every((responsibility) => responsibilities.has(responsibility));
      const honestProvenance = mode === 'two-agent' ? input.execution?.independent === true : input.execution?.independent === false && Boolean(input.execution?.limitation?.trim());
      if (!supportedFallback || !completeResponsibilities || !honestProvenance || !(input.receipts ?? []).length) throw new Error('capability-limited briefs require complete responsibilities and honest provenance');
    }
  }
  if (phase === 'heterogeneous-conference') {
    if (!nonempty(input.conference?.participants)) throw new Error('conference receipt is required');
    if (input.conference.highRisk === true && input.conference.secondArchitect !== true) throw new Error('high-risk conference requires a second architect');
  }
  if (phase === 'architecture-fixed-point') {
    if (input.fixedPoint?.converged !== true) throw new Error('architecture fixed point has not converged');
    if ((input.fixedPoint.dissent ?? []).some((item: any) => !item.resolutionOwner || !item.providerReceipt)) throw new Error('material dissent lacks resolution ownership or provider receipt');
  }
  if (phase === 'architect-assignment' && !input.assignment?.receiptDigest && !input.assignment?.digest) throw new Error('architect assignment receipt is required');
  if (phase === 'openspec-compilation' && !nonempty(input.contract?.artifacts)) throw new Error('compiled OpenSpec artifacts are required');
  if (phase === 'contract-freeze' && !input.contract?.contractDigest) throw new Error('frozen contract receipt is required');
  if (phase === 'swarm-execution' && !nonempty(input.executions)) throw new Error('node execution receipts are required');
  if (phase === 'integration' && (!(input.executions ?? []).length || (input.executions ?? []).some((item: any) => item.status !== 'integrated'))) throw new Error('all node executions must be integrated');
  if (phase === 'adversarial-verification' && !nonempty(input.reviews)) throw new Error('adversarial review receipts are required');
  if (phase === 'complete') {
    const required = RUN_PHASES.slice(1, -1);
    if (required.some((item) => !state.phaseEvidence[item])) throw new Error('run cannot complete without every phase evidence receipt');
    if (state.blockers.length || input.complete !== true) throw new Error('run cannot complete with blockers or without an explicit completion receipt');
  }
}

export function saveRunState(path: string, state: RunState): void { verifyRunState(state); mkdirSync(dirname(path), { recursive: true }); const temporary = `${path}.${process.pid}.tmp`; writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 }); renameSync(temporary, path); }
export function loadRunState(path: string): RunState { const state = JSON.parse(readFileSync(path, 'utf8')) as RunState; verifyRunState(state); return state; }
