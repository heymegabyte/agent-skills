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
    cloudflareConfigured: boolean;
    customDomainConnected: boolean;
    productionDeployed: boolean;
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
}

export interface EvidenceRecord {
  id: string;
  kind: EvidenceKind;
  summary: string;
  provenance: string;
  confidence: number;
  status: VerificationStatus;
  includedBecause: string;
}

export interface RequirementRecord {
  id: string;
  text: string;
  provenance: string;
  evidenceIds: string[];
}

export interface InstructionRecord {
  path: string;
  sha256: string;
  authority: 'repository' | 'surface';
}

export interface HydratedPrompt {
  schemaVersion: 1;
  hydrationId: string;
  hydratedAt: string;
  originalRequest: string;
  diagnosticRequest: string;
  checkout: string;
  route: HydrationRoute;
  executionMode: ExecutionMode;
  referenceProduct: string | null;
  referenceEdition: string;
  explicitRequirements: RequirementRecord[];
  inferredRequirements: RequirementRecord[];
  researchFindings: EvidenceRecord[];
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
  return [
    { name: 'serena', purpose: 'symbol-level code discovery', availability: executableAvailable('serena') ? 'available' : 'unavailable', deadlineMs: timeoutMs, fallback: 'rg file/symbol search plus nearby tests' },
    { name: 'context7', purpose: 'version-specific primary documentation', availability: process.env.CONTEXT7_API_KEY || executableAvailable('context7') ? 'available' : 'unavailable', deadlineMs: timeoutMs, fallback: 'installed package metadata and official docs when browsing is authorized' },
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
      finding.status === 'verified' ? 0.95 : 0.4,
      finding.status,
      `Primary-reference fixture reviewed ${parsed.observedAt}; unverified gaps remain research work.`,
    ));
  } catch {
    return [];
  }
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

export async function hydratePrompt(input: HydratorInput): Promise<HydratedPrompt> {
  if (!input.prompt.trim()) throw new Error('prompt must not be empty');
  const checkout = findCheckout(input.checkout ?? process.cwd());
  const referenceProduct = detectReferenceProduct(input.prompt);
  const route = classify(input.prompt, referenceProduct);
  const executionMode: ExecutionMode = NARROW_SIGNAL.test(input.prompt) ? 'focused-swarm' : 'hyper-saturated-swarm';
  const timeoutMs = Math.min(Math.max(input.timeoutMs ?? 2_500, 100), 10_000);
  const instructionRecords = listInstructionFiles(checkout);
  const activeChanges = listActiveChanges(checkout);
  const dependencyVersions = readDependencies(checkout);
  const providerRecords = providers(checkout, timeoutMs);
  const productAudit = auditProductGaps(checkout, input.prompt);
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
  const allEvidence = [explicit, ...repositoryEvidence, ...specEvidence, ...(baseline ? [baseline] : []), ...primaryResearch];
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
  const omissions = providerRecords.filter((provider) => provider.availability === 'unavailable')
    .map((provider) => `${provider.name} unavailable; fallback: ${provider.fallback}`);
  const hydrationId = stableId('hydration', input.prompt, checkout, ...allEvidence.map((item) => item.id));
  return {
    schemaVersion: 1,
    hydrationId,
    hydratedAt: input.now ?? new Date().toISOString(),
    originalRequest: input.prompt,
    diagnosticRequest: redactSecrets(input.prompt),
    checkout,
    route,
    executionMode,
    referenceProduct,
    referenceEdition: input.edition ?? (referenceProduct ? `${referenceProduct} current public SaaS edition; plan-specific behavior unverified` : 'not applicable'),
    explicitRequirements,
    inferredRequirements,
    researchFindings: [...(baseline ? [baseline] : []), ...primaryResearch],
    evidence: allEvidence,
    assumptions: route === 'greenfield-saas' ? [
      'The request is for a new usable SaaS, not trademark-identical assets or unauthorized data copying.',
      'Ordinary supporting workflows are in scope; paid, destructive, credentialed and production actions remain separately permissioned.',
    ] : [],
    unresolvedConflicts: [],
    omissions,
    context: {
      instructions: instructionRecords,
      activeOpenSpecChanges: activeChanges,
      relevantFiles: listRelevantFiles(checkout, input.prompt),
      dependencies: dependencyVersions,
      providers: providerRecords,
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
      synthesisDirective: scrum.synthesisDirective,
    },
    swarmExecutionPlan: {
      top15ActiveStrategies: TOP_15_SWARM_STRATEGIES,
      frontierTriadRoles: {
        claude: 'Primary Systems Architect, OpenSpec author, UI/UX 16-state craft lead & final code integrator',
        codex: 'Adversarial security/algorithm challenger, backend/schema contract verifier & edge deployment auditor',
        gemini: '1M-2M token cross-repository cartographer, competitor research synthesizer & multimodal visual QA',
      },
      opencodeDeepseekOffload: {
        enabled: true,
        gateway: 'https://llm.megabyte.space/v1 (LiteLLM 4-key DeepSeek V4-Pro/Flash pool)',
        launcher: '~/.agentskills/bin/opencode-deepseek.sh',
        targetOffloadRatio: scrum.offloadMetrics.offloadPercentage / 100,
        parallelPluginCatalogSwarm: true,
      },
      finishLineContract: {
        gitBranch: 'main',
        cloudflareConfigured: true,
        customDomainConnected: true,
        productionDeployed: true,
        unitTestCoverageTarget: '100%',
        e2eRunner: 'cloudflare-browser-run-parallel',
        e2eCoverageTarget: 'near-100%',
      },
    },
    handoff: {
      acceptedDecisionIds: inferredRequirements.map((item) => item.id),
      pendingWorkIds: route === 'greenfield-saas'
        ? ['research-primary-sources', 'scrum-quorum-openspec-dag', 'opencode-deepseek-parallel-swarm', 'approve-material-ui', 'implement-and-browser-verify', 'deploy-main-and-cloudflare-domain']
        : ['scrum-quorum-openspec-dag', 'opencode-deepseek-parallel-swarm', 'implement-focused-change', 'verify-100-coverage-and-deploy-main'],
      continuationToken: stableId('continue', hydrationId, input.now ?? 'stable'),
    },
  };
}

export function formatHydratedBrief(hydrated: HydratedPrompt): string {
  const lines = [
    '# Hydrated Product Brief',
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
    '## Multi-Swarm Parallel Execution & OpenCode (DeepSeek) Offload Plan',
    '',
    `- **Claude (\`claude\`)**: ${hydrated.swarmExecutionPlan.frontierTriadRoles.claude}`,
    `- **Codex (\`codex\`)**: ${hydrated.swarmExecutionPlan.frontierTriadRoles.codex}`,
    `- **Gemini (\`gemini\`)**: ${hydrated.swarmExecutionPlan.frontierTriadRoles.gemini}`,
    `- **OpenCode (DeepSeek) Offload**: **${Math.round(hydrated.swarmExecutionPlan.opencodeDeepseekOffload.targetOffloadRatio * 100)}%** of DAG tasks routed to \`${hydrated.swarmExecutionPlan.opencodeDeepseekOffload.launcher}\` via \`${hydrated.swarmExecutionPlan.opencodeDeepseekOffload.gateway}\` (Parallel Plugin Catalog Swarm: \`${hydrated.swarmExecutionPlan.opencodeDeepseekOffload.parallelPluginCatalogSwarm}\`)`,
    `- **Production Finish Line**: Branch=\`${hydrated.swarmExecutionPlan.finishLineContract.gitBranch}\` · Unit Coverage=\`${hydrated.swarmExecutionPlan.finishLineContract.unitTestCoverageTarget}\` · E2E=\`${hydrated.swarmExecutionPlan.finishLineContract.e2eRunner}\` (\`${hydrated.swarmExecutionPlan.finishLineContract.e2eCoverageTarget}\`) · Cloudflare+Domain Deployed=\`${hydrated.swarmExecutionPlan.finishLineContract.productionDeployed}\``,
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
  if (hydrated.route !== 'greenfield-saas' || !hydrated.referenceProduct) {
    throw new Error('greenfield cascade requires a hydrated greenfield SaaS request with a reference product');
  }
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
    id: stableId('gap', hydrated.referenceProduct, 'scheduled-export'),
    workflow: 'Schedule a recurring workspace export',
    owner: 'product:import-export',
    evidenceIds,
    disposition: 'queued-for-targeted-research',
  };
  return {
    schemaVersion: 1,
    cascadeId: stableId('cascade', hydrated.hydrationId, hydrated.referenceProduct),
    sourceHydrationId: hydrated.hydrationId,
    productGoal: { id: 'goal-greenfield-product', request: hydrated.originalRequest, referenceProduct: hydrated.referenceProduct, edition: hydrated.referenceEdition },
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
  const output = resolve(outputDirectory);
  const specDirectory = join(output, 'specs', `${cascade.productGoal.referenceProduct.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-clone`);
  mkdirSync(specDirectory, { recursive: true });
  writeFileSync(join(output, '.openspec.yaml'), 'schema: spec-driven\n', 'utf8');
  writeFileSync(join(output, 'proposal.md'), `# Proposal: ${cascade.productGoal.referenceProduct}-class greenfield SaaS\n\n**Architect:** codex\n\n**Architect Role:** assigned\n\n## Why\n\nHydrate and deliver the verbatim request: ${md(cascade.productGoal.request)}\n\n## Scope\n\n${cascade.capabilities.map((item) => `- ${item.name}`).join('\n')}\n`, 'utf8');
  writeFileSync(join(output, 'design.md'), `# Design: ${cascade.productGoal.referenceProduct}-class workflow architecture\n\n**Architect:** codex\n\n**Architect Role:** assigned\n\n## Requirement-to-test trace\n\nEvery workflow is linked through goal → capability → workflow → requirement → scenario → test → verification in \`traceability.json\`. Research evidence remains distinct from inferred decisions.\n`, 'utf8');
  writeFileSync(join(output, 'tasks.md'), `# Tasks\n\n- [ ] Complete primary-source research and accept edition-specific decisions.\n- [ ] Implement dependency-ordered workflow slices with failing tests first.\n- [ ] Verify every golden path and recovery path through API and browser.\n- [ ] Run independent gap review and close every unblocked finding.\n`, 'utf8');
  const spec = ['# Spec Delta', '', '## ADDED Requirements', ''];
  for (const requirement of cascade.requirements) {
    spec.push(`### Requirement: ${requirement.id}`, requirement.text, '');
    for (const scenario of cascade.scenarios.filter((item) => item.requirementId === requirement.id)) {
      spec.push(`#### Scenario: ${scenario.name}`, `- **GIVEN** ${scenario.given}`, `- **WHEN** ${scenario.when}`, `- **THEN** ${scenario.then}`, '');
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
  const cascade = options.cascade && hydrated.route === 'greenfield-saas' ? buildGreenfieldCascade(hydrated) : null;
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
