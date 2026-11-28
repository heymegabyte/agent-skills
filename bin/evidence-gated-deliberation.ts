#!/usr/bin/env node
/** Evidence-gated repository research and heterogeneous architecture conference. */
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';

export type ModelFamily = 'claude' | 'codex' | 'gemini';
export type EvidenceDomain =
  | 'repository-instructions' | 'openspec-architecture' | 'source-tests'
  | 'deployment' | 'dependencies' | 'shared-estate' | 'primary-sources'
  | 'competitors-substitutes';

export interface InventoryEntry {
  domain: EvidenceDomain;
  path: string;
  digest: string;
  kind: 'file' | 'directory' | 'external-gap';
  provenance: string;
}

export interface EstateInventory {
  checkout: string;
  sourceRevision: string;
  entries: InventoryEntry[];
  sharedServices: Array<{ name: string; declaredBy: string; localPath?: string; status: 'resolved' | 'external-gap' }>;
}

export interface ResearchRequest { domain: 'primary-sources' | 'competitors-substitutes'; query: string; budget: number; topic?: string; }
export interface ResearchFinding { url: string; title: string; observedAt: string; publishedAt?: string; excerpt: string; sourceType: 'primary' | 'competitor' | 'substitute'; }
export interface ResearchReceipt {
  request: ResearchRequest;
  rail: string;
  findings: ResearchFinding[];
  conflicts: string[];
  coverage: { requestedDomain: ResearchRequest['domain']; citedSources: number; budget: number; satisfied: boolean };
  cache: { hit: boolean; key: string; freshnessMs: number };
  digest: string;
}
export interface ResearchConflictDisposition { conflict: string; resolution: string; evidence: string[]; }
export type ResearchRail = (request: ResearchRequest) => Promise<{ rail: string; findings: ResearchFinding[]; conflicts?: string[]; cacheHit?: boolean }>;

export interface SaturationDisposition { domain: EvidenceDomain; status: 'satisfied' | 'irrelevant' | 'externally-blocked' | 'missing'; evidence: string[]; reason?: string; }
export interface SaturationResult { ready: boolean; dispositions: SaturationDisposition[]; blockers: string[]; digest: string; }

export interface StructuredBrief {
  family: ModelFamily; summary: string; recommendations: string[]; risks: string[];
  decisions: Array<{ topic: string; position: string; material: boolean }>;
  responsibility?: ConferenceResponsibility;
  provenance?: { mode: ConferenceExecutionMode; providerFamily: ModelFamily; independent: boolean; sequence: number; capabilityEvidence: string };
}
export interface ProviderReceipt { family: ModelFamily; launcher: string; inputDigest: string; outputDigest: string; invokedAt: string; }
export type ProviderLauncher = (family: ModelFamily, input: string) => Promise<{ launcher: string; output: string; sessionId?: string }>;

export interface Specialist { id: string; expertise: string[]; family: ModelFamily; architectEligible: boolean; }
export interface ConferenceRoster { seed: string; participants: Specialist[]; secondArchitect: boolean; reasons: string[]; diversity: { families: number; expertise: number }; }
export type ConferenceResponsibility = 'lead-resolution' | 'product-completeness' | 'architecture-verification';
export interface ConferenceRoleAssignment { participantId: string; family: ModelFamily; responsibility: ConferenceResponsibility; }
export type ConferenceExecutionMode = 'independent-three-family' | 'two-agent' | 'combined-role' | 'sequential-single-agent';
export type ConferenceRiskCategory = 'auth-security' | 'payments' | 'destructive-operation' | 'external-authority';
export interface ConferenceRiskReview {
  authorized: boolean;
  authorityEvidence: string;
  grantedScopes: ConferenceRiskCategory[];
  reviewerFamilies: ModelFamily[];
  passed: boolean;
  evidence: string[];
}
export interface ConferenceRiskGateReceipt {
  receiptId: string;
  categories: ConferenceRiskCategory[];
  decision: 'allow' | 'block';
  blockers: string[];
  authorityEvidence: string;
  reviewerFamilies: ModelFamily[];
  evidence: string[];
}
export interface ProviderSlotCapability { family: ModelFamily; available: boolean; slots: number; evidence: string; }
export interface ProviderCapabilitySnapshot {
  claude?: { installed?: boolean; authenticated?: boolean; available?: boolean };
  codex?: { installed?: boolean; authenticated?: boolean; available?: boolean };
  gemini?: { installed?: boolean; authenticated?: boolean; available?: boolean };
}
export interface ConferenceCapabilityPlan {
  mode: ConferenceExecutionMode;
  capabilities: ProviderSlotCapability[];
  assignments: ConferenceRoleAssignment[];
  independent: boolean;
  limitation?: string;
}
export interface Critique {
  family: ModelFamily;
  participantId?: string;
  materialDeltas: string[];
  dissent: Array<{ topic: string; position: string; evidence: string[]; resolutionOwner?: string; providerReceipt?: string }>;
  decisions?: Array<{ topic: string; position: string }>;
  alternatives?: Array<{ topic: string; option: string; disposition: 'retain' | 'reject' | 'defer'; basis: string }>;
  evidence?: string[];
  unresolvedAssumptions?: string[];
  revision?: string;
  responsibility?: ConferenceResponsibility;
}
export interface ConferenceExchangeReceipt {
  receiptId: string;
  round: number;
  participantId: string;
  family: ModelFamily;
  responsibility: ConferenceResponsibility;
  providerReceipt: string;
  decisions: Array<{ topic: string; position: string }>;
  alternatives: Array<{ topic: string; option: string; disposition: 'retain' | 'reject' | 'defer'; basis: string }>;
  disagreements: Array<{ topic: string; position: string; evidence: string[]; resolved: boolean }>;
  evidence: string[];
  unresolvedAssumptions: string[];
  revision: string;
}
export interface ConferenceResolutionReceipt {
  receiptId: string;
  lead: ConferenceRoleAssignment;
  exchanges: string[];
  decisions: Array<{ topic: string; position: string }>;
  alternatives: ConferenceExchangeReceipt['alternatives'];
  disagreements: ConferenceExchangeReceipt['disagreements'];
  evidence: string[];
  unresolvedAssumptions: string[];
  converged: boolean;
}
export interface FixedPointResult { converged: boolean; rounds: Array<{ index: number; critiques: Critique[]; materialDeltas: string[] }>; dissent: Critique['dissent']; blocker?: string; }

const digest = (value: unknown) => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const safeRead = (path: string) => readFileSync(path).toString();

function walk(root: string, max = 4000): string[] {
  const output: string[] = [];
  const queue = [root];
  while (queue.length && output.length < max) {
    const current = queue.shift()!;
    for (const name of readdirSync(current).sort()) {
      if (['.git', 'node_modules', '.wrangler', 'dist', 'coverage'].includes(name)) continue;
      const candidate = join(current, name);
      const stat = lstatSync(candidate);
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) queue.push(candidate); else output.push(candidate);
    }
  }
  return output;
}

export function inventoryRepository(checkout: string, sourceRevision = 'working-tree'): EstateInventory {
  const root = resolve(checkout);
  const files = walk(root);
  const entries: InventoryEntry[] = [];
  const add = (domain: EvidenceDomain, path: string) => entries.push({ domain, path: relative(root, path), digest: digest(safeRead(path)), kind: 'file', provenance: `file://${path}` });
  for (const path of files) {
    const rel = relative(root, path);
    if (/(^|\/)(AGENTS|CLAUDE|CODEX|GEMINI)\.md$/i.test(rel)) add('repository-instructions', path);
    else if (rel.startsWith('openspec/') || /architecture|design/i.test(basename(path))) add('openspec-architecture', path);
    else if (/(^|\/)(test|tests|src|app|packages|lib)(\/|$)/.test(rel)) add('source-tests', path);
    else if (/wrangler|cloudflare|deploy|workflow|docker|terraform/i.test(rel)) add('deployment', path);
    else if (/^(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|deno\.json|pyproject\.toml)$/.test(rel)) add('dependencies', path);
  }
  const declarations = files.filter((path) => /\.(md|json|ya?ml|toml|ts|js)$/.test(path)).flatMap((path) => {
    let text = ''; try { text = safeRead(path); } catch { return []; }
    return ['theme.tools', 'ui.theme.tools'].filter((name) => text.includes(name)).map((name) => ({ name, path }));
  });
  const sharedServices = [...new Map(declarations.map(({ name, path }) => [name, { name, path }])).values()].map(({ name, path }) => {
    const sibling = resolve(root, '..', name);
    const resolved = existsSync(sibling);
    if (resolved) entries.push({ domain: 'shared-estate', path: sibling, digest: digest(walk(sibling, 200).map((p) => relative(sibling, p))), kind: 'directory', provenance: `file://${sibling}` });
    else entries.push({ domain: 'shared-estate', path: name, digest: digest(name), kind: 'external-gap', provenance: relative(root, path) });
    return { name, declaredBy: relative(root, path), ...(resolved ? { localPath: sibling } : {}), status: resolved ? 'resolved' as const : 'external-gap' as const };
  });
  return { checkout: root, sourceRevision, entries, sharedServices };
}

export async function executeResearch(requests: ResearchRequest[], rail: ResearchRail, now = Date.now(), freshnessMs = 30 * 86400_000, approvedRails?: ReadonlySet<string>): Promise<ResearchReceipt[]> {
  const receipts: ResearchReceipt[] = [];
  for (const request of requests) {
    if (!request.query.trim() || request.budget < 1) throw new Error('Research requires a non-empty query and positive budget');
    const result = await rail(request);
    if (!/^approved:[a-z0-9][a-z0-9-]{1,63}$/i.test(result.rail) || (approvedRails && !approvedRails.has(result.rail))) throw new Error(`Unapproved research rail: ${result.rail}`);
    const byUrl = new Map<string, ResearchFinding>();
    for (const finding of result.findings) {
      let url: URL; try { url = new URL(finding.url); } catch { throw new Error(`Invalid research URL: ${finding.url}`); }
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error(`Untrusted research URL: ${finding.url}`);
      url.hash = ''; const normalizedUrl = url.toString();
      const observedAt = Date.parse(finding.observedAt);
      const publishedAt = finding.publishedAt ? Date.parse(finding.publishedAt) : undefined;
      if (!finding.title.trim() || !finding.excerpt.trim() || Number.isNaN(observedAt) || observedAt > now + 5 * 60_000) throw new Error(`Invalid research finding: ${finding.url}`);
      if (publishedAt !== undefined && (Number.isNaN(publishedAt) || publishedAt > now + 5 * 60_000)) throw new Error(`Invalid publication date: ${finding.url}`);
      const allowedTypes = request.domain === 'primary-sources' ? new Set(['primary']) : new Set(['competitor', 'substitute']);
      if (!allowedTypes.has(finding.sourceType)) throw new Error(`Source type ${finding.sourceType} cannot satisfy ${request.domain}`);
      const normalized = { ...finding, url: normalizedUrl };
      const prior = byUrl.get(normalizedUrl);
      if (prior && (prior.excerpt !== normalized.excerpt || prior.sourceType !== normalized.sourceType)) throw new Error(`Conflicting duplicate research evidence: ${normalizedUrl}`);
      byUrl.set(normalizedUrl, normalized);
    }
    const findings = [...byUrl.values()].slice(0, request.budget);
    const stale = findings.filter((finding) => now - Date.parse(finding.observedAt) > freshnessMs || Date.parse(finding.observedAt) > now);
    if (!findings.length || stale.length) throw new Error(stale.length ? `Stale research evidence: ${stale.map((f) => f.url).join(', ')}` : `Research returned no cited evidence for ${request.domain}`);
    const conflicts = [...new Set((result.conflicts ?? []).map((conflict) => conflict.trim()).filter(Boolean))];
    const cache = { hit: result.cacheHit ?? false, key: digest(request), freshnessMs };
    const coverage = { requestedDomain: request.domain, citedSources: findings.length, budget: request.budget, satisfied: findings.length > 0 };
    const base = { request, rail: result.rail, findings, conflicts, coverage, cache };
    receipts.push({ ...base, digest: digest(base) });
  }
  return receipts;
}

export function evaluateSaturation(inventory: EstateInventory, research: ResearchReceipt[], required: EvidenceDomain[], dispositions: Partial<Record<EvidenceDomain, { status: 'irrelevant' | 'externally-blocked'; reason: string; independentPrerequisitesComplete?: boolean }>> = {}, conflictDispositions: ResearchConflictDisposition[] = []): SaturationResult {
  const rows = required.map((domain): SaturationDisposition => {
    const evidence = domain === 'primary-sources' || domain === 'competitors-substitutes'
      ? research.filter((r) => r.request.domain === domain).map((r) => r.digest)
      : inventory.entries.filter((e) => e.domain === domain && e.kind !== 'external-gap').map((e) => e.digest);
    if (evidence.length) return { domain, status: 'satisfied', evidence };
    const explicit = dispositions[domain];
    if (explicit?.status === 'externally-blocked' && !explicit.independentPrerequisitesComplete) {
      return { domain, status: 'missing', evidence: [], reason: `External blocker is incomplete: independent prerequisites were not proven; ${explicit.reason}` };
    }
    if (explicit) return { domain, status: explicit.status, evidence: [], reason: explicit.reason };
    return { domain, status: 'missing', evidence: [], reason: `No current evidence for ${domain}` };
  });
  const resolvedConflicts = new Set(conflictDispositions.filter((row) => row.resolution.trim() && row.evidence.length > 0).map((row) => row.conflict));
  const conflictBlockers = research.flatMap((receipt) => receipt.conflicts).filter((conflict) => !resolvedConflicts.has(conflict)).map((conflict) => `unresolved research conflict: ${conflict}`);
  const blockers = [...rows.filter((row) => row.status === 'missing' || row.status === 'externally-blocked').map((row) => `${row.domain}: ${row.reason}`), ...conflictBlockers];
  const base = { ready: blockers.length === 0, dispositions: rows, blockers };
  return { ...base, digest: digest(base) };
}

export async function invokeProviderCritiqueRound(
  round: number,
  briefs: StructuredBrief[],
  prior: Critique[],
  participants: Specialist[],
  launcher: ProviderLauncher,
  now = new Date().toISOString(),
  roleAssignments = assignConferenceResponsibilities(participants),
): Promise<{ critiques: Critique[]; receipts: Array<ProviderReceipt & { participantId: string; receiptDigest: string }>; exchanges: ConferenceExchangeReceipt[] }> {
  if (!roleAssignments.length) throw new Error('Conference requires at least one capability-backed responsibility assignment');
  const results = await Promise.all(roleAssignments.map(async (assignment) => {
    const participant = participants.find((item) => item.id === assignment.participantId);
    if (!participant || participant.family !== assignment.family) throw new Error(`Missing capability-backed participant for ${assignment.participantId}`);
    const input = JSON.stringify({
      instruction: 'Independently challenge the peer briefs from your assigned responsibility, revise your recommendation, and return only one JSON object with family (copy participant.family), materialDeltas (string array), dissent (array), and revision (string). Use empty arrays when there are no material deltas or dissent. Include decisions, alternatives with dispositions, evidence references, and unresolved assumptions in revision. Preserve material dissent.',
      round,
      participant,
      responsibility: assignment.responsibility,
      briefs,
      prior,
    });
    const result = await launcher(participant.family, input);
    if (!result.launcher.startsWith('approved:')) throw new Error(`Unapproved critique launcher for ${participant.id}`);
    const critique = JSON.parse(result.output) as Critique;
    if (critique.family !== participant.family || !Array.isArray(critique.materialDeltas) || !Array.isArray(critique.dissent)) throw new Error(`Invalid critique from ${participant.id}`);
    critique.participantId = participant.id;
    critique.responsibility = assignment.responsibility;
    const receipt = { family: participant.family, participantId: participant.id, launcher: result.launcher, inputDigest: digest(input), outputDigest: digest(result.output), invokedAt: now };
    const receiptDigest = digest(receipt);
    for (const dissent of critique.dissent) {
      if (dissent.providerReceipt && dissent.providerReceipt !== receiptDigest) throw new Error(`Dissent resolution is not bound to the approved provider call for ${participant.id}`);
      if (dissent.resolutionOwner?.trim()) dissent.providerReceipt = receiptDigest;
    }
    const disagreements = critique.dissent.map((item) => ({ topic: item.topic, position: item.position, evidence: item.evidence, resolved: Boolean(item.resolutionOwner?.trim() && item.providerReceipt?.trim()) }));
    const exchangeBase = {
      round,
      participantId: participant.id,
      family: participant.family,
      responsibility: assignment.responsibility,
      providerReceipt: receiptDigest,
      decisions: critique.decisions ?? [],
      alternatives: critique.alternatives ?? [],
      disagreements,
      evidence: [...new Set([...(critique.evidence ?? []), ...critique.dissent.flatMap((item) => item.evidence)])],
      unresolvedAssumptions: critique.unresolvedAssumptions ?? [],
      revision: critique.revision?.trim() || (critique.materialDeltas.length ? critique.materialDeltas.join('; ') : 'No material revision'),
    };
    return { critique, receipt: { ...receipt, receiptDigest }, exchange: { ...exchangeBase, receiptId: digest(exchangeBase) } };
  }));
  if (new Set(results.map((row) => row.receipt.inputDigest)).size !== results.length) throw new Error('Critique invocations must have distinct provider inputs');
  return { critiques: results.map((row) => row.critique), receipts: results.map((row) => row.receipt), exchanges: results.map((row) => row.exchange) };
}

export async function invokeIndependentBriefs(
  saturation: SaturationResult,
  evidenceBundle: unknown,
  launcher: ProviderLauncher,
  now = new Date().toISOString(),
  capabilityPlan?: ConferenceCapabilityPlan,
): Promise<{ briefs: StructuredBrief[]; receipts: ProviderReceipt[]; execution: { mode: ConferenceExecutionMode; independent: boolean; limitation?: string; assignments: ConferenceRoleAssignment[] } }> {
  if (!saturation.ready) throw new Error(`Conference blocked by saturation gate: ${saturation.blockers.join('; ')}`);
  const bundle = JSON.stringify({ saturation, evidenceBundle });
  const plan = capabilityPlan ?? planConferenceCapabilities(
    (['claude', 'codex', 'gemini'] as ModelFamily[]).map((family) => ({ family, available: true, slots: 1, evidence: 'legacy-default-three-family' })),
    (['claude', 'codex', 'gemini'] as ModelFamily[]).map((family) => ({ id: `${family}-provider`, family, expertise: [], architectEligible: family === 'codex' })),
  );
  const briefAssignments = plan.mode === 'sequential-single-agent'
    ? [plan.assignments.find((assignment) => assignment.responsibility === 'lead-resolution')!]
    : plan.assignments;
  const invoke = async (assignment: ConferenceRoleAssignment, sequence: number) => {
    const family = assignment.family;
    const input = `Produce a ${assignment.responsibility} conference brief as ${family}. Do not claim model independence beyond the supplied capability plan. Return only a JSON object with family set to "${family}", summary (string), recommendations (string array), risks (string array), and decisions (array of objects with topic, position, and material boolean).\nCAPABILITY:${JSON.stringify({ mode: plan.mode, independent: plan.independent, limitation: plan.limitation, sequence })}\nEVIDENCE:${bundle}`;
    const result = await launcher(family, input);
    if (!result.launcher.startsWith('approved:')) throw new Error(`Unapproved provider launcher for ${family}`);
    const parsed = JSON.parse(result.output) as StructuredBrief;
    if (parsed.family !== family || !parsed.summary || !Array.isArray(parsed.decisions)) throw new Error(`Invalid ${family} structured brief`);
    const capability = plan.capabilities.find((item) => item.family === family)!;
    return {
      brief: { ...parsed, responsibility: assignment.responsibility, provenance: { mode: plan.mode, providerFamily: family, independent: plan.independent, sequence, capabilityEvidence: capability.evidence } },
      receipt: { family, launcher: result.launcher, inputDigest: digest(input), outputDigest: digest(result.output), invokedAt: now },
    };
  };
  const results: Array<Awaited<ReturnType<typeof invoke>>> = [];
  if (plan.mode === 'sequential-single-agent') {
    for (const [index, assignment] of briefAssignments.entries()) results.push(await invoke(assignment, index + 1));
  } else {
    results.push(...await Promise.all(briefAssignments.map((assignment, index) => invoke(assignment, index + 1))));
  }
  return { briefs: results.map((r) => r.brief), receipts: results.map((r) => r.receipt), execution: { mode: plan.mode, independent: plan.independent, ...(plan.limitation ? { limitation: plan.limitation } : {}), assignments: plan.assignments } };
}

function seeded(seed: string, value: string) { return parseInt(digest(`${seed}:${value}`).slice(0, 8), 16); }
export function selectConferenceRoster(seed: string, prompt: string, candidates: Specialist[]): ConferenceRoster {
  const words = new Set(prompt.toLowerCase().split(/\W+/).filter(Boolean));
  const relevant = candidates.filter((candidate) => candidate.expertise.some((skill) => [...words].some((word) => skill.toLowerCase().includes(word) || word.includes(skill.toLowerCase()))));
  const pool = relevant.length ? relevant : candidates.filter((c) => c.id.includes('architect'));
  const base = [...pool].sort((a, b) => seeded(seed, a.id) - seeded(seed, b.id));
  const selected: Specialist[] = [];
  for (const family of ['claude', 'codex', 'gemini'] as ModelFamily[]) {
    const candidate = base.find((item) => item.family === family && !selected.includes(item));
    if (candidate) selected.push(candidate);
  }
  for (const candidate of base) if (selected.length < Math.min(6, Math.max(3, pool.length)) && !selected.includes(candidate)) selected.push(candidate);
  const highRisk = /\b(auth|security|payment|billing|destructive|migration|tenant|credential|architecture)\b/i.test(prompt);
  const architects = selected.filter((item) => item.architectEligible);
  if (highRisk && architects.length < 2) {
    const second = base.find((item) => item.architectEligible && !selected.includes(item));
    if (second) selected.push(second);
  }
  const secondArchitect = selected.filter((item) => item.architectEligible).length >= 2;
  if (highRisk && !secondArchitect) throw new Error('High-risk conference requires a second eligible architect');
  return { seed, participants: selected, secondArchitect, reasons: [highRisk ? 'high-risk-scope' : 'domain-and-diversity', ...(highRisk && !secondArchitect ? ['missing-required-second-architect'] : [])], diversity: { families: new Set(selected.map((p) => p.family)).size, expertise: new Set(selected.flatMap((p) => p.expertise)).size } };
}

export function assignConferenceResponsibilities(participants: Specialist[]): ConferenceRoleAssignment[] {
  const lead = participants.find((participant) => participant.family === 'codex');
  if (!lead) throw new Error('Codex-led conference requires a Codex lead participant');
  const independent = participants.filter((participant) => participant.id !== lead.id);
  const product = independent.find((participant) => participant.expertise.some((item) => /product|journey|user|completeness|market/i.test(item))) ?? independent[0];
  const architecture = independent.find((participant) => participant.id !== product?.id && participant.expertise.some((item) => /architect|security|verification|test|reliability/i.test(item)))
    ?? independent.find((participant) => participant.id !== product?.id);
  if (!product || !architecture) throw new Error('Conference requires independent product/completeness and architecture/verification reviewers');
  const assignments: ConferenceRoleAssignment[] = [
    { participantId: lead.id, family: lead.family, responsibility: 'lead-resolution' },
    { participantId: product.id, family: product.family, responsibility: 'product-completeness' },
    { participantId: architecture.id, family: architecture.family, responsibility: 'architecture-verification' },
  ];
  for (const participant of participants) {
    if (!assignments.some((assignment) => assignment.participantId === participant.id)) assignments.push({ participantId: participant.id, family: participant.family, responsibility: 'architecture-verification' });
  }
  return assignments;
}

export function planConferenceCapabilities(capabilities: ProviderSlotCapability[], participants: Specialist[]): ConferenceCapabilityPlan {
  const available = capabilities.filter((capability) => capability.available && capability.slots > 0 && participants.some((participant) => participant.family === capability.family));
  const codex = available.find((capability) => capability.family === 'codex');
  const codexParticipant = participants.find((participant) => participant.family === 'codex');
  if (!codex || !codexParticipant) throw new Error('Codex-led conference requires an available Codex capability and participant');
  const families = new Set(available.map((capability) => capability.family));
  const totalSlots = available.reduce((sum, capability) => sum + capability.slots, 0);
  if (families.size >= 3 && totalSlots >= 3) return { mode: 'independent-three-family', capabilities, assignments: assignConferenceResponsibilities(participants.filter((participant) => families.has(participant.family))), independent: true };
  const other = participants.find((participant) => participant.family !== 'codex' && families.has(participant.family));
  if (other && totalSlots >= 2) {
    return {
      mode: 'two-agent', capabilities, independent: true,
      assignments: [
        { participantId: codexParticipant.id, family: 'codex', responsibility: 'lead-resolution' },
        { participantId: other.id, family: other.family, responsibility: 'product-completeness' },
        { participantId: codexParticipant.id, family: 'codex', responsibility: 'architecture-verification' },
      ],
      limitation: 'Two independent agents are available; the Codex lead also owns architecture/verification.',
    };
  }
  if (totalSlots >= 2) {
    return {
      mode: 'combined-role', capabilities, independent: false,
      assignments: [
        { participantId: codexParticipant.id, family: 'codex', responsibility: 'lead-resolution' },
        { participantId: codexParticipant.id, family: 'codex', responsibility: 'product-completeness' },
        { participantId: codexParticipant.id, family: 'codex', responsibility: 'architecture-verification' },
      ],
      limitation: 'One provider family supplies multiple slots; role separation is procedural, not independent model evidence.',
    };
  }
  return {
    mode: 'sequential-single-agent', capabilities, independent: false,
    assignments: [
      { participantId: codexParticipant.id, family: 'codex', responsibility: 'lead-resolution' },
      { participantId: codexParticipant.id, family: 'codex', responsibility: 'product-completeness' },
      { participantId: codexParticipant.id, family: 'codex', responsibility: 'architecture-verification' },
    ],
    limitation: 'Only one approved provider slot is available; responsibilities run sequentially and are not independent evidence.',
  };
}

export function discoverProviderSlotCapabilities(snapshot: ProviderCapabilitySnapshot, slotLimits: Partial<Record<ModelFamily, number>> = {}): ProviderSlotCapability[] {
  return (['claude', 'codex', 'gemini'] as ModelFamily[]).map((family) => {
    const observed = snapshot[family];
    const available = observed?.available === true || (observed?.installed === true && observed?.authenticated === true);
    return {
      family,
      available,
      slots: available ? Math.max(1, Math.floor(slotLimits[family] ?? 1)) : 0,
      evidence: `provider-capability-snapshot:${family}:installed=${observed?.installed === true}:authenticated=${observed?.authenticated === true}:available=${observed?.available === true}`,
    };
  });
}

export function classifyConferenceRisk(prompt: string): ConferenceRiskCategory[] {
  const categories: ConferenceRiskCategory[] = [];
  if (/\b(auth(?:entication|orization)?|security|credential|tenant isolation|privacy)\b/i.test(prompt)) categories.push('auth-security');
  if (/\b(payment|billing|charge|refund|invoice|subscription)\b/i.test(prompt)) categories.push('payments');
  if (/\b(destructive|delete|drop|purge|erase|force[- ]?push|irreversible)\b/i.test(prompt)) categories.push('destructive-operation');
  if (/\b(external authority|send (?:an )?email|publish|purchase|buy|sign contract|contact customer|create credential|production account)\b/i.test(prompt)) categories.push('external-authority');
  return categories;
}

export function evaluateConferenceRiskGate(prompt: string, review: ConferenceRiskReview | undefined, plan: ConferenceCapabilityPlan): ConferenceRiskGateReceipt {
  const categories = classifyConferenceRisk(prompt);
  const blockers: string[] = [];
  if (categories.length) {
    if (!review?.authorized || !review.authorityEvidence.trim()) blockers.push('explicit authority evidence is required');
    for (const category of categories) if (!review?.grantedScopes.includes(category)) blockers.push(`authority scope is missing: ${category}`);
    if (!review?.passed || !review.evidence.length) blockers.push('attributable risk review evidence is required');
    const reviewerFamilies = new Set(review?.reviewerFamilies ?? []);
    if (!plan.independent || reviewerFamilies.size < 2) blockers.push('high-risk work requires independent verification from two provider families');
  }
  const base = {
    categories,
    decision: blockers.length ? 'block' as const : 'allow' as const,
    blockers,
    authorityEvidence: review?.authorityEvidence ?? '',
    reviewerFamilies: [...new Set(review?.reviewerFamilies ?? [])],
    evidence: review?.evidence ?? [],
  };
  return { ...base, receiptId: digest(base) };
}

export function resolveCodexLedConference(assignments: ConferenceRoleAssignment[], exchanges: ConferenceExchangeReceipt[], converged: boolean): ConferenceResolutionReceipt {
  const lead = assignments.find((assignment) => assignment.responsibility === 'lead-resolution' && assignment.family === 'codex');
  if (!lead) throw new Error('Codex lead resolution assignment is required');
  const reviewerResponsibilities = new Set(assignments.map((assignment) => assignment.responsibility));
  if (!reviewerResponsibilities.has('product-completeness') || !reviewerResponsibilities.has('architecture-verification')) throw new Error('Both conference review responsibilities are required');
  const decisions = exchanges.flatMap((exchange) => exchange.decisions);
  const alternatives = exchanges.flatMap((exchange) => exchange.alternatives);
  const disagreements = exchanges.flatMap((exchange) => exchange.disagreements);
  const evidence = [...new Set(exchanges.flatMap((exchange) => exchange.evidence))];
  const unresolvedAssumptions = [...new Set(exchanges.flatMap((exchange) => exchange.unresolvedAssumptions))];
  const base = { lead, exchanges: exchanges.map((exchange) => exchange.receiptId), decisions, alternatives, disagreements, evidence, unresolvedAssumptions, converged };
  return { ...base, receiptId: digest(base) };
}

export async function convergeArchitecture(briefs: StructuredBrief[], critique: (round: number, briefs: StructuredBrief[], prior: Critique[]) => Promise<Critique[]>, maxRounds = 4): Promise<FixedPointResult> {
  if (!briefs.length) throw new Error('Fixed point requires at least one capability-backed brief');
  const rounds: FixedPointResult['rounds'] = [];
  const dissentLedger = new Map<string, Critique['dissent'][number]>();
  let prior: Critique[] = [];
  for (let index = 1; index <= maxRounds; index++) {
    const critiques = await critique(index, briefs, prior);
    if (!critiques.length) throw new Error('Every critique round requires at least one capability-backed critique');
    const responsibilities = new Set(critiques.map((item) => item.responsibility).filter(Boolean));
    if (responsibilities.size > 0 && !(['lead-resolution', 'product-completeness', 'architecture-verification'] as ConferenceResponsibility[]).every((role) => responsibilities.has(role))) throw new Error('Every critique round must cover all conference responsibilities');
    const materialDeltas = [...new Set(critiques.flatMap((item) => item.materialDeltas).filter(Boolean))];
    for (const item of critiques.flatMap((entry) => entry.dissent)) dissentLedger.set(`${item.topic}:${item.position}`, item);
    rounds.push({ index, critiques, materialDeltas });
    const unresolvedDissent = [...dissentLedger.values()].filter((item) => !item.resolutionOwner?.trim() || !item.providerReceipt?.trim());
    if (!materialDeltas.length && !unresolvedDissent.length) return { converged: true, rounds, dissent: [...dissentLedger.values()] };
    prior = critiques;
  }
  return { converged: false, rounds, dissent: [...dissentLedger.values()], blocker: `Architecture retained material deltas or unresolved dissent after ${maxRounds} rounds; OpenSpec compilation is blocked` };
}
