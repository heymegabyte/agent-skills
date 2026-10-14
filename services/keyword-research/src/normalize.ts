/**
 * Normalization: per-source `RawSignals` → a Zod-validated `KeywordOpportunity`.
 *
 * The non-negotiable rule (echoing types.ts + the adapters): a metric we simply
 * don't have is `null` ("unknown"), NEVER `0`. `0` means "we measured it and it
 * was zero". `??`-defaulting a missing volume to 0 would be a data lie, so every
 * metric below is mapped through {@link nullableMetric}, which only ever returns
 * a finite number or `null`.
 *
 * `toOpportunity(input)` is a PURE function of its argument (no clock, no RNG —
 * the caller injects `collectedAt` so timestamps stay deterministic + testable).
 * It:
 *  - carries intent + confidence + topic_cluster through,
 *  - records `volume_source` whenever a volume is present (and nowhere else),
 *  - assembles `source_provenance` from whatever sources contributed,
 *  - sets `collected_at`, `data_freshness`, and overall `confidence`,
 *  - keeps the raw per-source values accessible via {@link RawAccessor}.
 *
 * It does NOT score (that's `scoring.ts`), cluster, or recommend an action — it
 * only produces the canonical shape with honest nulls, then `.parse()`s it so an
 * invalid mapping fails loudly at the boundary.
 */
import {
  KeywordOpportunity,
  type RawSignals,
  type SearchIntent,
  type SeasonalityPoint,
  type TrendDirection,
  type CompetitorEvidence,
  type SourceProvenanceEntry,
} from './types';

/** Map any provider metric to `number | null`. Absent/non-finite ⇒ `null`. */
export function nullableMetric(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return v;
}

/**
 * Everything `toOpportunity` needs that isn't already in `RawSignals`. All of it
 * is resolved UPSTREAM (locale/geo/lang by the pipeline; intent by the intent
 * classifier; score by the scorer) and handed in so this stays a pure mapper.
 */
export interface NormalizeInput {
  /** The per-source raw signals (same shape the scorer reads). */
  raw: RawSignals;

  /** Resolved identity (the pipeline fills geo/lang defaults). */
  locale: string;
  geography: string;
  language: string;

  /** Classified intent + confidence (from `classifyIntent`, overridable). */
  intent: SearchIntent;
  intentConfidence: number;
  /** Topical cluster label (classifier/LLM/manual). */
  topicCluster: string;

  /** Deterministic collection timestamp (ISO 8601) — injected, never `now()`. */
  collectedAt: string;
  /** 0..1 overall freshness (pipeline computes; default 1 = just collected). */
  dataFreshness?: number;

  /** Final 0..100 score + explanation (from `scoreKeyword`). */
  opportunityScore: number;
  scoringExplanation: string;

  /** Overall 0..1 record confidence (pipeline blends source confidences). */
  confidence: number;

  /**
   * Site-mapping fields, resolved by the page-map step BEFORE normalization.
   * All optional; defaulted to the honest "we don't know yet" values.
   */
  existingMatchingPage?: string | null;
  recommendedUrl?: string | null;
  recommendedAction?: KeywordOpportunity['recommended_action'];

  /** Pre-built provenance rows (adapters/pipeline attribute each datum). */
  provenance?: SourceProvenanceEntry[];
}

/**
 * The raw per-source values, kept accessible alongside the normalized record so
 * a report can still cite the original attribution ("volume from DataForSEO").
 */
export interface RawAccessor {
  relevance: RawSignals['relevance'];
  volume: RawSignals['volume'];
  gsc: RawSignals['gsc'];
  trend: RawSignals['trend'];
  competition: RawSignals['competition'];
}

/** A normalized opportunity bundled with its raw provenance accessor. */
export interface NormalizedOpportunity {
  opportunity: KeywordOpportunity;
  raw: RawAccessor;
}

/** Normalize the GSC CTR, which the raw shape already stores as a 0..1 fraction. */
function normalizeGscCtr(ctr: unknown): number | null {
  const v = nullableMetric(ctr);
  if (v === null) return null;
  // Be defensive: a few providers hand back CTR as a 0..100 percentage.
  return v > 1 ? v / 100 : v;
}

/** Pull the trend direction through, defaulting to `null` when absent. */
function normalizeTrendDirection(dir: unknown): TrendDirection {
  if (dir === 'rising' || dir === 'flat' || dir === 'declining') return dir;
  return null;
}

/** Pull a seasonality array through (already SeasonalityPoint-shaped) or null. */
function normalizeSeasonality(s: SeasonalityPoint[] | undefined): SeasonalityPoint[] | null {
  if (!s || s.length === 0) return null;
  return s;
}

/**
 * Map raw signals + resolved context into a validated `KeywordOpportunity`.
 * Throws (via Zod `.parse`) if the assembled record is somehow invalid — that's
 * intentional: a bad mapping must fail at the boundary, not propagate.
 */
export function toOpportunity(input: NormalizeInput): NormalizedOpportunity {
  const { raw } = input;

  // --- Demand ---
  const monthly_search_volume = nullableMetric(raw.volume?.monthly_search_volume);
  // volume_source is attributed ONLY when we actually have a volume.
  const volume_source =
    monthly_search_volume !== null ? raw.volume?.source ?? null : null;

  // --- Competition (organic vs paid kept separate, per the scorer's contract) ---
  const organic_keyword_difficulty = nullableMetric(raw.volume?.organic_keyword_difficulty);
  const paid_competition = nullableMetric(raw.volume?.paid_competition);
  const cpc = nullableMetric(raw.volume?.cpc);

  // --- GSC (first-party) ---
  const gsc_impressions = nullableMetric(raw.gsc?.impressions);
  const gsc_clicks = nullableMetric(raw.gsc?.clicks);
  const gsc_ctr = normalizeGscCtr(raw.gsc?.ctr);
  const gsc_average_position = nullableMetric(raw.gsc?.average_position);

  // --- Trend ---
  const trend_direction = normalizeTrendDirection(raw.trend?.direction);
  const trend_momentum = nullableMetric(raw.trend?.momentum);
  const seasonality = normalizeSeasonality(raw.trend?.seasonality);

  // --- Competitive landscape ---
  const competitor_evidence: CompetitorEvidence[] = raw.competition?.competitor_evidence ?? [];

  const candidate: KeywordOpportunity = {
    keyword: raw.keyword,
    locale: input.locale,
    geography: input.geography,
    language: input.language,

    search_intent: input.intent,
    intent_confidence: input.intentConfidence,
    topic_cluster: input.topicCluster,

    monthly_search_volume,
    volume_source,

    organic_keyword_difficulty,
    paid_competition,
    cpc,

    gsc_impressions,
    gsc_clicks,
    gsc_ctr,
    gsc_average_position,

    trend_direction,
    trend_momentum,
    seasonality,

    competitor_evidence,

    existing_matching_page: input.existingMatchingPage ?? null,
    recommended_url: input.recommendedUrl ?? null,
    recommended_action: input.recommendedAction ?? 'monitor',

    opportunity_score: input.opportunityScore,
    scoring_explanation: input.scoringExplanation,

    source_provenance: input.provenance ?? [],
    collected_at: input.collectedAt,
    data_freshness: input.dataFreshness ?? 1,
    confidence: input.confidence,
  };

  // Validate at the boundary — a malformed record is a bug, surfaced loudly.
  const opportunity = KeywordOpportunity.parse(candidate);

  return {
    opportunity,
    raw: {
      relevance: raw.relevance,
      volume: raw.volume,
      gsc: raw.gsc,
      trend: raw.trend,
      competition: raw.competition,
    },
  };
}
