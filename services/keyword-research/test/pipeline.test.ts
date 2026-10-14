import { describe, expect, it } from 'vitest';
import {
  decideAction,
  runResearch,
  type CandidateKeyword,
  type EnrichmentRow,
  type EvidenceRow,
  type GscRow,
  type ProviderCall,
  type ResearchProviders,
  type RunResearchInput,
  type SerpRow,
  type TrendRow,
} from '../src/pipeline';
import { assertSinglePrimary } from '../src/cluster';
import { emptyPageMap, type ExistingPage } from '../src/pagemap';
import { KeywordOpportunity } from '../src/types';

const NOW = () => new Date('2026-10-14T00:00:00.000Z');

/** Wrap rows in a ProviderCall with an explicit cost. */
function call<T>(rows: T[], cost = 0, note?: string): ProviderCall<T> {
  return { rows, cost, ...(note ? { note } : {}) };
}

/* ------------------------------------------------------------------ */
/* Canned mock data — deterministic, zero network.                     */
/* ------------------------------------------------------------------ */

const SEED: CandidateKeyword[] = [
  { keyword: 'best crm for agencies', source: 'dataforseo', business_relevance: 0.9, topic_cluster: 'crm' },
  { keyword: 'crm pricing', source: 'dataforseo', business_relevance: 0.85, topic_cluster: 'crm' },
];

const EXPANDED: CandidateKeyword[] = [
  // Duplicate of a seed from a DIFFERENT source → must dedup to one opportunity.
  { keyword: 'best crm for agencies', source: 'exa', business_relevance: 0.88 },
  // Same stem ("agency crm") AND same (comparison) intent as the seed above →
  // clusters together, lower score ⇒ supporting member.
  { keyword: 'top agency crm', source: 'dataforseo', business_relevance: 0.8, topic_cluster: 'crm' },
  { keyword: 'what is a crm', source: 'dataforseo', business_relevance: 0.6, topic_cluster: 'crm' },
  { keyword: 'buy crm software', source: 'dataforseo', business_relevance: 0.7, topic_cluster: 'crm' },
];

const ENRICH: EnrichmentRow[] = [
  { keyword: 'best crm for agencies', source: 'dataforseo', monthly_search_volume: 2400, organic_keyword_difficulty: 35, paid_competition: 0.6, cpc: 14 },
  { keyword: 'crm pricing', source: 'dataforseo', monthly_search_volume: 1900, organic_keyword_difficulty: 30, paid_competition: 0.8, cpc: 22 },
  { keyword: 'top agency crm', source: 'dataforseo', monthly_search_volume: 480, organic_keyword_difficulty: 28 },
  { keyword: 'what is a crm', source: 'dataforseo', monthly_search_volume: 8100, organic_keyword_difficulty: 55 },
  { keyword: 'buy crm software', source: 'dataforseo', monthly_search_volume: 320, organic_keyword_difficulty: 25 },
  // NOTE: deliberately NO row for a keyword to prove "missing ⇒ null not zero".
];

const TRENDS: TrendRow[] = [
  { keyword: 'best crm for agencies', direction: 'rising', momentum: 0.5 },
  { keyword: 'what is a crm', direction: 'flat', momentum: 0.2 },
];

const GSC: GscRow[] = [
  { keyword: 'best crm for agencies', impressions: 1200, clicks: 24, ctr: 0.02, average_position: 12 },
];

const SERP: SerpRow[] = [
  {
    keyword: 'what is a crm',
    competitor_evidence: [
      { domain: 'rival.com', organic_position: 1, url: 'https://rival.com/crm', targets_keyword: true },
    ],
    originality: 0.4,
  },
];

const EVIDENCE: EvidenceRow[] = [
  { keyword: 'what is a crm', url: 'https://ref.com/crm-guide', title: 'CRM Guide', excerpt: 'A CRM is…' },
];

/** A full provider set (all phases present). */
function fullProviders(costs: Partial<Record<keyof ResearchProviders, number>> = {}): ResearchProviders {
  return {
    seedFromDomain: async () => call(SEED, costs.seedFromDomain ?? 0.05),
    gscForDomain: async () => call(GSC, costs.gscForDomain ?? 0),
    expandCandidates: async () => call(EXPANDED, costs.expandCandidates ?? 0.3),
    enrich: async () => call(ENRICH, costs.enrich ?? 0.4),
    trends: async () => call(TRENDS, costs.trends ?? 0),
    serp: async () => call(SERP, costs.serp ?? 0.25),
    evidence: async () => call(EVIDENCE, costs.evidence ?? 0),
  };
}

const INVENTORY: ExistingPage[] = [
  // An existing page that serves "crm pricing" (transactional) → improve_existing.
  // Existing pages are real URLs (the KeywordOpportunity schema requires a URL
  // for existing_matching_page; recommended_url may be a bare path).
  { url: 'https://example.com/pricing', targetKeywords: ['crm pricing'], intent: 'transactional' },
];

function baseInput(overrides: Partial<RunResearchInput> = {}): RunResearchInput {
  return {
    providers: fullProviders(),
    project: { domain: 'example.com', locale: 'en-US', geography: 'United States', language: 'en' },
    pageInventory: INVENTORY,
    pageMap: emptyPageMap(),
    budget: { maxSpendUsd: 20 },
    now: NOW,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* Tests.                                                              */
/* ------------------------------------------------------------------ */

describe('runResearch — happy path on mocked providers', () => {
  it('produces schema-valid, ranked opportunities', async () => {
    const res = await runResearch(baseInput());
    expect(res.opportunities.length).toBeGreaterThan(0);
    for (const o of res.opportunities) {
      expect(KeywordOpportunity.safeParse(o).success).toBe(true);
    }
    // Ranked descending by score.
    for (let i = 1; i < res.opportunities.length; i++) {
      expect(res.opportunities[i - 1]!.opportunity_score).toBeGreaterThanOrEqual(
        res.opportunities[i]!.opportunity_score,
      );
    }
  });

  it('DEDUPS the same keyword from two sources into one opportunity', async () => {
    const res = await runResearch(baseInput());
    const dupes = res.opportunities.filter((o) => o.keyword === 'best crm for agencies');
    expect(dupes).toHaveLength(1);
    // Provenance merged both sources.
    const sources = new Set(dupes[0]!.source_provenance.map((p) => p.source));
    expect(sources.has('dataforseo')).toBe(true);
    expect(sources.has('exa')).toBe(true);
  });

  it('classifies intent per keyword', async () => {
    const res = await runResearch(baseInput());
    const byKw = Object.fromEntries(res.opportunities.map((o) => [o.keyword, o]));
    expect(byKw['crm pricing']?.search_intent).toBe('transactional');
    expect(byKw['what is a crm']?.search_intent).toBe('informational');
    expect(byKw['buy crm software']?.search_intent).toBe('transactional');
    expect(byKw['best crm for agencies']?.search_intent).toBe('comparison');
  });

  it('MISSING metric ⇒ null, never 0 (a keyword with no enrichment)', async () => {
    // Add a candidate that NO enrichment/trend/gsc row covers.
    const providers = fullProviders();
    const withOrphan: ResearchProviders = {
      ...providers,
      expandCandidates: async () =>
        call([...EXPANDED, { keyword: 'obscure crm tactic', source: 'dataforseo', business_relevance: 0.5 }], 0.3),
    };
    const res = await runResearch(baseInput({ providers: withOrphan }));
    const orphan = res.opportunities.find((o) => o.keyword === 'obscure crm tactic')!;
    expect(orphan).toBeDefined();
    expect(orphan.monthly_search_volume).toBeNull();
    expect(orphan.organic_keyword_difficulty).toBeNull();
    expect(orphan.cpc).toBeNull();
    expect(orphan.gsc_impressions).toBeNull();
    expect(orphan.trend_direction).toBeNull();
    // Explicitly NOT zero.
    expect(orphan.monthly_search_volume).not.toBe(0);
  });

  it('matches an existing page ⇒ improve_existing', async () => {
    const res = await runResearch(baseInput());
    const pricing = res.opportunities.find((o) => o.keyword === 'crm pricing')!;
    expect(pricing.existing_matching_page).toBe('https://example.com/pricing');
    expect(pricing.recommended_action).toBe('improve_existing');
  });

  it('clusters with EXACTLY ONE primary per page', async () => {
    const res = await runResearch(baseInput());
    expect(res.clusters.length).toBeGreaterThan(0);
    for (const c of res.clusters) {
      expect(c.members.filter((m) => m.role === 'primary')).toHaveLength(1);
      assertSinglePrimary(c);
    }
    // "best crm for agencies" + "agency crm" share a stem+intent+destination →
    // one cluster, one primary, the other supporting.
    const agencyCluster = res.clusters.find((c) =>
      c.members.some((m) => m.keyword === 'best crm for agencies'),
    )!;
    expect(agencyCluster.members.length).toBeGreaterThanOrEqual(2);
    expect(agencyCluster.primaryKeyword).toBe('best crm for agencies');
  });

  it('assigns EXACTLY ONE recommended_action per opportunity, all from the enum', async () => {
    const res = await runResearch(baseInput());
    const allowed = new Set([
      'create_new',
      'improve_existing',
      'consolidate',
      'supporting_blog',
      'comparison_content',
      'monitor',
      'reject',
    ]);
    for (const o of res.opportunities) {
      expect(allowed.has(o.recommended_action)).toBe(true);
      expect(o.scoring_explanation.length).toBeGreaterThan(0);
    }
  });

  it('demotes a supporting cluster member from create_new to supporting_blog', async () => {
    const res = await runResearch(baseInput());
    const supporting = res.opportunities.find((o) => o.keyword === 'top agency crm')!;
    // "top agency crm" is the lower-scoring sibling of "best crm for agencies"
    // (same cluster) → it must NOT claim its own create_new page.
    expect(supporting.recommended_action).not.toBe('create_new');
    expect(['supporting_blog', 'improve_existing', 'monitor', 'reject', 'comparison_content']).toContain(
      supporting.recommended_action,
    );
  });

  it('tracks provider statuses + actual cost (sum of per-phase costs)', async () => {
    const res = await runResearch(baseInput());
    // 0.05 + 0 + 0.3 + 0.4 + 0 + 0.25 + 0 = 1.00
    expect(res.costActual).toBeCloseTo(1.0, 4);
    const called = res.providerStatuses.filter((s) => s.called).map((s) => s.provider);
    expect(called).toContain('seedFromDomain');
    expect(called).toContain('enrich');
    expect(called).toContain('serp');
  });

  it('updates the keyword→page map with an assignment per opportunity', async () => {
    const res = await runResearch(baseInput());
    expect(Object.keys(res.keywordPageMap.entries).length).toBeGreaterThan(0);
    expect(res.keywordPageMap.entries['crm pricing']?.url).toBe('https://example.com/pricing');
  });

  it('gathers citation evidence (never as a metric)', async () => {
    const res = await runResearch(baseInput());
    expect(res.evidence.length).toBeGreaterThan(0);
    expect(res.evidence[0]).not.toHaveProperty('monthly_search_volume');
  });
});

describe('runResearch — cannibalization safeguard', () => {
  it('assigns consolidate when multiple existing pages serve the same intent', async () => {
    const cannibalInventory: ExistingPage[] = [
      { url: 'https://example.com/pricing', targetKeywords: ['crm pricing'], intent: 'transactional' },
      { url: 'https://example.com/plans-crm', targetKeywords: ['crm pricing'], intent: 'transactional' },
    ];
    const res = await runResearch(baseInput({ pageInventory: cannibalInventory }));
    const pricing = res.opportunities.find((o) => o.keyword === 'crm pricing')!;
    expect(pricing.recommended_action).toBe('consolidate');
  });
});

describe('runResearch — GSC absent ⇒ redistribution + limitation', () => {
  it('drops GSC fields to null and notes the limitation (never fabricates)', async () => {
    const providers = fullProviders();
    delete providers.gscForDomain; // GSC provider absent
    const res = await runResearch(baseInput({ providers }));

    // Every opportunity's GSC fields are null.
    for (const o of res.opportunities) {
      expect(o.gsc_impressions).toBeNull();
      expect(o.gsc_clicks).toBeNull();
      expect(o.gsc_average_position).toBeNull();
    }
    // A limitation explains the drop + redistribution.
    expect(res.limitations.join('\n')).toMatch(/Search Console/i);
    expect(res.limitations.join('\n')).toMatch(/redistribut/i);
    // The scorer's explanation shows GSC was dropped for a scored keyword.
    const scored = res.opportunities.find((o) => o.opportunity_score > 0)!;
    expect(scored.scoring_explanation).toMatch(/gscOpportunity/);
  });

  it('a WITH-GSC run scores the GSC dimension differently than a WITHOUT-GSC run', async () => {
    const withGsc = await runResearch(baseInput());
    const providersNoGsc = fullProviders();
    delete providersNoGsc.gscForDomain;
    const withoutGsc = await runResearch(baseInput({ providers: providersNoGsc }));

    const kw = 'best crm for agencies';
    const a = withGsc.opportunities.find((o) => o.keyword === kw)!;
    const b = withoutGsc.opportunities.find((o) => o.keyword === kw)!;
    // Same keyword, different signal set ⇒ scores must differ (redistribution).
    expect(a.opportunity_score).not.toBe(b.opportunity_score);
    expect(a.gsc_impressions).toBe(1200);
    expect(b.gsc_impressions).toBeNull();
  });
});

describe('runResearch — budget cap is a HARD stop', () => {
  it('skips costed phases that would exceed the cap (never overspends)', async () => {
    // Cap at $0.35: seed ($0.05) runs, expand ($0.30) runs (0.35 total, == cap
    // is allowed), but enrich ($0.40) would blow it → skipped. SERP skipped too.
    const res = await runResearch(baseInput({ budget: { maxSpendUsd: 0.35 } }));
    expect(res.costActual).toBeLessThanOrEqual(0.35);

    const enrichStatus = res.providerStatuses.find((s) => s.provider === 'enrich')!;
    expect(enrichStatus.called).toBe(false);
    expect(enrichStatus.note).toMatch(/budget/i);

    // A limitation documents the skip.
    expect(res.limitations.join('\n')).toMatch(/exceed|cap|budget/i);

    // Because enrichment was skipped, demand metrics are null (not fabricated).
    const anyOpp = res.opportunities[0]!;
    expect(anyOpp.monthly_search_volume).toBeNull();
  });

  it('a generous cap runs every phase', async () => {
    const res = await runResearch(baseInput({ budget: { maxSpendUsd: 100 } }));
    const skipped = res.providerStatuses.filter((s) => s.note?.includes('budget'));
    expect(skipped).toHaveLength(0);
  });
});

describe('runResearch — absent providers never fabricate', () => {
  it('with only a seed provider, metrics are null + limitations list every gap', async () => {
    const res = await runResearch(
      baseInput({ providers: { seedFromDomain: async () => call(SEED, 0.05) } }),
    );
    expect(res.opportunities.length).toBeGreaterThan(0);
    for (const o of res.opportunities) {
      expect(o.monthly_search_volume).toBeNull();
      expect(o.gsc_impressions).toBeNull();
    }
    // Limitations name the absent providers.
    const lim = res.limitations.join('\n');
    expect(lim).toMatch(/expansion provider/i);
    expect(lim).toMatch(/volume\/difficulty provider/i);
    expect(lim).toMatch(/Search Console/i);
    expect(res.evidence).toEqual([]);
  });
});

describe('decideAction — exactly one action, correct precedence', () => {
  it('cannibalization wins over everything', () => {
    expect(
      decideAction({ score: 95, cannibalization: true, hasExistingPage: true, matchHint: 'improve_existing', intent: 'commercial' }).action,
    ).toBe('consolidate');
  });
  it('low score rejects', () => {
    expect(
      decideAction({ score: 10, cannibalization: false, hasExistingPage: false, matchHint: 'create_new', intent: 'commercial' }).action,
    ).toBe('reject');
  });
  it('marginal score monitors', () => {
    expect(
      decideAction({ score: 30, cannibalization: false, hasExistingPage: false, matchHint: 'create_new', intent: 'commercial' }).action,
    ).toBe('monitor');
  });
  it('strong + existing page improves', () => {
    expect(
      decideAction({ score: 70, cannibalization: false, hasExistingPage: true, matchHint: 'improve_existing', intent: 'commercial' }).action,
    ).toBe('improve_existing');
  });
  it('strong + comparison intent → comparison_content', () => {
    expect(
      decideAction({ score: 70, cannibalization: false, hasExistingPage: false, matchHint: 'create_new', intent: 'comparison' }).action,
    ).toBe('comparison_content');
  });
  it('strong + informational intent → supporting_blog', () => {
    expect(
      decideAction({ score: 70, cannibalization: false, hasExistingPage: false, matchHint: 'create_new', intent: 'informational' }).action,
    ).toBe('supporting_blog');
  });
  it('strong commercial with no page → create_new', () => {
    expect(
      decideAction({ score: 70, cannibalization: false, hasExistingPage: false, matchHint: 'create_new', intent: 'transactional' }).action,
    ).toBe('create_new');
  });
});
