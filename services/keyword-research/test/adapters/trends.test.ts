import { describe, expect, it } from 'vitest';
import { DataForSeoAdapter } from '../../src/adapters/dataforseo';
import {
  TRENDS_GRAPH_ITEM_TYPE,
  TrendsAdapter,
  extractSeries,
} from '../../src/adapters/trends';
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

/** A realistic DataForSEO Trends envelope with a typed `google_trends_graph`. */
function dfsGraphEnvelope(
  keywords: string[],
  rows: { date_from: string; values: (number | null)[] }[],
) {
  return {
    status_code: 20000,
    status_message: 'Ok.',
    cost: 0.02,
    tasks: [
      {
        id: 't0',
        status_code: 20000,
        status_message: 'Ok.',
        result: [
          {
            keywords,
            items: [
              { type: 'google_trends_topics_list', data: [] },
              {
                type: TRENDS_GRAPH_ITEM_TYPE,
                keywords,
                data: rows.map((r) => ({
                  date_from: r.date_from,
                  date_to: r.date_from,
                  timestamp: 0,
                  values: r.values,
                })),
              },
            ],
          },
        ],
      },
    ],
  };
}

/** 24 months of monthly rows: single-column values, caller supplies the series. */
function monthlyRows(startYm: string, values: number[]) {
  const parts = startYm.split('-').map(Number);
  const y0 = parts[0] ?? 0;
  const m0 = parts[1] ?? 1;
  return values.map((v, i) => {
    const total = (m0 - 1) + i;
    const year = y0 + Math.floor(total / 12);
    const mm = String((total % 12) + 1).padStart(2, '0');
    return { date_from: `${year}-${mm}-01`, values: [v] as (number | null)[] };
  });
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

describe('TrendsAdapter — DataForSEO google_trends_graph envelope', () => {
  it('parses the typed graph item + derives signals for a rising series', async () => {
    // 24 monthly points climbing 10→100 → rising, positive momentum.
    const ramp = Array.from({ length: 24 }, (_, i) => 10 + Math.round((i / 23) * 90));
    const fx = mockFetch([
      { status: 200, body: dfsGraphEnvelope(['seo tools'], monthlyRows('2024-01', ramp)) },
    ]);
    const dfs = new DataForSeoAdapter(
      { login: 'l', password: 'p' },
      fx,
      { baseUrl: 'https://api.test', retry: NO_DELAY },
    );
    const res = await new TrendsAdapter({ fetchImpl: fx, dataforseo: dfs, retry: NO_DELAY }).explore(
      'seo tools',
    );
    expect(res.available).toBe(true);
    if (res.available) {
      expect(res.volume_source).toBe('dataforseo');
      expect(res.interest_over_time).toHaveLength(24);
      expect(res.signals.direction).toBe('rising');
      expect(res.signals.momentum).not.toBeNull();
      expect(res.signals.momentum!).toBeGreaterThan(0);
    }
  });

  it('derives seasonality from a repeated annual peak', async () => {
    const oneYear = [20, 22, 25, 28, 30, 35, 40, 38, 34, 45, 70, 100];
    const fx = mockFetch([
      {
        status: 200,
        body: dfsGraphEnvelope(['ski gear'], monthlyRows('2024-01', [...oneYear, ...oneYear])),
      },
    ]);
    const dfs = new DataForSeoAdapter(
      { login: 'l', password: 'p' },
      fx,
      { baseUrl: 'https://api.test', retry: NO_DELAY },
    );
    const res = await new TrendsAdapter({ fetchImpl: fx, dataforseo: dfs, retry: NO_DELAY }).explore(
      'ski gear',
    );
    expect(res.available).toBe(true);
    if (res.available) {
      expect(res.signals.seasonality).not.toBeNull();
      expect(res.signals.seasonality!.seasonal).toBe(true);
      expect(res.signals.seasonality!.peakMonths).toContain(12);
    }
  });

  it('returns an empty series + null signals (no crash) for a malformed envelope', async () => {
    const fx = mockFetch([
      {
        status: 200,
        // Top/task codes OK, but `items` is garbage — no usable series anywhere.
        body: {
          status_code: 20000,
          status_message: 'Ok.',
          cost: 0.01,
          tasks: [{ id: 't0', status_code: 20000, result: [{ items: 'not-an-array' }] }],
        },
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
      expect(res.interest_over_time).toEqual([]);
      expect(res.signals.direction).toBeNull();
      expect(res.signals.momentum).toBeNull();
      expect(res.signals.seasonality).toBeNull();
    }
  });

  it('falls back to any item carrying data[] when the graph type is absent', async () => {
    // No `type: "google_trends_graph"`, but one item still carries a data[].
    const env = {
      status_code: 20000,
      status_message: 'Ok.',
      cost: 0.01,
      tasks: [
        {
          id: 't0',
          status_code: 20000,
          result: [
            {
              items: [
                { type: 'something_else', data: null },
                {
                  type: 'legacy_graph',
                  data: [
                    { date_from: '2026-01-01', values: [40] },
                    { date_from: '2026-02-01', values: [60] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const fx = mockFetch([{ status: 200, body: env }]);
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
      expect(res.interest_over_time.map((p) => p.index)).toEqual([40, 60]);
    }
  });
});

describe('extractSeries — column alignment', () => {
  it('extracts the requested keyword COLUMN from a multi-keyword graph', () => {
    const result = {
      keywords: ['a', 'b'],
      items: [
        {
          type: TRENDS_GRAPH_ITEM_TYPE,
          keywords: ['a', 'b'],
          data: [
            { date_from: '2026-01-01', values: [10, 90] },
            { date_from: '2026-02-01', values: [20, 80] },
          ],
        },
      ],
    };
    expect(extractSeries(result, 0).map((p) => p.index)).toEqual([10, 20]);
    expect(extractSeries(result, 1).map((p) => p.index)).toEqual([90, 80]);
  });

  it('returns [] for a null/empty result (never throws, never fabricates)', () => {
    expect(extractSeries(null)).toEqual([]);
    expect(extractSeries(undefined)).toEqual([]);
    expect(extractSeries({ items: [] })).toEqual([]);
  });

  it('falls back to a timestamp when date_from is absent', () => {
    const result = {
      items: [
        {
          type: TRENDS_GRAPH_ITEM_TYPE,
          data: [{ timestamp: 1782950400, values: [55] }],
        },
      ],
    };
    const s = extractSeries(result, 0);
    expect(s).toHaveLength(1);
    expect(s[0]?.date).toBe('1782950400');
    expect(s[0]?.index).toBe(55);
  });
});
