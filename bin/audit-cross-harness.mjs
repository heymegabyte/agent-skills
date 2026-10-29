#!/usr/bin/env node
/**
 * audit-cross-harness.mjs — verify the agent-skills RULES work identically on
 * Claude Code, Codex, and OpenCode (DeepSeek), not just on Claude where they
 * were authored.
 *
 * Hard checks (exit 1 on --check):
 *   1. Every always-load rule (from .opencode/config.json, the SSOT generated
 *      by gen-harness-manifests.mjs) is wired into OpenCode's global config
 *      `instructions` (~/.config/opencode/opencode.jsonc).
 *   2. Per-harness manifests exist and are populated:
 *        .opencode/config.json (instructions) · .codex-plugin/plugin.json
 *        (files) · .claude-plugin/plugin.json (skills/agents).
 *   3. Per-harness entry files exist: CODEX.md, GEMINI.md, AGENTS.md, CLAUDE.md.
 *
 * Soft warnings (report only):
 *   - Rule bodies carrying Claude-specific signals (paths/model-ids/tools),
 *     split into always-load (flows to Codex/OpenCode) vs on-demand.
 *   - Stale agent/rule/command counts in harness entry files.
 *
 * Adapter-exception doctrine: rules/agent-neutrality.md defines the legit
 * Claude-only surfaces (runtime paths, model IDs, real CLI commands). This
 * audit surfaces them — it does not auto-rewrite doctrine.
 *
 * Usage:
 *   node bin/audit-cross-harness.mjs           # full report
 *   node bin/audit-cross-harness.mjs --check   # exit 1 on any hard failure
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const H = process.env.HOME
const ROOT = join(H, '.claude', 'plugins', 'heymegabyte-agent-skills')
const RULES = join(ROOT, 'rules')
const OC_GLOBAL = join(H, '.config', 'opencode', 'opencode.jsonc')
const CHECK = process.argv.includes('--check')

let hard = 0
let warn = 0
const fail = (m) => { hard++; console.log(`  ✗ ${m}`) }
const soft = (m) => { warn++; console.log(`  ! ${m}`) }

// ── SSOT: always-load rules from the generated .opencode/config.json ────────
function readGeneratedInstructions() {
  const p = join(ROOT, '.opencode', 'config.json')
  if (!existsSync(p)) return null
  try { return JSON.parse(readFileSync(p, 'utf8')).instructions || [] } catch { return null }
}
const alwaysLoad = readGeneratedInstructions()

console.log('## Cross-harness rules audit\n')

// ── 1. OpenCode global instructions wiring ──────────────────────────────────
console.log('### 1. OpenCode global `instructions` wiring')
const ocRaw = existsSync(OC_GLOBAL) ? readFileSync(OC_GLOBAL, 'utf8') : ''
const ocArr = ocRaw.match(/"instructions"\s*:\s*\[([\s\S]*?)\]/)
const ocPaths = ocArr ? [...ocArr[1].matchAll(/"([^"]+\.md)"/g)].map((m) => m[1]) : []
if (!alwaysLoad) {
  fail('missing .opencode/config.json (run gen-harness-manifests.mjs)')
} else {
  for (const r of alwaysLoad) {
    const name = r.split('/').pop()
    if (!ocPaths.some((p) => p.endsWith(name))) fail(`not wired into OpenCode instructions: ${name}`)
  }
  console.log(`   ${ocPaths.length} instruction files in opencode.jsonc; ${alwaysLoad.length} expected`)
}

// ── 2. per-harness manifests ────────────────────────────────────────────────
console.log('\n### 2. Harness manifests')
const manifests = [
  ['.claude-plugin/plugin.json', ['skills', 'agents']],
  ['.codex-plugin/plugin.json', ['skills', 'interface']],
  ['.opencode/config.json', ['instructions']],
  ['.kimi-plugin/plugin.json', ['skills']],
]
for (const [rel, keys] of manifests) {
  const p = join(ROOT, rel)
  if (!existsSync(p)) { fail(`missing ${rel}`); continue }
  try {
    const j = JSON.parse(readFileSync(p, 'utf8'))
    for (const k of keys) if (!j[k] || (Array.isArray(j[k]) && j[k].length === 0)) fail(`${rel}: empty/missing "${k}"`)
  } catch { fail(`${rel}: invalid JSON`) }
}
// Codex plugin points skills at the generated `.agents/skills/` mirror — it must exist.
if (!existsSync(join(ROOT, '.agents', 'skills'))) fail('missing .agents/skills/ (run gen-codex-skills.mjs)')

// ── 3. per-harness entry files ──────────────────────────────────────────────
console.log('\n### 3. Harness entry files')
for (const f of ['CLAUDE.md', 'CODEX.md', 'GEMINI.md', 'AGENTS.md']) {
  if (!existsSync(join(ROOT, f))) fail(`missing ${f}`)
}
// Global entries that make the doctrine reach each harness OUTSIDE the repo:
if (!existsSync(join(H, '.claude', 'CLAUDE.md'))) fail('missing ~/.claude/CLAUDE.md (Claude global entry)')
if (!existsSync(join(H, '.codex', 'AGENTS.md'))) fail('missing ~/.codex/AGENTS.md (Codex global entry)')

// ── 4. rule-leak scan ───────────────────────────────────────────────────────
console.log('\n### 4. Rule body Claude-signal scan')
const SIGS = [
  [/~\/\.claude/, '~/.claude path'],
  [/\/Users\/[A-Za-z]+\/\.claude/, '/Users abs claude'],
  [/claude-(opus|sonnet|haiku|fable|3-|4-|5-)/i, 'claude-* model id'],
  [/ANTHROPIC_API_KEY/, 'ANTHROPIC_API_KEY'],
  [/Skill\(/, 'Skill( tool'],
  [/Agent\(/, 'Agent( tool'],
  [/NotebookEdit/, 'NotebookEdit'],
  [/EnterWorktree/, 'EnterWorktree'],
  [/WebSearch/, 'WebSearch'],
  [/WebFetch/, 'WebFetch'],
  [/mcp__/, 'mcp__'],
]
const alwaysSet = new Set((alwaysLoad || []).map((r) => r.split('/').pop()))
const leakByRule = {}
for (const f of readdirSync(RULES).filter((f) => f.endsWith('.md'))) {
  const body = readFileSync(join(RULES, f), 'utf8').replace(/^---\n[\s\S]*?\n---/, '')
  const hits = SIGS.filter(([re]) => re.test(body)).map(([, label]) => label)
  if (hits.length) leakByRule[f] = hits
}
const alwaysLeaks = Object.entries(leakByRule).filter(([f]) => alwaysSet.has(f))
const onDemandLeaks = Object.entries(leakByRule).filter(([f]) => !alwaysSet.has(f))
console.log(`   always-load rules w/ Claude signals: ${alwaysLeaks.length}/${alwaysSet.size}`)
for (const [f, hits] of alwaysLeaks) soft(`ALWAYS-LOAD ${f}: ${hits.join(', ')}`)
console.log(`   on-demand rules w/ Claude signals: ${onDemandLeaks.length}`)
for (const [f, hits] of onDemandLeaks.slice(0, 40)) soft(`${f}: ${hits.join(', ')}`)
if (onDemandLeaks.length > 40) console.log(`   … +${onDemandLeaks.length - 40} more`)

// ── 5. stale counts in entry files ──────────────────────────────────────────
console.log('\n### 5. Harness entry counts')
const agentCount = readdirSync(join(ROOT, 'agents')).filter((f) => f.endsWith('.md')).length
const ruleCount = readdirSync(RULES).filter((f) => f.endsWith('.md')).length
const cmdCount = readdirSync(join(ROOT, 'commands')).filter((f) => f.endsWith('.md')).length
for (const f of ['CODEX.md', 'GEMINI.md']) {
  const p = join(ROOT, f)
  if (!existsSync(p)) continue
  const txt = readFileSync(p, 'utf8')
  if (!txt.includes(`${agentCount} agents`)) soft(`${f}: agent count stale (expect ${agentCount})`)
  if (!txt.includes(`${ruleCount} doctrine rules`)) soft(`${f}: rule count stale (expect ${ruleCount})`)
}

console.log('\n## Result')
console.log(`   ${hard} hard failures, ${warn} warnings`)
if (CHECK && hard > 0) { console.error('FAIL: cross-harness drift detected.'); process.exit(1) }
if (hard === 0) console.log('   ✓ rules are wired identically across Claude / Codex / OpenCode')
process.exit(0)
