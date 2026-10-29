#!/usr/bin/env node
/**
 * gen-harness-manifests.mjs
 *
 * Generates companion harness manifests from the canonical agentskills source of truth.
 * Emits: .codex-plugin/plugin.json, .opencode/config.json, .kimi-plugin/plugin.json
 *
 * Source of truth: NN-*\/SKILL.md plus approved named skills (frontmatter),
 * rules/*.md, and .claude-plugin/plugin.json
 * Never edit the output files directly — re-run this script instead.
 *
 * @see reference/multi-harness-portability.md
 *
 * @example
 * node bin/gen-harness-manifests.mjs
 * # → writes 3 manifest files relative to the repo root
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

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
 * Discover all numbered skill directories (NN-*) and approved named skill
 * directories that contain a SKILL.md.
 *
 * @param {string} root - Repo root path.
 * @returns {Array<{ dir: string; path: string; name: string; description: string }>}
 */
function discoverSkills(root) {
  const entries = readdirSync(root, { withFileTypes: true });
  const skills = [];
  const namedSkills = new Set();
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!/^\d{2}-/.test(entry.name) && !namedSkills.has(entry.name)) continue;
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
  'rules/low-hanging-fruit.md',
  'rules/ideal-architecture-loop.md',
  'rules/openspec-operating-contract.md',
  'rules/figma-design-approval-gate.md',
  'rules/claude-cloud-first.md',
  'rules/go-application-policy.md',
];

// ─── main ────────────────────────────────────────────────────────────────────

const version = readVersion(ROOT);
const skills = discoverSkills(ROOT);
const allRules = discoverRules(ROOT);

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
 * OpenAI Codex compatibility manifest. Skills remain progressively disclosed;
 * durable repository guidance belongs in AGENTS.md, not an always-loaded file list.
 *
 * @see reference/multi-harness-portability.md § "OpenAI Codex"
 */
const codexManifest = {
  name: 'heymegabyte-skills',
  version,
  description: 'Focused workflows for building and operating reliable SaaS products.',
  author: { name: 'heymegabyte' },
  skills: './.agents/skills/',
  interface: {
    displayName: 'Agent Skills for SaaS',
    shortDescription: 'Build reliable SaaS products',
    longDescription: 'Progressively disclosed workflows for SaaS architecture, implementation, design, quality, delivery, trust, and growth.',
    developerName: 'heymegabyte',
    category: 'Developer Tools',
    capabilities: ['Plan SaaS products', 'Build vertical slices', 'Verify releases'],
  },
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
  instructions: alwaysLoadRules,
  // OpenCode discovers skills from directories (`.opencode/skills/*/SKILL.md`,
  // `~/.claude/skills`, `~/.agents/skills`) — there is NO `skills` config key.
  // The skill set is therefore not listed here. See bin/gen-opencode-harness.mjs
  // for the agents/commands/tools/plugins bridge into ~/.config/opencode/.
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
console.log(`  .codex-plugin/plugin.json  (${skills.length} progressively disclosed skills)`);
console.log(`  .opencode/config.json      (${alwaysLoadRules.length} instructions)`);
console.log(`  .kimi-plugin/plugin.json   (${kimiManifest.skills.length} skills)`);
