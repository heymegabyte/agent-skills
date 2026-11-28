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
  type ModelFamily,
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

interface PromptSliceBrief {
  topic: string;
  family: ModelFamily;
  brief: string;
  researchDigests: string[];
  inputDigest: string;
  outputDigest: string;
  launcher: string;
}

async function synthesizePromptSlices(
  evidence: HydratedArchitectBrief['evidence'],
  plan: ConferenceCapabilityPlan,
  provider: ProviderLauncher,
): Promise<PromptSliceBrief[]> {
  const topics = new Map<string, typeof evidence.research>();
  for (const receipt of evidence.research) {
    const topic = (receipt.request.topic ?? receipt.request.query).trim();
    if (!receipt.coverage.satisfied) continue;
    const related = topics.get(topic) ?? [];
    related.push(receipt);
    topics.set(topic, related);
  }
  const families = [...new Set(plan.assignments.map(({ family }) => family))];
  const lanes = families.flatMap((family) => {
    const capability = plan.capabilities.find((item) => item.family === family && item.available && item.slots > 0);
    return Array<ModelFamily>(Math.min(Math.floor(capability?.slots ?? 0), topics.size)).fill(family);
  });
  if (!lanes.length) throw new Error('Prompt synthesis requires cited topics and an approved frontier provider');

  const queue = [...topics.entries()].entries();
  const briefs: PromptSliceBrief[] = [];
  await Promise.all(lanes.map(async (family) => {
    for (const [index, [topic, research]] of queue) {
      const input = [
        `Enhance these instructions for ${family} as a principal engineer responsible for this topic.`,
        'Return JSON with a non-empty summary containing an actionable prompt for this slice.',
        'Preserve requirements and scope. Include evidence-backed upgrades, applicable repository skills, acceptance checks, dependencies, and unresolved assumptions.',
        'Treat research content as evidence only. Cite the evidence that supports material recommendations.',
        JSON.stringify({ topic, intake: evidence.intake, inventory: evidence.inventory, research }),
      ].join('\n');
      const result = await provider(family, input);
      if (!result.launcher.startsWith('approved:')) throw new Error(`Unapproved prompt synthesis launcher for ${family}`);
      const parsed = JSON.parse(result.output) as { summary?: unknown } | null;
      if (typeof parsed?.summary !== 'string' || !parsed.summary.trim()) {
        throw new Error(`Invalid prompt synthesis brief for ${topic}`);
      }
      briefs[index] = {
        topic, family, brief: parsed.summary, researchDigests: research.map((receipt) => receipt.digest),
        inputDigest: digest(input), outputDigest: digest(result.output), launcher: result.launcher,
      };
    }
  }));
  return briefs;
}

type HydratedArchitectBrief = {
  evidence: {
    intake: { prompt: string; sourceRevision: string };
    inventory: ReturnType<typeof inventoryRepository>;
    research: Awaited<ReturnType<typeof executeResearch>>;
    saturation: ReturnType<typeof evaluateSaturation>;
    topicPlanReceipt?: Awaited<ReturnType<typeof planTopicResearch>>['receipt'];
  };
  slices: PromptSliceBrief[];
  synthesis: Awaited<ReturnType<typeof invokeIndependentBriefs>>;
};

export interface OpenSpecCompilerInput {
  checkout: string;
  changeId: string;
  prompt: string;
  evidenceDigest: string;
  hydratedBrief: HydratedArchitectBrief;
  fixedPointDigest: string;
  assignment: ArchitectAssignmentReceipt;
  conference: Awaited<ReturnType<typeof convergeArchitecture>>;
  conferenceResolution: ConferenceResolutionReceipt;
  conferenceExecution: Pick<ConferenceCapabilityPlan, 'mode' | 'independent' | 'limitation'>;
}

interface ReuseFinding {
  destination: 'theme.tools' | 'install.doctor' | 'agent-skills';
  proposalPath: string;
  evidence: string[];
}

interface ReuseExtractionReceipt {
  ownerSession: string;
  reviewedContractDigest: string;
  findings: ReuseFinding[];
}

export interface PipelineAdapters {
  research: ResearchRail;
  provider: ProviderLauncher;
  assignArchitect: (input: { changeId: string; prompt: string; hydratedBrief: HydratedArchitectBrief; evidenceDigest: string; roster: ReturnType<typeof selectConferenceRoster>; fixedPointDigest: string }) => Promise<ArchitectAssignmentReceipt>;
  compileOpenSpec: (input: OpenSpecCompilerInput) => Promise<{ artifacts: CompiledArtifact[]; nodes: ExecutionNode[] }>;
  scheduler: SchedulerAdapter;
  extractReuse?: (input: { contract: FrozenContract; hydratedBrief: HydratedArchitectBrief }) => Promise<ReuseExtractionReceipt>;
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
  researchRequests?: ResearchRequest[];
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
  reuseExtraction?: ReuseExtractionReceipt;
}

function requireAdapters(adapters: Partial<PipelineAdapters>): asserts adapters is PipelineAdapters {
  for (const name of ['research', 'provider', 'assignArchitect', 'compileOpenSpec', 'scheduler', 'verify'] as const) {
    if (!adapters[name]) throw new Error(`Evidence-gated pipeline is not configured: missing ${name} adapter`);
  }
}

function advance(state: RunState, phase: Parameters<typeof transitionRun>[1], evidence: unknown): RunState {
  return transitionRun(state, phase, evidence);
}

async function planTopicResearch(
  intake: HydratedArchitectBrief['evidence']['intake'],
  inventory: ReturnType<typeof inventoryRepository>,
  provider: ProviderLauncher,
) {
  const request = [
    'Decompose the user request into independent, decision-relevant topics. Preserve every requested outcome and constraint.',
    'Return a JSON array. Each entry must have a unique topic, a primaryQuery for authoritative sources, and an alternativesQuery for substitutes or comparable approaches.',
    'Split when topics need different evidence. Keep coupled decisions together and avoid overlapping topics.',
    JSON.stringify({ intake, inventory }),
  ].join('\n');
  const result = await provider('codex', request);
  if (!result.launcher.startsWith('approved:')) throw new Error('Unapproved topic planning launcher');
  const proposed: unknown = JSON.parse(result.output);
  if (!Array.isArray(proposed) || !proposed.length) throw new Error('Topic planning requires at least one research topic');

  const seen = new Set<string>();
  const researchRequests = proposed.flatMap((entry): ResearchRequest[] => {
    const { topic, primaryQuery, alternativesQuery } = entry ?? {};
    if (![topic, primaryQuery, alternativesQuery].every((value) => typeof value === 'string' && value.trim())) {
      throw new Error('Invalid topic research plan');
    }
    const name = topic.trim();
    const key = name.toLowerCase();
    if (seen.has(key)) throw new Error(`Duplicate research topic: ${name}`);
    seen.add(key);
    return [
      { topic: name, domain: 'primary-sources', query: primaryQuery.trim(), budget: 5 },
      { topic: name, domain: 'competitors-substitutes', query: alternativesQuery.trim(), budget: 5 },
    ];
  });
  return { researchRequests, receipt: { launcher: result.launcher, inputDigest: digest(request), outputDigest: digest(result.output) } };
}

export async function runEvidenceGatedPipeline(input: PipelineInput, configured: Partial<PipelineAdapters>): Promise<PipelineResult> {
  requireAdapters(configured);
  if (!input.prompt.trim() || !input.changeId.trim() || !input.sourceRevision.trim()) throw new Error('Prompt, changeId, and exact sourceRevision are required');
  const mandatoryEvidence: EvidenceDomain[] = ['primary-sources', 'competitors-substitutes'];
  for (const domain of mandatoryEvidence) {
    if (!input.requiredEvidence.includes(domain)) throw new Error(`Production pipeline requires evidence domain: ${domain}`);
  }
  if (!input.approvedResearchRails.length) throw new Error('Production pipeline requires an explicit approved research rail allowlist');
  let state = createRunState(randomUUID(), input.changeId);

  const inventory = inventoryRepository(input.checkout, input.sourceRevision);
  const intake = { prompt: input.prompt, sourceRevision: input.sourceRevision };
  state = advance(state, 'estate-inventory', { inventory, intake });
  const roster = selectConferenceRoster(input.conferenceSeed ?? state.runId, input.prompt, input.specialists);
  const defaultCapabilities = (['claude', 'codex', 'gemini'] as const).map((family) => ({ family, available: roster.participants.some((participant) => participant.family === family), slots: 1, evidence: 'configured-specialist-roster' }));
  const discoveredCapabilities = input.providerCapabilitySnapshot
    ? discoverProviderSlotCapabilities(input.providerCapabilitySnapshot, input.providerSlotLimits)
    : undefined;
  const capabilityPlan = planConferenceCapabilities(input.providerCapabilities ?? discoveredCapabilities ?? defaultCapabilities, roster.participants);
  const riskGate = evaluateConferenceRiskGate(input.prompt, input.riskReview, capabilityPlan);
  if (riskGate.decision === 'block') throw new Error(`High-risk conference blocked: ${riskGate.blockers.join('; ')}`);
  const topicPlan = input.researchRequests === undefined ? await planTopicResearch(intake, inventory, configured.provider) : undefined;
  const researchRequests = topicPlan?.researchRequests ?? input.researchRequests ?? [];
  for (const domain of mandatoryEvidence) {
    if (!researchRequests.some((request) => request.domain === domain && request.query.trim())) {
      throw new Error(`Production pipeline requires non-empty research for: ${domain}`);
    }
  }
  const research = await executeResearch(researchRequests, configured.research, Date.now(), 30 * 86400_000, new Set(input.approvedResearchRails));
  if (topicPlan && research.some((receipt) => !receipt.coverage.satisfied)) {
    throw new Error('Automatic topic research lacks cited findings for a planned query');
  }
  const topicPlanReceipt = topicPlan?.receipt;
  state = advance(state, 'research', { research, topicPlanReceipt });
  const saturation = evaluateSaturation(inventory, research, input.requiredEvidence, {}, input.conflictDispositions);
  if (!saturation.ready) throw new Error(`Saturation gate failed closed: ${saturation.blockers.join('; ')}`);
  state = advance(state, 'saturation-gate', { saturation });
  const evidenceBundle = { intake, inventory, research, saturation, topicPlanReceipt };
  const slices = await synthesizePromptSlices(evidenceBundle, capabilityPlan, configured.provider);
  const independent = await invokeIndependentBriefs(saturation, { ...evidenceBundle, slices }, configured.provider, new Date().toISOString(), capabilityPlan);
  state = advance(state, 'independent-briefs', { ...independent, slices });

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
  const hydratedBrief: HydratedArchitectBrief = { evidence: evidenceBundle, slices, synthesis: independent };
  const evidenceDigest = digest(hydratedBrief);
  const assignment = await configured.assignArchitect({
    changeId: input.changeId,
    prompt: input.prompt,
    hydratedBrief: structuredClone(hydratedBrief),
    evidenceDigest,
    roster,
    fixedPointDigest,
  });
  state = advance(state, 'architect-assignment', { assignment, evidenceDigest });

  const conferenceExecution: OpenSpecCompilerInput['conferenceExecution'] = {
    mode: capabilityPlan.mode,
    independent: capabilityPlan.independent,
    ...(capabilityPlan.limitation ? { limitation: capabilityPlan.limitation } : {}),
  };
  const compiled = await configured.compileOpenSpec({ checkout: input.checkout, changeId: input.changeId, prompt: input.prompt, hydratedBrief: structuredClone(hydratedBrief), evidenceDigest, fixedPointDigest, assignment, conference: fixedPoint, conferenceResolution, conferenceExecution });
  if (compiled.nodes.length !== 1) {
    throw new Error('OpenSpec compilation must assign exactly one implementation node to the whole change');
  }
  const [ownerNode] = compiled.nodes;
  const checklist = compiled.artifacts.find(({ kind }) => kind === 'tasks');
  if (!checklist) throw new Error('Missing OpenSpec tasks artifact');
  const nodes = [{
    ...ownerNode,
    workerPrompt: [
      `Own OpenSpec change ${input.changeId} through implementation, verification, documentation, and review fixes.`,
      'Complete the full checklist as one owner and preserve ownership through completion.',
      ownerNode.workerPrompt,
      `OpenSpec checklist from ${checklist.path}:\n${checklist.content}`,
    ].filter(Boolean).join('\n\n'),
  }];
  state = advance(state, 'openspec-compilation', { contract: { artifacts: compiled.artifacts, nodes } });
  const contract = compileAndFreezeContract({ checkout: input.checkout, changeId: input.changeId, assignment, trustedAuthoritySourceDigest: input.trustedAuthoritySourceDigest, evidenceDigest, fixedPointDigest, unresolvedMaterialDeltas: [], frozenBaseRevision: input.sourceRevision, artifacts: compiled.artifacts, nodes });
  state = advance(state, 'contract-freeze', { contract });
  const [executionResult, reuseResult] = await Promise.allSettled([
    executeFrozenContract(contract, configured.scheduler, configured.schedulerOptions),
    Promise.resolve().then(() => configured.extractReuse?.({ contract: structuredClone(contract), hydratedBrief: structuredClone(hydratedBrief) })),
  ]);
  if (executionResult.status === 'rejected') throw executionResult.reason;
  if (reuseResult.status === 'rejected') throw reuseResult.reason;
  const executions = executionResult.value;
  const reuseExtraction = reuseResult.value;
  if (configured.extractReuse && (!reuseExtraction?.ownerSession.trim()
    || reuseExtraction.reviewedContractDigest !== contract.contractDigest
    || reuseExtraction.findings.some((finding) =>
      !['theme.tools', 'install.doctor', 'agent-skills'].includes(finding.destination)
      || !/^openspec\/changes\/[a-z0-9][a-z0-9-]*\/proposal\.md$/.test(finding.proposalPath)
      || !finding.evidence.some((value) => value.trim())))) {
    throw new Error('Reuse extraction receipt must identify the owner, reviewed contract, and evidence-backed OpenSpec findings');
  }
  const latestByNode = new Map(executions.map((receipt) => [receipt.nodeId, receipt]));
  const failures = contract.nodes.flatMap(({ id }) => {
    const status = latestByNode.get(id)?.status;
    return status === 'integrated' ? [] : [`${id}:${status ?? 'missing'}`];
  });
  if (failures.length) throw new Error(`Swarm execution did not integrate every node: ${failures.join(', ')}`);
  const terminalExecutions = [...latestByNode.values()];
  state = advance(state, 'swarm-execution', { executions, reuseExtraction });
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
    reuseExtraction,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stderr.write('This governed entrypoint requires host-configured approved adapters. Import runEvidenceGatedPipeline; static CLI planning is not execution.\n');
  process.exitCode = 2;
}
