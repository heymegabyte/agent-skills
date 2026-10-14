/**
 * Shared HTTP plumbing for every provider adapter.
 *
 * Design rules baked in (so adapters stay thin and tests stay hermetic):
 *  - DEPENDENCY-INJECTED FETCH: every call takes a `fetchImpl` (defaulting to
 *    `globalThis.fetch`). Tests pass a hand-rolled mock and make ZERO network
 *    calls. Adapters NEVER reach for the global directly.
 *  - DETERMINISTIC RETRY: exponential backoff on 429 + 5xx (max 3 attempts).
 *    The backoff `sleep` and the `delays` schedule are injectable so tests run
 *    with 0 delay and still assert the exact attempt count.
 *  - TYPED ERRORS: callers discriminate on class, never on parsing a string.
 *    `AuthError` (401/403), `RateLimitError` (429 after exhausting retries),
 *    `ProviderError` (everything else, incl. non-JSON + provider-level codes).
 *
 * Nothing here knows about any specific provider. DataForSEO's envelope
 * validation, GSC's token refresh, etc. live in their own adapters.
 */

/** A minimal structural subset of the Fetch API `fetch`, so mocks are trivial. */
export type FetchImpl = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

/** Injectable sleep so tests can run with no real delay. */
export type SleepFn = (ms: number) => Promise<void>;

/** Base class for all adapter errors; carries HTTP status + optional body. */
export class AdapterError extends Error {
  readonly status: number | null;
  readonly body: unknown;
  constructor(message: string, status: number | null, body?: unknown) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.body = body;
  }
}

/** 401 / 403 — bad or missing credentials. Not retried. */
export class AuthError extends AdapterError {}

/** 429 — rate limited. Retried with backoff; thrown only after exhaustion. */
export class RateLimitError extends AdapterError {}

/**
 * Any other failure: non-2xx we don't special-case, transport failure, a body
 * that isn't JSON, or a provider-level error code surfaced by an adapter.
 */
export class ProviderError extends AdapterError {}

/** Options for {@link requestJson}. All retry knobs are injectable for tests. */
export interface RequestJsonOptions {
  method?: string;
  headers?: Record<string, string>;
  /** Already-serialized body (string) or a value we JSON.stringify for you. */
  body?: unknown;
  /**
   * Backoff schedule in ms, one entry per RETRY (not counting the first try).
   * Length also caps the retry count. Defaults to `[250, 1000, 4000]` (3
   * retries → up to 4 total attempts). Tests pass `[0, 0, 0]`.
   */
  delays?: readonly number[];
  /** Injectable sleep. Defaults to a real `setTimeout` promise. */
  sleep?: SleepFn;
  /** AbortSignal passthrough. */
  signal?: AbortSignal;
}

const DEFAULT_DELAYS: readonly number[] = [250, 1000, 4000] as const;

const realSleep: SleepFn = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Status codes we retry (transient): rate-limit + server errors. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}

/** Best-effort body read: parse JSON, else fall back to text, else null. */
async function readBody(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => '');
  if (text === '') return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * Perform an HTTP request and return the parsed JSON body (typed as the caller
 * asserts). Retries transient failures with exponential backoff.
 *
 * Throws {@link AuthError} / {@link RateLimitError} / {@link ProviderError}.
 */
export async function requestJson<T = unknown>(
  fetchImpl: FetchImpl,
  url: string,
  opts: RequestJsonOptions = {},
): Promise<T> {
  const delays = opts.delays ?? DEFAULT_DELAYS;
  const sleep = opts.sleep ?? realSleep;
  const maxRetries = delays.length;

  const init: RequestInit = {
    method: opts.method ?? 'GET',
    headers: opts.headers,
    signal: opts.signal,
  };
  if (opts.body !== undefined) {
    init.body =
      typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
  }

  let lastError: unknown;

  // attempt 0 is the first try; attempts 1..maxRetries are retries.
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // delays[attempt-1] is guaranteed in-range by the loop bound.
      await sleep(delays[attempt - 1] ?? 0);
    }

    let res: Response;
    try {
      res = await fetchImpl(url, init);
    } catch (err) {
      // Transport-level failure (DNS, abort, connection reset). Treat as
      // retryable up to the cap, then surface as a ProviderError.
      lastError = err;
      if (attempt < maxRetries) continue;
      throw new ProviderError(
        `Network request to ${url} failed: ${(err as Error)?.message ?? String(err)}`,
        null,
        err,
      );
    }

    if (res.ok) {
      return (await readBody(res)) as T;
    }

    // Non-2xx. Classify.
    if (res.status === 401 || res.status === 403) {
      throw new AuthError(
        `Authentication failed (${res.status}) for ${url}`,
        res.status,
        await readBody(res),
      );
    }

    if (isRetryableStatus(res.status)) {
      lastError = res;
      if (attempt < maxRetries) continue;
      const body = await readBody(res);
      if (res.status === 429) {
        throw new RateLimitError(
          `Rate limited (429) for ${url} after ${attempt + 1} attempt(s)`,
          res.status,
          body,
        );
      }
      throw new ProviderError(
        `Server error (${res.status}) for ${url} after ${attempt + 1} attempt(s)`,
        res.status,
        body,
      );
    }

    // Non-retryable client error (4xx other than 401/403/429).
    throw new ProviderError(
      `Request to ${url} failed with status ${res.status}`,
      res.status,
      await readBody(res),
    );
  }

  // Unreachable in practice (loop always returns or throws), but satisfies the
  // type checker and documents the invariant.
  throw new ProviderError(
    `Request to ${url} exhausted retries`,
    null,
    lastError,
  );
}

/**
 * Base64-encode `login:password` for HTTP Basic auth. Uses `btoa`, which is a
 * global in the Workers runtime (and modern Node) — we deliberately avoid
 * `Buffer` so this stays dependency-free against `@cloudflare/workers-types`.
 * The `encodeURIComponent`/`unescape` dance makes the input latin1-safe so
 * non-ASCII credentials don't throw.
 */
export function basicAuthHeader(login: string, password: string): string {
  const raw = `${login}:${password}`;
  return `Basic ${btoa(unescape(encodeURIComponent(raw)))}`;
}
