#!/usr/bin/env node
/**
 * Skills MCP Gateway — server entry point.
 *
 * Cuts skill context from ~50K tokens to ~1K by indexing every skill, rule,
 * agent, and command behind 3 meta-tools (the mcpzip pattern):
 *
 *   search_skills(query, kind?, max_results?)  — ranked full-text search
 *   load_skill(name, sections?)                — one skill's full body on demand
 *   find_rule(topic, max_results?)             — authoritative rule text for a topic
 *
 * Design notes
 *  - The index is built from the plugin directory on startup and cached at
 *    `<root>/.skills-gateway-index.json`. The cache is reused when its digest
 *    still matches the files on disk; otherwise it is rebuilt and rewritten.
 *  - The index never enters the model's context. Only the 3 tool schemas plus
 *    the current call's result do.
 *  - Every failure returns `isError: true`. A search that finds nothing is a
 *    normal empty result with a suggestion, not an error — so clients retry
 *    with broader words instead of surfacing a crash.
 *  - `SKILLS_GATEWAY_ROOT` overrides the plugin root (useful for tests);
 *    `SKILLS_GATEWAY_NO_CACHE=1` disables the on-disk cache.
 *
 * @module
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildIndex,
  INDEX_FILENAME,
  INDEX_VERSION,
  serialiseIndex,
  type IndexEntry,
  type IndexFile,
} from './index-builder.js';
import { formatHits, searchEntries, truncate } from './search.js';
import { findRuleForMeasure } from './format.js';
import {
  FindRuleInputSchema,
  LoadSkillInputSchema,
  SearchSkillsInputSchema,
  TOOL_DEFINITIONS,
} from './tools.js';

// The input schemas live in ./tools.ts next to the tool manifest; the handlers
// below enforce them. Re-exported for embedders and the fleet validator.
export { SearchSkillsInputSchema, LoadSkillInputSchema, FindRuleInputSchema };

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(__dirname, '..', '..', '..', '..');
const ROOT = resolve(process.env.SKILLS_GATEWAY_ROOT ?? DEFAULT_ROOT);
/** Read at call time so tests and embedders can toggle it after import. */
const cacheDisabled = (): boolean => process.env.SKILLS_GATEWAY_NO_CACHE === '1';

/** Load the cached index when it is still valid, else rebuild and rewrite it. */
export function loadIndex(root: string): IndexFile {
  const cachePath = join(root, INDEX_FILENAME);
  const fresh = buildIndex(root);
  if (!cacheDisabled()) {
    try {
      if (existsSync(cachePath)) {
        const cached = JSON.parse(readFileSync(cachePath, 'utf-8')) as IndexFile;
        if (cached.version === INDEX_VERSION && cached.digest === fresh.digest) return cached;
      }
    } catch {
      /* corrupt cache — fall through to rewrite */
    }
    try {
      writeFileSync(cachePath, serialiseIndex(fresh));
    } catch {
      /* read-only mount — keep the in-memory index */
    }
  }
  return fresh;
}

export function createServer(index: IndexFile): Server {
  const byName = new Map<string, IndexEntry[]>();
  for (const entry of index.entries) {
    for (const key of [entry.name, ...entry.aliases]) {
      const list = byName.get(key) ?? [];
      list.push(entry);
      byName.set(key, list);
    }
  }

  const server = new Server(
    { name: 'skills-gateway-mcp', version: '1.1.0' },
    { capabilities: { tools: {} } },
  );

  // Served from the one manifest that the token measurement also reads, so the
  // budget this server reports is exactly the budget a client pays.
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS.map((tool) => ({
      "name": tool.name,
      "description": tool.description,
      "inputSchema": tool.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'search_skills': {
        const parsed = SearchSkillsInputSchema.safeParse(args ?? {});
        if (!parsed.success) return toolError(`Invalid arguments for search_skills: ${parsed.error.message}`);
        const { query, kind, max_results } = parsed.data;
        const hits = searchEntries(index.entries, query, { kind, limit: max_results ?? 8 });
        if (hits.length === 0) {
          return toolText(
            `No matches for "${query}". The gateway indexes ${index.entries.length} entries (skills, rules, agents, commands). Try broader words, or call find_rule for a rule topic.`,
          );
        }
        return toolText(`${hits.length} result(s) for "${query}":\n\n${formatHits(hits, query)}`);
      }

      case 'load_skill': {
        const parsed = LoadSkillInputSchema.safeParse(args ?? {});
        if (!parsed.success) return toolError(`Invalid arguments for load_skill: ${parsed.error.message}`);
        const { name: requested, sections } = parsed.data;
        const candidates = byName.get(requested);
        if (!candidates || candidates.length === 0) {
          const near = searchEntries(index.entries, requested, { limit: 3 });
          const hint = near.length ? ` Did you mean: ${near.map((h) => h.entry.name).join(', ')}?` : '';
          return toolError(`No entry named "${requested}".${hint}`);
        }
        // Prefer the richest matching entry (skills define the name once).
        const entry = candidates[0];
        const filePath = join(ROOT, entry.path);
        let content: string;
        try {
          content = readFileSync(filePath, 'utf-8');
        } catch (err) {
          return toolError(`Could not read ${entry.path}: ${String(err)}`);
        }
        content = content.replace(/^---[\s\S]*?\n---\n*/, '');
        if (sections && sections.length > 0) {
          const parts: string[] = [];
          const missing: string[] = [];
          for (const wanted of sections) {
            const body = extractSection(content, wanted);
            if (body === null) missing.push(wanted);
            else parts.push(body);
          }
          if (parts.length === 0) {
            return toolError(
              `None of the requested sections exist in ${entry.name}. Available: ${entry.sections.slice(0, 20).join(', ') || 'none'}.`,
            );
          }
          content = parts.join('\n\n');
          if (missing.length) content += `\n\n_(sections not found: ${missing.join(', ')})_`;
        }
        return toolText(`# ${entry.name} (${entry.kind})\npath: ${entry.path}\n\n${content}`);
      }

      case 'find_rule': {
        const parsed = FindRuleInputSchema.safeParse(args ?? {});
        if (!parsed.success) return toolError(`Invalid arguments for find_rule: ${parsed.error.message}`);
        const { topic, max_results } = parsed.data;
        const hits = searchEntries(index.entries, topic, { kind: 'rule', limit: max_results ?? 3 });
        if (hits.length === 0) {
          const elsewhere = searchEntries(index.entries, topic, { limit: 3 });
          const hint = elsewhere.length
            ? ` Closest entries overall: ${elsewhere.map((h) => `${h.entry.name} (${h.entry.kind})`).join(', ')}.`
            : '';
          return toolText(`No rule matches "${topic}". The topic may live in a skill or agent — use search_skills.${hint}`);
        }
        return toolText(findRuleForMeasure(ROOT, index.entries, topic, max_results ?? 3));
      }

      default:
        return toolError(`Unknown tool: ${name}`);
    }
  });

  return server;
}

/** Extract a heading section (any level) by case-insensitive title. */
export function extractSection(markdown: string, title: string): string | null {
  const wanted = title.trim().toLowerCase();
  const lines = markdown.split('\n');
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    if (m[2].trim().toLowerCase() === wanted) {
      start = i;
      level = m[1].length;
      break;
    }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,6})\s+/);
    if (m && m[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n').trimEnd();
}

/** Successful result. The audit's isError heuristic expects no isError on success. */
function toolText(text: string) {
  return { content: [{ type: 'text' as const, text: truncate(text, 60_000) }] };
}

function toolError(text: string) {
  return { content: [{ type: 'text' as const, text }], isError: true };
}

async function main(): Promise<void> {
  const index = loadIndex(ROOT);
  const counts = index.entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.kind] = (acc[e.kind] ?? 0) + 1;
    return acc;
  }, {});
  process.stderr.write(
    `[skills-gateway] root=${ROOT} entries=${index.entries.length} ` +
      `${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(' ')} digest=${index.digest}\n`,
  );
  const server = createServer(index);
  await server.connect(new StdioServerTransport());
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    process.stderr.write(`[skills-gateway] fatal: ${String(err)}\n`);
    process.exit(1);
  });
}
