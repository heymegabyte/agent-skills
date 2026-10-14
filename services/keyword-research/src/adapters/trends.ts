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
    };
  }

  /** Step 2 — DataForSEO's Google Trends explore endpoint. */
  private async viaDataForSeo(
    keyword: string,
    opts: { geo?: string; timeRange?: string },
  ): Promise<TrendsResult> {
    // DataForSEO's `result` is an ARRAY of result objects; the first holds an
    // `items[]` array whose interest entries carry `date_from`/`timestamp` +
    // `values[]`. `split.results[0]` is therefore that array (one per task).
    type DfsTrendResultItem = {
      items?: {
        data?: { date_from?: string; timestamp?: number; values?: (number | null)[] }[];
      }[];
    };
    const split = await this.dataforseo!.trendsExplore<DfsTrendResultItem[]>([keyword], {
      ...(opts.geo ? { location_name: opts.geo } : {}),
      ...(opts.timeRange ? { time_range: opts.timeRange } : {}),
    });

    const resultArray = split.results[0] ?? [];
    const series = resultArray[0]?.items?.[0]?.data ?? [];
    const interest: TrendPoint[] = series.map((row) => ({
      date: row.date_from ?? (row.timestamp !== undefined ? String(row.timestamp) : ''),
      index: clampIndex(row.values?.[0]),
    }));

    return {
      available: true,
      keyword,
      volume_source: 'dataforseo',
      interest_over_time: interest,
      is_index: true,
    };
  }
}
