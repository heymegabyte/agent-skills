import { describe, expect, it } from 'vitest';
import { nullableMetric, toOpportunity, type NormalizeInput } from '../src/normalize';
import { KeywordOpportunity, type RawSignals } from '../src/types';

const COLLECTED_AT = '2026-10-14T00:00:00.000Z';

/** A minimal, valid NormalizeInput with a fully-populated raw block. */
function fullInput(overrides: Partial<NormalizeInput> = {}): NormalizeInput {
  const raw: RawSignals = {
    keyword: 'best crm for agencies',
    relevance: { business_relevance: 0.9, topic_cluster: 'crm', intent: 'commercial' },
    volume: {
      monthly_search_volume: 1200,
      source: 'dataforseo',
      organic_keyword_difficulty: 40,
      paid_competition: 0.6,
      cpc: 12.5,
    },
    gsc: { impressions: 900, clicks: 20, ctr: 0.022, average_position: 14 },
    trend: {
      direction: 'rising',
      momentum: 0.4,
      seasonality: [
        { month: 1, index: 0.5 },
        { month: 12, index: 1.0 },
      ],
    },
    competition: {
      competitor_evidence: [
        { domain: 'rival.com', organic_position: 3, url: 'https://rival.com/crm', targets_keyword: true },
      ],
      originality: 0.7,
    },
  };
  return {
    raw,
    locale: 'en-US',
    geography: 'United States',
    language: 'en',
    intent: 'commercial',
    intentConfidence: 0.8,
    topicCluster: 'crm',
    collectedAt: COLLECTED_AT,
    opportunityScore: 72.3,
    scoringExplanation: 'explained',
    confidence: 0.75,
    ...overrides,
  };
}

describe('nullableMetric', () => {
  it('passes finite numbers (including 0) through', () => {
    expect(nullableMetric(0)).toBe(0);
    expect(nullableMetric(42)).toBe(42);
  });
  it('turns undefined/null/NaN/Infinity into null', () => {
    expect(nullableMetric(undefined)).toBeNull();
    expect(nullableMetric(null)).toBeNull();
    expect(nullableMetric(NaN)).toBeNull();
    expect(nullableMetric(Infinity)).toBeNull();
    expect(nullableMetric('5')).toBeNull();
  });
});

describe('toOpportunity — full mapping', () => {
  it('produces a schema-valid KeywordOpportunity', () => {
    const { opportunity } = toOpportunity(fullInput());
    expect(KeywordOpportunity.safeParse(opportunity).success).toBe(true);
  });

  it('carries identity, intent, cluster, score, and timestamps through', () => {
    const { opportunity } = toOpportunity(fullInput());
    expect(opportunity.keyword).toBe('best crm for agencies');
    expect(opportunity.locale).toBe('en-US');
    expect(opportunity.geography).toBe('United States');
    expect(opportunity.language).toBe('en');
    expect(opportunity.search_intent).toBe('commercial');
    expect(opportunity.intent_confidence).toBe(0.8);
    expect(opportunity.topic_cluster).toBe('crm');
    expect(opportunity.opportunity_score).toBe(72.3);
    expect(opportunity.collected_at).toBe(COLLECTED_AT);
    expect(opportunity.data_freshness).toBe(1);
  });

  it('maps metrics and sets volume_source only when a volume is present', () => {
    const { opportunity } = toOpportunity(fullInput());
    expect(opportunity.monthly_search_volume).toBe(1200);
    expect(opportunity.volume_source).toBe('dataforseo');
    expect(opportunity.organic_keyword_difficulty).toBe(40);
    expect(opportunity.paid_competition).toBe(0.6);
    expect(opportunity.cpc).toBe(12.5);
    expect(opportunity.gsc_impressions).toBe(900);
    expect(opportunity.gsc_average_position).toBe(14);
    expect(opportunity.trend_direction).toBe('rising');
    expect(opportunity.seasonality).toHaveLength(2);
    expect(opportunity.competitor_evidence).toHaveLength(1);
  });

  it('keeps the raw per-source values accessible', () => {
    const { raw } = toOpportunity(fullInput());
    expect(raw.volume?.source).toBe('dataforseo');
    expect(raw.gsc?.impressions).toBe(900);
    expect(raw.competition?.originality).toBe(0.7);
  });
});

describe('toOpportunity — MISSING metric ⇒ null, NEVER 0', () => {
  it('nulls every absent metric when only relevance is present', () => {
    const raw: RawSignals = { keyword: 'niche widget', relevance: { business_relevance: 0.8 } };
    const { opportunity } = toOpportunity(fullInput({ raw }));

    // Demand / competition / GSC / trend are all UNKNOWN, i.e. null — not 0.
    expect(opportunity.monthly_search_volume).toBeNull();
    expect(opportunity.volume_source).toBeNull();
    expect(opportunity.organic_keyword_difficulty).toBeNull();
    expect(opportunity.paid_competition).toBeNull();
    expect(opportunity.cpc).toBeNull();
    expect(opportunity.gsc_impressions).toBeNull();
    expect(opportunity.gsc_clicks).toBeNull();
    expect(opportunity.gsc_ctr).toBeNull();
    expect(opportunity.gsc_average_position).toBeNull();
    expect(opportunity.trend_direction).toBeNull();
    expect(opportunity.trend_momentum).toBeNull();
    expect(opportunity.seasonality).toBeNull();

    // And crucially: NONE of them were coerced to 0.
    expect(opportunity.monthly_search_volume).not.toBe(0);
    expect(opportunity.gsc_impressions).not.toBe(0);
  });

  it('a REAL zero volume is preserved as 0 (not turned into null)', () => {
    const raw: RawSignals = {
      keyword: 'genuinely-zero-demand phrase',
      volume: { monthly_search_volume: 0, source: 'dataforseo' },
    };
    const { opportunity } = toOpportunity(fullInput({ raw }));
    expect(opportunity.monthly_search_volume).toBe(0);
    // Volume IS present (0 is a measured value), so the source is attributed.
    expect(opportunity.volume_source).toBe('dataforseo');
  });

  it('does not attribute a volume_source when the volume itself is absent', () => {
    const raw: RawSignals = {
      keyword: 'no volume but a stray source label',
      volume: { source: 'dataforseo', organic_keyword_difficulty: 10 },
    };
    const { opportunity } = toOpportunity(fullInput({ raw }));
    expect(opportunity.monthly_search_volume).toBeNull();
    expect(opportunity.volume_source).toBeNull();
    // Difficulty still maps even though volume is absent.
    expect(opportunity.organic_keyword_difficulty).toBe(10);
  });
});

describe('toOpportunity — provenance + action defaults', () => {
  it('defaults recommended_action to monitor and page fields to null', () => {
    const { opportunity } = toOpportunity(fullInput());
    expect(opportunity.recommended_action).toBe('monitor');
    expect(opportunity.existing_matching_page).toBeNull();
    expect(opportunity.recommended_url).toBeNull();
    expect(opportunity.source_provenance).toEqual([]);
  });

  it('carries injected provenance + page-map fields through', () => {
    const { opportunity } = toOpportunity(
      fullInput({
        existingMatchingPage: 'https://site.tld/crm',
        recommendedUrl: '/crm',
        recommendedAction: 'improve_existing',
        provenance: [
          {
            source: 'dataforseo',
            field: 'monthly_search_volume',
            observed_at: COLLECTED_AT,
            confidence: 0.9,
          },
        ],
      }),
    );
    expect(opportunity.existing_matching_page).toBe('https://site.tld/crm');
    expect(opportunity.recommended_url).toBe('/crm');
    expect(opportunity.recommended_action).toBe('improve_existing');
    expect(opportunity.source_provenance).toHaveLength(1);
    expect(opportunity.source_provenance[0]?.source).toBe('dataforseo');
  });
});

describe('toOpportunity — defensive CTR normalization', () => {
  it('passes a 0..1 CTR through unchanged', () => {
    const raw: RawSignals = { keyword: 'k', gsc: { ctr: 0.05, impressions: 10 } };
    const { opportunity } = toOpportunity(fullInput({ raw }));
    expect(opportunity.gsc_ctr).toBeCloseTo(0.05, 10);
  });
  it('divides a percentage-style CTR (>1) down to a fraction', () => {
    const raw: RawSignals = { keyword: 'k', gsc: { ctr: 5, impressions: 10 } };
    const { opportunity } = toOpportunity(fullInput({ raw }));
    expect(opportunity.gsc_ctr).toBeCloseTo(0.05, 10);
  });
});
