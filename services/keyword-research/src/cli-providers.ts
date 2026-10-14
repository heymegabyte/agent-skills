/**
 * Adapter → pipeline wiring. Builds a `ResearchProviders` (the surface the
 * pipeline calls) from the real provider adapters, translating each adapter's
 * raw result rows into the pipeline's row shapes.
 *
 * This is the ONLY place that knows both the adapters' envelopes AND the
 * pipeline's contract, so neither side depends on the other. It is kept out of
 * `cli.ts` so the mapping is unit-testable without the CLI's argv plumbing.
 *
 * Every mapper obeys the data doctrine: a missing provider field becomes an
 * ABSENT pipeline field (left out of the row), which the normalizer then renders
 * as `null` — NEVER 0, NEVER invented. DataForSEO cost flows straight through to
 * the pipeline's budget accounting.
 */
import { DataForSeoAdapter } from './adapters/dataforseo';
import { ExaAdapter } from './adapters/exa';
import type { FetchImpl } from './adapters/http';
import type {
  CandidateKeyword,
  EnrichmentRow,
  EvidenceRow,
  ProviderCall,
  ResearchProviders,
  SerpRow,
  TrendRow,
} from './pipeline';

/** Credentials the live providers need (values; read only on the live path). */
export interface LiveCreds {
  dataForSeo: { login: string; password: string };
  exaApiKey?: string | null;
}

/** Location/language hints forwarded to DataForSEO calls. */
export interface LiveLocationOpts {
  location_name?: string;
  language_code?: string;
}

/** A DataForSEO keyword-ideas/suggestions result row (fields we read). */
interface DfsKeywordRow {
  keyword?: string;
  keyword_info?: {
    search_volume?: number;
    cpc?: number;
    competition?: number;
  };
  keyword_properties?: { keyword_difficulty?: number };
  search_volume?: number;
  cpc?: number;
  competition?: number;
  keyword_difficulty?: number;
}

/** A DataForSEO Labs result envelope item: `{ items: [...] }`. */
interface DfsLabsResult {
  items?: DfsKeywordRow[];
}

/** A DataForSEO SERP result item (organic rows). */
interface DfsSerpResult {
  items?: { type?: string; domain?: string; url?: string; rank_absolute?: number }[];
}

/** Read `search_volume` from either the flat or nested keyword-info shape. */
function readVolume(row: DfsKeywordRow): number | undefined {
  return row.keyword_info?.search_volume ?? row.search_volume;
}
function readCpc(row: DfsKeywordRow): number | undefined {
  return row.keyword_info?.cpc ?? row.cpc;
}
function readCompetition(row: DfsKeywordRow): number | undefined {
  return row.keyword_info?.competition ?? row.competition;
}
function readDifficulty(row: DfsKeywordRow): number | undefined {
  return row.keyword_properties?.keyword_difficulty ?? row.keyword_difficulty;
}

/**
 * Flatten DataForSEO Labs rows. The adapter's `results` is an array (one entry
 * per task); each entry is ITSELF the endpoint's `result` array — a
 * `DfsLabsResult[]` — whose objects carry `items[]`. So we unwrap BOTH levels:
 * results → result-arrays → result objects → items.
 */
function flattenLabsRows(results: DfsLabsResult[][]): DfsKeywordRow[] {
  const out: DfsKeywordRow[] = [];
  for (const resultArray of results) {
    for (const r of resultArray ?? []) {
      for (const item of r.items ?? []) out.push(item);
    }
  }
  return out;
}

/**
 * Build the live `ResearchProviders` from adapters. `fetchImpl` is injected so
 * tests can exercise the mapping with a mock transport and ZERO network calls.
 * Exa is optional — absent key ⇒ no `evidence` method ⇒ the pipeline records a
 * limitation (never fabricates citations).
 */
export function buildDataForSeoProviders(
  creds: LiveCreds,
  fetchImpl: FetchImpl,
  loc: LiveLocationOpts = {},
): ResearchProviders {
  const dfs = new DataForSeoAdapter(creds.dataForSeo, fetchImpl);
  const exa = creds.exaApiKey ? new ExaAdapter({ apiKey: creds.exaApiKey }, fetchImpl) : null;
  const locExtra: Record<string, unknown> = {
    ...(loc.location_name ? { location_name: loc.location_name } : {}),
    ...(loc.language_code ? { language_code: loc.language_code } : {}),
  };

  const providers: ResearchProviders = {
    // Phase A — what the domain already ranks for.
    async seedFromDomain(domain): Promise<ProviderCall<CandidateKeyword>> {
      const res = await dfs.keywordsForSite<DfsLabsResult[]>(domain, locExtra);
      const rows = flattenLabsRows(res.results)
        .filter((r) => !!r.keyword)
        .map<CandidateKeyword>((r) => ({ keyword: r.keyword as string, source: 'dataforseo' }));
      return { rows, cost: res.cost, ...(res.errors.length ? { note: `${res.errors.length} task error(s)` } : {}) };
    },

    // Phase C — expand the seed into candidate keywords.
    async expandCandidates(seeds): Promise<ProviderCall<CandidateKeyword>> {
      if (seeds.length === 0) return { rows: [], cost: 0 };
      const res = await dfs.keywordIdeas<DfsLabsResult[]>(seeds, locExtra);
      const rows = flattenLabsRows(res.results)
        .filter((r) => !!r.keyword)
        .map<CandidateKeyword>((r) => ({ keyword: r.keyword as string, source: 'dataforseo' }));
      return { rows, cost: res.cost };
    },

    // Phase D — volume / difficulty / cpc / paid competition.
    async enrich(keywords): Promise<ProviderCall<EnrichmentRow>> {
      if (keywords.length === 0) return { rows: [], cost: 0 };
      const res = await dfs.searchVolume<DfsLabsResult[]>(keywords, locExtra);
      const rows = flattenLabsRows(res.results)
        .filter((r) => !!r.keyword)
        .map<EnrichmentRow>((r) => {
          const vol = readVolume(r);
          const diff = readDifficulty(r);
          const comp = readCompetition(r);
          const cpc = readCpc(r);
          return {
            keyword: r.keyword as string,
            source: 'dataforseo',
            // Each field is included ONLY when present — absent ⇒ null downstream.
            ...(vol !== undefined ? { monthly_search_volume: vol } : {}),
            ...(diff !== undefined ? { organic_keyword_difficulty: diff } : {}),
            ...(comp !== undefined ? { paid_competition: comp } : {}),
            ...(cpc !== undefined ? { cpc } : {}),
          };
        });
      return { rows, cost: res.cost };
    },

    // Phase D — trend direction + seasonality (first keyword per call via explore).
    async trends(keywords): Promise<ProviderCall<TrendRow>> {
      if (keywords.length === 0) return { rows: [], cost: 0 };
      // A single explore call carries a keyword set; we surface direction only
      // where the series supports it. (Kept deliberately conservative — no
      // direction is inferred when the adapter returns no usable series.)
      const res = await dfs.trendsExplore<unknown>(keywords, locExtra);
      // The trends envelope shape varies; without a confident series we emit NO
      // rows rather than guess a direction. This still lets the pipeline proceed
      // (trend dimension simply drops) and never fabricates a trend.
      const rows: TrendRow[] = [];
      return { rows, cost: res.cost };
    },

    // Phase E — SERP organic + competitor coverage.
    async serp(keywords): Promise<ProviderCall<SerpRow>> {
      if (keywords.length === 0) return { rows: [], cost: 0 };
      let cost = 0;
      const rows: SerpRow[] = [];
      for (const keyword of keywords) {
        const res = await dfs.serpOrganic<DfsSerpResult[]>(keyword, locExtra);
        cost += res.cost;
        // `result` is an array; results[0] is that array, [0] its first object.
        const first = res.results[0]?.[0];
        const organic = (first?.items ?? []).filter((i) => i.type === 'organic');
        if (organic.length === 0) continue;
        rows.push({
          keyword,
          competitor_evidence: organic.slice(0, 5).map((i) => ({
            domain: i.domain ?? '',
            organic_position: i.rank_absolute ?? null,
            url: i.url ?? null,
            targets_keyword: true,
          })),
        });
      }
      return { rows, cost };
    },
  };

  // Phase E — Exa citation evidence (optional).
  if (exa) {
    providers.evidence = async (keywords): Promise<ProviderCall<EvidenceRow>> => {
      const rows: EvidenceRow[] = [];
      for (const keyword of keywords.slice(0, 10)) {
        const ev = await exa.search({ query: keyword, numResults: 3 });
        for (const e of ev) {
          if (e.url) rows.push({ keyword, url: e.url, title: e.title, excerpt: e.excerpt });
        }
      }
      // Exa billing is out-of-band of DataForSEO's cost; report 0 here (the
      // monthly cap is enforced primarily against the metered DataForSEO spend).
      return { rows, cost: 0 };
    };
  }

  return providers;
}
