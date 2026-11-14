/**
 * search.ts — ranked retrieval over the gateway index.
 *
 * Ranking is deliberately dependency-free and explainable: every token from the
 * query is scored against discrete fields with fixed weights, an exact-name hit
 * short-circuits to the top, and a priority tiebreak favours always-load rules.
 *
 * @module
 */
import type { IndexEntry, EntryKind } from './index-builder.js';

export interface RankedHit {
  entry: IndexEntry;
  score: number;
  /** Which field produced the strongest single match. */
  matchField: 'name' | 'path' | 'description' | 'terms';
  /** Matched query tokens, in query order. */
  matchedTokens: string[];
}

export const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'do', 'for', 'from', 'how', 'i',
  'if', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'so', 'that', 'the', 'to',
  'use', 'was', 'what', 'when', 'where', 'which', 'who', 'why', 'with', 'you',
]);

const WEIGHT = {
  name: 60,
  path: 20,
  description: 10,
  terms: 4,
} as const;

const EXACT_NAME_BONUS = 250;
const PRIORITY_1_BONUS = 6;
const SKILL_BONUS = 3;

/** Lowercase, split on non-word chars, drop stopwords. */
export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9+\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^-+|-+$/g, ''))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

/** Lowercase, strip punctuation, and expand the handful of ops abbreviations. */
const ACRONYMS: Record<string, string> = {
  i18n: 'internationalization multilingual localization',
  a11y: 'accessibility',
  cwv: 'core web vitals performance',
  rls: 'row level security',
  pseo: 'programmatic seo',
  geo: 'generative engine optimization ai search',
  llm: 'large language model',
  mcp: 'model context protocol',
  do: 'durable object',
  og: 'open graph',
};

function expandTerms(terms: string): string {
  const out = [terms];
  for (const [short, long] of Object.entries(ACRONYMS)) {
    if (new RegExp(`(^|[^a-z0-9])${short}([^a-z0-9]|$)`).test(terms)) out.push(long);
  }
  return out.join(' ');
}

function scoreEntry(entry: IndexEntry, tokens: string[]): { score: number; field: RankedHit['matchField']; matched: string[] } {
  const name = entry.name.toLowerCase();
  const names = [name, ...entry.aliases.map((a) => a.toLowerCase())];
  const path = entry.path.toLowerCase();
  const description = entry.description.toLowerCase();
  const terms = expandTerms(entry.terms);

  let score = 0;
  let field: RankedHit['matchField'] = 'terms';
  const matched: string[] = [];

  for (const token of tokens) {
    let hit = 0;
    if (names.some((n) => n.includes(token))) hit += WEIGHT.name;
    // The folder slug contributes once, not once per token it shares.
    if (path.includes(token)) hit += WEIGHT.path;
    if (description.includes(token)) hit += WEIGHT.description;
    if (terms.includes(token)) hit += WEIGHT.terms;
    if (hit > 0) {
      matched.push(token);
      score += hit;
      // Report the strongest field seen for the leading token only.
      if (matched.length === 1) {
        field = names.some((n) => n.includes(token))
          ? 'name'
          : description.includes(token)
            ? 'description'
            : path.includes(token)
              ? 'path'
              : 'terms';
      }
    }
  }

  if (matched.length === 0) return { score: 0, field, matched };


  // Require at least half the query tokens (min 1) to match, so a single
  // incidental word does not surface an unrelated skill.
  const need = Math.max(1, Math.ceil(tokens.length / 2));
  if (matched.length < need) return { score: 0, field, matched };

  // A name or alias token ("05-architecture-and-stack") is a stronger identity
  // signal than a word inside a description; an exact name hit wins outright.
  // Only the entry's own name contributes a slug bonus. Directory aliases are
  // shared by every file in the folder, so they must not lift a sibling above
  // the canonical skill the caller asked for.
  // A name token wins for weak queries ("stripe") but must not drown out a
  // multi-token query whose words are spread across description and tags.
  const nameTokenBonus = tokens.length === 1 ? EXACT_NAME_BONUS : EXACT_NAME_BONUS / 5;
  if (tokens.some((t) => t.length > 4 && name.includes(t))) score += nameTokenBonus;
  const normalised = tokens.join(' ');
  // Asking for a whole skill folder ("05-architecture-and-stack") ranks its
  // SKILL.md above the reference docs beside it.
  if (normalised === entry.path.split('/')[0]) {
    score += /\/SKILL\.md$/.test(entry.path) ? EXACT_NAME_BONUS * 3 : EXACT_NAME_BONUS / 2;
  }
  // `entry.name` is the public handle; aliases are lookups. A direct handle
  // hit must beat an alias hit on a sibling file.
  const exact = name === normalised;
  const strippedExact = name.replace(/^\d+-/, '') === normalised;
  const aliasExact = !exact && names.some((n) => n === normalised);
  // Directory aliases are shared by every file in that directory, so an alias
  // hit alone is weaker than a hit on the file's own name.
  if (exact) score += EXACT_NAME_BONUS * 8;
  else if (strippedExact) score += EXACT_NAME_BONUS * 4;
  else if (aliasExact) score += EXACT_NAME_BONUS * 2;
  if (entry.priority === 1) score += PRIORITY_1_BONUS;
  if (entry.kind === 'skill') {
    // The canonical SKILL.md of a directory outranks the reference docs beside it
    // when the directory slug is what the caller asked for.
    score += /\/SKILL\.md$/.test(entry.path) ? SKILL_BONUS * 3 : SKILL_BONUS;
  }

  return { score, field, matched };
}

/**
 * Rank entries for a query.
 *
 * @param entries  The full index.
 * @param query    Natural-language query.
 * @param opts.kind    Restrict to one entry kind.
 * @param opts.limit   Max hits (default 10).
 */
export function searchEntries(
  entries: readonly IndexEntry[],
  query: string,
  opts: { kind?: EntryKind; limit?: number } = {},
): RankedHit[] {
  const tokens = tokenize(expandTerms(query));
  if (tokens.length === 0) return [];
  const limit = Math.min(Math.max(opts.limit ?? 10, 1), 25);

  const hits: RankedHit[] = [];
  for (const entry of entries) {
    if (opts.kind && entry.kind !== opts.kind) continue;
    const { score, field, matched } = scoreEntry(entry, tokens);
    if (score > 0) hits.push({ entry, score, matchField: field, matchedTokens: matched });
  }

  hits.sort(
    (a, b) =>
      b.score - a.score ||
      a.entry.name.localeCompare(b.entry.name) ||
      a.entry.path.localeCompare(b.entry.path),
  );
  return hits.slice(0, limit);
}

/** Render one hit as a compact, token-cheap result block. */
export function formatHit(hit: RankedHit): string {
  const { entry } = hit;
  const meta = [entry.kind, `score ${Math.round(hit.score)}`];
  if (entry.priority !== null) meta.push(`priority ${entry.priority}`);
  return [
    `### ${entry.name} — ${meta.join(' · ')}`,
    `path: ${entry.path}`,
    `desc: ${truncate(entry.description, 220)}`,
    `loaded by: load_skill({ name: "${entry.name}" })`,
  ].join('\n');
}

/** Render a ranked result list. Omits the header when empty is caller-handled. */
export function formatHits(hits: readonly RankedHit[], query: string): string {
  return hits.map(formatHit).join('\n\n');
}

export function truncate(s: string, max: number): string {
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}
