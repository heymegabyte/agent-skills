#!/usr/bin/env node
/**
 * Collaborative Right-Sized SCRUM Deliberation Quorum & Synthesis Engine.
 *
 * Selects ONLY the specialist agents required by the prompt's active domains,
 * assigns heterogeneous frontier harnesses (Claude, Codex, Gemini) for the
 * deliberation quorum, synthesizes architectural consensus + dissent register,
 * and emits a parallel OpenSpec DAG task graph with automatic OpenCode (DeepSeek)
 * swarm offloading for all throughput-safe work units.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type FrontierHarness = 'claude' | 'codex' | 'gemini';
export type SwarmHarness = FrontierHarness | 'opencode-deepseek';

export interface ScrumParticipant {
  agentId: string;
  role: string;
  harness: SwarmHarness;
  reasonIncluded: string;
  focusAreas: string[];
}

export interface CategoricalSaturationSlice {
  categoryId: string;
  category: string;
  webResearchQueries: string[];
  competitorBenchmarks: string[];
  topRecommendations: string[];
  pluginCatalogCandidates: string[];
}

export interface DagTaskNode {
  id: string;
  title: string;
  category: string;
  classification: 'frontier-required' | 'throughput-safe';
  assignedHarness: SwarmHarness;
  assignedAgent: string;
  worktreeSlot: string;
  portLease: number;
  ownedFiles: string[];
  dependsOn: string[];
  verificationCommand: string;
}

export interface ScrumSynthesisResult {
  meetingId: string;
  createdAt: string;
  prompt: string;
  selectedAgents: ScrumParticipant[];
  excludedAgents: string[];
  excludedAgentCount: number;
  categoricalSaturation: CategoricalSaturationSlice[];
  consensusDecisions: string[];
  dissentRegister: Array<{ topic: string; challenger: FrontierHarness; resolution: string }>;
  dagTasks: DagTaskNode[];
  offloadMetrics: {
    totalTasks: number;
    frontierTasks: number;
    opencodeDeepseekTasks: number;
    offloadPercentage: number;
  };
  synthesisDirective: string;
}

interface RosterAgent {
  agentId: string;
  role: string;
  defaultHarness: FrontierHarness;
  alwaysInclude?: boolean;
  triggers: RegExp;
  focusAreas: string[];
}

const FULL_28_AGENT_ROSTER: RosterAgent[] = [
  {
    agentId: 'architect',
    role: 'Principal Systems Architect & OpenSpec Author',
    defaultHarness: 'claude',
    alwaysInclude: true,
    triggers: /.*/,
    focusAreas: ['OpenSpec contracts', 'Zod/Hono schemas', 'DAG decomposition', '@theme.tools thin-shell boundaries'],
  },
  {
    agentId: 'product-manager',
    role: 'Product Manager & Competitor Synthesis Lead',
    defaultHarness: 'gemini',
    triggers: /\b(feature|build|create|clone|app|saas|product|workflow|settings|plugin|catalog|user|onboarding)\b/i,
    focusAreas: ['categorical feature completeness', 'competitor parity + differentiators', 'user journey closure'],
  },
  {
    agentId: 'ui-designer',
    role: 'Principal UI/UX & 16-State OKLCH Designer',
    defaultHarness: 'claude',
    triggers: /\b(ui|ux|design|page|view|screen|dashboard|widget|editor|modal|settings|theme|style|component|site|app)\b/i,
    focusAreas: ['16-state OKLCH visual matrix', '0.333s transitions', '@theme.tools/ui adoption', '6-breakpoint responsiveness'],
  },
  {
    agentId: 'appsec',
    role: 'Application Security & Zero-Trust Auditor',
    defaultHarness: 'codex',
    triggers: /\b(auth|security|login|token|jwt|session|rbac|permission|secret|api|webhook|payment|billing|stripe|cloudflare|access|csp)\b/i,
    focusAreas: ['RBAC & tenant isolation', 'CSP Level 3 + Trusted Types', 'Zod input validation', 'secret hygiene'],
  },
  {
    agentId: 'database-engineer',
    role: 'Database & Drizzle Migration Architect',
    defaultHarness: 'codex',
    triggers: /\b(db|database|sql|postgres|d1|neon|drizzle|schema|migration|query|index|table|store|persist|state)\b/i,
    focusAreas: ['Drizzle ORM schema', 'composite indexing', 'expand-contract migrations', 'idempotent transactions'],
  },
  {
    agentId: 'qa-verification',
    role: 'QA & Parallel Cloudflare Browser Run Verification Lead',
    defaultHarness: 'codex',
    alwaysInclude: true,
    triggers: /.*/,
    focusAreas: ['100% unit test coverage', 'Cloudflare Browser Run (@cloudflare/playwright) parallel E2E', '6-breakpoint matrix'],
  },
  {
    agentId: 'performance-engineer',
    role: 'Edge Performance & Core Web Vitals Engineer',
    defaultHarness: 'gemini',
    triggers: /\b(perf|performance|fast|latency|cache|kv|worker|edge|bundle|inp|lcp|scale|parallel|swarm)\b/i,
    focusAreas: ['sub-50ms Worker cold start', 'INP <= 100ms', 'KV stale-while-revalidate', 'bundle budget < 150KB'],
  },
  {
    agentId: 'a11y-auditor',
    role: 'WCAG 2.2 AA & Keyboard Accessibility Auditor',
    defaultHarness: 'gemini',
    triggers: /\b(ui|page|form|button|modal|dialog|menu|keyboard|a11y|accessibility|screen|app|site|settings)\b/i,
    focusAreas: ['WCAG 2.2 AA contrast', 'keyboard-only focus rings', 'ARIA semantics', 'reduced-motion compliance'],
  },
  {
    agentId: 'seo-auditor',
    role: 'Technical SEO, GEO & Structured Data Specialist',
    defaultHarness: 'gemini',
    triggers: /\b(seo|blog|content|site|landing|marketing|sitemap|meta|og|json-ld|search|public)\b/i,
    focusAreas: ['per-route metadata', 'JSON-LD schema', 'sitemap.xml + llms.txt', 'Yoast green compliance'],
  },
  {
    agentId: 'finops',
    role: 'FinOps & Model Routing Economist',
    defaultHarness: 'codex',
    triggers: /\b(cost|budget|quota|finops|billing|stripe|pricing|token|model|deepseek|opencode|swarm|credit)\b/i,
    focusAreas: ['80%+ OpenCode DeepSeek offload', 'LiteLLM 4-key pool rotation', 'subscription quota preservation'],
  },
  {
    agentId: 'devsecops',
    role: 'Cloudflare Edge & Production Deployment Lead',
    defaultHarness: 'codex',
    triggers: /\b(deploy|cloudflare|worker|domain|dns|wrangler|ci|cd|main|production|tunnel|release)\b/i,
    focusAreas: ['wrangler.toml bindings', 'custom domain SSL wiring', 'production deploy + CDN purge', 'main branch hygiene'],
  },
  {
    agentId: 'media-orchestrator',
    role: 'Multimodal Media, OG & Video Pipeline Lead',
    defaultHarness: 'gemini',
    triggers: /\b(video|media|image|audio|og|avatar|remotion|hyperframes|svg|animation)\b/i,
    focusAreas: ['AVIF/WebP asset pipeline', 'dynamic OG cards', 'bespoke SVG diagrams', 'zero-cost media tiering'],
  },
  {
    agentId: 'fullstack-engineer',
    role: 'Full-Stack Implementation Lead',
    defaultHarness: 'claude',
    triggers: /\b(implement|feature|api|component|route|form|crud)\b/i,
    focusAreas: ['Hono inline RPC handlers', 'React 19 / Angular 22 thin-shell wiring'],
  },
  {
    agentId: 'backend-engineer',
    role: 'Edge API & Queue Workflow Engineer',
    defaultHarness: 'codex',
    triggers: /\b(queue|webhook|cron|workflow|durable object|rate limit|api)\b/i,
    focusAreas: ['Cloudflare Queues/Workflows', 'Durable Object state fencing'],
  },
  {
    agentId: 'growth-strategist',
    role: 'Activation Funnel & Viral Loop Strategist',
    defaultHarness: 'gemini',
    triggers: /\b(growth|onboarding|funnel|conversion|referral|pricing|trial)\b/i,
    focusAreas: ['first-run activation', 'self-serve conversion triggers'],
  },
  {
    agentId: 'information-architect',
    role: 'Navigation & Taxonomy Architect',
    defaultHarness: 'claude',
    triggers: /\b(nav|navigation|hierarchy|search|taxonomy|sidebar|menu|command palette)\b/i,
    focusAreas: ['Cmd+K command palette', '3-second information scent'],
  },
  {
    agentId: 'model-router',
    role: 'Tri-Harness Model Routing Specialist',
    defaultHarness: 'codex',
    triggers: /\b(router|model|claude|codex|gemini|deepseek|opencode|pace)\b/i,
    focusAreas: ['PACE failover', 'mid-flight altitude downgrade'],
  },
  {
    agentId: 'refactorer',
    role: 'Modularity & Dead-Code Elimination Specialist',
    defaultHarness: 'codex',
    triggers: /\b(refactor|clean|simplify|extract|theme\.tools|dedup)\b/i,
    focusAreas: ['@theme.tools upstream extraction', 'knip zero-orphan enforcement'],
  },
  {
    agentId: 'release-manager',
    role: 'Release Gate & Changelog Coordinator',
    defaultHarness: 'claude',
    triggers: /\b(release|ship|publish|changelog|version|deploy)\b/i,
    focusAreas: ['13 Hard Gates verification', 'customer-facing changelog'],
  },
  {
    agentId: 'sre',
    role: 'Site Reliability & Self-Healing Guardian Lead',
    defaultHarness: 'codex',
    triggers: /\b(uptime|health|alert|sentry|grafana|langfuse|telemetry|recover|backup)\b/i,
    focusAreas: ['7-rail observability', 'Langfuse 2500ms fail-open circuit breaker'],
  },
  {
    agentId: 'summarizer',
    role: 'Context Compression & SITREP Synthesizer',
    defaultHarness: 'gemini',
    triggers: /\b(summary|compact|sitrep|digest|brief)\b/i,
    focusAreas: ['<=200-word subagent handoff packets'],
  },
  {
    agentId: 'support-dispatcher',
    role: 'Helpdesk & In-App Support Architect',
    defaultHarness: 'claude',
    triggers: /\b(support|help|ticket|inbox|feedback|chat)\b/i,
    focusAreas: ['@theme.tools/inbox integration', 'self-serve diagnostics'],
  },
  {
    agentId: 'technical-writer',
    role: 'Documentation, OpenAPI & JSDoc Enforcer',
    defaultHarness: 'gemini',
    triggers: /\b(doc|docs|readme|comment|jsdoc|openapi|guide|manual)\b/i,
    focusAreas: ['README/AGENTS/OpenSpec parity', 'exhaustive TSDoc comments'],
  },
  {
    agentId: 'computer-use-operator',
    role: 'Native GUI & CUA Visual Operator',
    defaultHarness: 'claude',
    triggers: /\b(gui|desktop|cua|window|macos|native)\b/i,
    focusAreas: ['cua-driver accessibility snapshot verification'],
  },
  {
    agentId: 'ceo',
    role: 'Executive Goal & Portfolio Governor',
    defaultHarness: 'claude',
    triggers: /\b(ceo|estate|portfolio|52-project|all blogs|goal)\b/i,
    focusAreas: ['cross-estate Paperclip alignment'],
  },
  {
    agentId: 'migration-agent',
    role: 'Zero-Downtime Data & Stack Migrator',
    defaultHarness: 'codex',
    triggers: /\b(migrate|upgrade|port|convert|legacy)\b/i,
    focusAreas: ['expand-contract schema & API transitions'],
  },
  {
    agentId: 'motion-choreographer',
    role: '0.333s Micro-Motion & Spatial Choreographer',
    defaultHarness: 'claude',
    triggers: /\b(motion|animation|transition|cinematic|webgl|scroll)\b/i,
    focusAreas: ['cubic-bezier(0.22, 1, 0.36, 1) choreography'],
  },
  {
    agentId: 'resource-broker',
    role: 'Worktree Pool & Port Lease Broker',
    defaultHarness: 'codex',
    triggers: /\b(worktree|pool|port|sandbox|lease|container)\b/i,
    focusAreas: ['isolated worktree & port allocation'],
  },
];

function shortHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

export function buildCategoricalSaturation(prompt: string): CategoricalSaturationSlice[] {
  const subject = prompt.trim().slice(0, 80);
  return [
    {
      categoryId: 'C01',
      category: 'Core Domain Workflows & Deterministic State Machines',
      webResearchQueries: [
        `${subject} market leader UX teardown 2026`,
        `${subject} domain state machine edge cases and idempotency`,
      ],
      competitorBenchmarks: ['Linear keyboard-first speed', 'Notion block composability', 'Stripe API idempotency'],
      topRecommendations: [
        'Optimistic UI updates backed by server-side Zod revision fencing',
        'Cmd+K command palette covering 100% of primary domain mutations',
      ],
      pluginCatalogCandidates: ['custom-workflow-triggers', 'webhook-action-adapters', 'domain-template-packs'],
    },
    {
      categoryId: 'C02',
      category: 'Account, Workspace & Multi-Tier Settings Completeness',
      webResearchQueries: [
        'enterprise SaaS settings information architecture profile security billing notifications API keys',
      ],
      competitorBenchmarks: ['Vercel team settings hierarchy', 'GitHub fine-grained token & audit settings'],
      topRecommendations: [
        'Full Settings surface (Profile, Workspace, Members/RBAC, Security/Sessions, Notifications, API Keys, Billing, Data Export, Danger Zone)',
        'Inline auto-saving settings controls with immediate validation and audit trail entries',
      ],
      pluginCatalogCandidates: ['sso-saml-oidc-providers', 'scim-directory-sync', 'custom-notification-channels'],
    },
    {
      categoryId: 'C03',
      category: 'Extensible Plugin & Integration Catalog (Parallel Swarm Default)',
      webResearchQueries: [
        `${subject} top integrations plugins ecosystem catalog 2026`,
      ],
      competitorBenchmarks: ['Raycast extension store', 'Cloudflare Apps / Worker integration bindings'],
      topRecommendations: [
        'Typed plugin manifest registry with sandboxed execution and per-tenant enable/disable toggles',
        'Sharded parallel OpenCode (DeepSeek) implementation of the default 12-plugin starter catalog',
      ],
      pluginCatalogCandidates: [
        'slack-notifier',
        'github-sync',
        'linear-bridge',
        'stripe-billing-hook',
        'webhook-dispatcher',
        'csv-json-parquet-exporter',
        'ai-summarizer-plugin',
        'calendar-scheduler',
        'pdf-renderer-plugin',
        'audit-log-siem-forwarder',
        'custom-theme-pack',
        'mcp-tool-provider',
      ],
    },
    {
      categoryId: 'C04',
      category: '@theme.tools 28-Library Thin-Shell & 16-State OKLCH Craft',
      webResearchQueries: [
        'OKLCH dark-first design system 16 interaction states micro-interactions WCAG 2.2 AA',
      ],
      competitorBenchmarks: ['@theme.tools/ui canonical catalog', 'Vercel Geist + Linear dark-mode craft'],
      topRecommendations: [
        'Bind consumer repo in thin-shell mode to @theme.tools/ui, @theme.tools/themes, @theme.tools/auth, @theme.tools/telemetry, and @theme.tools/testing',
        'Enforce #060610 canvas, #00E5FF accent, 0.333s transitions, pill chips for all string[] values, and all 16 visual states',
      ],
      pluginCatalogCandidates: ['oklch-theme-presets', 'custom-widget-renderers'],
    },
    {
      categoryId: 'C05',
      category: 'Production Delivery, 100% Unit Coverage & Parallel Cloudflare Browser Run E2E',
      webResearchQueries: [
        '@cloudflare/playwright Browser Rendering parallel E2E Workers 100% coverage wrangler deploy',
      ],
      competitorBenchmarks: ['Cloudflare Browser Run edge Playwright fleet', 'Vitest 100% V8 coverage gate'],
      topRecommendations: [
        '100% unit test coverage across all domain, route, and utility modules',
        'Parallel Cloudflare Browser Run (@cloudflare/playwright) E2E suite across 6 breakpoints and 16 visual states',
        'Automated commit to main, wrangler.toml + custom domain binding, production deploy, and CDN cache purge',
      ],
      pluginCatalogCandidates: ['synthetic-health-probes', 'visual-regression-snapshots'],
    },
  ];
}

export function conveneScrumQuorum(prompt: string, missingSurfaces: string[] = []): ScrumSynthesisResult {
  const combinedSignal = `${prompt} ${missingSurfaces.join(' ')} settings plugin catalog cloudflare browser run openspec`;
  const matched = FULL_28_AGENT_ROSTER.filter((agent) => agent.alwaysInclude || agent.triggers.test(prompt));

  // Ensure right-sized quorum (minimum 4, maximum 7 most relevant specialists)
  const prioritized = matched.slice(0, 7);
  if (!prioritized.some((a) => a.agentId === 'product-manager')) {
    const pm = FULL_28_AGENT_ROSTER.find((a) => a.agentId === 'product-manager')!;
    prioritized.splice(1, 0, pm);
  }
  if (!prioritized.some((a) => a.agentId === 'devsecops')) {
    const dso = FULL_28_AGENT_ROSTER.find((a) => a.agentId === 'devsecops')!;
    prioritized.push(dso);
  }
  const finalRoster = prioritized.slice(0, 7);
  const selectedIds = new Set(finalRoster.map((a) => a.agentId));
  const excludedAgents = FULL_28_AGENT_ROSTER.filter((a) => !selectedIds.has(a.agentId)).map((a) => a.agentId);

  const selectedAgents: ScrumParticipant[] = finalRoster.map((agent) => ({
    agentId: agent.agentId,
    role: agent.role,
    harness: agent.defaultHarness,
    reasonIncluded: agent.alwaysInclude
      ? 'Mandatory SCRUM quorum anchor for architecture/verification governance'
      : `Matched active prompt/audit domain triggers (${agent.focusAreas[0]})`,
    focusAreas: agent.focusAreas,
  }));

  const categoricalSaturation = buildCategoricalSaturation(prompt);

  const dagTasks: DagTaskNode[] = [
    {
      id: 'task-01-openspec-contracts',
      title: 'Author OpenSpec proposal/design/tasks/specs & lock Zod/Hono/TypeScript contracts',
      category: 'C01',
      classification: 'frontier-required',
      assignedHarness: 'claude',
      assignedAgent: 'architect',
      worktreeSlot: 'wt-frontier-01',
      portLease: 4100,
      ownedFiles: ['openspec/changes/**', 'src/contracts/**', 'src/types/**'],
      dependsOn: [],
      verificationCommand: 'npx tsc --noEmit',
    },
    {
      id: 'task-02-core-domain-vertical-slice',
      title: 'Implement core domain handlers, D1/Drizzle persistence & 16-state OKLCH views',
      category: 'C01',
      classification: 'throughput-safe',
      assignedHarness: 'opencode-deepseek',
      assignedAgent: 'fullstack-engineer',
      worktreeSlot: 'wt-opencode-01',
      portLease: 4110,
      ownedFiles: ['src/features/core/**', 'src/routes/core.ts'],
      dependsOn: ['task-01-openspec-contracts'],
      verificationCommand: 'npm run test:unit',
    },
    {
      id: 'task-03-settings-and-product-gaps',
      title: 'Implement full Settings surface (Profile, Workspace, RBAC, API Keys, Notifications, Billing, Export) & audited gaps',
      category: 'C02',
      classification: 'throughput-safe',
      assignedHarness: 'opencode-deepseek',
      assignedAgent: 'fullstack-engineer',
      worktreeSlot: 'wt-opencode-02',
      portLease: 4120,
      ownedFiles: ['src/features/settings/**', 'src/routes/settings.ts'],
      dependsOn: ['task-01-openspec-contracts'],
      verificationCommand: 'npm run test:unit',
    },
    {
      id: 'task-04-plugin-catalog-shard-a',
      title: 'Implement Plugin Catalog Shard A (Slack, GitHub, Linear, Stripe, Webhook, Exporter plugins)',
      category: 'C03',
      classification: 'throughput-safe',
      assignedHarness: 'opencode-deepseek',
      assignedAgent: 'backend-engineer',
      worktreeSlot: 'wt-opencode-03',
      portLease: 4130,
      ownedFiles: ['src/plugins/catalog-a/**', 'src/plugins/registry.ts'],
      dependsOn: ['task-01-openspec-contracts'],
      verificationCommand: 'npm run test:unit',
    },
    {
      id: 'task-05-plugin-catalog-shard-b',
      title: 'Implement Plugin Catalog Shard B (AI Summarizer, Scheduler, PDF, SIEM Audit, Theme Pack, MCP Provider plugins)',
      category: 'C03',
      classification: 'throughput-safe',
      assignedHarness: 'opencode-deepseek',
      assignedAgent: 'backend-engineer',
      worktreeSlot: 'wt-opencode-04',
      portLease: 4140,
      ownedFiles: ['src/plugins/catalog-b/**'],
      dependsOn: ['task-01-openspec-contracts'],
      verificationCommand: 'npm run test:unit',
    },
    {
      id: 'task-06-unit-tests-100-coverage',
      title: 'Generate exhaustive unit test suite achieving 100% line/branch/function coverage',
      category: 'C05',
      classification: 'throughput-safe',
      assignedHarness: 'opencode-deepseek',
      assignedAgent: 'qa-verification',
      worktreeSlot: 'wt-opencode-05',
      portLease: 4150,
      ownedFiles: ['tests/unit/**'],
      dependsOn: ['task-02-core-domain-vertical-slice', 'task-03-settings-and-product-gaps', 'task-04-plugin-catalog-shard-a', 'task-05-plugin-catalog-shard-b'],
      verificationCommand: 'npm run test:coverage',
    },
    {
      id: 'task-07-cloudflare-browser-run-parallel-e2e',
      title: 'Author & execute parallel Cloudflare Browser Run (@cloudflare/playwright) E2E suite across 6 breakpoints & 16 states',
      category: 'C05',
      classification: 'throughput-safe',
      assignedHarness: 'opencode-deepseek',
      assignedAgent: 'qa-verification',
      worktreeSlot: 'wt-opencode-06',
      portLease: 4160,
      ownedFiles: ['e2e/**', 'src/worker/browser-e2e.ts'],
      dependsOn: ['task-02-core-domain-vertical-slice', 'task-03-settings-and-product-gaps'],
      verificationCommand: 'npx playwright test',
    },
    {
      id: 'task-08-docs-comments-and-context-enrichment',
      title: 'Enrich README.md, AGENTS.md, OpenAPI specs & inline JSDoc/TSDoc comments with web-researched domain context',
      category: 'C04',
      classification: 'throughput-safe',
      assignedHarness: 'opencode-deepseek',
      assignedAgent: 'technical-writer',
      worktreeSlot: 'wt-opencode-07',
      portLease: 4170,
      ownedFiles: ['README.md', 'docs/**'],
      dependsOn: ['task-01-openspec-contracts'],
      verificationCommand: 'npx markdownlint-cli2 "**/*.md"',
    },
    {
      id: 'task-09-tri-frontier-adversarial-merge-and-prod-deploy',
      title: 'Adversarial Codex/Gemini review, fold to main, verify Cloudflare domain/bindings, deploy to production & purge CDN',
      category: 'C05',
      classification: 'frontier-required',
      assignedHarness: 'codex',
      assignedAgent: 'devsecops',
      worktreeSlot: 'wt-frontier-02',
      portLease: 4180,
      ownedFiles: ['wrangler.toml', 'package.json'],
      dependsOn: ['task-06-unit-tests-100-coverage', 'task-07-cloudflare-browser-run-parallel-e2e', 'task-08-docs-comments-and-context-enrichment'],
      verificationCommand: 'npm test',
    },
  ];

  const frontierTasks = dagTasks.filter((t) => t.classification === 'frontier-required').length;
  const opencodeDeepseekTasks = dagTasks.filter((t) => t.classification === 'throughput-safe').length;
  const offloadPercentage = Math.round((opencodeDeepseekTasks / dagTasks.length) * 100);

  return {
    meetingId: `scrum-${shortHash(`${prompt}-${combinedSignal}`)}`,
    createdAt: new Date().toISOString(),
    prompt,
    selectedAgents,
    excludedAgents,
    excludedAgentCount: excludedAgents.length,
    categoricalSaturation,
    consensusDecisions: [
      'Lock all schemas and OpenSpec artifacts via Frontier Architect (Claude/Codex/Gemini) before spawning worker swarms.',
      'Auto-include audited product gaps (including full multi-tab Settings and 12-plugin starter catalog) in same-turn scope.',
      'Dispatch all suitable ready work to OpenCode with DeepSeek via LiteLLM. Run independent work concurrently when it improves verified turnaround and refill approved capacity as dependencies clear. Use Codex, Gemini, or Claude where premium capability or independent review materially improves delivery.',
      'Enforce 100% unit test coverage + parallel Cloudflare Browser Run (@cloudflare/playwright) E2E verification across 6 breakpoints before main commit and production Cloudflare deploy.',
    ],
    dissentRegister: [
      {
        topic: 'Single-thread frontier implementation vs. sharded OpenCode DeepSeek worktree swarm',
        challenger: 'codex',
        resolution: 'After contracts are verified, dispatch independent plugin shards through OpenCode with DeepSeek. Measure the actual dispatch and delivery results.',
      },
      {
        topic: 'Local-only Playwright vs. Cloudflare Browser Run (@cloudflare/playwright) edge E2E',
        challenger: 'gemini',
        resolution: 'Adopted dual-mode @cloudflare/playwright edge Browser Run binding (MYBROWSER) + parallel 6-breakpoint verification for production-accurate edge coverage.',
      },
    ],
    dagTasks,
    offloadMetrics: {
      totalTasks: dagTasks.length,
      frontierTasks,
      opencodeDeepseekTasks,
      offloadPercentage,
    },
    synthesisDirective: `Right-sized SCRUM quorum (${selectedAgents.length}/28 specialists convened: ${selectedAgents.map((a) => `${a.agentId}[${a.harness}]`).join(', ')}) proposed ${dagTasks.length} OpenSpec DAG tasks with ${offloadPercentage}% initially assigned to OpenCode (DeepSeek). Verify contracts and record actual dispatch using scheduler receipts.`,
  };
}

export function writeScrumArtifacts(result: ScrumSynthesisResult, outputDir: string): void {
  const target = resolve(outputDir);
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'scrum-synthesis.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  writeFileSync(join(target, 'task-graph.json'), `${JSON.stringify(result.dagTasks, null, 2)}\n`, 'utf8');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const promptArg = process.argv.slice(2).join(' ') || 'Build feature with full plugin catalog and settings';
  const result = conveneScrumQuorum(promptArg);
  console.log(JSON.stringify(result, null, 2));
}
