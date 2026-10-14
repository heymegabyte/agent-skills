import { describe, expect, it } from 'vitest';
import { DataForSeoAdapter } from '../../src/adapters/dataforseo';
import { TrendsAdapter } from '../../src/adapters/trends';
import { NO_DELAY, mockFetch } from './mock-fetch';

function dfsEnvelope(data: { date_from: string; values: (number | null)[] }[]) {
  return {
    status_code: 20000,
    status_message: 'Ok.',
    cost: 0.01,
    tasks: [
      {
        id: 't0',
        status_code: 20000,
        status_message: 'Ok.',
        result: [{ items: [{ data }] }],
      },
    ],
  };
}

describe('TrendsAdapter — resolve order', () => {
  it('returns { available:false } when no source is configured', async () => {
    const res = await new TrendsAdapter().explore('seo tools');
    expect(res.available).toBe(false);
    if (!res.available) expect(res.reason).toMatch(/no trends source/i);
  });

  it('prefers the OFFICIAL API when creds are present', async () => {
    const fx = mockFetch([
      {
        status: 200,
        body: {
          timelineData: [
            { time: '2026-01-01', value: [50] },
            { time: '2026-02-01', value: [100] },
          ],
        },
      },
    ]);
    const trends = new TrendsAdapter({
      fetchImpl: fx,
      official: { apiKey: 'key', baseUrl: 'https://trends.test' },
      retry: NO_DELAY,
    });
    const res = await trends.explore('seo tools');
    expect(res.available).toBe(true);
    if (res.available) {
      expect(res.volume_source).toBe('google_trends');
      expect(res.is_index).toBe(true);
      expect(res.interest_over_time).toEqual([
        { date: '2026-01-01', index: 50 },
        { date: '2026-02-01', index: 100 },
      ]);
    }
    expect(fx.calls[0]?.url).toContain('https://trends.test');
  });

  it('falls back to DataForSEO when only a DFS adapter is injected', async () => {
    const fx = mockFetch([
      {
        status: 200,
        body: dfsEnvelope([
          { date_from: '2026-01-01', values: [25] },
          { date_from: '2026-02-01', values: [75] },
        ]),
      },
    ]);
    const dfs = new DataForSeoAdapter(
      { login: 'l', password: 'p' },
      fx,
      { baseUrl: 'https://api.test', retry: NO_DELAY },
    );
    const trends = new TrendsAdapter({ fetchImpl: fx, dataforseo: dfs, retry: NO_DELAY });
    const res = await trends.explore('seo tools');
    expect(res.available).toBe(true);
    if (res.available) {
      expect(res.volume_source).toBe('dataforseo');
      expect(res.interest_over_time).toEqual([
        { date: '2026-01-01', index: 25 },
        { date: '2026-02-01', index: 75 },
      ]);
      expect(res.is_index).toBe(true);
    }
  });

  it('clamps the interest INDEX into 0..100 and never presents it as volume', async () => {
    const fx = mockFetch([
      {
        status: 200,
        body: dfsEnvelope([
          { date_from: '2026-01-01', values: [250] }, // over-range → clamp 100
          { date_from: '2026-02-01', values: [null] }, // missing → 0 index
        ]),
      },
    ]);
    const dfs = new DataForSeoAdapter(
      { login: 'l', password: 'p' },
      fx,
      { baseUrl: 'https://api.test', retry: NO_DELAY },
    );
    const res = await new TrendsAdapter({ fetchImpl: fx, dataforseo: dfs, retry: NO_DELAY }).explore(
      'x',
    );
    expect(res.available).toBe(true);
    if (res.available) {
      expect(res.interest_over_time.map((p) => p.index)).toEqual([100, 0]);
      // The result shape exposes NO absolute-volume field.
      expect(res).not.toHaveProperty('monthly_search_volume');
      expect(res).not.toHaveProperty('volume');
    }
  });
});
