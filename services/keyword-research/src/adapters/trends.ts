/**
 * Google Trends adapter — demand DIRECTION + relative interest, never absolute
 * volume. Trends gives a 0–100 index relative to the series' own peak; it is a
 * categorical mistake to present it as a monthly search count. This adapter
 * guards that boundary.
 *
 * Resolve order (first available wins):
 *   1. Official Google Trends API  — iff official creds are present.
 *   2. DataForSEO `trendsExplore`  — iff a DataForSEO adapter is injected.
 *   3. Neither                     — return `{ available: false, reason }`.
 *
 * Whatever resolves sets `volume_source` so downstream provenance is honest,
 * and the interest series is ALWAYS normalized to a 0–100 index with an
 * explicit `is_index: true` flag so no caller can misread it as a volume.
 */
import {
  requestJson,
  type FetchImpl,
  type RequestJsonOptions,
} from './http';
import type { DataForSeoAdapter } from './dataforseo';
import {
  deriveTrendSignals,
  type DerivedTrendSignals,
} from './trend-signals';

/** One point on the normalized interest curve. */
export interface TrendPoint {
  /** ISO date (or period label) for the datum. */
  date: string;
  /** 0–100 relative interest index (NOT a volume). */
  index: number;
}

/** The normalized trends payload. `available:false` carries a reason. */
export type TrendsResult =
  | {
      available: true;
      keyword: string;
      /** Where the series came from, e.g. "google_trends" | "dataforseo". */
      volume_source: string;
      /** 0–100 relative interest over time. */
      interest_over_time: TrendPoint[];
      /** Loud flag so nobody treats `index` as an absolute search volume. */
      is_index: true;
      /**
       * Normalized signals DERIVED from `interest_over_time`: direction,
       * momentum (signed −1..1), and seasonality. Every field is `null` when
       * the series is too short/sparse to support it — never fabricated.
       */
      signals: DerivedTrendSignals;
    }
  | { available: false; reason: string };

/** Official API credentials. Presence of `apiKey` flips on resolution step 1. */
export interface OfficialTrendsCreds {
  apiKey?: string;
  baseUrl?: string;
}

export interface TrendsAdapterDeps {
  fetchImpl?: FetchImpl;
  official?: OfficialTrendsCreds;
  /** An already-constructed DataForSEO adapter (step 2 fallback). */
  dataforseo?: DataForSeoAdapter;
  retry?: Pick<RequestJsonOptions, 'delays' | 'sleep'>;
}

/** Clamp an arbitrary number into the 0–100 index range. */
function clampIndex(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
}

export class TrendsAdapter {
  private readonly fetchImpl: FetchImpl;
  private readonly official?: OfficialTrendsCreds;
  private readonly dataforseo?: DataForSeoAdapter;
  private readonly retry: Pick<RequestJsonOptions, 'delays' | 'sleep'>;

  constructor(deps: TrendsAdapterDeps = {}) {
    this.fetchImpl = deps.fetchImpl ?? globalThis.fetch;
    this.official = deps.official;
    this.dataforseo = deps.dataforseo;
    this.retry = deps.retry ?? {};
  }

  /** Whether the official API is usable (creds present). */
  private hasOfficial(): boolean {
    return Boolean(this.official?.apiKey);
  }

  /**
   * Resolve interest-over-time for a keyword via the first available source.
   * `geo`/`timeRange` are passthrough hints forwarded to whichever source wins.
   */
  async explore(
    keyword: string,
    opts: { geo?: string; timeRange?: string } = {},
  ): Promise<TrendsResult> {
    if (this.hasOfficial()) {
      return this.viaOfficial(keyword, opts);
    }
    if (this.dataforseo) {
      return this.viaDataForSeo(keyword, opts);
    }
    return {
      available: false,
      reason:
        'No trends source configured: supply official Trends creds or a DataForSEO adapter.',
    };
  }

  /** Step 1 — official Google Trends API. */
  private async viaOfficial(
    keyword: string,
    opts: { geo?: string; timeRange?: string },
  ): Promise<TrendsResult> {
    const base = (this.official?.baseUrl ?? 'https://trends.googleapis.com').replace(
      /\/+$/,
      '',
    );
    const params = new URLSearchParams({
      key: this.official?.apiKey ?? '',
      term: keyword,
      ...(opts.geo ? { geo: opts.geo } : {}),
      ...(opts.timeRange ? { time: opts.timeRange } : {}),
    });
    const res = await requestJson<{ timelineData?: { time?: string; value?: number[] }[] }>(
      this.fetchImpl,
      `${base}/v1beta/trends:explore?${params.toString()}`,
      { method: 'GET', ...this.retry },
    );
    const interest: TrendPoint[] = (res.timelineData ?? []).map((pt) => ({
      date: pt.time ?? '',
      index: clampIndex(pt.value?.[0]),
    }));
    return {
      available: true,
      keyword,
      volume_source: 'google_trends',
      interest_over_time: interest,
      is_index: true,
      signals: deriveTrendSignals(interest),
    };
  }

  /** Step 2 — DataForSEO's Google Trends explore endpoint. */
  private async viaDataForSeo(
    keyword: string,
    opts: { geo?: string; timeRange?: string },
  ): Promise<TrendsResult> {
    const split = await this.dataforseo!.trendsExplore<DfsTrendResult[]>([keyword], {
      ...(opts.geo ? { location_name: opts.geo } : {}),
      ...(opts.timeRange ? { time_range: opts.timeRange } : {}),
    });

    // `split.results` is one entry per task; each entry is the endpoint's
    // `result` ARRAY. We parse the FIRST result object's interest-over-time
    // item. The requested keyword is index 0 of the `keywords[]` we sent, so we
    // extract column 0 from each row's `values[]`.
    const resultObj = split.results[0]?.[0];
    const interest = extractSeries(resultObj, 0);

    return {
      available: true,
      keyword,
      volume_source: 'dataforseo',
      interest_over_time: interest,
      is_index: true,
      signals: deriveTrendSignals(interest),
    };
  }
}

/* ------------------------------------------------------------------ */
/* DataForSEO Google Trends Explore envelope parsing.                  */
/*                                                                      */
/* Documented shape: tasks[].result[] → { items: [...] }. The          */
/* interest-over-time item has `type: "google_trends_graph"` and       */
/* `data: [{ date_from, date_to, timestamp, values: number[] }]`. Each */
/* row's `values[]` aligns POSITIONALLY to the requested keyword list   */
/* (column i ⇒ keyword i). We parse defensively: pick the graph item by */
/* type when present, otherwise fall back to the first item that        */
/* carries a usable `data[]` — so a shape drift never discards a valid  */
/* series, and a truly empty payload yields `[]` (not a fabrication).   */
/* ------------------------------------------------------------------ */

/** One row of a Google Trends interest-over-time series. */
interface DfsTrendDataRow {
  date_from?: string;
  date_to?: string;
  timestamp?: number | string;
  values?: (number | null)[] | null;
}

/** One item inside a result object (the graph item is the one we want). */
interface DfsTrendItem {
  type?: string;
  keywords?: string[];
  data?: DfsTrendDataRow[] | null;
}

/** One result object as returned inside `tasks[].result[]`. */
interface DfsTrendResult {
  keywords?: string[];
  items?: DfsTrendItem[] | null;
}

/** The interest-over-time item type DataForSEO uses for the graph series. */
export const TRENDS_GRAPH_ITEM_TYPE = 'google_trends_graph';

/**
 * Pick the interest-over-time item from a result object. Prefers the item whose
 * `type === "google_trends_graph"`; falls back to the first item that actually
 * carries a non-empty `data[]`. Returns `null` when nothing usable is present.
 */
function pickGraphItem(result: DfsTrendResult | undefined | null): DfsTrendItem | null {
  const items = result?.items;
  if (!Array.isArray(items) || items.length === 0) return null;
  const byType = items.find((it) => it?.type === TRENDS_GRAPH_ITEM_TYPE);
  if (byType && Array.isArray(byType.data) && byType.data.length > 0) return byType;
  // Defensive fallback: any item with a usable data[] (shape drift / missing
  // type). We never fabricate — if no item has data, we return null.
  return items.find((it) => Array.isArray(it?.data) && it!.data!.length > 0) ?? byType ?? null;
}

/**
 * Extract the keyword-`column` interest series (0–100 index) from a result
 * object. `column` is the keyword's position in the requested list. Each row
 * contributes one {@link TrendPoint}; rows whose `values[column]` is absent map
 * to index 0 (a present-but-zero datum in a graph), preserving the series'
 * timeline. Returns `[]` when there's no usable series.
 */
export function extractSeries(
  result: DfsTrendResult | undefined | null,
  column = 0,
): TrendPoint[] {
  const item = pickGraphItem(result);
  const rows = item?.data;
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    date: rowDate(row),
    index: clampIndex(Array.isArray(row?.values) ? row.values[column] : undefined),
  }));
}

/** Prefer `date_from`; fall back to a `timestamp` (number or string). */
function rowDate(row: DfsTrendDataRow | undefined | null): string {
  if (!row) return '';
  if (typeof row.date_from === 'string' && row.date_from.length > 0) return row.date_from;
  if (row.timestamp !== undefined && row.timestamp !== null) return String(row.timestamp);
  return '';
}
