/**
 * Site-inventory crawler — the no-credentials "polish" signal for the
 * keyword-research control plane.
 *
 * Given an origin, it discovers the URLs a site already publishes and extracts a
 * tiny, honest fingerprint of each page (title / first h1 / meta description /
 * h2+h3 headings). That inventory feeds the improve-vs-create decision in
 * `matchExistingPage` so recommendations degrade HONESTLY (an empty inventory
 * means "we couldn't see the site", never a fabricated page).
 *
 * Doctrine baked in — mirrors the rest of the service:
 *  - DEPENDENCY-INJECTED FETCH. `fetchImpl` is passed in; nothing here reaches
 *    for the global. Tests pass a route-aware mock and make ZERO network calls.
 *  - ZERO NEW DEPENDENCIES. HTML + sitemap XML are parsed with regex, not a DOM
 *    library. Extraction is forgiving: a missing tag ⇒ `null` / `[]`, never a
 *    guess.
 *  - GRACEFUL DEGRADATION, NEVER FABRICATION. Discovery tries three strategies in
 *    order — robots.txt sitemaps → sitemap.xml (+ bounded index recursion) →
 *    same-origin homepage BFS. Each failure falls through to the next; the final
 *    fallback is "the pages we actually saw" (maybe just the homepage) or an
 *    EMPTY list plus a limitation note. We never invent a URL.
 *  - BOUNDED. `maxPages` caps the crawl, a per-request timeout caps each fetch,
 *    and `concurrency` caps parallelism so a big site can't run away.
 *  - ROBOTS-AWARE. `Disallow` rules from robots.txt are respected: a disallowed
 *    path is skipped (and the skip is counted, not fabricated around).
 */
import type { FetchImpl } from './adapters/http';
import { PageRecord } from './types';
import type { PageRecord as PageRecordT } from './types';

export type { PageRecordT as PageRecord };

/* ------------------------------------------------------------------ */
/* Options + result.                                                   */
/* ------------------------------------------------------------------ */

export interface CrawlOptions {
  /** Injected transport (defaults to `globalThis.fetch`). Mock it in tests. */
  fetchImpl?: FetchImpl;
  /** The site origin, e.g. "https://example.com". Trailing slash tolerated. */
  origin: string;
  /** Hard cap on how many pages we fetch + record. Default 50. */
  maxPages?: number;
  /** How many page fetches run in parallel. Default 4. */
  concurrency?: number;
  /** Per-request timeout in ms. Default 10_000. 0 disables the timeout. */
  timeoutMs?: number;
}

export interface CrawlResult {
  /** The pages we actually observed (schema-valid, deduped, normalized). */
  pages: PageRecordT[];
  /** Human-readable notes about anything we COULDN'T do (for the report). */
  limitations: string[];
}

const DEFAULT_MAX_PAGES = 50;
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_TIMEOUT_MS = 10_000;

/* ------------------------------------------------------------------ */
/* URL normalization + same-origin helpers (pure, exported for tests). */
/* ------------------------------------------------------------------ */

/**
 * Normalize a URL for dedup: drop the fragment, strip a trailing slash from the
 * path (except the bare root), and lower-case the host. Query strings are KEPT
 * (they often select distinct content). Returns `null` when the input isn't a
 * parseable absolute http(s) URL.
 */
export function normalizeUrl(raw: string, base?: string): string | null {
  let u: URL;
  try {
    u = base ? new URL(raw, base) : new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  u.hash = '';
  u.hostname = u.hostname.toLowerCase();
  // Strip a single trailing slash on non-root paths so "/a/" === "/a".
  if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
    u.pathname = u.pathname.replace(/\/+$/, '');
  }
  return u.toString();
}

/** Same scheme-less host? (origin compare, ignoring protocol + port-less hosts). */
export function sameOrigin(url: string, originUrl: URL): boolean {
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase() === originUrl.hostname.toLowerCase();
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* robots.txt.                                                         */
/* ------------------------------------------------------------------ */

export interface RobotsInfo {
  /** Absolute sitemap URLs from `Sitemap:` directives, in file order. */
  sitemaps: string[];
  /**
   * `Disallow` path prefixes that apply to us. We honor the broadest possible
   * set: any rule under `User-agent: *` plus any global rule outside a group.
   * Empty-value `Disallow:` (which means "allow all") is ignored.
   */
  disallow: string[];
}

/**
 * Parse robots.txt text. Deliberately simple + forgiving (robots.txt is a loose
 * format): we collect every `Sitemap:` line, and every `Disallow:` path that
 * belongs to a `User-agent: *` group (the rules that apply to a generic crawler
 * like us). Unknown directives are ignored.
 */
export function parseRobots(text: string): RobotsInfo {
  const sitemaps: string[] = [];
  const disallow: string[] = [];
  // Track whether the CURRENT group targets "*" (or no group yet → treat global
  // Disallow lines as applying to everyone, which is the conservative read).
  let appliesToUs = true;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (line === '') continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (field === 'sitemap') {
      if (value) sitemaps.push(value);
    } else if (field === 'user-agent') {
      appliesToUs = value === '*';
    } else if (field === 'disallow') {
      if (appliesToUs && value !== '') disallow.push(value);
    }
  }
  return { sitemaps, disallow };
}

/** Is this URL's path blocked by any `Disallow` prefix? */
export function isDisallowed(url: string, disallow: readonly string[]): boolean {
  if (disallow.length === 0) return false;
  let path: string;
  try {
    const u = new URL(url);
    path = u.pathname + u.search;
  } catch {
    return false;
  }
  return disallow.some((rule) => rule.length > 0 && path.startsWith(rule));
}

/* ------------------------------------------------------------------ */
/* sitemap XML (regex-parsed; handles both urlset + sitemapindex).     */
/* ------------------------------------------------------------------ */

/** Extract the text of every `<loc>…</loc>` element (urlset OR sitemapindex). */
export function extractSitemapLocs(xml: string): string[] {
  const locs: string[] = [];
  const re = /<loc>\s*([\s\S]*?)\s*<\/loc>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const raw = decodeEntities((m[1] ?? '').trim());
    if (raw) locs.push(raw);
  }
  return locs;
}

/** True when the document is a sitemap INDEX (points at child sitemaps). */
export function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex[\s>]/i.test(xml);
}

/* ------------------------------------------------------------------ */
/* HTML extraction (regex, dependency-free).                           */
/* ------------------------------------------------------------------ */

/** Decode the handful of XML/HTML entities we actually meet in these fields. */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/gi, ' ');
}

/** Strip inline tags, collapse whitespace, decode entities → clean text. */
function cleanText(inner: string): string {
  return decodeEntities(inner.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/** First match of a tag's inner text, cleaned; `null` when absent/empty. */
function firstTagText(html: string, tag: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(html);
  if (!m) return null;
  const text = cleanText(m[1] ?? '');
  return text === '' ? null : text;
}

/** Every match of a tag's inner text, cleaned; empties dropped. */
function allTagText(html: string, tag: string): string[] {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const text = cleanText(m[1] ?? '');
    if (text !== '') out.push(text);
  }
  return out;
}

/** `<meta name="description" content="…">` (attribute order-agnostic). */
export function extractMetaDescription(html: string): string | null {
  // Find every <meta ...> tag, then pick the one whose name/property is a
  // description. Attribute order varies, so we inspect the tag's attributes.
  const metaRe = /<meta\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(html)) !== null) {
    const tag = m[0];
    const name = /\b(?:name|property)\s*=\s*["']\s*([^"']+?)\s*["']/i.exec(tag)?.[1]?.toLowerCase();
    if (name !== 'description' && name !== 'og:description') continue;
    const content = /\bcontent\s*=\s*["']([\s\S]*?)["']/i.exec(tag)?.[1];
    if (content === undefined) continue;
    const text = cleanText(content);
    if (text !== '') return text;
  }
  return null;
}

/** Links from `<a href="…">` for same-origin BFS. */
export function extractLinks(html: string): string[] {
  const re = /<a\b[^>]*\bhref\s*=\s*["']([^"'#][^"']*)["']/gi;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = (m[1] ?? '').trim();
    if (href) out.push(decodeEntities(href));
  }
  return out;
}

/**
 * Extract a {@link PageRecord} from a page's HTML. Pure + total: anything the
 * page didn't carry comes back `null`/`[]`, never invented. `url` MUST already
 * be normalized by the caller.
 */
export function extractPageRecord(url: string, html: string): PageRecordT {
  // `<title>` lives in <head>; grab the first one on the page.
  const title = firstTagText(html, 'title');
  const h1 = firstTagText(html, 'h1');
  const metaDescription = extractMetaDescription(html);
  const headings = [...allTagText(html, 'h2'), ...allTagText(html, 'h3')];
  return PageRecord.parse({ url, title, h1, metaDescription, headings });
}

/* ------------------------------------------------------------------ */
/* Low-level fetch helpers (text, with timeout + error tolerance).     */
/* ------------------------------------------------------------------ */

interface TextFetch {
  /** `null` when the request failed, timed out, or returned a non-2xx. */
  body: string | null;
  contentType: string | null;
}

/**
 * Fetch a URL's body as text, tolerating every failure (returns `body: null`
 * instead of throwing). An AbortController enforces the per-request timeout; a
 * 0 timeout disables it.
 */
async function fetchText(
  fetchImpl: FetchImpl,
  url: string,
  timeoutMs: number,
): Promise<TextFetch> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer =
    controller && timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetchImpl(url, controller ? { signal: controller.signal } : {});
    if (!res.ok) return { body: null, contentType: null };
    const contentType = typeof res.headers?.get === 'function' ? res.headers.get('content-type') : null;
    const body = await res.text();
    return { body, contentType };
  } catch {
    return { body: null, contentType: null };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Looks like HTML? (content-type says so, or the body sniffs as markup). */
function looksLikeHtml(body: string, contentType: string | null): boolean {
  if (contentType && /\b(?:text\/html|application\/xhtml\+xml)\b/i.test(contentType)) return true;
  if (contentType && /\b(?:json|xml|pdf|image\/|text\/css|javascript)\b/i.test(contentType)) {
    return false;
  }
  // No/ambiguous content-type → sniff the first chunk.
  return /<(?:!doctype\s+html|html|head|body|title|h1)\b/i.test(body.slice(0, 2000));
}

/* ------------------------------------------------------------------ */
/* Bounded-concurrency map.                                            */
/* ------------------------------------------------------------------ */

/** Run `worker` over `items` with at most `limit` in flight; preserves nothing. */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  const runners: Promise<void>[] = [];
  const width = Math.max(1, Math.min(limit, items.length));
  for (let i = 0; i < width; i++) {
    runners.push(
      (async () => {
        for (;;) {
          const idx = next++;
          if (idx >= items.length) return;
          const item = items[idx];
          if (item === undefined) return;
          results.push(await worker(item));
        }
      })(),
    );
  }
  await Promise.all(runners);
  return results;
}

/* ------------------------------------------------------------------ */
/* Sitemap discovery (with bounded index recursion).                   */
/* ------------------------------------------------------------------ */

const MAX_SITEMAP_DOCS = 20; // guardrail: never follow an unbounded index.

/**
 * Collect page URLs from one or more sitemap URLs, recursing through sitemap
 * INDEX documents (bounded by {@link MAX_SITEMAP_DOCS}). Returns the flat list of
 * leaf page URLs (NOT yet normalized/filtered). Failures are swallowed — a
 * sitemap that 404s or isn't XML simply contributes nothing.
 */
async function collectFromSitemaps(
  fetchImpl: FetchImpl,
  seedSitemaps: readonly string[],
  timeoutMs: number,
  limitations: string[],
): Promise<string[]> {
  const pageUrls: string[] = [];
  const queue = [...seedSitemaps];
  const visited = new Set<string>();
  let docsFetched = 0;

  while (queue.length > 0) {
    if (docsFetched >= MAX_SITEMAP_DOCS) {
      limitations.push(
        `Sitemap crawl stopped after ${MAX_SITEMAP_DOCS} sitemap documents (index was large); page discovery may be partial.`,
      );
      break;
    }
    const sm = queue.shift()!;
    if (visited.has(sm)) continue;
    visited.add(sm);
    docsFetched++;

    const { body } = await fetchText(fetchImpl, sm, timeoutMs);
    if (body === null) continue;
    const locs = extractSitemapLocs(body);
    if (locs.length === 0) continue;
    if (isSitemapIndex(body)) {
      // Child sitemaps → enqueue (bounded by the doc cap + visited set).
      for (const loc of locs) queue.push(loc);
    } else {
      for (const loc of locs) pageUrls.push(loc);
    }
  }
  return pageUrls;
}

/* ------------------------------------------------------------------ */
/* Homepage BFS fallback (same-origin, bounded).                       */
/* ------------------------------------------------------------------ */

/**
 * Breadth-first crawl from the homepage, following same-origin `<a href>` links
 * only, until we've RECORDED `maxPages` pages. Returns the recorded pages. Used
 * only when sitemap discovery yielded nothing (or too little).
 */
async function bfsFromHomepage(
  fetchImpl: FetchImpl,
  originUrl: URL,
  startUrl: string,
  maxPages: number,
  concurrency: number,
  timeoutMs: number,
  disallow: readonly string[],
  alreadySeen: ReadonlySet<string>,
): Promise<PageRecordT[]> {
  const records: PageRecordT[] = [];
  const seen = new Set<string>(alreadySeen);
  let frontier: string[] = [startUrl].filter((u) => !seen.has(u));
  for (const u of frontier) seen.add(u);

  while (frontier.length > 0 && records.length < maxPages) {
    const remaining = maxPages - records.length;
    const batch = frontier.slice(0, remaining);
    frontier = frontier.slice(remaining);

    const fetched = await mapWithConcurrency(batch, concurrency, async (url) => {
      const { body, contentType } = await fetchText(fetchImpl, url, timeoutMs);
      return { url, body, contentType };
    });

    for (const { url, body, contentType } of fetched) {
      if (body === null) continue;
      if (!looksLikeHtml(body, contentType)) continue;
      records.push(extractPageRecord(url, body));
      // Enqueue new same-origin links for the next wave.
      for (const href of extractLinks(body)) {
        const norm = normalizeUrl(href, url);
        if (!norm) continue;
        if (!sameOrigin(norm, originUrl)) continue;
        if (isDisallowed(norm, disallow)) continue;
        if (seen.has(norm)) continue;
        seen.add(norm);
        frontier.push(norm);
      }
    }
  }
  return records;
}

/* ------------------------------------------------------------------ */
/* The orchestrator.                                                   */
/* ------------------------------------------------------------------ */

/**
 * Crawl a site's inventory. See the module header for the contract + doctrine.
 *
 * Strategy order (each falls through to the next on failure/emptiness):
 *  1. GET {origin}/robots.txt → `Sitemap:` directives + `Disallow` rules.
 *  2. GET sitemap.xml (+ any robots sitemaps), recursing sitemap-index docs.
 *  3. Same-origin homepage BFS, bounded by `maxPages`.
 *
 * Always returns — a total crash of every strategy yields `{ pages: [],
 * limitations: [...] }`, never a throw and never an invented page.
 */
export async function crawlSiteInventory(opts: CrawlOptions): Promise<CrawlResult> {
  const fetchImpl: FetchImpl =
    opts.fetchImpl ?? ((input: string, init?: RequestInit) => fetch(input, init));
  const maxPages = opts.maxPages ?? DEFAULT_MAX_PAGES;
  const concurrency = opts.concurrency ?? DEFAULT_CONCURRENCY;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const limitations: string[] = [];

  // Resolve the origin. An unparseable origin is a hard stop (nothing to crawl),
  // but still returns gracefully.
  let originUrl: URL;
  try {
    originUrl = new URL(opts.origin);
  } catch {
    return {
      pages: [],
      limitations: [`Could not parse origin "${opts.origin}"; no site inventory was crawled.`],
    };
  }
  const base = `${originUrl.protocol}//${originUrl.host}`;

  // --- Strategy 1: robots.txt (sitemaps + disallow rules). ---
  let robots: RobotsInfo = { sitemaps: [], disallow: [] };
  const robotsRes = await fetchText(fetchImpl, `${base}/robots.txt`, timeoutMs);
  if (robotsRes.body !== null) {
    robots = parseRobots(robotsRes.body);
  } else {
    limitations.push('robots.txt was unavailable; proceeding without crawl directives.');
  }

  // --- Strategy 2: sitemaps (robots-declared + the conventional default). ---
  const sitemapSeeds = Array.from(
    new Set([...robots.sitemaps, `${base}/sitemap.xml`].filter(Boolean)),
  );
  const rawSitemapUrls = await collectFromSitemaps(fetchImpl, sitemapSeeds, timeoutMs, limitations);

  // Normalize + same-origin filter + robots-respect + dedup the sitemap URLs.
  const discovered: string[] = [];
  const seen = new Set<string>();
  let droppedCrossOrigin = 0;
  let droppedDisallowed = 0;
  for (const raw of rawSitemapUrls) {
    const norm = normalizeUrl(raw, base);
    if (!norm) continue;
    if (!sameOrigin(norm, originUrl)) {
      droppedCrossOrigin++;
      continue;
    }
    if (isDisallowed(norm, robots.disallow)) {
      droppedDisallowed++;
      continue;
    }
    if (seen.has(norm)) continue;
    seen.add(norm);
    discovered.push(norm);
  }
  if (droppedCrossOrigin > 0) {
    limitations.push(`${droppedCrossOrigin} sitemap URL(s) pointed off-origin and were skipped.`);
  }
  if (droppedDisallowed > 0) {
    limitations.push(`${droppedDisallowed} sitemap URL(s) were disallowed by robots.txt and were skipped.`);
  }

  let pages: PageRecordT[] = [];

  if (discovered.length > 0) {
    // Cap BEFORE fetching so we never over-fetch a huge sitemap.
    const capped = discovered.slice(0, maxPages);
    if (discovered.length > maxPages) {
      limitations.push(
        `Sitemap listed ${discovered.length} URLs; capped the crawl at maxPages=${maxPages}.`,
      );
    }
    const fetched = await mapWithConcurrency(capped, concurrency, async (url) => {
      const { body, contentType } = await fetchText(fetchImpl, url, timeoutMs);
      return { url, body, contentType };
    });
    let skippedNonHtml = 0;
    for (const { url, body, contentType } of fetched) {
      if (body === null) {
        skippedNonHtml++;
        continue;
      }
      if (!looksLikeHtml(body, contentType)) {
        skippedNonHtml++;
        continue;
      }
      pages.push(extractPageRecord(url, body));
    }
    if (skippedNonHtml > 0) {
      limitations.push(`${skippedNonHtml} sitemap URL(s) were unreachable or non-HTML and were skipped.`);
    }
  }

  // --- Strategy 3: homepage BFS fallback (only when sitemaps gave nothing). ---
  if (pages.length === 0) {
    if (discovered.length === 0) {
      limitations.push('No sitemap was found; falling back to a same-origin homepage crawl.');
    }
    const homepage = normalizeUrl(base);
    if (homepage && !isDisallowed(homepage, robots.disallow)) {
      pages = await bfsFromHomepage(
        fetchImpl,
        originUrl,
        homepage,
        maxPages,
        concurrency,
        timeoutMs,
        robots.disallow,
        new Set(),
      );
    } else if (homepage) {
      limitations.push('The homepage itself is disallowed by robots.txt; no pages could be crawled.');
    }
  }

  // Final dedup by normalized URL (BFS + sitemap can't collide, but be safe).
  const byUrl = new Map<string, PageRecordT>();
  for (const p of pages) if (!byUrl.has(p.url)) byUrl.set(p.url, p);
  const deduped = Array.from(byUrl.values());

  if (deduped.length === 0) {
    limitations.push(
      'Site inventory came back empty: no pages could be discovered or fetched. Existing-page matching will treat every keyword as a content gap (no pages fabricated).',
    );
  }

  return { pages: deduped, limitations };
}
