import { describe, expect, it } from 'vitest';
import {
  assertSinglePrimary,
  clusterOpportunities,
  likelyDestination,
  stemKeyword,
} from '../src/cluster';
import { KeywordOpportunity, type SearchIntent } from '../src/types';

const COLLECTED_AT = '2026-10-14T00:00:00.000Z';

/** Build a minimal, schema-valid opportunity with only the clustering-relevant
 *  fields varied. */
function opp(
  keyword: string,
  score: number,
  overrides: Partial<KeywordOpportunity> = {},
): KeywordOpportunity {
  const base: KeywordOpportunity = {
    keyword,
    locale: 'en-US',
    geography: 'United States',
    language: 'en',
    search_intent: 'commercial' as SearchIntent,
    intent_confidence: 0.8,
    topic_cluster: 'crm',
    monthly_search_volume: 100,
    volume_source: 'dataforseo',
    organic_keyword_difficulty: 30,
    paid_competition: 0.5,
    cpc: 10,
    gsc_impressions: null,
    gsc_clicks: null,
    gsc_ctr: null,
    gsc_average_position: null,
    trend_direction: null,
    trend_momentum: null,
    seasonality: null,
    competitor_evidence: [],
    existing_matching_page: null,
    recommended_url: null,
    recommended_action: 'monitor',
    opportunity_score: score,
    scoring_explanation: 'x',
    source_provenance: [],
    collected_at: COLLECTED_AT,
    data_freshness: 1,
    confidence: 0.7,
  };
  return KeywordOpportunity.parse({ ...base, ...overrides });
}

describe('stemKeyword', () => {
  it('folds word order + plurals + stop words together', () => {
    expect(stemKeyword('best crm for agencies')).toBe(stemKeyword('agency crm'));
    expect(stemKeyword('crm tools')).toBe(stemKeyword('crm tool'));
  });
  it('does not collapse distinct head terms', () => {
    expect(stemKeyword('crm pricing')).not.toBe(stemKeyword('crm tutorial'));
  });
  it('falls back to the raw phrase when every token is a stop word', () => {
    expect(stemKeyword('the best')).not.toBe('');
  });
});

describe('likelyDestination', () => {
  it('prefers recommended_url', () => {
    const o = opp('crm', 50, { recommended_url: '/pricing' });
    expect(likelyDestination(o, 'crm')).toBe('pricing');
  });
  it('falls back to the existing page path, then the stem', () => {
    const withExisting = opp('crm', 50, { existing_matching_page: 'https://s.tld/features/crm' });
    expect(likelyDestination(withExisting, 'crm')).toBe('features/crm');
    const bare = opp('crm software', 50);
    expect(likelyDestination(bare, stemKeyword('crm software'))).toContain('crm');
  });
});

describe('clusterOpportunities — one primary per page (the core invariant)', () => {
  it('groups same-stem+intent+destination keywords with exactly ONE primary', () => {
    const clusters = clusterOpportunities([
      opp('best crm for agencies', 70),
      opp('agency crm', 55),
      opp('crm for agencies', 40),
    ]);
    expect(clusters).toHaveLength(1);
    const c = clusters[0]!;
    // Exactly one primary, and it's the highest-scoring member.
    const primaries = c.members.filter((m) => m.role === 'primary');
    expect(primaries).toHaveLength(1);
    expect(c.primaryKeyword).toBe('best crm for agencies');
    expect(primaries[0]?.score).toBe(70);
    // The rest are supporting.
    expect(c.members.filter((m) => m.role === 'supporting')).toHaveLength(2);
    assertSinglePrimary(c);
  });

  it('NEVER produces two primaries even on a score tie (deterministic break)', () => {
    // Same stem ("crm software" ≡ "software crm" after stop-word + sort folding),
    // identical score AND volume — forces the alphabetical tie-break.
    const clusters = clusterOpportunities([
      opp('software crm', 60, { monthly_search_volume: 500 }),
      opp('crm software', 60, { monthly_search_volume: 500 }),
    ]);
    expect(clusters).toHaveLength(1);
    const c = clusters[0]!;
    expect(c.members.filter((m) => m.role === 'primary')).toHaveLength(1);
    // Tie broken alphabetically on the raw keyword: "crm software" < "software crm".
    expect(c.primaryKeyword).toBe('crm software');
  });

  it('splits by intent — same head term, different intent ⇒ different pages', () => {
    const clusters = clusterOpportunities([
      opp('crm pricing', 65, { search_intent: 'transactional' }),
      opp('crm guide', 50, { search_intent: 'informational' }),
    ]);
    expect(clusters).toHaveLength(2);
    for (const c of clusters) assertSinglePrimary(c);
  });

  it('splits by destination — same stem+intent but different target pages', () => {
    // All three share stem ("crm feature") + intent (commercial); only the
    // destination differs, so same-destination pair clusters and the odd one out
    // stands alone.
    const clusters = clusterOpportunities([
      opp('crm features', 65, { search_intent: 'commercial', recommended_url: '/features' }),
      opp('crm feature', 55, { search_intent: 'commercial', recommended_url: '/features' }),
      opp('crm feature', 60, {
        search_intent: 'commercial',
        recommended_url: '/compare', // same stem+intent, DIFFERENT destination
      }),
    ]);
    // Two distinct destinations ⇒ two clusters, each single-primary.
    expect(clusters).toHaveLength(2);
    for (const c of clusters) assertSinglePrimary(c);
    // The /features cluster has two members; /compare stands alone.
    const byDest = Object.fromEntries(clusters.map((c) => [c.destination, c.members.length]));
    expect(byDest['features']).toBe(2);
    expect(byDest['compare']).toBe(1);
  });

  it('orders clusters by their primary score (desc)', () => {
    const clusters = clusterOpportunities([
      opp('low score term', 20),
      opp('high score term', 90),
      opp('mid score term', 55),
    ]);
    const scores = clusters.map((c) => c.members[0]?.score);
    expect(scores).toEqual([90, 55, 20]);
  });

  it('is PURE + deterministic (same input twice ⇒ identical clusters)', () => {
    const input = [opp('crm pricing', 70), opp('crm cost', 50)];
    expect(JSON.stringify(clusterOpportunities(input))).toBe(
      JSON.stringify(clusterOpportunities(input)),
    );
  });

  it('handles an empty input', () => {
    expect(clusterOpportunities([])).toEqual([]);
  });
});
