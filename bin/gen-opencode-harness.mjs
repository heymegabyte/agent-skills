#!/usr/bin/env node
/**
 * gen-opencode-harness.mjs
 *
 * Ports the canonical Claude Code agents + slash commands into OpenCode's
 * native markdown format so they work under DeepSeek (the throughput rail).
 *
 *   ~/.agentskills/agents/*.md    →  ~/.config/opencode/agents/<name>.md
 *   ~/.agentskills/commands/*.md  →  ~/.config/opencode/commands/<name>.md
 *
 * Translation rules (Claude frontmatter → OpenCode frontmatter):
 *   - description          → description (kept verbatim)
 *   - model: opus|fable    → deepseek/deepseek-v4-pro  (reasoning tier)
 *   - model: sonnet|haiku  → deepseek/deepseek-flash   (fast/vision tier)
 *   - vision-requiring agents forced to flash (pro has NO image input)
 *   - tools / allowed-tools / disallowedTools / permissionMode:plan
 *                          → permission { edit, bash }  (read-only ⇒ edit:deny)
 *   - maxTurns             → steps
 *   - color                → color
 *   - Claude-only fields (effort, model_fallback, context, memory,
 *     permissionMode, isolation, skills, fallback_*) are dropped.
 *
 * Idempotent. Re-run any time the source agents/commands change.
 *   node bin/gen-opencode-harness.mjs            # regenerate
 *   node bin/gen-opencode-harness.mjs --check    # exit 1 if drifted (CI)
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, lstatSync, symlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const AGENTS_SRC = join(ROOT, 'agents')
const COMMANDS_SRC = join(ROOT, 'commands')
const OC = join(process.env.HOME, '.config', 'opencode')
const AGENTS_OUT = join(OC, 'agents')
const COMMANDS_OUT = join(OC, 'commands')
const SKILLS_OUT = join(OC, 'skills')
const TOOLS_OUT = join(OC, 'tools')
const PLUGINS_OUT = join(OC, 'plugins')
// Canonical OpenSpec skills + opsx commands + skill-route tool + observability
// plugin live inside the plugin's own `.opencode/`; bridge them into the global
// config dir (symlink = single source of truth, no copy drift).
const PLUGIN_OC = join(process.env.HOME, '.claude', 'plugins', 'heymegabyte-agent-skills', '.opencode')
const CHECK = process.argv.includes('--check')

// DeepSeek direct rail (OpenCode) has exactly two tiers:
const MODEL_MAP = {
  opus: 'litellm/deepseek-v4-pro',
  fable: 'litellm/deepseek-v4-pro',
  sonnet: 'litellm/deepseek-flash',
  haiku: 'litellm/deepseek-flash',
}
// Agents that ingest screenshots/images must run on flash (pro is text-only).
const VISION_AGENTS = new Set([
  'visual-qa',
  'computer-use-operator',
  'browser-operator',
  'media-orchestrator',
  'deploy-verifier',
  'accessibility-auditor',
])

// OpenCode `color` only accepts #RRGGBB hex or 8 theme names — NOT Claude's
// named colors. Map the estate palette to hex (drop unmapped → default).
const COLOR_MAP = {
  blue: '#3b82f6',
  'bright-cyan': '#22d3ee',
  cyan: '#06b6d4',
  green: '#22c55e',
  magenta: '#d946ef',
  orange: '#f97316',
  purple: '#a855f7',
  rainbow: '#7c3aed',
  red: '#ef4444',
  yellow: '#eab308',
}

// MCP tools are disabled globally in opencode.jsonc (`tools`); re-enable per
// specialized agent so only they pay the context cost.
const MCP_AGENTS = {
  'security-reviewer': ['semgrep_*'],
  'dependency-auditor': ['semgrep_*'],
  'deploy-verifier': ['cloudflare-api_*'],
  architect: ['cloudflare-api_*'],
  'incident-responder': ['cloudflare-api_*'],
}

// DeepSeek `reasoning_effort` passthrough — spend reasoning only where it wins.
const EFFORT_AGENTS = {
  architect: 'high',
  'security-reviewer': 'high',
  'meta-orchestrator': 'high',
  'completeness-checker': 'high',
  'incident-responder': 'high',
}

function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!m) return { fm: {}, body: src }
  const block = m[1]
  const fm = {}
  fm.description = (block.match(/^description:\s*["']?([\s\S]*?)["']?\s*$/m) || [])[1] || ''
  fm.model = (block.match(/^model:\s*["']?([\w.-]+)/m) || [])[1] || ''
  fm.maxTurns = (block.match(/^maxTurns:\s*(\d+)/m) || [])[1]
  fm.color = (block.match(/^color:\s*([\w#-]+)/m) || [])[1] || ''
  fm.permissionMode = (block.match(/^permissionMode:\s*(\w+)/m) || [])[1] || ''
  fm.tools = (block.match(/^tools:\s*\[([^\]]*)\]/m) || [])[1] || ''
  fm.allowedTools = (block.match(/^allowed-tools:\s*([^\n]+)/m) || [])[1] || ''
  fm.disallowedTools = (block.match(/^disallowedTools:\s*([^\n]+)/m) || [])[1] || ''
  fm.argumentHint = (block.match(/^argument-hint:\s*([^\n]+)/m) || [])[1] || ''
  return { fm, body: src.slice(m[0].length).trim() }
}

function stripSubagentStop(body) {
  return body
    .replace(/<!--\s*<SUBAGENT-STOP>[\s\S]*?-->\s*/g, '')
    .replace(/<SUBAGENT-STOP\/>\s*/g, '')
    .trim()
}

function buildAgentFrontmatter(fm, name) {
  const has = (field, token) => new RegExp(`\\b${token}\\b`, 'i').test(field)
  const writeGranted = has(fm.tools, 'Write') || has(fm.tools, 'Edit') || has(fm.allowedTools, 'Write') || has(fm.allowedTools, 'Edit')
  const writeDenied = has(fm.disallowedTools, 'Write') || has(fm.disallowedTools, 'Edit')
  const bashGranted = has(fm.tools, 'Bash') || has(fm.allowedTools, 'Bash')
  const bashDenied = has(fm.disallowedTools, 'Bash')
  const readOnly = !writeGranted || writeDenied || fm.permissionMode === 'plan'

  let model = MODEL_MAP[fm.model] || MODEL_MAP.haiku
  if (VISION_AGENTS.has(name)) model = MODEL_MAP.haiku // force flash (vision)

  const lines = ['---', `description: ${JSON.stringify(fm.description)}`, 'mode: subagent', `model: ${model}`, 'temperature: 0.1']
  const perm = []
  if (readOnly) perm.push('  edit: deny')
  if (bashDenied || !bashGranted) perm.push('  bash: deny')
  for (const m of MCP_AGENTS[name] || []) perm.push(`  "${m}": allow`)
  if (perm.length) {
    lines.push('permission:')
    lines.push(...perm)
  }
  if (fm.maxTurns) lines.push(`steps: ${fm.maxTurns}`)
  if (EFFORT_AGENTS[name]) lines.push(`reasoningEffort: "${EFFORT_AGENTS[name]}"`)
  if (fm.color && COLOR_MAP[fm.color]) lines.push(`color: "${COLOR_MAP[fm.color]}"`) // quoted: unquoted #… is a YAML comment
  lines.push('---')
  return lines.join('\n')
}

function buildCommandContent(fm, body) {
  const hint = fm.argumentHint ? `\n\nInput: $ARGUMENTS (${fm.argumentHint})` : ''
  return `---\ndescription: ${JSON.stringify(fm.description)}\n---\n\n${body}${hint}\n`
}

// Bridge symlinks from the plugin's own `.opencode/` into the global config dir.
// These are NOT generated content — they preserve the canonical source. Skipped
// (never unlinked) by the stale-cleanup below, which only touches real files.
function ensureBridge() {
  const link = (src, dst) => {
    if (existsSync(dst)) return
    mkdirSync(dirname(dst), { recursive: true })
    if (existsSync(src)) symlinkSync(src, dst)
  }
  for (const d of ['skills', 'commands', 'tools', 'plugins']) {
    const srcDir = join(PLUGIN_OC, d)
    const outDir = { skills: SKILLS_OUT, commands: COMMANDS_OUT, tools: TOOLS_OUT, plugins: PLUGINS_OUT }[d]
    if (!existsSync(srcDir)) continue
    for (const f of readdirSync(srcDir)) link(join(srcDir, f), join(outDir, f))
  }
}

// ─── agents ────────────────────────────────────────────────────────────────
const agentFiles = readdirSync(AGENTS_SRC).filter((f) => f.endsWith('.md'))
const generatedAgents = []
let drift = false

for (const f of agentFiles) {
  const src = readFileSync(join(AGENTS_SRC, f), 'utf8')
  const { fm, body } = parseFrontmatter(src)
  const name = f.replace(/\.md$/, '')
  const out = `${buildAgentFrontmatter(fm, name)}\n\n${stripSubagentStop(body)}\n`
  const outPath = join(AGENTS_OUT, f)
  generatedAgents.push(f)
  if (CHECK) {
    if (!existsSync(outPath) || readFileSync(outPath, 'utf8') !== out) drift = true
    continue
  }
  mkdirSync(AGENTS_OUT, { recursive: true })
  writeFileSync(outPath, out)
}

// remove stale outputs (real files only — never the bridge symlinks)
if (!CHECK && existsSync(AGENTS_OUT)) {
  for (const f of readdirSync(AGENTS_OUT)) {
    if (f.endsWith('.md') && !agentFiles.includes(f) && !lstatSync(join(AGENTS_OUT, f)).isSymbolicLink()) unlinkSync(join(AGENTS_OUT, f))
  }
}

// ─── commands ──────────────────────────────────────────────────────────────
const commandFiles = readdirSync(COMMANDS_SRC).filter((f) => f.endsWith('.md'))
let commandDrift = false

for (const f of commandFiles) {
  const src = readFileSync(join(COMMANDS_SRC, f), 'utf8')
  const { fm, body } = parseFrontmatter(src)
  const out = `---\ndescription: ${JSON.stringify(fm.description)}\n---\n\n${stripSubagentStop(body)}\n`
  const outPath = join(COMMANDS_OUT, f)
  if (CHECK) {
    if (!existsSync(outPath) || readFileSync(outPath, 'utf8') !== out) commandDrift = true
    continue
  }
  mkdirSync(COMMANDS_OUT, { recursive: true })
  writeFileSync(outPath, out)
}

if (!CHECK && existsSync(COMMANDS_OUT)) {
  for (const f of readdirSync(COMMANDS_OUT)) {
    if (f.endsWith('.md') && !commandFiles.includes(f) && !lstatSync(join(COMMANDS_OUT, f)).isSymbolicLink()) unlinkSync(join(COMMANDS_OUT, f))
  }
}

if (!CHECK) ensureBridge()

if (CHECK) {
  if (drift || commandDrift) {
    console.error('DRIFT: OpenCode harness is stale. Run: node bin/gen-opencode-harness.mjs')
    process.exit(1)
  }
  console.log('OK: OpenCode harness is in sync.')
  process.exit(0)
}

console.log(`wrote ${generatedAgents.length} agents → ~/.config/opencode/agents/`)
console.log(`wrote ${commandFiles.length} commands → ~/.config/opencode/commands/`)
console.log(`bridged openspec skills/commands + skill-route tool + observability plugin → ~/.config/opencode/`)
