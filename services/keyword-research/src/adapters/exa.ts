/**
 * Exa adapter — EVIDENCE only. Exa is a neural search / content-retrieval API.
 * It produces URLs, titles, and page excerpts we cite as proof that a topic is
 * being discussed / under-served. It does NOT produce search volume or keyword
 * difficulty, and this adapter deliberately exposes NO numeric SEO metric so a
 * caller can't accidentally treat a relevance score as demand.
 *
 * Methods:
 *  - `search({ query, numResults })` → neural/keyword results.
 *  - `contents(ids)`                 → full/excerpted text for result ids.
 *
 * Both return `evidence[] = { url, title, excerpt, retrievedAt }`. `retrievedAt`
 * is injectable (`now`) so tests are deterministic.
 */
import {
  requestJson,
  type FetchImpl,
  type RequestJsonOptions,
} from './http';

export const DEFAULT_BASE_URL = 'https://api.exa.ai';

/** A single evidence item — citation-shaped, NEVER a metric. */
export interface Evidence {
  url: string;
  title: string;
  /** Short text snippet supporting the citation ('' when none available). */
  excerpt: string;
  /** ISO 8601 timestamp we fetched this evidence. */
  retrievedAt: string;
}

export interface ExaCreds {
  apiKey: string;
}

export interface ExaOptions {
  baseUrl?: string;
  /** Injectable clock for deterministic `retrievedAt`. */
  now?: () => Date;
  retry?: Pick<RequestJsonOptions, 'delays' | 'sleep'>;
}

/** Raw Exa result row (only the fields we read). */
interface ExaResultRow {
  id?: string;
  url?: string;
  title?: string;
  text?: string;
  highlights?: string[];
  summary?: string;
}

export class ExaAdapter {
  private readonly fetchImpl: FetchImpl;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly now: () => Date;
  private readonly retry: Pick<RequestJsonOptions, 'delays' | 'sleep'>;

  constructor(
    creds: ExaCreds,
    fetchImpl: FetchImpl = globalThis.fetch,
    options: ExaOptions = {},
  ) {
    this.fetchImpl = fetchImpl;
    this.apiKey = creds.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.now = options.now ?? (() => new Date());
    this.retry = options.retry ?? {};
  }

  private url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private headers(): Record<string, string> {
    return { 'x-api-key': this.apiKey, 'Content-Type': 'application/json' };
  }

  /** Turn a raw Exa row into a normalized evidence item. */
  private toEvidence(row: ExaResultRow, at: string): Evidence {
    const excerpt =
      row.summary?.trim() ||
      row.highlights?.[0]?.trim() ||
      row.text?.trim().slice(0, 500) ||
      '';
    return {
      url: row.url ?? '',
      title: row.title?.trim() || row.url || '',
      excerpt,
      retrievedAt: at,
    };
  }

  /**
   * Neural/keyword search. Returns evidence rows ONLY — no scores, no volume.
   */
  async search(args: {
    query: string;
    numResults?: number;
    extra?: Record<string, unknown>;
  }): Promise<Evidence[]> {
    const res = await requestJson<{ results?: ExaResultRow[] }>(
      this.fetchImpl,
      this.url('/search'),
      {
        method: 'POST',
        headers: this.headers(),
        body: {
          query: args.query,
          numResults: args.numResults ?? 10,
          contents: { highlights: true },
          ...(args.extra ?? {}),
        },
        ...this.retry,
      },
    );
    const at = this.now().toISOString();
    return (res.results ?? []).map((r) => this.toEvidence(r, at));
  }

  /** Fetch contents/excerpts for a set of result ids. Evidence rows only. */
  async contents(ids: readonly string[]): Promise<Evidence[]> {
    const res = await requestJson<{ results?: ExaResultRow[] }>(
      this.fetchImpl,
      this.url('/contents'),
      {
        method: 'POST',
        headers: this.headers(),
        body: { ids: [...ids], text: true, highlights: true },
        ...this.retry,
      },
    );
    const at = this.now().toISOString();
    return (res.results ?? []).map((r) => this.toEvidence(r, at));
  }
}
