import { describe, expect, it } from 'vitest';
import { buildDataForSeoProviders } from '../../src/cli-providers';
import { TRENDS_GRAPH_ITEM_TYPE } from '../../src/adapters/trends';
import type { FetchImpl } from '../../src/adapters/http';

/* ------------------------------------------------------------------ */
/* Proves the BUG FIX: the DataForSEO trends path now emits usable     */
/* TrendRows (direction/momentum/seasonality) instead of the old       */
/* empty-rows placeholder. ZERO network — a canned mock fetch replies   */
/* to each per-keyword explore POST with a typed graph envelope.        */
/* ------------------------------------------------------------------ */

const CREDS = { dataForSeo: { login: 'l', password: 'p' } };

function graphEnvelope(
  keyword: string,
  rows: { date_from: string; values: (number | null)[] }[],
) {
  return {
    status_code: 20000,
    status_message: 'Ok.',
    cost: 0.02,
    tasks: [
      {
        id: `t-${keyword}`,
        status_code: 20000,
        status_message: 'Ok.',
        result: [
          {
            keywords: [keyword],
            items: [
              {
                type: TRENDS_GRAPH_ITEM_TYPE,
                keywords: [keyword],
                data: rows.map((r) => ({ date_from: r.date_from, values: r.values })),
              },
            ],
          },
        ],
      },
    ],
  };
}

/** Build monthly rows (single column) from a value array. */
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

/**
 * A keyword→series map; each explore POST returns that keyword's envelope. The
 * body we receive is `[{ keywords: [kw], ... }]` so we read the keyword back out
 * to pick the right canned response (order-free, like a real per-keyword call).
 */
function keyedFetch(series: Record<string, { date_from: string; values: (number | null)[] }[]>): FetchImpl {
  return async (_url, init) => {
    const body = JSON.parse(String(init?.body ?? '[]')) as { keywords?: string[] }[];
    const kw = body[0]?.keywords?.[0] ?? '';
    const rows = series[kw] ?? [];
    const payload = graphEnvelope(kw, rows);
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify(payload);
      },
    } as unknown as Response;
  };
}

describe('cli-providers — trends() wiring (bug fix)', () => {
  it('emits real direction + momentum rows from the DataForSEO series', async () => {
    const ramp = Array.from({ length: 18 }, (_, i) => 10 + Math.round((i / 17) * 90));
    const fall = Array.from({ length: 18 }, (_, i) => 100 - Math.round((i / 17) * 90));
    const fx = keyedFetch({
      'rising kw': monthlyRows('2024-01', ramp),
      'falling kw': monthlyRows('2024-01', fall),
    });
    const providers = buildDataForSeoProviders(CREDS, fx);
    const { rows } = await providers.trends!(['rising kw', 'falling kw']);

    const rising = rows.find((r) => r.keyword === 'rising kw');
    const falling = rows.find((r) => r.keyword === 'falling kw');
    expect(rising?.direction).toBe('rising');
    expect(falling?.direction).toBe('declining');
    // Momentum is wired as a 0..1 MAGNITUDE (sign carried by direction).
    expect(rising?.momentum).toBeGreaterThan(0);
    expect(rising?.momentum).toBeLessThanOrEqual(1);
    expect(falling?.momentum).toBeGreaterThan(0);
  });

  it('emits a seasonality curve for an annual-peak series', async () => {
    const oneYear = [20, 22, 25, 28, 30, 35, 40, 38, 34, 45, 70, 100];
    const fx = keyedFetch({ 'ski gear': monthlyRows('2024-01', [...oneYear, ...oneYear]) });
    const providers = buildDataForSeoProviders(CREDS, fx);
    const { rows } = await providers.trends!(['ski gear']);
    const row = rows.find((r) => r.keyword === 'ski gear');
    expect(row?.seasonality).toBeDefined();
    expect(Array.isArray(row?.seasonality)).toBe(true);
    // The December peak reads as a 1.0 relative index in the curve.
    const dec = row?.seasonality?.find((p) => p.month === 12);
    expect(dec?.index).toBeCloseTo(1, 5);
  });

  it('emits NO row for a keyword whose series is too short (never fabricates)', async () => {
    const fx = keyedFetch({
      'thin kw': monthlyRows('2026-01', [10, 90]), // < MIN_DIRECTION_POINTS
    });
    const providers = buildDataForSeoProviders(CREDS, fx);
    const { rows } = await providers.trends!(['thin kw']);
    expect(rows).toHaveLength(0);
  });

  it('returns no rows and zero cost for an empty keyword list', async () => {
    const fx = keyedFetch({});
    const providers = buildDataForSeoProviders(CREDS, fx);
    const res = await providers.trends!([]);
    expect(res.rows).toEqual([]);
    expect(res.cost).toBe(0);
  });
});
