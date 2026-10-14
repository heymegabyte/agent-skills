/**
 * Google Search Console adapter — first-party impressions/clicks/CTR/position.
 *
 * Auth is OAuth2 bearer, but this adapter does NOT own the OAuth dance. It takes
 * an injected `tokenProvider` that returns an access token and, when called with
 * `{ forceRefresh: true }`, returns a freshly-minted one. This keeps the adapter
 * testable (mock the provider) and decoupled from where tokens come from
 * (service account, stored refresh token, Workers KV, etc.).
 *
 * Rules baked in:
 *  - EXPIRED-TOKEN SELF-HEAL: a 401 triggers exactly ONE
 *    `tokenProvider({ forceRefresh: true })` + retry. A second 401 surfaces as
 *    {@link AuthError}. (We don't loop forever on a genuinely-bad credential.)
 *  - PAGINATION: `searchAnalytics` loops `startRow += rowLimit` until a page
 *    returns FEWER than `rowLimit` rows, aggregating all rows.
 *  - ABSENT ROWS → omitted/null, NEVER zero. GSC simply doesn't return rows with
 *    no data; we pass them through as-is and never fabricate `0`.
 *  - PROPERTY IDS: both `https://example.com/` (url-prefix) and
 *    `sc-domain:example.com` (domain) forms are accepted verbatim; only URL
 *    encoding is applied.
 */
import {
  AuthError,
  requestJson,
  type FetchImpl,
  type RequestJsonOptions,
} from './http';

export const DEFAULT_BASE_URL = 'https://www.googleapis.com';

/** Returns an access token; `forceRefresh` demands a fresh (non-cached) one. */
export type TokenProvider = (opts?: { forceRefresh?: boolean }) => Promise<string>;

/** A GSC Search Analytics row (shape mirrors the API; keys are passthrough). */
export interface GscRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export interface SearchAnalyticsParams {
  /** `https://example.com/` or `sc-domain:example.com`. */
  siteUrl: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dimensions?: string[];
  /** Page size; also the sentinel for "last page" (page < rowLimit ⇒ done). */
  rowLimit?: number;
  /** Starting offset for the first page (subsequent pages auto-advance). */
  startRow?: number;
  /** Any extra body params (searchType, dimensionFilterGroups, etc.). */
  extra?: Record<string, unknown>;
}

export interface GscSite {
  siteUrl: string;
  permissionLevel: string;
}

export interface GscOptions {
  baseUrl?: string;
  retry?: Pick<RequestJsonOptions, 'delays' | 'sleep'>;
}

const DEFAULT_ROW_LIMIT = 1000;

export class GoogleSearchConsoleAdapter {
  private readonly fetchImpl: FetchImpl;
  private readonly tokenProvider: TokenProvider;
  private readonly baseUrl: string;
  private readonly retry: Pick<RequestJsonOptions, 'delays' | 'sleep'>;

  constructor(
    tokenProvider: TokenProvider,
    fetchImpl: FetchImpl = globalThis.fetch,
    options: GscOptions = {},
  ) {
    this.fetchImpl = fetchImpl;
    this.tokenProvider = tokenProvider;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.retry = options.retry ?? {};
  }

  /**
   * Make a request with the current token; on 401 refresh ONCE and retry.
   * The inner {@link requestJson} still handles 429/5xx backoff independently.
   */
  private async authed<T>(
    url: string,
    init: Omit<RequestJsonOptions, 'headers'> & { headers?: Record<string, string> },
  ): Promise<T> {
    let token = await this.tokenProvider();
    try {
      return await requestJson<T>(this.fetchImpl, url, this.withAuth(init, token));
    } catch (err) {
      if (err instanceof AuthError && err.status === 401) {
        // Token likely expired — force a refresh and retry exactly once.
        token = await this.tokenProvider({ forceRefresh: true });
        return await requestJson<T>(this.fetchImpl, url, this.withAuth(init, token));
      }
      throw err;
    }
  }

  private withAuth(
    init: Omit<RequestJsonOptions, 'headers'> & { headers?: Record<string, string> },
    token: string,
  ): RequestJsonOptions {
    return {
      ...init,
      ...this.retry,
      headers: {
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    };
  }

  private url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  /** List verified properties for the authenticated principal. */
  async listSites(): Promise<GscSite[]> {
    const res = await this.authed<{ siteEntry?: GscSite[] }>(
      this.url('/webmasters/v3/sites'),
      { method: 'GET' },
    );
    return res.siteEntry ?? [];
  }

  /**
   * Query Search Analytics, auto-paginating until a page returns < rowLimit.
   * Returns the concatenated rows across every page. Absent rows are simply
   * not present — we NEVER synthesize zero-valued rows.
   */
  async searchAnalytics(params: SearchAnalyticsParams): Promise<GscRow[]> {
    const rowLimit = params.rowLimit ?? DEFAULT_ROW_LIMIT;
    const site = encodeURIComponent(params.siteUrl);
    const path = `/webmasters/v3/sites/${site}/searchAnalytics/query`;

    const all: GscRow[] = [];
    let startRow = params.startRow ?? 0;

    // Loop until a short page (fewer than rowLimit rows) tells us we're done.
    // A hard cap guards against a misbehaving mock/server never short-paging.
    const MAX_PAGES = 10_000;
    for (let page = 0; page < MAX_PAGES; page++) {
      const body: Record<string, unknown> = {
        startDate: params.startDate,
        endDate: params.endDate,
        rowLimit,
        startRow,
        ...(params.dimensions ? { dimensions: params.dimensions } : {}),
        ...(params.extra ?? {}),
      };

      const res = await this.authed<{ rows?: GscRow[] }>(this.url(path), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      const rows = res.rows ?? [];
      all.push(...rows);

      if (rows.length < rowLimit) break; // last (short) page
      startRow += rowLimit;
    }

    return all;
  }
}
