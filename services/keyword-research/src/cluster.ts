/**
 * Clustering: group opportunities that should be served by the SAME page.
 *
 * Two keywords belong in one cluster when they share a destination: the same
 * stemmed head term, the same search intent, and the same likely destination
 * slug. Grouping by all three avoids the classic failure where "crm pricing"
 * (transactional → /pricing) and "what is a crm" (informational → /blog/…) get
 * fused just because they share the token "crm".
 *
 * THE INVARIANT this module guarantees: within a cluster there is EXACTLY ONE
 * primary (the highest-scoring member); every other member is `supporting`.
 * Never two primaries for one page — that's the keyword-cannibalization bug the
 * whole control plane exists to prevent. Ties break deterministically
 * (higher volume, then alphabetical) so the output is stable.
 *
 * PURE: output depends only on the input array. No clock, no RNG, no I/O.
 */
import type { KeywordOpportunity, SearchIntent } from './types';

/** A member's role within its cluster. */
export type ClusterRole = 'primary' | 'supporting';

/** A keyword's placement in the cluster map. */
export interface ClusteredKeyword {
  keyword: string;
  role: ClusterRole;
  /** The member's opportunity score (copied for convenient ranking). */
  score: number;
}

/** One topical cluster → one target page. */
export interface KeywordCluster {
  /** Stable cluster id: `${stem}::${intent}::${destination}`. */
  id: string;
  /** The stemmed head term the cluster is built around. */
  stem: string;
  /** The shared intent of the cluster. */
  intent: SearchIntent;
  /** The likely destination slug all members map to. */
  destination: string;
  /** The single primary keyword (highest score). */
  primaryKeyword: string;
  /** Every member with its role + score, primary first. */
  members: ClusteredKeyword[];
}

/* ------------------------------------------------------------------ */
/* Stemming — intentionally light. A tiny, deterministic normalizer    */
/* that folds trivial morphological variants together without pulling   */
/* in a Porter-stemmer dependency.                                     */
/* ------------------------------------------------------------------ */

/** English stop words we drop from the head-term signature. */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'for', 'to', 'of', 'in', 'on', 'and', 'or', 'with', 'your',
  'my', 'best', 'top', 'how', 'what', 'why', 'is', 'are', 'vs', 'versus',
]);

/**
 * Crude singularizer: strip a few common plural suffixes WITHOUT over-stripping.
 * The order matters, and the `-es` rule only fires after a sibilant stem
 * (`-ses/-xes/-zes/-ches/-shes`) — so "features" → "feature" (just the `s`), not
 * "featur". "boxes" → "box", "classes" → "class", "berries" → "berry".
 */
function singularize(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  // Sibilant plurals: the `e` is part of the plural marker, so drop "es".
  if (/(ss|x|z|ch|sh)es$/.test(token)) return token.slice(0, -2);
  // Everything else plural: drop only the trailing "s" (but never a "-ss").
  if (token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

/**
 * Produce a deterministic stem signature for a keyword: lowercase, split on
 * non-alphanumerics, drop stop words, singularize, SORT (so word order doesn't
 * matter — "crm best" and "best crm" share a stem), and rejoin. An empty result
 * (all stop words) falls back to the normalized raw phrase so nothing collapses
 * into a single mega-cluster.
 */
export function stemKeyword(keyword: string): string {
  const tokens = keyword
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t))
    .map(singularize)
    .filter((t) => t.length > 0);

  if (tokens.length === 0) {
    return keyword.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  return [...tokens].sort().join(' ');
}

/**
 * Derive the likely destination slug for an opportunity. Prefers an explicit
 * `recommended_url`, else an `existing_matching_page` path, else a stem-derived
 * slug. This is what makes same-stem/same-intent keywords that nonetheless point
 * at DIFFERENT pages stay in different clusters.
 */
export function likelyDestination(opp: KeywordOpportunity, stem: string): string {
  const fromRecommended = opp.recommended_url?.trim();
  if (fromRecommended) return normalizeSlug(fromRecommended);

  const fromExisting = opp.existing_matching_page?.trim();
  if (fromExisting) return normalizeSlug(pathOf(fromExisting));

  // Fallback: a slug derived from the stem (keeps each stem its own page).
  return normalizeSlug(stem.replace(/\s+/g, '-'));
}

/** Extract the pathname from a URL string, tolerating bare paths. */
function pathOf(urlOrPath: string): string {
  try {
    return new URL(urlOrPath).pathname;
  } catch {
    return urlOrPath;
  }
}

/** Normalize a slug/path: lowercase, trim slashes, collapse separators. */
function normalizeSlug(s: string): string {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9/]+/g, '-').replace(/-+/g, '-');
  const trimmed = cleaned.replace(/^\/+|\/+$/g, '').replace(/^-+|-+$/g, '');
  return trimmed === '' ? '/' : trimmed;
}

/* ------------------------------------------------------------------ */
/* Deterministic ordering.                                             */
/* ------------------------------------------------------------------ */

/**
 * Rank two opportunities for "who should be primary": higher score wins; ties
 * break on higher volume (null treated as -1 so a known value beats unknown),
 * then alphabetical keyword for total determinism.
 */
function comparePrimary(a: KeywordOpportunity, b: KeywordOpportunity): number {
  if (b.opportunity_score !== a.opportunity_score) {
    return b.opportunity_score - a.opportunity_score;
  }
  const av = a.monthly_search_volume ?? -1;
  const bv = b.monthly_search_volume ?? -1;
  if (bv !== av) return bv - av;
  return a.keyword.localeCompare(b.keyword);
}

/**
 * Cluster opportunities by (stem + intent + likely destination), assigning
 * exactly one primary per cluster. Returns clusters ordered by their primary's
 * score (desc), each with members ordered primary-first then by the same rule.
 */
export function clusterOpportunities(opps: readonly KeywordOpportunity[]): KeywordCluster[] {
  const buckets = new Map<string, KeywordOpportunity[]>();

  for (const opp of opps) {
    const stem = stemKeyword(opp.keyword);
    const destination = likelyDestination(opp, stem);
    const id = `${stem}::${opp.search_intent}::${destination}`;
    const bucket = buckets.get(id);
    if (bucket) bucket.push(opp);
    else buckets.set(id, [opp]);
  }

  const clusters: KeywordCluster[] = [];
  for (const [id, members] of buckets) {
    // Sort members deterministically; the first is THE primary — never two.
    const sorted = [...members].sort(comparePrimary);
    const primary = sorted[0];
    // A bucket always has ≥1 member by construction; guard for the type system.
    if (!primary) continue;

    const stem = stemKeyword(primary.keyword);
    const destination = likelyDestination(primary, stem);

    const memberRows: ClusteredKeyword[] = sorted.map((opp, i) => ({
      keyword: opp.keyword,
      role: i === 0 ? 'primary' : 'supporting',
      score: opp.opportunity_score,
    }));

    clusters.push({
      id,
      stem,
      intent: primary.search_intent,
      destination,
      primaryKeyword: primary.keyword,
      members: memberRows,
    });
  }

  // Order clusters by their primary's score (desc), tie-break by id for stability.
  clusters.sort((a, b) => {
    const ap = a.members[0]?.score ?? 0;
    const bp = b.members[0]?.score ?? 0;
    if (bp !== ap) return bp - ap;
    return a.id.localeCompare(b.id);
  });

  return clusters;
}

/** Convenience: assert the invariant (exactly one primary per cluster). */
export function assertSinglePrimary(cluster: KeywordCluster): void {
  const primaries = cluster.members.filter((m) => m.role === 'primary');
  if (primaries.length !== 1) {
    throw new Error(
      `cluster ${cluster.id} has ${primaries.length} primaries (must be exactly 1)`,
    );
  }
}
