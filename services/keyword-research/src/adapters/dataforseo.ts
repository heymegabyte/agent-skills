/**
 * DataForSEO adapter.
 *
 * DataForSEO is a two-level envelope: you POST an ARRAY of task objects and get
 * back `{ status_code, cost, tasks: [{ id, status_code, result }] }`. BOTH
 * levels carry a status code and BOTH must be checked:
 *   - top-level `status_code === 20000` → the request was accepted, and
 *   - per-task `status_code === 20000` → that individual task succeeded.
 *
 * Hard rules baked in (match the service's data doctrine):
 *  - VALIDATE BOTH LEVELS. A non-20000 top-level code throws {@link ProviderError}.
 *  - PARTIAL FAILURE IS NOT TOTAL FAILURE. When some tasks are 20000 and others
 *    errored, we return the good results AND collect per-task errors. We never
 *    discard the good ones.
 *  - COST IS SURFACED. The top-level `cost` (summed across tasks by the API) is
 *    exposed on every result.
 *  - MISSING METRIC → null, NEVER 0. `mapNullableMetric` turns any absent /
 *    non-finite field into `null` ("unknown"), categorically different from a
 *    real `0`.
 *  - BATCHING IS EXPLICIT. Keyword arrays are chunked to {@link BATCH_LIMIT}
 *    (1000) and each chunk is one task; the batching is observable via the
 *    returned `batches` count.
 *
 * Every method is injectable: construct with a `fetchImpl` + credentials, so
 * tests mock the transport and perform ZERO network calls.
 */
import {
  AuthError,
  ProviderError,
  basicAuthHeader,
  requestJson,
  type FetchImpl,
  type RequestJsonOptions,
} from './http';

/** DataForSEO's success sentinel, at both envelope levels. */
export const DFS_OK = 20000;

/**
 * Documented batch limit: DataForSEO accepts up to 1000 keywords per task for
 * the Labs/Keywords-Data bulk endpoints. We chunk to this and expose the count.
 */
export const BATCH_LIMIT = 1000;

/** Default API origin (overridable for tests / sandbox / self-host proxies). */
export const DEFAULT_BASE_URL = 'https://api.dataforseo.com';

/** One task as returned inside the `tasks[]` array. */
export interface DfsTask<R = unknown> {
  id: string;
  status_code: number;
  status_message?: string;
  cost?: number;
  result: R | null;
}

/** The raw two-level envelope. */
export interface DfsEnvelope<R = unknown> {
  status_code: number;
  status_message?: string;
  cost?: number;
  tasks: DfsTask<R>[];
}

/** A per-task error we collected rather than threw. */
export interface DfsTaskError {
  id: string;
  status_code: number;
  status_message: string;
}

/**
 * Normalized adapter result. `results` holds ONLY the successful task payloads;
 * `errors` holds the failed tasks; `cost` is the summed cost; `batches` is how
 * many tasks (chunks) we sent.
 */
export interface DfsResult<R = unknown> {
  results: R[];
  errors: DfsTaskError[];
  cost: number;
  batches: number;
}

export interface DataForSeoCreds {
  login: string;
  password: string;
}

export interface DataForSeoOptions {
  baseUrl?: string;
  /** Retry knobs forwarded to {@link requestJson}; tests pass 0-delay. */
  retry?: Pick<RequestJsonOptions, 'delays' | 'sleep'>;
}

/**
 * Map a provider metric field to `number | null`. Any absent, null, or
 * non-finite value becomes `null` — we NEVER coerce "unknown" into `0`.
 */
export function mapNullableMetric(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return v;
}

/** Split an array into chunks of at most `size` (last chunk may be smaller). */
export function chunk<T>(arr: readonly T[], size: number): T[][] {
  if (size <= 0) throw new ProviderError('chunk size must be > 0', null);
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

export class DataForSeoAdapter {
  private readonly fetchImpl: FetchImpl;
  private readonly authHeader: string;
  private readonly baseUrl: string;
  private readonly retry: Pick<RequestJsonOptions, 'delays' | 'sleep'>;

  constructor(
    creds: DataForSeoCreds,
    fetchImpl: FetchImpl = globalThis.fetch,
    options: DataForSeoOptions = {},
  ) {
    this.fetchImpl = fetchImpl;
    this.authHeader = basicAuthHeader(creds.login, creds.password);
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.retry = options.retry ?? {};
  }

  /** Low-level POST of an ARRAY body, returning the validated envelope split. */
  private async postTasks<R>(path: string, tasks: unknown[]): Promise<DfsResult<R>> {
    const env = await requestJson<DfsEnvelope<R>>(this.fetchImpl, this.url(path), {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: tasks,
      ...this.retry,
    });
    return this.splitEnvelope(env, 1);
  }

  /** Low-level GET returning the validated envelope split (used by *_get). */
  private async getEnvelope<R>(path: string): Promise<DfsResult<R>> {
    const env = await requestJson<DfsEnvelope<R>>(this.fetchImpl, this.url(path), {
      method: 'GET',
      headers: { Authorization: this.authHeader },
      ...this.retry,
    });
    return this.splitEnvelope(env, 1);
  }

  private url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  /**
   * Validate the TOP envelope level only. Throws {@link AuthError} on the
   * auth-specific codes (even though HTTP was 200) and {@link ProviderError}
   * on any other non-20000 request-level code.
   */
  private assertTopLevel(env: DfsEnvelope<unknown>): void {
    if (!env || typeof env.status_code !== 'number') {
      throw new ProviderError('DataForSEO response missing status_code', null, env);
    }
    if (env.status_code === 40100 || env.status_code === 40200) {
      throw new AuthError(
        `DataForSEO auth rejected (status_code ${env.status_code}: ${env.status_message ?? ''})`,
        env.status_code,
        env,
      );
    }
    if (env.status_code !== DFS_OK) {
      throw new ProviderError(
        `DataForSEO request failed (status_code ${env.status_code}: ${env.status_message ?? ''})`,
        env.status_code,
        env,
      );
    }
  }

  /**
   * Validate BOTH envelope levels and split tasks into results + errors.
   * `batches` records how many chunks the caller sent for this logical call.
   */
  private splitEnvelope<R>(env: DfsEnvelope<R>, batches: number): DfsResult<R> {
    this.assertTopLevel(env);

    const results: R[] = [];
    const errors: DfsTaskError[] = [];
    for (const task of env.tasks ?? []) {
      if (task.status_code === DFS_OK && task.result !== null && task.result !== undefined) {
        results.push(task.result);
      } else {
        // Partial failure: collect, do NOT throw, do NOT drop the good ones.
        errors.push({
          id: task.id,
          status_code: task.status_code,
          status_message: task.status_message ?? 'unknown task error',
        });
      }
    }

    return { results, errors, cost: env.cost ?? 0, batches };
  }

  /**
   * Run one logical call across MULTIPLE chunks, merging each chunk's split
   * (summing cost, concatenating results + errors, counting batches). Used by
   * every keyword-array method so batching is uniform + observable.
   */
  private async runChunked<T, R>(
    path: string,
    keywords: readonly T[],
    buildTask: (chunk: T[]) => unknown,
  ): Promise<DfsResult<R>> {
    const chunks = chunk(keywords, BATCH_LIMIT);
    // Empty input → still one no-op task so the shape is predictable.
    const taskChunks = chunks.length > 0 ? chunks : [[]];

    const merged: DfsResult<R> = { results: [], errors: [], cost: 0, batches: 0 };
    for (const c of taskChunks) {
      const env = await requestJson<DfsEnvelope<R>>(this.fetchImpl, this.url(path), {
        method: 'POST',
        headers: {
          Authorization: this.authHeader,
          'Content-Type': 'application/json',
        },
        body: [buildTask(c)],
        ...this.retry,
      });
      const split = this.splitEnvelope(env, 1);
      merged.results.push(...split.results);
      merged.errors.push(...split.errors);
      merged.cost += split.cost;
      merged.batches += 1;
    }
    return merged;
  }

  /* ---------------------------------------------------------------- */
  /* Public API.                                                       */
  /* ---------------------------------------------------------------- */

  /** FREE endpoint — confirms creds + shows balance. Returns the first result. */
  async userData<R = unknown>(): Promise<R | null> {
    const split = await this.getEnvelope<R>('/v3/appendix/user_data');
    return split.results[0] ?? null;
  }

  /** Keyword Ideas (Labs) — seed keyword(s) → related ideas. */
  async keywordIdeas<R = unknown>(
    keywords: readonly string[],
    extra: Record<string, unknown> = {},
  ): Promise<DfsResult<R>> {
    return this.runChunked<string, R>(
      '/v3/dataforseo_labs/google/keyword_ideas/live',
      keywords,
      (c) => ({ keywords: c, ...extra }),
    );
  }

  /** Keyword Suggestions (Labs) — long-tail expansions of a single seed. */
  async keywordSuggestions<R = unknown>(
    keyword: string,
    extra: Record<string, unknown> = {},
  ): Promise<DfsResult<R>> {
    return this.postTasks<R>('/v3/dataforseo_labs/google/keyword_suggestions/live', [
      { keyword, ...extra },
    ]);
  }

  /** Related Keywords (Labs) — "searches related to" expansions. */
  async relatedKeywords<R = unknown>(
    keyword: string,
    extra: Record<string, unknown> = {},
  ): Promise<DfsResult<R>> {
    return this.postTasks<R>('/v3/dataforseo_labs/google/related_keywords/live', [
      { keyword, ...extra },
    ]);
  }

  /** Keywords For Site (Labs) — what a domain already ranks for. */
  async keywordsForSite<R = unknown>(
    target: string,
    extra: Record<string, unknown> = {},
  ): Promise<DfsResult<R>> {
    return this.postTasks<R>('/v3/dataforseo_labs/google/keywords_for_site/live', [
      { target, ...extra },
    ]);
  }

  /** Search Volume (Keywords Data) — chunked across BATCH_LIMIT. */
  async searchVolume<R = unknown>(
    keywords: readonly string[],
    extra: Record<string, unknown> = {},
  ): Promise<DfsResult<R>> {
    return this.runChunked<string, R>(
      '/v3/keywords_data/google_ads/search_volume/live',
      keywords,
      (c) => ({ keywords: c, ...extra }),
    );
  }

  /** Bulk Keyword Difficulty (Labs) — chunked across BATCH_LIMIT. */
  async bulkKeywordDifficulty<R = unknown>(
    keywords: readonly string[],
    extra: Record<string, unknown> = {},
  ): Promise<DfsResult<R>> {
    return this.runChunked<string, R>(
      '/v3/dataforseo_labs/google/bulk_keyword_difficulty/live',
      keywords,
      (c) => ({ keywords: c, ...extra }),
    );
  }

  /** SERP organic (live advanced) — one keyword → organic results. */
  async serpOrganic<R = unknown>(
    keyword: string,
    extra: Record<string, unknown> = {},
  ): Promise<DfsResult<R>> {
    return this.postTasks<R>('/v3/serp/google/organic/live/advanced', [
      { keyword, ...extra },
    ]);
  }

  /** Google Trends explore (live) — one keyword set → interest-over-time. */
  async trendsExplore<R = unknown>(
    keywords: readonly string[],
    extra: Record<string, unknown> = {},
  ): Promise<DfsResult<R>> {
    return this.postTasks<R>('/v3/keywords_data/google_trends/explore/live', [
      { keywords: [...keywords], ...extra },
    ]);
  }

  /* ---------------------------------------------------------------- */
  /* Async task flow: task_post → tasks_ready → task_get.              */
  /* Some endpoints are async-only; this is the standard DataForSEO    */
  /* polling cycle. `pollReady`/`taskGet` are separate so callers (and */
  /* tests) can drive the mocked happy path step by step.              */
  /* ---------------------------------------------------------------- */

  /**
   * Submit async tasks; returns the accepted task ids plus any rejected tasks.
   * For `task_post` the useful payload is each task's `id` (20000 = done inline,
   * 20100 = "Task Created", async) — NOT the result body, which arrives later
   * via {@link pollReady} + {@link taskGet}.
   */
  async taskPost(
    path: string,
    tasks: unknown[],
  ): Promise<{ ids: string[]; errors: DfsTaskError[]; cost: number }> {
    const env = await requestJson<DfsEnvelope<unknown>>(this.fetchImpl, this.url(path), {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: tasks,
      ...this.retry,
    });
    // Validate the TOP level (throws on auth / non-20000 request-level codes).
    // We hand-walk the tasks here because an accepted async task is 20100, not
    // 20000, so splitEnvelope's success filter would wrongly bucket it as an
    // error. We still surface genuinely-failed tasks.
    this.assertTopLevel(env);
    const ids: string[] = [];
    const errors: DfsTaskError[] = [];
    for (const task of env.tasks ?? []) {
      if (task.status_code === DFS_OK || task.status_code === 20100) {
        ids.push(task.id);
      } else {
        errors.push({
          id: task.id,
          status_code: task.status_code,
          status_message: task.status_message ?? 'unknown task error',
        });
      }
    }
    return { ids, errors, cost: env.cost ?? 0 };
  }

  /** Poll which tasks are ready. Returns the list of ready task ids. */
  async pollReady(readyPath: string): Promise<string[]> {
    const env = await requestJson<DfsEnvelope<{ id: string }[]>>(
      this.fetchImpl,
      this.url(readyPath),
      { method: 'GET', headers: { Authorization: this.authHeader }, ...this.retry },
    );
    this.splitEnvelope(env, 1); // validate both levels
    const ready: string[] = [];
    for (const task of env.tasks ?? []) {
      for (const row of task.result ?? []) {
        if (row && typeof row.id === 'string') ready.push(row.id);
      }
    }
    return ready;
  }

  /** Fetch a completed task's result by id. */
  async taskGet<R = unknown>(getPathPrefix: string, id: string): Promise<DfsResult<R>> {
    return this.getEnvelope<R>(`${getPathPrefix.replace(/\/+$/, '')}/${id}`);
  }
}
