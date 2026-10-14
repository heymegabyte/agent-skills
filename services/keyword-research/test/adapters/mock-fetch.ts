/**
 * Hand-rolled mock `fetch` for adapter tests — ZERO network, fully deterministic.
 *
 * Usage:
 *   const fx = mockFetch([
 *     jsonResponse({ ok: true }),           // 1st call
 *     { status: 429 },                       // 2nd call (rate limited)
 *   ]);
 *   ...drive the adapter...
 *   expect(fx.calls.length).toBe(2);
 *
 * Each queued entry is either a ready-made {@link MockResponse} or a thrown
 * error (to simulate transport failure). Calls are recorded for assertions.
 */

export interface MockResponseSpec {
  status?: number;
  /** JSON-serializable body, or a raw string (for non-JSON bodies). */
  body?: unknown;
  /** Force a non-JSON string body even if `body` is an object. */
  rawText?: string;
  /** If set, the mock THROWS this (simulating a transport/DNS failure). */
  throw?: Error;
}

export interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
}

export interface MockFetch {
  (input: string, init?: RequestInit): Promise<Response>;
  calls: RecordedCall[];
}

/** A minimal Response-like object sufficient for {@link requestJson}. */
function makeResponse(spec: MockResponseSpec): Response {
  const status = spec.status ?? 200;
  const ok = status >= 200 && status < 300;
  const text =
    spec.rawText !== undefined
      ? spec.rawText
      : spec.body === undefined
        ? ''
        : JSON.stringify(spec.body);

  // Structural Response stand-in: requestJson only reads `.ok`, `.status`,
  // and `.text()`. We cast through unknown to satisfy the Response type.
  const res = {
    ok,
    status,
    async text(): Promise<string> {
      return text;
    },
    async json(): Promise<unknown> {
      return JSON.parse(text) as unknown;
    },
  };
  return res as unknown as Response;
}

/** Build a mock fetch that replays `queue` in order; records every call. */
export function mockFetch(queue: MockResponseSpec[]): MockFetch {
  const remaining = [...queue];
  const fn = async (input: string, init?: RequestInit): Promise<Response> => {
    fn.calls.push({
      url: input,
      method: init?.method ?? 'GET',
      headers: (init?.headers as Record<string, string>) ?? {},
      body: typeof init?.body === 'string' ? init.body : undefined,
    });
    const spec = remaining.shift();
    if (!spec) {
      throw new Error(
        `mockFetch: no queued response for call #${fn.calls.length} to ${input}`,
      );
    }
    if (spec.throw) throw spec.throw;
    return makeResponse(spec);
  };
  fn.calls = [] as RecordedCall[];
  return fn;
}

/** Convenience: a 200 JSON response. */
export function jsonResponse(body: unknown, status = 200): MockResponseSpec {
  return { status, body };
}

/** Zero-delay retry knobs — inject into every adapter under test. */
export const NO_DELAY = {
  delays: [0, 0, 0] as const,
  sleep: async (): Promise<void> => {},
};
