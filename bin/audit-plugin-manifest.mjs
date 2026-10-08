#!/usr/bin/env node
// audit-plugin-manifest.mjs — the plugin manifest (.claude-plugin/plugin.json) is
// what Claude Code actually LOADS. It silently drifted: agents[] listed 18 of 28,
// and the description advertised "20-category, 18+ agents, 117 rules, 20+ commands,
// 32 platforms" while the filesystem had 23/28/177/36/37. This guard pins the
// manifest to the filesystem so the drift can't recur. Exit 1 on any mismatch.
//
//   node bin/audit-plugin-manifest.mjs          # audit (exit 1 on drift)
//
// Pairs with the drift-detection doctrine the same way the agent.skillsl.ink
// showcase's gen-llms-full.mjs guard pins its advertised counts to reality.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const drift = [];

// --- Ground truth from the filesystem ---
const agentFiles = readdirSync(join(root, 'agents')).filter((f) => f.endsWith('.md')).sort();
const skillDirs = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d\d-/.test(d.name)).map((d) => d.name).sort();
const ruleCount = readdirSync(join(root, 'rules')).filter((f) => f.endsWith('.md')).length;
const commandCount = readdirSync(join(root, 'commands')).filter((f) => f.endsWith('.md')).length;
let platformCount = 0;
try { platformCount = (JSON.parse(readFileSync(join(root, 'platforms.json'), 'utf8')).variants || []).length; } catch { /* no platforms.json */ }

const manifest = JSON.parse(readFileSync(join(root, '.claude-plugin', 'plugin.json'), 'utf8'));

// --- 1. agents[] must exactly match agents/*.md (set equality, and files must exist) ---
const manifestAgents = (manifest.agents || []).map((p) => p.replace(/^agents\//, '')).sort();
const fsAgents = agentFiles;
for (const a of manifestAgents) {
  if (!existsSync(join(root, 'agents', a))) drift.push(`manifest agents[] lists "agents/${a}" but that file does not exist`);
}
for (const a of fsAgents) {
  if (!manifestAgents.includes(a)) drift.push(`agents/${a} exists but is MISSING from manifest agents[]`);
}
if (manifestAgents.length !== fsAgents.length)
  drift.push(`manifest agents[] count ${manifestAgents.length} ≠ ${fsAgents.length} agent files`);

// --- 2. skills[] must exactly match the NN-* skill dirs ---
const manifestSkills = (manifest.skills || []).slice().sort();
for (const s of skillDirs) {
  if (!manifestSkills.includes(s)) drift.push(`skill dir ${s}/ exists but is MISSING from manifest skills[]`);
}
for (const s of manifestSkills) {
  if (!skillDirs.includes(s)) drift.push(`manifest skills[] lists "${s}" but no such skill dir exists`);
}

// --- 3. description prose counts must match the filesystem ---
const desc = String(manifest.description || '');
const checks = [
  [/(\d+)-category/, skillDirs.length, 'category'],
  [/(\d+)\+?\s+agents/, agentFiles.length, 'agents'],
  [/(\d+)\+?\s+doctrine rules/, ruleCount, 'doctrine rules'],
  [/(\d+)\+?\s+slash commands/, commandCount, 'slash commands'],
  [/(\d+)\+?\s+AI-tool platform variants/, platformCount, 'AI-tool platform variants'],
];
for (const [re, expected, label] of checks) {
  const m = desc.match(re);
  if (!m) { drift.push(`manifest description missing a "${label}" count (expected ${expected})`); continue; }
  if (Number(m[1]) !== expected && expected > 0) drift.push(`manifest description "${m[1]} ${label}" ≠ actual ${expected}`);
}

if (drift.length) {
  console.error('\n✘ PLUGIN MANIFEST DRIFT — .claude-plugin/plugin.json no longer matches the filesystem:\n  - ' + drift.join('\n  - '));
  console.error('\nUpdate .claude-plugin/plugin.json (agents[], skills[], description counts) to match, then re-run.\n');
  process.exit(1);
}
console.log(`✔ plugin manifest: agents[] ↔ ${fsAgents.length} agent files · skills[] ↔ ${skillDirs.length} skill dirs · description counts ↔ ${skillDirs.length} categories / ${agentFiles.length} agents / ${ruleCount} rules / ${commandCount} commands / ${platformCount} platforms`);
