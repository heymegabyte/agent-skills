/**
 * Keyword → page map: the persistent memory of which URL owns which keyword,
 * plus the logic that decides whether a new opportunity should IMPROVE an
 * existing page or CREATE a new one — and whether we're about to cannibalize
 * ourselves.
 *
 * Two concerns live here, deliberately separated:
 *
 *  1. PERSISTENCE (`loadPageMap` / `savePageMap`) — a tiny JSON document that
 *     survives between runs. I/O is INJECTED (`readFile` / `writeFile`), so the
 *     pure matching logic never touches the disk and tests run with an in-memory
 *     fake. A missing/corrupt file loads as an empty map (fail-soft) rather than
 *     throwing — a first run has no map yet.
 *
 *  2. MATCHING (`matchExistingPage`) — given an opportunity + the site's page
 *     inventory, find the page already serving this keyword/intent and emit a
 *     `recommended_action` hint (improve_existing vs create_new) and an
 *     EVIDENCE-BASED cannibalization flag. Cannibalization is NOT a naive
 *     substring match — it fires only when MULTIPLE existing pages genuinely
 *     serve the SAME intent for the SAME stem (the real SEO failure mode), and
 *     carries the offending URLs as evidence.
 *
 * Nothing here fabricates a URL or a ranking; an unknown match is `null`.
 */
import { z } from 'zod';
import type { KeywordOpportunity, SearchIntent } from './types';
import { stemKeyword } from './cluster';

/* ------------------------------------------------------------------ */
/* Persistence model.                                                  */
/* ------------------------------------------------------------------ */

/** One remembered keyword→page assignment. */
export const PageMapEntry = z.object({
  keyword: z.string().min(1),
  /** The URL (or path) we assigned this keyword to. */
  url: z.string().min(1),
  intent: z.string().min(1),
  /** ISO 8601 timestamp this assignment was last written. */
  updated_at: z.string().datetime(),
});
export type PageMapEntry = z.infer<typeof PageMapEntry>;

/** The persisted document: a version tag + the entries, keyed by keyword. */
export const PageMapDoc = z.object({
  version: z.literal(1),
  entries: z.record(z.string(), PageMapEntry),
});
export type PageMapDoc = z.infer<typeof PageMapDoc>;

/** A fresh, empty map. */
export function emptyPageMap(): PageMapDoc {
  return { version: 1, entries: {} };
}

/** Injected file readers/writers so the logic stays hermetic + testable. */
export interface PageMapIo {
  /** Return the file's text, or `null` if it does not exist. */
  readFile: (path: string) => Promise<string | null>;
  writeFile: (path: string, data: string) => Promise<void>;
}

/**
 * Load the map from `path`. A missing file → an empty map. A present-but-corrupt
 * file → an empty map too (fail-soft; we never crash a run over a bad cache),
 * but the parse error is returned so a caller can surface it as a limitation.
 */
export async function loadPageMap(
  io: PageMapIo,
  path: string,
): Promise<{ map: PageMapDoc; warning: string | null }> {
  const text = await io.readFile(path);
  if (text === null) return { map: emptyPageMap(), warning: null };
  try {
    const parsed = PageMapDoc.parse(JSON.parse(text));
    return { map: parsed, warning: null };
  } catch (e) {
    return {
      map: emptyPageMap(),
      warning: `Page map at ${path} was unreadable (${(e as Error).message}); starting from an empty map.`,
    };
  }
}

/** Serialize + write the map (pretty-printed, stable key order). */
export async function savePageMap(io: PageMapIo, path: string, map: PageMapDoc): Promise<void> {
  // Sort entries by keyword so the file diff is stable run-to-run.
  const sortedEntries: Record<string, PageMapEntry> = {};
  for (const key of Object.keys(map.entries).sort()) {
    const entry = map.entries[key];
    if (entry) sortedEntries[key] = entry;
  }
  const doc: PageMapDoc = { version: 1, entries: sortedEntries };
  await io.writeFile(path, `${JSON.stringify(doc, null, 2)}\n`);
}

/**
 * Upsert an assignment into the map (pure — returns a NEW doc, never mutates).
 */
export function upsertAssignment(
  map: PageMapDoc,
  entry: PageMapEntry,
): PageMapDoc {
  return {
    version: 1,
    entries: { ...map.entries, [entry.keyword]: entry },
  };
}

/* ------------------------------------------------------------------ */
/* Matching.                                                           */
/* ------------------------------------------------------------------ */

/** A page the site already has, as supplied by the caller's inventory. */
export const ExistingPage = z.object({
  url: z.string().min(1),
  title: z.string().optional(),
  /** Keywords/phrases the page is understood to already target. */
  targetKeywords: z.array(z.string()).default([]),
  /** The page's primary intent, if known (improves cannibalization accuracy). */
  intent: z.string().optional(),
});
export type ExistingPage = z.infer<typeof ExistingPage>;

/** What `recommended_action` lean the match implies (a HINT, not the final call). */
export type ActionHint = 'improve_existing' | 'create_new';

export interface MatchResult {
  /** The best existing page serving this keyword, or `null` when none. */
  existing_matching_page: string | null;
  /** improve_existing when we found a serving page; create_new otherwise. */
  recommended_action: ActionHint;
  /**
   * True ONLY when MULTIPLE existing pages serve the same intent for this stem —
   * the real cannibalization failure mode. Never a bare substring coincidence.
   */
  cannibalization: boolean;
  /** The offending URLs when `cannibalization` is true (evidence). */
  cannibalizing_urls: string[];
  /** Human-readable rationale for the decision. */
  rationale: string;
}

/** Normalize a phrase for stem comparison. */
function stemOf(phrase: string): string {
  return stemKeyword(phrase);
}

/** Does this page target the keyword's STEM (not a loose substring)? */
function pageTargetsStem(page: ExistingPage, keywordStem: string): boolean {
  return page.targetKeywords.some((kw) => stemOf(kw) === keywordStem);
}

/**
 * Find the existing page serving an opportunity + decide the action hint and the
 * evidence-based cannibalization flag.
 *
 * Decision logic:
 *  1. Collect every inventory page whose targeted keywords STEM-match the
 *     opportunity's keyword. (Stem match, never substring — "crm" must not
 *     match "crminal".)
 *  2. Among those, the pages whose intent ALSO matches the opportunity's intent
 *     are the true "serving" set.
 *  3. existing_matching_page = the first intent-matching page (or, if none match
 *     intent but a stem page exists, that stem page — a weaker match).
 *  4. recommended_action = improve_existing when we found ANY serving page;
 *     create_new when nothing serves it.
 *  5. cannibalization = TRUE iff ≥2 pages match BOTH stem AND intent (two pages
 *     competing for the same query is the failure we flag) — evidence attached.
 */
export function matchExistingPage(
  opp: Pick<KeywordOpportunity, 'keyword' | 'search_intent'>,
  inventory: readonly ExistingPage[],
): MatchResult {
  const keywordStem = stemOf(opp.keyword);
  const intent: SearchIntent = opp.search_intent;

  // Pages that target this stem at all.
  const stemMatches = inventory.filter((p) => pageTargetsStem(p, keywordStem));

  // Of those, the ones whose declared intent ALSO matches (true competitors).
  const intentMatches = stemMatches.filter((p) => p.intent === intent);

  // Cannibalization: 2+ pages serving the SAME stem AND SAME intent.
  const cannibalizing = intentMatches.length >= 2;
  const cannibalizing_urls = cannibalizing ? intentMatches.map((p) => p.url) : [];

  // Best match: prefer an intent-matching page; else fall back to a stem page.
  const best = intentMatches[0] ?? stemMatches[0] ?? null;

  if (best) {
    const matchedOnIntent = intentMatches.length > 0;
    let rationale: string;
    if (cannibalizing) {
      rationale =
        `Multiple existing pages (${cannibalizing_urls.join(', ')}) already target "${opp.keyword}" ` +
        `with ${intent} intent — consolidate before adding more.`;
    } else if (matchedOnIntent) {
      rationale = `Existing page ${best.url} already serves "${opp.keyword}" (${intent}); improve it rather than create a duplicate.`;
    } else {
      rationale = `Existing page ${best.url} covers the topic but with a different intent; improving it may suffice, but verify intent fit.`;
    }
    return {
      existing_matching_page: best.url,
      recommended_action: 'improve_existing',
      cannibalization: cannibalizing,
      cannibalizing_urls,
      rationale,
    };
  }

  // Nothing serves this keyword → a genuine gap.
  return {
    existing_matching_page: null,
    recommended_action: 'create_new',
    cannibalization: false,
    cannibalizing_urls: [],
    rationale: `No existing page targets "${opp.keyword}" (${intent}); this is a content gap.`,
  };
}

/* ------------------------------------------------------------------ */
/* Default (real) filesystem IO — thin Node wrapper, injected in prod. */
/* ------------------------------------------------------------------ */

/**
 * Build a real filesystem IO backed by `node:fs/promises`. Kept out of the pure
 * path so importing this module never forces a Node dependency on the Worker.
 */
export function nodeFsIo(fs: {
  readFile: (p: string, enc: 'utf8') => Promise<string>;
  writeFile: (p: string, data: string, enc: 'utf8') => Promise<void>;
  mkdir: (p: string, opts: { recursive: true }) => Promise<string | undefined>;
}): PageMapIo & {
  readFile: (path: string) => Promise<string | null>;
} {
  return {
    async readFile(path: string): Promise<string | null> {
      try {
        return await fs.readFile(path, 'utf8');
      } catch (e) {
        // ENOENT (first run) → null; anything else re-throws.
        if ((e as NodeJS.ErrnoException)?.code === 'ENOENT') return null;
        throw e;
      }
    },
    async writeFile(path: string, data: string): Promise<void> {
      const dir = path.replace(/\/[^/]*$/, '');
      if (dir && dir !== path) await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path, data, 'utf8');
    },
  };
}
