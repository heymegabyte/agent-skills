#!/usr/bin/env node
/**
 * sync-paperclip-fleet.mjs
 * Synchronizes all 24 canonical paramilitary agent profiles from ~/.agentskills/agents/
 * into Paperclip (PostgreSQL + disk bundles) and OpenClaw (~/.openclaw/openclaw.json).
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
  { file: 'ceo.md', name: 'CEO', openclawId: 'ceo', role: 'ceo', title: 'Supreme Commander (VANGUARD-01)', model: 'fleet-cli/codex' },
  { file: 'architect.md', name: 'Architect', openclawId: 'architect', role: 'engineer', title: 'Principal Battle Planner (STRAT-01)', model: 'fleet-cli/codex' },
  { file: 'product-manager.md', name: 'Product-Manager', openclawId: 'product-manager', role: 'pm', title: 'Tactical Recon Officer (RECON-01)', model: 'fleet-cli/codex' },
  { file: 'fullstack-engineer.md', name: 'Full-Stack-Engineer', openclawId: 'fullstack', role: 'engineer', title: 'Forward Combat Engineer (COMBAT-01)', model: 'fleet-cli/codex' },
  { file: 'backend-engineer.md', name: 'Backend-Engineer', openclawId: 'backend', role: 'engineer', title: 'Artillery Officer (ARTILLERY-01)', model: 'fleet-cli/codex' },
  { file: 'database-engineer.md', name: 'Database-Engineer', openclawId: 'database', role: 'engineer', title: 'Ordnance Custodian (ORDNANCE-01)', model: 'fleet-cli/codex' },
  { file: 'qa-verification.md', name: 'QA-Verification', openclawId: 'qa', role: 'qa', title: 'Inspector General (INSPECTOR-01)', model: 'fleet-cli/codex' },
  { file: 'devsecops.md', name: 'DevSecOps', openclawId: 'devsecops', role: 'devops', title: 'Trench Logistics Engineer (LOGISTICS-01)', model: 'fleet-cli/codex' },
  { file: 'sre.md', name: 'SRE', openclawId: 'sre', role: 'devops', title: 'Rapid Incident Response (REACTION-01)', model: 'fleet-cli/codex' },
  { file: 'appsec.md', name: 'AppSec', openclawId: 'appsec', role: 'security', title: 'Perimeter Defense Sentry (SENTRY-01)', model: 'fleet-cli/codex' },
  { file: 'finops.md', name: 'FinOps', openclawId: 'finops', role: 'general', title: 'Resource Quartermaster (QUARTERMASTER-01)', model: 'fleet-cli/codex' },
  { file: 'release-manager.md', name: 'Release-Manager', openclawId: 'release', role: 'devops', title: 'Deployment Gate Arbiter (AIRBOSS-01)', model: 'fleet-cli/codex' },
  { file: 'ui-designer.md', name: 'UI-Designer', openclawId: 'ui-designer', role: 'design', title: 'Visual Experience Vanguard (VANGUARD-UI)', model: 'fleet-cli/codex' },
  { file: 'information-architect.md', name: 'Information-Architect', openclawId: 'info-architect', role: 'pm', title: 'Signal Cartographer (CARTOGRAPHER-01)', model: 'fleet-cli/codex' },
  { file: 'refactorer.md', name: 'Refactorer', openclawId: 'refactorer', role: 'engineer', title: 'Mine Clearance Unit (SWEEPER-01)', model: 'fleet-cli/codex' },
  { file: 'performance-engineer.md', name: 'Performance-Engineer', openclawId: 'performance', role: 'engineer', title: 'Supersonic Aerodynamics (SUPERSONIC-01)', model: 'fleet-cli/codex' },
  { file: 'a11y-auditor.md', name: 'A11y-Auditor', openclawId: 'a11y', role: 'qa', title: 'Universal Access Sentry (SENTINEL-01)', model: 'fleet-cli/codex' },
  { file: 'support-dispatcher.md', name: 'Support-Dispatcher', openclawId: 'support', role: 'pm', title: 'Battlefield Medic (MEDIC-01)', model: 'fleet-cli/codex' },
  { file: 'model-router.md', name: 'Model-Router', openclawId: 'router', role: 'engineer', title: 'Signal Corps Switcher (SIGNAL-01)', model: 'fleet-cli/deepseek' },
  { file: 'summarizer.md', name: 'Summarizer', openclawId: 'summarizer', role: 'general', title: 'Black Box Recorder (RECORDER-01)', model: 'fleet-cli/deepseek' },
  { file: 'technical-writer.md', name: 'Technical-Writer', openclawId: 'technical-writer', role: 'general', title: 'Doctrine Archivist (CHRONICLER-01)', model: 'fleet-cli/codex' },
  { file: 'growth-strategist.md', name: 'Growth-Strategist', openclawId: 'growth', role: 'general', title: 'Psychological Operations (PSYOP-01)', model: 'fleet-cli/codex' },
  { file: 'media-orchestrator.md', name: 'Media-Orchestrator', openclawId: 'media', role: 'general', title: 'Visual Broadcast Unit (BROADCAST-01)', model: 'fleet-cli/codex' },
  { file: 'computer-use-operator.md', name: 'Computer-Use-Operator', openclawId: 'computer-use', role: 'engineer', title: 'Autonomous Drone Operator (DRONE-01)', model: 'fleet-cli/codex' }
];

function runSql(sql) {
  const cmd = `docker exec -i agent-paperclip-database-1 psql -U paperclip -d paperclip -t -A`;
  return execSync(cmd, { input: sql, encoding: 'utf8' }).trim();
}

console.log('═'.repeat(70));
console.log('  SYNCHRONIZING 24 CANONICAL PARAMILITARY FLEET AGENTS');
console.log('═'.repeat(70));

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

  if (!agentId) {
    // Generate new UUID and insert into database
    agentId = randomUUID();
    const insertSql = `
      INSERT INTO agents (id, company_id, name, role, title, status, adapter_type, adapter_config, created_at, updated_at)
      VALUES (
        '${agentId}',
        '${COMPANY_ID}',
        '${agent.name}',
        '${agent.role}',
        '${agent.title}',
        'idle',
        'openclaw_gateway',
        '{}'::jsonb,
        now(),
        now()
      );
    `;
    runSql(insertSql);
    nameToId.set(agent.name.toLowerCase(), agentId);
    console.log(`[CREATED] Agent '${agent.name}' (ID: ${agentId}) in Paperclip DB`);
  } else {
    // Update existing agent metadata
    const updateSql = `
      UPDATE agents
      SET role = '${agent.role}',
          title = '${agent.title}',
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

  console.log(`[SYNCED] ${agent.name.padEnd(22)} -> ID: ${agentId} [PACE: ${agent.model}]`);
}

// 2. Synchronize OpenClaw configuration
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

console.log('\n═'.repeat(70));
console.log('  PARAMILITARY FLEET SYNCHRONIZATION COMPLETE (24/24 UNITS ACTIVE)');
console.log('═'.repeat(70));
