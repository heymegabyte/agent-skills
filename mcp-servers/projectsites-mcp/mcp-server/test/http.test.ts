/**
 * @module test/http
 * @description Transport contract: auth, query encoding, error mapping, timeout.
 */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { buildUrl, request, ApiError, defaultRuntime } from '../src/http.js';

const rt = (fetchImpl: typeof fetch, env: NodeJS.ProcessEnv = {}) => ({ fetchImpl, env });

beforeEach(() => {
  process.env.PROJECT_SITES_API_KEY = 'psk_live_test';
  process.env.PROJECT_SITES_API_URL = 'https://api.example.test/';
});

afterEach(() => {
  delete process.env.PROJECT_SITES_API_KEY;
  delete process.env.PROJECT_SITES_API_URL;
  delete process.env.PROJECT_SITES_TIMEOUT_MS;
});

describe('buildUrl', () => {
  it('strips the trailing slash from the base and skips empty params', () => {
    const url = buildUrl('/api/sites', { limit: 5, offset: undefined, q: null, flag: true });
    assert.equal(url, 'https://api.example.test/api/sites?limit=5&flag=true');
  });
});

describe('request', () => {
  it('fails closed when the API key is missing', async () => {
    delete process.env.PROJECT_SITES_API_KEY;
    await assert.rejects(
      () => request(rt(async () => new Response('{}')), '/api/sites'),
      (error: unknown) => error instanceof ApiError && error.code === 'NOT_CONFIGURED',
    );
  });

  it('sets the bearer token and JSON content type on a body', async () => {
    let seen: RequestInit | undefined;
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      seen = init;
      return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;

    await request(rt(fetchImpl), '/api/sites', { method: 'POST', body: { a: 1 } });
    const headers = seen?.headers as Record<string, string>;
    assert.equal(headers.Authorization, 'Bearer psk_live_test');
    assert.equal(headers['Content-Type'], 'application/json');
    assert.equal(seen?.body, JSON.stringify({ a: 1 }));
  });

  it('surfaces the API error message as an ApiError', async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ error: { code: 'BUILD_LIMIT_REACHED', message: 'Limit reached' } }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      })) as typeof fetch;

    await assert.rejects(
      () => request(rt(fetchImpl), '/api/sites'),
      (error: unknown) =>
        error instanceof ApiError && error.status === 403 && error.code === 'HTTP_403' && /Limit reached/.test(error.message),
    );
  });

  it('returns text unchanged for non-JSON responses', async () => {
    const fetchImpl = (async () =>
      new Response('plain body', { headers: { 'content-type': 'text/plain' } })) as typeof fetch;
    assert.equal(await request(rt(fetchImpl), '/x'), 'plain body');
  });

  it('aborts and reports TIMEOUT past the budget', async () => {
    process.env.PROJECT_SITES_TIMEOUT_MS = '10';
    const fetchImpl = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
      })) as unknown as typeof fetch;

    await assert.rejects(
      () => request(rt(fetchImpl), '/slow'),
      (error: unknown) => error instanceof ApiError && error.code === 'TIMEOUT',
    );
  });

  it('wraps a transport failure as NETWORK', async () => {
    const fetchImpl = (async () => {
      throw new Error('ECONNREFUSED');
    }) as typeof fetch;
    await assert.rejects(
      () => request(rt(fetchImpl), '/x'),
      (error: unknown) => error instanceof ApiError && error.code === 'NETWORK' && /ECONNREFUSED/.test(error.message),
    );
  });
});

describe('defaultRuntime', () => {
  it('uses the global fetch and process.env', () => {
    const built = defaultRuntime();
    assert.equal(built.fetchImpl, globalThis.fetch);
    assert.equal(built.env, process.env);
  });
});
