import { describe, expect, it } from 'vitest';
import {
  AuthError,
  ProviderError,
  RateLimitError,
} from '../../src/adapters/http';
import {
  BATCH_LIMIT,
  DataForSeoAdapter,
  chunk,
  mapNullableMetric,
} from '../../src/adapters/dataforseo';
import { NO_DELAY, mockFetch } from './mock-fetch';

const CREDS = { login: 'login', password: 'password' };

/** Build a full DataForSEO envelope with the given tasks. */
function envelope(opts: {
  status_code?: number;
  cost?: number;
  tasks: { id?: string; status_code: number; status_message?: string; result: unknown }[];
}) {
  return {
    status_code: opts.status_code ?? 20000,
    status_message: 'Ok.',
    cost: opts.cost ?? 0,
    tasks: opts.tasks.map((t, i) => ({
      id: t.id ?? `task-${i}`,
      status_code: t.status_code,
      status_message: t.status_message ?? 'Ok.',
      result: t.result,
    })),
  };
}

function adapter(fx: ReturnType<typeof mockFetch>): DataForSeoAdapter {
  return new DataForSeoAdapter(CREDS, fx, {
    baseUrl: 'https://api.test',
    retry: NO_DELAY,
  });
}

describe('mapNullableMetric — missing → null, never 0', () => {
  it('maps a real number through', () => {
    expect(mapNullableMetric(42)).toBe(42);
    expect(mapNullableMetric(0)).toBe(0); // a REAL zero survives
  });
  it('maps undefined/null/NaN/string → null', () => {
    expect(mapNullableMetric(undefined)).toBeNull();
    expect(mapNullableMetric(null)).toBeNull();
    expect(mapNullableMetric(Number.NaN)).toBeNull();
    expect(mapNullableMetric('100')).toBeNull();
  });
});

describe('chunk', () => {
  it('splits into batches of at most `size`', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it('rejects a non-positive size', () => {
    expect(() => chunk([1], 0)).toThrow(ProviderError);
  });
});

describe('DataForSeoAdapter — success + both-level validation', () => {
  it('userData returns the first FREE result and sends Basic auth', async () => {
    const fx = mockFetch([
      envelope({ cost: 0, tasks: [{ status_code: 20000, result: { balance: 12.5 } }] }),
    ].map((b) => ({ status: 200, body: b })));

    const dfs = adapter(fx);
    const data = await dfs.userData<{ balance: number }>();
    expect(data).toEqual({ balance: 12.5 });
    expect(fx.calls[0]?.url).toBe('https://api.test/v3/appendix/user_data');
    expect(fx.calls[0]?.headers.Authorization).toBe('Basic bG9naW46cGFzc3dvcmQ='); // login:password
  });

  it('keywordSuggestions returns results + sums cost', async () => {
    const fx = mockFetch([
      {
        status: 200,
        body: envelope({
          cost: 0.03,
          tasks: [
            { status_code: 20000, result: [{ keyword: 'a' }, { keyword: 'b' }] },
          ],
        }),
      },
    ]);
    const dfs = adapter(fx);
    const out = await dfs.keywordSuggestions<{ keyword: string }[]>('seed');
    expect(out.results).toHaveLength(1);
    expect(out.cost).toBeCloseTo(0.03);
    expect(out.errors).toHaveLength(0);
    // POST with an ARRAY body of task objects.
    expect(fx.calls[0]?.method).toBe('POST');
    expect(JSON.parse(fx.calls[0]?.body ?? '[]')).toEqual([{ keyword: 'seed' }]);
  });
});

describe('DataForSeoAdapter — auth + provider errors', () => {
  it('top-level 40100 → AuthError (even though HTTP 200)', async () => {
    const fx = mockFetch([
      { status: 200, body: envelope({ status_code: 40100, tasks: [] }) },
    ]);
    await expect(adapter(fx).userData()).rejects.toBeInstanceOf(AuthError);
  });

  it('HTTP 401 → AuthError', async () => {
    const fx = mockFetch([{ status: 401, body: { error: 'nope' } }]);
    await expect(adapter(fx).userData()).rejects.toBeInstanceOf(AuthError);
  });

  it('top-level status_code !== 20000 → ProviderError', async () => {
    const fx = mockFetch([
      { status: 200, body: envelope({ status_code: 40400, tasks: [] }) },
    ]);
    await expect(adapter(fx).keywordIdeas(['x'])).rejects.toBeInstanceOf(ProviderError);
  });

  it('429 → backoff → success (attempt count asserted)', async () => {
    const fx = mockFetch([
      { status: 429 },
      {
        status: 200,
        body: envelope({ cost: 0.01, tasks: [{ status_code: 20000, result: [{ k: 1 }] }] }),
      },
    ]);
    const out = await adapter(fx).searchVolume<{ k: number }[]>(['kw']);
    expect(out.results).toHaveLength(1);
    expect(fx.calls).toHaveLength(2); // one retry
  });

  it('persistent 429 → RateLimitError', async () => {
    const fx = mockFetch([{ status: 429 }, { status: 429 }, { status: 429 }, { status: 429 }]);
    await expect(adapter(fx).serpOrganic('kw')).rejects.toBeInstanceOf(RateLimitError);
  });
});

describe('DataForSeoAdapter — partial task failure', () => {
  it('one 20000 task + one errored task → BOTH surfaced, good NOT discarded', async () => {
    const fx = mockFetch([
      {
        status: 200,
        body: envelope({
          cost: 0.05,
          tasks: [
            { id: 'good', status_code: 20000, result: [{ keyword: 'alpha' }] },
            {
              id: 'bad',
              status_code: 40501,
              status_message: 'Invalid Field',
              result: null,
            },
          ],
        }),
      },
    ]);
    const out = await adapter(fx).keywordIdeas<{ keyword: string }[]>(['alpha', 'beta']);
    expect(out.results).toHaveLength(1);
    expect(out.results[0]).toEqual([{ keyword: 'alpha' }]);
    expect(out.errors).toHaveLength(1);
    expect(out.errors[0]).toMatchObject({ id: 'bad', status_code: 40501 });
    expect(out.cost).toBeCloseTo(0.05);
  });
});

describe('DataForSeoAdapter — metric null-mapping (never 0)', () => {
  it('maps absent search_volume to null, real 0 stays 0', async () => {
    const fx = mockFetch([
      {
        status: 200,
        body: envelope({
          tasks: [
            {
              status_code: 20000,
              result: [
                { keyword: 'present', search_volume: 0 },
                { keyword: 'absent' /* no search_volume field */ },
              ],
            },
          ],
        }),
      },
    ]);
    const out = await adapter(fx).searchVolume<
      { keyword: string; search_volume?: number }[]
    >(['present', 'absent']);
    const rows = out.results[0] ?? [];
    expect(mapNullableMetric(rows[0]?.search_volume)).toBe(0); // real zero
    expect(mapNullableMetric(rows[1]?.search_volume)).toBeNull(); // unknown → null
  });
});

describe('DataForSeoAdapter — batching (chunked into N calls)', () => {
  it('chunks a large keyword list into ceil(n / BATCH_LIMIT) calls', async () => {
    const total = BATCH_LIMIT * 2 + 3; // → 3 batches
    const keywords = Array.from({ length: total }, (_, i) => `kw-${i}`);

    // One envelope per expected batch, each with its own cost.
    const fx = mockFetch(
      [0.1, 0.2, 0.3].map((cost) => ({
        status: 200,
        body: envelope({ cost, tasks: [{ status_code: 20000, result: [{ ok: true }] }] }),
      })),
    );

    const out = await adapter(fx).bulkKeywordDifficulty<{ ok: boolean }[]>(keywords);
    expect(fx.calls).toHaveLength(3);
    expect(out.batches).toBe(3);
    expect(out.results).toHaveLength(3); // one result item per batch
    expect(out.cost).toBeCloseTo(0.6); // costs summed across batches

    // Each call carried at most BATCH_LIMIT keywords.
    for (const call of fx.calls) {
      const body = JSON.parse(call.body ?? '[]') as { keywords: string[] }[];
      expect(body[0]?.keywords.length).toBeLessThanOrEqual(BATCH_LIMIT);
    }
    const first = JSON.parse(fx.calls[0]?.body ?? '[]') as { keywords: string[] }[];
    const last = JSON.parse(fx.calls[2]?.body ?? '[]') as { keywords: string[] }[];
    expect(first[0]?.keywords).toHaveLength(BATCH_LIMIT);
    expect(last[0]?.keywords).toHaveLength(3);
  });
});

describe('DataForSeoAdapter — async task flow (task_post → ready → task_get)', () => {
  it('drives the mocked happy path: created → ready → fetched', async () => {
    const postPath = '/v3/serp/google/organic/task_post';
    const readyPath = '/v3/serp/google/organic/tasks_ready';
    const getPrefix = '/v3/serp/google/organic/task_get/advanced';

    const fx = mockFetch([
      // 1) task_post → 20100 "Task Created" with an id
      {
        status: 200,
        body: envelope({
          cost: 0.02,
          tasks: [{ id: 'abc123', status_code: 20100, status_message: 'Task Created.', result: null }],
        }),
      },
      // 2) tasks_ready → result rows each carrying an id
      {
        status: 200,
        body: envelope({
          tasks: [{ status_code: 20000, result: [{ id: 'abc123' }] }],
        }),
      },
      // 3) task_get → the finished result
      {
        status: 200,
        body: envelope({
          cost: 0,
          tasks: [{ id: 'abc123', status_code: 20000, result: [{ items: ['rank1'] }] }],
        }),
      },
    ]);

    const dfs = adapter(fx);

    const posted = await dfs.taskPost(postPath, [{ keyword: 'kw' }]);
    expect(posted.ids).toEqual(['abc123']);
    expect(posted.errors).toHaveLength(0);
    expect(posted.cost).toBeCloseTo(0.02);

    const ready = await dfs.pollReady(readyPath);
    expect(ready).toContain('abc123');

    const got = await dfs.taskGet<{ items: string[] }[]>(getPrefix, 'abc123');
    expect(got.results[0]).toEqual([{ items: ['rank1'] }]);

    expect(fx.calls).toHaveLength(3);
    expect(fx.calls[2]?.url).toBe(`https://api.test${getPrefix}/abc123`);
  });

  it('task_post surfaces a rejected task without dropping accepted ones', async () => {
    const fx = mockFetch([
      {
        status: 200,
        body: envelope({
          tasks: [
            { id: 'ok1', status_code: 20100, result: null },
            { id: 'bad1', status_code: 40501, status_message: 'Invalid', result: null },
          ],
        }),
      },
    ]);
    const posted = await adapter(fx).taskPost('/v3/serp/google/organic/task_post', [
      { keyword: 'a' },
      { keyword: 'b' },
    ]);
    expect(posted.ids).toEqual(['ok1']);
    expect(posted.errors).toHaveLength(1);
    expect(posted.errors[0]).toMatchObject({ id: 'bad1', status_code: 40501 });
  });
});
