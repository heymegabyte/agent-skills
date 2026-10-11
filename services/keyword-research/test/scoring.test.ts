import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WEIGHTS,
  DIMENSIONS,
  scoreKeyword,
  type ScoringWeights,
} from '../src/scoring';
import { RawSignals } from '../src/types';

/**
 * A fully-populated fixture engineered so the arithmetic is exact and
 * hand-verifiable (every subscore lands on a clean value):
 *
 *   businessRelevance      raw 0.9  × 30 = 27.0
 *   intentConversionValue  raw 0.9  × 20 = 18.0   (commercial=0.9, conf=1.0)
 *   organicFeasibility     raw 0.6  × 15 =  9.0   (KD 40 -> 1-0.40)
 *   gscOpportunity         raw 1.0  × 15 = 15.0   (imp 9999 -> log10(1e4)/4=1.0;
 *                                                  pos 20 -> (20-1)/19 = 1.0;
 *                                                  0.6*1 + 0.4*1 = 1.0)
 *   searchDemand           raw 1.0  × 10 = 10.0   (vol 100000 == saturation)
 *   trendMomentum          raw 0.8  ×  5 =  4.0   (rising, momentum 0.6 -> 0.8)
 *   originality            raw 0.7  ×  5 =  3.5
 *                                         -------
 *                           TOTAL              86.5
 */
const FULL_DATA: RawSignals = {
  keyword: 'best crm for agencies',
  locale: 'en-US',
  relevance: {
    business_relevance: 0.9,
    topic_cluster: 'crm',
    intent: 'commercial',
    intent_confidence: 1.0,
  },
  volume: {
    monthly_search_volume: 100_000,
    source: 'dataforseo',
    organic_keyword_difficulty: 40,
    paid_competition: 0.95, // high paid comp — must NOT lower organic feasibility
    cpc: 42.5,
  },
  gsc: {
    impressions: 9999,
    clicks: 120,
    ctr: 0.012,
    average_position: 20,
  },
  trend: {
    direction: 'rising',
    momentum: 0.6,
  },
  competition: {
    competitor_evidence: [],
    originality: 0.7,
  },
};

describe('scoreKeyword — full data (exact arithmetic)', () => {
  it('produces the hand-computed score of 86.5', () => {
    // Fixture must be schema-valid.
    expect(RawSignals.safeParse(FULL_DATA).success).toBe(true);

    const result = scoreKeyword(FULL_DATA);
    expect(result.score).toBe(86.5);
  });

  it('reports each dimension with the expected raw subscore and full weight', () => {
    const { breakdown } = scoreKeyword(FULL_DATA);

    expect(breakdown.businessRelevance.raw).toBeCloseTo(0.9, 10);
    expect(breakdown.intentConversionValue.raw).toBeCloseTo(0.9, 10);
    expect(breakdown.organicFeasibility.raw).toBeCloseTo(0.6, 10);
    expect(breakdown.gscOpportunity.raw).toBeCloseTo(1.0, 10);
    expect(breakdown.searchDemand.raw).toBeCloseTo(1.0, 10);
    expect(breakdown.trendMomentum.raw).toBeCloseTo(0.8, 10);
    expect(breakdown.originality.raw).toBeCloseTo(0.7, 10);

    // All seven present => effective weights equal the defaults (sum 100).
    for (const dim of DIMENSIONS) {
      expect(breakdown[dim].available).toBe(true);
      expect(breakdown[dim].weight).toBeCloseTo(DEFAULT_WEIGHTS[dim], 6);
    }
    const weightSum = DIMENSIONS.reduce((acc, d) => acc + breakdown[d].weight, 0);
    expect(weightSum).toBeCloseTo(100, 6);
  });

  it('keeps paid competition OUT of organic feasibility', () => {
    // paid_competition = 0.95 in the fixture; feasibility is purely KD-driven.
    const high = scoreKeyword(FULL_DATA);
    const low = scoreKeyword({
      ...FULL_DATA,
      volume: { ...FULL_DATA.volume, paid_competition: 0.0 },
    });
    // Changing paid competition must not move feasibility or the total score.
    expect(low.breakdown.organicFeasibility.raw).toBe(
      high.breakdown.organicFeasibility.raw,
    );
    expect(low.score).toBe(high.score);
  });
});

describe('scoreKeyword — GSC-absent redistribution', () => {
  it('drops GSC, renormalizes active weights to total 100, and raises others', () => {
    const noGsc: RawSignals = { ...FULL_DATA, gsc: undefined };
    const result = scoreKeyword(noGsc);

    // GSC gone.
    expect(result.breakdown.gscOpportunity.available).toBe(false);
    expect(result.breakdown.gscOpportunity.weight).toBe(0);
    expect(result.breakdown.gscOpportunity.weighted).toBe(0);

    // Surviving weights still total 100. (The reported `weight` field is
    // rounded to 4 decimals for transparency, so summing six of them back up
    // carries ~1e-4 of accumulated rounding — assert at that precision.)
    const activeWeightSum = DIMENSIONS.filter((d) => d !== 'gscOpportunity').reduce(
      (acc, d) => acc + result.breakdown[d].weight,
      0,
    );
    expect(activeWeightSum).toBeCloseTo(100, 3);

    // Each surviving dimension's effective weight is strictly larger than its
    // default (weight was redistributed off the dropped dimension).
    for (const dim of DIMENSIONS) {
      if (dim === 'gscOpportunity') continue;
      expect(result.breakdown[dim].weight).toBeGreaterThan(DEFAULT_WEIGHTS[dim]);
    }

    // Redistribution factor check: active default weights sum to 85, so each
    // effective weight = default * (100/85).
    const factor = 100 / 85;
    expect(result.breakdown.businessRelevance.weight).toBeCloseTo(30 * factor, 4);
    expect(result.breakdown.searchDemand.weight).toBeCloseTo(10 * factor, 4);
  });

  it('never fabricates the missing dimension (raw stays null)', () => {
    const result = scoreKeyword({ ...FULL_DATA, gsc: undefined });
    expect(result.breakdown.gscOpportunity.raw).toBeNull();
  });
});

describe('scoreKeyword — determinism', () => {
  it('returns byte-identical output for the same input, twice', () => {
    const a = scoreKeyword(FULL_DATA);
    const b = scoreKeyword(FULL_DATA);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('is stable across an independent deep-cloned input', () => {
    const clone: RawSignals = JSON.parse(JSON.stringify(FULL_DATA));
    expect(scoreKeyword(clone).score).toBe(scoreKeyword(FULL_DATA).score);
  });
});

describe('scoreKeyword — relevance beats raw volume', () => {
  it('ranks a relevant commercial keyword with modest volume above an irrelevant high-volume one', () => {
    const relevantModestVolume: RawSignals = {
      keyword: 'enterprise crm pricing',
      relevance: {
        business_relevance: 0.95,
        intent: 'commercial',
        intent_confidence: 0.9,
      },
      volume: { monthly_search_volume: 500 }, // modest demand
    };

    const irrelevantHugeVolume: RawSignals = {
      keyword: 'taylor swift tour dates',
      relevance: {
        business_relevance: 0.02,
        intent: 'informational',
        intent_confidence: 0.9,
      },
      volume: { monthly_search_volume: 5_000_000 }, // enormous demand
    };

    const good = scoreKeyword(relevantModestVolume);
    const bad = scoreKeyword(irrelevantHugeVolume);
    expect(good.score).toBeGreaterThan(bad.score);
  });
});

describe('scoreKeyword — sparse input', () => {
  it('all-null-except-relevance still yields a valid, bounded score', () => {
    const relevanceOnly: RawSignals = {
      keyword: 'niche b2b widget',
      relevance: { business_relevance: 0.8 },
    };
    const result = scoreKeyword(relevanceOnly);

    // Only businessRelevance is active; its effective weight renormalizes to 100,
    // so the score is simply 0.8 * 100 = 80.0.
    expect(result.breakdown.businessRelevance.available).toBe(true);
    expect(result.breakdown.businessRelevance.weight).toBeCloseTo(100, 6);
    expect(result.score).toBe(80);

    // Bounded + all other dimensions dropped.
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    for (const dim of DIMENSIONS) {
      if (dim === 'businessRelevance') continue;
      expect(result.breakdown[dim].available).toBe(false);
    }
  });

  it('returns a bounded 0 when no dimension has any input', () => {
    const empty: RawSignals = { keyword: 'orphan' };
    const result = scoreKeyword(empty);
    expect(result.score).toBe(0);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe('scoreKeyword — weight override', () => {
  it('changes the score predictably when a dimension is reweighted', () => {
    // Two active dimensions with different raw subscores so reweighting MOVES
    // the result in a known direction.
    const signals: RawSignals = {
      keyword: 'crm migration guide',
      relevance: { business_relevance: 1.0 }, // raw 1.0
      volume: { monthly_search_volume: 1 }, // searchDemand raw ~ log10(2)/log10(1e5+1)
    };

    // Default: businessRelevance 30, searchDemand 10 (other dims null) ->
    // renormalized to 75 / 25.
    const base = scoreKeyword(signals);

    // Override searchDemand weight to 0 => only businessRelevance survives =>
    // score renormalizes to 1.0 * 100 = 100.
    const relevanceOnly = scoreKeyword(signals, { searchDemand: 0 });
    expect(relevanceOnly.score).toBe(100);

    // Heavily favor the low-scoring demand dimension => score must DROP vs base.
    const favorDemand: Partial<ScoringWeights> = {
      businessRelevance: 1,
      searchDemand: 99,
    };
    const demandHeavy = scoreKeyword(signals, favorDemand);
    expect(demandHeavy.score).toBeLessThan(base.score);

    // The override does not mutate the exported defaults.
    expect(DEFAULT_WEIGHTS.searchDemand).toBe(10);
    expect(DEFAULT_WEIGHTS.businessRelevance).toBe(30);
  });
});
