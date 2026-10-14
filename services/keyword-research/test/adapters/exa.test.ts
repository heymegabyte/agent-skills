import { describe, expect, it } from 'vitest';
import { AuthError } from '../../src/adapters/http';
import { ExaAdapter } from '../../src/adapters/exa';
import { NO_DELAY, mockFetch } from './mock-fetch';

const FIXED_NOW = () => new Date('2026-10-14T12:00:00.000Z');

function adapter(fx: ReturnType<typeof mockFetch>) {
  return new ExaAdapter({ apiKey: 'exa-key' }, fx, {
    baseUrl: 'https://exa.test',
    now: FIXED_NOW,
    retry: NO_DELAY,
  });
}

describe('ExaAdapter — search → evidence only', () => {
  it('returns { url, title, excerpt, retrievedAt } with a deterministic timestamp', async () => {
    const fx = mockFetch([
      {
        status: 200,
        body: {
          results: [
            {
              id: 'r1',
              url: 'https://blog.example.com/post',
              title: 'A deep dive',
              highlights: ['the key insight is…'],
            },
          ],
        },
      },
    ]);
    const ev = await adapter(fx).search({ query: 'under-served topic', numResults: 5 });
    expect(ev).toEqual([
      {
        url: 'https://blog.example.com/post',
        title: 'A deep dive',
        excerpt: 'the key insight is…',
        retrievedAt: '2026-10-14T12:00:00.000Z',
      },
    ]);
    // API key header + array-free POST body.
    expect(fx.calls[0]?.headers['x-api-key']).toBe('exa-key');
    const body = JSON.parse(fx.calls[0]?.body ?? '{}');
    expect(body.query).toBe('under-served topic');
    expect(body.numResults).toBe(5);
  });

  it('exposes NO numeric volume/difficulty on evidence rows', async () => {
    const fx = mockFetch([
      {
        status: 200,
        body: { results: [{ url: 'https://x/', title: 'T', text: 'body text' }] },
      },
    ]);
    const ev = await adapter(fx).search({ query: 'q' });
    const row = ev[0]!;
    expect(Object.keys(row).sort()).toEqual(['excerpt', 'retrievedAt', 'title', 'url']);
    expect(row).not.toHaveProperty('score');
    expect(row).not.toHaveProperty('searchVolume');
    expect(row).not.toHaveProperty('difficulty');
    expect(row.excerpt).toBe('body text');
  });

  it('contents(ids) returns evidence for each id', async () => {
    const fx = mockFetch([
      {
        status: 200,
        body: {
          results: [
            { id: 'a', url: 'https://a/', title: 'A', summary: 'summary a' },
            { id: 'b', url: 'https://b/', title: 'B', summary: 'summary b' },
          ],
        },
      },
    ]);
    const ev = await adapter(fx).contents(['a', 'b']);
    expect(ev.map((e) => e.excerpt)).toEqual(['summary a', 'summary b']);
    const body = JSON.parse(fx.calls[0]?.body ?? '{}');
    expect(body.ids).toEqual(['a', 'b']);
  });

  it('401 → AuthError', async () => {
    const fx = mockFetch([{ status: 401, body: { error: 'bad key' } }]);
    await expect(adapter(fx).search({ query: 'q' })).rejects.toBeInstanceOf(AuthError);
  });
});
