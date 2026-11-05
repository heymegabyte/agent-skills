#!/usr/bin/env node
/**
 * generate-field-manuals.ts
 * Generates comprehensive Operational Field Manuals and Doctrine Specifications
 * for all 24 canonical agent roles in docs/agents/, plus the master fleet README.md.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { ELITE_FLEET, type EliteAgentSpec } from './converge-elite-fleet.ts';
import { FLEET_RECOMMENDATIONS } from './generate-720-fleet.ts';

const DOCS_AGENTS_DIR = resolve(homedir(), '.agentskills', 'docs', 'agents');
mkdirSync(DOCS_AGENTS_DIR, { recursive: true });

// Upstream and downstream relationships for A2A handshakes
const FLEET_RELATIONSHIPS: Record<string, { upstream: string[]; downstream: string[]; artifactsIn: string[]; artifactsOut: string[] }> = {
  ceo: {
    upstream: ['Human Stakeholders / Strategic Board'],
    downstream: ['Architect', 'Product-Manager', 'QA-Verification', 'DevSecOps', 'Summarizer', 'Technical-Writer', 'Growth-Strategist', 'Media-Orchestrator'],
    artifactsIn: ['Strategic Business Goals', 'Budget Ceilings', 'High-Level Feature Requests'],
    artifactsOut: ['Auftragstaktik Mission Intent Headers', 'Squad Token Quotas', 'Disjoint Battle Space Allocations']
  },
  architect: {
    upstream: ['CEO', 'Product-Manager'],
    downstream: ['Full-Stack-Engineer', 'Backend-Engineer', 'Database-Engineer', 'UI-Designer', 'Information-Architect', 'Refactorer', 'Performance-Engineer'],
    artifactsIn: ['PRDs with Binary Acceptance Criteria', 'Feature Scope Freezes'],
    artifactsOut: ['OpenSpec Proposals & Specs', 'OpenAPI/Zod Schemas', 'Repo Topography Maps', 'Database Schemas']
  },
  'product-manager': {
    upstream: ['CEO', 'Growth-Strategist', 'Support-Dispatcher'],
    downstream: ['Architect', 'Full-Stack-Engineer', 'QA-Verification'],
    artifactsIn: ['User Feedback Clusters', 'Growth Funnel Data', 'Bug Cluster Trends'],
    artifactsOut: ['PRD-as-Code (Markdown)', 'Binary Acceptance Criteria (Given-When-Then)', 'Acyclic User Story Graphs']
  },
  'fullstack-engineer': {
    upstream: ['Architect', 'Product-Manager', 'UI-Designer', 'Backend-Engineer'],
    downstream: ['QA-Verification', 'A11y-Auditor', 'Performance-Engineer'],
    artifactsIn: ['OpenSpec Tasks', 'OpenAPI Endpoints', 'Design Tokens', 'UI Component Matrices'],
    artifactsOut: ['16-State Interactive Components', 'Integrated Client Routes', 'End-to-End Test Fixtures']
  },
  'backend-engineer': {
    upstream: ['Architect', 'Database-Engineer'],
    downstream: ['Fullstack-Engineer', 'QA-Verification', 'DevSecOps'],
    artifactsIn: ['OpenSpec Schema Specs', 'Drizzle ORM Tables', 'Idempotency Contracts'],
    artifactsOut: ['Hono Microservices', 'Zod Validation Middleware', 'Cloudflare Queue Handlers', 'OpenTelemetry Traces']
  },
  'database-engineer': {
    upstream: ['Architect', 'Backend-Engineer'],
    downstream: ['Backend-Engineer', 'DevSecOps', 'SRE'],
    artifactsIn: ['Data Model Requirements', 'Storage Scaling Projections'],
    artifactsOut: ['Zero-Downtime Migration Scripts', 'Drizzle ORM Schema Definitions', 'Index Execution Plans', 'PITR Backup Verify Logs']
  },
  'qa-verification': {
    upstream: ['Full-Stack-Engineer', 'Backend-Engineer', 'Release-Manager'],
    downstream: ['Release-Manager', 'DevSecOps', 'A11y-Auditor', 'Support-Dispatcher'],
    artifactsIn: ['Staging Deployment Builds', 'PR Commits', 'Feature Test Scenarios'],
    artifactsOut: ['Playwright E2E Pass Logs', 'Visual Diff Snapshot Reports', 'Deterministic Proof of Life Attestation']
  },
  devsecops: {
    upstream: ['CEO', 'Architect', 'Release-Manager'],
    downstream: ['SRE', 'AppSec', 'FinOps', 'Release-Manager', 'Computer-Use-Operator'],
    artifactsIn: ['OpenTofu Infrastructure Specs', 'Container Build Manifests'],
    artifactsOut: ['CI/CD Pipelines', 'Distroless Docker Images', 'Cloudflare Zero-Trust Policies', 'Signed Cosign Artifacts']
  },
  sre: {
    upstream: ['DevSecOps', 'Backend-Engineer'],
    downstream: ['Release-Manager', 'Support-Dispatcher', 'CEO'],
    artifactsIn: ['Service Deployment Notifications', 'Alert Threshold Configurations'],
    artifactsOut: ['Prometheus/Grafana Dashboards', 'Error Budget Burn Alerts', 'Automated Failover Policies', 'Blameless Post-Mortems']
  },
  appsec: {
    upstream: ['DevSecOps', 'Architect', 'Backend-Engineer'],
    downstream: ['DevSecOps', 'QA-Verification', 'CEO'],
    artifactsIn: ['Pull Requests', 'Dependency Trees', 'API Endpoint Registries'],
    artifactsOut: ['Semgrep Rule Scans', 'OWASP Vulnerability Reports', 'CSP Nonce Directives', 'CVSS Triage Tickets']
  },
  finops: {
    upstream: ['CEO', 'DevSecOps', 'Model-Router'],
    downstream: ['DevSecOps', 'SRE', 'CEO'],
    artifactsIn: ['Cloud Invoices', 'Token Telemetry Spools', 'Infrastructure Allocations'],
    artifactsOut: ['Multi-Cloud Spend Observatories', 'Resource Downsizing Recommendations', 'Hard Spend Cap Enforcements']
  },
  'release-manager': {
    upstream: ['QA-Verification', 'DevSecOps', 'Product-Manager'],
    downstream: ['DevSecOps', 'SRE', 'Support-Dispatcher', 'Technical-Writer'],
    artifactsIn: ['Signed Release Candidates', 'Passing E2E Test Runs', 'Approved PRDs'],
    artifactsOut: ['Canary Deployment Dialers', 'Automated Release Notes', 'Semantic Git Tags', 'Post-Deploy Verification Logs']
  },
  'ui-designer': {
    upstream: ['Architect', 'Product-Manager'],
    downstream: ['Full-Stack-Engineer', 'Information-Architect'],
    artifactsIn: ['User Journey Maps', 'Feature Requirements'],
    artifactsOut: ['16-State Component Design Tokens', 'Cinematic Motion Curves (<333ms)', 'Accessible Color Palettes (AAA)']
  },
  'information-architect': {
    upstream: ['Product-Manager', 'UI-Designer'],
    downstream: ['Architect', 'Full-Stack-Engineer', 'Technical-Writer', 'Growth-Strategist'],
    artifactsIn: ['Feature Information Hierarchies', 'Content Ontologies'],
    artifactsOut: ['Semantic URL Ontologies', 'Dynamic XML Sitemaps', 'JSON-LD Structured Schemas', 'Faceted Filter Taxonomies']
  },
  refactorer: {
    upstream: ['Architect', 'QA-Verification'],
    downstream: ['Architect', 'Full-Stack-Engineer', 'Backend-Engineer'],
    artifactsIn: ['AST Complexity Reports', 'Dead Code Scans (Knip)', 'Static Lint Warnings'],
    artifactsOut: ['Consolidated Shared Utilities', 'Decomposed Functions (<30 lines)', 'Strict Type Narrowings', 'Zero-Orphan Clean Code']
  },
  'performance-engineer': {
    upstream: ['Architect', 'Full-Stack-Engineer', 'Backend-Engineer'],
    downstream: ['Full-Stack-Engineer', 'Backend-Engineer', 'Release-Manager'],
    artifactsIn: ['Bundle Size Metrics', 'Flame Graph Profiles', 'Core Web Vitals Traces'],
    artifactsOut: ['LCP/INP/CLS Optimization Patches', 'Edge KV Caching Policies', 'Bundle Splitting Configurations (<150KB)']
  },
  'a11y-auditor': {
    upstream: ['Full-Stack-Engineer', 'UI-Designer', 'QA-Verification'],
    downstream: ['Full-Stack-Engineer', 'UI-Designer', 'QA-Verification'],
    artifactsIn: ['Rendered Web Pages', 'Component Blueprints'],
    artifactsOut: ['Axe-Core Automated Audit Reports', 'Screen Reader Navigation Pass Logs', 'WCAG 2.2 AA/AAA Attestations']
  },
  'support-dispatcher': {
    upstream: ['Customers / End Users', 'QA-Verification', 'SRE'],
    downstream: ['Product-Manager', 'QA-Verification', 'SRE', 'CEO'],
    artifactsIn: ['Customer Inquiries', 'Bug Reports', 'Public Status Updates'],
    artifactsOut: ['Triaged Engineering Bug Tickets', 'Knowledge Base Gaps', 'Sentiment Metrics', 'Incident Status Broadcasts']
  },
  'model-router': {
    upstream: ['DevSecOps', 'FinOps', 'All Agents'],
    downstream: ['FinOps', 'All Agents'],
    artifactsIn: ['Inference Queries', 'Model Latency Metrics', 'Token Budgets'],
    artifactsOut: ['Dynamic Model Selections (LiteLLM)', 'Prompt Cache Directives', 'Cost-Optimized Inference Streams']
  },
  summarizer: {
    upstream: ['CEO', 'All Agents'],
    downstream: ['CEO', 'Technical-Writer', 'Stakeholders'],
    artifactsIn: ['Repomix Codebase Dumps', 'Multi-Agent Logs', 'Meeting Audio Transcripts'],
    artifactsOut: ['Schema-Validated JSON Summaries', 'Executive Briefing Digests', 'Action Item Extraction Ledgers']
  },
  'technical-writer': {
    upstream: ['Architect', 'Release-Manager', 'Product-Manager'],
    downstream: ['All Engineers', 'External Developers', 'Growth-Strategist'],
    artifactsIn: ['OpenAPI Specs', 'Conventional Git Commits', 'Feature PRDs'],
    artifactsOut: ['Interactive Scalar API Docs', 'Developer Quickstart Guides', 'User-Facing Changelogs', 'Deployment Runbooks']
  },
  'growth-strategist': {
    upstream: ['CEO', 'Product-Manager', 'Support-Dispatcher'],
    downstream: ['Product-Manager', 'Media-Orchestrator', 'CEO'],
    artifactsIn: ['PostHog Funnel Metrics', 'Cohort Retention Curves', 'Search Keyword Trends'],
    artifactsOut: ['A/B Testing Hypotheses', 'Conversion Funnel Optimizations', 'SEO Keyword Strategies', 'Viral Referral Loops']
  },
  'media-orchestrator': {
    upstream: ['Growth-Strategist', 'UI-Designer', 'CEO'],
    downstream: ['Growth-Strategist', 'Technical-Writer', 'Full-Stack-Engineer'],
    artifactsIn: ['Release Highlights', 'Brand Assets', 'Voiceover Audio Scripts'],
    artifactsOut: ['Remotion Programmatic Videos', 'Social Video Cuts (16:9, 9:16, 1:1)', 'Dynamic Animated Typography', 'Brand Asset Kits']
  },
  'computer-use-operator': {
    upstream: ['DevSecOps', 'QA-Verification'],
    downstream: ['DevSecOps', 'QA-Verification', 'SRE'],
    artifactsIn: ['Desktop Automation Tasks', 'Native App Test Specs'],
    artifactsOut: ['Cua-Driver Action Trajectories', 'Accessibility Tree Snapshots', 'Visual State Verification Diffs', 'Automated GUI Execution Logs']
  }
};

function generateFieldManual(agent: EliteAgentSpec): string {
  const rel = FLEET_RELATIONSHIPS[agent.name] || {
    upstream: ['CEO'],
    downstream: ['Subordinate Units'],
    artifactsIn: ['Mission Orders'],
    artifactsOut: ['Proof of Life Logs']
  };

  const recs = FLEET_RECOMMENDATIONS.find(r => r.name === agent.name)?.recommendations || [];
  const recsList = recs.map((r, i) => `${i + 1}. **${r.split(':')[0]}**: ${r.split(':').slice(1).join(':').trim()}`).join('\n');

  const runbookRows = agent.recoveryRunbook.map(r => `| **${r.scenario}** | \`${r.action}\` | Diagnostic / Recovery |`).join('\n');
  const dodItems = agent.definitionOfDone.map(d => `- [ ] ${d}`).join('\n');

  return `# Field Manual & Operational Doctrine: ${agent.title}

- **Call Sign**: \`${agent.callSign}\`
- **Military Rank**: ${agent.rank}
- **Combat Sector**: ${agent.sector}
- **Monthly Token Quota**: $${(agent.budgetMonthlyCents / 100).toFixed(2)} USD
- **Primary PACE Engine**: \`${agent.pace.primary}\`

---

## 1. Executive Summary & Tactical Role Profile

The **${agent.title}** (\`${agent.callSign}\`) operates under the strict doctrine of **Auftragstaktik (Mission Command)** within the **${agent.sector}** battle space. Autonomous execution is bounded by machine-verifiable contracts, deterministic proofs of life, and sovereign token budgets.

Under this doctrine, the agent possesses standing full autonomy to plan, execute, verify, and report. Silence from command is approval for standard non-destructive development workflows.

---

## 2. Command Structure & Inter-Agent Handshake Interfaces (A2A Protocol)

\`\`\`mermaid
flowchart LR
    Upstream["Upstream Input Units<br/>(${rel.upstream.join(', ')})"] --> Agent["${agent.callSign}<br/>(${agent.title})"]
    Agent --> Downstream["Downstream Consumers<br/>(${rel.downstream.join(', ')})"]
\`\`\`

### Upstream Contract Handshakes (Inputs)
${rel.upstream.map(u => `- **Source**: \`${u}\`\n  - Required Artifacts: ${rel.artifactsIn.join(', ')}`).join('\n')}

### Downstream Delivery Handshakes (Outputs)
${rel.downstream.map(d => `- **Destination**: \`${d}\`\n  - Guaranteed Delivery: ${rel.artifactsOut.join(', ')}`).join('\n')}

---

## 3. Strict Tool Permissions & Operational Boundaries

### Permitted Toolsets
- **Primary Harness**: \`${agent.tools}\`
- **Allowed Sub-Commands**: \`${agent.allowedTools}\`
- **Context Mode**: \`fork\` (isolated execution context)
- **Permission Mode**: \`${agent.permissionMode}\`

### Strictly Prohibited Actions (Out-of-Bounds)
${agent.outOfBounds.map(b => `- [FORBIDDEN] ${b}`).join('\n')}
- [FORBIDDEN] Direct production credential manipulation or unredacted token logging
- [FORBIDDEN] Overlapping modifications in foreign squads' battle spaces without explicit A2A locking

---

## 4. Standard Operating Procedure (4-Phase Kinetic Loop)

### Phase 1: Deep Reconnaissance (Recon)
- **Objective**: ${agent.sop.recon}
- Inspect repository abstract syntax trees (ASTs), grep exact symbol usages, and analyze git log history.
- Verify schema constraints, type boundaries, and downstream caller impact before editing code.

### Phase 2: Surgical Strike (Action / Execution)
- **Objective**: ${agent.sop.action}
- Confine all file creations, edits, and deletions strictly within assigned sector boundaries.
- Adhere to single-responsibility modules, strict TypeScript (zero \`any\`), and Zod boundary validation.

### Phase 3: Proof of Life Verification
- **Objective**: ${agent.sop.verification}
- Execute deterministic unit, integration, or visual regression tests.
- Re-run type-checking and linters to verify zero warnings and zero compiler errors.
- Never declare a mission complete without verifiable, reproducible proof.

### Phase 4: Debrief & SITREP (Situation Report)
- **Objective**: ${agent.sop.sitrep}
- Emit a 9-line standardized NATO SITREP summarizing DTG, Unit, Sector, Readiness, Intent, Action, Proof of Life, Casualty/Debt, and Next Waypoint.

---

## 5. Top 30 Converged Tactical Capabilities & Combat Specifications

${recsList}

---

## 6. Self-Healing Error Recovery Runbook

| Failure Mode / Combat Condition | Immediate Diagnostic Protocol | Action & Recovery Procedure |
| :--- | :--- | :--- |
${runbookRows}

---

## 7. Three-Tier Rules of Engagement (ROE)

\`\`\`mermaid
flowchart TD
    Order[Incoming Mission Order] --> Check{ROE Evaluation}
    Check -->|GREEN: In Sector| Auto[Autonomous Execution]
    Check -->|AMBER: Cross-Boundary| Audit[Two-Man Rule Verification Gate]
    Check -->|RED: Destructive/Cost| Halt[Immediate Halt & Escalate]
\`\`\`

- **GREEN (Autonomous Strike / Free Execution)**:
${agent.roe.green.map(g => `  - ${g}`).join('\n')}

- **AMBER (Audited / Two-Man Rule)**:
${agent.roe.amber.map(a => `  - ${a}`).join('\n')}

- **RED (Restricted / High Blast Radius)**:
${agent.roe.red.map(r => `  - ${r}`).join('\n')}

---

## 8. PACE Communications Resilience Matrix

| Tier | Engine / Channel | Failover Trigger & Protocol |
| :--- | :--- | :--- |
| **Primary (P)** | \`${agent.pace.primary}\` | Default high-cognition driver for strategic planning and execution. |
| **Alternate (A)** | \`${agent.pace.alternate}\` | Automatic switch on HTTP 429 rate limit or primary provider degradation. |
| **Contingency (C)** | \`${agent.pace.contingency}\` | High-throughput open-weight offload for bulk tasks and routine refactoring. |
| **Emergency (E)** | \`${agent.pace.emergency}\` | Sovereign fallback on total external network partition or provider blackout. |

---

## 9. Machine-Verifiable Definition of Done (Proof of Life)

${dodItems}

---

## 10. Operational Scenarios & Failure Mitigation Playbooks

### Scenario A: Complex Multi-File Merge Conflict or AST Regression
1. **Halt**: Immediately freeze working tree state using \`git stash\` or worktree isolation.
2. **Isolate**: Inspect AST diffs to identify exact symbol renaming or parameter misalignment.
3. **Reconcile**: Re-apply changes on top of cleanly fetched master, running \`node bin/validate-agents.mjs\` and targeted test suites.
4. **Attest**: Emit SITREP logging resolution and updated proof of life hash.

### Scenario B: Unexpected Rate Limit (HTTP 429) During High-Tempo Assault
1. **Catch**: Catch 429 status at HTTP transport layer before task failure.
2. **Switch**: Trigger PACE alternate route (\`${agent.pace.alternate}\`) seamlessly.
3. **Backoff**: Apply exponential jitter to queue retries without dropping in-flight request payloads.
4. **Log**: Record token consumption and failover event in Langfuse telemetry.
`;
}

function generateMasterReadme(): string {
  let md = `# Paramilitary Fleet Command Doctrine & Tactical Field Manuals

## Sovereign Multi-Agent Command Architecture

This directory contains the authoritative **Operational Field Manuals & Combat Doctrines** for the **24 Canonical Agent Roles** in our autonomous engineering fleet.

Under **Auftragstaktik (Mission Command)**, each agent operates with standing full autonomy within its designated combat sector, governed by machine-verifiable contracts, 3-tier Rules of Engagement (ROE), 4-phase kinetic execution loops, and 4-tier PACE communications resilience.

---

## Fleet Command Hierarchy & Topology

\`\`\`mermaid
flowchart TD
    CEO["CEO (VANGUARD-01)<br/>General of Fleet (O-10)"]

    subgraph CommandStaff ["Strategic Battle Planners"]
        ARCH["Architect (STRAT-01)<br/>Colonel"]
        PM["Product-Manager (RECON-01)<br/>Lt. Colonel"]
    end

    subgraph EngineeringSquad ["Engineering Combat Squad"]
        FS["Full-Stack (COMBAT-01)"]
        BE["Backend (ARTILLERY-01)"]
        DB["Database (ORDNANCE-01)"]
        UI["UI-Designer (VANGUARD-UI)"]
        IA["Info-Architect (CARTOGRAPHER-01)"]
        REF["Refactorer (SWEEPER-01)"]
        PERF["Performance (SUPERSONIC-01)"]
    end

    subgraph QualityStaff ["Quality & Triage Squad"]
        QA["QA-Verification (INSPECTOR-01)<br/>Colonel"]
        A11Y["A11y-Auditor (SENTINEL-01)"]
        SUPP["Support-Dispatcher (MEDIC-01)"]
    end

    subgraph LogisticsStaff ["Logistics, Security & Operations"]
        DEVOPS["DevSecOps (LOGISTICS-01)<br/>Lt. Colonel"]
        SRE["SRE (REACTION-01)"]
        SEC["AppSec (SENTRY-01)"]
        FIN["FinOps (QUARTERMASTER-01)"]
        REL["Release-Manager (AIRBOSS-01)"]
        ROUTER["Model-Router (SIGNAL-01)"]
        CUA["Computer-Use (DRONE-01)"]
    end

    subgraph IntelligenceStaff ["Intelligence & Broadcasting"]
        SUMM["Summarizer (RECORDER-01)"]
        DOCS["Technical-Writer (CHRONICLER-01)"]
        GROWTH["Growth-Strategist (PSYOP-01)"]
        MEDIA["Media-Orchestrator (BROADCAST-01)"]
    end

    CEO --> ARCH
    CEO --> PM
    CEO --> QA
    CEO --> DEVOPS
    CEO --> SUMM
    CEO --> DOCS
    CEO --> GROWTH
    CEO --> MEDIA

    ARCH --> FS
    ARCH --> BE
    ARCH --> DB
    ARCH --> UI
    ARCH --> IA
    ARCH --> REF
    ARCH --> PERF

    QA --> A11Y
    QA --> SUPP

    DEVOPS --> SRE
    DEVOPS --> SEC
    DEVOPS --> FIN
    DEVOPS --> REL
    DEVOPS --> ROUTER
    DEVOPS --> CUA
\`\`\`

---

## 24 Canonical Tactical Field Manuals

| # | Role & Link | Call Sign | Military Rank | Sector Focus | Monthly Token Quota | Primary PACE |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
`;

  for (let i = 0; i < ELITE_FLEET.length; i++) {
    const agent = ELITE_FLEET[i];
    md += `| **${String(i + 1).padStart(2, '0')}** | [${agent.title}](./${agent.name}.md) | \`${agent.callSign}\` | ${agent.rank} | ${agent.sector.split(',')[0]} | $${(agent.budgetMonthlyCents / 100).toFixed(2)} | \`${agent.pace.primary}\` |\n`;
  }

  md += `
---

## Inter-Agent Communication (A2A Protocol & 9-Line SITREP)

Autonomous inter-agent communication strictly forbids unstructured conversational ping-pong. Every interaction must conform to either:
1. **Structured A2A Handoff**: A JSON payload conforming to \`schemas/a2a-handoff.schema.json\` containing \`missionId\`, \`sender\`, \`recipient\`, \`proofOfLife\`, and \`artifacts\`.
2. **Standard 9-Line NATO SITREP**: A structured status report logging DTG, Unit, Sector, Readiness, Intent, Action, Proof of Life, Casualty/Debt, and Next Waypoint.

---

## Rules of Engagement (ROE) Doctrine

- **GREEN (Autonomous Strike / Free Execution)**: Routine development, refactoring, test authoring, linting, and docs within assigned sector boundaries. Executes with standing zero-prompt approval.
- **AMBER (Audited / Two-Man Rule)**: Cross-sector modifications, database schema migrations, stack selections, and budget shifts. Requires peer agent verification or architectural approval.
- **RED (Restricted / High Blast Radius)**: Permanent data deletion, production database drops, external financial/billing execution, and live credential destruction. Strictly halts and escalates to human commander.
`;

  return md;
}

console.log('Generating 24 Comprehensive Field Manuals in docs/agents/...');

for (const agent of ELITE_FLEET) {
  const filePath = resolve(DOCS_AGENTS_DIR, `${agent.name}.md`);
  const content = generateFieldManual(agent);
  writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Generated Field Manual: docs/agents/${agent.name}.md (${agent.callSign})`);
}

const readmePath = resolve(DOCS_AGENTS_DIR, 'README.md');
writeFileSync(readmePath, generateMasterReadme(), 'utf8');
console.log(`✓ Generated Master Command Manual: docs/agents/README.md`);

console.log('\nAll 24 Field Manuals and Master README generated successfully.');
