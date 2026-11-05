/**
 * measure.ts — the before/after token-budget comparison CLI.
 *
 * Two honest "before" baselines are measured from the real plugin directory:
 *
 *   metadata     — every SKILL.md frontmatter + every rule body + every agent
 *                  definition. This is the "20 skills, 117+ rules, 18 agents
 *                  load descriptions and rule frontmatter before the user types"
 *                  shape the issue describes.
 *   allMarkdown  — every markdown file the gateway indexes, loaded in full.
 *                  This is the hard ceiling a client would pay without a gateway.
 *
 * "After" is what a client actually pays with the gateway:
 *
 *   constant     — the 3 tool schemas, sent once per session.
 *   per turn     — constant + one typical call result. Measured by running the
 *                  real search against the real index; not estimated.
 *
 * The index itself is held server-side. Its size is reported for transparency,
 * but it never enters the model's context.
 *
 * Usage:
 *   node dist/measure.js [--root=<plugin-root>] [--json] [--out=<file>]
 *
 * Exit codes: 0 report written · 1 index build failed.
 *
 * @module
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildIndexDetailed,
  indexTokenCost,
  approxTokens,
  parseFrontmatter,
  serialiseIndex,
  type IndexEntry,
  type EntryKind,
} from './index-builder.js';
import { searchEntries, formatHits } from './search.js';
import { loadSkillForMeasure, findRuleForMeasure } from './format.js';
import { TOOL_DEFINITIONS } from './tools.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function defaultRoot(): string {
  // dist/ or src/ → mcp-server → skills-gateway-mcp → mcp-servers → plugin root
  return resolve(__dirname, '..', '..', '..', '..');
}

function arg(name: string): string | null {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
}

function tokens(bytes: number): number {
  return approxTokens(bytes);
}

function bytesOf(text: string): number {
  return Buffer.byteLength(text, 'utf-8');
}

export interface MeasureReport {
  root: string;
  generatedAt: string;
  entries: { total: number; skills: number; rules: number; agents: number; commands: number };
  before: {
    metadata: { bytes: number; tokens: number; description: string };
    allMarkdown: { bytes: number; tokens: number; description: string };
    heaviest: Array<{ path: string; kind: EntryKind; tokens: number }>;
  };
  after: {
    toolDefinitions: { bytes: number; tokens: number };
    indexHeldServerSide: { bytes: number; tokens: number; sentToModel: false };
    perCall: Record<string, { bytes: number; tokens: number }>;
    typicalTurnTokens: number;
  };
  reduction: {
    typicalTurnVsMetadataPct: number;
    typicalTurnVsAllMarkdownPct: number;
    constantVsMetadataPct: number;
    tokensSavedPerSession: number;
  };
}

function metadataBytes(root: string, entries: readonly IndexEntry[], covered: Set<string>): number {
  let total = 0;
  for (const entry of entries) {
    let text = '';
    try {
      text = readFileSync(join(root, entry.path), 'utf-8');
    } catch {
      continue;
    }
    if (entry.kind === 'skill' || entry.kind === 'agent' || entry.kind === 'command') {
      // Descriptions (plus priority/paths routing metadata) — the up-front
      // payload a skill-aware client must know to decide what to load.
      total += bytesOf(JSON.stringify(parseFrontmatter(text)));
    } else {
      // Rules are always-eligible: their bodies are the always-load tax.
      total += bytesOf(text);
    }
  }
  return total;
}

export function measure(root: string): MeasureReport {
  const { index, files } = buildIndexDetailed(root);
  const covered = new Set(files.keys());
  const kinds: Partial<Record<EntryKind, number>> = {};
  for (const e of index.entries) kinds[e.kind] = (kinds[e.kind] ?? 0) + 1;

  // ── BEFORE ───────────────────────────────────────────────────────────────
  const metaBytes = metadataBytes(root, index.entries, covered);
  const allMarkdownBytes = index.entries.reduce((s, e) => s + e.sizeBytes, 0);

  const heaviest = [...index.entries]
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 8)
    .map((e) => ({ path: e.path, kind: e.kind, tokens: tokens(e.sizeBytes) }));

  // ── AFTER ────────────────────────────────────────────────────────────────
  const toolDefsBytes = bytesOf(JSON.stringify(TOOL_DEFINITIONS));

  const perCall: Record<string, { bytes: number; tokens: number }> = {};
  const probes: Array<{ tool: string; text: string }> = [
    {
      tool: 'search_skills',
      text: formatHits(searchEntries(index.entries, 'stripe payments', { limit: 5 }), 'stripe payments'),
    },
    {
      tool: 'search_skills',
      text: formatHits(searchEntries(index.entries, 'deploy cloudflare workers', { limit: 5 }), 'deploy cloudflare workers'),
    },
    {
      tool: 'find_rule',
      text: findRuleForMeasure(root, index.entries, 'feature flags'),
    },
    {
      tool: 'load_skill',
      text: loadSkillForMeasure(root, index.entries, '05-architecture-and-stack'),
    },
  ];
  // Keep one representative sample per tool; probes may repeat a tool.
  const seen = new Set<string>();
  for (const probe of probes) {
    if (seen.has(probe.tool)) continue;
    seen.add(probe.tool);
    perCall[probe.tool] = { bytes: bytesOf(probe.text), tokens: tokens(bytesOf(probe.text)) };
  }

  const constantTokens = tokens(toolDefsBytes);
  const typicalTurnTokens = constantTokens + perCall['search_skills'].tokens + 12;

  const pct = (after: number, before: number) => Math.round((1 - after / before) * 1000) / 10;

  return {
    root,
    generatedAt: new Date().toISOString(),
    entries: {
      total: index.entries.length,
      skills: kinds.skill ?? 0,
      rules: kinds.rule ?? 0,
      agents: kinds.agent ?? 0,
      commands: kinds.command ?? 0,
    },
    before: {
      metadata: {
        bytes: metaBytes,
        tokens: tokens(metaBytes),
        description: 'skill/agent/command frontmatter + all rule bodies (the up-front always-load tax)',
      },
      allMarkdown: {
        bytes: allMarkdownBytes,
        tokens: tokens(allMarkdownBytes),
        description: 'every indexed markdown file loaded in full (hard ceiling)',
      },
      heaviest,
    },
    after: {
      toolDefinitions: { bytes: toolDefsBytes, tokens: constantTokens },
      indexHeldServerSide: { bytes: bytesOf(serialiseIndex(index)), tokens: indexTokenCost(index), sentToModel: false },
      perCall,
      typicalTurnTokens,
    },
    reduction: {
      typicalTurnVsMetadataPct: pct(typicalTurnTokens, tokens(metaBytes)),
      typicalTurnVsAllMarkdownPct: pct(typicalTurnTokens, tokens(allMarkdownBytes)),
      constantVsMetadataPct: pct(constantTokens, tokens(metaBytes)),
      tokensSavedPerSession: tokens(metaBytes) - typicalTurnTokens,
    },
  };
}

function main(): void {
  const root = resolve(arg('root') ?? defaultRoot());
  if (!existsSync(join(root, 'rules'))) {
    process.stderr.write(`✗ not a plugin root (no rules/): ${root}\n`);
    process.exit(1);
  }
  let report: MeasureReport;
  try {
    report = measure(root);
  } catch (err) {
    process.stderr.write(`✗ index build failed: ${String(err)}\n`);
    process.exit(1);
  }
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const out = arg('out');
  if (out) writeFileSync(out, json);
  if (process.argv.includes('--json')) {
    process.stdout.write(json);
    return;
  }
  const { before, after, reduction, entries } = report;
  const lines = [
    `skills-gateway token budget — ${entries.skills} skills · ${entries.rules} rules · ${entries.agents} agents · ${entries.commands} commands`,
    '',
    'BEFORE (per session, before the user types)',
    `  metadata + rule bodies : ~${before.metadata.tokens.toLocaleString()} tok`,
    `  everything in full     : ~${before.allMarkdown.tokens.toLocaleString()} tok`,
    '',
    'AFTER (per session)',
    `  tool definitions       : ~${after.toolDefinitions.tokens.toLocaleString()} tok (constant)`,
    `  typical turn           : ~${after.typicalTurnTokens.toLocaleString()} tok (definitions + one search result)`,
    `  index on disk          : ~${after.indexHeldServerSide.tokens.toLocaleString()} tok (${after.indexHeldServerSide.bytes.toLocaleString()} B, server-side only, never sent)`,
    '',
    'REDUCTION',
    `  typical turn vs metadata  : ${reduction.typicalTurnVsMetadataPct}% smaller`,
    `  typical turn vs full load : ${reduction.typicalTurnVsAllMarkdownPct}% smaller`,
    `  saved per session         : ~${reduction.tokensSavedPerSession.toLocaleString()} tok`,
  ];
  process.stdout.write(`${lines.join('\n')}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
