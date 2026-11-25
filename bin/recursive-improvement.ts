import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { compileHydratedDeliveryScope, type CompiledDeliveryBundle, type HydratedDeliveryScope, type ScopeRequirement } from "./openspec-delivery-compiler.ts";
import type { RunState } from "./orchestration-run-state.ts";

export interface ImprovementCandidate {
  readonly title: string;
  readonly evidence: number;
  readonly expectedValue: number;
  readonly novelty: number;
  readonly reversibility: number;
  readonly verifiability: number;
  readonly cost: number;
  readonly risk: number;
}
export interface ImprovementPolicy {
  readonly confidenceFloor: number;
  readonly valueFloor: number;
  readonly maxCost: number;
  readonly maxWip: number;
  readonly weights?: Partial<Readonly<Record<"evidence" | "expectedValue" | "novelty" | "reversibility" | "verifiability", number>>>;
}
export interface ScoredImprovement extends ImprovementCandidate { readonly fingerprint: string; readonly confidence: number; readonly accepted: boolean; readonly reasons: readonly string[] }

const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function improvementFingerprint(candidate: Pick<ImprovementCandidate, "title">): string {
  const normalized = candidate.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function scoreImprovement(candidate: ImprovementCandidate, policy: ImprovementPolicy, priorFingerprints: ReadonlySet<string> = new Set()): ScoredImprovement {
  const weights = { evidence: .27, expectedValue: .27, novelty: .16, reversibility: .12, verifiability: .18, ...policy.weights };
  const denominator = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const confidence = clamp((candidate.evidence * weights.evidence + candidate.expectedValue * weights.expectedValue + candidate.novelty * weights.novelty + candidate.reversibility * weights.reversibility + candidate.verifiability * weights.verifiability) / denominator - candidate.risk * .2);
  const fingerprint = improvementFingerprint(candidate);
  const reasons: string[] = [];
  if (priorFingerprints.has(fingerprint) || candidate.novelty < .2) reasons.push("duplicate-or-repetitive");
  if (candidate.verifiability < .5) reasons.push("insufficient-verifiability");
  if (candidate.expectedValue < policy.valueFloor) reasons.push("insufficient-value");
  if (candidate.cost > policy.maxCost) reasons.push("budget-threatening");
  if (confidence < policy.confidenceFloor) reasons.push("below-confidence-floor");
  return { ...candidate, fingerprint, confidence, accepted: reasons.length === 0, reasons };
}

export function runImprovementWave(candidates: readonly ImprovementCandidate[], policy: ImprovementPolicy, priorFingerprints: ReadonlySet<string> = new Set()) {
  const scored = candidates.map((candidate) => scoreImprovement(candidate, policy, priorFingerprints));
  const accepted = scored.filter((item) => item.accepted).sort((a, b) => b.confidence - a.confidence).slice(0, policy.maxWip);
  const acceptedSet = new Set(accepted.map((item) => item.fingerprint));
  const ledger = scored.map((item) => ({ ...item, disposition: acceptedSet.has(item.fingerprint) ? "completed" as const : "rejected-with-evidence" as const }));
  return { accepted, ledger, terminated: accepted.length === 0, reason: accepted.length === 0 ? "confidence-floor" as const : "wave-integrated" as const };
}

export function runBoundedImprovementRounds(initial: readonly ImprovementCandidate[], proposeNext: (round: number, prior: readonly ScoredImprovement[]) => readonly ImprovementCandidate[], policy: ImprovementPolicy, maxRounds = 5) {
  const ledger: ReturnType<typeof runImprovementWave>["ledger"][number][] = [];
  const fingerprints = new Set<string>();
  let candidates = initial;
  let consecutiveNoWinnerRounds = 0;
  for (let round = 1; round <= Math.max(1, maxRounds); round += 1) {
    const wave = runImprovementWave(candidates, policy, fingerprints);
    ledger.push(...wave.ledger);
    for (const item of wave.accepted) fingerprints.add(item.fingerprint);
    if (wave.terminated) {
      consecutiveNoWinnerRounds += 1;
      if (consecutiveNoWinnerRounds >= 2) return { rounds: round, terminated: true, reason: "two-refreshed-no-winner-rounds" as const, ledger };
    } else consecutiveNoWinnerRounds = 0;
    candidates = proposeNext(round, wave.accepted);
  }
  return { rounds: maxRounds, terminated: false, reason: "round-cap" as const, ledger };
}

export type ImprovementAuthorityDecision = "allowed" | "blocked" | "requires-external-authority";
export interface DurableImprovementCandidate extends ImprovementCandidate {
  readonly id: string;
  readonly summary: string;
  readonly evidenceIds: readonly string[];
  readonly authority: { readonly decision: ImprovementAuthorityDecision; readonly evidenceIds: readonly string[] };
  readonly verification: { readonly method: string; readonly objective: boolean };
  readonly conflictsWith: readonly string[];
  readonly affectedPaths: readonly string[];
  readonly packages: readonly string[];
  readonly acceptanceCriteria: readonly string[];
}
export interface RankedImprovementCandidate extends DurableImprovementCandidate {
  readonly fingerprint: string;
  readonly confidence: number;
  readonly rank: number;
  readonly disposition: "accepted" | "rejected";
  readonly reasons: readonly string[];
  readonly requirementId: string | null;
  readonly taskId: string | null;
}
export interface ImprovementPhaseState {
  readonly schemaVersion: 1;
  readonly phase: "post-request-improvement";
  readonly runId: string;
  readonly runStateDigest: string;
  readonly changeId: string;
  readonly sourceRevision: string;
  readonly evaluatedAt: string;
  readonly policy: ImprovementPolicy;
  readonly candidates: readonly DurableImprovementCandidate[];
  readonly rankedCandidates: readonly RankedImprovementCandidate[];
  readonly stateDigest: string;
}

export interface ImprovementRefreshSnapshot {
  readonly evidenceIds: readonly string[];
  readonly coverageIds: readonly string[];
  readonly refreshedAt: string;
}
export interface ImprovementConvergenceRound extends ImprovementRefreshSnapshot {
  readonly round: number;
  readonly refreshDigest: string;
  readonly candidateIds: readonly string[];
  readonly winnerIds: readonly string[];
  readonly consecutiveNoWinnerRounds: number;
  readonly disposition: "work-reopened" | "work-continues" | "no-winner" | "converged";
  readonly receiptDigest: string;
}
export interface ImprovementConvergenceReopening extends ImprovementRefreshSnapshot {
  readonly afterRound: number;
  readonly refreshDigest: string;
  readonly receiptDigest: string;
}
export interface ImprovementConvergenceState {
  readonly schemaVersion: 1;
  readonly phaseStateDigest: string;
  readonly runId: string;
  readonly status: "open" | "converged";
  readonly consecutiveNoWinnerRounds: number;
  readonly resetRoundOffsets: readonly number[];
  readonly reopenings: readonly ImprovementConvergenceReopening[];
  readonly rounds: readonly ImprovementConvergenceRound[];
  readonly stateDigest: string;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  return JSON.stringify(value);
}
function phaseDigest(state: Omit<ImprovementPhaseState, "stateDigest"> | ImprovementPhaseState): string {
  const { stateDigest: _ignored, ...payload } = state as ImprovementPhaseState;
  return `sha256:${createHash("sha256").update(canonical(payload)).digest("hex")}`;
}
function convergenceDigest(state: Omit<ImprovementConvergenceState, "stateDigest"> | ImprovementConvergenceState): string {
  const { stateDigest: _ignored, ...payload } = state as ImprovementConvergenceState;
  return `sha256:${createHash("sha256").update(canonical(payload)).digest("hex")}`;
}
function requireText(value: string, label: string): void { if (!value?.trim()) throw new Error(`${label} is required`); }
function traceToken(candidate: DurableImprovementCandidate): string {
  return improvementFingerprint(candidate).toUpperCase();
}

export function evaluateImprovementPhase(input: {
  runId: string; runStateDigest: string; changeId: string; sourceRevision: string; evaluatedAt: string;
  candidates: readonly DurableImprovementCandidate[]; policy: ImprovementPolicy;
  priorFingerprints?: ReadonlySet<string>;
}): ImprovementPhaseState {
  requireText(input.runId, "runId"); requireText(input.changeId, "changeId"); requireText(input.evaluatedAt, "evaluatedAt");
  if (!/^sha256:[a-f0-9]{64}$/.test(input.runStateDigest)) throw new Error("runStateDigest must bind an exact orchestration state");
  if (!/^[a-f0-9]{40}$/.test(input.sourceRevision)) throw new Error("sourceRevision must be an exact 40-character commit");
  const ids = new Set<string>();
  const evaluated = input.candidates.map((candidate) => {
    requireText(candidate.id, "candidate id"); requireText(candidate.summary, `summary for ${candidate.id}`);
    if (ids.has(candidate.id)) throw new Error(`duplicate improvement candidate: ${candidate.id}`); ids.add(candidate.id);
    const scored = scoreImprovement(candidate, input.policy, input.priorFingerprints);
    const reasons = [...scored.reasons];
    if (!candidate.evidenceIds.length) reasons.push("missing-candidate-evidence");
    if (candidate.authority.decision !== "allowed") reasons.push(`authority-${candidate.authority.decision}`);
    if (!candidate.authority.evidenceIds.length) reasons.push("missing-authority-evidence");
    if (candidate.conflictsWith.length) reasons.push("conflicting-candidate");
    if (!candidate.verification.objective || !candidate.verification.method.trim()) reasons.push("verification-not-objective");
    if (!candidate.affectedPaths.length || !candidate.acceptanceCriteria.length) reasons.push("incomplete-delivery-scope");
    const uniqueReasons = [...new Set(reasons)];
    return { ...candidate, fingerprint: scored.fingerprint, confidence: scored.confidence, disposition: uniqueReasons.length ? "rejected" as const : "accepted" as const, reasons: uniqueReasons };
  }).sort((a, b) => b.confidence - a.confidence || a.id.localeCompare(b.id));
  let accepted = 0;
  const rankedCandidates: RankedImprovementCandidate[] = evaluated.map((candidate, index) => {
    const overWip = candidate.disposition === "accepted" && accepted >= input.policy.maxWip;
    if (candidate.disposition === "accepted" && !overWip) accepted += 1;
    const disposition = overWip ? "rejected" as const : candidate.disposition;
    const reasons = overWip ? [...candidate.reasons, "wip-cap"] : candidate.reasons;
    const token = traceToken(candidate);
    return { ...candidate, rank: index + 1, disposition, reasons, requirementId: disposition === "accepted" ? `REQ-IMPROV-${token}` : null, taskId: disposition === "accepted" ? `TASK-IMPROV-${token}` : null };
  });
  const payload = { schemaVersion: 1 as const, phase: "post-request-improvement" as const, runId: input.runId, runStateDigest: input.runStateDigest, changeId: input.changeId, sourceRevision: input.sourceRevision, evaluatedAt: input.evaluatedAt, policy: structuredClone(input.policy), candidates: structuredClone(input.candidates), rankedCandidates };
  return { ...payload, stateDigest: phaseDigest(payload) };
}

export function evaluateImprovementPhaseForRun(runState: RunState, input: Omit<Parameters<typeof evaluateImprovementPhase>[0], "runId" | "runStateDigest" | "changeId">): ImprovementPhaseState {
  if (runState.phase !== "complete") throw new Error("post-request improvement requires a completed orchestration run");
  return evaluateImprovementPhase({ ...input, runId: runState.runId, runStateDigest: runState.stateDigest, changeId: runState.changeId });
}

export function verifyImprovementPhase(state: ImprovementPhaseState): void {
  if (phaseDigest(state) !== state.stateDigest) throw new Error("improvement phase state digest mismatch");
  state.rankedCandidates.forEach((candidate, index) => {
    if (candidate.rank !== index + 1) throw new Error("improvement ranking is not contiguous");
    if (candidate.disposition === "accepted" && (candidate.authority.decision !== "allowed" || candidate.conflictsWith.length || !candidate.evidenceIds.length || !candidate.authority.evidenceIds.length || !candidate.verification.objective)) throw new Error(`unsafe accepted improvement: ${candidate.id}`);
    if ((candidate.disposition === "accepted") !== Boolean(candidate.requirementId && candidate.taskId)) throw new Error(`improvement trace disposition mismatch: ${candidate.id}`);
  });
}

export function saveImprovementPhase(path: string, state: ImprovementPhaseState): void {
  verifyImprovementPhase(state); mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`; writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`); renameSync(temporary, path);
}
export function loadImprovementPhase(path: string): ImprovementPhaseState {
  const state = JSON.parse(readFileSync(path, "utf8")) as ImprovementPhaseState; verifyImprovementPhase(state); return state;
}

export function createImprovementConvergenceState(phase: ImprovementPhaseState): ImprovementConvergenceState {
  verifyImprovementPhase(phase);
  const payload = { schemaVersion: 1 as const, phaseStateDigest: phase.stateDigest, runId: phase.runId, status: "open" as const, consecutiveNoWinnerRounds: 0, resetRoundOffsets: [0], reopenings: [], rounds: [] };
  return { ...payload, stateDigest: convergenceDigest(payload) };
}

export function recordImprovementConvergenceRound(state: ImprovementConvergenceState, input: ImprovementRefreshSnapshot & { candidateIds: readonly string[]; winnerIds: readonly string[] }): ImprovementConvergenceState {
  verifyImprovementConvergenceState(state);
  if (state.status === "converged") throw new Error("converged improvement state requires new evidence before another round");
  requireText(input.refreshedAt, "refresh timestamp");
  if (!input.evidenceIds.length || !input.coverageIds.length) throw new Error("each improvement round requires refreshed evidence and coverage");
  const refreshDigest = `sha256:${createHash("sha256").update(canonical({ evidenceIds: [...input.evidenceIds].sort(), coverageIds: [...input.coverageIds].sort() })).digest("hex")}`;
  const priorRefresh = state.rounds.at(-1)?.refreshDigest;
  const refreshChanged = Boolean(priorRefresh && priorRefresh !== refreshDigest);
  const hasWinners = input.winnerIds.length > 0;
  const consecutiveNoWinnerRounds = hasWinners ? 0 : (refreshChanged ? 1 : state.consecutiveNoWinnerRounds + 1);
  const status = consecutiveNoWinnerRounds >= 2 ? "converged" as const : "open" as const;
  const disposition = status === "converged" ? "converged" as const : hasWinners ? "work-continues" as const : refreshChanged ? "work-reopened" as const : "no-winner" as const;
  const roundPayload = { round: state.rounds.length + 1, evidenceIds: [...input.evidenceIds], coverageIds: [...input.coverageIds], refreshedAt: input.refreshedAt, refreshDigest, candidateIds: [...input.candidateIds], winnerIds: [...input.winnerIds], consecutiveNoWinnerRounds, disposition };
  const round: ImprovementConvergenceRound = { ...roundPayload, receiptDigest: `sha256:${createHash("sha256").update(canonical({ priorStateDigest: state.stateDigest, ...roundPayload })).digest("hex")}` };
  const payload = { ...state, status, consecutiveNoWinnerRounds, rounds: [...state.rounds, round] };
  const { stateDigest: _ignored, ...withoutDigest } = payload;
  return { ...withoutDigest, stateDigest: convergenceDigest(withoutDigest) };
}

export function reopenImprovementConvergence(state: ImprovementConvergenceState, refresh: ImprovementRefreshSnapshot): ImprovementConvergenceState {
  verifyImprovementConvergenceState(state);
  if (!refresh.evidenceIds.length || !refresh.coverageIds.length) throw new Error("reopening requires refreshed evidence and coverage");
  const nextRefresh = `sha256:${createHash("sha256").update(canonical({ evidenceIds: [...refresh.evidenceIds].sort(), coverageIds: [...refresh.coverageIds].sort() })).digest("hex")}`;
  if (nextRefresh === state.rounds.at(-1)?.refreshDigest) throw new Error("unchanged evidence cannot reopen converged improvement work");
  const reopeningPayload = { afterRound: state.rounds.length, evidenceIds: [...refresh.evidenceIds], coverageIds: [...refresh.coverageIds], refreshedAt: refresh.refreshedAt, refreshDigest: nextRefresh };
  const reopening: ImprovementConvergenceReopening = { ...reopeningPayload, receiptDigest: `sha256:${createHash("sha256").update(canonical({ priorStateDigest: state.stateDigest, ...reopeningPayload })).digest("hex")}` };
  const payload = { ...state, status: "open" as const, consecutiveNoWinnerRounds: 0, resetRoundOffsets: [...state.resetRoundOffsets, state.rounds.length], reopenings: [...state.reopenings, reopening] };
  const { stateDigest: _ignored, ...withoutDigest } = payload;
  return { ...withoutDigest, stateDigest: convergenceDigest(withoutDigest) };
}

export function verifyImprovementConvergenceState(state: ImprovementConvergenceState): void {
  if (convergenceDigest(state) !== state.stateDigest) throw new Error("improvement convergence state digest mismatch");
  let consecutive = 0;
  state.rounds.forEach((round, index) => {
    if (state.resetRoundOffsets.includes(index)) consecutive = 0;
    if (round.round !== index + 1 || !round.evidenceIds.length || !round.coverageIds.length) throw new Error("invalid improvement convergence round");
    const prior = index === 0 ? null : state.rounds[index - 1];
    const changed = Boolean(prior && prior.refreshDigest !== round.refreshDigest);
    consecutive = round.winnerIds.length ? 0 : changed ? 1 : consecutive + 1;
    if (round.consecutiveNoWinnerRounds !== consecutive) throw new Error("invalid no-winner convergence count");
  });
  if (state.resetRoundOffsets.includes(state.rounds.length)) consecutive = 0;
  if (!state.resetRoundOffsets.length || state.resetRoundOffsets[0] !== 0 || state.resetRoundOffsets.some((offset, index) => offset < 0 || offset > state.rounds.length || (index > 0 && offset <= state.resetRoundOffsets[index - 1]))) throw new Error("invalid improvement convergence reset ledger");
  if (state.reopenings.length !== state.resetRoundOffsets.length - 1 || state.reopenings.some((reopening, index) => reopening.afterRound !== state.resetRoundOffsets[index + 1] || !reopening.evidenceIds.length || !reopening.coverageIds.length || !/^sha256:[a-f0-9]{64}$/.test(reopening.receiptDigest))) throw new Error("invalid improvement convergence reopening ledger");
  if (state.consecutiveNoWinnerRounds !== consecutive) throw new Error("convergence count does not match rounds");
  if ((state.status === "converged") !== (consecutive >= 2)) throw new Error("convergence status does not match two-round evidence");
}

export function saveImprovementConvergenceState(path: string, state: ImprovementConvergenceState): void {
  verifyImprovementConvergenceState(state); mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`; writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`); renameSync(temporary, path);
}
export function loadImprovementConvergenceState(path: string): ImprovementConvergenceState {
  const state = JSON.parse(readFileSync(path, "utf8")) as ImprovementConvergenceState; verifyImprovementConvergenceState(state); return state;
}

export function acceptedImprovementRequirements(state: ImprovementPhaseState): ScopeRequirement[] {
  verifyImprovementPhase(state);
  return state.rankedCandidates.filter((candidate) => candidate.disposition === "accepted").map((candidate) => {
    const scenarioId = `SCN-IMPROV-${traceToken(candidate)}`;
    return {
      id: candidate.requirementId!, title: candidate.title, observableBehavior: candidate.summary,
      decisions: [`Promoted from post-request improvement rank ${candidate.rank}; evidence: ${candidate.evidenceIds.join(", ")}; authority: ${candidate.authority.evidenceIds.join(", ")}.`],
      scenarios: [{ id: scenarioId, title: `${candidate.title} is observably verified`, when: "The promoted improvement is implemented", then: candidate.verification.method }],
      tasks: [{ id: candidate.taskId!, title: `Implement ${candidate.title}`, owner: "delivery owner", dependencies: [], affectedPaths: [...candidate.affectedPaths], packages: [...candidate.packages], acceptanceCriteria: [...candidate.acceptanceCriteria], expectedEvidence: [{ kind: "behavior", strength: "controlled", description: candidate.verification.method }, { kind: "verification", strength: "local", description: `Objective verification for ${candidate.id}` }], scenarioIds: [scenarioId], releaseRequired: false, productionRequired: false }],
    };
  });
}

export function compileAcceptedImprovements(state: ImprovementPhaseState, baseScope: Omit<HydratedDeliveryScope, "changeId" | "sourceRevision" | "requirements"> & { requirements?: readonly ScopeRequirement[] }, schema: Record<string, unknown>): CompiledDeliveryBundle {
  const promoted = acceptedImprovementRequirements(state);
  if (!promoted.length) throw new Error("no justified improvement candidates are eligible for compilation");
  return compileHydratedDeliveryScope({ ...baseScope, changeId: state.changeId, sourceRevision: state.sourceRevision, requirements: [...(baseScope.requirements ?? []), ...promoted] }, schema);
}
