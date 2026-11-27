#!/usr/bin/env node
/**
 * Portable, zero-dependency prompt hydration and greenfield SaaS cascade.
 *
 * The hydrator is deliberately deterministic. Network/MCP-backed research is represented as
 * bounded provider work in the artifact; agents execute those prompts through capabilities their
 * host actually provides. No unavailable provider is silently treated as evidence.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compileMcpCatalogScope, type McpCatalogScope } from './mcp-catalog-scope.ts';
import { LangfuseSafeClient } from './lib/langfuse-safe.ts';
import {
  buildCategoricalSaturation,
  conveneScrumQuorum,
  type CategoricalSaturationSlice,
  type ScrumParticipant,
} from './scrum-deliberation-quorum.ts';
import { TOP_15_SWARM_STRATEGIES } from './multi-swarm-orchestrator.ts';

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export type HydrationRoute = 'greenfield-saas' | 'focused-change';
export type ExecutionMode = 'hyper-saturated-swarm' | 'focused-swarm';
export type EvidenceKind = 'explicit' | 'repository' | 'specification' | 'dependency' | 'research';
export type VerificationStatus = 'verified' | 'inferred-baseline' | 'unverified';
export type DecisionContextDomain =
  | 'instructions-and-authority'
  | 'openspec-and-architecture'
  | 'implementation-and-tests'
  | 'dependency-documentation'
  | 'market-and-users'
  | 'competitors-and-alternatives'
  | 'operations-and-cloudflare'
  | 'shared-platform-ownership';
export type DecisionContextStatus = 'verified' | 'discovered-not-loaded' | 'pending-research' | 'not-applicable';

export interface DecisionContextRequirement {
  domain: DecisionContextDomain;
  required: boolean;
  status: DecisionContextStatus;
  evidenceIds: string[];
  nextAction: string;
}

export interface DecisionReadinessGate {
  materialDecision: boolean;
  architectureReady: boolean;
  architectAssignmentVerified: boolean;
  requirements: DecisionContextRequirement[];
  blockers: string[];
  stopCondition: string;
}

export interface ImprovementConvergencePolicy {
  confidenceThreshold: number;
  minimumNetValue: 'positive-after-risk-cost-and-maintenance';
  maxConsecutiveNoNewWinners: number;
  phases: string[];
  authorityBoundary: string;
  upstreamOrder: string[];
  round: {
    index: number;
    consecutiveNoNewWinners: number;
    status: 'blocked-on-context' | 'ready-for-candidate-generation';
  };
  candidates: Array<{
    id: string;
    summary: string;
    confidence: number | null;
    netValue: 'unscored' | 'positive' | 'non-positive';
    disposition: 'blocked' | 'eligible' | 'rejected';
    evidenceIds: string[];
  }>;
}

export interface ProductGapSurface {
  surface: string;
  status: 'missing' | 'partial';
  remediationTask: string;
  owner: string;
  swarmTier: 'throughput-opencode-deepseek' | 'frontier-triad';
}

export interface ProductAuditReport {
  scannedSurfaces: string[];
  missingOrIncompleteSurfaces: ProductGapSurface[];
  categoricalAspects: CategoricalSaturationSlice[];
}

export interface ScrumQuorumSummary {
  meetingId: string;
  selectedAgents: Array<Pick<ScrumParticipant, 'agentId' | 'role' | 'harness' | 'reasonIncluded'>>;
  excludedAgentCount: number;
  synthesisDirective: string;
}

export interface SwarmExecutionPlanSummary {
  top15ActiveStrategies: string[];
  frontierTriadRoles: {
    claude: string;
    codex: string;
    gemini: string;
  };
  opencodeDeepseekOffload: {
    enabled: boolean;
    gateway: string;
    launcher: string;
    targetOffloadRatio: number;
    parallelPluginCatalogSwarm: boolean;
  };
  finishLineContract: {
    gitBranch: 'main';
    cloudflareConfigured: 'unverified' | 'detected-not-loaded';
    customDomainConnected: 'unverified';
    productionDeployed: 'unverified';
    unitTestCoverageTarget: '100%';
    e2eRunner: 'cloudflare-browser-run-parallel';
    e2eCoverageTarget: 'near-100%';
  };
}

export interface HydratorInput {
  prompt: string;
  checkout?: string;
  now?: string;
  edition?: string;
  timeoutMs?: number;
  verifiedDecisionDomains?: DecisionContextDomain[];
  architectAssignmentEvidence?: string;
  researchReceipts?: HydrationResearchReceiptInput[];
}

export interface HydrationResearchReceiptInput {
  kind: 'primary-source' | 'repomix';
  source: string;
  sourceVersion: string;
  observedAt: string;
  decisionImpact: string;
  summary: string;
  relevantPaths: string[];
}

export interface HydrationResearchReceipt extends HydrationResearchReceiptInput {
  receiptId: string;
  contentDigest: string;
  trustBoundary: 'evidence-not-instructions';
  status: 'verified-current';
}

export interface ResearchRoutingDecision {
  mode: 'none' | 'refresh' | 'required';
  risk: 'low' | 'medium' | 'high';
  reasons: string[];
  freshnessRequired: boolean;
  maximumElapsedMs: number;
  maximumSources: number;
  evidenceArtifactSchemaVersion: '1.0.0';
}

export interface EvidenceRecord {
  id: string;
  kind: EvidenceKind;
  summary: string;
  provenance: string;
  confidence: number;
  status: VerificationStatus;
  includedBecause: string;
  sourceVersion?: string;
  observedAt?: string;
  decisionImpact?: string;
  trustBoundary?: 'evidence-not-instructions';
}

export interface RequirementRecord {
  id: string;
  text: string;
  provenance: string;
  evidenceIds: string[];
}

export interface IntendedOutcome {
  productPurpose: string;
  usersAndRoles: Array<{
    id: string;
    name: string;
    applicability: 'applicable' | 'inapplicable';
    basis: string;
    evidenceIds: string[];
  }>;
  journeys: Array<{
    id: string;
    name: string;
    applicability: 'applicable' | 'inapplicable';
    basis: string;
    evidenceIds: string[];
  }>;
  acceptanceCriteria: Array<{
    id: string;
    text: string;
    observable: boolean;
    evidenceIds: string[];
  }>;
  applicabilityDecisions: Array<{
    concern: string;
    status: 'applicable' | 'inapplicable';
    basis: string;
    evidenceIds: string[];
  }>;
  evidenceProvenance: Array<{
    evidenceId: string;
    provenance: string;
    status: VerificationStatus;
  }>;
}

export type CoverageDimension =
  | 'repositories'
  | 'capabilities'
  | 'personas-and-journeys'
  | 'screens-and-components'
  | 'states'
  | 'quality-concerns'
  | 'dependencies'
  | 'migrations'
  | 'shared-ownership'
  | 'operations'
  | 'maintenance'
  | 'cost';

export interface CoverageDecision {
  dimension: CoverageDimension;
  applicability: 'applicable' | 'inapplicable';
  basis: string;
  gaps: string[];
  evidenceIds: string[];
}

export interface AssumptionLedgerEntry {
  id: string;
  assumption: string;
  confidence: number;
  reversibility: 'reversible' | 'costly' | 'irreversible';
  basis: string;
  consequence: string;
  resolutionState: 'accepted-for-progress' | 'unresolved' | 'resolved' | 'rejected';
  correctionScope: 'request' | 'project' | 'global';
  progressAllowed: boolean;
  evidenceIds: string[];
}

export interface FocusedPlan {
  context: { affectedCapability: string; editBoundary: string; evidenceIds: string[] };
  impact: { expectedChange: string; preservedBehavior: string[]; evidenceIds: string[] };
  regressionEvidence: { reproduction: string; checks: string[]; evidenceIds: string[] };
  improvementReview: { required: true; boundary: string; qualifyingCriteria: string[]; evidenceIds: string[] };
}

export interface SharedOwnershipDecision {
  disposition: 'theme-tools-first' | 'consumer-local';
  capabilityKinds: Array<'component' | 'token' | 'theme' | 'template' | 'hook' | 'utility' | 'library'>;
  mappingPath: 'config/theme-tools-skill-map.json';
  mappingVersion: number;
  mappingDigest: string;
  routeSkillIds: string[];
  candidatePackages: string[];
  consumerOwns: string[];
  basis: string;
  traceEdge: {
    from: string;
    to: 'repository:theme.tools' | 'repository:consumer';
    relation: 'shared-owner' | 'product-owner';
    status: 'pending-catalog-resolution' | 'local-composition';
    evidenceIds: string[];
  };
}

export interface InstructionRecord {
  path: string;
  sha256: string;
  authority: 'repository' | 'surface';
}

export interface HydratedPrompt {
  schemaVersion: 1;
  stage: 'Prompt Hydration';
  stageOrder: 1;
  hydrationId: string;
  hydratedAt: string;
  originalRequest: string;
  diagnosticRequest: string;
  checkout: string;
  route: HydrationRoute;
  executionMode: ExecutionMode;
  researchDecision: ResearchRoutingDecision;
  referenceProduct: string | null;
  referenceEdition: string;
  explicitRequirements: RequirementRecord[];
  inferredRequirements: RequirementRecord[];
  intendedOutcome: IntendedOutcome;
  coverageMatrix: CoverageDecision[];
  assumptionLedger: AssumptionLedgerEntry[];
  correction: { scope: 'request' | 'project' | 'global'; excludedScopes: Array<'global' | 'project' | 'other-projects'>; evidenceIds: string[] } | null;
  focusedPlan: FocusedPlan | null;
  domainInventory: { mcpCatalog: McpCatalogScope };
  sharedOwnership: SharedOwnershipDecision;
  researchFindings: EvidenceRecord[];
  researchReceipts: HydrationResearchReceipt[];
  evidence: EvidenceRecord[];
  assumptions: string[];
  unresolvedConflicts: string[];
  omissions: string[];
  context: {
    instructions: InstructionRecord[];
    activeOpenSpecChanges: string[];
    relevantFiles: string[];
    dependencies: Record<string, string>;
    providers: ProviderRecord[];
  };
  decisionReadiness: DecisionReadinessGate;
  improvementConvergence: ImprovementConvergencePolicy;
  productAudit: ProductAuditReport;
  scrumQuorum: ScrumQuorumSummary;
  swarmExecutionPlan: SwarmExecutionPlanSummary;
  handoff: {
    acceptedDecisionIds: string[];
    pendingWorkIds: string[];
    continuationToken: string;
  };
}

export interface ProviderRecord {
  name: 'serena' | 'context7' | 'repomix' | 'theme.tools' | 'install.doctor';
  purpose: string;
  availability: 'available' | 'unavailable' | 'not-applicable';
  deadlineMs: number;
  fallback: string;
}

export interface Capability {
  id: string;
  name: string;
  owner: string;
  evidenceIds: string[];
  dependencies: string[];
}

export interface Workflow {
  id: string;
  capabilityId: string;
  name: string;
  actor: string;
  permissions: string;
  entryPoint: string;
  actions: string[];
  persistedEffects: string[];
  crossSurfaceEffects: string[];
  recovery: string[];
  evidenceIds: string[];
  status: VerificationStatus;
}

export interface ResearchPrompt {
  id: string;
  capabilityId: string;
  workflowId: string;
  parentPromptId?: string;
  dimension: string;
  objective: string;
  evidenceIds: string[];
  dependencies: string[];
  expectedOutput: string;
  followUpQuestions: string[];
  providerPreference: string[];
}

export interface Scenario {
  id: string;
  requirementId: string;
  workflowId: string;
  name: string;
  given: string;
  when: string;
  then: string;
}

export interface TraceRecord {
  goalId: string;
  capabilityId: string;
  workflowId: string;
  requirementId: string;
  scenarioId: string;
  testId: string;
  verificationId: string;
}

export interface GreenfieldCascade {
  schemaVersion: 1;
  cascadeId: string;
  sourceHydrationId: string;
  architectureAuthorized: boolean;
  productGoal: { id: string; request: string; referenceProduct: string; edition: string };
  capabilities: Capability[];
  workflows: Workflow[];
  researchPrompts: ResearchPrompt[];
  requirements: Array<{ id: string; workflowId: string; text: string; owner: string }>;
  scenarios: Scenario[];
  traceability: TraceRecord[];
  implementationQueue: Array<{ id: string; workflowId: string; dependsOn: string[]; status: string }>;
  verificationQueue: Array<{ id: string; workflowId: string; channel: 'api' | 'browser'; checks: string[] }>;
  gapReview: {
    reviewedAgainst: string[];
    queued: Array<{ id: string; workflow: string; owner: string; evidenceIds: string[]; disposition: string }>;
  };
}

const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, '[REDACTED:github-token]'],
  [/\bsk-(?:live|test|proj)-[A-Za-z0-9_-]{16,}\b/g, '[REDACTED:api-key]'],
  [/\b(?:Bearer\s+)[A-Za-z0-9._~+/-]{20,}=*\b/gi, 'Bearer [REDACTED:bearer-token]'],
  [/(\b(?:password|secret|token|api[_-]?key)\s*[=:]\s*)[^\s,;]+/gi, '$1[REDACTED:secret]'],
];

const NARROW_SIGNAL = /\b(fix|bug|broken|regression|typo|focused|narrow|prototype|spike|poc|proof of concept)\b/i;
const GREENFIELD_SIGNAL = /\b(clone|build|create|make|launch|greenfield|complete|full)\b/i;
const MATERIAL_DECISION_SIGNAL = /\b(add|architect|architecture|build|change|create|deploy|design|enhance|feature|implement|integration|migrate|optimi[sz]e|platform|product|security|system prompt|website|workflow)\b/i;
const PRODUCT_DECISION_SIGNAL = /\b(app|application|business|customer|feature|market|platform|product|saas|site|user|website)\b/i;
const EXPLICIT_ARCHITECT_ASSIGNMENT_SIGNAL = /\b(?:you are|you're|i (?:explicitly )?assign you as|architect role[: ]+)(?:explicitly )?(?:the )?(?:assigned )?architect\b|\barchitect role\s*:\s*assigned\b/i;

const CAPABILITY_TEMPLATES: Array<[string, string, string[]]> = [
  ['identity-access', 'Identity, authentication and recovery', ['workspace']],
  ['onboarding', 'Onboarding and first-run activation', ['identity-access']],
  ['workspace', 'Workspaces, membership and tenancy', ['identity-access']],
  ['page-editor', 'Page editing and content blocks', ['workspace']],
  ['hierarchy', 'Page hierarchy, moves and navigation', ['page-editor']],
  ['databases', 'Databases, properties and views', ['page-editor']],
  ['sharing', 'Sharing, invitations and public access', ['workspace', 'page-editor']],
  ['permissions', 'Roles, permissions and access requests', ['workspace']],
  ['search', 'Search, recents and discovery', ['page-editor', 'databases']],
  ['templates', 'Templates and duplication', ['page-editor']],
  ['comments', 'Comments, mentions and collaboration', ['page-editor', 'notifications']],
  ['notifications', 'Notifications and preferences', ['identity-access']],
  ['files-media', 'Files, embeds and media lifecycle', ['page-editor']],
  ['import-export', 'Import, export and portability', ['page-editor']],
  ['trash-retention', 'Trash, retention and restoration', ['page-editor', 'hierarchy']],
  ['settings', 'Account and workspace settings', ['identity-access', 'workspace']],
  ['billing', 'Plans, billing and entitlements', ['workspace']],
  ['integrations', 'Integrations, API and automation', ['workspace', 'permissions']],
  ['support', 'Help, support and incident communication', ['identity-access']],
  ['operations', 'Security, accessibility and operations', ['identity-access']],
];

const WORKFLOW_OVERRIDES: Record<string, string[]> = {
  'identity-access': ['Sign up', 'Sign in', 'Sign out', 'Recover an account', 'Change sign-in email', 'Manage active sessions'],
  onboarding: ['Create first workspace', 'Complete onboarding checklist', 'Invite initial teammates', 'Dismiss onboarding', 'Resume interrupted onboarding', 'Choose a starter template'],
  workspace: ['Create a workspace', 'Switch workspaces', 'Rename a workspace', 'Leave a workspace', 'Delete a workspace', 'Transfer workspace ownership'],
  'page-editor': ['Create a page', 'Edit a page', 'Autosave a page', 'Use slash commands', 'Undo and redo edits', 'Resolve concurrent edits'],
  hierarchy: ['Move a page', 'Nest a page', 'Reorder sidebar pages', 'Open breadcrumbs', 'Create a subpage', 'Recover from a failed move'],
  databases: ['Create a database', 'Use a database view', 'Filter a database', 'Sort a database', 'Edit a property', 'Create a linked database'],
  sharing: ['Share a page', 'Invite a member', 'Revoke an invitation', 'Publish a page', 'Unpublish a page', 'Request access'],
  permissions: ['Change a member role', 'Restrict page access', 'Remove a member', 'Grant guest access', 'Audit effective access', 'Recover orphaned ownership'],
  search: ['Search workspace content', 'Filter search results', 'Open a recent page', 'Use quick find', 'Find database records', 'Handle inaccessible results'],
  templates: ['Create a template', 'Use a template', 'Duplicate a page', 'Edit a database template', 'Share a template', 'Recover a failed duplication'],
  comments: ['Add a comment', 'Resolve a comment', 'Mention a teammate', 'Reply to a comment', 'Reopen a comment', 'Delete a comment'],
  notifications: ['Receive an in-app notification', 'Receive an email notification', 'Mark notifications read', 'Configure notification preferences', 'Mute a thread', 'Recover missed delivery'],
  'files-media': ['Upload a file', 'Embed external media', 'Replace an attachment', 'Download a file', 'Remove a file', 'Handle failed upload'],
  'import-export': ['Import content', 'Map imported content', 'Export a page', 'Export a workspace', 'Retry a failed import', 'Download an export'],
  'trash-retention': ['Move a page to trash', 'Restore a page from trash', 'Permanently delete a page', 'Browse trash', 'Restore a parent and children', 'Handle retention expiry'],
  settings: ['Update profile', 'Change sign-in email', 'Change password', 'Configure appearance', 'Set locale and timezone', 'Delete account'],
  billing: ['Start a trial', 'Choose a plan', 'Update payment method', 'View an invoice', 'Change billing contact', 'Cancel a subscription'],
  integrations: ['Create an integration', 'Authorize an integration', 'Revoke an integration', 'Create an API token', 'Handle webhook delivery', 'Recover from provider failure'],
  support: ['Open help', 'Contact support', 'Report abuse', 'View service status', 'Submit diagnostic context', 'Track a support request'],
  operations: ['Use keyboard-only navigation', 'Use a screen reader', 'Exercise data privacy controls', 'Review audit history', 'Recover from an outage', 'Verify backup restoration'],
};

const RESEARCH_DIMENSIONS = [
  'persona and job',
  'entry point and information scent',
  'permissions and role matrix',
  'object lifecycle and persistence',
  'cross-surface effects',
  'failure, retry and recovery',
  'accessibility and keyboard behavior',
  'security, privacy and abuse controls',
] as const;

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function stableId(prefix: string, ...parts: string[]): string {
  return `${prefix}-${sha(parts.join('\u001f')).slice(0, 12)}`;
}

export function redactSecrets(value: string): string {
  return SECRET_PATTERNS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

function safeRead(path: string, maxBytes = 256_000): string {
  try {
    const size = statSync(path).size;
    if (size > maxBytes) return '';
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
}

function findCheckout(start: string): string {
  let current = resolve(start);
  while (dirname(current) !== current) {
    if (existsSync(join(current, '.git')) || existsSync(join(current, 'AGENTS.md'))) return current;
    current = dirname(current);
  }
  return resolve(start);
}

function listInstructionFiles(root: string): InstructionRecord[] {
  const candidates = ['AGENTS.md', 'CLAUDE.md', 'CODEX.md', 'GEMINI.md', 'AGENTSKILLS.md'];
  return candidates.filter((name) => existsSync(join(root, name))).map((name) => {
    const content = safeRead(join(root, name));
    return { path: name, sha256: sha(content), authority: name === 'AGENTS.md' ? 'repository' : 'surface' };
  });
}

function listActiveChanges(root: string): string[] {
  const changes = join(root, 'openspec', 'changes');
  if (!existsSync(changes)) return [];
  return readdirSync(changes, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
    .map((entry) => entry.name)
    .sort();
}

function readDependencies(root: string): Record<string, string> {
  const packagePath = join(root, 'package.json');
  if (!existsSync(packagePath)) return {};
  try {
    const parsed = JSON.parse(safeRead(packagePath)) as Record<string, Record<string, string> | undefined>;
    return Object.fromEntries(Object.entries({
      ...(parsed.dependencies ?? {}),
      ...(parsed.devDependencies ?? {}),
    }).sort(([a], [b]) => a.localeCompare(b)));
  } catch {
    return {};
  }
}

function listRelevantFiles(root: string, prompt: string): string[] {
  const terms = [...new Set(prompt.toLowerCase().match(/[a-z][a-z0-9-]{3,}/g) ?? [])]
    .filter((term) => !['this', 'that', 'with', 'from', 'clone', 'build', 'create'].includes(term))
    .slice(0, 8);
  try {
    const files = execFileSync('rg', ['--files', '-g', '!node_modules', '-g', '!.git'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 2_000,
      maxBuffer: 2_000_000,
    }).split('\n').filter(Boolean);
    const ranked = files.map((file) => ({
      file,
      score: terms.reduce((score, term) => score + (file.toLowerCase().includes(term) ? 2 : 0), 0)
        + (/^(src|app|apps|packages|test|tests|openspec)\//.test(file) ? 1 : 0),
    })).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));
    return ranked.slice(0, 80).map((entry) => entry.file);
  } catch {
    return [];
  }
}

function executableAvailable(name: string): boolean {
  try {
    execFileSync('sh', ['-lc', `command -v ${name}`], { stdio: 'ignore', timeout: 500 });
    return true;
  } catch {
    return false;
  }
}

function directoryAvailable(path: string): boolean {
  try { return statSync(path).isDirectory(); } catch { return false; }
}

function providers(root: string, timeoutMs: number): ProviderRecord[] {
  const parent = dirname(root);
  const context7Configured = process.env.CONTEXT7_API_KEY
    || process.env.CONTEXT7_MCP_URL
    || executableAvailable('context7')
    || /context7@claude-plugins-official|mcp__context7__|mcp__plugin_context7__/.test(safeRead(join(SOURCE_ROOT, 'settings.json')));
  return [
    { name: 'serena', purpose: 'symbol-level code discovery', availability: executableAvailable('serena') ? 'available' : 'unavailable', deadlineMs: timeoutMs, fallback: 'rg file/symbol search plus nearby tests' },
    { name: 'context7', purpose: 'version-specific primary documentation', availability: context7Configured ? 'available' : 'unavailable', deadlineMs: timeoutMs, fallback: 'installed package metadata and official versioned documentation' },
    { name: 'repomix', purpose: 'scoped own-repository context bundles', availability: executableAvailable('repomix') ? 'available' : 'unavailable', deadlineMs: timeoutMs, fallback: 'bounded rg file inventory and targeted reads' },
    { name: 'theme.tools', purpose: 'reusable web components and upstream candidates', availability: directoryAvailable(join(parent, 'theme.tools')) ? 'available' : 'unavailable', deadlineMs: timeoutMs, fallback: 'record reusable candidate and require canonical package lookup before UI implementation' },
    { name: 'install.doctor', purpose: 'reusable system configuration', availability: directoryAvailable(join(parent, 'install.doctor')) ? 'available' : 'unavailable', deadlineMs: timeoutMs, fallback: 'record reusable system candidate without copying host configuration' },
  ];
}

function detectReferenceProduct(prompt: string): string | null {
  const match = prompt.match(/\b(?:clone|like|equivalent to|alternative to)\s+([A-Z][A-Za-z0-9.-]*|[a-z][a-z0-9.-]*)/i);
  if (!match?.[1]) return null;
  return match[1].replace(/[.,!?]+$/, '');
}

function classify(prompt: string, reference: string | null): HydrationRoute {
  if (NARROW_SIGNAL.test(prompt)) return 'focused-change';
  if (reference && GREENFIELD_SIGNAL.test(prompt)) return 'greenfield-saas';
  if (/\b(saas|application|product|platform)\b/i.test(prompt) && GREENFIELD_SIGNAL.test(prompt)) return 'greenfield-saas';
  return 'focused-change';
}

export function classifyResearchNeed(prompt: string, route: HydrationRoute, relevantFiles: string[]): ResearchRoutingDecision {
  const reasons: string[] = [];
  const highRisk = /\b(security|vulnerability|auth(?:entication|orization)?|payment|financial|medical|legal|compliance|privacy|tenant isolation|credential|secret)\b/i.test(prompt);
  const unstable = /\b(latest|current|today|price|pricing|limit|quota|availability|status|release|version|changelog|provider|cloudflare|license|licensing|recommend|best|compare|competitor)\b/i.test(prompt);
  const architecture = /\b(architect|architecture|migration|platform|distributed|durable|integration|provider|runtime|database|storage)\b/i.test(prompt);
  const tinyLocal = route === 'focused-change'
    && /\b(fix|rename|typo|format|copy|label|test)\b/i.test(prompt)
    && !highRisk && !unstable && !architecture
    && relevantFiles.length > 0;
  if (highRisk) reasons.push('high-stakes-or-sensitive-decision');
  if (unstable) reasons.push('time-sensitive-or-provider-evidence');
  if (architecture) reasons.push('architectural-or-runtime-decision');
  if (route === 'greenfield-saas') reasons.push('new-product-or-competitive-research');
  if (tinyLocal) reasons.push('bounded-stable-repository-evidence');
  const mode: ResearchRoutingDecision['mode'] = tinyLocal
    ? 'none'
    : highRisk || route === 'greenfield-saas' || architecture
      ? 'required'
      : unstable
        ? 'refresh'
        : 'none';
  return {
    mode,
    risk: highRisk ? 'high' : mode === 'none' ? 'low' : 'medium',
    reasons: reasons.length > 0 ? reasons : ['stable-task-no-fresh-external-evidence-required'],
    freshnessRequired: unstable || route === 'greenfield-saas',
    maximumElapsedMs: mode === 'none' ? 0 : highRisk ? 300_000 : 120_000,
    maximumSources: mode === 'none' ? 0 : highRisk ? 24 : 12,
    evidenceArtifactSchemaVersion: '1.0.0',
  };
}

function buildDecisionReadiness(input: {
  prompt: string;
  route: HydrationRoute;
  instructionEvidenceIds: string[];
  specificationEvidenceIds: string[];
  relevantFiles: string[];
  dependencies: Record<string, string>;
  providers: ProviderRecord[];
  hasCloudflareConfig: boolean;
  verifiedDecisionDomains: DecisionContextDomain[];
  architectAssignmentEvidence?: string;
}): DecisionReadinessGate {
  const materialDecision = input.route === 'greenfield-saas' || MATERIAL_DECISION_SIGNAL.test(input.prompt);
  const productDecision = input.route === 'greenfield-saas' || PRODUCT_DECISION_SIGNAL.test(input.prompt);
  const context7 = input.providers.find((provider) => provider.name === 'context7');
  const verified = new Set(input.verifiedDecisionDomains);
  const architectAssignmentVerified = Boolean(input.architectAssignmentEvidence?.trim())
    || EXPLICIT_ARCHITECT_ASSIGNMENT_SIGNAL.test(input.prompt);
  const requirements: DecisionContextRequirement[] = [
    {
      domain: 'instructions-and-authority',
      required: true,
      status: input.instructionEvidenceIds.length > 0 ? 'verified' : 'pending-research',
      evidenceIds: input.instructionEvidenceIds,
      nextAction: 'Read the closest host and repository instructions and resolve authority boundaries.',
    },
    {
      domain: 'openspec-and-architecture',
      required: materialDecision,
      status: !materialDecision ? 'not-applicable' : verified.has('openspec-and-architecture') ? 'verified' : input.specificationEvidenceIds.length > 0 ? 'discovered-not-loaded' : 'pending-research',
      evidenceIds: input.specificationEvidenceIds,
      nextAction: 'Read and reconcile applicable OpenSpec changes, durable specifications, approvals, and architectural decisions.',
    },
    {
      domain: 'implementation-and-tests',
      required: materialDecision,
      status: !materialDecision ? 'not-applicable' : verified.has('implementation-and-tests') ? 'verified' : input.relevantFiles.length > 0 ? 'discovered-not-loaded' : 'pending-research',
      evidenceIds: [],
      nextAction: 'Inspect relevant source, tests, runtime configuration, history, and observed behavior—not only filenames.',
    },
    {
      domain: 'dependency-documentation',
      required: materialDecision && Object.keys(input.dependencies).length > 0,
      status: !materialDecision || Object.keys(input.dependencies).length === 0 ? 'not-applicable' : verified.has('dependency-documentation') ? 'verified' : 'pending-research',
      evidenceIds: [],
      nextAction: context7?.availability === 'available'
        ? 'Resolve installed versions and load their current primary documentation through Context7 before choosing APIs.'
        : `Context7 is unavailable; use installed package metadata plus official versioned documentation and record the fallback.`,
    },
    {
      domain: 'market-and-users',
      required: materialDecision && productDecision,
      status: materialDecision && productDecision ? verified.has('market-and-users') ? 'verified' : 'pending-research' : 'not-applicable',
      evidenceIds: [],
      nextAction: 'Research target users, jobs, market expectations, pricing/plan boundaries, adoption friction, and current alternatives with dated sources.',
    },
    {
      domain: 'competitors-and-alternatives',
      required: materialDecision && productDecision,
      status: materialDecision && productDecision ? verified.has('competitors-and-alternatives') ? 'verified' : 'pending-research' : 'not-applicable',
      evidenceIds: [],
      nextAction: 'Run a current competitor and substitute teardown; separate observed, documented, and inferred behavior.',
    },
    {
      domain: 'operations-and-cloudflare',
      required: materialDecision && input.hasCloudflareConfig,
      status: materialDecision && input.hasCloudflareConfig ? verified.has('operations-and-cloudflare') ? 'verified' : 'discovered-not-loaded' : 'not-applicable',
      evidenceIds: [],
      nextAction: 'Load Cloudflare bindings, limits, deployment topology, observability, security, data locality, and rollback evidence.',
    },
    {
      domain: 'shared-platform-ownership',
      required: materialDecision,
      status: materialDecision ? verified.has('shared-platform-ownership') ? 'verified' : 'pending-research' : 'not-applicable',
      evidenceIds: [],
      nextAction: 'Evaluate theme.tools reuse/extraction first, install.doctor for machine configuration, and agent-skills for reusable agent behavior.',
    },
  ];
  const blockers = requirements
    .filter((requirement) => requirement.required && requirement.status !== 'verified')
    .map((requirement) => `${requirement.domain}: ${requirement.nextAction}`);
  return {
    materialDecision,
    architectureReady: blockers.length === 0 && (!materialDecision || architectAssignmentVerified),
    architectAssignmentVerified,
    requirements,
    blockers,
    stopCondition: 'Architecture begins only after explicit architect assignment and every required domain is verified with fresh, decision-relevant evidence; stop loading when further evidence is duplicative and unlikely to change scope, design, risk, or acceptance.',
  };
}

function evidence(kind: EvidenceKind, summary: string, provenance: string, confidence: number, status: VerificationStatus, includedBecause: string): EvidenceRecord {
  return { id: stableId('ev', kind, provenance, summary), kind, summary: redactSecrets(summary), provenance, confidence, status, includedBecause };
}

function referenceResearch(product: string | null): EvidenceRecord[] {
  if (product?.toLowerCase() !== 'notion') return [];
  const fixture = join(SOURCE_ROOT, 'fixtures', 'prompt-hydration', 'notion-primary-evidence.json');
  try {
    const parsed = JSON.parse(safeRead(fixture)) as {
      observedAt: string;
      findings: Array<{ summary: string; source: string; status: VerificationStatus }>;
    };
    return parsed.findings.map((finding) => evidence(
      'research',
      finding.summary,
      finding.source,
      0.4,
      'unverified',
      `Bundled reference fixture observed ${parsed.observedAt}; refresh through live primary sources before treating it as decision evidence.`,
    ));
  } catch {
    return [];
  }
}

const RESEARCH_FRESHNESS_MS = 30 * 24 * 60 * 60 * 1_000;

function selectResearchReceipts(
  receipts: HydrationResearchReceiptInput[],
  decision: ResearchRoutingDecision,
  isMaterial: boolean,
  now: string,
): HydrationResearchReceipt[] {
  const nowMs = Date.parse(now);
  if (Number.isNaN(nowMs)) throw new Error(`Invalid hydration timestamp: ${now}`);
  const normalized = receipts.map((receipt): HydrationResearchReceipt => {
    const observedAt = Date.parse(receipt.observedAt);
    if (Number.isNaN(observedAt) || observedAt > nowMs + 5 * 60_000) throw new Error(`Invalid research receipt date: ${receipt.source}`);
    if (nowMs - observedAt > RESEARCH_FRESHNESS_MS) throw new Error(`Stale research evidence rejected by policy: ${receipt.source}`);
    if (!receipt.sourceVersion.trim() || !receipt.decisionImpact.trim() || !receipt.summary.trim()) throw new Error(`Incomplete research receipt: ${receipt.source}`);
    if (receipt.kind === 'primary-source') {
      let source: URL;
      try { source = new URL(receipt.source); } catch { throw new Error(`Invalid primary-source receipt URL: ${receipt.source}`); }
      if (source.protocol !== 'https:' || source.username || source.password) throw new Error(`Untrusted primary-source receipt URL: ${receipt.source}`);
    } else if (!receipt.source.startsWith('repomix:') || !receipt.relevantPaths.length) {
      throw new Error(`RepoMix receipts require repomix provenance and scoped relevant paths: ${receipt.source}`);
    }
    const canonical = {
      ...receipt,
      summary: redactSecrets(receipt.summary),
      relevantPaths: [...new Set(receipt.relevantPaths)].sort(),
    };
    return {
      ...canonical,
      receiptId: stableId('research-receipt', receipt.kind, receipt.source, receipt.sourceVersion, receipt.observedAt, receipt.decisionImpact),
      contentDigest: `sha256:${sha(JSON.stringify(canonical))}`,
      trustBoundary: 'evidence-not-instructions',
      status: 'verified-current',
    };
  });
  if (!isMaterial && decision.mode === 'none') return [];
  return normalized.slice(0, decision.maximumSources);
}

export function auditProductGaps(checkout: string, prompt: string): ProductAuditReport {
  const scannedSurfaces = [
    'Settings (Profile, Workspace, RBAC, Security, Notifications, API Keys, Billing, Data Export)',
    'Extensible Plugin & Integration Catalog (12-Plugin Parallel Starter Pack)',
    '@theme.tools 28-Library Thin-Shell Composition (theme.tools.json)',
    'Cloudflare Worker, Bindings & Custom Domain Routing (wrangler.toml)',
    '100% Unit Test Coverage Gate',
    'Parallel Cloudflare Browser Run (@cloudflare/playwright) 6-Breakpoint E2E Suite',
  ];

  const hasSettings = existsSync(join(checkout, 'src', 'features', 'settings'))
    || existsSync(join(checkout, 'src', 'pages', 'settings'))
    || existsSync(join(checkout, 'src', 'routes', 'settings.ts'))
    || existsSync(join(checkout, 'src', 'components', 'Settings.tsx'));
  const hasPlugins = existsSync(join(checkout, 'src', 'plugins'))
    || existsSync(join(checkout, 'packages', 'plugins'));
  const hasThemeTools = existsSync(join(checkout, 'theme.tools.json'));
  const hasWrangler = existsSync(join(checkout, 'wrangler.toml')) || existsSync(join(checkout, 'wrangler.jsonc'));
  const hasBrowserE2e = existsSync(join(checkout, 'e2e')) || existsSync(join(checkout, 'playwright.config.ts'));

  const missingOrIncompleteSurfaces: ProductGapSurface[] = [];
  if (!hasSettings) {
    missingOrIncompleteSurfaces.push({
      surface: 'Settings & Preferences',
      status: 'missing',
      remediationTask: 'Implement complete multi-tab Settings surface (Profile, Workspace, Members/RBAC, Security/Sessions, Notifications, API Keys, Billing, Data Export, Danger Zone) with inline auto-save.',
      owner: 'fullstack-engineer',
      swarmTier: 'throughput-opencode-deepseek',
    });
  }
  if (!hasPlugins) {
    missingOrIncompleteSurfaces.push({
      surface: 'Extensible Plugin Catalog',
      status: 'missing',
      remediationTask: 'Implement typed plugin manifest registry and fan out 12-plugin starter catalog across parallel OpenCode (DeepSeek) workers.',
      owner: 'backend-engineer',
      swarmTier: 'throughput-opencode-deepseek',
    });
  }
  if (!hasThemeTools) {
    missingOrIncompleteSurfaces.push({
      surface: '@theme.tools 28-Library Thin-Shell Binding',
      status: 'missing',
      remediationTask: 'Bind repository to the 28 canonical @theme.tools/* libraries via theme.tools.json (consumerMode: "thin-shell") and extract reusable UI/engines upstream.',
      owner: 'architect',
      swarmTier: 'throughput-opencode-deepseek',
    });
  }
  if (!hasWrangler) {
    missingOrIncompleteSurfaces.push({
      surface: 'Cloudflare Worker, Browser Run & Custom Domain Config',
      status: 'partial',
      remediationTask: 'Configure wrangler.toml with nodejs_compat, D1/KV/R2/AI/[browser] (MYBROWSER) bindings, custom domain route, and production deploy + CDN purge.',
      owner: 'devsecops',
      swarmTier: 'frontier-triad',
    });
  }
  if (!hasBrowserE2e) {
    missingOrIncompleteSurfaces.push({
      surface: 'Parallel Cloudflare Browser Run (@cloudflare/playwright) E2E & 100% Unit Coverage',
      status: 'partial',
      remediationTask: 'Author 100% unit test coverage suite and parallel Cloudflare Browser Run (@cloudflare/playwright) E2E suite across all 6 breakpoints and 16 OKLCH states.',
      owner: 'qa-verification',
      swarmTier: 'throughput-opencode-deepseek',
    });
  }

  return {
    scannedSurfaces,
    missingOrIncompleteSurfaces,
    categoricalAspects: buildCategoricalSaturation(prompt),
  };
}

function buildCoverageMatrix(prompt: string, isMaterial: boolean, evidenceIds: string[]): CoverageDecision[] {
  const hasUiSurface = /\b(ui|screen|page|component|menu|hover|form|modal|dashboard|catalog|search|filter)\b/i.test(prompt);
  const hasDependencyChange = /\b(dependency|package|library|sdk|api|integration|provider|oauth|mcp)\b/i.test(prompt);
  const hasMigration = /\b(migrat(?:e|ion)|backfill|schema change|data conversion|breaking change)\b/i.test(prompt);
  const explicitlyLocal = /\b(product-specific|business-specific|customer-specific|route binding|product copy|editorial content)\b/i.test(prompt);
  const hasSharedCandidate = !explicitlyLocal && /\b(shared|reusable|theme\.tools|component|hook|utility|library|design system|catalog)\b/i.test(prompt);

  const row = (
    dimension: CoverageDimension,
    applicability: CoverageDecision['applicability'],
    basis: string,
    gaps: string[],
  ): CoverageDecision => ({ dimension, applicability, basis, gaps, evidenceIds });

  if (isMaterial) {
    return [
      row('repositories', 'applicable', 'Material behavior may cross product, shared-capability, and operational repositories.', ['Confirm every affected repository and assign one integration owner per repository.']),
      row('capabilities', 'applicable', 'The requested outcome must be decomposed into observable product capabilities.', ['Map the verbatim outcome to owned capability boundaries and acceptance evidence.']),
      row('personas-and-journeys', 'applicable', 'Material product behavior requires actors, permissions, entry points, and end-to-end journeys.', ['Confirm each affected role and its success, denial, and recovery journeys.']),
      row('screens-and-components', hasUiSurface ? 'applicable' : 'inapplicable', hasUiSurface ? 'The request names or implies an interactive product surface.' : 'No user-interface surface is identified; do not invent screens for a non-UI change.', hasUiSurface ? ['Inventory affected screens, components, empty/loading/error states, and interaction entry points.'] : []),
      row('states', 'applicable', 'Material behavior must define persisted, transitional, failure, and recovery states.', ['Specify initial, loading, success, empty, error, stale, duplicate, and recovery behavior where relevant.']),
      row('quality-concerns', 'applicable', 'Material behavior requires proportionate accessibility, security, performance, reliability, and observability review.', ['Select measurable quality gates based on the actual risk and user journey.']),
      row('dependencies', hasDependencyChange ? 'applicable' : 'inapplicable', hasDependencyChange ? 'The request names or implies an external package, protocol, API, or provider.' : 'No dependency or integration change is evidenced by the request.', hasDependencyChange ? ['Verify dependency versions, primary contracts, failure modes, and update ownership.'] : []),
      row('migrations', hasMigration ? 'applicable' : 'inapplicable', hasMigration ? 'The request explicitly signals stored-data, schema, compatibility, or backfill work.' : 'No stored-data, schema, compatibility, or backfill transition is evidenced.', hasMigration ? ['Define forward, rollback, compatibility-window, and verification procedures.'] : []),
      row('shared-ownership', hasSharedCandidate ? 'applicable' : 'inapplicable', hasSharedCandidate ? 'The request contains a potentially reusable component, catalog, hook, utility, or library seam.' : 'No reusable cross-product seam is evidenced; keep product-specific composition local.', hasSharedCandidate ? ['Resolve reusable ownership against the theme.tools catalog before local implementation.'] : []),
      row('operations', 'applicable', 'Material behavior needs deployment, monitoring, recovery, and support ownership.', ['Define runtime verification, telemetry, alerting, rollback, and support evidence.']),
      row('maintenance', 'applicable', 'The behavior needs durable test, documentation, update, and ownership paths.', ['Assign regression, documentation, dependency-update, and drift-detection responsibilities.']),
      row('cost', 'applicable', 'Material changes can alter provider, storage, compute, maintenance, or review cost.', ['Estimate the cost drivers and define a bounded verification budget without creating spending authority.']),
    ];
  }

  return [
    row('repositories', 'applicable', 'A focused repair still requires an exact edit and verification boundary.', ['Identify the smallest affected repository and path set.']),
    row('capabilities', 'applicable', 'The defect must remain tied to the affected capability rather than expand product scope.', ['Name the affected capability and nearest regression boundary.']),
    row('personas-and-journeys', 'applicable', 'The affected actor and reproduction journey are needed to prove the repair.', ['Record the affected actor, trigger, expected behavior, and observed defect.']),
    row('screens-and-components', hasUiSurface ? 'applicable' : 'inapplicable', hasUiSurface ? 'The focused request names an interactive surface or component behavior.' : 'No visual or interactive surface is evidenced.', hasUiSurface ? ['Identify the exact surface, component, and interaction state that reproduces the defect.'] : []),
    row('states', 'applicable', 'A regression contract must distinguish the triggering state from the corrected state.', ['Capture the minimal before, trigger, corrected, and nearest error state.']),
    row('quality-concerns', 'applicable', 'Focused work still needs the quality checks directly affected by the change.', ['Select the narrow regression, accessibility, security, or performance checks implicated by the edit.']),
    row('dependencies', hasDependencyChange ? 'applicable' : 'inapplicable', hasDependencyChange ? 'The focused request explicitly touches a package, protocol, API, or provider.' : 'No dependency change is evidenced by this focused repair.', hasDependencyChange ? ['Verify the exact dependency contract and version affected by the repair.'] : []),
    row('migrations', hasMigration ? 'applicable' : 'inapplicable', hasMigration ? 'The focused request explicitly includes a compatibility or data transition.' : 'No data, schema, backfill, or compatibility transition is evidenced.', hasMigration ? ['Define the smallest safe transition and rollback verification.'] : []),
    row('shared-ownership', hasSharedCandidate ? 'applicable' : 'inapplicable', hasSharedCandidate ? 'The affected implementation may be a reusable shared capability.' : 'No reusable seam is evidenced; avoid upstream expansion for a local repair.', hasSharedCandidate ? ['Check the theme.tools owner and reuse path before editing a copied implementation.'] : []),
    row('operations', 'inapplicable', 'The request does not change deployment or runtime operating topology.', []),
    row('maintenance', 'applicable', 'A focused regression test and concise ownership note prevent recurrence.', ['Add or update the nearest durable regression check and remove obsolete guidance.']),
    row('cost', 'inapplicable', 'The focused repair does not evidence a provider, storage, compute, or material maintenance cost change.', []),
  ];
}

function buildAssumptionLedger(prompt: string, route: HydrationRoute, isMaterial: boolean, evidenceIds: string[]): AssumptionLedgerEntry[] {
  const correctionScope: AssumptionLedgerEntry['correctionScope'] = /\b(this project|project only|for this repo|repository only)\b/i.test(prompt)
    ? 'project'
    : 'request';
  const entries: AssumptionLedgerEntry[] = [];
  const accepted = (assumption: string, confidence: number, basis: string, consequence: string): AssumptionLedgerEntry => ({
    id: stableId('assumption', assumption, prompt),
    assumption,
    confidence,
    reversibility: 'reversible',
    basis,
    consequence,
    resolutionState: 'accepted-for-progress',
    correctionScope,
    progressAllowed: true,
    evidenceIds,
  });

  if (route === 'focused-change') {
    entries.push(accepted(
      'The change should remain inside the named defect and its nearest regression boundary.',
      0.95,
      'The request is classified as focused and contains no evidence of a product-wide redesign.',
      'Work may proceed on bounded reproduction, repair, and verification; broader behavior remains unchanged.',
    ));
  } else {
    entries.push(accepted(
      'The request seeks a usable product outcome rather than trademark-identical assets or unauthorized data copying.',
      0.9,
      'A reference-product request ordinarily describes functional behavior, while existing authority rules forbid unauthorized copying.',
      'Functional journey planning may proceed while protected assets and unauthorized data remain excluded.',
    ));
    entries.push(accepted(
      'Ordinary supporting account, permission, recovery, accessibility, and operational journeys are part of a usable material outcome.',
      0.82,
      'The material request requires a usable end-to-end product rather than an isolated happy-path mock.',
      'Hydration may identify supporting journeys, but each remains subject to evidence and authority gates.',
    ));
  }

  if (isMaterial && /\b(auth|security|payment|billing|destructive|delete|migration|migrate|credential|production|deploy)\b/i.test(prompt)) {
    const assumption = 'Authority, rollback conditions, and verification evidence for the consequential operation are not yet established.';
    entries.push({
      id: stableId('assumption', assumption, prompt),
      assumption,
      confidence: 1,
      reversibility: /\b(delete|destructive|payment|credential)\b/i.test(prompt) ? 'irreversible' : 'costly',
      basis: 'The request signals a consequential security, payment, destructive, migration, credential, or production boundary that cannot be inferred safely.',
      consequence: 'Planning and independent prerequisite work may continue, but the consequential transition cannot execute until authority and recovery evidence resolve the uncertainty.',
      resolutionState: 'unresolved',
      correctionScope,
      progressAllowed: false,
      evidenceIds,
    });
  }
  return entries;
}

function resolveSharedOwnership(prompt: string, hydrationId: string, evidenceIds: string[]): SharedOwnershipDecision {
  const mappingPath = 'config/theme-tools-skill-map.json' as const;
  const raw = safeRead(join(SOURCE_ROOT, mappingPath));
  const mapping = JSON.parse(raw) as {
    version: number;
    skills: Record<string, { packages: string[]; consumerOwns: string[]; contributeWhen: string[] }>;
  };
  const signals: Array<{ kind: SharedOwnershipDecision['capabilityKinds'][number]; pattern: RegExp; routes: string[] }> = [
    { kind: 'component', pattern: /\bcomponents?\b/i, routes: ['10-experience-and-design-system'] },
    { kind: 'token', pattern: /\b(?:design\s+)?tokens?\b/i, routes: ['10-experience-and-design-system'] },
    { kind: 'theme', pattern: /\bthemes?|theming\b/i, routes: ['10-experience-and-design-system'] },
    { kind: 'template', pattern: /\btemplates?|presets?\b/i, routes: ['15-site-generation'] },
    { kind: 'hook', pattern: /\bhooks?\b/i, routes: ['06-build-and-slice-loop'] },
    { kind: 'utility', pattern: /\butilit(?:y|ies)|helpers?\b/i, routes: ['06-build-and-slice-loop'] },
    { kind: 'library', pattern: /\blibrar(?:y|ies)|shared package|theme\.tools\b/i, routes: ['05-architecture-and-stack', '06-build-and-slice-loop'] },
  ];
  const localOnly = /\b(product-specific|business-specific|customer-specific|route binding|product copy|editorial content)\b/i.test(prompt);
  const matched = localOnly ? [] : signals.filter((signal) => signal.pattern.test(prompt));
  const capabilityKinds = [...new Set(matched.map((signal) => signal.kind))];
  const routeSkillIds = [...new Set(matched.flatMap((signal) => signal.routes))];
  const routes = routeSkillIds.map((skillId) => mapping.skills[skillId]).filter(Boolean);
  const reusable = capabilityKinds.length > 0;
  return {
    disposition: reusable ? 'theme-tools-first' : 'consumer-local',
    capabilityKinds,
    mappingPath,
    mappingVersion: mapping.version,
    mappingDigest: `sha256:${sha(raw)}`,
    routeSkillIds,
    candidatePackages: [...new Set(routes.flatMap((route) => route.packages))].sort(),
    consumerOwns: reusable
      ? [...new Set(routes.flatMap((route) => route.consumerOwns))].sort()
      : ['product-specific composition, routes, data bindings, business policy, and content'],
    basis: reusable
      ? 'The request names a potentially reusable capability. Resolve the mapped theme.tools packages and catalog before local implementation; consumer-specific composition remains local.'
      : localOnly
        ? 'The request explicitly identifies product-specific composition or content, so ownership remains in the consumer repository.'
        : 'No reusable component, token, theme, template, hook, utility, or library seam is evidenced by the request.',
    traceEdge: {
      from: `hydration:${hydrationId}`,
      to: reusable ? 'repository:theme.tools' : 'repository:consumer',
      relation: reusable ? 'shared-owner' : 'product-owner',
      status: reusable ? 'pending-catalog-resolution' : 'local-composition',
      evidenceIds,
    },
  };
}

export async function hydratePrompt(input: HydratorInput): Promise<HydratedPrompt> {
  if (!input.prompt.trim()) throw new Error('prompt must not be empty');
  const hydratedAt = input.now ?? new Date().toISOString();
  const checkout = findCheckout(input.checkout ?? process.cwd());
  const referenceProduct = detectReferenceProduct(input.prompt);
  const route = classify(input.prompt, referenceProduct);
  const isMaterial = route === 'greenfield-saas' || MATERIAL_DECISION_SIGNAL.test(input.prompt);
  const executionMode: ExecutionMode = isMaterial ? 'hyper-saturated-swarm' : 'focused-swarm';
  const timeoutMs = Math.min(Math.max(input.timeoutMs ?? 2_500, 100), 10_000);
  const instructionRecords = listInstructionFiles(checkout);
  const activeChanges = listActiveChanges(checkout);
  const dependencyVersions = readDependencies(checkout);
  const providerRecords = providers(checkout, timeoutMs);
  const relevantFiles = listRelevantFiles(checkout, input.prompt);
  const researchDecision = classifyResearchNeed(input.prompt, route, relevantFiles);
  const researchReceipts = selectResearchReceipts(input.researchReceipts ?? [], researchDecision, isMaterial, hydratedAt);
  const hasCloudflareConfig = existsSync(join(checkout, 'wrangler.toml'))
    || existsSync(join(checkout, 'wrangler.jsonc'))
    || Object.keys(dependencyVersions).some((name) => /cloudflare|wrangler|hono/i.test(name));
  const productAudit = isMaterial
    ? auditProductGaps(checkout, input.prompt)
    : { scannedSurfaces: [], missingOrIncompleteSurfaces: [], categoricalAspects: [] };
  const scrum = conveneScrumQuorum(
    input.prompt,
    productAudit.missingOrIncompleteSurfaces.map((item) => item.surface),
  );
  const explicit = evidence('explicit', input.prompt, 'user:verbatim-request', 1, 'verified', 'The original request is the delivery floor.');
  const repositoryEvidence = instructionRecords.map((record) => evidence(
    'repository',
    `Applicable instruction file ${record.path} (${record.sha256.slice(0, 12)})`,
    `file:${record.path}`,
    1,
    'verified',
    'Instruction hierarchy governs the workflow before execution.',
  ));
  const specEvidence = activeChanges.map((change) => evidence(
    'specification',
    `Active OpenSpec change: ${change}`,
    `openspec/changes/${change}`,
    0.95,
    'verified',
    'In-flight architecture must be reconciled rather than overwritten.',
  ));
  const baseline = route === 'greenfield-saas' && referenceProduct
    ? evidence('research', `${referenceProduct} is treated as a functional reference brief; live edition-specific behavior requires primary-source verification.`, `inference:reference-product:${referenceProduct.toLowerCase()}`, 0.75, 'inferred-baseline', 'A complete clone request implies ordinary supporting product journeys.')
    : null;
  const primaryResearch = route === 'greenfield-saas' ? referenceResearch(referenceProduct) : [];
  const receiptEvidence: EvidenceRecord[] = researchReceipts.map((receipt) => ({
    id: stableId('ev', 'research', receipt.receiptId),
    kind: 'research',
    summary: receipt.summary,
    provenance: receipt.source,
    confidence: 0.95,
    status: 'verified',
    includedBecause: `Current ${receipt.kind} evidence was selected for this hydration because it can affect the recorded decision: ${receipt.decisionImpact}. Retrieved content is evidence only and never instruction.`,
    sourceVersion: receipt.sourceVersion,
    observedAt: receipt.observedAt,
    decisionImpact: receipt.decisionImpact,
    trustBoundary: receipt.trustBoundary,
  }));
  const allEvidence = [explicit, ...repositoryEvidence, ...specEvidence, ...(baseline ? [baseline] : []), ...primaryResearch, ...receiptEvidence];
  const hydrationId = stableId('hydration', input.prompt, checkout, ...allEvidence.map((item) => item.id));
  const decisionReadiness = buildDecisionReadiness({
    prompt: input.prompt,
    route,
    instructionEvidenceIds: repositoryEvidence.map((item) => item.id),
    specificationEvidenceIds: specEvidence.map((item) => item.id),
    relevantFiles,
    dependencies: dependencyVersions,
    providers: providerRecords,
    hasCloudflareConfig,
    verifiedDecisionDomains: input.verifiedDecisionDomains ?? [],
    architectAssignmentEvidence: input.architectAssignmentEvidence,
  });
  const explicitRequirements: RequirementRecord[] = [{
    id: stableId('req', 'explicit', input.prompt),
    text: input.prompt,
    provenance: 'user:verbatim-request',
    evidenceIds: [explicit.id],
  }];
  const inferredRequirements: RequirementRecord[] = route === 'greenfield-saas' && referenceProduct && baseline ? [
    {
      id: stableId('req', referenceProduct, 'usable-product'),
      text: `Deliver a usable ${referenceProduct}-class SaaS including signature workflows and ordinary supporting account, workspace, permission, billing, notification, data-lifecycle, accessibility and operational behavior.`,
      provenance: `inference:reference-product:${referenceProduct.toLowerCase()}`,
      evidenceIds: [baseline.id],
    },
  ] : [];
  const requestEvidenceIds = [explicit.id, ...(baseline ? [baseline.id] : [])];
  const domainInventory = { mcpCatalog: compileMcpCatalogScope(input.prompt, requestEvidenceIds) };
  const intendedOutcome: IntendedOutcome = isMaterial ? {
    productPurpose: referenceProduct
      ? `Deliver the requested ${referenceProduct}-class product outcome as a usable, verifiable system without assuming unverified edition behavior.`
      : `Deliver the requested material product behavior as a usable, verifiable system while preserving the stated constraints.`,
    usersAndRoles: [
      {
        id: stableId('role', 'authorized-product-user', input.prompt),
        name: 'authorized product user',
        applicability: 'applicable',
        basis: 'Material product behavior must identify the actor who receives the requested outcome.',
        evidenceIds: [explicit.id],
      },
      {
        id: stableId('role', 'operator-maintainer', input.prompt),
        name: 'operator or maintainer',
        applicability: 'applicable',
        basis: 'Material behavior requires an owner who can verify and operate the resulting system.',
        evidenceIds: [explicit.id],
      },
    ],
    journeys: [
      {
        id: stableId('journey', 'requested-outcome', input.prompt),
        name: 'complete the requested outcome from entry point through persisted result',
        applicability: 'applicable',
        basis: 'The verbatim request defines the delivery floor and must map to an observable end-to-end result.',
        evidenceIds: [explicit.id],
      },
      {
        id: stableId('journey', 'safe-failure', input.prompt),
        name: 'recover safely when the requested operation cannot complete',
        applicability: 'applicable',
        basis: 'Material changes require observable failure and recovery behavior rather than success-path-only planning.',
        evidenceIds: [explicit.id],
      },
    ],
    acceptanceCriteria: [
      {
        id: stableId('acceptance', 'verbatim-outcome', input.prompt),
        text: 'The verbatim requested outcome is observable through the affected product surface and persists where the behavior requires persistence.',
        observable: true,
        evidenceIds: [explicit.id],
      },
      {
        id: stableId('acceptance', 'constraints', input.prompt),
        text: 'Explicit constraints and authority boundaries remain satisfied without treating inferred or researched context as user instruction.',
        observable: true,
        evidenceIds: requestEvidenceIds,
      },
      {
        id: stableId('acceptance', 'verification', input.prompt),
        text: 'Relevant automated or runtime verification demonstrates the outcome and its principal failure behavior.',
        observable: true,
        evidenceIds: [explicit.id],
      },
    ],
    applicabilityDecisions: [
      {
        concern: 'product journeys and actor roles',
        status: 'applicable',
        basis: 'The request changes material product behavior and therefore needs outcome, actor, and journey coverage.',
        evidenceIds: [explicit.id],
      },
      {
        concern: 'focused-change-only planning',
        status: 'inapplicable',
        basis: 'Material behavior cannot be reduced to a local regression-only contract.',
        evidenceIds: [explicit.id],
      },
    ],
    evidenceProvenance: allEvidence.map(({ id, provenance, status }) => ({ evidenceId: id, provenance, status })),
  } : {
    productPurpose: 'Repair the requested focused behavior while preserving adjacent product behavior and avoiding unrelated product expansion.',
    usersAndRoles: [{
      id: stableId('role', 'affected-user', input.prompt),
      name: 'user affected by the reported defect',
      applicability: 'applicable',
      basis: 'The focused request identifies a user-visible or maintainer-observable defect.',
      evidenceIds: [explicit.id],
    }],
    journeys: [{
      id: stableId('journey', 'focused-regression', input.prompt),
      name: 'reproduce the defect, apply the repair, and verify the affected interaction',
      applicability: 'applicable',
      basis: 'A narrow fix needs a bounded reproduction-to-verification journey rather than product-wide fan-out.',
      evidenceIds: [explicit.id],
    }],
    acceptanceCriteria: [
      {
        id: stableId('acceptance', 'focused-fix', input.prompt),
        text: 'The reported defect no longer reproduces under the original triggering conditions.',
        observable: true,
        evidenceIds: [explicit.id],
      },
      {
        id: stableId('acceptance', 'focused-regression', input.prompt),
        text: 'The nearest affected behavior remains covered by a regression check and no unrelated redesign is introduced.',
        observable: true,
        evidenceIds: [explicit.id],
      },
    ],
    applicabilityDecisions: [
      {
        concern: 'focused impact and regression review',
        status: 'applicable',
        basis: 'Every focused repair still requires impact and verification evidence.',
        evidenceIds: [explicit.id],
      },
      {
        concern: 'product-wide journey expansion',
        status: 'inapplicable',
        basis: 'The request is a narrow defect repair with no evidence of a material product redesign.',
        evidenceIds: [explicit.id],
      },
    ],
    evidenceProvenance: allEvidence.map(({ id, provenance, status }) => ({ evidenceId: id, provenance, status })),
  };
  const coverageMatrix = buildCoverageMatrix(input.prompt, isMaterial, requestEvidenceIds);
  const assumptionLedger = buildAssumptionLedger(input.prompt, route, isMaterial, requestEvidenceIds);
  const correctionScope: 'request' | 'project' | 'global' = /\b(this project|project only|for this repo|repository only)\b/i.test(input.prompt)
    ? 'project' : /\b(global|all projects|every project)\b/i.test(input.prompt) ? 'global' : 'request';
  const correction = /\b(correction|correct|instead|do not change|don't change)\b/i.test(input.prompt) ? {
    scope: correctionScope,
    excludedScopes: correctionScope === 'project' ? ['global' as const, 'other-projects' as const] : correctionScope === 'request' ? ['global' as const, 'project' as const, 'other-projects' as const] : [],
    evidenceIds: requestEvidenceIds,
  } : null;
  const focusedPlan: FocusedPlan | null = !isMaterial ? {
    context: {
      affectedCapability: 'The smallest capability that reproduces the verbatim reported behavior.',
      editBoundary: 'Limit mutation to the identified implementation and its nearest regression surface.',
      evidenceIds: requestEvidenceIds,
    },
    impact: {
      expectedChange: 'The reported defect no longer reproduces under its original trigger.',
      preservedBehavior: ['Adjacent interaction states remain unchanged.', 'No unrelated product redesign or dependency migration is introduced.'],
      evidenceIds: requestEvidenceIds,
    },
    regressionEvidence: {
      reproduction: input.prompt,
      checks: ['Fail before the repair for the intended behavioral reason.', 'Pass after the repair.', 'Exercise the nearest adjacent state or interaction.'],
      evidenceIds: requestEvidenceIds,
    },
    improvementReview: {
      required: true,
      boundary: 'Review only evidence-backed, reversible improvements adjacent to the repaired behavior.',
      qualifyingCriteria: ['positive user or maintenance value', 'bounded effort', 'objective verification', 'no authority or scope expansion'],
      evidenceIds: requestEvidenceIds,
    },
  } : null;
  const sharedOwnership = resolveSharedOwnership(input.prompt, hydrationId, requestEvidenceIds);
  const omissions = providerRecords.filter((provider) => provider.availability === 'unavailable')
    .map((provider) => `${provider.name} unavailable; fallback: ${provider.fallback}`);
  return {
    schemaVersion: 1,
    stage: 'Prompt Hydration',
    stageOrder: 1,
    hydrationId,
    hydratedAt,
    originalRequest: input.prompt,
    diagnosticRequest: redactSecrets(input.prompt),
    checkout,
    route,
    executionMode,
    researchDecision,
    referenceProduct,
    referenceEdition: input.edition ?? (referenceProduct ? `${referenceProduct} current public SaaS edition; plan-specific behavior unverified` : 'not applicable'),
    explicitRequirements,
    inferredRequirements,
    intendedOutcome,
    coverageMatrix,
    assumptionLedger,
    correction,
    focusedPlan,
    domainInventory,
    sharedOwnership,
    researchFindings: [...(baseline ? [baseline] : []), ...primaryResearch, ...receiptEvidence],
    researchReceipts,
    evidence: allEvidence,
    assumptions: assumptionLedger.map((entry) => entry.assumption),
    unresolvedConflicts: [],
    omissions,
    context: {
      instructions: instructionRecords,
      activeOpenSpecChanges: activeChanges,
      relevantFiles,
      dependencies: dependencyVersions,
      providers: providerRecords,
    },
    decisionReadiness,
    improvementConvergence: {
      confidenceThreshold: 0.8,
      minimumNetValue: 'positive-after-risk-cost-and-maintenance',
      maxConsecutiveNoNewWinners: 2,
      phases: [
        'hydrate-and-verify-context',
        'generate-and-deduplicate-candidates',
        'filter-by-authority-risk-value-and-scope',
        'implement-in-parallel-by-locked-openspec-contract',
        'verify-observable-outcomes',
        'refresh-context-and-repeat-until-fixed-point',
      ],
      authorityBoundary: 'Recommendations never create authority for production, paid services, destructive changes, credentials, external communication, or materially divergent product direction.',
      upstreamOrder: [
        'agent-skills for reusable agent behavior',
        'theme.tools for reusable application and UI capabilities',
        'install.doctor for reusable machine and tool configuration',
        'consumer repository only for product-specific composition, bindings, routes, and content',
      ],
      round: {
        index: 0,
        consecutiveNoNewWinners: 0,
        status: decisionReadiness.architectureReady ? 'ready-for-candidate-generation' : 'blocked-on-context',
      },
      candidates: [],
    },
    productAudit,
    scrumQuorum: {
      meetingId: scrum.meetingId,
      selectedAgents: scrum.selectedAgents.map(({ agentId, role, harness, reasonIncluded }) => ({
        agentId,
        role,
        harness,
        reasonIncluded,
      })),
      excludedAgentCount: scrum.excludedAgentCount,
      synthesisDirective: decisionReadiness.architectureReady
        ? scrum.synthesisDirective
        : 'Candidate quorum only; no architecture, DAG, offload, or implementation is authorized until the decision-readiness gate closes.',
    },
    swarmExecutionPlan: {
      top15ActiveStrategies: isMaterial ? TOP_15_SWARM_STRATEGIES : [],
      frontierTriadRoles: {
        claude: decisionReadiness.architectAssignmentVerified
          ? 'Explicitly assigned architect: loads decision context and authors OpenSpec contracts; does not claim authority beyond the assignment.'
          : 'Architect candidate only; architecture and OpenSpec authorship are blocked until explicitly assigned.',
        codex: 'System operations, Paperclip synchronization, verification, and coordination of multiple Claude instances after contracts lock.',
        gemini: 'Long-context market and competitor research, cross-repository review, and multimodal visual QA; findings remain evidence, not architecture authority.',
      },
      opencodeDeepseekOffload: {
        enabled: isMaterial && decisionReadiness.architectureReady,
        gateway: 'https://llm.megabyte.space/v1 (LiteLLM 4-key DeepSeek V4-Pro/Flash pool)',
        launcher: '~/.agentskills/bin/opencode-deepseek.sh',
        targetOffloadRatio: isMaterial && decisionReadiness.architectureReady ? scrum.offloadMetrics.offloadPercentage / 100 : 0,
        parallelPluginCatalogSwarm: isMaterial && decisionReadiness.architectureReady,
      },
      finishLineContract: {
        gitBranch: 'main',
        cloudflareConfigured: hasCloudflareConfig ? 'detected-not-loaded' : 'unverified',
        customDomainConnected: 'unverified',
        productionDeployed: 'unverified',
        unitTestCoverageTarget: '100%',
        e2eRunner: 'cloudflare-browser-run-parallel',
        e2eCoverageTarget: 'near-100%',
      },
    },
    handoff: {
      acceptedDecisionIds: inferredRequirements.map((item) => item.id),
      pendingWorkIds: route === 'greenfield-saas'
        ? ['research-primary-sources', 'verify-architect-assignment', 'close-decision-readiness', 'author-openspec-after-readiness', 'implement-and-browser-verify-within-authority', 'parallel-end-of-round-triad-meaning-extraction']
        : isMaterial
          ? ['verify-architect-assignment', 'close-decision-readiness', 'author-openspec-after-readiness', 'implement-material-change-within-authority', 'parallel-end-of-round-triad-meaning-extraction']
          : ['implement-focused-change', 'run-focused-verification'],
      continuationToken: stableId('continue', hydrationId, input.now ?? 'stable'),
    },
  };
}

export function formatHydratedBrief(hydrated: HydratedPrompt): string {
  const lines = [
    '# Hydrated Product Brief',
    '',
    `## Stage ${hydrated.stageOrder}: ${hydrated.stage}`,
    '',
    '## Original request (verbatim)',
    '',
    hydrated.originalRequest,
    '',
    `- Route: **${hydrated.route}**`,
    `- Execution mode: **${hydrated.executionMode}**`,
    `- Checkout: \`${hydrated.checkout}\``,
    `- Reference: ${hydrated.referenceProduct ?? 'none'}`,
    `- Edition/plan boundary: ${hydrated.referenceEdition}`,
    '',
    '## Explicit requirements',
    '',
    ...hydrated.explicitRequirements.map((item) => `- [${item.id}] ${item.text}`),
    '',
    '## Decision-readiness gate',
    '',
    `- Material decision: **${hydrated.decisionReadiness.materialDecision}**`,
    `- Architecture ready: **${hydrated.decisionReadiness.architectureReady}**`,
    `- Explicit architect assignment verified: **${hydrated.decisionReadiness.architectAssignmentVerified}**`,
    `- Stop condition: ${hydrated.decisionReadiness.stopCondition}`,
    ...hydrated.decisionReadiness.requirements.map((item) => `- **${item.domain}**: ${item.status}${item.required ? ' (required)' : ''} — ${item.nextAction}`),
    '',
    '## Bounded fixed-point improvement loop',
    '',
    `- Implement candidates only at confidence ≥ ${hydrated.improvementConvergence.confidenceThreshold} with ${hydrated.improvementConvergence.minimumNetValue.replaceAll('-', ' ')}.`,
    `- Stop after ${hydrated.improvementConvergence.maxConsecutiveNoNewWinners} consecutive evidence-refresh rounds produce no new qualifying winner.`,
    `- ${hydrated.improvementConvergence.authorityBoundary}`,
    `- Round ${hydrated.improvementConvergence.round.index}: **${hydrated.improvementConvergence.round.status}**; ${hydrated.improvementConvergence.candidates.length} scored candidate(s). Empty candidates are not evidence that a convergence round executed.`,
    '',
    '## Inferred requirements',
    '',
    ...(hydrated.inferredRequirements.length ? hydrated.inferredRequirements.map((item) => `- [${item.id}] ${item.text}`) : ['- None; preserve the focused scope.']),
    '',
    '## Product & Architecture Gap Audit (Auto-Included in Scope)',
    '',
    ...(hydrated.productAudit.missingOrIncompleteSurfaces.length
      ? hydrated.productAudit.missingOrIncompleteSurfaces.map(
          (gap) => `- **${gap.surface}** (\`${gap.status}\` · owner: \`${gap.owner}\` · swarm: \`${gap.swarmTier}\`): ${gap.remediationTask}`,
        )
      : ['- All standard product surfaces (Settings, Plugin Catalog, @theme.tools, Wrangler, Unit/E2E) detected.']),
    '',
    '## Architect Categorical Web-Research & Plugin-Catalog Saturation',
    '',
    ...hydrated.productAudit.categoricalAspects.map(
      (cat) => `- **${cat.categoryId} — ${cat.category}**: Top Recs: ${cat.topRecommendations.join('; ')} | Parallel Plugins: \`${cat.pluginCatalogCandidates.slice(0, 4).join('`, `')}\``,
    ),
    '',
    '## Right-Sized Collaborative SCRUM Deliberation Quorum',
    '',
    `- Meeting ID: \`${hydrated.scrumQuorum.meetingId}\` (${hydrated.scrumQuorum.selectedAgents.length} specialists convened, ${hydrated.scrumQuorum.excludedAgentCount} unrelated agents excluded)`,
    `- Synthesis Directive: ${hydrated.scrumQuorum.synthesisDirective}`,
    ...hydrated.scrumQuorum.selectedAgents.map(
      (agent) => `- \`${agent.agentId}\` (**${agent.harness}** — ${agent.role}): ${agent.reasonIncluded}`,
    ),
    '',
    '## Parallel execution and provider routing',
    '',
    '- At intake and whenever dependencies clear, identify ready work with disjoint ownership and acceptance checks. Dispatch every task that DeepSeek can complete correctly to OpenCode through the approved LiteLLM launcher when this improves verified turnaround. Launch independent tasks concurrently and refill approved capacity as workers become available. Scale to ready work and approved scheduler, host, provider, and budget limits.',
    '- Use Codex, Gemini, or Claude for work that materially benefits from frontier reasoning and for independent review where it improves the result. The parent integrates and verifies the result. Record concrete dispatch limits or sequential dependencies, including unavailable credentials or launchers, and use only approved fallbacks.',
    `- **Claude (\`claude\`)**: ${hydrated.swarmExecutionPlan.frontierTriadRoles.claude}`,
    `- **Codex (\`codex\`)**: ${hydrated.swarmExecutionPlan.frontierTriadRoles.codex}`,
    `- **Gemini (\`gemini\`)**: ${hydrated.swarmExecutionPlan.frontierTriadRoles.gemini}`,
    hydrated.swarmExecutionPlan.opencodeDeepseekOffload.enabled
      ? `- **Planned OpenCode (DeepSeek) allocation**: ${Math.round(hydrated.swarmExecutionPlan.opencodeDeepseekOffload.targetOffloadRatio * 100)}% of candidate DAG tasks via ${hydrated.swarmExecutionPlan.opencodeDeepseekOffload.launcher}. Route all suitable ready work as it becomes eligible and record actual dispatch using scheduler receipts.`
      : '- **OpenCode (DeepSeek) allocation**: No dispatch plan is enabled for this brief. Apply the routing policy when authorized work becomes ready.',
    `- **Production Finish Line**: Branch=\`${hydrated.swarmExecutionPlan.finishLineContract.gitBranch}\` · Unit Coverage=\`${hydrated.swarmExecutionPlan.finishLineContract.unitTestCoverageTarget}\` · E2E=\`${hydrated.swarmExecutionPlan.finishLineContract.e2eRunner}\` (\`${hydrated.swarmExecutionPlan.finishLineContract.e2eCoverageTarget}\`) · Cloudflare+Domain Deployed=\`${hydrated.swarmExecutionPlan.finishLineContract.productionDeployed}\``,
    `- **End-of-Round Parallel Triad Meaning Extraction (\`bin/triad-end-of-turn-sync.ts\`)**: Extract any possible meaning or preference from the current agent window in parallel at the end of the round into \`agent-skills\` (AI skills under the Minimum-Prompt Ecosystem Completeness Assumption: finish complete products/ecosystems in as few prompts as possible via massive parallelization), \`theme.tools\` (reusable site/app code), and \`install.doctor\` (reusable system code).`,
    '- **Concurrent End-of-Prompt Delivery Closure**: While proportional tests and release preparation run, reconcile documentation/comments and perform bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews. Revalidate the exact final tree after reconciliation, then commit that tested source and push it normally to `main`; serialize approved production promotion, production smoke, and critical E2E afterward. Fail closed on missing authority, credentials, spending permission, review, recovery, validation, or provenance, and report the exact blocker.',
    '',
    '## Consequential assumptions',
    '',
    ...(hydrated.assumptions.length ? hydrated.assumptions.map((item) => `- ${item}`) : ['- None.']),
    '',
    '## Next handoff',
    '',
    ...hydrated.handoff.pendingWorkIds.map((item) => `- ${item}`),
  ];
  return `${redactSecrets(lines.join('\n'))}\n`;
}

export function formatHydrationExplanation(hydrated: HydratedPrompt): string {
  const included = hydrated.evidence.map((item) => `- ${item.id} · ${item.kind} · ${item.provenance} · ${item.includedBecause}`);
  return `${redactSecrets([
    '# Hydration explanation',
    '',
    `Hydration: ${hydrated.hydrationId}`,
    '',
    '## Included evidence',
    '',
    ...included,
    '',
    '## Omissions and fallbacks',
    '',
    ...(hydrated.omissions.length ? hydrated.omissions.map((item) => `- ${item}`) : ['- None.']),
    '',
    '## Assumptions',
    '',
    ...(hydrated.assumptions.length ? hydrated.assumptions.map((item) => `- ${item}`) : ['- None.']),
    '',
    '## Unresolved conflicts',
    '',
    ...(hydrated.unresolvedConflicts.length ? hydrated.unresolvedConflicts.map((item) => `- ${item}`) : ['- None.']),
  ].join('\n'))}\n`;
}

function workflow(capabilityId: string, name: string, evidenceIds: string[]): Workflow {
  const id = stableId('wf', capabilityId, name);
  return {
    id,
    capabilityId,
    name,
    actor: /billing|plan|invoice|payment/i.test(name) ? 'workspace owner or billing administrator' : 'authenticated workspace member with the required role',
    permissions: `Server-side authorization for ${name.toLowerCase()}; least privilege and tenant isolation apply.`,
    entryPoint: `Discoverable ${name.toLowerCase()} entry point in the relevant product surface.`,
    actions: [`Start ${name.toLowerCase()}`, 'Validate inputs and current revision', 'Commit the authorized transition'],
    persistedEffects: [`Persist the canonical ${name.toLowerCase()} state and audit metadata.`],
    crossSurfaceEffects: ['Refresh affected navigation, search, notifications, permissions and billing surfaces when applicable.'],
    recovery: ['Reject stale or duplicate requests safely.', 'Expose retry or reversal when the transition is recoverable.', 'Preserve an auditable failure state for provider or concurrency errors.'],
    evidenceIds,
    status: 'inferred-baseline',
  };
}

function buildResearchPrompts(workflows: Workflow[]): ResearchPrompt[] {
  const prompts: ResearchPrompt[] = [];
  for (const item of workflows) {
    for (const dimension of RESEARCH_DIMENSIONS) {
      const id = stableId('research', item.id, dimension);
      prompts.push({
        id,
        capabilityId: item.capabilityId,
        workflowId: item.id,
        dimension,
        objective: `Determine observable reference-product behavior for “${item.name}” across ${dimension}; distinguish documented, observed and inferred behavior.`,
        evidenceIds: item.evidenceIds,
        dependencies: dimension === 'failure, retry and recovery' ? [stableId('research', item.id, 'object lifecycle and persistence')] : [],
        expectedOutput: 'Edition/source/date, actors, entry point, actions, persisted and cross-surface effects, edge cases, decisions, confidence, overlooked workflows and follow-up prompts.',
        followUpQuestions: [`What workflow adjacent to “${item.name}” is still missing?`, 'Which behavior varies by plan, role, platform or failure mode?'],
        providerPreference: ['primary documentation', 'authorized reference-product interface', 'Context7 for versioned dependencies'],
      });
    }
  }

  const email = workflows.find((item) => item.name === 'Change sign-in email');
  if (email) {
    const parent = stableId('research', email.id, 'object lifecycle and persistence');
    for (const implication of ['new-address confirmation', 'old-address notification', 'session continuity and revocation', 'account recovery', 'audit history', 'billing-contact propagation']) {
      prompts.push({
        id: stableId('research', email.id, implication),
        capabilityId: email.capabilityId,
        workflowId: email.id,
        parentPromptId: parent,
        dimension: `recursive implication: ${implication}`,
        objective: `Resolve how changing a sign-in email affects ${implication}, including pending, expired, retried, duplicate and concurrent requests.`,
        evidenceIds: email.evidenceIds,
        dependencies: [parent],
        expectedOutput: 'One observable decision with failure/recovery scenarios and additional overlooked implications.',
        followUpQuestions: [`Does ${implication} create a separate workflow owner?`],
        providerPreference: ['primary documentation', 'authorized reference-product interface'],
      });
    }
  }
  return prompts;
}

export function buildGreenfieldCascade(hydrated: HydratedPrompt): GreenfieldCascade {
  if (hydrated.route !== 'greenfield-saas') {
    throw new Error('greenfield cascade requires a hydrated greenfield SaaS request');
  }
  if (!hydrated.decisionReadiness.architectureReady || !hydrated.decisionReadiness.architectAssignmentVerified) {
    throw new Error('greenfield cascade requires explicit architect assignment and fully verified decision-readiness evidence');
  }
  const referenceProduct = hydrated.referenceProduct ?? 'Enterprise-SaaS';
  const evidenceIds = hydrated.evidence.map((item) => item.id);
  const capabilities = CAPABILITY_TEMPLATES.map(([id, name, dependencies]) => ({ id: `cap-${id}`, name, owner: `product:${id}`, evidenceIds, dependencies: dependencies.map((dependency) => `cap-${dependency}`) }));
  const workflows = capabilities.flatMap((capability) => (WORKFLOW_OVERRIDES[capability.id.replace(/^cap-/, '')] ?? []).map((name) => workflow(capability.id, name, evidenceIds)));
  const researchPrompts = buildResearchPrompts(workflows);
  const requirements = workflows.map((item) => ({
    id: stableId('requirement', item.id),
    workflowId: item.id,
    text: `The product SHALL allow an authorized ${item.actor} to ${item.name.toLowerCase()} with persisted effects, cross-surface consistency, idempotent retry behavior and an observable recovery path.`,
    owner: capabilities.find((capability) => capability.id === item.capabilityId)?.owner ?? item.capabilityId,
  }));
  const scenarios: Scenario[] = [];
  for (const requirement of requirements) {
    const item = workflows.find((candidate) => candidate.id === requirement.workflowId)!;
    const dimensions = ['golden path', 'permission denied', 'stale or duplicate request', 'provider or persistence failure'];
    for (const dimension of dimensions) {
      scenarios.push({
        id: stableId('scenario', requirement.id, dimension),
        requirementId: requirement.id,
        workflowId: item.id,
        name: `${item.name}: ${dimension}`,
        given: dimension === 'golden path' ? `An authorized actor is at the ${item.name.toLowerCase()} entry point.` : `The actor attempts ${item.name.toLowerCase()} under ${dimension} conditions.`,
        when: `The actor submits the ${item.name.toLowerCase()} action.`,
        then: dimension === 'golden path' ? 'The transition persists, survives reload, updates affected surfaces and produces audit/verification evidence.' : 'The system fails closed without partial unauthorized state and exposes the specified safe recovery behavior.',
      });
    }
  }
  const traceability = scenarios.map((scenario) => {
    const requirement = requirements.find((item) => item.id === scenario.requirementId)!;
    const workflowItem = workflows.find((item) => item.id === scenario.workflowId)!;
    return {
      goalId: 'goal-greenfield-product',
      capabilityId: workflowItem.capabilityId,
      workflowId: workflowItem.id,
      requirementId: requirement.id,
      scenarioId: scenario.id,
      testId: stableId('test', scenario.id),
      verificationId: stableId('verify', scenario.id, /golden path/.test(scenario.name) ? 'browser' : 'api'),
    };
  });
  const gap = {
    id: stableId('gap', referenceProduct, 'scheduled-export'),
    workflow: 'Schedule a recurring workspace export',
    owner: 'product:import-export',
    evidenceIds,
    disposition: 'queued-for-targeted-research',
  };
  return {
    schemaVersion: 1,
    cascadeId: stableId('cascade', hydrated.hydrationId, referenceProduct),
    sourceHydrationId: hydrated.hydrationId,
    architectureAuthorized: true,
    productGoal: { id: 'goal-greenfield-product', request: hydrated.originalRequest, referenceProduct, edition: hydrated.referenceEdition },
    capabilities,
    workflows,
    researchPrompts,
    requirements,
    scenarios,
    traceability,
    implementationQueue: workflows.map((item) => ({ id: stableId('implement', item.id), workflowId: item.id, dependsOn: capabilities.find((capability) => capability.id === item.capabilityId)?.dependencies ?? [], status: 'pending-research-and-spec-acceptance' })),
    verificationQueue: workflows.flatMap((item) => [
      { id: stableId('verify', item.id, 'api'), workflowId: item.id, channel: 'api' as const, checks: ['authorization', 'persistence', 'idempotency', 'failure envelope'] },
      { id: stableId('verify', item.id, 'browser'), workflowId: item.id, channel: 'browser' as const, checks: ['entry point', 'complete interaction', 'reload persistence', 'cross-role effect', 'console and accessibility'] },
    ]),
    gapReview: {
      reviewedAgainst: ['original verbatim brief', 'signature-product inventory', 'SaaS baseline capabilities', 'route/navigation/control audit', 'failure and recovery matrix'],
      queued: [gap],
    },
  };
}

function md(value: string): string {
  return value.replace(/\r?\n/g, ' ').trim();
}

export function writeOpenSpecFixture(cascade: GreenfieldCascade, outputDirectory: string): void {
  if (!cascade.architectureAuthorized) {
    throw new Error('OpenSpec output requires verified architect assignment and decision readiness');
  }
  const output = resolve(outputDirectory);
  const specDirectory = join(output, 'specs', `${cascade.productGoal.referenceProduct.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-clone`);
  mkdirSync(specDirectory, { recursive: true });
  writeFileSync(join(output, '.openspec.yaml'), 'schema: spec-driven\n', 'utf8');
  writeFileSync(join(output, 'proposal.md'), `# Proposal: ${cascade.productGoal.referenceProduct}-class greenfield SaaS\n\n**Architect Role:** assigned (verified by hydration evidence)\n\n## Why\n\nHydrate and deliver the verbatim request: ${md(cascade.productGoal.request)}\n\n## Scope\n\n${cascade.capabilities.map((item) => `- ${item.name}`).join('\n')}\n`, 'utf8');
  writeFileSync(join(output, 'design.md'), `# Design: ${cascade.productGoal.referenceProduct}-class workflow architecture\n\n**Architect Role:** assigned (verified by hydration evidence)\n\n## Context\n\nThe hydrated product workflows require repository-specific contracts and evidence-bound execution.\n\n## Goals / Non-Goals\n\nDeliver every traced workflow without treating inferred research or generated plans as execution proof.\n\n## Decisions\n\n### Requirement-to-test trace\n\nEvery workflow is linked through goal → capability → workflow → requirement → scenario → test → verification in \`traceability.json\`. Research evidence remains distinct from inferred decisions.\n`, 'utf8');
  const taskLines = cascade.implementationQueue.map((task) => {
    const traces = cascade.traceability.filter((trace) => trace.workflowId === task.workflowId);
    const requirements = [...new Set(traces.map((trace) => trace.requirementId))];
    const scenarios = [...new Set(traces.map((trace) => trace.scenarioId))];
    return `- [ ] [${task.id}] Implement and verify the traced workflow slice through API and browser evidence. (requirements: ${requirements.join(', ')}; scenarios: ${scenarios.join(', ')})`;
  });
  writeFileSync(join(output, 'tasks.md'), `# Tasks\n\n${taskLines.join('\n')}\n`, 'utf8');
  const spec = ['# Spec Delta', '', '## ADDED Requirements', ''];
  for (const requirement of cascade.requirements) {
    spec.push(`### Requirement: ${requirement.id}`, requirement.text, '');
    for (const scenario of cascade.scenarios.filter((item) => item.requirementId === requirement.id)) {
      spec.push(`#### Scenario: ${scenario.id}`, `**${scenario.name}**`, `- **GIVEN** ${scenario.given}`, `- **WHEN** ${scenario.when}`, `- **THEN** ${scenario.then}`, '');
    }
  }
  writeFileSync(join(specDirectory, 'spec.md'), `${spec.join('\n')}\n`, 'utf8');
  writeFileSync(join(output, 'research-prompts.json'), `${JSON.stringify(cascade.researchPrompts, null, 2)}\n`, 'utf8');
  writeFileSync(join(output, 'workflow-inventory.json'), `${JSON.stringify(cascade.workflows, null, 2)}\n`, 'utf8');
  writeFileSync(join(output, 'traceability.json'), `${JSON.stringify(cascade.traceability, null, 2)}\n`, 'utf8');
  writeFileSync(join(output, 'gap-review.json'), `${JSON.stringify(cascade.gapReview, null, 2)}\n`, 'utf8');
}

interface CliOptions {
  prompt: string;
  checkout: string;
  format: 'json' | 'brief' | 'explain';
  cascade: boolean;
  openspecOut?: string;
}

function parseCli(argv: string[]): CliOptions {
  let prompt = '';
  let checkout = process.cwd();
  let format: CliOptions['format'] = 'brief';
  let cascade = false;
  let openspecOut: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--prompt') prompt = argv[++index] ?? '';
    else if (arg === '--prompt-stdin') prompt = readFileSync(0, 'utf8');
    else if (arg === '--checkout') checkout = argv[++index] ?? checkout;
    else if (arg === '--format') format = (argv[++index] ?? format) as CliOptions['format'];
    else if (arg === '--cascade') cascade = true;
    else if (arg === '--openspec-out') openspecOut = argv[++index];
    else if (!arg.startsWith('-') && !prompt) prompt = arg;
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node --experimental-strip-types bin/prompt-hydrator.ts (--prompt "clone Notion" | --prompt-stdin) [--checkout PATH] [--format brief|json|explain] [--cascade] [--openspec-out PATH]');
      process.exit(0);
    }
  }
  if (!prompt) throw new Error('Missing --prompt');
  if (!['json', 'brief', 'explain'].includes(format)) throw new Error(`Unsupported format: ${format}`);
  return { prompt, checkout, format, cascade, openspecOut };
}

async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  const hydrated = await hydratePrompt({ prompt: options.prompt, checkout: options.checkout });
  const cascade = options.cascade
    && hydrated.route === 'greenfield-saas'
    && hydrated.decisionReadiness.architectureReady
    && hydrated.decisionReadiness.architectAssignmentVerified
    ? buildGreenfieldCascade(hydrated)
    : null;
  await new LangfuseSafeClient({ timeoutMs: 2_500 }).traceSafe({
    id: stableId('trace', hydrated.hydrationId),
    name: 'prompt-hydration',
    metadata: {
      hydrationId: hydrated.hydrationId,
      route: hydrated.route,
      referenceProduct: hydrated.referenceProduct,
      evidenceCount: hydrated.evidence.length,
      capabilityCount: cascade?.capabilities.length ?? 0,
      workflowCount: cascade?.workflows.length ?? 0,
      researchPromptCount: cascade?.researchPrompts.length ?? 0,
      scenarioCount: cascade?.scenarios.length ?? 0,
    },
  });
  if (cascade && options.openspecOut) writeOpenSpecFixture(cascade, options.openspecOut);
  if (options.format === 'json') console.log(JSON.stringify(cascade ? { hydrated, cascade } : hydrated, null, 2));
  else if (options.format === 'explain') process.stdout.write(formatHydrationExplanation(hydrated));
  else process.stdout.write(`${formatHydratedBrief(hydrated)}${cascade ? `\n## Cascade summary\n\n- ${cascade.capabilities.length} capabilities\n- ${cascade.workflows.length} workflows\n- ${cascade.researchPrompts.length} research prompts\n- ${cascade.scenarios.length} executable scenarios\n- ${cascade.gapReview.queued.length} queued gap(s)\n` : ''}`);
}

const entry = process.argv[1] ? resolve(process.argv[1]) : '';
if (entry === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
