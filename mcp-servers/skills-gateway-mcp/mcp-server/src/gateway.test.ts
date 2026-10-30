/**
 * Unit + integration tests for the skills-gateway index, search, and formatters.
 *
 * Runs against the real plugin directory (the gateway must index THIS repo) and
 * against a small fixture tree for edge cases. No network, no MCP transport —
 * the server module exports `createServer` and `extractSection` for direct calls.
 *
 * @module
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  approxTokens,
  buildIndex,
  serialiseIndex,
  parseFrontmatter,
  INDEX_FILENAME,
} from './index-builder.js';
import { searchEntries, tokenize } from './search.js';
import { measure } from './measure.js';
import { extractSection, loadIndex } from './index.js';
import { TOOL_DEFINITIONS, SearchSkillsInputSchema, LoadSkillInputSchema, FindRuleInputSchema } from './tools.js';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'skills-gateway-'));
  for (const [rel, body] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }
  return root;
}

// ── Frontmatter ─────────────────────────────────────────────────────────────

test('parseFrontmatter reads scalars, inline arrays, block arrays, and numbers', () => {
  const fm = parseFrontmatter(
    ['---', 'name: deploy', 'priority: 1', 'paths: ["*"]', 'tags:', '  - cloudflare', '  - workers', '---', 'body'].join('\n'),
  );
  assert.equal(fm.name, 'deploy');
  assert.equal(fm.priority, 1);
  assert.deepEqual(fm.paths, ['*']);
  assert.deepEqual(fm.tags, ['cloudflare', 'workers']);
});

test('parseFrontmatter returns {} when there is no frontmatter', () => {
  assert.deepEqual(parseFrontmatter('# Title\n\ntext'), {});
});

// ── Index ───────────────────────────────────────────────────────────────────

test('buildIndex indexes real skills, rules, and agents without embedding bodies', () => {
  const index = buildIndex(REPO_ROOT);
  assert.ok(index.entries.length > 150, `expected >150 entries, got ${index.entries.length}`);
  for (const kind of ['skill', 'rule', 'agent'] as const) {
    assert.ok(index.entries.some((e) => e.kind === kind), `missing ${kind} entries`);
  }
  const serialised = serialiseIndex(index);
  const bodyLen = index.entries.reduce((s, e) => s + e.sizeBytes, 0);
  assert.ok(serialised.length < bodyLen, 'index must be smaller than the raw corpus');
});

test('buildIndex is deterministic for an unchanged tree', () => {
  const a = buildIndex(REPO_ROOT);
  const b = buildIndex(REPO_ROOT);
  assert.equal(a.digest, b.digest);
  assert.deepEqual(a.entries.map((e) => e.path), b.entries.map((e) => e.path));
});

test('buildIndex picks up nested skill references under NN-<slug>/', () => {
  const root = fixture({
    '05-stack/SKILL.md': '---\nname: stack\ndescription: stack guidance\n---\n# Stack\n',
    '05-stack/references/deeper.md': '---\nname: deeper\ndescription: nested reference\n---\n# Deeper\n',
    'rules/always.md': '---\nname: always\npriority: 1\n---\n# Always\n',
    'agents/architect.md': '---\nname: architect\ndescription: system design\n---\n# Architect\n',
  });
  try {
    const index = buildIndex(root);
    const paths = index.entries.map((e) => e.path).sort();
    assert.deepEqual(paths, ['05-stack/SKILL.md', '05-stack/references/deeper.md', 'agents/architect.md', 'rules/always.md']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('buildIndex skips node_modules and dot directories', () => {
  const root = fixture({
    'rules/keep.md': '---\nname: keep\n---\n# Keep\n',
    'rules/node_modules/x.md': '---\nname: x\n---\n# X\n',
    'rules/.hidden/y.md': '---\nname: y\n---\n# Y\n',
  });
  try {
    assert.deepEqual(
      buildIndex(root).entries.map((e) => e.path),
      ['rules/keep.md'],
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('loadIndex writes and reuses the on-disk cache', () => {
  const root = fixture({ 'rules/r.md': '---\nname: r\ndescription: one\n---\n# R\n' });
  try {
    const previous = process.env.SKILLS_GATEWAY_NO_CACHE;
    delete process.env.SKILLS_GATEWAY_NO_CACHE;
    try {
      const first = loadIndex(root);
      assert.ok(existsSync(join(root, INDEX_FILENAME)));
      const second = loadIndex(root);
      assert.equal(second.digest, first.digest);
    } finally {
      if (previous !== undefined) process.env.SKILLS_GATEWAY_NO_CACHE = previous;
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ── Search ──────────────────────────────────────────────────────────────────

test('tokenize drops stopwords and punctuation', () => {
  assert.deepEqual(tokenize('How do I deploy to Cloudflare Workers?'), ['deploy', 'cloudflare', 'workers']);
});

test('search_skills ranks the canonical SKILL.md first for a directory slug', () => {
  const index = buildIndex(REPO_ROOT);
  const [top] = searchEntries(index.entries, '05-architecture-and-stack');
  assert.equal(top.entry.path, '05-architecture-and-stack/SKILL.md');
});

test('search_skills ranks a skill by its public frontmatter name', () => {
  const index = buildIndex(REPO_ROOT);
  const [top] = searchEntries(index.entries, 'architecture-and-stack');
  assert.equal(top.entry.name, 'architecture-and-stack');
  assert.equal(top.entry.path, '05-architecture-and-stack/SKILL.md');
});

test('search_skills finds skills by intent wording', () => {
  const index = buildIndex(REPO_ROOT);
  const hits = searchEntries(index.entries, 'stripe payments');
  assert.ok(hits.length > 0, 'expected payment hits');
  assert.ok(
    hits.some((h) => /payment|stripe|billing/i.test(`${h.entry.name} ${h.entry.description}`)),
    `unrelated results: ${hits.map((h) => h.entry.name).join(', ')}`,
  );
});

test('search_skills kind filter returns only that kind', () => {
  const index = buildIndex(REPO_ROOT);
  const hits = searchEntries(index.entries, 'deploy', { kind: 'rule', limit: 10 });
  assert.ok(hits.length > 0);
  assert.ok(hits.every((h) => h.entry.kind === 'rule'));
});

test('search_skills requires half the query tokens to match', () => {
  const index = buildIndex(REPO_ROOT);
  const hits = searchEntries(index.entries, 'cloudflare zzzzqqqq');
  assert.ok(hits.length > 0);
  assert.ok(hits.every((h) => h.matchedTokens.length >= 1));
});

test('search_skills returns nothing for gibberish', () => {
  const index = buildIndex(REPO_ROOT);
  assert.deepEqual(searchEntries(index.entries, 'xylophonezzzz'), []);
});

// ── find_rule ───────────────────────────────────────────────────────────────

test('find_rule finds rules for a doctrine topic', () => {
  const index = buildIndex(REPO_ROOT);
  const hits = searchEntries(index.entries, 'feature flags', { kind: 'rule' });
  assert.ok(hits.length > 0, 'expected a feature-flags rule');
  assert.ok(hits.every((h) => h.entry.kind === 'rule'));
});

// ── Sections ────────────────────────────────────────────────────────────────

test('extractSection returns the body under a heading, exclusive of siblings', () => {
  const md = '# Title\n\n## Alpha\n\nalpha body\n\n### Nested\n\nnested body\n\n## Beta\n\nbeta body\n';
  assert.equal(extractSection(md, 'alpha'), '## Alpha\n\nalpha body\n\n### Nested\n\nnested body');
  assert.equal(extractSection(md, 'BETA'), '## Beta\n\nbeta body');
  assert.equal(extractSection(md, 'missing'), null);
});

// ── Measurement ─────────────────────────────────────────────────────────────

test('measure reports a large, real reduction against at least one baseline', () => {
  const report = measure(REPO_ROOT);
  assert.ok(report.before.metadata.tokens > 10_000, 'before baseline should be substantial');
  assert.ok(report.after.toolDefinitions.tokens < 1_000, 'tool definitions must stay ~1K');
  assert.ok(report.after.typicalTurnTokens < 2_000, 'a typical turn must stay ~1K');
  const factor = report.before.metadata.tokens / report.after.typicalTurnTokens;
  assert.ok(factor > 20, `expected >20x reduction, got ${factor.toFixed(1)}x`);
  assert.equal(report.after.indexHeldServerSide.sentToModel, false);
});

test('measure is stable across runs', () => {
  const a = measure(REPO_ROOT);
  const b = measure(REPO_ROOT);
  assert.equal(a.after.toolDefinitions.tokens, b.after.toolDefinitions.tokens);
  assert.equal(a.after.typicalTurnTokens, b.after.typicalTurnTokens);
});

// ── Tool contracts ──────────────────────────────────────────────────────────

test('exactly three tools are exposed with non-empty descriptions', () => {
  assert.equal(TOOL_DEFINITIONS.length, 3);
  for (const tool of TOOL_DEFINITIONS) assert.ok(tool.description.trim().length > 20, tool.name);
});

test('Zod schemas reject unknown keys and out-of-range limits', () => {
  assert.equal(SearchSkillsInputSchema.safeParse({ query: 'x', bogus: 1 }).success, false);
  assert.equal(SearchSkillsInputSchema.safeParse({ query: 'x', max_results: 99 }).success, false);
  assert.equal(FindRuleInputSchema.safeParse({ topic: 'x', max_results: 0 }).success, false);
  assert.equal(LoadSkillInputSchema.safeParse({ name: '' }).success, false);
  assert.equal(SearchSkillsInputSchema.safeParse({ query: 'deploy' }).success, true);
});

test('approxTokens uses the repo 4-bytes-per-token ratio', () => {
  assert.equal(approxTokens(4), 1);
  assert.equal(approxTokens(5), 2);
});
