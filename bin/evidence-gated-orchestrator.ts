#!/usr/bin/env node
/**
 * Production composition root for the evidence-gated autonomous pipeline.
 *
 * This module deliberately owns orchestration, not provider implementations. Hosts must inject
 * approved research, model, OpenSpec compiler, scheduler, and verification adapters. Missing or
 * incomplete adapters fail closed; a plan or launcher command is never treated as execution.
 */
import { createHash, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  convergeArchitecture,
  discoverProviderSlotCapabilities,
  evaluateConferenceRiskGate,
  evaluateSaturation,
  executeResearch,
  inventoryRepository,
  invokeIndependentBriefs,
  invokeProviderCritiqueRound,
  planConferenceCapabilities,
  resolveCodexLedConference,
  selectConferenceRoster,
  type EvidenceDomain,
  type ConferenceCapabilityPlan,
  type ConferenceRiskReview,
  type ConferenceResolutionReceipt,
  type ProviderLauncher,
  type ProviderSlotCapability,
  type ProviderCapabilitySnapshot,
  type ResearchRail,
  type ResearchRequest,
  type Specialist,
} from './evidence-gated-deliberation.ts';
import {
  compileAndFreezeContract,
  executeFrozenContract,
  type ArchitectAssignmentReceipt,
  type CompiledArtifact,
  type ExecutionNode,
  type FrozenContract,
  type NodeExecutionReceipt,
  type SchedulerAdapter,
} from './swarm-execution-kernel.ts';
import { createRunState, transitionRun, type RunState } from './orchestration-run-state.ts';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

export interface OpenSpecCompilerInput {
  checkout: string;
  changeId: string;
  prompt: string;
  evidenceDigest: string;
  fixedPointDigest: string;
  assignment: ArchitectAssignmentReceipt;
  conference: Awaited<ReturnType<typeof convergeArchitecture>>;
  conferenceResolution: ConferenceResolutionReceipt;
  conferenceExecution: Pick<ConferenceCapabilityPlan, 'mode' | 'independent' | 'limitation'>;
}

export interface PipelineAdapters {
  research: ResearchRail;
  provider: ProviderLauncher;
  assignArchitect: (input: { changeId: string; prompt: string; roster: ReturnType<typeof selectConferenceRoster>; fixedPointDigest: string }) => Promise<ArchitectAssignmentReceipt>;
  compileOpenSpec: (input: OpenSpecCompilerInput) => Promise<{ artifacts: CompiledArtifact[]; nodes: ExecutionNode[] }>;
  scheduler: SchedulerAdapter;
  schedulerOptions?: Parameters<typeof executeFrozenContract>[2];
  verify: (input: { contract: FrozenContract; executions: NodeExecutionReceipt[] }) => Promise<{ passed: boolean; receipts: VerificationReceipt[]; blockers?: string[] }>;
}

export interface VerificationReceipt {
  reviewerFamily: 'claude' | 'codex' | 'gemini';
  launcher: string;
  inputDigest: string;
  outputDigest: string;
  reviewedContractDigest: string;
  passed: boolean;
}

export interface PipelineInput {
  prompt: string;
  checkout: string;
  changeId: string;
  sourceRevision: string;
  trustedAuthoritySourceDigest: string;
  researchRequests: ResearchRequest[];
  requiredEvidence: EvidenceDomain[];
  specialists: Specialist[];
  conferenceSeed?: string;
  maxCritiqueRounds?: number;
  approvedResearchRails: string[];
  providerCapabilities?: ProviderSlotCapability[];
  providerCapabilitySnapshot?: ProviderCapabilitySnapshot;
  providerSlotLimits?: Partial<Record<'claude' | 'codex' | 'gemini', number>>;
  riskReview?: ConferenceRiskReview;
  conflictDispositions?: Array<{ conflict: string; resolution: string; evidence: string[] }>;
}

export interface PipelineResult {
  status: 'complete';
  state: RunState;
  contract: FrozenContract;
  executions: NodeExecutionReceipt[];
  verificationReceipts: VerificationReceipt[];
  conferenceResolution: ConferenceResolutionReceipt;
  conferenceExecution: OpenSpecCompilerInput['conferenceExecution'];
}

function requireAdapters(adapters: Partial<PipelineAdapters>): asserts adapters is PipelineAdapters {
  for (const name of ['research', 'provider', 'assignArchitect', 'compileOpenSpec', 'scheduler', 'verify'] as const) {
    if (!adapters[name]) throw new Error(`Evidence-gated pipeline is not configured: missing ${name} adapter`);
  }
}

function advance(state: RunState, phase: Parameters<typeof transitionRun>[1], evidence: unknown): RunState {
  return transitionRun(state, phase, evidence);
}

export async function runEvidenceGatedPipeline(input: PipelineInput, configured: Partial<PipelineAdapters>): Promise<PipelineResult> {
  requireAdapters(configured);
  if (!input.prompt.trim() || !input.changeId.trim() || !input.sourceRevision.trim()) throw new Error('Prompt, changeId, and exact sourceRevision are required');
  if (!input.researchRequests.length) throw new Error('At least one executed research request is required');
  const mandatoryEvidence: EvidenceDomain[] = ['primary-sources', 'competitors-substitutes'];
  for (const domain of mandatoryEvidence) {
    if (!input.requiredEvidence.includes(domain)) throw new Error(`Production pipeline requires evidence domain: ${domain}`);
    if (!input.researchRequests.some((request) => request.domain === domain && request.query.trim())) throw new Error(`Production pipeline requires non-empty research for: ${domain}`);
  }
  if (!input.approvedResearchRails.length) throw new Error('Production pipeline requires an explicit approved research rail allowlist');
  let state = createRunState(randomUUID(), input.changeId);

  const inventory = inventoryRepository(input.checkout, input.sourceRevision);
  const intake = { prompt: input.prompt, sourceRevision: input.sourceRevision };
  state = advance(state, 'estate-inventory', { inventory, intake });
  const research = await executeResearch(input.researchRequests, configured.research, Date.now(), 30 * 86400_000, new Set(input.approvedResearchRails));
  state = advance(state, 'research', { research });
  const saturation = evaluateSaturation(inventory, research, input.requiredEvidence, {}, input.conflictDispositions);
  if (!saturation.ready) throw new Error(`Saturation gate failed closed: ${saturation.blockers.join('; ')}`);
  state = advance(state, 'saturation-gate', { saturation });
  const evidenceBundle = { intake, inventory, research, saturation };
  const roster = selectConferenceRoster(input.conferenceSeed ?? state.runId, input.prompt, input.specialists);
  const defaultCapabilities = (['claude', 'codex', 'gemini'] as const).map((family) => ({ family, available: roster.participants.some((participant) => participant.family === family), slots: 1, evidence: 'configured-specialist-roster' }));
  const discoveredCapabilities = input.providerCapabilitySnapshot
    ? discoverProviderSlotCapabilities(input.providerCapabilitySnapshot, input.providerSlotLimits)
    : undefined;
  const capabilityPlan = planConferenceCapabilities(input.providerCapabilities ?? discoveredCapabilities ?? defaultCapabilities, roster.participants);
  const riskGate = evaluateConferenceRiskGate(input.prompt, input.riskReview, capabilityPlan);
  if (riskGate.decision === 'block') throw new Error(`High-risk conference blocked: ${riskGate.blockers.join('; ')}`);
  const independent = await invokeIndependentBriefs(saturation, evidenceBundle, configured.provider, new Date().toISOString(), capabilityPlan);
  state = advance(state, 'independent-briefs', independent);

  if (/\b(auth|security|payment|billing|migration|tenant|credential|architecture)\b/i.test(input.prompt) && !roster.secondArchitect) {
    throw new Error('High-risk conference requires a second architect');
  }
  const roleAssignments = capabilityPlan.assignments;
  state = advance(state, 'heterogeneous-conference', { conference: { ...roster, roleAssignments, leadFamily: 'codex', highRisk: riskGate.categories.length > 0, riskGate } });
  const critiqueReceipts: unknown[] = [];
  const conferenceExchanges = [] as Awaited<ReturnType<typeof invokeProviderCritiqueRound>>['exchanges'];
  const fixedPoint = await convergeArchitecture(independent.briefs, async (round, briefs, prior) => {
    const invoked = await invokeProviderCritiqueRound(round, briefs, prior, roster.participants, configured.provider, new Date().toISOString(), roleAssignments);
    critiqueReceipts.push(...invoked.receipts);
    conferenceExchanges.push(...invoked.exchanges);
    for (const critique of invoked.critiques) {
      const matching = invoked.receipts.find((receipt) => receipt.participantId === critique.participantId)!;
      for (const dissent of critique.dissent) {
        if (dissent.resolutionOwner && dissent.providerReceipt !== matching.receiptDigest) throw new Error(`Dissent resolution is not bound to the approved provider call for ${critique.participantId}`);
      }
    }
    return invoked.critiques;
  }, input.maxCritiqueRounds);
  if (!fixedPoint.converged) throw new Error(fixedPoint.blocker ?? 'Architecture fixed point did not converge');
  const conferenceResolution = resolveCodexLedConference(roleAssignments, conferenceExchanges, fixedPoint.converged);
  const fixedPointDigest = digest(fixedPoint);
  state = advance(state, 'architecture-fixed-point', { fixedPoint, critiqueReceipts, conferenceExchanges, conferenceResolution });
  const assignment = await configured.assignArchitect({ changeId: input.changeId, prompt: input.prompt, roster, fixedPointDigest });
  state = advance(state, 'architect-assignment', { assignment });

  const evidenceDigest = digest(evidenceBundle);
  const conferenceExecution: OpenSpecCompilerInput['conferenceExecution'] = {
    mode: capabilityPlan.mode,
    independent: capabilityPlan.independent,
    ...(capabilityPlan.limitation ? { limitation: capabilityPlan.limitation } : {}),
  };
  const compiled = await configured.compileOpenSpec({ checkout: input.checkout, changeId: input.changeId, prompt: input.prompt, evidenceDigest, fixedPointDigest, assignment, conference: fixedPoint, conferenceResolution, conferenceExecution });
  state = advance(state, 'openspec-compilation', { contract: compiled });
  const contract = compileAndFreezeContract({ checkout: input.checkout, changeId: input.changeId, assignment, trustedAuthoritySourceDigest: input.trustedAuthoritySourceDigest, evidenceDigest, fixedPointDigest, unresolvedMaterialDeltas: [], frozenBaseRevision: input.sourceRevision, ...compiled });
  state = advance(state, 'contract-freeze', { contract });
  const executions = await executeFrozenContract(contract, configured.scheduler, configured.schedulerOptions);
  const latestByNode = new Map(executions.map((receipt) => [receipt.nodeId, receipt]));
  const failures = contract.nodes.flatMap(({ id }) => {
    const status = latestByNode.get(id)?.status;
    return status === 'integrated' ? [] : [`${id}:${status ?? 'missing'}`];
  });
  if (failures.length) throw new Error(`Swarm execution did not integrate every node: ${failures.join(', ')}`);
  const terminalExecutions = [...latestByNode.values()];
  state = advance(state, 'swarm-execution', { executions });
  state = advance(state, 'integration', { executions: terminalExecutions });
  const verification = await configured.verify({ contract, executions: terminalExecutions });
  if (!verification.passed || !verification.receipts.length) throw new Error(`Adversarial verification failed closed: ${(verification.blockers ?? ['missing verification receipts']).join('; ')}`);
  const reviewerFamilies = new Set(verification.receipts.map((receipt) => receipt.reviewerFamily));
  const highRisk = riskGate.categories.length > 0;
  const requiredReviewerFamilies = capabilityPlan.independent || highRisk ? 2 : 1;
  if (reviewerFamilies.size < requiredReviewerFamilies) throw new Error('Adversarial verification requires at least two distinct frontier model families when independent capacity or high-risk scope is present');
  for (const receipt of verification.receipts) {
    if (!['claude', 'codex', 'gemini'].includes(receipt.reviewerFamily)
      || !receipt.launcher.startsWith('approved:')
      || !/^[a-f0-9]{64}$/.test(receipt.inputDigest)
      || !/^[a-f0-9]{64}$/.test(receipt.outputDigest)
      || receipt.reviewedContractDigest !== contract.contractDigest
      || !receipt.passed) {
      throw new Error(`Invalid cross-family verification receipt from ${String(receipt.reviewerFamily)}`);
    }
  }
  state = advance(state, 'adversarial-verification', { reviews: verification.receipts });
  state = advance(state, 'complete', { complete: true, verification });
  return {
    status: 'complete', state, contract, executions, verificationReceipts: verification.receipts, conferenceResolution,
    conferenceExecution,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stderr.write('This governed entrypoint requires host-configured approved adapters. Import runEvidenceGatedPipeline; static CLI planning is not execution.\n');
  process.exitCode = 2;
}
