/**
 * @module http
 * @description Thin, testable fetch wrapper for the Project Sites REST API.
 *
 * Design notes
 *  - The `fetch` implementation is injectable (`Runtime.fetchImpl`) so tests
 *    never touch the network.
 *  - Failures raise {@link ApiError} with a `code` the MCP layer can surface as
 *    a machine-readable `isError` payload. Nothing here swallows an error.
 *  - A missing API key fails closed with `NOT_CONFIGURED` instead of firing an
 *    unauthenticated request that would return an opaque 401.
 *  - Responses are parsed as JSON when the content type says so, as text
 *    otherwise, and are truncated so a huge HTML error page cannot flood the
 *    model's context.
 */
import { apiBaseUrl, apiKey, requestTimeoutMs } from './config.js';

/** Grouping of the dependencies a tool handler needs. */
export interface Runtime {
  /** Injectable fetch — defaults to the global. */
  fetchImpl: typeof fetch;
  /** Injectable env — defaults to `process.env`. */
  env: NodeJS.ProcessEnv;
}

/** Build a runtime that uses the real network and `process.env`. */
export const defaultRuntime = (): Runtime => ({ fetchImpl: globalThis.fetch, env: process.env });

/** Maximum characters of a text body returned to the caller. */
const MAX_TEXT = 20_000;

/** A non-2xx or transport-level failure, carrying the HTTP status when known. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status?: number,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Options for one REST call. */
export interface RequestOptions {
  method?: string;
  /** Named query parameters; `undefined` and `null` values are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** JSON body. Mutually exclusive with `form`. */
  body?: unknown;
  /** Multipart body (deploy). Mutually exclusive with `body`. */
  form?: FormData;
  /** Extra headers, merged last. */
  headers?: Record<string, string>;
  /** Override the timeout for long uploads. */
  timeoutMs?: number;
}

/** Build a URL from a base, a path, and named query parameters. */
export function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${apiBaseUrl()}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * Perform one authenticated API call and return the decoded body.
 *
 * @throws {ApiError} `NOT_CONFIGURED` when no key is set, `HTTP_<status>` for a
 *   non-2xx response, `TIMEOUT` when the request exceeds its budget, and
 *   `NETWORK` for any other transport failure.
 */
export async function request<T = unknown>(
  rt: Runtime,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const key = apiKey();
  if (!key) {
    throw new ApiError(
      'NOT_CONFIGURED',
      'PROJECT_SITES_API_KEY is not set. Create an org API key at https://projectsites.dev/admin/api-tokens and export it before starting the server.',
    );
  }

  const method = (options.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    'User-Agent': 'projectsites-mcp/2.0',
    ...options.headers,
  };

  let payload: BodyInit | undefined;
  if (options.form) {
    // Let fetch set the multipart boundary; an explicit content-type breaks it.
    payload = options.form;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(options.body);
  }

  const timeout = options.timeoutMs ?? requestTimeoutMs();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let response: Response;
  try {
    response = await rt.fetchImpl(buildUrl(path, options.query), {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') {
      throw new ApiError('TIMEOUT', `${method} ${path} exceeded ${timeout}ms.`, undefined, error);
    }
    throw new ApiError('NETWORK', `${method} ${path} failed: ${(error as Error).message}`, undefined, error);
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  const isJson = (response.headers.get('content-type') ?? '').includes('json');
  let parsed: unknown = text;
  if (isJson && text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const message =
      typeof parsed === 'object' && parsed !== null
        ? ((parsed as { error?: { message?: string } | string }).error as { message?: string } | string | undefined)
        : undefined;
    const human =
      typeof message === 'string' ? message : (message?.message ?? `${response.status} ${response.statusText}`);
    throw new ApiError(`HTTP_${response.status}`, human, response.status, parsed);
  }

  if (!isJson) {
    return (text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}… [truncated]` : text) as T;
  }
  return parsed as T;
}

/** @internal exported for tests only. */
export const __testing = { MAX_TEXT };
