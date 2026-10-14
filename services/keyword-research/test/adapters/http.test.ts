import { describe, expect, it, vi } from 'vitest';
import {
  AuthError,
  ProviderError,
  RateLimitError,
  basicAuthHeader,
  requestJson,
} from '../../src/adapters/http';
import { NO_DELAY, mockFetch } from './mock-fetch';

describe('requestJson — success + parsing', () => {
  it('returns the parsed JSON body on 200', async () => {
    const fx = mockFetch([{ status: 200, body: { hello: 'world' } }]);
    const out = await requestJson<{ hello: string }>(fx, 'https://x/test', NO_DELAY);
    expect(out).toEqual({ hello: 'world' });
    expect(fx.calls).toHaveLength(1);
    expect(fx.calls[0]?.method).toBe('GET');
  });

  it('returns null for an empty body', async () => {
    const fx = mockFetch([{ status: 200, rawText: '' }]);
    const out = await requestJson(fx, 'https://x/empty', NO_DELAY);
    expect(out).toBeNull();
  });

  it('serializes a non-string body to JSON and sets the method', async () => {
    const fx = mockFetch([{ status: 200, body: { ok: true } }]);
    await requestJson(fx, 'https://x/post', {
      method: 'POST',
      body: { a: 1 },
      ...NO_DELAY,
    });
    expect(fx.calls[0]?.method).toBe('POST');
    expect(fx.calls[0]?.body).toBe(JSON.stringify({ a: 1 }));
  });
});

describe('requestJson — typed errors', () => {
  it('401 → AuthError (not retried)', async () => {
    const fx = mockFetch([{ status: 401, body: { error: 'bad token' } }]);
    await expect(requestJson(fx, 'https://x/a', NO_DELAY)).rejects.toBeInstanceOf(
      AuthError,
    );
    expect(fx.calls).toHaveLength(1); // no retry on auth failure
  });

  it('403 → AuthError', async () => {
    const fx = mockFetch([{ status: 403 }]);
    await expect(requestJson(fx, 'https://x/a', NO_DELAY)).rejects.toBeInstanceOf(
      AuthError,
    );
  });

  it('non-retryable 4xx (404) → ProviderError, single attempt', async () => {
    const fx = mockFetch([{ status: 404 }]);
    await expect(requestJson(fx, 'https://x/missing', NO_DELAY)).rejects.toBeInstanceOf(
      ProviderError,
    );
    expect(fx.calls).toHaveLength(1);
  });
});

describe('requestJson — retry/backoff (deterministic)', () => {
  it('429 then 200 → success after exactly 2 attempts', async () => {
    const fx = mockFetch([{ status: 429 }, { status: 200, body: { ok: 1 } }]);
    const sleep = vi.fn(async () => {});
    const out = await requestJson(fx, 'https://x/rl', {
      delays: [0, 0, 0],
      sleep,
    });
    expect(out).toEqual({ ok: 1 });
    expect(fx.calls).toHaveLength(2);
    expect(sleep).toHaveBeenCalledTimes(1); // one backoff before the retry
  });

  it('three 429s with one retry allotment → RateLimitError, 2 attempts', async () => {
    const fx = mockFetch([{ status: 429 }, { status: 429 }]);
    await expect(
      requestJson(fx, 'https://x/rl', { delays: [0], sleep: async () => {} }),
    ).rejects.toBeInstanceOf(RateLimitError);
    expect(fx.calls).toHaveLength(2); // 1 initial + 1 retry (delays.length = 1)
  });

  it('5xx exhausts retries → ProviderError after 4 attempts (3 retries)', async () => {
    const fx = mockFetch([
      { status: 503 },
      { status: 503 },
      { status: 500 },
      { status: 502 },
    ]);
    const sleep = vi.fn(async () => {});
    await expect(
      requestJson(fx, 'https://x/srv', { delays: [0, 0, 0], sleep }),
    ).rejects.toBeInstanceOf(ProviderError);
    expect(fx.calls).toHaveLength(4);
    expect(sleep).toHaveBeenCalledTimes(3);
  });

  it('5xx then 200 → recovers', async () => {
    const fx = mockFetch([{ status: 500 }, { status: 200, body: { recovered: true } }]);
    const out = await requestJson<{ recovered: boolean }>(fx, 'https://x/s', NO_DELAY);
    expect(out.recovered).toBe(true);
    expect(fx.calls).toHaveLength(2);
  });

  it('transport failure retries then surfaces ProviderError', async () => {
    const boom = new Error('ECONNRESET');
    const fx = mockFetch([{ throw: boom }, { throw: boom }]);
    await expect(
      requestJson(fx, 'https://x/net', { delays: [0], sleep: async () => {} }),
    ).rejects.toBeInstanceOf(ProviderError);
    expect(fx.calls).toHaveLength(2);
  });
});

describe('basicAuthHeader', () => {
  it('encodes login:password as Basic base64', () => {
    // "user:pass" → dXNlcjpwYXNz
    expect(basicAuthHeader('user', 'pass')).toBe('Basic dXNlcjpwYXNz');
  });
});
