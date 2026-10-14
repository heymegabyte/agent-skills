import { describe, expect, it } from 'vitest';
import type { TrendPoint } from '../../src/adapters/trends';
import {
  DIRECTION_DEADBAND,
  MIN_DIRECTION_POINTS,
  MIN_SEASONALITY_POINTS,
  deriveDirection,
  deriveMomentum,
  deriveSeasonality,
  deriveTrendSignals,
  monthOf,
  seriesValues,
} from '../../src/adapters/trend-signals';

/** Build a monthly TrendPoint series starting at `startYm` ("YYYY-MM"). */
function monthlySeries(startYm: string, values: number[]): TrendPoint[] {
  const parts = startYm.split('-').map(Number);
  const y0 = parts[0] ?? 0;
  const m0 = parts[1] ?? 1;
  return values.map((index, i) => {
    const total = (m0 - 1) + i;
    const year = y0 + Math.floor(total / 12);
    const month = (total % 12) + 1;
    const mm = String(month).padStart(2, '0');
    return { date: `${year}-${mm}-01`, index };
  });
}

describe('trend-signals — seriesValues', () => {
  it('keeps finite index values in order and drops non-finite ones', () => {
    const s: TrendPoint[] = [
      { date: 'a', index: 10 },
      { date: 'b', index: Number.NaN },
      { date: 'c', index: 30 },
    ];
    expect(seriesValues(s)).toEqual([10, 30]);
  });
  it('returns [] for a non-array input', () => {
    expect(seriesValues(undefined)).toEqual([]);
    expect(seriesValues(null)).toEqual([]);
  });
});

describe('trend-signals — deriveDirection', () => {
  it('classifies a clear climb as "rising"', () => {
    const v = [10, 20, 30, 45, 60, 80, 95];
    expect(deriveDirection(v)).toBe('rising');
  });

  it('classifies a clear fall as "declining"', () => {
    const v = [95, 80, 60, 45, 30, 20, 10];
    expect(deriveDirection(v)).toBe('declining');
  });

  it('classifies a flat line as "flat"', () => {
    const v = [50, 50, 50, 50, 50, 50];
    expect(deriveDirection(v)).toBe('flat');
  });

  it('treats small noise within the deadband as "flat"', () => {
    // Prior mean ≈ 50, recent mean within ±DIRECTION_DEADBAND of it.
    const v = [50, 48, 52, 49, 51, 50, 51, 49];
    expect(deriveDirection(v)).toBe('flat');
    // Sanity: the configured deadband is the documented 10%.
    expect(DIRECTION_DEADBAND).toBe(0.1);
  });

  it('returns null when there are too few points', () => {
    expect(deriveDirection([10, 90])).toBeNull();
    expect(deriveDirection(new Array(MIN_DIRECTION_POINTS - 1).fill(1))).toBeNull();
  });

  it('reads a 0→N climb as rising even when the prior window is ~0', () => {
    const v = [0, 0, 0, 0, 40, 80, 100];
    expect(deriveDirection(v)).toBe('rising');
  });
});

describe('trend-signals — deriveMomentum', () => {
  it('is positive and in (0,1] for a rising series', () => {
    const m = deriveMomentum([0, 20, 40, 60, 80, 100]);
    expect(m).not.toBeNull();
    expect(m!).toBeGreaterThan(0);
    expect(m!).toBeLessThanOrEqual(1);
  });

  it('is negative for a declining series', () => {
    const m = deriveMomentum([100, 80, 60, 40, 20, 0]);
    expect(m).not.toBeNull();
    expect(m!).toBeLessThan(0);
    expect(m!).toBeGreaterThanOrEqual(-1);
  });

  it('is 0 for a dead-flat series', () => {
    expect(deriveMomentum([50, 50, 50, 50, 50])).toBe(0);
  });

  it('returns null when there are too few points', () => {
    expect(deriveMomentum([10, 90, 95])).toBeNull();
  });

  it('is amplitude-normalized: a monotone full-range ramp approaches +1', () => {
    const m = deriveMomentum([0, 25, 50, 75, 100]);
    expect(m!).toBeGreaterThan(0.9);
    expect(m!).toBeLessThanOrEqual(1);
  });
});

describe('trend-signals — monthOf', () => {
  it('parses ISO YYYY-MM-DD and YYYY-MM', () => {
    expect(monthOf('2026-07-01')).toBe(7);
    expect(monthOf('2026-12')).toBe(12);
  });
  it('parses an epoch-seconds timestamp', () => {
    // 2026-07-01T00:00:00Z = 1782950400 s.
    expect(monthOf('1782950400')).toBe(7);
  });
  it('returns null for junk', () => {
    expect(monthOf('not-a-date')).toBeNull();
    expect(monthOf(undefined)).toBeNull();
    expect(monthOf('2026-13-01')).toBeNull();
  });
});

describe('trend-signals — deriveSeasonality', () => {
  it('detects an annual December peak repeated across years', () => {
    // 3 years of monthly data; every December spikes. Peak month = 12.
    const oneYear = [20, 22, 25, 28, 30, 35, 40, 38, 34, 45, 70, 100];
    const three = monthlySeries('2024-01', [...oneYear, ...oneYear, ...oneYear]);
    const { verdict, curve } = deriveSeasonality(three);
    expect(verdict).not.toBeNull();
    expect(verdict!.seasonal).toBe(true);
    expect(verdict!.peakMonths).toContain(12);
    // Curve is the 0..1 per-month relative shape; December is the peak (= 1).
    const dec = curve!.find((p) => p.month === 12);
    expect(dec!.index).toBeCloseTo(1, 5);
  });

  it('returns a null verdict for too few points', () => {
    const short = monthlySeries('2026-01', new Array(MIN_SEASONALITY_POINTS - 1).fill(50));
    const { verdict, curve } = deriveSeasonality(short);
    expect(verdict).toBeNull();
    expect(curve).toBeNull();
  });

  it('reports seasonal=false (no curve) for a flat full year', () => {
    const flat = monthlySeries('2026-01', new Array(12).fill(50));
    const { verdict, curve } = deriveSeasonality(flat);
    // Enough points + distinct months, but every month ties ⇒ not a real peak.
    expect(verdict).not.toBeNull();
    expect(verdict!.seasonal).toBe(false);
    expect(curve).toBeNull();
  });

  it('returns null when dates are unparseable (cannot bucket by month)', () => {
    const series: TrendPoint[] = new Array(14)
      .fill(0)
      .map((_, i) => ({ date: `period-${i}`, index: i * 5 }));
    const { verdict } = deriveSeasonality(series);
    expect(verdict).toBeNull();
  });
});

describe('trend-signals — deriveTrendSignals (one-shot)', () => {
  it('derives direction + momentum + seasonality together for a rich series', () => {
    const oneYear = [20, 22, 25, 28, 30, 35, 40, 38, 34, 45, 70, 100];
    const two = monthlySeries('2025-01', [...oneYear, ...oneYear]);
    const sig = deriveTrendSignals(two);
    expect(sig.direction).not.toBeNull();
    expect(sig.momentum).not.toBeNull();
    expect(sig.seasonality).not.toBeNull();
    expect(sig.seasonality!.seasonal).toBe(true);
    expect(sig.seasonalityCurve).not.toBeNull();
  });

  it('yields all-null signals for an empty series (no crash)', () => {
    const sig = deriveTrendSignals([]);
    expect(sig).toEqual({
      direction: null,
      momentum: null,
      seasonality: null,
      seasonalityCurve: null,
    });
  });

  it('yields all-null signals for a too-short series (no crash)', () => {
    const sig = deriveTrendSignals([
      { date: '2026-01-01', index: 10 },
      { date: '2026-02-01', index: 90 },
    ]);
    expect(sig.direction).toBeNull();
    expect(sig.momentum).toBeNull();
    expect(sig.seasonality).toBeNull();
  });

  it('never throws on malformed points', () => {
    const malformed = [
      { date: '2026-01-01', index: Number.NaN },
      { date: '', index: 50 },
      { date: '2026-03-01', index: 60 },
    ] as TrendPoint[];
    expect(() => deriveTrendSignals(malformed)).not.toThrow();
  });
});
