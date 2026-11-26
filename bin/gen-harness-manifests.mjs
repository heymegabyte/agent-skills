#!/usr/bin/env node
/**
 * gen-harness-manifests.mjs
 *
 * Generates companion harness manifests from the canonical agentskills source of truth.
 * Emits: .codex-plugin/plugin.json, .opencode/config.json, .kimi-plugin/plugin.json
 *
 * Source of truth: NN-*\/SKILL.md (frontmatter) + rules/*.md + .claude-plugin/plugin.json
 * Never edit the output files directly — re-run this script instead.
 *
 * @see reference/multi-harness-portability.md
 *
 * @example
 * node bin/gen-harness-manifests.mjs
 * # → writes 3 manifest files relative to the repo root
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

export const PUBLISH_INSTRUCTION_TARGETS = [
  'AGENTS.md', '.cursorrules', '.windsurfrules', '.clinerules', 'GEMINI.md',
  'CLAUDE.md',
  '.github/copilot-instructions.md', '.amazonq/rules/cloudflare-workers-hono-angular-saas.md',
  '.rules', '.junie/guidelines.md', '.augment-guidelines', '.aider-conventions.md',
  'AMP.md', 'CODEX.md', '.trae/rules/project_rules.md',
  '.tabnine/guidelines/guidelines.md', '.kilo/rules/cloudflare-workers-hono-angular-saas.md',
  '.roo/rules/cloudflare-workers-hono-angular-saas.md',
  '.continue/rules/cloudflare-workers-hono-angular-saas.md', 'replit.md',
  '.cursor/rules/emdash-skills.mdc', '.windsurf/rules/emdash-skills.md',
  '.augment/rules/emdash-skills.md', '.github/instructions/emdash-skills.instructions.md',
  '.openhands/microagents/repo.md', '.aiassistant/rules/emdash-skills.md',
  '.kiro/steering/emdash-skills.md', '.void/rules/emdash-skills.md', 'QODO.MD',
  '.bolt/promptfile', '.cursor/BUGBOT.md', '.devin/skills/emdash/SKILL.md',
];

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

async function projectPublishInstructions(mode) {
  const sourceRoot = argumentValue('--source-root');
  const expectedRevision = argumentValue('--expected-revision');
  if (!sourceRoot || !expectedRevision) {
    console.error('gen-harness-manifests: --source-root and --expected-revision are required for --publish-instructions');
    process.exit(1);
  }
  const selectedRoot = resolve(sourceRoot);
  const canonical = join(selectedRoot, 'policies', 'operational-prompt-hydration.md');
  const generator = await import(new URL('./manage-policy-blocks.ts', import.meta.url));
  generator.verifySourceRevision(selectedRoot, expectedRevision);
  const canonicalContent = readFileSync(canonical, 'utf8');
  const policySourceRevision = generator.canonicalSourceRevision(canonicalContent);
  const receipts = [];
  for (const relativeTarget of PUBLISH_INSTRUCTION_TARGETS) {
    const target = join(selectedRoot, relativeTarget);
    if (!existsSync(target)) {
      console.error(`gen-harness-manifests: publish target is missing: ${relativeTarget}`);
      process.exit(1);
    }
    const targetContent = readFileSync(target, 'utf8');
    const projection = mode === 'check'
      ? generator.checkManagedPolicy(targetContent, canonicalContent, policySourceRevision)
      : generator.projectManagedPolicy(targetContent, canonicalContent, policySourceRevision);
    if (mode === 'install') writeFileSync(target, projection.content);
    receipts.push({
      target: relativeTarget,
      changed: projection.changed,
      policyId: projection.metadata.policyId,
      version: projection.metadata.version,
      digest: `sha256:${projection.metadata.digest}`,
      sourceRevision: projection.metadata.sourceRevision,
    });
  }
  if (process.argv.includes('--json')) process.stdout.write(`${JSON.stringify({ ok: true, mode, expectedRevision, policySourceRevision, targets: receipts })}\n`);
  else console.log(`gen-harness-manifests: ${mode === 'check' ? 'verified' : 'projected'} canonical policy ${mode === 'check' ? 'across' : 'into'} ${receipts.length} instruction targets at ${expectedRevision}`);
}

if (process.argv.includes('--publish-instructions') || process.argv.includes('--check-publish-instructions')) {
  await projectPublishInstructions(process.argv.includes('--check-publish-instructions') ? 'check' : 'install');
  process.exit(0);
}

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Parse YAML-like frontmatter from a SKILL.md file.
 * Returns { name, description } extracted from the leading --- block.
 *
 * @param {string} src - Raw file contents.
 * @returns {{ name: string; description: string }}
 */
function parseFrontmatter(src) {
  const match = src.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { name: '', description: '' };
  const block = match[1];
  const nameMatch = block.match(/^name:\s*["']?([^"'\n]+)["']?$/m);
  const descMatch = block.match(/^description:\s*["']?([\s\S]*?)["']?(?=\n\w|\n$|$)/m);
  return {
    name: nameMatch ? nameMatch[1].trim() : '',
    description: descMatch ? descMatch[1].trim().replace(/\n\s+/g, ' ') : '',
  };
}

/**
 * Read the version string from .claude-plugin/plugin.json.
 *
 * @param {string} root - Repo root path.
 * @returns {string}
 */
function readVersion(root) {
  const pluginPath = join(root, '.claude-plugin', 'plugin.json');
  if (!existsSync(pluginPath)) return '1.0.0';
  const data = JSON.parse(readFileSync(pluginPath, 'utf8'));
  return data.version ?? '1.0.0';
}

/**
 * Discover all canonical numbered skills plus approved named skills.
 *
 * @param {string} root - Repo root path.
 * @returns {Array<{ dir: string; path: string; name: string; description: string }>}
 */
function discoverSkills(root) {
  const entries = readdirSync(root, { withFileTypes: true });
  const skills = [];
  const approvedNamedSkills = new Set(['openclaw-integration', 'mcp-estate-control-plane']);
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!/^\d{2}-/.test(entry.name) && !approvedNamedSkills.has(entry.name)) continue;
    const skillPath = join(root, entry.name, 'SKILL.md');
    if (!existsSync(skillPath)) continue;
    const src = readFileSync(skillPath, 'utf8');
    const { name, description } = parseFrontmatter(src);
    skills.push({ dir: entry.name, path: `${entry.name}/SKILL.md`, name, description });
  }
  skills.sort((a, b) => a.dir.localeCompare(b.dir));
  return skills;
}

/**
 * Discover all .md files in rules/ (excluding subdirectories).
 *
 * @param {string} root - Repo root path.
 * @returns {string[]} Relative paths like "rules/always.md"
 */
function discoverRules(root) {
  const rulesDir = join(root, 'rules');
  if (!existsSync(rulesDir)) return [];
  const entries = readdirSync(rulesDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => `rules/${e.name}`)
    .sort();
}

/**
 * Write JSON to a file, creating parent directories as needed.
 *
 * @param {string} filePath - Absolute path to write.
 * @param {unknown} data - Data to serialize as formatted JSON.
 * @returns {void}
 */
function writeJson(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ─── always-load rules (harness-neutral subset) ─────────────────────────────

/** Rules to always include in every harness manifest (ordered by priority). */
const ALWAYS_LOAD_RULES = [
  'rules/always.md',
  'rules/evidence-gated-autonomous-orchestration.md',
  'rules/autonomous-mission-policy.md',
  'rules/autonomous-engineering.md',
  'rules/code-style.md',
  'rules/feature-flags.md',
  'rules/brian-preferences.md',
  'rules/solo-builder-doctrine.md',
  'rules/main-only-branch.md',
  'rules/no-staging-doctrine.md',
  'rules/zod-everywhere.md',
  'rules/fetch-defaults.md',
  'rules/model-routing.md',
  'rules/agent-neutrality.md',
  'rules/verification-loop.md',
  'rules/prompt-as-training-signal.md',
  'rules/intent-complete-delivery.md',
  'rules/context-hydration.md',
  'rules/production-delivery-closure.md',
  'rules/greenfield-saas-prompt-hydration.md',
  'rules/parallel-multi-swarm-orchestration.md',
  'rules/total-convergence-and-openspec-handoff.md',
];

// ─── main ────────────────────────────────────────────────────────────────────

const version = readVersion(ROOT);
const skills = discoverSkills(ROOT);
if (process.argv.includes('--list-skill-paths')) {
  for (const skill of skills) console.log(skill.path);
  process.exit(0);
}
const allRules = discoverRules(ROOT);
const canonicalPolicySource = 'policies/operational-prompt-hydration.md';
const canonicalPolicy = readFileSync(join(ROOT, canonicalPolicySource), 'utf8');
const canonicalPolicyMetadata = {
  id: canonicalPolicy.match(/^policy_id:\s*([^\n]+)$/m)?.[1]?.trim(),
  version: canonicalPolicy.match(/^policy_version:\s*([^\n]+)$/m)?.[1]?.trim(),
  source: canonicalPolicySource,
  source_digest: `sha256:${createHash('sha256').update(canonicalPolicy).digest('hex')}`,
};
if (!canonicalPolicyMetadata.id || !canonicalPolicyMetadata.version) {
  throw new Error(`${canonicalPolicySource} requires policy_id and policy_version`);
}

// Filter always-load rules to only those actually present on disk
const alwaysLoadRules = ALWAYS_LOAD_RULES.filter((r) => allRules.includes(r));

// Skill SKILL.md paths for harnesses that want the full list
const skillPaths = skills.map((s) => s.path);

// Additional domain files referenced in the portability doc example
const domainFiles = skills
  .filter((s) => parseInt(s.dir, 10) >= 17)
  .flatMap((s) => [`${s.dir}/SKILL.md`]);

// ── 1. .codex-plugin/plugin.json ─────────────────────────────────────────────
/**
 * OpenAI Codex harness manifest.
 * Codex does not support hooks or dynamic routing — exports harness-neutral rules only.
 *
 * @see reference/multi-harness-portability.md § "OpenAI Codex"
 */
const codexManifest = {
  _generated_by: 'bin/gen-harness-manifests.mjs — do not edit directly',
  policy: canonicalPolicyMetadata,
  name: 'heymegabyte-skills',
  version,
  instructions: 'Load rules/ directory. Each .md file is a standing instruction.',
  files: [...alwaysLoadRules, ...skillPaths],
};

writeJson(join(ROOT, '.codex-plugin', 'plugin.json'), codexManifest);

// ── 2. .opencode/config.json ─────────────────────────────────────────────────
/**
 * opencode harness config (open source CLI).
 *
 * @see reference/multi-harness-portability.md § "opencode"
 */
const opencodeConfig = {
  _generated_by: 'bin/gen-harness-manifests.mjs — do not edit directly',
  policy: canonicalPolicyMetadata,
  instructions: alwaysLoadRules,
  skills: skills.map((s) => ({ path: s.path })),
};

writeJson(join(ROOT, '.opencode', 'config.json'), opencodeConfig);

// ── 3. .kimi-plugin/plugin.json ──────────────────────────────────────────────
/**
 * Kimi harness manifest (China market).
 * Mirrors Claude Code format with locale additions.
 *
 * @see reference/multi-harness-portability.md § "Kimi"
 */
const kimiManifest = {
  _generated_by: 'bin/gen-harness-manifests.mjs — do not edit directly',
  policy: canonicalPolicyMetadata,
  name: 'heymegabyte-skills',
  version,
  locale: 'zh-CN',
  fallback_locale: 'en',
  skills: skills.map((s) => ({
    path: `../${s.path}`,
    id: s.name,
  })),
};

writeJson(join(ROOT, '.kimi-plugin', 'plugin.json'), kimiManifest);

// ─── summary ────────────────────────────────────────────────────────────────

console.log(`gen-harness-manifests: wrote 3 manifests (version ${version})`);
console.log(`  skills: ${skills.length}  always-load rules: ${alwaysLoadRules.length}`);
console.log(`  .codex-plugin/plugin.json  (${codexManifest.files.length} files)`);
console.log(`  .opencode/config.json      (${opencodeConfig.skills.length} skills)`);
console.log(`  .kimi-plugin/plugin.json   (${kimiManifest.skills.length} skills)`);
