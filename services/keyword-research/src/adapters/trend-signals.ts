/**
 * Trend-signal derivation — PURE functions that turn a 0–100 interest INDEX
 * series (as produced by {@link TrendsAdapter}) into normalized demand signals:
 * direction, momentum, and seasonality.
 *
 * Non-negotiables (echoing the service's data doctrine):
 *  - The input is ALWAYS a relative 0–100 index, NEVER an absolute volume.
 *    These functions therefore emit DIRECTION + RELATIVE strength + a seasonal
 *    pattern — never a search count.
 *  - INSUFFICIENT DATA ⇒ `null`, NEVER a fabricated signal. A series too short
 *    to reason about returns `null` for every derived signal; it does not guess.
 *  - PURE + DETERMINISTIC: no clock, no RNG, no network. Same series in ⇒ same
 *    signals out, so the whole thing is trivially unit-testable with ZERO mocks.
 *
 * None of these throw: a malformed/empty/short series degrades to `null`.
 */
import type { SeasonalityPoint } from '../types';
import type { TrendPoint } from './trends';

/* ------------------------------------------------------------------ */
/* Tunables — every threshold is documented + exported so tests and    */
/* callers can reason about (and reference) the exact rule.            */
/* ------------------------------------------------------------------ */

/** Fewer points than this ⇒ not enough signal to call direction/momentum. */
export const MIN_DIRECTION_POINTS = 4;

/** Fewer points than this ⇒ not enough signal to detect seasonality. */
export const MIN_SEASONALITY_POINTS = 12;

/**
 * Direction deadband. We compare the mean of the RECENT window (the last ~25%
 * of points) against the mean of the PRIOR window (everything before it). The
 * change is expressed as a fraction of the prior mean (or, when the prior mean
 * is ~0, of the full-series max so a 0→N rise still registers). A change whose
 * magnitude is at or below this fraction is reported as "flat" — this absorbs
 * ordinary month-to-month index noise so only a genuine move flips direction.
 *
 * 0.10 ⇒ the recent window must differ from the prior window by MORE than 10%
 * (relative) before we call it rising/declining.
 */
export const DIRECTION_DEADBAND = 0.1;

/** Fraction of the series (from the end) that forms the "recent" window. */
export const RECENT_FRACTION = 0.25;

/**
 * Momentum is a least-squares slope (index-points per step) normalized by the
 * series' own amplitude (max−min) and the number of steps, then clamped to a
 * documented −1..1 scale:
 *   +1 ≈ the index climbed across its FULL observed range over the window,
 *    0 ≈ no net movement,
 *   −1 ≈ it fell across its full range.
 * It is a signed, dimensionless RELATIVE rate — never a volume delta.
 */
export const MOMENTUM_SCALE_MIN = -1;
export const MOMENTUM_SCALE_MAX = 1;

/**
 * Seasonality: a month is a "peak" if its mean index (averaged across every
 * year observed for that month) is at least this fraction of the single highest
 * monthly mean. `seasonal` is true only when a peak repeats (≥2 observations
 * feeding the top month) OR a clear dominant month stands out across ≥12 points.
 */
export const SEASONALITY_PEAK_RATIO = 0.85;

/* ------------------------------------------------------------------ */
/* Result shapes.                                                      */
/* ------------------------------------------------------------------ */

/** Direction of demand. `null` = not enough series data to call it. */
export type TrendDir = 'rising' | 'flat' | 'declining' | null;

/**
 * Seasonality verdict. `null` when there isn't enough data to decide; otherwise
 * `{ seasonal, peakMonths? }` where `peakMonths` are 1–12 month numbers.
 */
export type SeasonalityVerdict = { seasonal: boolean; peakMonths?: number[] } | null;

/** Everything derivable from one keyword's interest series. */
export interface DerivedTrendSignals {
  direction: TrendDir;
  /** Signed −1..1 relative momentum, or `null` when insufficient data. */
  momentum: number | null;
  seasonality: SeasonalityVerdict;
  /**
   * A 0..1 (per-month, relative-to-peak) seasonality curve, suitable for the
   * normalizer's `SeasonalityPoint[]`. `null` when no monthly pattern exists.
   */
  seasonalityCurve: SeasonalityPoint[] | null;
}

/* ------------------------------------------------------------------ */
/* Small numeric helpers (local, dependency-free).                     */
/* ------------------------------------------------------------------ */

/** Finite-number guard: anything non-finite is rejected. */
function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

/** Arithmetic mean of a non-empty finite array (caller guarantees length>0). */
function mean(xs: readonly number[]): number {
  let sum = 0;
  for (const x of xs) sum += x;
  return sum / xs.length;
}

/**
 * Least-squares slope of `ys` over the implicit x = 0,1,2,…,n−1 (index per
 * step). Returns 0 for a degenerate (≤1-point) series.
 */
function leastSquaresSlope(ys: readonly number[]): number {
  const n = ys.length;
  if (n < 2) return 0;
  // x runs 0..n-1; meanX = (n-1)/2.
  const meanX = (n - 1) / 2;
  const meanY = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - meanX;
    num += dx * ((ys[i] as number) - meanY);
    den += dx * dx;
  }
  return den === 0 ? 0 : num / den;
}

/** Clamp into the documented momentum scale. */
function clampMomentum(n: number): number {
  if (n < MOMENTUM_SCALE_MIN) return MOMENTUM_SCALE_MIN;
  if (n > MOMENTUM_SCALE_MAX) return MOMENTUM_SCALE_MAX;
  return n;
}

/**
 * Extract the clean numeric index values from a {@link TrendPoint} series,
 * dropping any point whose `index` isn't a finite number. Order preserved.
 */
export function seriesValues(series: readonly TrendPoint[] | undefined | null): number[] {
  if (!Array.isArray(series)) return [];
  const out: number[] = [];
  for (const pt of series) {
    if (pt && isFiniteNumber(pt.index)) out.push(pt.index);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Direction + momentum.                                               */
/* ------------------------------------------------------------------ */

/**
 * Classify the trend DIRECTION by comparing the mean of the recent window (last
 * `RECENT_FRACTION` of points, at least one) against the mean of the prior
 * window, with a relative {@link DIRECTION_DEADBAND}. `null` when there are
 * fewer than {@link MIN_DIRECTION_POINTS} usable points.
 */
export function deriveDirection(values: readonly number[]): TrendDir {
  if (values.length < MIN_DIRECTION_POINTS) return null;

  const n = values.length;
  // Recent window: last ceil(n * RECENT_FRACTION) points, but keep at least one
  // point in BOTH windows.
  let recentCount = Math.ceil(n * RECENT_FRACTION);
  if (recentCount < 1) recentCount = 1;
  if (recentCount >= n) recentCount = n - 1;

  const prior = values.slice(0, n - recentCount);
  const recent = values.slice(n - recentCount);
  if (prior.length === 0 || recent.length === 0) return null;

  const priorMean = mean(prior);
  const recentMean = mean(recent);
  const delta = recentMean - priorMean;

  // Relative change. When the prior mean is ~0, normalize against the series max
  // (so a 0→N climb still reads as a real rise, not a divide-by-zero).
  const denom = priorMean > 1e-9 ? priorMean : Math.max(...values, 1e-9);
  const relative = delta / denom;

  if (Math.abs(relative) <= DIRECTION_DEADBAND) return 'flat';
  return relative > 0 ? 'rising' : 'declining';
}

/**
 * Derive signed −1..1 momentum (see {@link MOMENTUM_SCALE_MIN}). The raw
 * least-squares slope (index-points/step) is normalized by amplitude so a given
 * climb means the same whether the index swings 0→100 or 40→60. `null` when
 * there are fewer than {@link MIN_DIRECTION_POINTS} usable points or the series
 * is perfectly flat (amplitude 0 ⇒ momentum 0, which is a real "no movement").
 */
export function deriveMomentum(values: readonly number[]): number | null {
  if (values.length < MIN_DIRECTION_POINTS) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const amplitude = max - min;
  if (amplitude <= 1e-9) return 0; // dead-flat series → zero momentum (known).

  const slope = leastSquaresSlope(values); // index-points per step
  const steps = values.length - 1;
  // Total modeled rise across the window = slope * steps; express as a fraction
  // of amplitude so it lands on the −1..1 scale.
  const normalized = (slope * steps) / amplitude;
  return clampMomentum(normalized);
}

/* ------------------------------------------------------------------ */
/* Seasonality (month-of-year peak detection).                         */
/* ------------------------------------------------------------------ */

/** Parse a 1–12 month number out of a point's date, or `null` if we can't. */
export function monthOf(date: string | undefined | null): number | null {
  if (typeof date !== 'string') return null;
  // ISO-ish "YYYY-MM-DD" / "YYYY-MM" — the dominant DataForSEO/official shape.
  const iso = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(date);
  if (iso) {
    const m = Number(iso[2]);
    if (m >= 1 && m <= 12) return m;
  }
  // Epoch seconds (DataForSEO sometimes hands back a `timestamp`).
  if (/^\d{9,13}$/.test(date)) {
    const ms = date.length <= 10 ? Number(date) * 1000 : Number(date);
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.getUTCMonth() + 1;
  }
  return null;
}

/**
 * Detect annual seasonality by averaging each calendar month's index across all
 * years observed, then flagging months at/above {@link SEASONALITY_PEAK_RATIO}
 * of the top monthly mean.
 *
 * Returns `null` when there are fewer than {@link MIN_SEASONALITY_POINTS} usable
 * (date+index) points or fewer than 2 distinct months — too little to claim a
 * repeating pattern. `seasonal` is true only when the peak is BOTH clearly
 * dominant AND corroborated (either the top month was observed in ≥2 years, or
 * the pattern spans a full ≥12-point year with a single dominant month).
 */
export function deriveSeasonality(series: readonly TrendPoint[] | undefined | null): {
  verdict: SeasonalityVerdict;
  curve: SeasonalityPoint[] | null;
} {
  if (!Array.isArray(series)) return { verdict: null, curve: null };

  // Bucket index values by month (1..12), counting observations per month.
  const buckets = new Map<number, number[]>();
  let usable = 0;
  for (const pt of series) {
    if (!pt || !isFiniteNumber(pt.index)) continue;
    const m = monthOf(pt.date);
    if (m === null) continue;
    usable++;
    const arr = buckets.get(m) ?? [];
    arr.push(pt.index);
    buckets.set(m, arr);
  }

  if (usable < MIN_SEASONALITY_POINTS || buckets.size < 2) {
    return { verdict: null, curve: null };
  }

  // Monthly means, and the peak month mean.
  const monthlyMean = new Map<number, number>();
  for (const [m, vals] of buckets) monthlyMean.set(m, mean(vals));
  const peakMean = Math.max(...monthlyMean.values());
  if (peakMean <= 1e-9) {
    // Entirely flat/zero across months — no meaningful seasonal structure.
    return { verdict: { seasonal: false }, curve: null };
  }

  // Peak months: at/above the ratio of the top monthly mean.
  const peakMonths: number[] = [];
  for (const [m, mu] of monthlyMean) {
    if (mu >= SEASONALITY_PEAK_RATIO * peakMean) peakMonths.push(m);
  }
  peakMonths.sort((a, b) => a - b);

  // Corroboration: is the dominant month observed across multiple years, or does
  // the series span a full year with a single clear peak? Find the top month
  // via a reduce (monthlyMean is non-empty here — buckets.size ≥ 2 above).
  let topMonth = 0;
  let topMonthMean = -Infinity;
  for (const [m, mu] of monthlyMean) {
    if (mu > topMonthMean) {
      topMonthMean = mu;
      topMonth = m;
    }
  }
  const topMonthObservations = buckets.get(topMonth)?.length ?? 0;
  const dominant = peakMonths.length <= Math.max(2, Math.round(buckets.size * 0.34));
  const corroborated = topMonthObservations >= 2 || buckets.size >= 12;
  const seasonal = dominant && corroborated;

  // Build a 0..1 per-month curve (relative to the peak) for the normalizer. Only
  // months we actually observed appear; the scale is each month's mean ÷ peak.
  const curve: SeasonalityPoint[] = [...monthlyMean.entries()]
    .map(([month, mu]) => ({ month, index: Math.max(0, Math.min(1, mu / peakMean)) }))
    .sort((a, b) => a.month - b.month);

  return {
    verdict: seasonal ? { seasonal: true, peakMonths } : { seasonal: false },
    curve: seasonal ? curve : null,
  };
}

/* ------------------------------------------------------------------ */
/* One-shot: derive everything from a TrendPoint series.               */
/* ------------------------------------------------------------------ */

/**
 * Derive direction + momentum + seasonality from a 0–100 interest series in one
 * call. Never throws; a short/empty/malformed series yields all-`null` signals.
 */
export function deriveTrendSignals(
  series: readonly TrendPoint[] | undefined | null,
): DerivedTrendSignals {
  const values = seriesValues(series);
  const direction = deriveDirection(values);
  const momentum = deriveMomentum(values);
  const { verdict, curve } = deriveSeasonality(series);
  return { direction, momentum, seasonality: verdict, seasonalityCurve: curve };
}
