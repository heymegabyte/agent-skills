import { describe, expect, it } from 'vitest';
import {
  crawlSiteInventory,
  normalizeUrl,
  sameOrigin,
  parseRobots,
  isDisallowed,
  extractSitemapLocs,
  isSitemapIndex,
  extractMetaDescription,
  extractLinks,
  extractPageRecord,
} from '../src/crawl';
import { PageRecord } from '../src/types';
import {
  buildCrawledInventory,
  pageRecordToExistingPage,
} from '../src/cli-providers';
import type { FetchImpl } from '../src/adapters/http';

/* ------------------------------------------------------------------ */
/* Route-aware mock fetch — ZERO network, deterministic, order-free.   */
/*                                                                      */
/* The crawler fans out with concurrency, so responses can't be a       */
/* sequential queue (like the adapter mock). Instead we map URL → spec. */
/* A missing route resolves to a 404 (a real site's behaviour), so the  */
/* crawler's graceful-degradation paths are exercised honestly.         */
/* ------------------------------------------------------------------ */

interface RouteSpec {
  status?: number;
  body?: string;
  contentType?: string;
  /** If set, the fetch THROWS (transport failure / abort). */
  throw?: Error;
}

interface MockFetch {
  (input: string, init?: RequestInit): Promise<Response>;
  calls: string[];
}

function routeFetch(routes: Record<string, RouteSpec>): MockFetch {
  const fn = (async (input: string): Promise<Response> => {
    fn.calls.push(input);
    // Normalize a trailing slash so "https://x/" matches a "https://x" route.
    const spec =
      routes[input] ??
      routes[input.replace(/\/$/, '')] ??
      routes[`${input}/`] ??
      undefined;
    if (!spec) {
      // Unknown route → 404 (lets BFS / sitemap fetches fail gracefully).
      return makeResponse({ status: 404 });
    }
    if (spec.throw) throw spec.throw;
    return makeResponse(spec);
  }) as MockFetch;
  fn.calls = [];
  return fn;
}

function makeResponse(spec: RouteSpec): Response {
  const status = spec.status ?? 200;
  const ok = status >= 200 && status < 300;
  const contentType = spec.contentType ?? 'text/html; charset=utf-8';
  const res = {
    ok,
    status,
    headers: {
      get(name: string): string | null {
        return name.toLowerCase() === 'content-type' ? contentType : null;
      },
    },
    async text(): Promise<string> {
      return spec.body ?? '';
    },
  };
  return res as unknown as Response;
}

/** Zero-timeout so tests never arm a real setTimeout-based abort. */
const NO_TIMEOUT = { timeoutMs: 0 as const };

/* ------------------------------------------------------------------ */
/* Canned fixtures.                                                    */
/* ------------------------------------------------------------------ */

const htmlPage = (opts: {
  title?: string;
  h1?: string;
  meta?: string;
  h2?: string[];
  h3?: string[];
  links?: string[];
}) => {
  const metaTag = opts.meta
    ? `<meta name="description" content="${opts.meta}">`
    : '';
  const h2s = (opts.h2 ?? []).map((t) => `<h2>${t}</h2>`).join('\n');
  const h3s = (opts.h3 ?? []).map((t) => `<h3>${t}</h3>`).join('\n');
  const links = (opts.links ?? []).map((h) => `<a href="${h}">link</a>`).join('\n');
  return `<!doctype html><html><head>
  <title>${opts.title ?? ''}</title>
  ${metaTag}
  </head><body>
  ${opts.h1 ? `<h1>${opts.h1}</h1>` : ''}
  ${h2s}
  ${h3s}
  ${links}
  </body></html>`;
};

const sitemapXml = (urls: string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>`;

const sitemapIndexXml = (sitemaps: string[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((u) => `  <sitemap><loc>${u}</loc></sitemap>`).join('\n')}
</sitemapindex>`;

/* ================================================================== */
/* Unit tests — pure helpers.                                          */
/* ================================================================== */

describe('normalizeUrl', () => {
  it('drops the fragment and a trailing slash (non-root)', () => {
    expect(normalizeUrl('https://x.com/a/#frag')).toBe('https://x.com/a');
    expect(normalizeUrl('https://x.com/a/')).toBe('https://x.com/a');
  });
  it('keeps the bare-root slash and lowercases the host', () => {
    expect(normalizeUrl('https://X.COM/')).toBe('https://x.com/');
  });
  it('keeps the query string (distinct content)', () => {
    expect(normalizeUrl('https://x.com/p?id=2#top')).toBe('https://x.com/p?id=2');
  });
  it('resolves relative URLs against a base', () => {
    expect(normalizeUrl('/about/', 'https://x.com/home')).toBe('https://x.com/about');
  });
  it('rejects non-http(s) + unparseable input', () => {
    expect(normalizeUrl('mailto:a@b.com')).toBeNull();
    expect(normalizeUrl('javascript:void(0)')).toBeNull();
    expect(normalizeUrl('not a url')).toBeNull();
  });
});

describe('sameOrigin', () => {
  const origin = new URL('https://x.com');
  it('matches same host, rejects others', () => {
    expect(sameOrigin('https://x.com/a', origin)).toBe(true);
    expect(sameOrigin('https://evil.com/a', origin)).toBe(false);
    expect(sameOrigin('garbage', origin)).toBe(false);
  });
});

describe('parseRobots', () => {
  it('collects Sitemap: directives and User-agent:* Disallow rules', () => {
    const r = parseRobots(
      [
        '# a comment',
        'Sitemap: https://x.com/sitemap.xml',
        'User-agent: *',
        'Disallow: /private',
        'Disallow:',
        'Sitemap: https://x.com/news-sitemap.xml',
      ].join('\n'),
    );
    expect(r.sitemaps).toEqual([
      'https://x.com/sitemap.xml',
      'https://x.com/news-sitemap.xml',
    ]);
    expect(r.disallow).toEqual(['/private']); // empty Disallow ignored
  });

  it('ignores Disallow rules scoped to a DIFFERENT user-agent', () => {
    const r = parseRobots(
      ['User-agent: BadBot', 'Disallow: /', 'User-agent: *', 'Disallow: /admin'].join('\n'),
    );
    expect(r.disallow).toEqual(['/admin']); // not the "/" scoped to BadBot
  });
});

describe('isDisallowed', () => {
  it('matches path prefixes, honours search string, no-op on empty rules', () => {
    expect(isDisallowed('https://x.com/private/a', ['/private'])).toBe(true);
    expect(isDisallowed('https://x.com/public', ['/private'])).toBe(false);
    expect(isDisallowed('https://x.com/anything', [])).toBe(false);
  });
});

describe('extractSitemapLocs + isSitemapIndex', () => {
  it('pulls every <loc> and detects an index', () => {
    const idx = sitemapIndexXml(['https://x.com/s1.xml', 'https://x.com/s2.xml']);
    expect(isSitemapIndex(idx)).toBe(true);
    expect(extractSitemapLocs(idx)).toEqual(['https://x.com/s1.xml', 'https://x.com/s2.xml']);

    const set = sitemapXml(['https://x.com/a', 'https://x.com/b']);
    expect(isSitemapIndex(set)).toBe(false);
    expect(extractSitemapLocs(set)).toEqual(['https://x.com/a', 'https://x.com/b']);
  });
  it('decodes entities inside <loc>', () => {
    expect(extractSitemapLocs('<loc>https://x.com/a?b=1&amp;c=2</loc>')).toEqual([
      'https://x.com/a?b=1&c=2',
    ]);
  });
});

describe('extractMetaDescription', () => {
  it('reads name="description" regardless of attribute order', () => {
    expect(extractMetaDescription('<meta content="Hi there" name="description">')).toBe(
      'Hi there',
    );
    expect(extractMetaDescription('<meta name="description" content="Hello">')).toBe('Hello');
  });
  it('falls back to og:description and returns null when absent', () => {
    expect(extractMetaDescription('<meta property="og:description" content="OG">')).toBe('OG');
    expect(extractMetaDescription('<meta name="viewport" content="x">')).toBeNull();
  });
});

describe('extractLinks', () => {
  it('extracts hrefs and skips pure-fragment anchors', () => {
    const html = '<a href="/a">A</a><a href="#top">top</a><a href="https://x.com/b">B</a>';
    expect(extractLinks(html)).toEqual(['/a', 'https://x.com/b']);
  });
});

describe('extractPageRecord', () => {
  it('extracts title/h1/meta/headings and strips inline tags', () => {
    const html = htmlPage({
      title: 'Pricing &amp; Plans',
      h1: 'Our <em>Pricing</em>',
      meta: 'All the plans',
      h2: ['Starter', 'Pro'],
      h3: ['FAQ'],
    });
    const rec = extractPageRecord('https://x.com/pricing', html);
    expect(rec.title).toBe('Pricing & Plans');
    expect(rec.h1).toBe('Our Pricing'); // inline <em> stripped
    expect(rec.metaDescription).toBe('All the plans');
    expect(rec.headings).toEqual(['Starter', 'Pro', 'FAQ']); // h2s then h3s
    // Schema-valid.
    expect(() => PageRecord.parse(rec)).not.toThrow();
  });

  it('returns null / [] for missing tags (never invents)', () => {
    const rec = extractPageRecord('https://x.com/bare', '<html><body>nothing</body></html>');
    expect(rec.title).toBeNull();
    expect(rec.h1).toBeNull();
    expect(rec.metaDescription).toBeNull();
    expect(rec.headings).toEqual([]);
  });
});

/* ================================================================== */
/* Integration — crawlSiteInventory discovery strategies.             */
/* ================================================================== */

describe('crawlSiteInventory — sitemap.xml path (parse + extraction)', () => {
  it('discovers URLs from sitemap.xml and extracts each page', async () => {
    const fx = routeFetch({
      'https://x.com/robots.txt': { status: 404 },
      'https://x.com/sitemap.xml': {
        contentType: 'application/xml',
        body: sitemapXml(['https://x.com/', 'https://x.com/pricing', 'https://x.com/about']),
      },
      'https://x.com/': htmlSpec({ title: 'Home', h1: 'Welcome' }),
      'https://x.com/pricing': htmlSpec({
        title: 'Pricing',
        h1: 'Plans',
        meta: 'Our pricing',
        h2: ['Starter'],
      }),
      'https://x.com/about': htmlSpec({ title: 'About', h1: 'About us' }),
    });

    const res = await crawlSiteInventory({ fetchImpl: fx, origin: 'https://x.com', ...NO_TIMEOUT });

    expect(res.pages).toHaveLength(3);
    const byUrl = Object.fromEntries(res.pages.map((p) => [p.url, p]));
    expect(byUrl['https://x.com/']?.title).toBe('Home');
    expect(byUrl['https://x.com/pricing']?.h1).toBe('Plans');
    expect(byUrl['https://x.com/pricing']?.metaDescription).toBe('Our pricing');
    expect(byUrl['https://x.com/pricing']?.headings).toEqual(['Starter']);
    // Every record is schema-valid + no limitations beyond the missing robots.
    for (const p of res.pages) expect(() => PageRecord.parse(p)).not.toThrow();
  });
});

describe('crawlSiteInventory — robots Sitemap: directive', () => {
  it('follows a Sitemap: URL declared in robots.txt (non-default name)', async () => {
    const fx = routeFetch({
      'https://x.com/robots.txt': {
        contentType: 'text/plain',
        body: 'User-agent: *\nSitemap: https://x.com/custom-sitemap.xml\n',
      },
      'https://x.com/custom-sitemap.xml': {
        contentType: 'application/xml',
        body: sitemapXml(['https://x.com/a']),
      },
      // The conventional default is NOT present (404) — proves we used robots'.
      'https://x.com/sitemap.xml': { status: 404 },
      'https://x.com/a': htmlSpec({ title: 'A' }),
    });

    const res = await crawlSiteInventory({ fetchImpl: fx, origin: 'https://x.com', ...NO_TIMEOUT });
    expect(res.pages.map((p) => p.url)).toEqual(['https://x.com/a']);
    expect(fx.calls).toContain('https://x.com/custom-sitemap.xml');
  });
});

describe('crawlSiteInventory — sitemap-index recursion', () => {
  it('recurses an index into child sitemaps and flattens their pages', async () => {
    const fx = routeFetch({
      'https://x.com/robots.txt': { status: 404 },
      'https://x.com/sitemap.xml': {
        contentType: 'application/xml',
        body: sitemapIndexXml(['https://x.com/sitemap-1.xml', 'https://x.com/sitemap-2.xml']),
      },
      'https://x.com/sitemap-1.xml': {
        contentType: 'application/xml',
        body: sitemapXml(['https://x.com/p1']),
      },
      'https://x.com/sitemap-2.xml': {
        contentType: 'application/xml',
        body: sitemapXml(['https://x.com/p2']),
      },
      'https://x.com/p1': htmlSpec({ title: 'P1' }),
      'https://x.com/p2': htmlSpec({ title: 'P2' }),
    });

    const res = await crawlSiteInventory({ fetchImpl: fx, origin: 'https://x.com', ...NO_TIMEOUT });
    expect(res.pages.map((p) => p.url).sort()).toEqual(['https://x.com/p1', 'https://x.com/p2']);
  });
});

describe('crawlSiteInventory — homepage BFS fallback (no sitemap)', () => {
  it('crawls same-origin links from the homepage when no sitemap exists', async () => {
    const fx = routeFetch({
      'https://x.com/robots.txt': { status: 404 },
      'https://x.com/sitemap.xml': { status: 404 },
      'https://x.com/': htmlSpec({
        title: 'Home',
        h1: 'Home',
        links: ['/pricing', '/about', 'https://x.com/pricing'], // dup link
      }),
      'https://x.com/pricing': htmlSpec({ title: 'Pricing', links: ['/about'] }),
      'https://x.com/about': htmlSpec({ title: 'About' }),
    });

    const res = await crawlSiteInventory({ fetchImpl: fx, origin: 'https://x.com', ...NO_TIMEOUT });
    const urls = res.pages.map((p) => p.url).sort();
    expect(urls).toEqual(['https://x.com/', 'https://x.com/about', 'https://x.com/pricing']);
    // Limitation note explains the fallback.
    expect(res.limitations.some((l) => /homepage crawl/i.test(l))).toBe(true);
  });
});

describe('crawlSiteInventory — same-origin filter', () => {
  it('skips off-origin URLs from the sitemap (never crawls another host)', async () => {
    const fx = routeFetch({
      'https://x.com/robots.txt': { status: 404 },
      'https://x.com/sitemap.xml': {
        contentType: 'application/xml',
        body: sitemapXml(['https://x.com/a', 'https://evil.com/b']),
      },
      'https://x.com/a': htmlSpec({ title: 'A' }),
      'https://evil.com/b': htmlSpec({ title: 'EVIL' }),
    });

    const res = await crawlSiteInventory({ fetchImpl: fx, origin: 'https://x.com', ...NO_TIMEOUT });
    expect(res.pages.map((p) => p.url)).toEqual(['https://x.com/a']);
    expect(fx.calls).not.toContain('https://evil.com/b'); // never fetched
    expect(res.limitations.some((l) => /off-origin/i.test(l))).toBe(true);
  });

  it('BFS never follows an off-origin link', async () => {
    const fx = routeFetch({
      'https://x.com/robots.txt': { status: 404 },
      'https://x.com/sitemap.xml': { status: 404 },
      'https://x.com/': htmlSpec({ title: 'Home', links: ['https://evil.com/x', '/a'] }),
      'https://x.com/a': htmlSpec({ title: 'A' }),
    });
    const res = await crawlSiteInventory({ fetchImpl: fx, origin: 'https://x.com', ...NO_TIMEOUT });
    expect(res.pages.map((p) => p.url).sort()).toEqual(['https://x.com/', 'https://x.com/a']);
    expect(fx.calls).not.toContain('https://evil.com/x');
  });
});

describe('crawlSiteInventory — URL dedup + normalize', () => {
  it('collapses trailing-slash / fragment duplicates into one page', async () => {
    const fx = routeFetch({
      'https://x.com/robots.txt': { status: 404 },
      'https://x.com/sitemap.xml': {
        contentType: 'application/xml',
        // Three spellings of the SAME page → one record.
        body: sitemapXml(['https://x.com/a', 'https://x.com/a/', 'https://x.com/a#section']),
      },
      'https://x.com/a': htmlSpec({ title: 'A' }),
    });

    const res = await crawlSiteInventory({ fetchImpl: fx, origin: 'https://x.com', ...NO_TIMEOUT });
    expect(res.pages).toHaveLength(1);
    expect(res.pages[0]?.url).toBe('https://x.com/a');
  });
});

describe('crawlSiteInventory — maxPages cap', () => {
  it('fetches at most maxPages pages and notes the cap', async () => {
    const urls = Array.from({ length: 10 }, (_, i) => `https://x.com/p${i}`);
    const routes: Record<string, RouteSpec> = {
      'https://x.com/robots.txt': { status: 404 },
      'https://x.com/sitemap.xml': { contentType: 'application/xml', body: sitemapXml(urls) },
    };
    for (const u of urls) routes[u] = htmlSpec({ title: u });
    const fx = routeFetch(routes);

    const res = await crawlSiteInventory({
      fetchImpl: fx,
      origin: 'https://x.com',
      maxPages: 3,
      ...NO_TIMEOUT,
    });
    expect(res.pages).toHaveLength(3);
    // Only robots + sitemap + 3 page fetches (never the other 7).
    const pageFetches = fx.calls.filter((c) => /\/p\d+$/.test(c));
    expect(pageFetches).toHaveLength(3);
    expect(res.limitations.some((l) => /capped the crawl at maxPages=3/.test(l))).toBe(true);
  });
});

describe('crawlSiteInventory — robots Disallow respected', () => {
  it('skips a disallowed sitemap URL (never fetches it)', async () => {
    const fx = routeFetch({
      'https://x.com/robots.txt': {
        contentType: 'text/plain',
        body: 'User-agent: *\nDisallow: /private\n',
      },
      'https://x.com/sitemap.xml': {
        contentType: 'application/xml',
        body: sitemapXml(['https://x.com/public', 'https://x.com/private/secret']),
      },
      'https://x.com/public': htmlSpec({ title: 'Public' }),
      'https://x.com/private/secret': htmlSpec({ title: 'SECRET' }),
    });

    const res = await crawlSiteInventory({ fetchImpl: fx, origin: 'https://x.com', ...NO_TIMEOUT });
    expect(res.pages.map((p) => p.url)).toEqual(['https://x.com/public']);
    expect(fx.calls).not.toContain('https://x.com/private/secret'); // never fetched
    expect(res.limitations.some((l) => /disallowed by robots/i.test(l))).toBe(true);
  });
});

describe('crawlSiteInventory — graceful failure', () => {
  it('fetch throws for EVERYTHING → empty inventory + limitation, no crash', async () => {
    const boom = new Error('ECONNREFUSED');
    const fx = (async () => {
      throw boom;
    }) as FetchImpl;

    const res = await crawlSiteInventory({ fetchImpl: fx, origin: 'https://x.com', ...NO_TIMEOUT });
    expect(res.pages).toEqual([]);
    expect(res.limitations.length).toBeGreaterThan(0);
    expect(res.limitations.some((l) => /empty/i.test(l))).toBe(true);
  });

  it('an unparseable origin returns empty + a limitation (no throw)', async () => {
    const fx = routeFetch({});
    const res = await crawlSiteInventory({ fetchImpl: fx, origin: 'not-a-url', ...NO_TIMEOUT });
    expect(res.pages).toEqual([]);
    expect(res.limitations[0]).toMatch(/Could not parse origin/);
    expect(fx.calls).toHaveLength(0); // never even tried the network
  });

  it('skips non-HTML sitemap entries (e.g. a PDF) and notes it', async () => {
    const fx = routeFetch({
      'https://x.com/robots.txt': { status: 404 },
      'https://x.com/sitemap.xml': {
        contentType: 'application/xml',
        body: sitemapXml(['https://x.com/page', 'https://x.com/file.pdf']),
      },
      'https://x.com/page': htmlSpec({ title: 'Page' }),
      'https://x.com/file.pdf': { contentType: 'application/pdf', body: '%PDF-1.7 binary' },
    });
    const res = await crawlSiteInventory({ fetchImpl: fx, origin: 'https://x.com', ...NO_TIMEOUT });
    expect(res.pages.map((p) => p.url)).toEqual(['https://x.com/page']);
    expect(res.limitations.some((l) => /non-HTML/i.test(l))).toBe(true);
  });
});

/* ================================================================== */
/* Wiring — PageRecord → ExistingPage + buildCrawledInventory.         */
/* ================================================================== */

describe('pageRecordToExistingPage', () => {
  it('derives targetKeywords from title/h1/headings, deduping by stem', () => {
    const ep = pageRecordToExistingPage({
      url: 'https://x.com/pricing',
      title: 'CRM Pricing',
      h1: 'CRM Pricing', // same stem as title → deduped
      metaDescription: null,
      headings: ['Starter Plan', 'Pro Plan'],
    });
    expect(ep.url).toBe('https://x.com/pricing');
    expect(ep.title).toBe('CRM Pricing');
    // Title kept once; h1 (same stem) dropped; both headings kept.
    expect(ep.targetKeywords).toEqual(['CRM Pricing', 'Starter Plan', 'Pro Plan']);
    // Intent deliberately left undefined (crawl can't reliably infer it).
    expect(ep.intent).toBeUndefined();
  });

  it('a page with no text yields empty targetKeywords (never invents)', () => {
    const ep = pageRecordToExistingPage({
      url: 'https://x.com/x',
      title: null,
      h1: null,
      metaDescription: null,
      headings: [],
    });
    expect(ep.targetKeywords).toEqual([]);
    expect(ep.title).toBeUndefined();
  });
});

describe('buildCrawledInventory', () => {
  it('crawls then maps to ExistingPage[] the pipeline consumes', async () => {
    const fx = routeFetch({
      'https://x.com/robots.txt': { status: 404 },
      'https://x.com/sitemap.xml': {
        contentType: 'application/xml',
        body: sitemapXml(['https://x.com/pricing']),
      },
      'https://x.com/pricing': htmlSpec({ title: 'CRM Pricing', h1: 'Plans' }),
    });
    const { inventory, limitations } = await buildCrawledInventory(fx, 'https://x.com');
    expect(inventory).toHaveLength(1);
    expect(inventory[0]?.url).toBe('https://x.com/pricing');
    expect(inventory[0]?.targetKeywords).toContain('CRM Pricing');
    expect(Array.isArray(limitations)).toBe(true);
  });

  it('a total crawl failure degrades to an empty inventory + limitation (never throws)', async () => {
    const fx = (async () => {
      throw new Error('boom');
    }) as FetchImpl;
    const { inventory, limitations } = await buildCrawledInventory(fx, 'https://x.com');
    expect(inventory).toEqual([]);
    expect(limitations.length).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ */
/* Local helper: build a RouteSpec from HTML-page options.             */
/* ------------------------------------------------------------------ */
function htmlSpec(opts: Parameters<typeof htmlPage>[0]): RouteSpec {
  return { contentType: 'text/html; charset=utf-8', body: htmlPage(opts) };
}
