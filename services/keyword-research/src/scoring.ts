/**
 * Deterministic, pure, configurable 100-point keyword-opportunity scorer.
 *
 * Contract:
 *  - PURE: output depends only on `(signals, config)`. No clock, no RNG, no I/O.
 *  - DETERMINISTIC: identical input => byte-identical output, always.
 *  - TRANSPARENT NULL-HANDLING: a dimension whose inputs are *entirely absent*
 *    returns `null`. Null dimensions are DROPPED and the REMAINING weights are
 *    renormalized so the active weights still total 100. We never fabricate a
 *    missing dimension's subscore (e.g. we do not pretend GSC = 0).
 *  - SEPARATION OF CONCERNS: organic feasibility is driven ONLY by organic
 *    keyword difficulty. Paid competition / CPC are inputs to the
 *    *conversion-value* side of the model and MUST NOT leak into feasibility.
 *
 * The 7 dimensions and their default weights (sum = 100):
 *   businessRelevance      30
 *   intentConversionValue  20
 *   organicFeasibility     15
 *   gscOpportunity         15
 *   searchDemand           10
 *   trendMomentum           5
 *   originality             5
 */
import type { RawSignals, SearchIntent } from './types';

/** The seven scoring dimensions, in canonical order. */
export const DIMENSIONS = [
  'businessRelevance',
  'intentConversionValue',
  'organicFeasibility',
  'gscOpportunity',
  'searchDemand',
  'trendMomentum',
  'originality',
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

/** Overridable weight config. Callers may pass a partial override. */
export type ScoringWeights = Record<Dimension, number>;

/** Default weights — exported so callers can read, clone, and override them. */
export const DEFAULT_WEIGHTS: ScoringWeights = {
  businessRelevance: 30,
  intentConversionValue: 20,
  organicFeasibility: 15,
  gscOpportunity: 15,
  searchDemand: 10,
  trendMomentum: 5,
  originality: 5,
};

/**
 * Intent -> conversion value (0..1). Transactional/commercial intents convert;
 * informational browsing converts least. These are the "base" conversion
 * values, later scaled by how confident we are in the classified intent.
 */
export const INTENT_VALUE: Record<SearchIntent, number> = {
  transactional: 1.0,
  commercial: 0.9,
  comparison: 0.8,
  local: 0.7,
  mixed: 0.5,
  navigational: 0.4,
  informational: 0.3,
};

/** Volume at which `searchDemand` saturates to 1.0 (log-scaled below it). */
export const VOLUME_SATURATION = 100_000;

/** Per-dimension breakdown returned to the caller for full transparency. */
export interface DimensionBreakdown {
  /** Raw 0..1 subscore, or null when the dimension's inputs were absent. */
  raw: number | null;
  /** Effective (renormalized) weight actually applied, 0 when unavailable. */
  weight: number;
  /** raw * weight (0 when unavailable). */
  weighted: number;
  /** Whether this dimension had any inputs to score. */
  available: boolean;
}

export interface ScoreResult {
  /** Final opportunity score, 0..100, rounded to 1 decimal place. */
  score: number;
  /** Per-dimension detail keyed by dimension name. */
  breakdown: Record<Dimension, DimensionBreakdown>;
  /** Human-readable explanation of how the score was derived. */
  explanation: string;
}

/* ------------------------------------------------------------------ */
/* Pure subscore functions. Each returns 0..1, or null if no inputs.   */
/* ------------------------------------------------------------------ */

/** Clamp a number into [0, 1]. */
function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

/** Round to a fixed number of decimals without float drift surprises. */
function roundTo(n: number, decimals: number): number {
  const f = 10 ** decimals;
  // +Number.EPSILON nudges exact-half cases (e.g. 0.15 stored as 0.1499…) up.
  return Math.round((n + Number.EPSILON) * f) / f;
}

/** Business relevance — the single most important dimension. */
function scoreBusinessRelevance(s: RawSignals): number | null {
  const v = s.relevance?.business_relevance;
  if (v === undefined) return null;
  return clamp01(v);
}

/**
 * Intent conversion value = base intent value scaled by intent confidence.
 * An uncertain classification is pulled toward the neutral "mixed" value so a
 * low-confidence "transactional" guess doesn't over-reward the keyword.
 */
function scoreIntentConversionValue(s: RawSignals): number | null {
  const intent = s.relevance?.intent;
  if (intent === undefined) return null;
  const base = INTENT_VALUE[intent];
  const conf = s.relevance?.intent_confidence ?? 1;
  const neutral = INTENT_VALUE.mixed;
  // Blend base toward neutral by (1 - confidence).
  return clamp01(base * conf + neutral * (1 - conf));
}

/**
 * Organic feasibility — driven ONLY by organic keyword difficulty (KD).
 * feasibility = 1 - KD/100. Paid competition / CPC are deliberately ignored
 * here; they belong to the conversion-value side of the model.
 */
function scoreOrganicFeasibility(s: RawSignals): number | null {
  const kd = s.volume?.organic_keyword_difficulty;
  if (kd === undefined) return null;
  return clamp01(1 - kd / 100);
}

/**
 * GSC opportunity — first-party "we're close" signal. Blends:
 *  - positionRoom: how much upside remains from current avg position
 *    (pos 1 => 0 room, pos >=20 => full room), and
 *  - demandProof: that Google is already showing us impressions (log-scaled).
 * We reward keywords where we already get impressions but sit below the top.
 */
function scoreGscOpportunity(s: RawSignals): number | null {
  const g = s.gsc;
  if (!g) return null;
  const hasAny =
    g.impressions !== undefined ||
    g.clicks !== undefined ||
    g.ctr !== undefined ||
    g.average_position !== undefined;
  if (!hasAny) return null;

  let positionRoom = 0.5; // neutral if position unknown
  if (g.average_position !== undefined) {
    // pos 1 -> 0 room; pos 20+ -> 1.0 room (linear over [1, 20]).
    positionRoom = clamp01((g.average_position - 1) / 19);
  }

  let demandProof = 0;
  if (g.impressions !== undefined) {
    // log10 scaling: 1 impression -> ~0, 10k impressions -> 1.0.
    demandProof = clamp01(Math.log10(g.impressions + 1) / 4);
  }

  // Weight the proof that we have demand slightly higher than raw position room.
  return clamp01(0.6 * demandProof + 0.4 * positionRoom);
}

/** Search demand — log-scaled monthly volume (0 at vol 0, 1 at saturation). */
function scoreSearchDemand(s: RawSignals): number | null {
  const vol = s.volume?.monthly_search_volume;
  if (vol === undefined) return null;
  if (vol <= 0) return 0;
  return clamp01(Math.log10(vol + 1) / Math.log10(VOLUME_SATURATION + 1));
}

/** Trend momentum — direction sign times momentum strength, mapped to 0..1. */
function scoreTrendMomentum(s: RawSignals): number | null {
  const t = s.trend;
  if (!t || (t.direction === undefined && t.momentum === undefined)) return null;
  const momentum = t.momentum ?? 0.5;
  const direction = t.direction ?? 'flat';
  // rising -> amplify above neutral; declining -> push below; flat -> neutral.
  if (direction === 'rising') return clamp01(0.5 + 0.5 * momentum);
  if (direction === 'declining') return clamp01(0.5 - 0.5 * momentum);
  return 0.5;
}

/** Originality — how under-served / differentiated the angle is for us. */
function scoreOriginality(s: RawSignals): number | null {
  const v = s.competition?.originality;
  if (v === undefined) return null;
  return clamp01(v);
}

const SUBSCORERS: Record<Dimension, (s: RawSignals) => number | null> = {
  businessRelevance: scoreBusinessRelevance,
  intentConversionValue: scoreIntentConversionValue,
  organicFeasibility: scoreOrganicFeasibility,
  gscOpportunity: scoreGscOpportunity,
  searchDemand: scoreSearchDemand,
  trendMomentum: scoreTrendMomentum,
  originality: scoreOriginality,
};

/* ------------------------------------------------------------------ */
/* The scorer.                                                         */
/* ------------------------------------------------------------------ */

/**
 * Score a keyword opportunity from its raw signals.
 *
 * @param signals  partial per-source inputs
 * @param weightsOverride  optional partial override of the default weights
 */
export function scoreKeyword(
  signals: RawSignals,
  weightsOverride?: Partial<ScoringWeights>,
): ScoreResult {
  const weights: ScoringWeights = { ...DEFAULT_WEIGHTS, ...weightsOverride };

  // 1) Compute each raw subscore (or null).
  const raws: Record<Dimension, number | null> = {} as Record<Dimension, number | null>;
  for (const dim of DIMENSIONS) {
    raws[dim] = SUBSCORERS[dim](signals);
  }

  // 2) Sum the weights of the AVAILABLE dimensions.
  let activeWeightTotal = 0;
  for (const dim of DIMENSIONS) {
    if (raws[dim] !== null) activeWeightTotal += weights[dim];
  }

  // 3) Build the breakdown with renormalized weights (active -> total 100).
  const breakdown: Record<Dimension, DimensionBreakdown> = {} as Record<
    Dimension,
    DimensionBreakdown
  >;
  let score = 0;
  for (const dim of DIMENSIONS) {
    const raw = raws[dim];
    const available = raw !== null;
    // Renormalize: each active weight is rescaled so the active set totals 100.
    const effectiveWeight =
      available && activeWeightTotal > 0 ? (weights[dim] / activeWeightTotal) * 100 : 0;
    const weighted = available ? raw * effectiveWeight : 0;
    breakdown[dim] = {
      raw,
      weight: roundTo(effectiveWeight, 4),
      weighted: roundTo(weighted, 4),
      available,
    };
    score += weighted;
  }

  // 4) Final score: subscores are 0..1 and effective weights total 100, so the
  //    product space is already 0..100. Clamp defensively, round to 1 decimal.
  const finalScore = activeWeightTotal === 0 ? 0 : roundTo(clamp01(score / 100) * 100, 1);

  return {
    score: finalScore,
    breakdown,
    explanation: buildExplanation(breakdown, finalScore, activeWeightTotal),
  };
}

/** Compose a deterministic, human-readable explanation string. */
function buildExplanation(
  breakdown: Record<Dimension, DimensionBreakdown>,
  score: number,
  activeWeightTotal: number,
): string {
  if (activeWeightTotal === 0) {
    return 'Opportunity score 0.0/100 — no scoreable signals were present for any dimension.';
  }
  const parts: string[] = [];
  const dropped: string[] = [];
  for (const dim of DIMENSIONS) {
    const b = breakdown[dim];
    if (b.available && b.raw !== null) {
      parts.push(
        `${dim}: ${roundTo(b.raw, 2)} × ${b.weight.toFixed(1)}w = ${b.weighted.toFixed(1)}pts`,
      );
    } else {
      dropped.push(dim);
    }
  }
  let out = `Opportunity score ${score.toFixed(1)}/100 from ${parts.length} active dimension(s): ${parts.join('; ')}.`;
  if (dropped.length > 0) {
    out += ` Dropped (no data, weight redistributed): ${dropped.join(', ')}.`;
  }
  return out;
}
