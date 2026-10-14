/**
 * Normalized keyword-opportunity model for the keyword-research service.
 *
 * Everything is validated at the runtime boundary with Zod and the TypeScript
 * types are *inferred* from the schemas (never hand-duplicated) per the
 * Zod-Everywhere doctrine.
 *
 * Design rules baked into the schema:
 *  - Optional *metrics* are `z.nullable`, NEVER defaulted to 0. A missing
 *    search volume is `null` ("we don't know"), which is categorically
 *    different from `0` ("we know it's zero"). The scorer treats these
 *    differently: `null` drops a dimension and renormalizes; `0` is a real,
 *    low-but-known value.
 *  - Provenance + freshness + confidence are first-class, not afterthoughts.
 */
import { z } from 'zod';

/** How a human (or an LLM classifier) reads the dominant intent of a query. */
export const SearchIntent = z.enum([
  'commercial',
  'informational',
  'navigational',
  'transactional',
  'comparison',
  'local',
  'mixed',
]);
export type SearchIntent = z.infer<typeof SearchIntent>;

/** Direction of the demand trend. `null` = not enough series data to call it. */
export const TrendDirection = z.enum(['rising', 'flat', 'declining']).nullable();
export type TrendDirection = z.infer<typeof TrendDirection>;

/** What we recommend doing about this keyword given the full picture. */
export const RecommendedAction = z.enum([
  'create_new',
  'improve_existing',
  'consolidate',
  'supporting_blog',
  'comparison_content',
  'monitor',
  'reject',
]);
export type RecommendedAction = z.infer<typeof RecommendedAction>;

/**
 * A single piece of provenance: which source produced which field, when, and
 * how much we trust it. Kept deliberately loose on `value` because sources are
 * heterogeneous (number, string, object), but every record is attributable.
 */
export const SourceProvenanceEntry = z.object({
  /** e.g. "gsc", "dataforseo", "ahrefs", "google_trends", "serp_scrape", "llm". */
  source: z.string().min(1),
  /** Dotted field path this source contributed, e.g. "monthly_search_volume". */
  field: z.string().min(1),
  /** ISO 8601 timestamp the underlying datum was observed. */
  observed_at: z.string().datetime(),
  /** 0..1 trust in this specific datum from this specific source. */
  confidence: z.number().min(0).max(1),
  /** Optional free-form note (sampling method, API endpoint, etc.). */
  note: z.string().optional(),
});
export type SourceProvenanceEntry = z.infer<typeof SourceProvenanceEntry>;

/** Evidence that a competitor ranks/bids for, or has content on, this keyword. */
export const CompetitorEvidence = z.object({
  domain: z.string().min(1),
  /** Best-known organic rank for the competitor on this keyword, if any. */
  organic_position: z.number().int().min(1).nullable(),
  /** URL of the competitor page that ranks/targets this keyword, if known. */
  url: z.string().url().nullable(),
  /** Whether the competitor appears to actively target this keyword. */
  targets_keyword: z.boolean(),
  note: z.string().optional(),
});
export type CompetitorEvidence = z.infer<typeof CompetitorEvidence>;

/** Per-month seasonality index (0..1, relative to the keyword's own peak). */
export const SeasonalityPoint = z.object({
  /** 1..12 */
  month: z.number().int().min(1).max(12),
  /** 0..1 normalized demand for that month. */
  index: z.number().min(0).max(1),
});
export type SeasonalityPoint = z.infer<typeof SeasonalityPoint>;

/**
 * The normalized, scored keyword opportunity. This is the canonical shape the
 * rest of the system reads and writes. Field order mirrors the spec exactly.
 */
export const KeywordOpportunity = z.object({
  // --- Identity ---
  keyword: z.string().min(1),
  locale: z.string().min(2), // BCP-47-ish, e.g. "en-US"
  geography: z.string().min(1), // e.g. "United States", "90210", "global"
  language: z.string().min(2), // ISO 639-1, e.g. "en"

  // --- Intent ---
  search_intent: SearchIntent,
  /** 0..1 confidence in the classified intent. */
  intent_confidence: z.number().min(0).max(1),
  /** Human/LLM-assigned topical cluster this keyword belongs to. */
  topic_cluster: z.string().min(1),

  // --- Demand (nullable metrics — never defaulted to 0) ---
  monthly_search_volume: z.number().min(0).nullable(),
  /** Which source the volume came from, if any. */
  volume_source: z.string().min(1).nullable(),

  // --- Competition (organic vs paid kept SEPARATE on purpose) ---
  /** 0..100 organic difficulty (KD). Higher = harder to rank. */
  organic_keyword_difficulty: z.number().min(0).max(100).nullable(),
  /** 0..1 paid competition density. */
  paid_competition: z.number().min(0).max(1).nullable(),
  /** Cost per click in the keyword's currency (metric; nullable). */
  cpc: z.number().min(0).nullable(),

  // --- Google Search Console (first-party signal) ---
  gsc_impressions: z.number().min(0).nullable(),
  gsc_clicks: z.number().min(0).nullable(),
  /** Click-through rate as a 0..1 fraction. */
  gsc_ctr: z.number().min(0).max(1).nullable(),
  /** Average position (1 = top). */
  gsc_average_position: z.number().min(1).nullable(),

  // --- Trend ---
  trend_direction: TrendDirection,
  /** 0..1 strength of the trend (how fast it's moving). */
  trend_momentum: z.number().min(0).max(1).nullable(),
  /** Optional 12-point seasonality curve. */
  seasonality: z.array(SeasonalityPoint).nullable(),

  // --- Competitive landscape ---
  competitor_evidence: z.array(CompetitorEvidence),

  // --- Site mapping / recommendation ---
  /** URL of our existing page already ranking/targeting this, if any. */
  existing_matching_page: z.string().url().nullable(),
  /** URL we recommend creating or improving. */
  recommended_url: z.string().min(1).nullable(),
  recommended_action: RecommendedAction,

  // --- Scoring ---
  /** 0..100 opportunity score from the deterministic scorer. */
  opportunity_score: z.number().min(0).max(100),
  /** Human-readable explanation of how the score was derived. */
  scoring_explanation: z.string().min(1),

  // --- Provenance / freshness / confidence ---
  source_provenance: z.array(SourceProvenanceEntry),
  /** ISO 8601 timestamp this record was assembled. */
  collected_at: z.string().datetime(),
  /** 0..1 overall freshness (1 = just collected, decays over time). */
  data_freshness: z.number().min(0).max(1),
  /** 0..1 overall confidence in this opportunity record. */
  confidence: z.number().min(0).max(1),
});
export type KeywordOpportunity = z.infer<typeof KeywordOpportunity>;

/**
 * Partial per-source inputs, BEFORE normalization/scoring. Each block is
 * optional because any given harvest run may have only a subset of sources.
 * The scorer reads from this shape; absent blocks => dimensions drop + the
 * surviving weights renormalize.
 */
export const RawSignals = z.object({
  keyword: z.string().min(1),
  locale: z.string().min(2).optional(),

  /** Business-fit signal, typically from an LLM or manual tagging. */
  relevance: z
    .object({
      /** 0..1 how relevant this keyword is to the business. */
      business_relevance: z.number().min(0).max(1).optional(),
      topic_cluster: z.string().min(1).optional(),
      intent: SearchIntent.optional(),
      intent_confidence: z.number().min(0).max(1).optional(),
    })
    .optional(),

  /** Third-party volume / competition (DataForSEO, Ahrefs, Semrush, etc.). */
  volume: z
    .object({
      monthly_search_volume: z.number().min(0).optional(),
      source: z.string().min(1).optional(),
      organic_keyword_difficulty: z.number().min(0).max(100).optional(),
      paid_competition: z.number().min(0).max(1).optional(),
      cpc: z.number().min(0).optional(),
    })
    .optional(),

  /** First-party Google Search Console metrics. */
  gsc: z
    .object({
      impressions: z.number().min(0).optional(),
      clicks: z.number().min(0).optional(),
      ctr: z.number().min(0).max(1).optional(),
      average_position: z.number().min(1).optional(),
    })
    .optional(),

  /** Trend series signal (Google Trends, Glimpse, etc.). */
  trend: z
    .object({
      direction: z.enum(['rising', 'flat', 'declining']).optional(),
      momentum: z.number().min(0).max(1).optional(),
      seasonality: z.array(SeasonalityPoint).optional(),
    })
    .optional(),

  /** SERP / competitor scrape. */
  competition: z
    .object({
      competitor_evidence: z.array(CompetitorEvidence).optional(),
      /** 0..1 how "original"/under-served this angle is for us. */
      originality: z.number().min(0).max(1).optional(),
    })
    .optional(),
});
export type RawSignals = z.infer<typeof RawSignals>;

/**
 * One page as OBSERVED by the site-inventory crawler — the raw, no-credentials
 * polish signal that tells the pipeline which URLs the site already publishes.
 *
 * Deliberately a FLAT, source-faithful record of what the HTML actually carried:
 *  - Every text field is `null` when the tag was absent (missing `<title>` ⇒
 *    `title: null`), NEVER an empty string and NEVER invented — the same
 *    "null means we don't know" doctrine the metric fields follow.
 *  - `headings` holds the page's `<h2>`/`<h3>` text in document order; `[]` when
 *    none were found. (`<h1>` is split out into its own field.)
 *
 * This is the crawler's OUTPUT contract. The page-map's `ExistingPage` (which the
 * matcher/pipeline consume) is a richer, interpreted shape; a thin adapter derives
 * `ExistingPage` from a `PageRecord` at the wiring boundary (never the reverse).
 */
export const PageRecord = z.object({
  /** Normalized absolute URL (fragment dropped, trailing slash stripped). */
  url: z.string().url(),
  /** `<title>` text, or `null` when the page had none. */
  title: z.string().nullable(),
  /** First `<h1>` text, or `null` when the page had none. */
  h1: z.string().nullable(),
  /** `<meta name="description">` content, or `null` when absent. */
  metaDescription: z.string().nullable(),
  /** `<h2>`/`<h3>` text in document order; `[]` when none. */
  headings: z.array(z.string()),
});
export type PageRecord = z.infer<typeof PageRecord>;
