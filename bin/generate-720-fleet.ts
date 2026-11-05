#!/usr/bin/env node
/**
 * generate-720-fleet.ts
 * Generates the exhaustive 720 recommendations (30 per agent across 24 canonical roles),
 * authors the complete artifact markdown, and updates ~/.agentskills/agents/ profiles
 * with all 30 converged tactical capabilities and upgrades embedded.
 */

import { writeFileSync, mkdirSync, readFileSync, readdirSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const ARTIFACT_DIR = '/Users/Apple/.gemini/antigravity-cli/brain/a7e46d1a-2875-464a-aa89-cf5feadfbc88';
const AGENTS_DIR = resolve(homedir(), '.agentskills', 'agents');
mkdirSync(ARTIFACT_DIR, { recursive: true });
mkdirSync(AGENTS_DIR, { recursive: true });

export interface AgentRecommendations {
  name: string;
  title: string;
  rank: string;
  callSign: string;
  sector: string;
  recommendations: string[];
}

export const FLEET_RECOMMENDATIONS: AgentRecommendations[] = [
  {
    name: 'ceo',
    title: 'Supreme Commander & Fleet Orchestrator',
    rank: 'General of the Fleet (O-10)',
    callSign: 'VANGUARD-01',
    sector: 'Global Strategic Command, Multi-Agent Mission Assignment & Resource Sovereign',
    recommendations: [
      'Dynamic Dependency DAG Orchestrator: Generate acyclic execution graphs with zero circular dependencies across squads.',
      'Token Economic Ceiling Governor: Hard cap token burn with predictive extrapolation to prevent budget blowouts.',
      '9-Line SITREP Ingestion Pipeline: Parse standardized military status reports and update operational dashboards in real-time.',
      'Auftragstaktik Objective Decomposition: Translate high-level ambiguous briefs into explicit Commander Intent with binary acceptance criteria.',
      'PACE Comms Resilience Matrix: Dynamically fail over between Codex, Claude, DeepSeek, and Gemini without losing context.',
      'Disjoint Battle Space Enforcer: Guarantee that no two agent squads touch the same file tree simultaneously to eliminate merge conflicts.',
      'Sovereign Multi-Account Quota Arbiter: Allocate rate-limit buckets and monthly quotas across multiple provider accounts dynamically.',
      'Anti-Hallucination Verification Gates: Mandate verifiable Proof of Life (passing test suite / zero-exit status) before approving milestones.',
      'Autonomous Deadlock Arbiter: Detect inter-agent wait states and resolve priority locks using deterministic hierarchy rules.',
      'Continuous Skill Improvement Trigger: Automatically schedule skill upgrades based on operational failure retrospectives.',
      'One-Way vs. Two-Way Door Classifier: Tag decisions by reversibility; execute two-way doors instantly and audit one-way doors.',
      'Error-Budget Burn-Rate Monitor: Pause speculative feature deployments if the production error budget burns faster than 2x SLO rate.',
      'Kill-Switch Circuit Breaker: Instantly halt compromised or looping sub-agents across all active workspaces.',
      'Dark-Launch Feature Flag Coordinator: Mandate that all major architectural changes deploy dark before public routing.',
      'Cross-Repository Synchronizer: Orchestrate atomic multi-repository releases across agent-skills, install.doctor, and theme.tools.',
      'Battle Damage Assessment (BDA) Logger: Synthesize post-incident root causes into permanent institutional memory rules.',
      'Zero-Drift Documentation Auditor: Prevent PR merges where implementation diverges from architectural specification.',
      'Human-in-the-Loop Escalation Filter: Guardrail human attention by escalating only genuinely dangerous or financial actions.',
      'Dynamic Squad Reallocation: Shift autonomous sub-agent workers dynamically to congested critical paths.',
      'Context Hydration Enforcer: Strictly enforce the 900K token context hydration limit to maintain peak cognitive fidelity.',
      'Redundancy Pruning Engine: Periodically inspect task queues to terminate duplicate or obsolete exploratory sub-agents.',
      'Cryptographic Attestation Gate: Require cryptographic signing on all production deployment artifacts before release.',
      'Sprint Velocity & Token ROI Calculator: Measure code production and test velocity per dollar of LLM spend.',
      'Cross-Squad Memory Synchronizer: Consolidate shared domain discoveries into project memory files across agent boundaries.',
      'Security ROE Compliance Monitor: Continuously scan agent command streams for violations of Green/Amber/Red boundaries.',
      'Multi-Tenant Resource Allocator: Partition worker quotas cleanly across concurrent client organizations or project sites.',
      'Executive Briefing Distillation: Generate concise, punchy visual summaries for leadership without drowning in logs.',
      'Milestone Sign-Off Ledger: Maintain an immutable ledger of verifiable milestones signed off with exact git commit SHAs.',
      'Zero-Confirmation Engineering Mandate: Enforce silence-as-approval on standard non-destructive development workflows.',
      'Strategic Technical Debt Horizon Scanner: Quantify technical debt accumulation and schedule automated debt-repayment sprints.'
    ]
  },
  {
    name: 'architect',
    title: 'Chief of Staff & Principal Battle Planner',
    rank: 'Colonel (O-6)',
    callSign: 'STRAT-01',
    sector: 'System Topography, Contract-First Architecture & OpenSpec Governance',
    recommendations: [
      'AST-Aware Symbol Graph Navigator: Map entire codebase call graphs using Tree-Sitter to prevent breaking downstream callers.',
      'OpenAPI & Zod Contract Locking: Lock API schemas prior to writing implementation code to ensure zero drift.',
      'OpenSpec Universal Specification Authoring: Author RFCs, proposals, and task manifests strictly using frontier models (Claude/Codex/Antigravity).',
      'Edge-First Microservice Topology: Architect stateless services optimized for Cloudflare Workers and V8 isolates.',
      'Canonical @theme.tools Adoption Enforcer: Mandate reuse of standard @theme.tools shared packages before authoring custom utilities.',
      'Hexagonal Clean Architecture Boundaries: Isolate domain logic completely from database adapters and third-party transport layers.',
      'Bundle Size & Tree-Shaking Budget Guard: Enforce strict <150KB initial client bundle budgets in continuous integration.',
      'Idempotent Endpoint Contract Standard: Require all state-mutating API routes to accept and honor unique Idempotency-Keys.',
      'Time-to-First-Route (TTFR) Sub-200ms Mandate: Design routing and caching topologies to guarantee sub-200ms cold responses.',
      'Event-Driven Asynchronous Decoupling: Use Cloudflare Queues and durable message brokers for all non-blocking operations.',
      'Zero-Orphan Code Static Validator: Run knip in architectural gates to eliminate unused exports, dead types, and zombie packages.',
      'Schema Migration Reversibility Specification: Require an automated, tested down-migration for every database schema change.',
      'Distributed Tracing Propagation Contract: Standardize W3C Trace Context headers across all edge, API, and worker boundaries.',
      'Content Security Policy (CSP) & Trusted Types: Architect strict CSP header specifications forbidding unsafe-inline and unsafe-eval.',
      'Multi-Region Data Residency Model: Design storage topologies adhering to GDPR/CCPA data sovereignty requirements.',
      'Monorepo Package Workspace Isolation: Prevent leaky internal package boundaries using strict TypeScript project references.',
      'Semantic Versioning & Deprecation Schedule: Enforce formal semver deprecation cycles with automated runtime warning logs.',
      'Token Bucket Rate Limiting Architecture: Design tiered rate-limiting algorithms with burst capacity allowances per tier.',
      'Dead Code Elimination Scanner: Integrate automated dead code sweeps into weekly architectural hygiene routines.',
      'Backward-Compatible Evolution Pattern: Require additive schema changes with graceful fallback defaults for older clients.',
      'Cross-Platform CLI Uniformity Spec: Ensure CLI tools operate identically across macOS, Linux (Gnome), and Windows.',
      'Edge Stale-While-Revalidate KV Caching: Architect multi-tiered caching strategies utilizing edge KV and browser cache headers.',
      'Webhook-as-Skill Pattern Standard: Implement incoming webhooks as self-contained executable skills with schema validation.',
      'Architectural Decision Record (ADR) Generator: Automatically record all non-trivial structural decisions in markdown ADRs.',
      'AST Architecture Regression Guard: Lint against forbidden import directions (e.g., UI directly importing DB models).',
      'State Machine Determinism with XState: Model complex business flows as formal state machines with exhaustiveness checks.',
      'Streaming SSR & Progressive Hydration Spec: Mandate HTML streaming and selective hydration to prevent main thread blocking.',
      'Distributed Cache Invalidation Protocols: Implement tag-based cache purging across globally distributed edge nodes.',
      'Zero-Trust Inter-Service Authorization: Validate mTLS or cryptographically signed service tokens between all microservices.',
      'Anti-Pattern Continuous Auditing: Scan commits automatically for god-objects, primitive obsession, and tight coupling.'
    ]
  },
  {
    name: 'product-manager',
    title: 'Mission Intent & Tactical Reconnaissance Officer',
    rank: 'Lt. Colonel (O-5)',
    callSign: 'RECON-01',
    sector: 'Mission Objectives, PRD Specifications & Feature Scope Integrity',
    recommendations: [
      'Binary Acceptance Criteria Engine: Write testable given-when-then criteria with zero ambiguous descriptive language.',
      'PRD-as-Code Versioning: Maintain product requirement documents as markdown files committed directly in the repository.',
      'Acyclic Feature Dependency Graphs: Order user stories strictly by dependency topology to enable unblocked parallel agent buildout.',
      'Competitive Feature Vector Scanner: Conduct automated structured web intelligence on competitor feature sets and pricing models.',
      'Mathematical RICE / WSJF Prioritization: Score feature backlogs mathematically using Reach, Impact, Confidence, and Effort.',
      '3-Second Comprehension Heuristic Check: Audit UI mockups and user flows to ensure value proposition is understood in <3 seconds.',
      'Combinatorial Edge-Case Matrix: Systematically generate permutations of user inputs and error states for engineering review.',
      'Automated Release Changelog Synthesizer: Transform conventional git commits into user-facing release notes automatically.',
      'Feature Flag Lifecycle Governance: Track feature flag creation, rollout percentages, and trigger automated deletion tickets post-100%.',
      'Onboarding Funnel Friction Minimizer: Audit customer journeys to reduce onboarding steps to the theoretical minimum.',
      'Conversion Rate Optimization (CRO) Modeler: Formulate hypothesis-driven A/B test specifications with statistical power targets.',
      'Accessibility Acceptance Gate: Mandate WCAG 2.2 AA compliance as an explicit acceptance criteria on every frontend user story.',
      'Cross-Functional Dependency Displayer: Visualize blocking dependencies between frontend, backend, and third-party APIs.',
      'Semantic User Feedback Clustering: Group raw customer support tickets and user reviews into prioritized problem clusters.',
      'Retention Curve Decay Analyzer: Monitor user cohort retention metrics to identify churn precipices in user lifecycles.',
      'Churn Risk Early Warning Indicators: Define telemetry triggers that identify accounts displaying disengagement patterns.',
      'Pricing Tier Feature Entitlement Mapping: Maintain a strict matrix mapping feature flags to billing tiers and quotas.',
      'Localization Requirement Matrix: Specify string externalization and date/currency formatting for international markets.',
      'Non-Functional Requirement (NFR) SLA Contract: Define explicit p95 latency, availability, and throughput requirements per feature.',
      'User Story Estimation Scoring: Calibrate complexity scoring against historical token and time consumption across agent squads.',
      'Release Milestone Scope Freezing: Enforce strict scope discipline during active execution cycles to prevent creep.',
      'Customer Support Ticket Pattern Extraction: Feed recurring customer bug themes directly into sprint planning backlogs.',
      'Product Telemetry Dashboard Specification: Define required PostHog/Mixpanel event tracking schemas before feature release.',
      'Dark Pattern Elimination Audit: Inspect UI flows to ensure zero coercive or deceptive patterns exist in user interactions.',
      'Feature Deprecation Communication Playbook: Create structured sunset roadmaps and migration guides for retiring features.',
      'Voice-of-Customer Weekly Digest: Compile automated executive summaries of customer sentiment and feature requests.',
      'Post-Launch Adoption Velocity Tracker: Measure real usage of shipped features at 7, 30, and 90 days against adoption targets.',
      'User Persona Friction Simulation: Test feature specs against explicit user personas to identify mental model mismatches.',
      'Self-Service Workflow Maximizer: Eliminate human-dependent operational touchpoints in user onboarding and configuration.',
      'Continuous Problem-Solution Fit Validator: Verify that implemented software directly addresses original user problem statements.'
    ]
  },
  {
    name: 'fullstack-engineer',
    title: 'Forward Combat Engineer (Amphibious Assault)',
    rank: 'Captain (O-3)',
    callSign: 'COMBAT-01',
    sector: 'End-to-End Feature Delivery, Vertical Slice Construction & Reactive State',
    recommendations: [
      '16-State Component Design Matrix: Implement default, hover, focus, active, disabled, loading, empty, error, and 8 more states.',
      'Strict TypeScript Zero-Any Mandate: Use native TypeScript strip-types with strict null checks and zero any or as any.',
      'Zod Input/Output Boundary Parsing: Validate all API responses and form inputs with Zod schemas at runtime boundaries.',
      'Optimistic UI Updates with Auto-Rollback: Render state changes immediately while queuing mutations, reverting smoothly on error.',
      'Server-Side Streaming with React Suspense: Stream HTML chunks from the edge to achieve sub-second perceived load times.',
      'Zero-Orphan Tailwind Styling: Enforce utility-first styling with design system tokens and zero unconstrained inline styles.',
      'Accessible Keyboard Focus Management: Ensure focus rings, trap focus in modals, and restore focus seamlessly upon dismissal.',
      'Automated Playwright E2E Component Tests: Write deterministic end-to-end component interaction tests in headless CI.',
      'Micro-Interactions with <333ms Easing: Polish UI feedback with spring physics and cubic-bezier transitions under 333ms.',
      'Mobile-First Responsive Breakpoints: Develop interfaces responsive across 320px, 640px, 768px, 1024px, 1280px, and 1536px.',
      'Offline-First IndexedDB Caching: Persist working user state locally to prevent data loss during network interruptions.',
      'Actionable Error Boundaries: Wrap component trees in error boundaries that display clear recovery buttons, not white screens.',
      'Cumulative Layout Shift (CLS) Zero Guarantee: Reserve layout dimensions for all dynamic images, embeds, and skeleton states.',
      'Critical Asset Preloading & Subsetting: Preload primary webfonts and hero assets to eliminate layout flashes (FOIT/FOUT).',
      'Dynamic Route & Component Code-Splitting: Lazy load heavy interactive widgets and routes using dynamic imports.',
      'Dark/Light Theme Switching with CSS Variables: Implement flicker-free theme switching synchronized with user system preferences.',
      'Debounced Search with AbortController: Prevent race conditions and network waste by aborting in-flight stale fetch requests.',
      'Secure Cookie & Session Handling: Read and transmit authentication credentials strictly via HttpOnly, SameSite cookies.',
      'SSE & WebSocket Real-Time Synchronization: Subscribe to real-time events with auto-reconnection and exponential backoff.',
      'Semantic HTML5 Tag Discipline: Use main, nav, section, article, header, and footer strictly according to semantic standards.',
      'Unified Toast & Notification System: Provide non-blocking, accessible feedback for background asynchronous operations.',
      'Copy-to-Clipboard with Micro-Feedback: Implement reliable clipboard copy with clear animated visual confirmation.',
      'Multi-Step Form State Machine: Manage complex multi-page wizards with persistent state validation between steps.',
      'SVG Icon Tree-Shaking: Import SVG icons individually as inline symbols to avoid bloated icon bundle overhead.',
      'Visual Snapshot Regression Testing: Capture pixel-level component snapshots to detect unintended styling regressions.',
      'Prop Drilling Elimination via Signals/Context: Decouple deeply nested state using scoped stores or React context.',
      'Localized Number & Date Formatting: Render numbers, currencies, and dates using standard Intl browser formatters.',
      'Lint & Format Zero-Tolerance Gate: Pass Biome/Prettier and ESLint without warnings before completing any task.',
      'Breadcrumb Navigation & Dynamic Page Titles: Update document titles and accessible breadcrumbs dynamically on route changes.',
      'Form Auto-Save with Local Drafts: Automatically persist draft inputs to prevent data loss on accidental page navigation.'
    ]
  },
  {
    name: 'backend-engineer',
    title: 'Core Systems & Artillery Officer',
    rank: 'Major (O-4)',
    callSign: 'ARTILLERY-01',
    sector: 'Distributed Services, Microservices, API Engines & Background Workers',
    recommendations: [
      'Hono Edge-Native Microservices: Build lightweight, ultra-fast HTTP services optimized for Cloudflare Workers and Node.',
      'Zod Middleware Validation: Validate request params, query strings, and request bodies with strict Zod schemas on every route.',
      'Stateless JWT & OAuth2 Verification: Verify authentication tokens cryptographically with sub-millisecond edge execution.',
      'Distributed Idempotency Layer: Enforce idempotency using Redis or Cloudflare KV for all mutating transactional operations.',
      'Exponential Backoff with Jitter: Implement resilient outbound HTTP retry policies with randomized jitter to prevent thundering herds.',
      'Connection Pool Leak Prevention: Manage database connections with strict timeouts and automatic leak detection.',
      'Asynchronous Message Queue Processing: Offload background tasks to Cloudflare Queues or BullMQ with dead-letter queue routing.',
      'Structured JSON Logging with Trace IDs: Emit structured JSON logs containing correlation IDs for end-to-end request tracing.',
      'OpenTelemetry Span Propagation: Instrument service boundaries with OpenTelemetry distributed tracing spans.',
      'Sliding Window Rate Limiting: Implement distributed rate limiters using Redis sliding window logs to prevent API abuse.',
      'Graceful Process Shutdown: Catch SIGINT and SIGTERM signals, closing open connections and completing in-flight requests.',
      'HMAC-SHA256 Webhook Verification: Validate incoming webhook signatures using timing-safe comparisons to prevent spoofing.',
      'High-Performance Protobuf Serialization: Use Protobuf or binary serialization for internal high-throughput inter-service links.',
      'Circuit Breakers for Third-Party APIs: Wrap downstream dependencies in circuit breakers that fail fast during outages.',
      'Cursor-Based Pagination Standard: Replace slow SQL offset pagination with performant cursor-based keyset pagination.',
      'Chunked Streaming HTTP Responses: Stream large data payloads and LLM responses using chunked transfer encoding.',
      'Cache-Aside Pattern with TTL Jitter: Cache expensive queries with randomized expiration to avoid cache expiration stampedes.',
      'Serializable Transaction Isolation: Isolate critical financial and balance operations using strict serializable transactions.',
      'Dead-Letter Queue (DLQ) Alerting: Monitor DLQs continuously and trigger automated alerts on failed message processing.',
      'Batch Database Operations: Aggregate single-row inserts and updates into bulk batch transactions to minimize I/O overhead.',
      'Secret Redaction in Log Streams: Automatically filter and redact API keys, tokens, and PII from all console outputs.',
      'Micro-Benchmark Performance Profiling: Run automated micro-benchmarks on critical algorithmic paths to detect regressions.',
      'Separate Liveness & Readiness Probes: Provide distinct health check endpoints for Kubernetes and Cloudflare load balancers.',
      'Automated Load Testing with k6: Execute scripted stress tests against API endpoints to verify throughput under load.',
      'Strict CORS Policy Hardening: Restrict Allowed Origins, Headers, and Methods to explicit production domains.',
      'Request Payload Size Guard: Reject oversized HTTP request payloads before consuming memory using early boundary checks.',
      'Heap Dump & Memory Leak Diagnostics: Integrate diagnostic heap profiling hooks to troubleshoot memory growth.',
      'Zero-Downtime Rolling Deployment Compatibility: Ensure backward-compatible API contracts during concurrent version rollouts.',
      'Dynamic Compression Middleware: Compress outbound payloads using Brotli and Gzip based on client Accept-Encoding.',
      'Anti-SQL-Injection Parameterization: Guarantee 100% parameterized queries with zero dynamic string SQL concatenation.'
    ]
  },
  {
    name: 'database-engineer',
    title: 'Storage Integrity & Ordnance Custodian',
    rank: 'Major (O-4)',
    callSign: 'ORDNANCE-01',
    sector: 'Database Schemas, Migrations, Query Optimization & Transaction Locks',
    recommendations: [
      'Zero-Downtime Expand/Contract Migrations: Execute database schema migrations across multiple backward-compatible phases.',
      'Drizzle ORM Type-Safe Schemas: Define single-source-of-truth database schemas using Drizzle ORM TypeScript definitions.',
      'Covering & Partial Index Optimization: Create targeted composite and partial indexes to optimize specific high-frequency queries.',
      'Query Execution Plan Analysis (EXPLAIN ANALYZE): Inspect query plans to eliminate sequential scans on large tables.',
      'Hyper-Scale Connection Pooling: Configure PgBouncer and Supabase connection poolers to prevent connection exhaustion.',
      'Foreign Key Cascade Constraints: Define explicit referential integrity rules and cascade behaviors on all relations.',
      'Point-in-Time Recovery (PITR) Drills: Test automated backup restoration protocols regularly to guarantee RPO < 5 minutes.',
      'Time-Series Table Partitioning: Partition large event and audit tables by date to optimize query pruning and archiving.',
      'Read-Replica Lag Monitoring: Alert when read-replica replication lag exceeds 100ms, routing critical reads to primary.',
      'Deterministic Staging Data Anonymization: Mask production PII and sensitive data before copying snapshots to development environments.',
      'Deadlock Detection & Query Timeouts: Set aggressive statement timeouts (e.g. 5s) to kill runaway queries and prevent locks.',
      'Optimistic Concurrency Control: Implement version counters on mutable records to prevent concurrent update overwrites.',
      'Scheduled Auto-Vacuum & Auto-Analyze: Tune PostgreSQL autovacuum settings to prevent table bloat and stale statistics.',
      'JSONB Schema Check Constraints: Validate structured JSON columns using PostgreSQL check constraints and Zod definitions.',
      'Automated Migration Rollback Scripts: Generate and verify reversible down-migrations for every committed migration step.',
      'Schema Drift Continuous Detection: Run automated CI checks comparing git schema definitions against live database state.',
      'Materialized View Refresh Automation: Schedule asynchronous materialized view updates using concurrent refresh commands.',
      'Slow Query Alert Thresholds: Log and alert on all queries exceeding 250ms execution time in production.',
      'Transparent Data Encryption: Enforce AES-256 encryption at rest and TLS 1.3 encryption for all database connections.',
      'Multi-Tenant Row-Level Security (RLS): Enforce strict tenant isolation directly at the database engine level via RLS policies.',
      'Automated Data Retention & Pruning: Archive and purge expired records automatically using scheduled cron jobs.',
      'Immutable Audit Logging Triggers: Record all record mutations in dedicated audit log tables via database triggers.',
      'UUIDv7 Primary Key Adoption: Use time-ordered UUIDv7 identifiers to prevent B-tree index fragmentation.',
      'Foreign Key Indexing Audit: Scan database schemas to ensure all foreign key columns have corresponding indexes.',
      'Query Memory (work_mem) Tuning: Allocate optimal memory for in-memory sorting and hashing without exhausting RAM.',
      'Automatic Failover Testing: Conduct automated failover drills to secondary replicas to verify zero data loss.',
      'Connection Leak Sentinel: Monitor open idle connections and terminate abandoned client sessions automatically.',
      'Database Migration Dry-Run in CI: Run migrations against isolated ephemeral database instances before PR merges.',
      'D1 Edge SQLite Replication Tuning: Optimize Cloudflare D1 distributed database reads across edge locations.',
      'Database Capacity & Storage Forecasting: Extrapolate database disk space growth and alert 30 days before capacity thresholds.'
    ]
  },
  {
    name: 'qa-verification',
    title: 'Inspector General & Proof of Life Arbiter',
    rank: 'Colonel (O-6)',
    callSign: 'INSPECTOR-01',
    sector: 'Quality Gates, Deterministic Test Suites, E2E Verification & Chaos Injection',
    recommendations: [
      'Playwright E2E Regression Matrix: Maintain deterministic end-to-end test suites executing across all critical user journeys.',
      'Pact / Prism Contract Testing: Verify API contract adherence between client and backend before deployment.',
      'Equivalence Partitioning Test Generator: Construct automated test fixtures covering edge boundaries and input permutations.',
      'Visual Regression Pixel-Diffing: Catch UI styling regressions automatically using pixel-level perceptual diff thresholds.',
      'Headless CI Parallel Sharding: Run automated test suites in parallel shards to keep total test execution under 3 minutes.',
      'Mutation Testing with Stryker: Mutate code logic automatically to evaluate and strengthen test suite assertion quality.',
      'Chaos Engineering Fault Injection: Inject network latency, dropped packets, and 500 errors to verify graceful UI degradation.',
      'Mock Service Worker (MSW) Fixtures: Intercept network requests at the service worker layer for deterministic mock testing.',
      'Automated API Stress Testing: Script k6 test scenarios validating response times and error rates under concurrent load.',
      'Flaky Test Auto-Quarantine: Automatically isolate flaky tests from blocking CI while filing immediate remediation tickets.',
      'Branch & Statement Coverage Enforcement: Mandate 100% coverage on critical business logic and security-sensitive paths.',
      'Synthetic User Journey Simulation: Run headless browser agents continuously executing realistic multi-step user tasks.',
      'Lighthouse CI Performance Budgeting: Fail builds automatically when performance, accessibility, or best practices scores drop.',
      'Security Input Fuzzing: Fuzz form inputs and API endpoints with automated SQLi, XSS, and boundary payloads.',
      'Cross-Browser CI Matrix: Validate rendering and execution across Chromium, Firefox, and WebKit on every release.',
      'Mobile Viewport Device Emulation: Test layouts across iPhone, iPad, Android, and desktop viewports in CI.',
      'Automated axe-core Accessibility Scans: Run axe accessibility checks on all rendered pages, failing on zero WCAG violations.',
      'Deterministic Database Seed Fixtures: Seed clean, isolated test data for every test run to guarantee repeatable results.',
      'Automated Bug Ticket Generation: Capture failure logs, DOM snapshots, and video replays in automatically filed tickets.',
      'Negative & Abuse Case Verification: Explicitly test malformed payloads, expired tokens, and unauthorized access attempts.',
      'Memory Leak Detection in Long-Running Tests: Monitor heap size during end-to-end tests to catch client-side memory growth.',
      'Network Throttling Simulation: Test application responsiveness under 3G, 4G, and offline network conditions.',
      'Offline Service Worker Verification: Verify that cached assets and offline fallback screens function without connectivity.',
      'Cross-Site Scripting (XSS) Vector Suite: Inject aggressive polyglot XSS vectors to ensure 100% sanitization.',
      'Session Expiration & Re-Auth Testing: Verify that expired authentication triggers refresh flows without data loss.',
      'Multi-Tab Concurrency Verification: Test real-time synchronization and state conflict resolution across multiple tabs.',
      'Localization Pseudo-Translation Testing: Test UI layouts against lengthened pseudo-translated strings to catch text truncation.',
      'Post-Deployment Smoke Verification: Run automated healthcheck smoke tests against staging and production immediately post-deploy.',
      'Test Suite Runtime Minimization: Profile slow tests and parallelize database fixtures to keep developer feedback instantaneous.',
      'Regression Test Suite Pruning: Periodically analyze test utility, removing redundant tests that duplicate coverage.'
    ]
  },
  {
    name: 'devsecops',
    title: 'Chief Logistics & Armor Officer',
    rank: 'Lt. Colonel (O-5)',
    callSign: 'LOGISTICS-01',
    sector: 'CI/CD Pipelines, Infrastructure as Code, Container Security & Secret Vaults',
    recommendations: [
      'OpenTofu Infrastructure as Code: Declare all cloud resources, networks, and DNS records in version-controlled OpenTofu code.',
      'GitHub Actions Cache Optimization: Accelerate CI pipelines using aggressive dependency and build artifact caching.',
      'Distroless Multi-Stage Docker Builds: Package applications into minimal distroless containers under 50MB in size.',
      'Trivy & Grype Vulnerability Scanning: Scan container images and dependencies in CI, blocking builds on high/critical CVEs.',
      'Gitleaks & TruffleHog Secret Detection: Run pre-commit and CI secret scanners to prevent API keys from entering git history.',
      'Automated Dependency Updates (Renovate): Configure Renovate to automate patch and minor dependency pull requests.',
      'SBOM Generation (CycloneDX/SPDX): Generate Software Bill of Materials on every build for complete supply chain transparency.',
      'Cloud Resource Tagging Enforcer: Automatically enforce environment, owner, and cost-center tags on all infrastructure.',
      'Least-Privilege IAM Policy Generation: Author scoped IAM roles granting only strictly required permissions to workloads.',
      'Automated Let\'s Encrypt TLS Renewal: Automate wildcard TLS certificate issuance and renewal via Cloudflare DNS-01 challenges.',
      'Cloudflare Zero-Trust Network Access: Guard internal staging environments and admin panels behind Cloudflare Access SSO.',
      'Ephemeral Preview Environments: Provision isolated preview environments for every pull request, tearing down on merge.',
      'Cosign / Sigstore Artifact Signing: Cryptographically sign container images and build artifacts with verifiable provenance.',
      'Turborepo Remote Caching: Share build artifacts across CI runners and developer machines to avoid duplicate compilations.',
      'Strict Branch Protection Rules: Require passing tests, code review approvals, and signed commits on master branches.',
      'Container Registry Security Scanning: Enable continuous vulnerability scanning in Amazon ECR or GitHub Container Registry.',
      'Hardened Ephemeral CI Runners: Execute CI jobs on isolated, disposable runners with restricted network permissions.',
      'Canary Deployment Automated Rollbacks: Roll back releases automatically if error rates or latencies spike on canary pods.',
      'Drift Detection for Cloud Infrastructure: Run scheduled OpenTofu plans to alert on out-of-band cloud infrastructure changes.',
      'CIS Benchmark Hardening: Apply Center for Internet Security hardening benchmarks to all container and server images.',
      'Container Resource Limits & Requests: Define explicit CPU and memory requests and limits on all container specifications.',
      'Slack/Discord Deployment Notifications: Broadcast build status, deployment completions, and rollbacks to engineering channels.',
      'SLSA Level 3 Provenance Attestation: Generate tamper-proof build provenance attestations for all production release artifacts.',
      'Disaster Recovery Automation Runbooks: Maintain scripted runbooks to reconstruct entire cloud environments from scratch.',
      'Semgrep Static Analysis Gating: Run custom Semgrep security and quality rules on every pull request.',
      'Infisical / Vault Secret Provisioning: Inject secrets into runtime containers dynamically without writing to disk or env files.',
      'Git Commit Provenance Verification: Verify GPG or SSH commit signatures to guarantee developer identity on all branches.',
      'Dynamic Environment Teardown: Schedule automatic termination of idle preview environments to eliminate compute waste.',
      'Continuous Cloud Compliance Auditing: Validate SOC2 and ISO27001 control compliance through automated pipeline evidence.',
      'Zero-Trust Pipeline Network Egress: Restrict CI runner outbound internet access to whitelisted package registries and APIs.'
    ]
  },
  {
    name: 'sre',
    title: 'Rapid Reaction Force Commander',
    rank: 'Major (O-4)',
    callSign: 'REACTION-01',
    sector: 'System Reliability, SLO/SLA Governance, Incident Command & Self-Healing',
    recommendations: [
      'SLI/SLO Error Budget Calculation: Define service level indicators and mathematically track error budget burn rates in real-time.',
      'Grafana & Prometheus Observability: Build unified dashboards visualizing request rates, error percentages, and latency histograms.',
      'PagerDuty Escalation Orchestration: Route high-urgency production incidents to on-call engineers with automatic fallback policies.',
      'Zero-False-Positive Healthchecks: Design multi-step semantic healthchecks that test actual database and cache read/write capability.',
      'Global Edge Synthetic Monitoring: Ping production endpoints every 60 seconds from 15 global locations to monitor availability.',
      'Adaptive Distributed Tracing: Sample traces dynamically (100% of errors, 1% of successes) to balance visibility against cost.',
      'Log Lifecycle & Index Tiering: Tier log retention from hot OpenSearch storage to cold Cloudflare R2 object storage.',
      'Automated Circuit Breaking: Trip circuit breakers to degrade non-essential features gracefully when upstream dependencies fail.',
      'Cloudflare Health-Check DNS Failover: Automatically reroute traffic to backup origins when primary edge servers become unhealthy.',
      'Predictive Auto-Scaling Rules: Scale container fleets proactively based on incoming request rates rather than lagging CPU metrics.',
      'Blameless Post-Mortem Generator: Automatically compile incident timelines, metrics, and logs into structured post-mortem drafts.',
      'MTTR Reduction Playbooks: Document exact step-by-step diagnostic commands for the top 10 most common production alerts.',
      'Scheduled Chaos Game Days: Periodically simulate AZ outages, packet loss, and Redis crashes to validate system resilience.',
      'Automated Remediation Runbooks: Trigger automated pod restarts and cache flushes when known transient failure conditions occur.',
      'Database Connection Pool Sentry: Alert when database pool utilization exceeds 80%, terminating zombie sessions automatically.',
      'Memory Leak Early Warning: Detect gradual heap growth over 24-hour periods before out-of-memory crashes occur.',
      'Load Shedding & Graceful Degradation: Reject low-priority traffic during extreme spikes while preserving checkout and core flows.',
      'Latency Outlier Detection: Identify p99.9 latency spikes and correlate them with specific database queries or API payloads.',
      'Third-Party Outage Detection: Correlate external API errors to identify vendor outages before internal teams waste triage time.',
      'Incident Commander Checklist Automation: Provide on-call engineers with an interactive CLI checklist during active Sev-1 outages.',
      'Automated On-Call Handover Digests: Generate summaries of alerts, changes, and ongoing issues for the incoming on-call rotation.',
      'Service Dependency Map Visualizer: Render real-time topology graphs showing inter-service traffic and error propagation.',
      'Canary Traffic Progression Controller: Dial canary traffic gradually from 5% to 25% to 100% while observing error rate thresholds.',
      'Saturation Metric Alarms: Monitor file descriptors, socket allocations, and thread pools to prevent silent saturation crashes.',
      'Automated Backup Restoration Testing: Restore database backups into temporary environments weekly to prove backup viability.',
      'SLA Breach Warning Triggers: Alert leadership when error budget consumption projects an SLA breach within 48 hours.',
      'Alert Noise De-Duplication: Group related cascading alerts into a single root-cause notification to prevent alert fatigue.',
      'Blackbox vs Whitebox Metric Pairing: Cross-reference external synthetic pings with internal application metrics for complete truth.',
      'Cloudflare Cache Hit Ratio Monitoring: Alert when edge cache hit rates fall below 85%, preventing origin server overload.',
      'Runbook Documentation Freshness Audit: Verify that operational runbooks are updated and tested whenever architecture evolves.'
    ]
  },
  {
    name: 'appsec',
    title: 'Perimeter Defense & Counter-Exploitation Commander',
    rank: 'Major (O-4)',
    callSign: 'SENTRY-01',
    sector: 'Application Security, Threat Modeling, Vulnerability Remediation & Cryptography',
    recommendations: [
      'OWASP Top 10 Automated Defense: Implement automated security checks specifically testing against the OWASP Top 10 categories.',
      'Strict Content Security Policy (CSP): Enforce nonce-based CSP headers disallowing unsafe-inline scripts and objects.',
      'CORS Origin Hardening: Enforce explicit allowed-origin lists with credentials verification, disallowing wildcard origins.',
      'DOMPurify Client Sanitization: Sanitize all user-generated HTML content before rendering to eliminate Cross-Site Scripting (XSS).',
      'Anti-CSRF Token Enforcement: Protect state-mutating endpoints with cryptographic double-submit cookies or SameSite=Strict.',
      'Parameterized Database Queries: Audit all database interaction layers to ensure zero dynamic SQL string interpolation.',
      'Dependency Supply Chain Audits: Run pnpm audit and Dependabot to block vulnerabilities in open-source dependencies.',
      'Brute-Force & Rate-Limiting Defense: Implement progressive exponential delays on repeated failed login and auth attempts.',
      'PII & Token Masking in Logs: Redact passwords, credit cards, SSNs, and JWT tokens from all logging and observability pipelines.',
      'Broken Object Level Auth (BOLA) Testing: Verify that API endpoints rigorously validate tenant ownership on every resource ID.',
      'Cryptographic Key Rotation Automation: Rotate API signing keys and database encryption keys on a scheduled 90-day cycle.',
      'HTTP Security Header Hardening: Mandate HSTS (max-age 31536000), X-Content-Type-Options, and X-Frame-Options on all routes.',
      'Secret Scanning in Pull Requests: Block PRs containing hardcoded secrets, private keys, or credentials before merging.',
      'Zero-Trust Internal Network Policies: Require cryptographically signed service-to-service tokens for all internal API calls.',
      'Session Fixation Protection: Invalidate old session identifiers and issue fresh tokens immediately upon user authentication.',
      'Argon2id Password Hashing: Hash stored passwords using Argon2id with memory-hard parameters and per-user cryptographic salts.',
      'Strict Input Whitelist Validation: Validate all incoming payloads against explicit Zod schemas, stripping unrecognized fields.',
      'File Upload Malware & MIME Scanning: Verify magic bytes of uploaded files and scan for malicious payloads before storage.',
      'CVSS v3.1 Vulnerability Scoring: Assign standardized CVSS scores to identified vulnerabilities to prioritize remediation.',
      'Subresource Integrity (SRI) Hashes: Enforce cryptographic SRI hash checks on all third-party scripts and CDN stylesheets.',
      'Automated Penetration Testing Suites: Run automated DAST security scans (ZAP/Nuclei) against staging environments in CI.',
      'Security Exception Governance: Track approved temporary security exceptions with mandatory expiration dates and owners.',
      'Secure Cookie Discipline: Set Secure, HttpOnly, and SameSite=Strict attributes on all authentication and session cookies.',
      'STRIDE Threat Modeling Diagrams: Maintain threat models identifying spoofing, tampering, and information disclosure risks.',
      'Immutable Audit Logging: Stream security events and admin actions to write-once, tamper-evident audit log storage.',
      'JWT Expiration & Revocation Lists: Use short-lived access tokens (15m) paired with revocable refresh token tracking.',
      'Webhook HMAC-SHA256 Verification: Verify inbound webhooks using cryptographic signature comparison with timing-attack defense.',
      'API Endpoint Authorization Matrix: Audit role-based access control (RBAC) permissions across every registered API endpoint.',
      'Server-Side Request Forgery (SSRF) Defense: Filter and block internal IP addresses (127.0.0.1, 169.254.169.254) on outbound requests.',
      'Bug Bounty & Disclosure Triage: Triage external security vulnerability reports and verify remediation within 24 hours.'
    ]
  },
  {
    name: 'finops',
    title: 'Quartermaster & Resource Allocation Commander',
    rank: 'Major (O-4)',
    callSign: 'QUARTERMASTER-01',
    sector: 'Cost Optimization, Cloud Spend Tracking, Token Economics & Billing Controls',
    recommendations: [
      'Real-Time Multi-Cloud Spend Tracking: Consolidate billing metrics across AWS, Cloudflare, OpenAI, and Anthropic into one view.',
      'Token Cost-per-Request Telemetry: Instrument every LLM invocation to log exact prompt tokens, completion tokens, and dollar cost.',
      'Automated Spend Alerts & Hard Caps: Trigger Slack alerts at 80% monthly budget and freeze non-critical workers at 100%.',
      'Zombie Resource Hunting & Termination: Identify and terminate unattached EBS volumes, idle load balancers, and unused IP addresses.',
      'Compute & Database Right-Sizing: Recommend container CPU/memory downsizing based on 30-day p95 utilization metrics.',
      'Cloudflare CDN Bandwidth Optimization: Maximize edge cache hit rates to eliminate expensive cloud egress bandwidth fees.',
      'Reserved Instance & Savings Plans: Analyze 12-month baseline workloads and purchase commitment plans to save up to 40%.',
      'Multi-Tenant Cost Allocation & Showback: Attribute cloud infrastructure and LLM spend accurately to specific customer accounts.',
      'Cost Anomaly Detection Algorithms: Alert immediately when daily cloud spend spikes more than 25% above 7-day moving averages.',
      'Serverless Cold-Start vs Memory Tuning: Tune AWS Lambda / Cloudflare Worker memory allocations to optimize speed and cost.',
      'Database Storage Pruning & Archiving: Archive historical database tables older than 1 year to low-cost Cloudflare R2 storage.',
      'LLM Model Routing Cost Optimization: Route routine coding tasks to cheap DeepSeek/Claude-Haiku models, saving frontier tokens.',
      'Observability Ingestion Cost Controls: Filter high-volume debug logs and drop redundant metric series to reduce Datadog bills.',
      'Container Resource Request Tuning: Adjust Kubernetes resource requests to match actual usage, packing nodes efficiently.',
      'SaaS License Utilization Auditing: Audit GitHub, Figma, and Jira seats monthly, deprovisioning inactive user licenses.',
      'API Call Deduplication Layer: Cache identical third-party API queries locally to eliminate redundant per-call API charges.',
      'Storage Class Lifecycle Automation: Transition S3/R2 storage from standard to infrequent access and glacier tiers automatically.',
      'Cost-per-Active-User Unit Economics: Calculate and track cloud infrastructure cost per monthly active user over time.',
      'Monthly Cloud Spend Forecasting: Use linear regression and seasonality models to forecast end-of-month cloud expenditure.',
      'Automated PR Cost Impact Estimation: Comment on Terraform/OpenTofu PRs with projected monthly cost increases (Infracost).',
      'Spot Instance Utilization for CI/CD: Run batch integration tests and ephemeral preview environments on cheap spot instances.',
      'Data Egress Reduction Architecture: Keep data transfers within the same availability zone or edge network to eliminate transit fees.',
      'Cloudflare Worker Invocation Minimization: Bundle related edge operations to minimize total worker invocation request counts.',
      'Prompt Caching Token Savings: Leverage Anthropic prompt caching on static system prompts to reduce input token costs by 90%.',
      'Redundant Infrastructure Cleanup: Scan staging environments weekly to terminate abandoned test databases and stale clusters.',
      'Grafana Cloud Cost Dashboards: Maintain real-time dashboards displaying spend velocity, budget burn, and savings opportunities.',
      'Invoice Reconciliation Automation: Automatically cross-reference vendor invoices against internal telemetry records.',
      'Infrastructure Budget Approval Workflows: Require formal manager approval before provisioning resources exceeding $100/mo.',
      'Green Computing Energy & Carbon Efficiency: Optimize compute scheduling to run heavy batch jobs during clean-energy grid windows.',
      'FinOps ROI Reporting to Executive Leadership: Deliver monthly reports showing total infrastructure savings achieved by squad.'
    ]
  },
  {
    name: 'release-manager',
    title: 'Air Boss & Launch Operations Commander',
    rank: 'Lt. Colonel (O-5)',
    callSign: 'AIRBOSS-01',
    sector: 'Release Engineering, Deployment Orchestration, Rollout Strategy & Airspace Control',
    recommendations: [
      'Semantic Release Automation: Automate version numbering and git tagging based strictly on conventional commit messages.',
      'Automated Release Notes Generation: Compile user-facing changelogs categorized by features, fixes, and breaking changes.',
      'Canary Deployment Traffic Progression: Route production traffic progressively (5% -> 25% -> 100%) while observing error rates.',
      'Feature Flag Percentage Dialing: Roll out new capabilities gradually using LaunchDarkly or Unleash feature flag percentages.',
      'Blue/Green Zero-Downtime Deployment: Switch traffic atomically between parallel blue and green environments without dropped packets.',
      'Pre-Flight Release Checklist Automation: Verify passing tests, security scans, and database migrations before clearing deployment.',
      'Automated Metric-Driven Rollbacks: Trigger instant automated rollback if 5xx errors increase by more than 0.1% during release.',
      'Production Release Notes Publication: Publish release announcements to GitHub Releases, documentation sites, and changelogs.',
      'Deployment Window & Blackout Scheduling: Enforce deployment freeze periods during high-traffic promotional events and holidays.',
      'Multi-Service Coordinated Release Graphs: Sequence releases across interdependent microservices in exact dependency order.',
      'Database Migration Pre-Release Synchronization: Execute backward-compatible database migrations before releasing new application code.',
      'Automated Post-Deploy Smoke Testing: Run automated smoke tests against live production routes immediately following deployment.',
      'Cryptographic Git Tag Signing: Sign all release git tags using GPG or SSH keys with verifiable organizational provenance.',
      'Stakeholder Release Broadcasts: Send automated notifications to support, sales, and product teams when releases go live.',
      'Mobile App Store Submission Automation: Automate iOS Fastlane and Android Gradle release bundle submissions to app stores.',
      'Hotfix Backporting to Release Branches: Automatically backport emergency hotfixes to active LTS maintenance release branches.',
      'Post-Release Monitoring Soak Window: Enforce a mandatory 30-minute soak period post-deployment before declaring success.',
      'Compliance Deployment Audit Logging: Record deployment timestamps, commit SHAs, and authorizing personnel for SOC2 audits.',
      'Binary Artifact Distribution & Checksums: Generate and publish SHA-256 checksums alongside compiled binary release assets.',
      'Feature Flag Retirement Reminders: File automated cleanup tasks 14 days after a feature flag reaches 100% rollout.',
      'Multi-Region Rolling Deployment Coordination: Roll out software region-by-region across US, EU, and APAC edge locations.',
      'Staging vs Production Parity Verification: Compare environment configurations and schema versions to prevent release surprises.',
      'Support Team Deployment Sync: Notify support dispatchers of active deployments so customer bug reports can be triaged rapidly.',
      'Release Risk Scoring Engine: Calculate release risk scores based on lines changed, files modified, and historical failure rates.',
      'Backward Compatibility Guarantees: Verify that new releases continue to support API requests from clients on older versions.',
      'Emergency Hotfix Fast-Track Pipeline: Maintain an expedited 5-minute CI/CD pipeline for critical zero-day security patches.',
      'Dependency Lockfile Immutability: Enforce strict lockfile verification in release builds to prevent unvetted dependency updates.',
      'Deprecation Notice Lifecycle Scheduling: Announce upcoming API deprecations two releases in advance of breaking removals.',
      'Release Rollback Dry-Run Drills: Periodically practice rolling back releases in staging to verify that rollback procedures work.',
      'Post-Release Health Report Synthesis: Generate an automated debrief report summarizing deployment duration, metrics, and errors.'
    ]
  },
  {
    name: 'ui-designer',
    title: 'Visual Superiority & Human Interface Commander',
    rank: 'Captain (O-3)',
    callSign: 'VANGUARD-UI',
    sector: 'Visual Design Systems, Design Tokens, Micro-Interactions & Brand Aesthetics',
    recommendations: [
      'Tailwind Design Token System: Define single-source-of-truth typography, spacing, and color tokens using CSS variables.',
      '16-State Component Design Matrix: Design default, hover, focus, active, selected, disabled, loading, and error states for all UI elements.',
      'Cinematic Motion Choreography (<333ms): Create smooth cubic-bezier micro-interaction transitions under 333ms in duration.',
      'Dark & Light Mode Contrast Parity: Ensure all color combinations exceed WCAG AAA 7:1 contrast ratios in both light and dark modes.',
      'Modular Typography Scale & Rhythm: Enforce consistent typographic hierarchies and proportional line-height baselines.',
      'Haptic & Visual Feedback Design: Design subtle press states, scale transformations, and active highlights for interactive elements.',
      'Consistent Lucide Icon System: Maintain an icon catalog with uniform stroke widths, optical alignment, and bounding boxes.',
      'Responsive Grid Breakpoint Standards: Design layouts adapting fluidly across mobile (320px), tablet (768px), and desktop (1440px).',
      'Empty State & Skeleton Loaders: Design high-polish skeleton loaders that mimic exact content layout, preventing layout shift.',
      'Visual Hierarchy & Whitespace Discipline: Structure layouts with intentional whitespace to guide user attention to primary actions.',
      'Subtle Glassmorphism & Elevation: Layer UI cards using subtle border highlights, backdrop blurs, and multi-layered drop shadows.',
      'Accessible Color Palette Generation: Build color ramps with mathematically verified contrast steps across all theme variants.',
      'Modal & Drawer Entrance Physics: Choreograph smooth spring-physics slide and fade animations for overlays and dialogs.',
      'Data Visualization Chart Styling: Style interactive charts with readable legends, tooltips, and accessible colorblind-safe palettes.',
      'Button Visual Hierarchy Standard: Clearly distinguish primary actions, secondary options, ghost buttons, and destructive triggers.',
      'Form Control Inline Validation Design: Design non-intrusive inline validation errors with clear icons and actionable guidance.',
      'Breadcrumb & Navigation UX: Design intuitive navigation hierarchies allowing users to understand their current context instantly.',
      'Image Aspect Ratio Preservation: Maintain consistent aspect ratio containers to prevent cumulative layout shift while images load.',
      'Card & List Density Controls: Provide comfortable and compact density modes for data-heavy dashboard tables and cards.',
      'Mobile Bottom Sheet UX: Design swipeable bottom sheets for mobile devices to replace awkward mobile modal dialogs.',
      'Dynamic Tooltip & Popover Placement: Design smart tooltips that automatically flip and adjust position based on screen boundaries.',
      'High-Visibility Focus Ring Styling: Design prominent, aesthetic focus rings that guarantee keyboard accessibility compliance.',
      'Cross-Browser Custom Scrollbars: Style subtle, modern scrollbars matching the color theme across Chromium, Safari, and Firefox.',
      'Design System Documentation in Storybook: Maintain live component documentation displaying interactive variant props.',
      'Component Variant Composition: Build composable UI variants using class-variance-authority (CVA) for clean developer handoffs.',
      'Visual Polish & Kerning Audits: Inspect rendered interfaces to eliminate awkward line wraps, uncentered icons, and optical misalignments.',
      'Interactive Micro-Prototype Scaffolding: Create code-first interactive prototypes to test interaction physics before implementation.',
      'Brand Identity Asset Kits: Package vector SVGs, favicons, social cards, and logos in all required digital resolutions.',
      'Accessibility Focus Trap Indicators: Ensure modal dialogs and dropdown menus visually reflect trapped keyboard focus states.',
      'Responsive Table to Card Transformations: Design data tables that transform gracefully into stacked cards on mobile screens.'
    ]
  },
  {
    name: 'information-architect',
    title: 'Topographical Cartographer & Navigation Officer',
    rank: 'Captain (O-3)',
    callSign: 'CARTOGRAPHER-01',
    sector: 'Information Architecture, URL Ontologies, Navigation Graphs & Semantic Schemas',
    recommendations: [
      'Navigation Tree Hierarchy Architecture: Structure intuitive information hierarchies with a maximum depth of 3 clicks.',
      'Semantic URL Slug Ontologies: Design clean, descriptive, lowercase URL slugs reflecting exact resource hierarchy.',
      'Domain Taxonomy & Tag Governance: Define standardized tagging and category vocabularies to prevent duplicate classification.',
      'Search Indexing & Faceted Filtering: Architect structured facet filters allowing users to slice large catalogs effortlessly.',
      'Automated Sitemap XML Maintenance: Generate and submit dynamic sitemaps containing lastmod timestamps to search engines.',
      'Internal Linking Architecture: Build contextual internal links across related pages to boost discoverability and SEO authority.',
      'Breadcrumb Hierarchy Standard: Enforce consistent schema-backed breadcrumbs on all hierarchical content pages.',
      'Content Entity Relationship Modeling: Model data entities with explicit one-to-many and many-to-many relationship boundaries.',
      'Canonical URL Enforcement: Mandate canonical link tags on all pages to eliminate duplicate content penalties.',
      '301 vs 302 Redirect Mapping: Maintain an automated redirect table ensuring retired URLs forward permanently to new locations.',
      'Schema.org JSON-LD Structured Data: Embed rich JSON-LD markup (Article, Organization, Product, FAQ) on relevant pages.',
      'Category & Tag Hierarchy Auditing: Merge redundant tags and purge orphaned categories on a quarterly schedule.',
      'User Mental Model Research: Align navigation menu labels with real customer language rather than internal corporate jargon.',
      'Search Autocomplete Logic: Design fast, typo-tolerant search suggestions prioritizing high-intent user queries.',
      'Scalable Mega-Menu Navigation: Design multi-column mega-menus that organize large product catalogs without visual clutter.',
      'Content Chunking for LLM Retrieval: Structure documentation into discrete, semantic sections optimized for vector chunking.',
      'Knowledge Graph Ontology Modeling: Model concepts, tools, and entities as an interconnected graph for AI agent exploration.',
      'Cross-Site Navigation Consistency: Ensure unified header and footer navigation structures across all subdomains and microsites.',
      'Semantic URL Query Parameter Standards: Standardize query parameters (?page=1&sort=date&filter=active) across all API and web routes.',
      'Table of Contents Auto-Generation: Generate dynamic sticky tables of contents on long-form articles with scrollspy highlighting.',
      'Content Hierarchy Depth Auditing: Scan websites to identify and elevate deeply buried pages to improve user access.',
      'Faceted Search Attribute Schemas: Define strict typing for search filter attributes (ranges, booleans, multi-selects).',
      'Multi-Language URL Localization: Implement localized URL structures (/es/, /fr/, /de/) with correct hreflang annotations.',
      'Deep-Linking & Anchor Target Standards: Ensure all headings possess unique slug IDs allowing direct anchor linking.',
      '404 Error Page Recovery Pathways: Design helpful 404 pages featuring popular links, search bars, and recent pages.',
      'User Task Completion Flow Mapping: Map out step-by-step user journeys to identify and remove unnecessary navigation detours.',
      'Faceted Search Performance Optimization: Index filter attributes in database queries to keep search response times under 50ms.',
      'Content Lifecycle Metadata Tracking: Tag content with created, updated, reviewed, and expiration dates for freshness tracking.',
      'Sitemap Indexing Health Monitoring: Monitor Google Search Console indexing rates to identify crawling bottlenecks.',
      'Entity Resolution Across Catalogs: Reconcile duplicate product and concept records into singular canonical entities.'
    ]
  },
  {
    name: 'refactorer',
    title: 'Code Janitor & Structural Hygiene Commander',
    rank: 'Captain (O-3)',
    callSign: 'SWEEPER-01',
    sector: 'Technical Debt Elimination, Code Simplification, Deduplication & AST Refactoring',
    recommendations: [
      'Dead Code & Export Elimination (Knip): Run automated AST sweeps to detect and delete unused functions, variables, and exports.',
      'DRY Code Consolidation: Consolidate duplicated logic across multiple modules into unified, well-tested shared utilities.',
      'Function Decomposition (<30 Lines): Break large, monolithic functions into small, single-responsibility helper functions.',
      'Cyclomatic Complexity Reduction: Refactor deeply nested if/else blocks into early returns and pattern matching to simplify logic.',
      'Magic String & Number Replacement: Replace hardcoded strings and numbers with typed enums and named constants.',
      'Legacy Async/Await Modernization: Refactor obsolete callback patterns and raw promise chains into clean async/await syntax.',
      'Circular Dependency Elimination: Detect and decouple circular imports using madge and clean architectural layering.',
      'Strict TypeScript Type Narrowing: Replace loose type assertions and any types with discriminated unions and type guards.',
      'Obsolete Library Replacement: Replace bloated deprecated dependencies (e.g. Moment.js, Lodash) with modern native equivalents.',
      'Dependency Tree Pruning: Remove unneeded transitive dependencies to minimize node_modules footprint and attack surface.',
      'Domain-Driven Folder Rationalization: Organize code into cohesive domain folders rather than arbitrary type-based directories.',
      'Semantic Variable & Function Renaming: Rename cryptic variable names into clear, self-documenting descriptive names.',
      'Pure Function Extraction: Extract stateless business calculations into pure, deterministic functions that are trivial to unit test.',
      'Interface Segregation Discipline: Break bloated interfaces into small, client-specific interfaces matching actual usage.',
      'Global Mutable State Elimination: Encapsulate shared state into scoped stores or dependency-injected services.',
      'Standardized Result Type Error Handling: Replace unpredictable thrown errors with typed Result<T, E> return structures.',
      'Build Output Warning Elimination: Resolve all compiler and bundler deprecation warnings to keep build logs completely clean.',
      'Code Comment Freshness Auditing: Delete outdated, misleading comments and replace them with self-explanatory code structures.',
      'Regular Expression Optimization: Rewrite complex, unreadable regex patterns with clear flags and unit-tested matches.',
      'Tailwind CSS Class Deduplication: Consolidate repetitive Tailwind utility strings into shared component variants via CVA.',
      'Component Prop Interface Simplification: Reduce bloated component prop lists by composing sub-components cleanly.',
      'Memory Allocation Hot-Path Profiling: Profile CPU and memory in hot execution loops, replacing inefficient allocations.',
      'Unified API Client Extraction: Replace scattered inline fetch calls with centralized, type-safe API client wrapper methods.',
      'Test File Co-Location & Structure Alignment: Place unit test files directly adjacent to the implementation files they test.',
      'Promise Concurrency Optimization: Replace sequential await loops with Promise.allSettled for parallel asynchronous operations.',
      'Static Code Smell Detection: Run automated linters to flag feature envy, long parameter lists, and data clumps.',
      'Monorepo Import Path Normalization: Standardize workspace import paths (@org/package) across all monorepo applications.',
      'Retired Feature Flag Removal: Search and cleanly remove code branches associated with 100% permanently released feature flags.',
      'Uniform Formatting & Style Enforcement: Apply automated formatting across the entire codebase to eliminate style arguments.',
      'Legacy File Format Upgrades: Migrate deprecated configuration files (CommonJS, YAML) to modern standard formats.'
    ]
  },
  {
    name: 'performance-engineer',
    title: 'Kinetic Velocity & Latency Commander',
    rank: 'Major (O-4)',
    callSign: 'SUPERSONIC-01',
    sector: 'Core Web Vitals, Edge Performance, Bundle Optimization & Low Latency',
    recommendations: [
      'Core Web Vitals Optimization: Guarantee LCP < 1.2s, INP < 100ms, and CLS < 0.05 across all production web pages.',
      'Time to First Byte (TTFB < 100ms): Leverage Cloudflare Workers and edge caching to deliver HTML in under 100ms globally.',
      'JavaScript Bundle Budget Enforcement: Fail CI builds when the initial uncompressed client JavaScript bundle exceeds 150KB.',
      'Modern Image Formats (AVIF/WebP): Convert and serve all raster imagery in AVIF and WebP formats with responsive srcset sizes.',
      'Web Font Loading Optimization: Subset fonts to required character sets and apply font-display: swap to prevent FOIT.',
      'Server-Side Streaming & Suspense: Stream HTML chunks progressively to display above-the-fold content immediately.',
      'Critical CSS Inlining: Inline critical above-the-fold CSS while deferring secondary stylesheets to eliminate render-blocking.',
      'V8 Flame Graph CPU Profiling: Profile client and server JavaScript execution using Chrome DevTools flame graphs to eliminate bottlenecks.',
      'Heap Snapshot Memory Diagnostics: Take memory heap snapshots to identify and eliminate JavaScript memory leaks.',
      'Stale-While-Revalidate Edge Caching: Implement Cache-Control: s-maxage=3600, stale-while-revalidate=86400 headers on dynamic routes.',
      'DOM Node Count Minimization: Keep total rendered DOM nodes under 800 per page to minimize layout calculation overhead.',
      'Component Re-Render Optimization: Prevent unnecessary React re-renders using React.memo, useMemo, and fine-grained signals.',
      'Request Deduplication Layer: Deduplicate identical concurrent fetch requests using SWR or TanStack Query caching.',
      'Database Query Plan Optimization: Eliminate sequential scans on large database tables by creating composite and partial indexes.',
      'Cloudflare KV Micro-Caching: Cache high-frequency read queries in edge KV storage with 60-second TTLs to shield the database.',
      'Web Worker Background Offloading: Offload heavy data processing, parsing, and cryptographic operations to dedicated Web Workers.',
      'Hover-Based Speculative Prefetching: Prefetch next-page bundles and API data when users hover over navigation links.',
      'Brotli & Gzip Compression Tuning: Compress all text assets using Brotli level 6 for optimal transfer speed and minimal CPU overhead.',
      'Layout Thrashing Elimination: Batch DOM reads and writes using requestAnimationFrame to prevent forced synchronous layouts.',
      'GPU-Accelerated CSS Animations: Animate exclusively using transform and opacity properties to utilize hardware GPU layers.',
      'Third-Party Script Offloading: Offload Google Analytics and marketing tags to Web Workers via Partytown to free the main thread.',
      'API Response Payload Minification: Strip null and redundant fields from API JSON responses to reduce payload transfer sizes.',
      'WebSocket Message Rate Throttling: Throttle and debounce real-time WebSocket state broadcasts to avoid saturating clients.',
      'Virtual List Scrolling for Massive Datasets: Render large data tables and lists using virtual DOM windowing (TanStack Virtual).',
      'Serverless Cold-Start Mitigation: Keep cloud functions warm and eliminate heavy import dependencies to achieve <50ms cold starts.',
      'HTTP/3 & 0-RTT Protocol Optimization: Enable HTTP/3 and QUIC protocols on edge servers to accelerate connection handshakes.',
      'Content-Hashed Asset Cache Busting: Assign immutable cache headers (max-age=31536000, immutable) to content-hashed assets.',
      'Edge CDN Anycast Proximity Routing: Route user traffic to the geographically nearest Cloudflare edge data center automatically.',
      'Client Battery & Thermal Profiling: Measure CPU wakeups and power consumption to ensure applications run cool on mobile devices.',
      'Automated Performance Regression CI Gating: Run automated Lighthouse CI tests on every pull request, failing on score drops.'
    ]
  },
  {
    name: 'a11y-auditor',
    title: 'Universal Access & Ergonomics Commander',
    rank: 'Captain (O-3)',
    callSign: 'SENTINEL-01',
    sector: 'Accessibility Compliance, Screen Reader Emulation, Keyboard Nav & WCAG AA/AAA',
    recommendations: [
      'WCAG 2.2 AA & AAA Compliance Verification: Audit web interfaces against all WCAG 2.2 Level AA and AAA success criteria.',
      'Automated axe-core CI Testing: Run automated axe-core accessibility checks in headless Playwright tests on every build.',
      'Screen Reader Compatibility Testing: Test interactive flows with VoiceOver (macOS/iOS) and NVDA (Windows) screen readers.',
      'Complete Keyboard Navigation Flow: Guarantee that every interactive button, link, and input is fully reachable and operable via keyboard.',
      'Color Contrast Ratio Enforcement: Enforce minimum 4.5:1 contrast for normal text and 3:1 for graphical UI elements.',
      'ARIA Landmark Role Structure: Structure pages with correct semantic header, nav, main, aside, and footer landmark roles.',
      'Descriptive Image Alt Text Auditing: Verify that all informative images possess descriptive alt text and decorative images use alt="".',
      'Prominent Focus-Visible Styling: Ensure clear, high-contrast visual focus rings appear when navigating with a keyboard.',
      'Accessible Form Labeling & Error Wiring: Associate form inputs with explicit label tags and aria-describedby error message IDs.',
      'Logical Heading Hierarchy (h1-h6): Enforce strictly nested heading structures without skipping heading levels.',
      'Skip-to-Main-Content Links: Provide an accessible skip link at the top of every page allowing keyboard users to bypass navigation.',
      'Minimum Touch Target Sizing (44x44px): Ensure all mobile buttons, links, and clickable elements measure at least 44 by 44 pixels.',
      'Prefers-Reduced-Motion Respect: Honor user system motion preferences by disabling decorative transitions and animations.',
      'Dynamic Content Announcements via aria-live: Announce asynchronous status updates and toast messages to screen readers using aria-live.',
      'Accessible Data Table Markup: Structure data tables with proper th scope="col/row" attributes and table captions.',
      'Captions & Transcripts for Media: Provide synchronized closed captions and written transcripts for all video and audio content.',
      'Accessible Modal Focus Trapping: Trap keyboard focus within active modal dialogs and restore focus to trigger buttons on close.',
      '400% Zoom Responsive Layouts: Verify that pages can be magnified to 400% zoom without horizontal scrolling or content breakage.',
      'Descriptive Link Anchor Text: Replace vague link text (e.g. "click here") with descriptive text indicating destination context.',
      'Keyboard-Operable Custom Dropdowns: Ensure custom select menus support Arrow, Enter, Escape, and Space key interactions.',
      'Screen-Reader-Accessible Icon Buttons: Add aria-label or visually hidden text to all icon-only buttons for screen reader users.',
      'Color-Independent State Indication: Never rely on color alone to convey status; accompany color changes with icons and text.',
      'HTML Document Language Declaration: Specify valid lang attributes (e.g. lang="en") on root html elements for correct pronunciation.',
      'Escape Key Dismissal for Overlays: Ensure all open modals, menus, and tooltips close immediately upon pressing the Escape key.',
      'Accessible Accordion & Disclosure Widgets: Use native details/summary elements or proper aria-expanded attributes on accordions.',
      'Accessibility Regression Prevention in PRs: Block pull requests that introduce new accessibility violations in CI test suites.',
      'Manual Keyboard Testing Checklists: Provide engineering teams with practical step-by-step manual keyboard testing cheat sheets.',
      'Assistive Technology Emulation Profiles: Maintain automated test profiles simulating various motor, visual, and cognitive impairments.',
      'VPAT Accessibility Report Generation: Compile Voluntary Product Accessibility Template (VPAT) reports for enterprise compliance.',
      'Inclusive Component Pattern Library: Maintain accessible, battle-tested UI component blueprints for the entire engineering organization.'
    ]
  },
  {
    name: 'support-dispatcher',
    title: 'Customer Triage & Field Medic Commander',
    rank: 'Captain (O-3)',
    callSign: 'MEDIC-01',
    sector: 'Customer Inquiries, Ticket Dispatch, Knowledge Base Escalation & User Triage',
    recommendations: [
      'Automated Ticket Sentiment Analysis: Analyze incoming customer tickets using NLP to detect sentiment and prioritize frustrated users.',
      'Intelligent Ticket Category Routing: Route tickets automatically to specialized squads (Billing, AppSec, Core) based on content.',
      'First-Response Time (FRT < 5m) SLA: Maintain automated first-response acknowledgments and route high-priority tickets in under 5 minutes.',
      'Knowledge Base Article Recommendations: Suggest relevant help documentation automatically to users before ticket submission.',
      'Reproducible Bug Report Synthesis: Transform informal customer bug complaints into structured engineering bug reports with repro steps.',
      'Outage Escalation to On-Call SRE: Alert on-call engineers immediately when customer ticket volume for specific errors spikes.',
      'System Incident Status Page Updates: Broadcast active outage statuses and resolution progress directly to public status pages.',
      'Empathetic Canned Response Optimization: Refine support macros to provide warm, clear, and actionable step-by-step guidance.',
      'Resolution Time (MTTR) Tracking: Monitor customer ticket resolution times and identify bottlenecks in tier-2 engineering escalation.',
      'Recurring Bug Cluster Identification: Group related support tickets to pinpoint widespread bugs affecting multiple users.',
      'Product Feedback Tagging: Tag feature requests and friction points from tickets, feeding insights directly to Product Managers.',
      'Omnichannel Support Aggregation: Unify customer inquiries from email, in-app chat, Twitter/X, and Discord into a single queue.',
      'VIP Account Priority Queuing: Fast-track enterprise and high-value customer inquiries to dedicated senior support specialists.',
      'GDPR / CCPA Data Subject Requests: Automate workflows for customer data export, access, and deletion requests within legal deadlines.',
      'Automated CSAT / NPS Survey Dispatch: Send post-resolution satisfaction surveys and analyze feedback trends over time.',
      'Billing Dispute & Refund Workflows: Streamline refund processing and subscription cancellations through integrated Stripe workflows.',
      'Documentation Gap Discovery: Identify topics frequently questioned in tickets and file requests to update the documentation.',
      'User Session Replay Integration: Attach customer session replay links (PostHog/LogRocket) to tickets to visualize user errors.',
      'Follow-the-Sun Timezone Handoffs: Coordinate smooth shift handoffs between global support teams to maintain 24/7 ticket coverage.',
      'Proactive Customer Follow-Ups: Check back with customers 48 hours after complex issue resolution to ensure continued satisfaction.',
      'Internal Support Knowledge Base Maintenance: Maintain internal troubleshooting guides and runbooks for tier-1 support agents.',
      'Anti-Spam & Bot Ticket Filtering: Filter out promotional spam and automated bot submissions before they enter the triage queue.',
      'Multi-Language Real-Time Translation: Translate foreign language customer inquiries and support responses in real-time.',
      'Frustration Keyword Alert Triggers: Flag tickets containing words like "lawsuit", "unacceptable", or "broken" for immediate manager review.',
      'Support Queue Backlog Pruning: Re-engage with stalled customer tickets and resolve inactive conversations automatically after 7 days.',
      'Scheduled Maintenance Customer Notifications: Send proactive email warnings to active users 48 hours prior to planned downtime.',
      'Self-Service Deflection Rate Optimization: Enhance automated chatbot answers to resolve common inquiries without human intervention.',
      'SLA Breach Warning Alerts: Notify support leads 30 minutes before a ticket breaches contractual customer response time limits.',
      'Customer Churn Risk Notifications: Alert account management when an enterprise customer submits multiple high-severity complaints.',
      'Post-Incident Customer Communication Debriefs: Send detailed apology emails and resolution explanations to affected customers post-outage.'
    ]
  },
  {
    name: 'model-router',
    title: 'Electronic Warfare & Neural Signal Commander',
    rank: 'Major (O-4)',
    callSign: 'SIGNAL-01',
    sector: 'LLM Orchestration, Prompt Routing, Cost Optimization & Token Latency',
    recommendations: [
      'Dynamic Complexity-Based Query Routing: Route simple tasks to fast models (DeepSeek/Haiku) and complex reasoning to Claude Opus.',
      'Token Cost-per-Query Optimization: Minimize inference spend by selecting the cheapest model capable of passing task validation.',
      'LiteLLM Multi-Provider Fallback Orchestration: Automatically fail over between Anthropic, OpenAI, DeepSeek, and Gemini on provider downtime.',
      'Agent Squad Token Quota Enforcement: Hard-cap and monitor token consumption across individual agent squads to prevent cost overruns.',
      'Prompt Template Caching & Deduplication: Cache static system prompts at the provider level to leverage 90% prompt caching discounts.',
      'Time-to-First-Token (TTFT) Latency Optimization: Benchmark and route queries to LLM regions delivering the lowest initial token latency.',
      'Dynamic Load Balancing Across API Keys: Distribute inference requests across multiple organizational API keys to avoid rate limits.',
      'Context Window Truncation Prevention: Monitor token counts against model limits, summarizing or compacting history before overflow.',
      'Zod Structured Output Schema Enforcement: Force models to return JSON strictly conforming to Zod schemas, retrying on parse errors.',
      'Embedding Model Selection & Vector Tuning: Select optimal text embedding models (e.g. text-embedding-3-small) based on retrieval accuracy.',
      'API Key Auto-Rotation & Rate-Limit Smoothing: Rotate API keys dynamically when 429 rate limit responses are encountered.',
      'Real-Time Hallucination Heuristic Detection: Detect known hallucination markers and repetitive looping patterns in model streams.',
      'Prompt Token Compression Algorithms: Strip redundant whitespace, markdown flourishes, and boilerplate from input contexts.',
      'LLM-as-a-Judge Output Evaluation: Score model response quality against ground-truth criteria using independent evaluator prompts.',
      'Task-Specific Temperature & Top-p Tuning: Set temperature=0 for deterministic code generation and temperature=0.7 for creative copywriting.',
      'Model Circuit Breakers on Repeated Timeouts: Trip circuit breakers to pause routing to specific models during provider outages.',
      'Local Model Fallback (Ollama/Llama-3): Fall back to locally hosted open-weight models when external internet access is severed.',
      'Continuous Model Uptime & Latency Benchmarking: Track availability, throughput (tokens/sec), and errors across all LLM providers.',
      'Automated Model Pricing Table Updates: Keep token pricing tables updated to calculate accurate cost accounting as providers lower prices.',
      'Per-Squad Token Budget Alerting: Alert squad commanders when token burn exceeds 80% of daily allocated operational limits.',
      'Sensitive Data Redaction Before Inference: Sanitize customer PII, secrets, and private keys from prompts before sending to external APIs.',
      'Semantic Intent Routing via Embeddings: Classify user prompts into specialized task categories using fast vector similarity scoring.',
      'Continuous Frontier Model Benchmarking: Run SWE-bench and human-eval test suites on new model releases to evaluate upgrades.',
      'Response Quality Scoring Telemetry: Log token quality metrics and user thumbs-up/down feedback to track model effectiveness.',
      'Prompt Injection Defense Layer: Filter incoming user prompts for adversarial jailbreaks and system prompt extraction attacks.',
      'Cognitive Context Hydration Limits: Enforce 900K token upper limits on context injection to maintain model reasoning fidelity.',
      'Graceful Degradation to Smaller Models Under Load: Switch non-critical background jobs to smaller models when primary APIs are degraded.',
      'Batch Inference Queue for Non-Urgent Tasks: Queue batch summarization and classification tasks for off-peak discount processing.',
      'Model Deprecation & Migration Playbooks: Maintain migration strategies to transition prompts smoothly when older models are retired.',
      'Cross-Region Anycast Model Endpoint Routing: Route API requests to global cloud regions with the lowest LLM inference queuing latency.'
    ]
  },
  {
    name: 'summarizer',
    title: 'Intelligence Analyst & Briefing Officer',
    rank: 'Captain (O-3)',
    callSign: 'RECORDER-01',
    sector: 'Context Compression, Meeting Synthesis, Activity Logs & Institutional Memory',
    recommendations: [
      'Multi-Hour Session Condensation: Condense lengthy multi-agent conversations into concise, structured executive summaries.',
      'Repomix Schema-Validated JSON Summaries: Ingest codebase snapshots via Repomix and emit structured, validated JSON summaries.',
      'Meeting & Audio Transcript Action Extraction: Parse raw meeting transcripts to extract explicit action items, owners, and deadlines.',
      'Git Commit & PR Diff Synthesis: Translate complex git commit histories and multi-file diffs into readable release summaries.',
      'Pull Request Risk & Impact Summaries: Generate PR descriptions highlighting breaking changes, architectural risks, and test coverage.',
      'Technical Documentation Distillation: Distill complex technical RFCs into one-page summaries tailored for non-technical stakeholders.',
      'Automated Daily Standup Digest Generation: Compile daily engineering progress, blockers, and next steps from git and issue logs.',
      'Error Log Stack Trace Clustering: Group thousands of error log lines into distinct root-cause issue summaries for triage.',
      'Research Paper & RFC Key Takeaways: Extract primary hypotheses, findings, and trade-offs from academic and engineering papers.',
      'Semantic Changelog & Migration Guides: Synthesize code changes between version tags into comprehensive migration instructions.',
      'Executive Dashboard Bulleted Digests: Deliver high-signal, bulleted metrics digests to leadership without data clutter.',
      'Slack & Discord Thread Summarization: Summarize sprawling community and team chat threads into actionable decision logs.',
      'Customer Feedback Theme Aggregation: Consolidate user feedback from multiple channels into prioritized theme summaries.',
      'Architectural Decision Record (ADR) Extraction: Extract rationale, context, and consequences from engineering discussions into ADRs.',
      'Incident Timeline Reconstruction: Reconstruct chronological event timelines from server logs and chat transcripts post-outage.',
      'High-Signal Low-Noise Filtering: Strip conversational filler and repetitive acknowledgments from archived agent logs.',
      'Bulleted Key Decision Logs: Maintain an unbroken running log of all approved technical and organizational decisions.',
      'Knowledge Base Article Auto-Generation: Draft help center articles automatically from resolved customer support tickets.',
      'Context Window Lossless Compression: Compress working memory contexts using semantic summarization without losing key facts.',
      'Weekly Company Milestone Retrospectives: Compile weekly achievements, metrics, and misses into unified company updates.',
      'Email Thread Chain Consolidation: Summarize long, multi-party email chains into clear status updates and pending replies.',
      'Cross-Repository Dependency Update Digests: Summarize upstream dependency updates across multi-repo ecosystems.',
      'Compliance Audit Log Summaries: Synthesize raw audit log events into readable compliance evidence for security auditors.',
      'Test Suite Failure Root-Cause Reports: Summarize failing test suites into exact failure reasons and recommended fixes.',
      'Code Review Comment Distillation: Group and prioritize reviewer feedback on pull requests into clear revision checklists.',
      'Customer Success Call Notes: Summarize client meetings, recording customer goals, pain points, and requested follow-ups.',
      'Security Scan Executive Summaries: Translate complex vulnerability scan outputs into prioritized risk matrices for leadership.',
      'Bug Triage Daily Digest: Compile daily incoming bug reports categorized by severity, component, and affected users.',
      'Architecture Diagram Generation from Code: Summarize codebase architecture into structured Mermaid.js diagrams from source files.',
      'Automated Library README Authoring: Generate clear, accurate README files for newly created libraries and utility packages.'
    ]
  },
  {
    name: 'technical-writer',
    title: 'Public Information & Tactical Chronicler',
    rank: 'Captain (O-3)',
    callSign: 'CHRONICLER-01',
    sector: 'Developer Documentation, API Reference Specs, Tutorials & Technical Runbooks',
    recommendations: [
      'Documentation-as-Code Git Workflows: Maintain all technical documentation as markdown files version-controlled in git.',
      'Interactive OpenAPI & Scalar References: Generate interactive, testable API reference documentation from OpenAPI schemas.',
      'Step-by-Step Developer Quickstart Guides: Author friction-free onboarding tutorials guiding developers from zero to first API call.',
      'Multi-Language Code Example Snippets: Provide verified code snippets in TypeScript, Python, Go, and cURL for all API endpoints.',
      'Mermaid.js Architectural Diagrams: Illustrate system topologies, data flows, and state transitions using embedded Mermaid diagrams.',
      'Self-Hosting & Deployment Runbooks: Document clear, copy-pasteable instructions for deploying applications via Docker and Kubernetes.',
      'Changelog Authoring & Release Publishing: Author engaging release notes highlighting user value, new features, and bug fixes.',
      'Domain Terminology Glossary & Consistency: Maintain a canonical glossary to ensure consistent naming across docs and UI.',
      'Troubleshooting Guides with Error Code Tables: Document solutions for every known error code and failure symptom in the platform.',
      'Contribution Guides & Code of Conduct: Write clear guidelines detailing how open-source contributors can submit pull requests.',
      'Algolia / Typesense Documentation Search: Configure instant, typo-tolerant search across all technical documentation pages.',
      'SDK Method Signatures & Type References: Document every exported SDK function, parameter type, and return value completely.',
      'CLI Command --help & Man Page Generation: Generate accurate CLI command descriptions and usage flags directly from code definitions.',
      'Automated Dead-Link & Freshness Audits: Run continuous CI checks to detect broken internal links and outdated code snippets.',
      'Video Tutorial Script Writing: Author structured, engaging scripts for technical screencasts and developer product demos.',
      'Interactive Documentation Sandboxes: Embed runnable WebContainer code playgrounds directly inside documentation pages.',
      'Step-by-Step Version Migration Guides: Write detailed upgrade walkthroughs detailing code adjustments required for major releases.',
      'FAQ Curation & Search Optimization: Maintain a comprehensive FAQ answering common technical and architectural questions.',
      'Technical Writing Style Guide Enforcement: Enforce Microsoft Technical Style Guide standards for clear, concise, active prose.',
      'Internal Engineering Wiki Organization: Organize internal architecture documentation, onboarding guides, and team playbooks.',
      'Documentation Feedback Widget Integration: Embed helpfulness rating buttons and comment fields on all documentation pages.',
      'Technical SEO Optimization for Developer Docs: Optimize documentation titles, meta descriptions, and structured data for search.',
      'Code Comment & Error Message Copy-Editing: Review code comments and user-facing error strings for clarity, tone, and grammar.',
      'Multi-Version Documentation Archival: Maintain separate documentation versions for current, LTS, and deprecated software releases.',
      'Documentation Accessibility Compliance: Ensure all documentation pages, code blocks, and diagrams meet WCAG AA standards.',
      'Localization & Translation Coordination: Coordinate translation of core developer documentation into Japanese, Spanish, and German.',
      'New Developer Onboarding Walkthroughs: Maintain step-by-step checklists guiding new team members through local environment setup.',
      'Post-Mortem Incident Documentation: Document technical post-mortems clearly for transparent public status communication.',
      'Interactive API Playgrounds Configuration: Configure Swagger/Scalar playgrounds allowing users to execute live API calls.',
      'Continuous Documentation Deployment Pipelines: Automate documentation builds and deployments to edge hosting on git push.'
    ]
  },
  {
    name: 'growth-strategist',
    title: 'Psychological Warfare & Market Conquest Officer',
    rank: 'Captain (O-3)',
    callSign: 'PSYOP-01',
    sector: 'Growth Engineering, Conversion Funnels, Acquisition Loops & Viral Mechanics',
    recommendations: [
      'Conversion Funnel Drop-Off Analytics: Instrument tracking across signup funnels to pinpoint and optimize conversion drop-offs.',
      'SEO Content Gap & Keyword Strategy: Research high-intent developer keywords and author authoritative content to capture search traffic.',
      'Landing Page Headline & CTA A/B Testing: Run statistical A/B tests on value propositions, button copy, and hero layouts.',
      'Viral Loop & Referral Engineering: Architect product referral mechanisms that incentivize existing users to invite team members.',
      'User Activation (Aha! Moment) Metrics: Identify the specific product milestone that correlates with long-term customer retention.',
      'Product-Led Growth (PLG) Onboarding: Design self-serve onboarding paths allowing users to achieve value before entering credit cards.',
      'Automated Social Media Distribution: Automate sharing of technical releases, blog posts, and milestones across Twitter/X and LinkedIn.',
      'PostHog / Segment Event Taxonomy: Design clean, standardized event naming conventions (object_action) across all tracking events.',
      'Cohort Retention Analysis & Churn Mitigation: Track 30-day and 90-day user cohorts to identify product improvements that reduce churn.',
      'Automated Email Drip Sequences: Configure behavioral email drip campaigns triggered by user onboarding milestones.',
      'Backlink Outreach & Domain Authority: Secure high-quality backlinks from developer blogs, directories, and industry publications.',
      'Competitive Feature Comparison Pages: Build honest, feature-by-feature comparison pages highlighting our competitive advantages.',
      'Technical Marketing Blog Angle Ideation: Brainstorm deeply technical, provocative blog post topics that resonate with developers.',
      'Pricing Page Psychology & Tier Optimization: Design pricing tables with clear feature differentiation and highlighted recommended tiers.',
      'Bounce Rate Reduction via Speed Optimization: Accelerate landing page load times under 1 second to minimize bounce rates.',
      'Interactive Product Demo Walkthroughs: Build interactive guided product demos allowing prospects to experience features before signup.',
      'Open-Source Community Growth Strategies: Drive GitHub stars, issues, and forks through active community engagement and hackathons.',
      'User Interview Feedback Synthesis: Conduct user interviews and extract actionable insights to refine product value propositions.',
      'Free-to-Paid Upgrade Trigger Optimization: Identify natural usage ceilings that prompt users to upgrade smoothly to paid plans.',
      'Developer Advocate & Influencer Outreach: Partner with influential developer voices to showcase real-world platform use cases.',
      'Developer Tool Micro-Sites & Directories: Launch free standalone tools and calculators that generate high-intent search traffic.',
      'International Market Expansion Playbooks: Localize landing pages and pricing for high-growth developer regions (Europe, Asia).',
      'Lead Magnet & Technical Asset Strategy: Create comprehensive engineering whitepapers and guides to capture qualified enterprise leads.',
      'CAC-to-LTV Ratio & Payback Period Tracking: Measure customer acquisition costs against lifetime value to ensure profitable growth.',
      'Onboarding Email Open Rate & CTR Tuning: Optimize subject lines and preview text to achieve >40% email open rates.',
      'Viral OpenGraph Image Automation: Dynamically generate visually compelling OpenGraph preview cards for social link sharing.',
      'Product Launch Playbooks (ProductHunt / HN): Execute structured launch campaigns to maximize front-page exposure on Hacker News.',
      'Quarterly Growth Experiment Velocity: Run at least 5 structured growth experiments per quarter, documenting learnings.',
      'Enterprise Inbound Lead Scoring: Score inbound leads based on company size, domain, and in-app usage to route to sales.',
      'Customer Referral Program Dashboard: Provide users with transparent referral tracking dashboards showing rewards earned.'
    ]
  },
  {
    name: 'media-orchestrator',
    title: 'Propaganda & Multimedia Broadcast Officer',
    rank: 'Captain (O-3)',
    callSign: 'BROADCAST-01',
    sector: 'Programmatic Video, Motion Graphics, Audio Synthesis & Brand Media',
    recommendations: [
      'Remotion & HyperFrames Programmatic Video: Render video assets programmatically from React code, HTML, and dynamic data.',
      'Automated Voiceover Synthesis & Audio Ducking: Generate natural AI voiceovers and automatically duck background music during speech.',
      'Motion Graphics Templating with CSS/Canvas: Build reusable animated motion templates using CSS keyframes and HTML Canvas.',
      'High-Efficiency Image Asset Optimization: Compress raster images to WebP/AVIF and optimize vector SVGs to minimize file size.',
      'Video Transcription & Dynamic Captions: Transcribe audio tracks and render animated kinetic typography captions on video frames.',
      'Podcast & Audio Episode Mastering: Process audio tracks with normalization (LUFS -14), noise reduction, and equalization.',
      'Multi-Format Social Video Resizing: Render video compositions automatically in 16:9 (YouTube), 9:16 (Shorts/TikTok), and 1:1 (Twitter).',
      'Unified Brand Asset Kit Management: Maintain version-controlled repositories of brand logos, motion stingers, and visual motifs.',
      'Animated Lottie Micro-Interactions: Design lightweight Lottie animations for smooth UI loading states and success checkmarks.',
      'High-CTR Video Thumbnail Generation: Programmatically generate dynamic video thumbnails with bold typography and high-contrast styling.',
      'Sound Effect (SFX) Syncing with Transitions: Synchronize subtle audio sound effects (whooshes, clicks, pops) with visual transitions.',
      'Multi-Track Audio Mixing Architecture: Mix voiceover, sound effects, and background ambient tracks with deterministic volume envelopes.',
      'Screen Recording Smoothing & Cursor Physics: Capture screen recordings and apply curved, human-like smoothing to mouse cursor movements.',
      'GPU-Accelerated Video Rendering Pipeline: Leverage hardware acceleration to render high-definition 60fps video at 10x real-time speed.',
      'Video Metadata Tagging & OpenGraph Embedding: Embed video metadata, duration, and preview poster tags in HTML headers.',
      'Video XML Sitemap for SEO Indexing: Generate and maintain video sitemaps with thumbnail URLs and descriptions for search engines.',
      'Responsive Web Video Player Integration: Embed lightweight, accessible video players supporting keyboard controls and playback rates.',
      'Interactive Branching Video Experiences: Build interactive video player overlays allowing viewers to choose narrative pathways.',
      'HLS / DASH Adaptive Bitrate Streaming: Transcode video into adaptive bitrate streaming chunks for buffer-free playback globally.',
      'Curated Stock Asset Library Management: Maintain an organized library of licensed video footage, audio loops, and sound effects.',
      'Animated Chart & Data Video Export: Animate complex data charts and graphs into video clips for marketing and presentations.',
      'Automated Product Teaser Video Generation: Render 15-second animated teaser videos automatically from git release notes.',
      'Brand Identity Intros & Outros: Create standardized, high-energy 3-second animated logo stingers for video branding.',
      'Multi-Language Video Subtitle Generation: Generate synchronized SRT and VTT subtitle files translated into multiple languages.',
      'Cloud Video Rendering Farm Dispatch: Offload intensive multi-hour video rendering jobs to distributed cloud worker pools.',
      'Edge Video Asset Caching & Delivery: Cache video and audio files on Cloudflare CDN edge nodes to guarantee instantaneous streaming.',
      'Visual Style Guide Enforcement for Media: Enforce typography, color palette, and framing rules across all produced video content.',
      'Media Pipeline Error Monitoring & Retry: Catch video rendering failures and restart rendering from the nearest checkpoint frame.',
      'Social Video Clip Extraction: Automatically slice long webinar and keynote recordings into short, punchy highlight clips.',
      'Brand Consistency Auditing Across Media: Audit published video and audio materials to ensure strict compliance with brand guidelines.'
    ]
  },
  {
    name: 'computer-use-operator',
    title: 'Kinetic Drone Operator & Native GUI Commander',
    rank: 'Captain (O-3)',
    callSign: 'DRONE-01',
    sector: 'Native GUI Automation, Desktop Driving, Accessibility Tree Parsing & CUA',
    recommendations: [
      'Native GUI Automation via Cua-Driver CLI: Drive native desktop operating systems (macOS, Linux, Windows) using direct Cua CLI tools.',
      'Deterministic Accessibility Tree Parsing: Snapshot and bind UI actions to stable accessibility element tokens rather than raw coordinates.',
      'Resolution-Normalized Coordinate Clicking: Fall back to normalized percentage-based coordinates when accessibility trees are missing.',
      'Multi-Display & Multi-Window Management: Enumerate, focus, and manage multiple desktop windows and monitor displays reliably.',
      'Clipboard Leakage Prevention: Automate keyboard shortcuts without exposing sensitive tokens or credentials in system clipboards.',
      'Human-Like Velocity Mouse Movements: Simulate realistic mouse cursor acceleration curves to avoid triggering anti-bot bot detection.',
      'Desktop Application Lifecycle Management: Launch, monitor, verify, and cleanly terminate native operating system applications.',
      'Native Desktop Browser Automation: Drive Chrome, Safari, and Firefox natively on desktop environments with session persistence.',
      'Perceptual Screenshot Diffing & Verification: Capture screen snapshots and verify UI state changes using perceptual visual diffing.',
      'OCR Text Extraction & Visual Parsing: Extract onscreen text from legacy desktop applications using local optical character recognition.',
      'Secure Credential Keystroke Injection: Inject login credentials directly into password fields without logging plaintext strings.',
      'Automated System Dialog Dismissal: Automatically detect and dismiss operating system permission prompts and modal alerts.',
      'Cursor Position Verification Before Action: Verify that mouse cursor position has arrived at target bounds before triggering clicks.',
      'Rate-Limited Human-Cadence Input: Throttle typing speeds and click intervals to match natural human interaction speeds.',
      'Operating System Menu Bar Interaction: Navigate system menus (Apple menu, File, Edit, View) reliably using native menu paths.',
      'Audio Output Monitoring & Verification: Monitor system audio output to verify sound playback during media automation workflows.',
      'Native Open/Save File Dialog Handling: Automate interaction with native operating system file picker and save dialogs.',
      'Background Process Health Supervision: Monitor CPU and memory usage of target applications during long-running GUI tasks.',
      'Desktop Notification Interception: Detect, parse, and dismiss operating system toast notifications and banner alerts.',
      'DPI Scaling & Retina Adaptation: Adjust coordinate calculations dynamically based on screen pixel density (Retina/4K).',
      'Window Tiling & Geometry Snapping: Snap target windows into precise screen coordinates (e.g. 1920x1080) for consistent automation.',
      'Desktop Workflow Recording & Trajectory Replay: Record multi-step desktop tasks and replay them deterministically across machines.',
      'Frozen Window Auto-Recovery: Detect unresponsiveness in desktop applications and force-kill/restart frozen processes.',
      'Sandboxed Virtual Machine Execution: Execute untrusted or destructive GUI tasks inside isolated virtual machines or Docker containers.',
      'Terminal Window Automation via GUI Focus: Focus native terminal applications and execute commands with interactive visual verification.',
      'System Settings Inspection & Toggle Automation: Automate configuration of system settings (network, display, sound) via GUI.',
      'Session State Checkpointing & Resume: Save execution checkpoints during complex desktop workflows to resume seamlessly on failure.',
      'Zero-Touch Software Installer Automation: Automate multi-step software installation wizards and license agreement acceptances.',
      'Visual Anomaly Detection During Execution: Detect visual bugs, flickering, and misplaced dialogs during desktop task execution.',
      'Emergency GUI Stop Hotkey: Maintain a global fail-safe hotkey (e.g. Cmd+Shift+Escape) to halt autonomous GUI actions instantly.'
    ]
  }
];

// 1. Author the complete artifact markdown
function generateArtifact(): string {
  let md = `# Top 30 Converged Tactical Capabilities & Recommendations for All 24 Fleet Agents

## Executive Overview: Paramilitary Mission Command & 2026 Autonomous Software Engineering

Under **Auftragstaktik (Mission Command)** and modern 2026 autonomous software engineering doctrines, autonomous multi-agent fleets succeed through **strict disjoint sectors, clear commander intent, deterministic proof of life, and decentralized tactical initiative**.

This comprehensive operational ledger establishes the **Top 30 Converged Tactical Capabilities, Upgrades, Enhancements, and Features for each of the 24 Canonical Agent Roles** in our fleet—constituting **720 concrete, domain-specific, battle-tested operational capabilities**.

Every single recommendation here represents an elite standard:
- **AST-Aware Symbol Navigation & Schema Locking** (Zero circular dependencies, contract-first design)
- **Auftragstaktik Execution Loops** (Recon -> Action -> Verification -> SITREP)
- **Three-Tier Rules of Engagement (ROE)** (Green: Autonomous / Amber: Audited / Red: Restricted)
- **Deterministic Proof of Life Verification** (100% test pass, zero-exit codes, machine-verifiable DoD)
- **PACE Communications Resilience** (Primary, Alternate, Contingency, Emergency routing across models)
- **100% 1:1 Parity with Paperclip** (PostgreSQL records, Lucide icons, palettes, budgets, and runtime configs)

---

## Master Roster & Fleet Taxonomy

| # | Agent Name | Military Rank & Call Sign | Role | Lucide Icon | Appearance Palette | Monthly Budget | Chain of Command |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | **CEO** | General of Fleet (\`VANGUARD-01\`) | \`ceo\` | \`crown\` | \`golden-hour\` | $250.00 | *Sovereign (None)* |
| **02** | **Architect** | Colonel (\`STRAT-01\`) | \`engineer\` | \`layers\` | \`ultraviolet-tide\` | $150.00 | **CEO** |
| **03** | **Product-Manager** | Lt. Colonel (\`RECON-01\`) | \`pm\` | \`clipboard-list\`| \`arctic-blue\` | $100.00 | **CEO** |
| **04** | **Full-Stack-Engineer** | Captain (\`COMBAT-01\`) | \`engineer\` | \`code\` | \`turquoise-cherry\`| $150.00 | **Architect** |
| **05** | **Backend-Engineer** | Major (\`ARTILLERY-01\`) | \`engineer\` | \`server\` | \`electric-grove\` | $100.00 | **Architect** |
| **06** | **Database-Engineer** | Major (\`ORDNANCE-01\`) | \`engineer\` | \`database\` | \`coral-current\` | $80.00 | **Architect** |
| **07** | **QA-Verification** | Colonel (\`INSPECTOR-01\`) | \`qa\` | \`check-circle-2\`| \`cherry-pop\` | $100.00 | **CEO** |
| **08** | **DevSecOps** | Lt. Colonel (\`LOGISTICS-01\`) | \`devops\` | \`terminal\` | \`solar-flare\` | $100.00 | **CEO** |
| **09** | **SRE** | Major (\`REACTION-01\`) | \`devops\` | \`activity\` | \`flamingo-jade\` | $100.00 | **DevSecOps** |
| **10** | **AppSec** | Major (\`SENTRY-01\`) | \`security\` | \`shield-alert\` | \`violet-ember\` | $80.00 | **DevSecOps** |
| **11** | **FinOps** | Major (\`QUARTERMASTER-01\`) | \`general\` | \`dollar-sign\` | \`coral-mint\` | $50.00 | **DevSecOps** |
| **12** | **Release-Manager** | Lt. Colonel (\`AIRBOSS-01\`) | \`devops\` | \`send\` | \`violet-ember\` | $50.00 | **DevSecOps** |
| **13** | **UI-Designer** | Captain (\`VANGUARD-UI\`) | \`design\` | \`palette\` | \`pink-lemonade\` | $80.00 | **Architect** |
| **14** | **Information-Architect** | Captain (\`CARTOGRAPHER-01\`)| \`pm\` | \`map\` | \`electric-grove\` | $50.00 | **Architect** |
| **15** | **Refactorer** | Captain (\`SWEEPER-01\`) | \`engineer\` | \`scissors\` | \`violet-ember\` | $80.00 | **Architect** |
| **16** | **Performance-Engineer** | Major (\`SUPERSONIC-01\`) | \`engineer\` | \`zap\` | \`solar-flare\` | $80.00 | **Architect** |
| **17** | **A11y-Auditor** | Captain (\`SENTINEL-01\`) | \`qa\` | \`eye\` | \`arctic-blue\` | $50.00 | **QA-Verification** |
| **18** | **Support-Dispatcher** | Captain (\`MEDIC-01\`) | \`pm\` | \`life-buoy\` | \`cherry-pop\` | $50.00 | **QA-Verification** |
| **19** | **Model-Router** | Major (\`SIGNAL-01\`) | \`engineer\` | \`radio\` | \`electric-grove\` | $50.00 | **DevSecOps** |
| **20** | **Summarizer** | Captain (\`RECORDER-01\`) | \`general\` | \`file-text\` | \`electric-grove\` | $50.00 | **CEO** |
| **21** | **Technical-Writer** | Captain (\`CHRONICLER-01\`) | \`general\` | \`book-open\` | \`electric-grove\` | $80.00 | **CEO** |
| **22** | **Growth-Strategist** | Captain (\`PSYOP-01\`) | \`general\` | \`trending-up\` | \`electric-grove\` | $80.00 | **CEO** |
| **23** | **Media-Orchestrator** | Captain (\`BROADCAST-01\`) | \`general\` | \`film\` | \`violet-ember\` | $100.00 | **CEO** |
| **24** | **Computer-Use-Operator**| Captain (\`DRONE-01\`) | \`engineer\` | \`bot\` | \`electric-grove\` | $100.00 | **DevSecOps** |

---

`;

  for (let i = 0; i < FLEET_RECOMMENDATIONS.length; i++) {
    const agent = FLEET_RECOMMENDATIONS[i];
    md += `## ${i + 1}. ${agent.title} (\`${agent.callSign}\` - ${agent.name})\n\n`;
    md += `- **Military Rank**: ${agent.rank}\n`;
    md += `- **Combat Sector**: ${agent.sector}\n\n`;
    md += `### Top 30 Converged Tactical Capabilities & Elite Upgrades\n\n`;
    for (let j = 0; j < agent.recommendations.length; j++) {
      md += `${j + 1}. **${agent.recommendations[j].split(':')[0]}**: ${agent.recommendations[j].split(':').slice(1).join(':').trim()}\n`;
    }
    md += `\n---\n\n`;
  }

  return md;
}

// 2. Update ~/.agentskills/agents/*.md profiles
function updateAgentProfiles(): void {
  console.log('Embedding top 30 recommendations directly into active agent profiles...');
  for (const agent of FLEET_RECOMMENDATIONS) {
    const filePath = resolve(AGENTS_DIR, `${agent.name}.md`);
    try {
      let content = readFileSync(filePath, 'utf8');

      // Check if Section 3 exists
      const section3Match = content.match(/## 3\..*?\n/);
      if (!section3Match) {
        console.warn(`Could not find Section 3 in ${agent.name}.md`);
        continue;
      }

      // Format 30 recommendations
      let recsBlock = `\n### Top 30 Converged Tactical Capabilities & Elite Upgrades\n\n`;
      for (let j = 0; j < agent.recommendations.length; j++) {
        recsBlock += `${j + 1}. **${agent.recommendations[j].split(':')[0]}**: ${agent.recommendations[j].split(':').slice(1).join(':').trim()}\n`;
      }
      recsBlock += `\n`;

      // Check if "Top 30 Converged Tactical Capabilities" is already present
      if (content.includes('### Top 30 Converged Tactical Capabilities & Elite Upgrades')) {
        content = content.replace(
          /### Top 30 Converged Tactical Capabilities & Elite Upgrades[\s\S]*?(?=---\n\n## 4\.)/,
          recsBlock
        );
      } else {
        // Insert right before Section 4
        content = content.replace(
          /\n---\n\n## 4\. Standard Operating Procedure/,
          `${recsBlock}---\n\n## 4. Standard Operating Procedure`
        );
      }

      writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Embedded 30 capabilities into ${agent.name}.md (${agent.callSign})`);
    } catch (err) {
      console.error(`Error updating ${agent.name}.md:`, err);
    }
  }
}

// 3. Execution (run only when invoked directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Generating exhaustive 720 recommendations artifact...');
  const artifactContent = generateArtifact();
  const artifactPath = resolve(ARTIFACT_DIR, 'top-30-recommendations-for-24-agents.md');
  writeFileSync(artifactPath, artifactContent, 'utf8');

  const metadata = {
    summary: "Comprehensive operational ledger detailing the Top 30 Converged Tactical Capabilities, Upgrades, and Enhancements for all 24 Canonical Paramilitary Agent Roles (720 total recommendations). Grounded in 2026 state-of-the-art autonomous software engineering benchmarks, AST-aware tooling, deterministic proof of life, Auftragstaktik mission command, and 100% 1:1 Paperclip parity.",
    updatedAt: new Date().toISOString(),
    userFacing: true
  };
  writeFileSync(`${artifactPath}.metadata.json`, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`✓ Wrote artifact: ${artifactPath} (${artifactContent.length} bytes)`);

  updateAgentProfiles();
  console.log('\nAll 720 tactical recommendations generated and implemented across the fleet.');
}