#!/usr/bin/env node
/**
 * audit-opencode-compat.mjs — one-shot OpenCode + DeepSeek compatibility audit
 * for the whole agent-skills estate. Scans every discovered skill plus the
 * generated OpenCode harness and reports hard failures + soft warnings.
 *
 * Hard checks (exit 1 on `--check`):
 *   1. SKILL.md frontmatter valid — name matches `^[a-z0-9]+(-[a-z0-9]+)*$`,
 *      description present and ≤1024 chars, name == directory name (named skills).
 *   2. Skill names unique across every discovery root.
 *   3. No Claude-only model IDs (opus/sonnet/haiku/fable/claude-*) in skill
 *      frontmatter or generated agents/commands.
 *   4. Generated agents valid — `mode` in {subagent,primary,all},
 *      `model` is `deepseek/*`, `description` present.
 *   5. Bridge symlinks present (openspec skills, opsx commands, skill-route
 *      tool, emdash-observability plugin).
 *
 * Soft warnings (report only): Claude tool-name aliases (WebSearch/WebFetch/
 * mcp__) and Claude-path references (~/.claude, claude code) in skill bodies.
 *
 * Usage:
 *   node bin/audit-opencode-compat.mjs           # full report
 *   node bin/audit-opencode-compat.mjs --check   # exit 1 if any hard check fails
 */

import { readdirSync, readFileSync, existsSync, lstatSync } from 'node:fs'
import { join } from 'node:path'

const H = process.env.HOME
const CHECK = process.argv.includes('--check')
const NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const DESC_MAX = 1024
const CLAUDE_MODEL = /(?:opus|sonnet|haiku|fable|claude-\w)/i
const DISCOVERY_ROOTS = [
  join(H, '.claude/skills'),
  join(H, '.agents/skills'),
  join(H, '.agentskills/skills'),
  join(H, '.config/opencode/skills'),
]

let failures = 0
let warnings = 0
const fail = (m) => { failures++; console.log(`  ✗ ${m}`) }
const warn = (m) => { warnings++; console.log(`  ! ${m}`) }

// ── collect skills ──────────────────────────────────────────────────────────
const skills = []
const seen = new Map()
function walk(dir, depth) {
  if (depth > 5) return
  let e
  try { e = readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const x of e) {
    const p = join(dir, x.name)
    if (x.isDirectory()) {
      if (depth >= 1 && existsSync(join(p, 'SKILL.md'))) register(p)
      else walk(p, depth + 1)
    }
  }
}
function register(p) {
  let body = ''
  try { body = readFileSync(join(p, 'SKILL.md'), 'utf8') } catch { return }
  const m = body.match(/^---\n([\s\S]*?)\n---/)
  const fm = m ? m[1] : ''
  const name = (fm.match(/^name:\s*["']?([^"'\n]+)["']?\s*$/m) || [])[1]?.trim() || ''
  const bodyText = body.slice(m ? m[0].length : 0)
  const dirName = p.split('/').pop()
  skills.push({ name, dirName, path: p.replace(H, '~'), fm, bodyText })
  if (name) {
    if (!seen.has(name)) seen.set(name, [])
    seen.get(name).push(p.replace(H, '~'))
  }
}

for (const r of DISCOVERY_ROOTS) if (existsSync(r)) walk(r, 1)

console.log('## OpenCode + DeepSeek compatibility audit\n')

// 1. frontmatter validity
console.log('### 1. Skill frontmatter')
for (const s of skills) {
  const probs = []
  if (!s.name) probs.push('missing name')
  else if (!NAME_RE.test(s.name)) probs.push(`invalid name "${s.name}"`)
  else if (s.name.length > 64) probs.push('name >64')
  if (!/^description:\s*\S/m.test(s.fm)) probs.push('missing description')
  const desc = (s.fm.match(/^description:\s*["']?([\s\S]*?)["']?\s*$/m) || [])[1] || ''
  if (desc && desc.length > DESC_MAX) probs.push(`description ${desc.length}>${DESC_MAX}`)
  if (s.name && !/^\d{2}-/.test(s.dirName) && s.name !== s.dirName) probs.push(`name "${s.name}" != dir "${s.dirName}"`)
  if (probs.length) fail(`${s.path}: ${probs.join(', ')}`)
}
console.log(`   ${skills.length} skills scanned`)

// 2. uniqueness
console.log('\n### 2. Name uniqueness')
for (const [n, ps] of seen) if (ps.length > 1) fail(`"${n}" duplicated: ${ps.join(' | ')}`)
console.log(`   ${seen.size} unique names`)

// 3. Claude model IDs
console.log('\n### 3. Model-tier portability')
for (const s of skills) {
  if (/^model:\s*["']?[^\n]*$/m.test(s.fm) && CLAUDE_MODEL.test(s.fm)) fail(`${s.path}: Claude model id in frontmatter`)
}

// 4. generated agents + commands
console.log('\n### 4. Generated harness (agents + commands)')
const AD = join(H, '.config/opencode/agents')
const CD = join(H, '.config/opencode/commands')
if (existsSync(AD)) {
  for (const f of readdirSync(AD).filter((f) => f.endsWith('.md'))) {
    const b = readFileSync(join(AD, f), 'utf8')
    const fm = (b.match(/^---\n([\s\S]*?)\n---/) || [])[1] || ''
    const model = (fm.match(/^model:\s*([^\n]+)/m) || [])[1]?.trim() || ''
    const mode = (fm.match(/^mode:\s*([^\n]+)/m) || [])[1]?.trim() || ''
    if (!/^description:/.test(fm)) fail(`agent ${f}: missing description`)
    if (!/^deepseek\//.test(model)) fail(`agent ${f}: bad model "${model}"`)
    if (CLAUDE_MODEL.test(model)) fail(`agent ${f}: Claude id leak "${model}"`)
    if (mode && !/^(subagent|primary|all)$/.test(mode)) fail(`agent ${f}: bad mode "${mode}"`)
  }
} else fail('missing ~/.config/opencode/agents/')
if (existsSync(CD)) {
  for (const f of readdirSync(CD).filter((f) => f.endsWith('.md'))) {
    const b = readFileSync(join(CD, f), 'utf8')
    const fm = (b.match(/^---\n([\s\S]*?)\n---/) || [])[1] || ''
    if (!/^description:/.test(fm)) fail(`command ${f}: missing description`)
    if (/^model:\s*(?:opus|sonnet|haiku|fable|claude-)/m.test(fm)) fail(`command ${f}: Claude id leak`)
  }
} else fail('missing ~/.config/opencode/commands/')

// 5. bridge symlinks
console.log('\n### 5. Bridge')
const bridge = [
  [join(H, '.config/opencode/tools/skill-route.ts'), 'skill-route tool'],
  [join(H, '.config/opencode/plugins/emdash-observability.ts'), 'observability plugin'],
]
for (const [p, label] of bridge) {
  if (!existsSync(p) || !lstatSync(p).isSymbolicLink()) fail(`missing bridge symlink: ${label}`)
}
const openspec = existsSync(join(H, '.config/opencode/skills')) ? readdirSync(join(H, '.config/opencode/skills')).filter((n) => n.startsWith('openspec-')) : []
const opsx = existsSync(CD) ? readdirSync(CD).filter((n) => n.startsWith('opsx-')) : []
if (openspec.length < 12) fail(`openspec skills missing (${openspec.length}/12)`)
if (opsx.length < 12) fail(`opsx commands missing (${opsx.length}/12)`)

// soft warnings
console.log('\n### Soft warnings')
const TOOL_ALIAS = ['WebSearch', 'WebFetch', 'mcp__']
const PATH_SIG = [/~\/\.claude/, /\/Users\/[A-Za-z]+\/\.claude/, /claude code/i]
for (const s of skills) {
  const t = TOOL_ALIAS.filter((x) => s.bodyText.includes(x))
  if (t.length) warn(`${s.name}: Claude tool aliases in body (${t.join(', ')}) — DeepSeek maps to websearch/webfetch`)
  const p = PATH_SIG.filter((r) => r.test(s.bodyText))
  if (p.length) warn(`${s.name}: Claude-path/code refs in body`)
}

console.log('\n## Result')
console.log(`   ${failures} hard failures, ${warnings} warnings`)
if (CHECK && failures > 0) {
  console.error('FAIL: OpenCode compat drift detected.')
  process.exit(1)
}
if (failures === 0) console.log('   ✓ clean — skills + harness are OpenCode/DeepSeek compatible')
process.exit(0)
