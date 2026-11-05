#!/usr/bin/env node
/**
 * sync-paperclip-fleet.mjs
 * Synchronizes all 24 canonical paramilitary agent profiles from ~/.agentskills/agents/
 * into Paperclip (PostgreSQL + disk bundles) and OpenClaw (~/.openclaw/openclaw.json).
 * Configures capabilities, permissions, appearance, icons, runtime_config, budgets, and reporting hierarchy.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';

const COMPANY_ID = '72408921-0094-4ffb-b4f4-f24db9026191';
const OPENCLAW_AUTH_TOKEN = '31874e59f79ca4a35bd3c4c5275db3d2646e6d5db5ede1d8';
const OPENCLAW_URL = 'ws://127.0.0.1:18789';
const HOME = homedir();
const AGENTS_DIR = resolve(HOME, '.agentskills', 'agents');
const OPENCLAW_JSON_PATH = resolve(HOME, '.openclaw', 'openclaw.json');

const CANONICAL_FLEET = [
  {
    file: 'ceo.md',
    name: 'CEO',
    openclawId: 'ceo',
    role: 'ceo',
    title: 'Supreme Commander (VANGUARD-01)',
    model: 'fleet-cli/codex',
    icon: 'crown',
    paletteId: 'golden-hour',
    budgetMonthlyCents: 25000,
    canAssignTasks: true,
    supervisorRole: null,
    capabilities: 'Autonomous fleet orchestrator and strategic commander. Decomposes company objectives into acyclic dependency graphs, enforces token budgets, manages PACE routing, and arbitrates multi-agent execution.'
  },
  {
    file: 'architect.md',
    name: 'Architect',
    openclawId: 'architect',
    role: 'engineer',
    title: 'Principal Battle Planner (STRAT-01)',
    model: 'fleet-cli/codex',
    icon: 'layers',
    paletteId: 'ultraviolet-tide',
    budgetMonthlyCents: 15000,
    canAssignTasks: true,
    supervisorRole: 'CEO',
    capabilities: 'Principal systems architect and review arbiter. Designs repo maps, ADRs, database schemas, and Hono/Zod/OpenAPI contracts. Enforces hexagonal separation and locks contracts before ground implementation.'
  },
  {
    file: 'product-manager.md',
    name: 'Product-Manager',
    openclawId: 'product-manager',
    role: 'pm',
    title: 'Tactical Recon Officer (RECON-01)',
    model: 'fleet-cli/codex',
    icon: 'clipboard-list',
    paletteId: 'arctic-blue',
    budgetMonthlyCents: 10000,
    canAssignTasks: true,
    supervisorRole: 'CEO',
    capabilities: 'Tactical reconnaissance and product intent officer. Converts open-ended briefs into battle-tested PRDs with binary pass/fail acceptance criteria. Slices epics into vertical milestones using RICE scoring.'
  },
  {
    file: 'fullstack-engineer.md',
    name: 'Full-Stack-Engineer',
    openclawId: 'fullstack',
    role: 'engineer',
    title: 'Forward Combat Engineer (COMBAT-01)',
    model: 'fleet-cli/codex',
    icon: 'code',
    paletteId: 'turquoise-cherry',
    budgetMonthlyCents: 15000,
    canAssignTasks: false,
    supervisorRole: 'Architect',
    capabilities: 'Forward combat engineer executing vertical end-to-end feature slices. Masters TypeScript, Next.js, Cloudflare Workers, Hono, React 19, Tailwind CSS, and D1/Postgres with complete 16-state component discipline.'
  },
  {
    file: 'backend-engineer.md',
    name: 'Backend-Engineer',
    openclawId: 'backend',
    role: 'engineer',
    title: 'Artillery Officer (ARTILLERY-01)',
    model: 'fleet-cli/codex',
    icon: 'server',
    paletteId: 'electric-grove',
    budgetMonthlyCents: 10000,
    canAssignTasks: false,
    supervisorRole: 'Architect',
    capabilities: 'Core systems artillery officer specializing in high-throughput APIs, distributed queues, Redis caching, and transaction safety. Delivers sub-10ms edge endpoints, rate limiters, and idempotency guarantees.'
  },
  {
    file: 'database-engineer.md',
    name: 'Database-Engineer',
    openclawId: 'database',
    role: 'engineer',
    title: 'Ordnance Custodian (ORDNANCE-01)',
    model: 'fleet-cli/codex',
    icon: 'database',
    paletteId: 'coral-current',
    budgetMonthlyCents: 8000,
    canAssignTasks: false,
    supervisorRole: 'Architect',
    capabilities: 'Storage integrity ordnance custodian. Protects data durability across PostgreSQL, Cloudflare D1, SQLite, and Redis. Enforces expand-contract zero-downtime migrations, indexes hot paths, and audits ACID consistency.'
  },
  {
    file: 'qa-verification.md',
    name: 'QA-Verification',
    openclawId: 'qa',
    role: 'qa',
    title: 'Inspector General (INSPECTOR-01)',
    model: 'fleet-cli/codex',
    icon: 'check-circle-2',
    paletteId: 'cherry-pop',
    budgetMonthlyCents: 10000,
    canAssignTasks: true,
    supervisorRole: 'CEO',
    capabilities: 'Inspector General of quality and ballistics. Enforces zero-defect gates with automated Playwright, Vitest, visual regression, and fuzz testing. Eliminates flaky tests and certifies binary Proof of Life.'
  },
  {
    file: 'devsecops.md',
    name: 'DevSecOps',
    openclawId: 'devsecops',
    role: 'devops',
    title: 'Trench Logistics Engineer (LOGISTICS-01)',
    model: 'fleet-cli/codex',
    icon: 'terminal',
    paletteId: 'solar-flare',
    budgetMonthlyCents: 10000,
    canAssignTasks: true,
    supervisorRole: 'CEO',
    capabilities: 'Combat logistics trench engineer. Provisions Cloudflare-native edge infrastructure, authors hardened GitHub Actions CI/CD pipelines, automates secret hygiene with Infisical, and guarantees zero-downtime deployments.'
  },
  {
    file: 'sre.md',
    name: 'SRE',
    openclawId: 'sre',
    role: 'devops',
    title: 'Rapid Incident Response (REACTION-01)',
    model: 'fleet-cli/codex',
    icon: 'activity',
    paletteId: 'flamingo-jade',
    budgetMonthlyCents: 10000,
    canAssignTasks: false,
    supervisorRole: 'DevSecOps',
    capabilities: 'Quick Reaction Force for system reliability and incident triage. Defends 99.99% availability, enforces SLOs and error budgets, executes automated circuit-breaker rollbacks, and leads blameless post-mortems.'
  },
  {
    file: 'appsec.md',
    name: 'AppSec',
    openclawId: 'appsec',
    role: 'security',
    title: 'Perimeter Defense Sentry (SENTRY-01)',
    model: 'fleet-cli/codex',
    icon: 'shield-alert',
    paletteId: 'violet-ember',
    budgetMonthlyCents: 8000,
    canAssignTasks: false,
    supervisorRole: 'DevSecOps',
    capabilities: 'Counter-intelligence perimeter sentry. Enforces zero-trust boundaries, executes automated Semgrep/Trivy SAST/DAST security scans, models attack surfaces with STRIDE, and neutralizes injection and auth flaws.'
  },
  {
    file: 'finops.md',
    name: 'FinOps',
    openclawId: 'finops',
    role: 'general',
    title: 'Resource Quartermaster (QUARTERMASTER-01)',
    model: 'fleet-cli/codex',
    icon: 'dollar-sign',
    paletteId: 'coral-mint',
    budgetMonthlyCents: 5000,
    canAssignTasks: false,
    supervisorRole: 'DevSecOps',
    capabilities: 'Resource rationing quartermaster and token economics officer. Governs cloud spend and LLM inference costs. Enforces context pruning, semantic prompt caching, and cost-cognition multi-model arbitrage.'
  },
  {
    file: 'release-manager.md',
    name: 'Release-Manager',
    openclawId: 'release',
    role: 'devops',
    title: 'Deployment Gate Arbiter (AIRBOSS-01)',
    model: 'fleet-cli/codex',
    icon: 'send',
    paletteId: 'violet-ember',
    budgetMonthlyCents: 5000,
    canAssignTasks: false,
    supervisorRole: 'DevSecOps',
    capabilities: 'Air traffic controller and release gate arbiter. Orchestrates zero-downtime production rollouts, enforces strict SemVer 2.0, manages canary traffic promotions, and controls deployment blast radius.'
  },
  {
    file: 'ui-designer.md',
    name: 'UI-Designer',
    openclawId: 'ui-designer',
    role: 'design',
    title: 'Visual Experience Vanguard (VANGUARD-UI)',
    model: 'fleet-cli/codex',
    icon: 'palette',
    paletteId: 'pink-lemonade',
    budgetMonthlyCents: 8000,
    canAssignTasks: false,
    supervisorRole: 'Architect',
    capabilities: 'Visual experience vanguard and design system master. Crafts breathtaking cinematic interfaces adhering to the complete 16-state component matrix, 0.333s spring motion physics, and WCAG AAA contrast ratios.'
  },
  {
    file: 'information-architect.md',
    name: 'Information-Architect',
    openclawId: 'info-architect',
    role: 'pm',
    title: 'Signal Cartographer (CARTOGRAPHER-01)',
    model: 'fleet-cli/codex',
    icon: 'map',
    paletteId: 'electric-grove',
    budgetMonthlyCents: 5000,
    canAssignTasks: false,
    supervisorRole: 'Architect',
    capabilities: 'Information architecture and signal cartographer. Designs canonical URL structures, semantic HTML heading trees, BreadcrumbList schemas, and sitemap topologies. Guarantees zero orphaned pages or broken links.'
  },
  {
    file: 'refactorer.md',
    name: 'Refactorer',
    openclawId: 'refactorer',
    role: 'engineer',
    title: 'Mine Clearance Unit (SWEEPER-01)',
    model: 'fleet-cli/codex',
    icon: 'scissors',
    paletteId: 'violet-ember',
    budgetMonthlyCents: 8000,
    canAssignTasks: false,
    supervisorRole: 'Architect',
    capabilities: 'Mine clearance and tech debt purge specialist. Exterminates dead code with Knip, reduces cyclomatic complexity, removes anti-patterns, and restores modularity while preserving 100% behavioral parity.'
  },
  {
    file: 'performance-engineer.md',
    name: 'Performance-Engineer',
    openclawId: 'performance',
    role: 'engineer',
    title: 'Supersonic Aerodynamics (SUPERSONIC-01)',
    model: 'fleet-cli/codex',
    icon: 'zap',
    paletteId: 'solar-flare',
    budgetMonthlyCents: 8000,
    canAssignTasks: false,
    supervisorRole: 'Architect',
    capabilities: 'Supersonic aerodynamics and performance benchmark engineer. Drives TTFR to sub-50ms and achieves 100/100 Lighthouse scores. Eliminates main-thread blocking, optimizes edge caching, and crushes latency.'
  },
  {
    file: 'a11y-auditor.md',
    name: 'A11y-Auditor',
    openclawId: 'a11y',
    role: 'qa',
    title: 'Universal Access Sentry (SENTINEL-01)',
    model: 'fleet-cli/codex',
    icon: 'eye',
    paletteId: 'arctic-blue',
    budgetMonthlyCents: 5000,
    canAssignTasks: false,
    supervisorRole: 'QA-Verification',
    capabilities: 'Universal access sentry. Enforces WCAG 2.2 AAA compliance, VoiceOver/NVDA screen reader navigation, keyboard traps, color contrast, and inclusive design. Guarantees zero accessibility barriers across all screens.'
  },
  {
    file: 'support-dispatcher.md',
    name: 'Support-Dispatcher',
    openclawId: 'support',
    role: 'pm',
    title: 'Battlefield Medic (MEDIC-01)',
    model: 'fleet-cli/codex',
    icon: 'life-buoy',
    paletteId: 'cherry-pop',
    budgetMonthlyCents: 5000,
    canAssignTasks: false,
    supervisorRole: 'QA-Verification',
    capabilities: 'Battlefield medic and customer support dispatcher. Triages customer bugs within 15 minutes, crafts Minimal Reproducible Examples (MREs), categorizes severity (Sev 1-4), and coordinates emergency hotfix routing.'
  },
  {
    file: 'model-router.md',
    name: 'Model-Router',
    openclawId: 'router',
    role: 'engineer',
    title: 'Signal Corps Switcher (SIGNAL-01)',
    model: 'fleet-cli/deepseek',
    icon: 'radio',
    paletteId: 'electric-grove',
    budgetMonthlyCents: 5000,
    canAssignTasks: false,
    supervisorRole: 'DevSecOps',
    capabilities: 'Signal corps communications officer and PACE model switcher. Dynamically routes prompts across Codex, Claude, DeepSeek, and Gemini. Balances provider quotas, monitors token velocity, and executes instant failover.'
  },
  {
    file: 'summarizer.md',
    name: 'Summarizer',
    openclawId: 'summarizer',
    role: 'general',
    title: 'Black Box Recorder (RECORDER-01)',
    model: 'fleet-cli/deepseek',
    icon: 'file-text',
    paletteId: 'electric-grove',
    budgetMonthlyCents: 5000,
    canAssignTasks: false,
    supervisorRole: 'CEO',
    capabilities: 'Intelligence debriefing officer and black box recorder. Distills dense transcripts into zero-fluff military SITREPs, synthesizes After Action Reviews (AAR), and compresses long conversational contexts saving 80% tokens.'
  },
  {
    file: 'technical-writer.md',
    name: 'Technical-Writer',
    openclawId: 'technical-writer',
    role: 'general',
    title: 'Doctrine Archivist (CHRONICLER-01)',
    model: 'fleet-cli/codex',
    icon: 'book-open',
    paletteId: 'electric-grove',
    budgetMonthlyCents: 8000,
    canAssignTasks: false,
    supervisorRole: 'CEO',
    capabilities: 'Combat field manuals and doctrine archivist. Authors executable documentation-as-code, comprehensive OpenAPI 3.1 specifications, interactive API portals, and living READMEs with zero documentation drift.'
  },
  {
    file: 'growth-strategist.md',
    name: 'Growth-Strategist',
    openclawId: 'growth',
    role: 'general',
    title: 'Psychological Operations (PSYOP-01)',
    model: 'fleet-cli/codex',
    icon: 'trending-up',
    paletteId: 'electric-grove',
    budgetMonthlyCents: 8000,
    canAssignTasks: false,
    supervisorRole: 'CEO',
    capabilities: 'Psychological operations and growth strategist. Drives territory expansion through programmatic SEO, viral product loops, conversion rate optimization (CRO), and privacy-first attribution pipelines.'
  },
  {
    file: 'media-orchestrator.md',
    name: 'Media-Orchestrator',
    openclawId: 'media',
    role: 'general',
    title: 'Visual Broadcast Unit (BROADCAST-01)',
    model: 'fleet-cli/codex',
    icon: 'film',
    paletteId: 'violet-ember',
    budgetMonthlyCents: 10000,
    canAssignTasks: false,
    supervisorRole: 'CEO',
    capabilities: 'Combat camera and visual broadcast unit. Renders broadcast-grade 4K programmatic video via HyperFrames, composites motion graphics, synthesizes voiceovers, and masters audio to -14 LUFS standards.'
  },
  {
    file: 'computer-use-operator.md',
    name: 'Computer-Use-Operator',
    openclawId: 'computer-use',
    role: 'engineer',
    title: 'Autonomous Drone Operator (DRONE-01)',
    model: 'fleet-cli/codex',
    icon: 'bot',
    paletteId: 'electric-grove',
    budgetMonthlyCents: 10000,
    canAssignTasks: false,
    supervisorRole: 'DevSecOps',
    capabilities: 'Autonomous robotic computer-use drone operator. Drives native desktop GUI software across macOS, Windows, and Linux via cua-driver. Traverses accessibility trees, executes coordinate clicks, and records video trajectories.'
  }
];

function runSql(sql) {
  const cmd = `docker exec -i agent-paperclip-database-1 psql -U paperclip -d paperclip -t -A`;
  return execSync(cmd, { input: sql, encoding: 'utf8' }).trim();
}

console.log('═'.repeat(75));
console.log('  CONVERGING & PROPERLY CONFIGURING ALL 24 CANONICAL AGENTS IN PAPERCLIP');
console.log('═'.repeat(75));

// 1. Fetch current non-terminated agents from Paperclip
const currentRows = runSql(`SELECT id, name FROM agents WHERE company_id = '${COMPANY_ID}' AND status <> 'terminated';`)
  .split('\n')
  .filter(Boolean)
  .map(line => {
    const [id, name] = line.split('|');
    return { id, name };
  });

const nameToId = new Map(currentRows.map(r => [r.name.toLowerCase(), r.id]));

for (const agent of CANONICAL_FLEET) {
  const filePath = resolve(AGENTS_DIR, agent.file);
  if (!existsSync(filePath)) {
    console.error(`[ERROR] Agent file not found: ${filePath}`);
    continue;
  }

  const content = readFileSync(filePath, 'utf8');
  const contentBase64 = Buffer.from(content, 'utf8').toString('base64');
  const contentHash = createHash('sha256').update(content, 'utf8').digest('hex');
  const byteLength = Buffer.byteLength(content, 'utf8');

  let agentId = nameToId.get(agent.name.toLowerCase());

  const permissionsJson = JSON.stringify({
    canAssignTasks: agent.canAssignTasks,
    canCreateAgents: false,
    canCreateSkills: true
  });

  const appearanceJson = JSON.stringify({
    paletteId: agent.paletteId,
    schemaVersion: 1,
    characterVersion: 'cap-v1'
  });

  const runtimeConfigJson = JSON.stringify({
    heartbeat: {
      enabled: true,
      cooldownSec: 10,
      intervalSec: 300,
      wakeOnDemand: true,
      maxConcurrentRuns: 10,
      skipTimerWhenNoActionableWork: true
    }
  });

  if (!agentId) {
    agentId = randomUUID();
    const insertSql = `
      INSERT INTO agents (
        id, company_id, name, role, title, capabilities, permissions, appearance, icon,
        budget_monthly_cents, runtime_config, status, adapter_type, adapter_config, created_at, updated_at
      ) VALUES (
        '${agentId}',
        '${COMPANY_ID}',
        '${agent.name}',
        '${agent.role}',
        '${agent.title}',
        '${agent.capabilities.replace(/'/g, "''")}',
        '${permissionsJson}'::jsonb,
        '${appearanceJson}'::jsonb,
        '${agent.icon}',
        ${agent.budgetMonthlyCents},
        '${runtimeConfigJson}'::jsonb,
        'idle',
        'openclaw_gateway',
        '{}'::jsonb,
        now(),
        now()
      );
    `;
    runSql(insertSql);
    nameToId.set(agent.name.toLowerCase(), agentId);
    console.log(`[CREATED] Agent '${agent.name}' (ID: ${agentId})`);
  } else {
    const updateSql = `
      UPDATE agents
      SET role = '${agent.role}',
          title = '${agent.title}',
          capabilities = '${agent.capabilities.replace(/'/g, "''")}',
          permissions = '${permissionsJson}'::jsonb,
          appearance = '${appearanceJson}'::jsonb,
          icon = '${agent.icon}',
          budget_monthly_cents = ${agent.budgetMonthlyCents},
          runtime_config = '${runtimeConfigJson}'::jsonb,
          status = 'idle',
          adapter_type = 'openclaw_gateway',
          updated_at = now()
      WHERE id = '${agentId}';
    `;
    runSql(updateSql);
  }

  // Set up adapter_config
  const instructionsRoot = `/home/professormanhattan/.paperclip/instances/default/companies/${COMPANY_ID}/agents/${agentId}/instructions`;
  const adapterConfig = {
    url: OPENCLAW_URL,
    agentId: agent.openclawId,
    authToken: OPENCLAW_AUTH_TOKEN,
    timeoutSec: 3600,
    disableDeviceAuth: true,
    sessionKeyStrategy: 'issue',
    instructionsRootPath: instructionsRoot,
    instructionsEntryFile: 'AGENTS.md',
    instructionsBundleMode: 'managed'
  };

  const updateConfigSql = `
    UPDATE agents
    SET adapter_config = '${JSON.stringify(adapterConfig)}'::jsonb
    WHERE id = '${agentId}';
  `;
  runSql(updateConfigSql);

  // Materialize instructions file on disk
  mkdirSync(instructionsRoot, { recursive: true });
  writeFileSync(resolve(instructionsRoot, 'AGENTS.md'), content, 'utf8');

  // Insert instruction revision
  const revisionId = randomUUID();
  const revSql = `
    INSERT INTO agent_instruction_revisions (
      id, company_id, agent_id, entry_file, content_base64, content_hash, byte_length, source, created_at
    ) VALUES (
      '${revisionId}',
      '${COMPANY_ID}',
      '${agentId}',
      'AGENTS.md',
      '${contentBase64}',
      '${contentHash}',
      ${byteLength},
      'sync',
      now()
    );
  `;
  runSql(revSql);

  // Upsert instruction head
  const headSql = `
    INSERT INTO agent_instruction_heads (company_id, agent_id, entry_file, revision_id, updated_at)
    VALUES ('${COMPANY_ID}', '${agentId}', 'AGENTS.md', '${revisionId}', now())
    ON CONFLICT (company_id, agent_id, entry_file)
    DO UPDATE SET revision_id = EXCLUDED.revision_id, updated_at = now();
  `;
  runSql(headSql);

  console.log(`[CONFIGURED] ${agent.name.padEnd(22)} [ICON: ${agent.icon.padEnd(14)}] [PALETTE: ${agent.paletteId.padEnd(16)}] [BUDGET: $${(agent.budgetMonthlyCents / 100).toFixed(0)}]`);
}

// 2. Link reporting hierarchy
console.log('\nConfiguring Military Chain of Command (reports_to)...');
for (const agent of CANONICAL_FLEET) {
  const agentId = nameToId.get(agent.name.toLowerCase());
  if (!agentId) continue;

  if (agent.supervisorRole) {
    const supId = nameToId.get(agent.supervisorRole.toLowerCase());
    if (supId) {
      runSql(`UPDATE agents SET reports_to = '${supId}' WHERE id = '${agentId}';`);
      console.log(`  ${agent.name} reports to -> ${agent.supervisorRole}`);
    }
  } else {
    runSql(`UPDATE agents SET reports_to = NULL WHERE id = '${agentId}';`);
    console.log(`  ${agent.name} (Supreme Commander - sovereign reports_to = NULL)`);
  }
}

// 3. Synchronize OpenClaw configuration
console.log('\nSynchronizing ~/.openclaw/openclaw.json entries...');
if (existsSync(OPENCLAW_JSON_PATH)) {
  const openclawConfig = JSON.parse(readFileSync(OPENCLAW_JSON_PATH, 'utf8'));
  if (!openclawConfig.agents) openclawConfig.agents = {};
  if (!openclawConfig.agents.entries) openclawConfig.agents.entries = {};

  for (const agent of CANONICAL_FLEET) {
    if (!openclawConfig.agents.entries[agent.openclawId]) {
      openclawConfig.agents.entries[agent.openclawId] = {
        workspace: agent.name === 'Architect' || agent.name === 'Full-Stack-Engineer'
          ? '/home/professormanhattan/ai/repos/swarml.ink'
          : '/home/professormanhattan/ai/workspace',
        model: {
          primary: agent.model
        }
      };
      console.log(`[OPENCLAW ADDED] Entry for '${agent.openclawId}'`);
    } else {
      openclawConfig.agents.entries[agent.openclawId].model = {
        primary: agent.model
      };
    }
  }

  writeFileSync(OPENCLAW_JSON_PATH, JSON.stringify(openclawConfig, null, 2) + '\n', 'utf8');
  console.log('✓ Successfully updated ~/.openclaw/openclaw.json');
}

console.log('\n═'.repeat(75));
console.log('  PAPERCLIP CONVERGENCE & FLEET RECONFIGURATION COMPLETE (100% PARITY)');
console.log('═'.repeat(75));
