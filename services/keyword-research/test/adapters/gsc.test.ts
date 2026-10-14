import { describe, expect, it, vi } from 'vitest';
import { AuthError } from '../../src/adapters/http';
import { GoogleSearchConsoleAdapter, type TokenProvider } from '../../src/adapters/gsc';
import { NO_DELAY, mockFetch } from './mock-fetch';

/** A token provider that counts refreshes and rotates the token on refresh. */
function countingTokenProvider(initial = 'tok-initial', refreshed = 'tok-refreshed') {
  const state = { calls: 0, refreshCalls: 0, token: initial };
  const provider: TokenProvider = vi.fn(async (opts) => {
    state.calls += 1;
    if (opts?.forceRefresh) {
      state.refreshCalls += 1;
      state.token = refreshed;
    }
    return state.token;
  });
  return { provider, state };
}

function adapter(fx: ReturnType<typeof mockFetch>, provider: TokenProvider) {
  return new GoogleSearchConsoleAdapter(provider, fx, {
    baseUrl: 'https://gapi.test',
    retry: NO_DELAY,
  });
}

describe('GSC — listSites', () => {
  it('returns siteEntry and sends a Bearer token', async () => {
    const fx = mockFetch([
      {
        status: 200,
        body: {
          siteEntry: [
            { siteUrl: 'https://example.com/', permissionLevel: 'siteOwner' },
            { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteFullUser' },
          ],
        },
      },
    ]);
    const { provider } = countingTokenProvider();
    const sites = await adapter(fx, provider).listSites();
    expect(sites).toHaveLength(2);
    expect(fx.calls[0]?.headers.Authorization).toBe('Bearer tok-initial');
    expect(fx.calls[0]?.url).toBe('https://gapi.test/webmasters/v3/sites');
  });
});

describe('GSC — expired OAuth self-heal', () => {
  it('401 → tokenProvider({forceRefresh}) ONCE → retry succeeds', async () => {
    const fx = mockFetch([
      { status: 401, body: { error: 'invalid_token' } },
      { status: 200, body: { siteEntry: [{ siteUrl: 'https://x/', permissionLevel: 'owner' }] } },
    ]);
    const { provider, state } = countingTokenProvider();
    const sites = await adapter(fx, provider).listSites();

    expect(sites).toHaveLength(1);
    expect(fx.calls).toHaveLength(2);
    expect(state.refreshCalls).toBe(1); // refreshed exactly once
    // first call used stale token, retry used the refreshed one
    expect(fx.calls[0]?.headers.Authorization).toBe('Bearer tok-initial');
    expect(fx.calls[1]?.headers.Authorization).toBe('Bearer tok-refreshed');
  });

  it('a SECOND consecutive 401 (after refresh) → AuthError', async () => {
    const fx = mockFetch([{ status: 401 }, { status: 401 }]);
    const { provider, state } = countingTokenProvider();
    await expect(adapter(fx, provider).listSites()).rejects.toBeInstanceOf(AuthError);
    expect(state.refreshCalls).toBe(1); // only retried once, didn't loop
    expect(fx.calls).toHaveLength(2);
  });
});

describe('GSC — searchAnalytics pagination', () => {
  it('aggregates across pages until a short page ends the loop', async () => {
    // rowLimit 2: page1 full(2), page2 full(2), page3 short(1) → stop.
    const fx = mockFetch([
      { status: 200, body: { rows: [{ keys: ['a'], clicks: 5 }, { keys: ['b'], clicks: 4 }] } },
      { status: 200, body: { rows: [{ keys: ['c'], clicks: 3 }, { keys: ['d'], clicks: 2 }] } },
      { status: 200, body: { rows: [{ keys: ['e'], clicks: 1 }] } },
    ]);
    const { provider } = countingTokenProvider();
    const rows = await adapter(fx, provider).searchAnalytics({
      siteUrl: 'https://example.com/',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      dimensions: ['query'],
      rowLimit: 2,
    });

    expect(rows.map((r) => r.keys?.[0])).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(fx.calls).toHaveLength(3);

    // startRow advanced 0 → 2 → 4 across the three POST bodies.
    const starts = fx.calls.map((c) => (JSON.parse(c.body ?? '{}') as { startRow: number }).startRow);
    expect(starts).toEqual([0, 2, 4]);
  });

  it('a single short page stops immediately (one call)', async () => {
    const fx = mockFetch([{ status: 200, body: { rows: [{ keys: ['only'] }] } }]);
    const { provider } = countingTokenProvider();
    const rows = await adapter(fx, provider).searchAnalytics({
      siteUrl: 'sc-domain:example.com',
      startDate: '2026-01-01',
      endDate: '2026-01-07',
      rowLimit: 1000,
    });
    expect(rows).toHaveLength(1);
    expect(fx.calls).toHaveLength(1);
    // sc-domain property id is URL-encoded into the path.
    expect(fx.calls[0]?.url).toContain(encodeURIComponent('sc-domain:example.com'));
  });

  it('absent rows → empty array, NEVER synthesized zeros', async () => {
    const fx = mockFetch([{ status: 200, body: {} }]); // no `rows` key at all
    const { provider } = countingTokenProvider();
    const rows = await adapter(fx, provider).searchAnalytics({
      siteUrl: 'https://example.com/',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
    });
    expect(rows).toEqual([]);
  });
});
