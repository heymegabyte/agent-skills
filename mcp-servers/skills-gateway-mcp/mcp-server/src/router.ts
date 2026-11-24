/**
 * router.ts — Deterministic Emdash Task-to-Skill, Rule, and MCP Server Router.
 *
 * Bridges Emdash's `_router.md`, `SKILL_PROFILES.md`, and the 25 active Paperclip
 * MCP Gateway connections so any agent in Emdash or Paperclip can route a task prompt
 * to the exact skills, reference docs, doctrine rules, and MCP servers on demand.
 *
 * @module
 */
import type { IndexEntry } from './index-builder.js';
import { searchEntries, tokenize } from './search.js';

export interface McpServerRouteEntry {
  id: string;
  name: string;
  paperclipConnection: string;
  gatewayNamespace: string;
  transport: 'local_stdio' | 'mcp_remote' | 'rest_api';
  toolCount: number;
  description: string;
  keywords: string[];
  keyTools: string[];
  relatedSkills: string[];
}

export const MCP_SERVERS_CATALOG: readonly McpServerRouteEntry[] = [
  {
    id: 'skills-gateway-mcp',
    name: 'Skills Gateway MCP',
    paperclipConnection: 'Skills Gateway MCP',
    gatewayNamespace: 'mcp.skills-gateway-mcp-8fbba983',
    transport: 'local_stdio',
    toolCount: 5,
    description: 'On-demand Emdash skill, reference doc, doctrine rule, and MCP server router & loader.',
    keywords: ['skill', 'skills', 'rule', 'rules', 'doctrine', 'route', 'router', 'emdash', 'conventions', 'reference', 'load'],
    keyTools: ['route_task', 'route_mcp_servers', 'search_skills', 'load_skill', 'find_rule'],
    relatedSkills: ['operating-system', 'emdash-skills'],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    paperclipConnection: 'Cloudflare for the organization',
    gatewayNamespace: 'mcp.cloudflare-for-the-organization-aa5b4ec3',
    transport: 'local_stdio',
    toolCount: 7,
    description: 'Cloudflare Workers, Pages, D1, KV, R2, DNS records, CDN cache purge, and zone management.',
    keywords: ['cloudflare', 'workers', 'wrangler', 'd1', 'kv', 'r2', 'dns', 'cdn', 'purge', 'zone', 'edge', 'pages', 'hyperdrive', 'durable'],
    keyTools: ['cloudflare_list_zones', 'cloudflare_list_dns_records', 'cloudflare_upsert_dns_record', 'cloudflare_purge_cache', 'cloudflare_list_workers', 'cloudflare_list_d1_databases', 'cloudflare_query_d1'],
    relatedSkills: ['architecture-and-stack', 'platform-delivery', 'cf-integrations-reference', 'deploy-and-runtime-verification'],
  },
  {
    id: 'projectsites',
    name: 'ProjectSites MCP',
    paperclipConnection: 'ProjectSites MCP',
    gatewayNamespace: 'mcp.projectsites-mcp-900c5600',
    transport: 'local_stdio',
    toolCount: 34,
    description: 'ProjectSites portfolio registry, blog generation, site scaffolding, deployment verification, and multi-site orchestration.',
    keywords: ['projectsites', 'projectsite', 'blog', 'article', 'editorial', 'portfolio', 'site', 'sites', 'publish', 'property', 'properties', 'scaffold', 'template'],
    keyTools: ['projectsites_list_sites', 'projectsites_get_site', 'projectsites_audit_site', 'projectsites_publish_blog', 'projectsites_verify_deployment'],
    relatedSkills: ['blog-publishing', 'site-generation', 'content-seo', 'brand-and-content-system'],
  },
  {
    id: 'github',
    name: 'GitHub',
    paperclipConnection: 'GitHub',
    gatewayNamespace: 'mcp.github-d851ee8e',
    transport: 'mcp_remote',
    toolCount: 50,
    description: 'GitHub repositories, pull requests, issues, branches, commits, code search, and Actions workflows.',
    keywords: ['github', 'repo', 'repository', 'pull-request', 'pr', 'merge', 'branch', 'commit', 'actions', 'git'],
    keyTools: ['create_pull_request', 'merge_pull_request', 'list_pull_requests', 'get_file_contents', 'push_files', 'search_code', 'list_commits'],
    relatedSkills: ['github', 'build-and-slice-loop', 'deploy-and-runtime-verification'],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    paperclipConnection: 'Stripe for the organization',
    gatewayNamespace: 'mcp.stripe-for-the-organization-1cb6a7b0',
    transport: 'mcp_remote',
    toolCount: 11,
    description: 'Stripe customers, subscriptions, products, prices, payment links, invoices, and billing webhooks.',
    keywords: ['stripe', 'payment', 'payments', 'billing', 'subscription', 'subscriptions', 'checkout', 'invoice', 'customer', 'pricing', 'price', 'webhook'],
    keyTools: ['list_customers', 'create_customer', 'list_products', 'create_product', 'create_price', 'create_payment_link', 'list_subscriptions', 'list_invoices'],
    relatedSkills: ['stripe', 'observability-and-growth', 'functional'],
  },
  {
    id: 'square',
    name: 'Square',
    paperclipConnection: 'Square for the organization',
    gatewayNamespace: 'mcp.square-for-the-organization-b222066b',
    transport: 'local_stdio',
    toolCount: 50,
    description: 'Square POS, payments, catalog items, orders, invoices, bookings, and merchant locations.',
    keywords: ['square', 'pos', 'terminal', 'merchant', 'square-catalog', 'booking'],
    keyTools: ['square_list_locations', 'square_list_payments', 'square_create_payment', 'square_list_catalog', 'square_create_order'],
    relatedSkills: ['square', 'functional'],
  },
  {
    id: 'supabase',
    name: 'Supabase',
    paperclipConnection: 'Supabase for the organization',
    gatewayNamespace: 'mcp.supabase-for-the-organization-4e5c8078',
    transport: 'mcp_remote',
    toolCount: 27,
    description: 'Supabase Postgres databases, SQL execution, migrations, RLS policies, edge functions, and branching.',
    keywords: ['supabase', 'postgres', 'postgresql', 'sql', 'database', 'migration', 'rls', 'schema', 'table', 'query', 'drizzle'],
    keyTools: ['execute_sql', 'apply_migration', 'list_tables', 'list_migrations', 'get_advisors', 'list_projects'],
    relatedSkills: ['architecture-and-stack', 'app-foundation', 'trust-compliance'],
  },
  {
    id: 'posthog',
    name: 'PostHog',
    paperclipConnection: 'PostHog for the organization',
    gatewayNamespace: 'mcp.posthog-for-the-organization-21c61a4b',
    transport: 'local_stdio',
    toolCount: 13,
    description: 'PostHog product analytics, HogQL insights, funnels, feature flags, experiments, and session replay.',
    keywords: ['posthog', 'analytics', 'hogql', 'funnel', 'flag', 'flags', 'experiment', 'ab-test', 'telemetry', 'events', 'conversion', 'retention'],
    keyTools: ['posthog_list_feature_flags', 'posthog_create_feature_flag', 'posthog_query_hogql', 'posthog_list_insights', 'posthog_list_experiments'],
    relatedSkills: ['posthog', 'observability-and-growth'],
  },
  {
    id: 'sentry',
    name: 'Sentry',
    paperclipConnection: 'Sentry for the organization',
    gatewayNamespace: 'mcp.sentry-for-the-organization-40d6b485',
    transport: 'local_stdio',
    toolCount: 6,
    description: 'Sentry error tracking, unresolved production issues, stacktraces, release health, and alerts.',
    keywords: ['sentry', 'error', 'errors', 'exception', 'crash', 'stacktrace', 'incident', 'bug', 'monitoring', 'alert', 'sre'],
    keyTools: ['sentry_list_projects', 'sentry_list_issues', 'sentry_get_issue', 'sentry_list_issue_events', 'sentry_resolve_issue'],
    relatedSkills: ['observability-and-growth', 'deploy-and-runtime-verification', 'quality-and-verification'],
  },
  {
    id: 'resend',
    name: 'Resend',
    paperclipConnection: 'Resend for the organization',
    gatewayNamespace: 'mcp.resend-for-the-organization-ff91c322',
    transport: 'local_stdio',
    toolCount: 83,
    description: 'Transactional and broadcast email delivery, domains, audiences, contacts, templates, and webhooks.',
    keywords: ['resend', 'email', 'emails', 'newsletter', 'broadcast', 'transactional', 'dkim', 'spf', 'domain', 'audience', 'contact'],
    keyTools: ['resend_send_email', 'resend_list_domains', 'resend_verify_domain', 'resend_list_audiences', 'resend_create_broadcast'],
    relatedSkills: ['resend', 'brand-and-content-system', 'observability-and-growth'],
  },
  {
    id: 'twilio',
    name: 'Twilio',
    paperclipConnection: 'Twilio for the organization',
    gatewayNamespace: 'mcp.twilio-for-the-organization-b208993f',
    transport: 'local_stdio',
    toolCount: 58,
    description: 'Twilio SMS, MMS, programmable voice calls, Verify OTP, phone numbers, and messaging services.',
    keywords: ['twilio', 'sms', 'mms', 'phone', 'voice', 'otp', 'twilio-verify', 'text-message', 'telephony'],
    keyTools: ['twilio_send_sms', 'twilio_list_messages', 'twilio_make_call', 'twilio_list_phone_numbers', 'twilio_start_verification'],
    relatedSkills: ['twilio', 'functional'],
  },
  {
    id: 'bitwarden',
    name: 'Bitwarden',
    paperclipConnection: 'Bitwarden for the organization',
    gatewayNamespace: 'mcp.bitwarden-for-the-organization-10a9da77',
    transport: 'local_stdio',
    toolCount: 28,
    description: 'Bitwarden Secrets Manager and vault items, credentials, API keys, and secret rotation.',
    keywords: ['bitwarden', 'secret', 'secrets', 'vault', 'credential', 'credentials', 'password', 'api-key', 'token', 'rotation'],
    keyTools: ['bitwarden_list_secrets', 'bitwarden_get_secret', 'bitwarden_create_secret', 'bitwarden_update_secret'],
    relatedSkills: ['bitwarden', 'trust-compliance', 'operating-system'],
  },
  {
    id: 'openai',
    name: 'OpenAI Tools',
    paperclipConnection: 'OpenAI Tools for the organization',
    gatewayNamespace: 'mcp.openai-tools-for-the-organization-204823df',
    transport: 'local_stdio',
    toolCount: 12,
    description: 'OpenAI embeddings, image generation, audio transcription/TTS, moderation, and model inspection.',
    keywords: ['openai', 'embedding', 'embeddings', 'image', 'tts', 'whisper', 'audio', 'moderation', 'gpt', 'vector'],
    keyTools: ['openai_create_embedding', 'openai_generate_image', 'openai_moderate_text', 'openai_list_models'],
    relatedSkills: ['openai', 'media-orchestration', 'tri-harness-deepseek-ollama-routing'],
  },
  {
    id: 'cua-driver',
    name: 'CUA Computer-Use Driver',
    paperclipConnection: 'CUA Computer-Use Driver',
    gatewayNamespace: 'mcp.cua-computer-use-driver-18e9e98d',
    transport: 'local_stdio',
    toolCount: 66,
    description: 'Native desktop GUI & browser automation, accessibility tree snapshots, clicks, typing, window control, and screen recording.',
    keywords: ['cua', 'gui', 'desktop', 'window', 'screen', 'screenshot', 'click', 'accessibility-tree', 'computer-use', 'native-app', 'record'],
    keyTools: ['get_desktop_state', 'get_accessibility_tree', 'click', 'type_text', 'hotkey', 'browser_navigate', 'verify_state'],
    relatedSkills: ['cua-driver', 'agent-browser', 'quality-and-verification'],
  },
  {
    id: 'browser-use',
    name: 'Browser Use Cloud',
    paperclipConnection: 'Browser Use Cloud for the organization',
    gatewayNamespace: 'mcp.browser-use-cloud-for-the-organization-8de0ff34',
    transport: 'rest_api',
    toolCount: 7,
    description: 'Cloud headless browser sessions, autonomous web navigation, scraping, and live browser task execution.',
    keywords: ['browser', 'playwright', 'scrape', 'scraping', 'crawl', 'web', 'headless', 'e2e', 'navigation'],
    keyTools: ['browser_task', 'list_sessions', 'get_session'],
    relatedSkills: ['agent-browser', 'quality-and-verification', 'tdd-and-verification'],
  },
  {
    id: 'executor',
    name: 'Executor',
    paperclipConnection: 'Executor',
    gatewayNamespace: 'mcp.executor-1619564d',
    transport: 'local_stdio',
    toolCount: 3,
    description: 'Sandboxed command verification, health probes, and runtime execution checks on the host.',
    keywords: ['executor', 'probe', 'runtime', 'command', 'healthcheck', 'verify'],
    keyTools: ['executor_probe_http', 'executor_system_info', 'executor_run_check'],
    relatedSkills: ['deploy-and-runtime-verification', 'operating-system'],
  },
  {
    id: 'notion',
    name: 'Notion',
    paperclipConnection: 'Notion for the organization',
    gatewayNamespace: 'mcp.notion-for-the-organization-a9daedef',
    transport: 'local_stdio',
    toolCount: 3,
    description: 'Notion workspace pages, knowledge bases, databases, and documentation search.',
    keywords: ['notion', 'wiki', 'knowledge-base', 'docs', 'page', 'notes'],
    keyTools: ['notion_search', 'notion_get_page', 'notion_create_page'],
    relatedSkills: ['goal-and-brief', 'preference-and-memory'],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    paperclipConnection: 'Shopify for the organization',
    gatewayNamespace: 'mcp.shopify-for-the-organization-53815bf1',
    transport: 'mcp_remote',
    toolCount: 14,
    description: 'Shopify e-commerce store products, collections, inventory, orders, customers, and discounts.',
    keywords: ['shopify', 'ecommerce', 'store', 'cart', 'product', 'inventory', 'merch'],
    keyTools: ['list_products', 'create_product', 'list_orders', 'list_customers'],
    relatedSkills: ['functional', 'observability-and-growth'],
  },
  {
    id: 'mem0',
    name: 'Mem0',
    paperclipConnection: 'Mem0 for the organization',
    gatewayNamespace: 'mcp.mem0-for-the-organization-db68396d',
    transport: 'mcp_remote',
    toolCount: 11,
    description: 'Long-term semantic agent memory, user preference recall, and entity memory graph.',
    keywords: ['mem0', 'memory', 'remember', 'recall', 'preference', 'preferences', 'context'],
    keyTools: ['add_memory', 'search_memories', 'get_memories', 'delete_memory'],
    relatedSkills: ['preference-and-memory', 'para-memory-files'],
  },
  {
    id: 'supermemory',
    name: 'Supermemory',
    paperclipConnection: 'Supermemory',
    gatewayNamespace: 'mcp.supermemory-2338d26c',
    transport: 'mcp_remote',
    toolCount: 22,
    description: 'Cross-project knowledge graph, document ingestion, and semantic search memory.',
    keywords: ['supermemory', 'knowledge', 'archive', 'semantic-search', 'ingest', 'rag'],
    keyTools: ['add_document', 'search_documents', 'list_memories'],
    relatedSkills: ['preference-and-memory', 'para-memory-files'],
  },
  {
    id: 'composio',
    name: 'Composio',
    paperclipConnection: 'Composio',
    gatewayNamespace: 'mcp.composio-de1cbed2',
    transport: 'mcp_remote',
    toolCount: 12,
    description: 'Multi-SaaS OAuth connector hub (Slack, Gmail, Google Calendar, Linear, HubSpot, etc.).',
    keywords: ['composio', 'oauth', 'slack', 'calendar', 'gmail', 'hubspot', 'saas', 'integration'],
    keyTools: ['search_tools', 'execute_action', 'list_connections'],
    relatedSkills: ['cf-integrations-reference', 'functional'],
  },
];

export interface RoleSkillPack {
  role: string;
  primarySkills: string[];
  primaryMcpIds: string[];
  focusSummary: string;
}

export const ROLE_SKILL_PACKS: Record<string, RoleSkillPack> = {
  ceo: {
    role: 'ceo',
    primarySkills: ['01-operating-system', '02-goal-and-brief', '05-architecture-and-stack', '13-observability-and-growth', 'blog-publishing', 'paperclip', 'paperclip-board', 'tri-harness-deepseek-ollama-routing'],
    primaryMcpIds: ['skills-gateway-mcp', 'projectsites', 'github', 'cloudflare', 'posthog', 'sentry'],
    focusSummary: 'Strategic mission command, multi-agent epic decomposition, sub-task/reviewer/approver/watchdog governance, and portfolio-wide orchestration.',
  },
  architect: {
    role: 'architect',
    primarySkills: ['05-architecture-and-stack', '02-goal-and-brief', '21-app-foundation', '28-cf-integrations-reference', '06-build-and-slice-loop', '27-trust-compliance'],
    primaryMcpIds: ['skills-gateway-mcp', 'cloudflare', 'supabase', 'github', 'projectsites'],
    focusSummary: 'Frontier Architect OpenSpec authoring, Hono RPC + Drizzle v1-rc contracts, @theme.tools 28 canonical library extraction, and multi-tenant system design.',
  },
  fullstack: {
    role: 'fullstack',
    primarySkills: ['05-architecture-and-stack', '06-build-and-slice-loop', '10-experience-and-design-system', '21-app-foundation', '24-functional', 'tdd-and-verification'],
    primaryMcpIds: ['skills-gateway-mcp', 'github', 'cloudflare', 'supabase', 'projectsites'],
    focusSummary: 'End-to-end CF Workers + Hono + React 19 / Angular 22 implementation, @theme.tools components, and 6-breakpoint Playwright TDD.',
  },
  backend: {
    role: 'backend',
    primarySkills: ['05-architecture-and-stack', '06-build-and-slice-loop', '21-app-foundation', '24-functional', '28-cf-integrations-reference', 'tdd-and-verification'],
    primaryMcpIds: ['skills-gateway-mcp', 'cloudflare', 'supabase', 'stripe', 'resend', 'twilio', 'github'],
    focusSummary: 'Hono inline RPC handlers, Zod input validation, Drizzle v1-rc migrations, Better Auth, Stripe/Square webhooks, and Inngest workflows.',
  },
  'ui-designer': {
    role: 'ui-designer',
    primarySkills: ['10-experience-and-design-system', '11-motion-and-interaction-system', '16-cinematic-website-prime-directive', '22-visual-experience', '12-media-orchestration'],
    primaryMcpIds: ['skills-gateway-mcp', 'cua-driver', 'browser-use', 'projectsites', 'openai'],
    focusSummary: 'Dark-first #060610 / #00E5FF design system, 16 interactive states, 0.333s OKLCH transitions, and @theme.tools/ui extraction.',
  },
  qa: {
    role: 'qa',
    primarySkills: ['07-quality-and-verification', 'tdd-and-verification', '08-deploy-and-runtime-verification', '25-quality-performance', 'agent-browser', 'cua-driver'],
    primaryMcpIds: ['skills-gateway-mcp', 'browser-use', 'cua-driver', 'executor', 'sentry', 'github'],
    focusSummary: 'Playwright v1.63+ 6-breakpoint verification, zero console/network error gates, contract testing, and binary Proof of Life.',
  },
  appsec: {
    role: 'appsec',
    primarySkills: ['07-quality-and-verification', '27-trust-compliance', 'bitwarden', '05-architecture-and-stack'],
    primaryMcpIds: ['skills-gateway-mcp', 'bitwarden', 'github', 'cloudflare', 'supabase', 'sentry'],
    focusSummary: 'OWASP/agentic security hardening, secret hygiene via Bitwarden/Infisical, RLS tenant isolation, CSP/CORS/HSTS headers, and auth gates.',
  },
  a11y: {
    role: 'a11y',
    primarySkills: ['07-quality-and-verification', '10-experience-and-design-system', '22-visual-experience', '25-quality-performance'],
    primaryMcpIds: ['skills-gateway-mcp', 'browser-use', 'cua-driver', 'github'],
    focusSummary: 'WCAG 2.2 AA compliance, keyboard navigation, ARIA semantics, focus management, reduced-motion, and contrast verification.',
  },
  content: {
    role: 'content',
    primarySkills: ['blog-publishing', '09-brand-and-content-system', '23-content-seo', '15-site-generation', 'release-announcement'],
    primaryMcpIds: ['skills-gateway-mcp', 'projectsites', 'github', 'resend', 'notion'],
    focusSummary: '2,000–3,000+ substantive word editorial articles (@theme-tools/blog), ~12 E01–E30 visuals, live DataForSEO v3 capture, and inline citations.',
  },
  'seo-auditor': {
    role: 'seo-auditor',
    primarySkills: ['23-content-seo', 'blog-publishing', '09-brand-and-content-system', '15-site-generation', '25-quality-performance'],
    primaryMcpIds: ['skills-gateway-mcp', 'projectsites', 'cloudflare', 'posthog', 'browser-use'],
    focusSummary: 'Technical SEO, GEO/AEO AI citation optimization, JSON-LD schema, sitemap/robots/llms.txt, Core Web Vitals, and DataForSEO keyword research.',
  },
  growth: {
    role: 'growth',
    primarySkills: ['13-observability-and-growth', 'posthog', 'stripe', 'resend', '23-content-seo', 'blog-publishing'],
    primaryMcpIds: ['skills-gateway-mcp', 'posthog', 'stripe', 'resend', 'projectsites', 'shopify'],
    focusSummary: 'PostHog funnels & feature-flag experiments, conversion rate optimization, Stripe checkout flows, and lifecycle email automation.',
  },
  sre: {
    role: 'sre',
    primarySkills: ['08-deploy-and-runtime-verification', '13-observability-and-growth', '26-platform-delivery', 'operating-system'],
    primaryMcpIds: ['skills-gateway-mcp', 'cloudflare', 'sentry', 'executor', 'posthog', 'github'],
    focusSummary: 'Zero-downtime CF Workers / systemd / Docker operation, Sentry incident response, CDN cache purge, backups, and watchdog recovery.',
  },
  devsecops: {
    role: 'devsecops',
    primarySkills: ['08-deploy-and-runtime-verification', '26-platform-delivery', '27-trust-compliance', 'bitwarden', 'cf-integrations-reference'],
    primaryMcpIds: ['skills-gateway-mcp', 'cloudflare', 'bitwarden', 'github', 'executor', 'sentry'],
    focusSummary: 'CI/CD pipelines, Cloudflare auto-provisioning, secret rotation, supply-chain security, and deployment verification.',
  },
  release: {
    role: 'release',
    primarySkills: ['08-deploy-and-runtime-verification', '26-platform-delivery', 'release-announcement', 'github'],
    primaryMcpIds: ['skills-gateway-mcp', 'github', 'cloudflare', 'sentry', 'executor', 'projectsites'],
    focusSummary: 'Trunk-based main PR merge gate, semantic versioning, registry.megabyte.space publishing, wrangler deploy + CDN purge, and release notes.',
  },
  database: {
    role: 'database',
    primarySkills: ['05-architecture-and-stack', '21-app-foundation', '27-trust-compliance', '08-deploy-and-runtime-verification'],
    primaryMcpIds: ['skills-gateway-mcp', 'supabase', 'cloudflare', 'github', 'executor'],
    focusSummary: 'Drizzle v1-rc schemas, zero-downtime D1/Neon/Supabase migrations, indexing, query performance, and backup verification.',
  },
  performance: {
    role: 'performance',
    primarySkills: ['25-quality-performance', '07-quality-and-verification', '05-architecture-and-stack', '11-motion-and-interaction-system'],
    primaryMcpIds: ['skills-gateway-mcp', 'cloudflare', 'posthog', 'sentry', 'browser-use'],
    focusSummary: 'Core Web Vitals (LCP/INP/CLS), bundle budgets, edge caching, SQL/Worker latency optimization, and 60fps animation performance.',
  },
  browser: {
    role: 'browser',
    primarySkills: ['agent-browser', '07-quality-and-verification', 'tdd-and-verification', '22-visual-experience'],
    primaryMcpIds: ['skills-gateway-mcp', 'browser-use', 'cua-driver', 'projectsites', 'github'],
    focusSummary: 'Autonomous Playwright & Browser Use Cloud E2E verification, 6-breakpoint visual inspection, and live DOM/network auditing.',
  },
  'computer-use': {
    role: 'computer-use',
    primarySkills: ['cua-driver', 'agent-browser', '07-quality-and-verification', 'operating-system'],
    primaryMcpIds: ['skills-gateway-mcp', 'cua-driver', 'browser-use', 'executor'],
    focusSummary: 'Native desktop GUI automation via CUA Driver, accessibility tree targeting, window orchestration, and visual state verification.',
  },
};

interface TaskIntentRoute {
  id: string;
  label: string;
  keywords: string[];
  skills: string[];
  rules: string[];
  mcpIds: string[];
  qualityGate?: string;
}

const TASK_INTENT_ROUTES: readonly TaskIntentRoute[] = [
  {
    id: 'blog-editorial',
    label: 'Blog & Reference Article Publishing (@theme-tools/blog)',
    keywords: ['blog', 'article', 'articles', 'post', 'posts', 'editorial', 'publish', 'writing', 'content-engine', 'bibliography', 'citation', 'dataforseo'],
    skills: ['blog-publishing', '23-content-seo', '09-brand-and-content-system', '15-site-generation'],
    rules: ['gorgeous-by-default', 'theme-tools-canonical-components', 'total-convergence-and-openspec-handoff'],
    mcpIds: ['projectsites', 'skills-gateway-mcp', 'cloudflare', 'github', 'openai'],
    qualityGate: 'BLOG EDITORIAL GATE: Must produce >= 2,000 substantive editorial words (target 2,000–3,000+ words via computeSubstantiveWordCount >= 2000), ~12 substantive visual placements (E01–E30), live DataForSEO v3 capture (isFixture: false), inline CitationNode ([n]) + BibliographyWidget, and pass all 12 checks in runQualityAndReleaseGate.',
  },
  {
    id: 'ui-design-visual',
    label: 'UI/UX Component, Design System & Visual Experience',
    keywords: ['ui', 'ux', 'design', 'component', 'widget', 'css', 'tailwind', 'shadcn', 'spartan', 'theme', 'dark-mode', 'oklch', 'animation', 'motion', 'hero', 'landing', 'layout', 'responsive'],
    skills: ['10-experience-and-design-system', '11-motion-and-interaction-system', '16-cinematic-website-prime-directive', '22-visual-experience', '06-build-and-slice-loop'],
    rules: ['gorgeous-by-default', 'theme-tools-canonical-components', 'total-convergence-and-openspec-handoff'],
    mcpIds: ['skills-gateway-mcp', 'cua-driver', 'browser-use', 'projectsites'],
    qualityGate: 'UI CONVERGENCE GATE: Dark-first (#060610 bg, #00E5FF accent), 16 visual states, 0.333s OKLCH transitions, opportunistic extraction to @theme.tools/ui or @theme.tools/themes, and 6-breakpoint Playwright verification.',
  },
  {
    id: 'cloudflare-workers-api',
    label: 'Cloudflare Workers, Hono API & Edge Delivery',
    keywords: ['cloudflare', 'worker', 'workers', 'hono', 'wrangler', 'api', 'endpoint', 'rpc', 'd1', 'kv', 'r2', 'edge', 'cdn', 'dns', 'deploy'],
    skills: ['05-architecture-and-stack', '26-platform-delivery', '28-cf-integrations-reference', '08-deploy-and-runtime-verification', '21-app-foundation'],
    rules: ['prefer-typescript', 'theme-tools-canonical-components'],
    mcpIds: ['cloudflare', 'skills-gateway-mcp', 'github', 'sentry', 'executor'],
    qualityGate: 'CF WORKERS & API GATE: TypeScript strict (never any, prefer interface over type), Hono inline handlers for RPC type inference, Zod validation on all inputs, deploy to CF Workers and purge CDN cache after deploy.',
  },
  {
    id: 'database-drizzle-sql',
    label: 'Database Schema, Drizzle ORM & SQL Migrations',
    keywords: ['database', 'db', 'drizzle', 'sql', 'postgres', 'postgresql', 'supabase', 'neon', 'd1', 'migration', 'schema', 'query', 'index', 'rls', 'tenant'],
    skills: ['05-architecture-and-stack', '21-app-foundation', '27-trust-compliance', '08-deploy-and-runtime-verification'],
    rules: ['prefer-typescript', 'zero-trust-security'],
    mcpIds: ['supabase', 'cloudflare', 'skills-gateway-mcp', 'github'],
  },
  {
    id: 'payments-billing',
    label: 'Payments, Subscriptions & Billing (Stripe / Square)',
    keywords: ['stripe', 'square', 'payment', 'payments', 'billing', 'checkout', 'subscription', 'invoice', 'pricing', 'plan', 'webhook', 'monetization'],
    skills: ['stripe', 'square', '13-observability-and-growth', '24-functional', '05-architecture-and-stack'],
    rules: ['theme-tools-canonical-components', 'zero-trust-security'],
    mcpIds: ['stripe', 'square', 'skills-gateway-mcp', 'posthog', 'resend'],
  },
  {
    id: 'email-messaging-sms',
    label: 'Email, SMS, Voice & Notifications (Resend / SES / Twilio)',
    keywords: ['email', 'resend', 'ses', 'newsletter', 'transactional', 'twilio', 'sms', 'mms', 'voice', 'otp', 'notification', 'notifications'],
    skills: ['resend', 'twilio', '09-brand-and-content-system', '13-observability-and-growth', '24-functional'],
    rules: ['theme-tools-canonical-components'],
    mcpIds: ['resend', 'twilio', 'skills-gateway-mcp', 'composio'],
  },
  {
    id: 'analytics-flags-growth',
    label: 'Analytics, Feature Flags, Experiments & Growth (PostHog)',
    keywords: ['posthog', 'analytics', 'telemetry', 'flag', 'flags', 'feature-flag', 'experiment', 'funnel', 'conversion', 'cro', 'growth', 'hogql'],
    skills: ['13-observability-and-growth', 'posthog', '23-content-seo'],
    rules: ['theme-tools-canonical-components', 'auto-integrate-recs'],
    mcpIds: ['posthog', 'skills-gateway-mcp', 'sentry', 'stripe'],
  },
  {
    id: 'qa-testing-verification',
    label: 'TDD, Playwright 6-Breakpoint E2E & Runtime Verification',
    keywords: ['test', 'tests', 'testing', 'tdd', 'playwright', 'e2e', 'qa', 'verify', 'verification', 'bug', 'fix', 'regression', 'breakpoint', 'a11y', 'accessibility', 'wcag'],
    skills: ['07-quality-and-verification', 'tdd-and-verification', '08-deploy-and-runtime-verification', '25-quality-performance', 'agent-browser', 'cua-driver'],
    rules: ['total-convergence-and-openspec-handoff', 'prefer-typescript'],
    mcpIds: ['browser-use', 'cua-driver', 'executor', 'sentry', 'skills-gateway-mcp', 'github'],
    qualityGate: 'TDD & VERIFICATION GATE: Failing test first, Playwright v1.63+ across 6 breakpoints (320, 375, 768, 1024, 1440, 1920), zero console/page/network errors, and live runtime proof.',
  },
  {
    id: 'security-secrets-auth',
    label: 'Security, Auth, Secrets & Compliance (Better Auth / Bitwarden)',
    keywords: ['security', 'auth', 'authentication', 'oauth', 'session', 'passkey', 'secret', 'secrets', 'bitwarden', 'infisical', 'csp', 'cors', 'owasp', 'vulnerability', 'audit'],
    skills: ['27-trust-compliance', '07-quality-and-verification', 'bitwarden', '05-architecture-and-stack'],
    rules: ['zero-trust-security', 'never-print-secrets'],
    mcpIds: ['bitwarden', 'skills-gateway-mcp', 'cloudflare', 'supabase', 'sentry', 'github'],
  },
  {
    id: 'openspec-architecture-planning',
    label: 'OpenSpec Authoring, Architecture & Strategic Planning',
    keywords: ['openspec', 'spec', 'proposal', 'architecture', 'design-doc', 'roadmap', 'plan', 'planning', 'epic', 'decompose', 'brief'],
    skills: ['02-goal-and-brief', '05-architecture-and-stack', '14-independent-idea-engine', 'paperclip-converting-plans-to-tasks'],
    rules: ['total-convergence-and-openspec-handoff', 'prompt-as-training-signal', 'auto-integrate-recs'],
    mcpIds: ['skills-gateway-mcp', 'github', 'notion', 'supermemory'],
    qualityGate: 'OPENSPEC ARCHITECT GATE: Only Frontier Architect (claude / codex / antigravity — NEVER opencode) authors OpenSpec details (proposal.md, design.md, tasks.md, specs/). Sync linked issues in Paperclip.',
  },
  {
    id: 'paperclip-fleet-governance',
    label: 'Paperclip Fleet Orchestration, Board Governance & Model Routing',
    keywords: ['paperclip', 'swarml.ink', 'board', 'conference', 'agent', 'agents', 'subtask', 'reviewer', 'approver', 'watchdog', 'decision', 'openclaw', 'deepseek', 'ollama', 'litellm', 'langfuse'],
    skills: ['paperclip', 'paperclip-board', 'paperclip-converting-plans-to-tasks', 'paperclip-create-agent', 'openclaw-integration', 'tri-harness-deepseek-ollama-routing', '01-operating-system'],
    rules: ['total-convergence-and-openspec-handoff', 'auto-integrate-recs'],
    mcpIds: ['skills-gateway-mcp', 'executor', 'github', 'mem0', 'supermemory'],
    qualityGate: 'PAPERCLIP GOVERNANCE GATE: Populate Sub-tasks (parent_id), Reviewers (QA-Verification, AppSec, A11y-Auditor), Approvers (Architect, Release-Manager, CEO), Monitor, Watchdog, and reserve Decisions (/MEG/decisions) strictly for user questions/recommendations. Trace LLM calls to Langfuse with 2500ms timeout fallback.',
  },
];

export interface RoutedMcpHit {
  server: McpServerRouteEntry;
  score: number;
  matchedKeywords: string[];
}

/** Rank MCP servers for a task description or capability query. */
export function matchMcpServers(query: string, role?: string, limit = 6): RoutedMcpHit[] {
  const tokens = tokenize(query);
  const lower = query.toLowerCase();
  const rolePack = role ? ROLE_SKILL_PACKS[role.toLowerCase()] : undefined;
  const roleMcpSet = new Set(rolePack?.primaryMcpIds ?? []);

  const hits: RoutedMcpHit[] = [];
  for (const server of MCP_SERVERS_CATALOG) {
    let score = 0;
    const matchedKeywords: string[] = [];

    if (lower.includes(server.id) || lower.includes(server.name.toLowerCase())) {
      score += 80;
      matchedKeywords.push(server.id);
    }

    for (const kw of server.keywords) {
      if (tokens.includes(kw) || new RegExp(`(^|[^a-z0-9])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`).test(lower)) {
        score += 25;
        if (!matchedKeywords.includes(kw)) matchedKeywords.push(kw);
      }
    }

    for (const tool of server.keyTools) {
      if (lower.includes(tool.toLowerCase())) {
        score += 40;
        matchedKeywords.push(tool);
      }
    }

    if (roleMcpSet.has(server.id)) {
      score += 15;
    }

    // Always include skills-gateway-mcp as a baseline capability when routing tasks
    if (server.id === 'skills-gateway-mcp' && score === 0) {
      score = 10;
    }

    if (score > 0) {
      hits.push({ server, score, matchedKeywords: matchedKeywords.slice(0, 6) });
    }
  }

  hits.sort((a, b) => b.score - a.score || a.server.name.localeCompare(b.server.name));
  return hits.slice(0, limit);
}

/** Format `route_mcp_servers` output for agents. */
export function formatMcpServerRoutes(query: string, limit = 6): string {
  const hits = matchMcpServers(query, undefined, limit);
  const selected = hits.length > 0 ? hits : MCP_SERVERS_CATALOG.slice(0, 6).map((s) => ({ server: s, score: 10, matchedKeywords: [] }));

  const lines: string[] = [
    `# Emdash & Paperclip MCP Server Routing for: "${query}"`,
    '',
    'Invoke any routed MCP tool directly via its Paperclip MCP Gateway tool name (`<gatewayNamespace>:<tool>`) or via the CLI:',
    '- `paperclip-mcp list-tools <filter>`',
    '- `paperclip-mcp call <gatewayNamespace>:<tool> \'{"arg":"value"}\'`',
    '',
  ];

  for (const { server, score, matchedKeywords } of selected) {
    lines.push(
      `## ${server.name} (\`${server.id}\`) — score ${score}`,
      `- **Paperclip Connection**: \`${server.paperclipConnection}\` (${server.transport}, ${server.toolCount} tools)`,
      `- **Gateway Namespace**: \`${server.gatewayNamespace}\``,
      `- **Capability**: ${server.description}`,
      `- **Key Tools**: ${server.keyTools.map((t) => `\`${server.gatewayNamespace}:${t}\``).join(', ')}`,
      `- **Paired Emdash Skills**: ${server.relatedSkills.map((s) => `\`${s}\``).join(', ')}`,
      ...(matchedKeywords.length > 0 ? [`- **Matched Signals**: ${matchedKeywords.join(', ')}`] : []),
      '',
    );
  }

  return lines.join('\n').trimEnd();
}

export interface RouteTaskOptions {
  prompt: string;
  agent_role?: string;
  repo_name?: string;
  max_skills?: number;
  max_rules?: number;
}

/** Classify repository/task profile per `SKILL_PROFILES.md`. */
export function classifyTaskProfile(prompt: string, repoName?: string): string {
  const combined = `${repoName ?? ''} ${prompt}`.toLowerCase();
  if (/foundation|mission|charity|donate|nonprofit/.test(combined)) return 'Nonprofit';
  if (/\b(blog|article|editorial|dataforseo|bibliography)\b/.test(combined)) return 'Editorial & Blog Publishing';
  if (/\b(api|hono|webhook|openapi|endpoint|rpc)\b/.test(combined) && !/\b(dashboard|ui|hero|landing)\b/.test(combined)) return 'API Service';
  if (/\b(cli|sdk|plugin|mcp-server|developer-tool)\b/.test(combined)) return 'Developer Tool';
  if (/\b(admin|internal|backoffice|ops|control-plane|paperclip|swarml\.ink)\b/.test(combined)) return 'Internal / Control-Plane Tool';
  if (/\b(saas|dashboard|portal|multi-tenant|subscription|stripe)\b/.test(combined)) return 'SaaS Application';
  return 'Marketing / Content & Web Experience';
}

/**
 * Full deterministic Emdash + Paperclip task router.
 * Combines intent routing, role packs, live index search, MCP server routing, and quality gates.
 */
export function routeTask(entries: readonly IndexEntry[], opts: RouteTaskOptions): string {
  const { prompt, agent_role, repo_name } = opts;
  const maxSkills = Math.min(Math.max(opts.max_skills ?? 6, 1), 15);
  const maxRules = Math.min(Math.max(opts.max_rules ?? 4, 1), 10);
  const lower = prompt.toLowerCase();
  const tokens = tokenize(prompt);

  const profile = classifyTaskProfile(prompt, repo_name);
  const normalizedRole = agent_role?.toLowerCase().trim() ?? '';
  const rolePack = ROLE_SKILL_PACKS[normalizedRole];

  // 1. Match deterministic intent routes
  const matchedRoutes: Array<{ route: TaskIntentRoute; hits: number }> = [];
  for (const route of TASK_INTENT_ROUTES) {
    let hits = 0;
    for (const kw of route.keywords) {
      if (lower.includes(kw) || tokens.includes(kw)) hits++;
    }
    if (hits > 0) matchedRoutes.push({ route, hits });
  }
  matchedRoutes.sort((a, b) => b.hits - a.hits);

  // 2. Collect recommended skill names (preserving priority order)
  const wantedSkillNames: string[] = [];
  const addSkill = (s: string) => {
    if (!wantedSkillNames.includes(s)) wantedSkillNames.push(s);
  };
  for (const { route } of matchedRoutes.slice(0, 3)) {
    for (const s of route.skills) addSkill(s);
  }
  if (rolePack) {
    for (const s of rolePack.primarySkills) addSkill(s);
  }
  addSkill('01-operating-system');

  // Resolve against live index + rank search entries
  const byName = new Map<string, IndexEntry>();
  for (const e of entries) {
    if (e.kind === 'skill') {
      if (!byName.has(e.name) || /\/SKILL\.md$/.test(e.path)) {
        byName.set(e.name, e);
      }
      for (const alias of e.aliases) {
        if (!byName.has(alias)) byName.set(alias, e);
      }
      const firstSeg = e.path.split('/')[0];
      if (/^\d\d-/.test(firstSeg) && /\/SKILL\.md$/.test(e.path)) {
        byName.set(firstSeg, e);
      }
    }
  }

  const resolvedSkills: IndexEntry[] = [];
  const seenPaths = new Set<string>();
  for (const name of wantedSkillNames) {
    const found = byName.get(name) ?? byName.get(name.replace(/^\d\d-/, ''));
    if (found && !seenPaths.has(found.path)) {
      resolvedSkills.push(found);
      seenPaths.add(found.path);
    }
  }

  const searchSkillHits = searchEntries(entries, prompt, { kind: 'skill', limit: maxSkills });
  for (const hit of searchSkillHits) {
    if (!seenPaths.has(hit.entry.path)) {
      resolvedSkills.push(hit.entry);
      seenPaths.add(hit.entry.path);
    }
  }

  const finalSkills = resolvedSkills.slice(0, maxSkills);

  // 3. Collect recommended rules
  const ruleHits = searchEntries(entries, prompt, { kind: 'rule', limit: maxRules });
  const seenRulePaths = new Set(ruleHits.map((r) => r.entry.path));
  const finalRules = ruleHits.map((r) => r.entry);
  for (const { route } of matchedRoutes.slice(0, 2)) {
    for (const rName of route.rules) {
      const rEntry = entries.find((e) => e.kind === 'rule' && (e.name === rName || e.aliases.includes(rName)));
      if (rEntry && !seenRulePaths.has(rEntry.path) && finalRules.length < maxRules) {
        finalRules.push(rEntry);
        seenRulePaths.add(rEntry.path);
      }
    }
  }

  // 4. Collect routed MCP servers
  const mcpHits = matchMcpServers(prompt, normalizedRole, 5);

  // 5. Collect active quality gates
  const activeGates = matchedRoutes
    .map((m) => m.route.qualityGate)
    .filter((g): g is string => Boolean(g));

  const lines: string[] = [
    `# Emdash Auto-Routed Execution Plan`,
    `- **Detected Profile**: ${profile}`,
    ...(rolePack ? [`- **Agent Role Pack**: \`${rolePack.role}\` — ${rolePack.focusSummary}`] : []),
    ...(matchedRoutes.length > 0
      ? [`- **Matched Intent Domains**: ${matchedRoutes.slice(0, 3).map((m) => m.route.label).join(' · ')}`]
      : []),
    '',
    '## 1. Routed Skills to Load On-Demand',
    'Load the full skill body or specific sections before implementing:',
    ...finalSkills.map(
      (s) =>
        `- **\`${s.name}\`** (\`${s.path}\`): ${s.description.slice(0, 160)}\n  → Load via MCP: \`load_skill({ name: "${s.name}" })\` or CLI: \`paperclip-mcp load-skill "${s.name}"\``,
    ),
    '',
    '## 2. Routed MCP Servers & Gateway Tool Namespaces',
    ...mcpHits.map(
      ({ server }) =>
        `- **${server.name}** (\`${server.gatewayNamespace}\` · ${server.toolCount} tools): ${server.description}\n  → Key tools: ${server.keyTools.slice(0, 4).map((t) => `\`${server.gatewayNamespace}:${t}\``).join(', ')}`,
    ),
    '',
    '## 3. Authoritative Emdash Doctrine Rules',
    ...(finalRules.length > 0
      ? finalRules.map(
          (r) =>
            `- **\`${r.name}\`** (\`${r.path}\`): ${r.description.slice(0, 150)}\n  → Inspect via: \`find_rule({ topic: "${r.name}" })\` or \`paperclip-mcp find-rule "${r.name}"\``,
        )
      : ['- Load core doctrine via `find_rule({ topic: "total convergence" })` or `paperclip-mcp find-rule "theme-tools"`']),
    '',
    '## 4. Non-Negotiable Emdash Quality Gates for This Task',
    ...activeGates.map((g) => `- ${g}`),
    '- **CORE DOCTRINE**: Prefer TypeScript over Python; Implement every recommendable idea in the same turn; Extract reusable components/engines into `@theme.tools/*` (28 canonical libraries); Run CREATE → RENDER/EXECUTE → EXPERIENCE → CRITIQUE → MODIFY → COMPARE; Trace AI calls to Langfuse (`2500ms` fail-open timeout).',
  ];

  return lines.join('\n');
}
