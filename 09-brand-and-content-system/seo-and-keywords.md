---
name: "SEO and Keywords"
version: "1.2.0"
updated: "2026-04-23"
description: "Full SEO engine: keyword research, competitor analysis, per-page primary+longtail targeting, Yoast-level checks, schema markup, internal linking, pSEO at scale. Runs every build."
---

# SEO and Keywords

Every page targets a PRIMARY keyphrase chosen by relevance × search intent × organic ranking feasibility (not raw volume) + 1-2 supporting longtail phrases + semantic variations woven naturally. Volume is one signal among several — never the sole selector.

> Canonical research engine: the `keyword-researcher` agent (`agents/keyword-researcher.md`) + `npm run seo:research`. It produces deterministic, evidence-scored opportunities + content briefs from DataForSEO + Search Console + Google Trends + Exa. Require its evidence before SEO-targeted writing; don't hand-invent metrics.

## Keyword Research Workflow

### Step 1: Seed from Product

`Domain → category → features → user problems`. E.g. `"instantidle.com" → container deployment → "docker hosting" → "cheap docker hosting"`.

### Step 2: Expand with APIs

#### Google Autocomplete (FREE, no key)

```typescript
async function getAutocompleteSuggestions(seed: string): Promise<string[]> {
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(seed)}`;
  const [, suggestions] = await (await fetch(url)).json();
  return suggestions;
}
// Expand with alphabet modifiers: `${seed} a`, `${seed} b`, etc.
```

#### Other tools

- **DataForSEO** — volume, CPC (paid), ORGANIC difficulty, SERPs, trends. Cost varies by endpoint; read live account pricing + balance via `/v3/appendix/user_data` — never hardcode a per-keyword price. Enforce the $20/mo paid cap.
- **Google Search Console** (FREE) — real clicks, impressions, position (authorized properties only)
- **Google Trends** — relative interest over time (index ≠ absolute volume)
- **Exa** — competitor/source/topic evidence + differentiation (never a source of numeric volume/difficulty)

### Step 3: Competitor Analysis

1. Identify 3-5 competitors
2. Scrape `sitemap.xml` → fetch pages → extract title / h1 / meta
3. Find gaps (keywords they rank for that we don't) + easy wins (meaningful demand + low ORGANIC difficulty — distinct from paid/CPC competition)

### Step 4: Selection Matrix

Score candidates on relevance + intent + organic feasibility + demand — not volume alone. A highly relevant commercial term with modest volume beats an irrelevant high-volume term.

- **Primary** — best relevance × intent × feasibility fit for the page (often NOT the highest-volume term)
- **Longtail 1** — commercial intent, low ORGANIC difficulty
- **Longtail 2** — informational intent, blog / resource page

Paid competition (CPC / Ads) is a business signal — kept SEPARATE from organic keyword difficulty.

## Per-Page Yoast Checklist (ALL GREEN)

- **Title** — 50-60 chars, keyword at start, unique, includes brand. Format: `{Keyword} — {Supporting} | Brand`
- **Meta description** — 120-156 chars, contains keyword, includes CTA, unique per page
- **URL** — short, readable, keyword-rich, lowercase, hyphens. Good: `/docker-hosting`
- **Headings** — one H1 with keyword; H2s with longtail/semantic variations; logical hierarchy; no skipped levels
- **Content** — keyphrase in the first 100 words; use it naturally wherever it reads well (NO mandatory density target — just avoid stuffing); min 300 words (600+ preferred); Flesch ≥60; short paragraphs (2-4 sentences); subheadings every 200-300 words; transition words ≥30% of sentences
- **Images** — alt text with keyword (natural); descriptive filename; width/height set; lazy load below-fold; WebP <200KB
- **Internal links** — 2-3+ per page, descriptive anchors
- **External links** — 1-2 outbound to authoritative sources, `target="_blank" rel="noopener"`
- **Schema / JSON-LD** — only types that are ACCURATE for the page (no arbitrary count, never padded). Typically Organization + WebSite + WebPage + one domain-specific type when it genuinely applies (Product, BreadcrumbList, Article, HowTo, SoftwareApplication, DonateAction). FAQPage ONLY with real on-page FAQs
- **Technical** — canonical URL, mobile-friendly, LCP <2.5s, HTTPS, no duplicate content, XML sitemap, robots.txt

## Readability Enforcement (Flesch ≥60)

### Yoast 9 Checks (All Automatable)

- Flesch ≥60 | Sentence length avg ≤20 words | Paragraph length ≤150 words
- Passive voice <10% | Transition words ≥30% of sentences | Consecutive sentences <3 with same opening word
- Subheading distribution ≤300 words between H2/H3 | Text present | Exactly 1 H1

### By Section

Hero 80+ | Body 50-65 | Technical docs 40-50 | Legal 50+ | Errors 70+ | CTAs 80+

## Programmatic SEO (Database-Backed & Quality-Gated)

Legacy city/variable swaps without localized data are banned under Google's Scaled Content Abuse policy. Modern pSEO must be anchored by proprietary, structured database attributes and pass the 7 Programmatic Quality Gates (`rules/programmatic-seo-doctrine.md`):

```typescript
// Data-backed pSEO: requires >=4 proprietary attributes per page + utility tools
interface EngineComparisonRecord {
  pair: string;
  measuredLatencyP99: number;
  throughputCap: number;
  memoryFootprintMb: number;
  failoverSupport: boolean;
  benchmarkLogUrl: string;
}
// Every programmatic template must verify >=35% Information Gain and schema parity
```

### Internal Linking Strategy

- Homepage → category pages → product pages | Blog → relevant products + related posts
- Every page: 2-3 internal links min; anchor text = keyphrase variations, never "click here"
- Orphan detection after build

## SEO Audit (Every Deploy)

Playwright test verifying: title 30-60 chars · meta desc 120-160 chars · exactly 1 H1 · canonical URL · OG tags · JSON-LD ≥1 · no Lorem/TODO/placeholder · images have alt · internal links ≥3 · `robots.txt` 200 · `sitemap.xml` 200

## Research Stack (canonical)

The active keyword-research stack is **DataForSEO + Google Search Console + Google Trends + Exa**, orchestrated by the `keyword-researcher` agent (`agents/keyword-researcher.md`) / `npm run seo:research`. Do NOT introduce Ahrefs, Semrush, Serper, VebAPI, Keywords Everywhere, or Tavily as keyword/SERP sources.

- **DataForSEO v3** — primary: discovery, volume, organic difficulty, CPC/paid competition (separate), SERPs, Trends. Cost is per-endpoint; read live pricing/balance, enforce the $20/mo paid cap, cache by freshness.
- **Google Search Console** — free, first-party clicks/impressions/CTR/position (authorized properties only; missing rows ≠ zero).
- **Google Trends** — relative interest (official API if authorized, else via DataForSEO). Index ≠ volume; never compare independently-normalized series.
- **Exa** — competitor/source/topic evidence + differentiation (never a source of numeric volume/difficulty).
- **Google Autocomplete** — free seed expansion (see Step 2).

## Google's SEO Rules (2026 Core Update)

- Original research/proprietary data rewarded (Information Gain signal)
- Write naturally, no stuffing
- LCP <2.5s is a hard ranking factor
- AI Overviews steal short-tail clicks — longtail more important than ever
- Meta keywords tag ignored

## Longtail Strategy (Moz 2026)

- Ultra-long-tail is "new normal"; short-tail triggers AI Overviews
- Modifier stacking: `[product] + [use case] + [audience] + [qualifier]`
- Problem-first keywords beat feature keywords
- GSC: impressions >10 but position >10 = low-hanging fruit

## MANDATORY: Research BEFORE Writing

1. Identify 5-10 candidate keyphrases
2. Evaluate — volume, difficulty, intent, relevance
3. Select PRIMARY (1-4 words, unique to page)
4. Select 2-3 RELATED keyphrases
5. Map keyword → page URL (no duplicates)
6. Write content optimized from first sentence

## Keyword-to-Page Map

```typescript
const keywordMap = {
  '/': { primary: 'main keyword', related: ['variation 1', 'variation 2'] },
  '/pricing': { primary: 'pricing keyword', related: [...] },
};
// No two pages share same primary keyphrase
```

## Rich Snippets

Every page — Organization + WebSite(SearchAction) + WebPage + domain-specific schema. OpenSearch XML at `/opensearch.xml`. Validate with Google Rich Results Test.

## Ownership

- **Owns:** keyword research, competitor analysis, per-page targeting, Yoast checks, readability, programmatic SEO, audit automation, internal linking, schema/JSON-LD, OG/Twitter tags, sitemap, robots.txt, keyword-to-page mapping
- **Never owns:** content writing (→09, 22), visual design (→10), deployment (→08)
