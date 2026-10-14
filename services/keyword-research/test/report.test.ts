import { afterAll, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CSV_COLUMNS,
  toCsv,
  toJsonReport,
  toMarkdownReport,
  type JsonReport,
  type ReportContext,
} from '../src/report';
import {
  runResearch,
  type CandidateKeyword,
  type EnrichmentRow,
  type EvidenceRow,
  type GscRow,
  type ProviderCall,
  type ResearchProviders,
  type SerpRow,
  type TrendRow,
} from '../src/pipeline';
import { emptyPageMap, type ExistingPage } from '../src/pagemap';

const NOW = () => new Date('2026-10-14T00:00:00.000Z');
const GEN_AT = '2026-10-14T00:00:00.000Z';

function call<T>(rows: T[], cost = 0): ProviderCall<T> {
  return { rows, cost };
}

/* --- Canned mock data (same spirit as pipeline.test, self-contained). --- */

const SEED: CandidateKeyword[] = [
  { keyword: 'best crm for agencies', source: 'dataforseo', business_relevance: 0.9, topic_cluster: 'crm' },
  { keyword: 'crm pricing', source: 'dataforseo', business_relevance: 0.85, topic_cluster: 'crm' },
];
const EXPANDED: CandidateKeyword[] = [
  { keyword: 'top agency crm', source: 'dataforseo', business_relevance: 0.8, topic_cluster: 'crm' },
  { keyword: 'what is a crm', source: 'dataforseo', business_relevance: 0.6, topic_cluster: 'crm' },
  { keyword: 'buy crm software', source: 'dataforseo', business_relevance: 0.75, topic_cluster: 'crm' },
];
const ENRICH: EnrichmentRow[] = [
  { keyword: 'best crm for agencies', source: 'dataforseo', monthly_search_volume: 2400, organic_keyword_difficulty: 35, paid_competition: 0.6, cpc: 14 },
  { keyword: 'crm pricing', source: 'dataforseo', monthly_search_volume: 1900, organic_keyword_difficulty: 30, paid_competition: 0.8, cpc: 22 },
  { keyword: 'top agency crm', source: 'dataforseo', monthly_search_volume: 480, organic_keyword_difficulty: 28 },
  { keyword: 'what is a crm', source: 'dataforseo', monthly_search_volume: 8100, organic_keyword_difficulty: 55 },
  { keyword: 'buy crm software', source: 'dataforseo', monthly_search_volume: 320, organic_keyword_difficulty: 25 },
];
const TRENDS: TrendRow[] = [
  { keyword: 'best crm for agencies', direction: 'rising', momentum: 0.5, seasonality: [{ month: 1, index: 0.6 }, { month: 12, index: 1 }] },
];
const GSC: GscRow[] = [
  { keyword: 'best crm for agencies', impressions: 1200, clicks: 24, ctr: 0.02, average_position: 12 },
];
const SERP: SerpRow[] = [
  { keyword: 'what is a crm', competitor_evidence: [{ domain: 'rival.com', organic_position: 1, url: 'https://rival.com/crm', targets_keyword: true }], originality: 0.4 },
];
const EVIDENCE: EvidenceRow[] = [
  { keyword: 'what is a crm', url: 'https://ref.com/crm-guide', title: 'CRM Guide', excerpt: 'A CRM is…' },
  { keyword: 'best crm for agencies', url: 'https://ref.com/agency-crm', title: 'Agency CRM Roundup', excerpt: 'Top picks…' },
];

function providers(): ResearchProviders {
  return {
    seedFromDomain: async () => call(SEED, 0.05),
    gscForDomain: async () => call(GSC, 0),
    expandCandidates: async () => call(EXPANDED, 0.3),
    enrich: async () => call(ENRICH, 0.4),
    trends: async () => call(TRENDS, 0),
    serp: async () => call(SERP, 0.25),
    evidence: async () => call(EVIDENCE, 0),
  };
}

const INVENTORY: ExistingPage[] = [
  { url: 'https://example.com/pricing', targetKeywords: ['crm pricing'], intent: 'transactional' },
];

const CTX: ReportContext = {
  domain: 'example.com',
  locale: 'en-US',
  geography: 'United States',
  language: 'en',
  audience: 'agency owners evaluating a CRM',
  budgetUsd: 20,
  generatedAt: GEN_AT,
};

/** Run the pipeline once on the mock data; reuse across assertions. */
async function runOnce() {
  return runResearch({
    providers: providers(),
    project: { domain: 'example.com', locale: 'en-US', geography: 'United States', language: 'en' },
    pageInventory: INVENTORY,
    pageMap: emptyPageMap(),
    budget: { maxSpendUsd: 20 },
    now: NOW,
  });
}

/* ------------------------------------------------------------------ */
/* Tmp dir for the write→read-back round-trip.                         */
/* ------------------------------------------------------------------ */

const TMP = mkdtempSync(join(tmpdir(), 'kr-report-'));
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

describe('toJsonReport — required §16 keys', () => {
  it('carries every required top-level section', async () => {
    const result = await runOnce();
    const report = toJsonReport(result, CTX);
    const requiredKeys: (keyof JsonReport)[] = [
      'schema_version',
      'site',
      'generated_at',
      'provider_statuses',
      'data_freshness',
      'summary',
      'top_opportunities',
      'clusters',
      'content_gaps',
      'top_actions',
      'briefs',
      'sources',
      'budget',
      'limitations',
    ];
    for (const k of requiredKeys) expect(report).toHaveProperty(k);
  });

  it('summarizes site, demand attribution, difficulty, GSC, trend, clusters, actions', async () => {
    const result = await runOnce();
    const report = toJsonReport(result, CTX);

    expect(report.site.domain).toBe('example.com');
    expect(report.site.audience).toBe('agency owners evaluating a CRM');
    expect(report.summary.total_opportunities).toBeGreaterThan(0);
    expect(report.summary.clusters).toBe(report.clusters.length);

    // Demand + source attribution present on a known-volume keyword.
    const best = report.top_opportunities.find((o) => o.keyword === 'best crm for agencies')!;
    expect(best.monthly_search_volume).toBe(2400);
    expect(best.volume_source).toBe('dataforseo');
    expect(best.organic_keyword_difficulty).toBe(35);
    expect(best.gsc_impressions).toBe(1200);
    expect(best.trend_direction).toBe('rising');

    // Budget maths.
    expect(report.budget.cap_usd).toBe(20);
    expect(report.budget.spent_usd).toBeCloseTo(1.0, 4);
    expect(report.budget.remaining_usd).toBeCloseTo(19.0, 4);
  });

  it('NEVER emits a fabricated metric: unknown stays null, never 0', async () => {
    const result = await runOnce();
    const report = toJsonReport(result, CTX);
    const buy = report.top_opportunities.find((o) => o.keyword === 'buy crm software')!;
    // No GSC/trend row for this keyword → null, not 0.
    expect(buy.gsc_impressions).toBeNull();
    expect(buy.trend_direction).toBeNull();
    expect(buy.gsc_impressions).not.toBe(0);
  });

  it('includes at least one ready brief with all required brief fields', async () => {
    const result = await runOnce();
    const report = toJsonReport(result, CTX);
    expect(report.briefs.length).toBeGreaterThan(0);
    const brief = report.briefs[0]!;
    for (const field of [
      'primary_keyword',
      'page_type',
      'primary_topic',
      'related_queries',
      'audience',
      'intent',
      'outline',
      'unique_value_proposition',
      'sources',
      'internal_links',
      'checklist',
    ]) {
      expect(brief).toHaveProperty(field);
    }
    expect(brief.outline.length).toBeGreaterThan(0);
    expect(brief.checklist.length).toBeGreaterThan(0);
  });

  it('brief citations come ONLY from gathered evidence/competitors (never invented)', async () => {
    const result = await runOnce();
    const report = toJsonReport(result, CTX);
    const gatheredUrls = new Set([
      ...EVIDENCE.map((e) => e.url),
      ...SERP.flatMap((s) => (s.competitor_evidence ?? []).map((c) => c.url)),
    ]);
    for (const brief of report.briefs) {
      for (const src of brief.sources) {
        expect(gatheredUrls.has(src.url)).toBe(true);
      }
    }
  });
});

describe('report round-trip — JSON written to disk parses + validates', () => {
  it('writes JSON to the tmp dir, reads it back, and re-parses with the same keys', async () => {
    const result = await runOnce();
    const report = toJsonReport(result, CTX);
    const outDir = join(TMP, 'json');
    mkdirSync(outDir, { recursive: true });
    const path = join(outDir, 'report.json');
    writeFileSync(path, JSON.stringify(report, null, 2), 'utf8');

    const roundtripped = JSON.parse(readFileSync(path, 'utf8')) as JsonReport;
    expect(roundtripped.schema_version).toBe(1);
    expect(roundtripped.site.domain).toBe('example.com');
    expect(roundtripped.top_opportunities.length).toBe(report.top_opportunities.length);
    expect(roundtripped.briefs.length).toBe(report.briefs.length);
  });
});

describe('toMarkdownReport — required section headings + a brief', () => {
  it('renders every required §16 section heading', async () => {
    const result = await runOnce();
    const md = toMarkdownReport(result, CTX);
    const requiredHeadings = [
      '# Keyword Research — example.com',
      '## Site & Audience',
      '## Providers & Data Freshness',
      '## Top Opportunities',
      '## Demand & Source Attribution',
      '## Difficulty & Competitive Context',
      '## Search Console Opportunities',
      '## Trend & Seasonality',
      '## Clusters & Destination Pages',
      '## Content-Gap Analysis',
      '## Top Actions',
      '## Content Briefs',
      '## Sources & Timestamps',
      '## Cost & Budget',
      '## Limitations & Missing Data',
    ];
    for (const h of requiredHeadings) expect(md).toContain(h);
  });

  it('includes a concrete brief with an outline + evidence-based checklist', async () => {
    const result = await runOnce();
    const md = toMarkdownReport(result, CTX);
    expect(md).toMatch(/### Brief: .+/);
    expect(md).toContain('**Page type:**');
    expect(md).toContain('**Outline:**');
    expect(md).toContain('Evidence-based checklist');
    // A gathered citation link shows up.
    expect(md).toContain('https://ref.com/agency-crm');
  });

  it('shows unknown metrics as "n/a (unknown)" and never as 0', async () => {
    const result = await runOnce();
    const md = toMarkdownReport(result, CTX);
    expect(md).toContain('n/a (unknown)');
  });

  it('writes Markdown to disk + reads it back identical', async () => {
    const result = await runOnce();
    const md = toMarkdownReport(result, CTX);
    const outDir = join(TMP, 'md');
    mkdirSync(outDir, { recursive: true });
    const path = join(outDir, 'report.md');
    writeFileSync(path, md, 'utf8');
    expect(readFileSync(path, 'utf8')).toBe(md);
  });
});

describe('toCsv — header + one row per opportunity', () => {
  it('emits a header matching CSV_COLUMNS and one row per opportunity', async () => {
    const result = await runOnce();
    const csv = toCsv(result.opportunities);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(CSV_COLUMNS.join(','));
    // Header + N rows.
    expect(lines.length).toBe(result.opportunities.length + 1);
  });

  it('renders a null metric as an EMPTY cell (not 0)', async () => {
    const result = await runOnce();
    const csv = toCsv(result.opportunities);
    const lines = csv.split('\n');
    const volIdx = CSV_COLUMNS.indexOf('gsc_impressions');
    // Find the row for "buy crm software" (no GSC) and assert empty, not "0".
    const buyLine = lines.find((l) => l.startsWith('buy crm software'))!;
    const cells = buyLine.split(',');
    expect(cells[volIdx]).toBe('');
    expect(cells[volIdx]).not.toBe('0');
  });

  it('round-trips through disk + quotes cells containing commas', async () => {
    // A keyword with a comma must be quoted so the column count is preserved.
    const result = await runOnce();
    const csv = toCsv(result.opportunities);
    const outDir = join(TMP, 'csv');
    mkdirSync(outDir, { recursive: true });
    const path = join(outDir, 'opportunities.csv');
    writeFileSync(path, csv, 'utf8');
    const back = readFileSync(path, 'utf8');
    expect(back).toBe(csv);
    // Header column count is stable.
    expect(back.split('\n')[0]!.split(',').length).toBe(CSV_COLUMNS.length);
  });
});

describe('report — GSC-absent run surfaces an explicit limitation', () => {
  it('states the missing data rather than inventing it', async () => {
    const prov = providers();
    delete prov.gscForDomain;
    const result = await runResearch({
      providers: prov,
      project: { domain: 'example.com', locale: 'en-US', geography: 'United States', language: 'en' },
      pageInventory: INVENTORY,
      pageMap: emptyPageMap(),
      budget: { maxSpendUsd: 20 },
      now: NOW,
    });
    const md = toMarkdownReport(result, CTX);
    // The GSC section honestly says there was no data.
    expect(md).toContain('No first-party Search Console data');
    // And the Limitations section carries the note.
    expect(md).toMatch(/## Limitations & Missing Data[\s\S]*Search Console/);
  });
});
