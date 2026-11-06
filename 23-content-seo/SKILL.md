---
name: "content-seo"
description: "Comprehensive SEO, GEO (Generative Engine Optimization), and Content Architecture standard — brand extraction, anti-slop voice, per-page technical SEO, Schema.org JSON-LD, programmatic SEO (pSEO), llms.txt B2A indexing, IndexNow instant submission, Core Web Vitals (INP/LCP/CLS), and Information Gain E-E-A-T."
triggers:
  - "content"
  - "copy"
  - "seo"
  - "geo"
  - "brand"
  - "blog"
  - "sitemap"
  - "robots.txt"
  - "llms.txt"
  - "schema.org"
  - "json-ld"
  - "indexnow"
priority: 1
pack: "content"
stage: stable
---

# Content & Discoverability Prime Directive (SEO + GEO 2026)

Every delivered application and website must achieve dual-engine search dominance:
1. **Traditional Algorithmic SEO**: High-ranking SERP placement, technical crawler health, perfect Core Web Vitals, and keyword intent match.
2. **Generative Engine Optimization (GEO)**: Maximum citation share, entity grounding, and zero-click extraction in conversational LLMs (Perplexity, ChatGPT Search, Claude, Google AI Overviews, Gemini).

---

## 1. Brand Extraction & Visual Authenticity

- Extract the REAL brand (logo, colors, typography, voice tone; consult Wayback Machine if source is down). Never invent placeholder brand assets or colors.
- Color derivation: Brand primary derives directly from logo hue-distance analysis. Logo luminance + source theme dictates dark/light mode default.
- Container contrast: Every logo rendering must achieve ≥4.5:1 WCAG contrast against its backdrop. Exactly ONE logo asset per header container.

---

## 2. Anti-AI-Slop Voice (Mandatory Verification)

- **Banned Words**: delve, leverage, unleash, revolutionize, seamless, robust, synergy, elevate, empower, transformative, best-in-class, cutting-edge, discover, innovative, game-changer, tapestry, beacon, testament.
- **Banned Sentence Patterns**:
  - "Welcome to [Platform]..."
  - "In today's fast-paced digital world..."
  - "Discover how [Product] can elevate your..."
  - Vague aspirational headlines with zero concrete nouns.
  - Hedging predicates ("may help", "is designed to potentially").
- **Operator Litmus Test**: *"Would the technical founder or lead architect actually say this to a peer?"* If no → rewrite with active verbs and specific numbers.

---

## 3. Benefit-First High-Velocity Copywriting

- **Headings**: H1 benefit-first, specific, ≤8 words. Subheads 15–25 words explaining the mechanism.
- **Body Rhythm**: One core concept per paragraph. Active voice (>90%). Maximum sentence length 25 words. Flesch Reading Ease ≥60 (Microcopy ≥70).
- **Call-to-Action (CTA)**: Action-verb first, ≤3 words preferred (`Deploy Cluster`, `Start Free`, `Read Spec`). Never use "Click here", "Submit", or "Learn more". Place above the fold and at section terminals.
- **Microcopy**:
  - Errors: State `[What happened]` + `[Exact corrective action]`.
  - Empty states: Explain what will live here + render the primary creation action button.
  - Toasts: Past-tense for completed operations, present participle for background tasks.

---

## 4. Per-Page Technical SEO Architecture

Every public indexable page must satisfy the following checklist before build approval:

### Metadata & Head Elements
- **Title**: 50–60 characters. Format: `{Primary Keyphrase} — {Supporting Value} | {Brand}`. Primary keyphrase within the first 30 characters.
- **Meta Description**: 120–156 characters. Includes the primary keyphrase, a quantifiable benefit, and an action trigger.
- **Canonical URL**: Self-referential lowercase canonical tag (`<link rel="canonical" href="https://example.com/slug" />`). Strip tracking query parameters.
- **OpenGraph & Twitter Cards**:
  - `og:title`, `og:description`, `og:url`, `og:type` (`website` or `article`).
  - `og:image`: High-contrast 1200×630px image with OKLCH brand palette (#060610 background, #00E5FF accent).
  - `twitter:card`: `summary_large_image`.
- **Headings Structure**: Exactly ONE `<h1>` in prerendered HTML. Logical `<h2>` and `<h3>` nesting without skipped levels.

### Core Web Vitals (2026 Standards)
- **Interaction to Next Paint (INP)**: <200ms (strict threshold; eliminate main-thread blocking scripts).
- **Largest Contentful Paint (LCP)**: <2.0s on 4G mobile emulation. Preload hero images with `fetchpriority="high"`.
- **Cumulative Layout Shift (CLS)**: <0.05. Explicit `width` and `height` on all media and embeds.

---

## 5. Generative Engine Optimization (GEO) & AI Search

Optimizing for LLM retrieval-augmented generation (RAG) and direct citation:

```mermaid
flowchart LR
    A["Raw Page Content"] --> B["Self-Contained Answer Block<br/>(40-60 words under H2)"]
    A --> C["Structured Contrast Table<br/>(Data/Feature Grid)"]
    A --> D["JSON-LD Schema Entity Graph"]
    B --> E["RAG Vector / Citation Extraction"]
    C --> E
    D --> E
    E --> F["AI Search Answer<br/>(Perplexity / ChatGPT / Gemini)"]
```

1. **Standalone 40–60 Word Quotable Answer Blocks**: Place a direct, concise answer block immediately under major `<h2>` and `<h3>` question headings. LLMs favor complete, extractable definitions that require no surrounding context.
2. **Tabular Comparison Grids**: Render structured HTML tables with explicit column headers (`✓`, `✗`, numeric benchmarks, pricing tiers). AI models synthesize comparison tables over flowing prose.
3. **Information Gain & Proprietary Data**: Google Core Updates and LLM crawlers heavily reward original data, benchmarks, code samples, and firsthand measurements. Eliminate boilerplate paraphrasing.
4. **Author E-E-A-T Grounding**: Every technical guide or blog post must cite a verifiable author with `Person` JSON-LD schema, `sameAs` social profiles, and clear publication/update timestamps.
5. **Native HTML Disclosure Primitives**:
   - Render FAQ blocks using native `<details name="faq-group">` exclusive accordions (zero JS overhead, instantly accessible).
   - Use `hidden="until-found"` for collapsed content so in-page text remains search-indexed and Ctrl+F discoverable.

---

## 6. Type-Safe Schema.org JSON-LD Entities

Structured data removes all semantic ambiguity for both traditional search crawlers and AI agents.

- **Strict Entity Rule**: Only generate JSON-LD for entities that genuinely exist on the page. Never pad empty schemas.
- **Universal Baseline**:
  - `Organization`: Name, URL, Logo, SameAs links, ContactPoint.
  - `WebSite`: Name, URL, PotentialAction (`SearchAction` targeting `/search?q={search_term_string}`).
  - `WebPage`: Name, Description, BreadcrumbList, DatePublished, DateModified.
- **Domain-Specific Types**:
  - `FAQPage`: Strictly paired with visible on-page FAQs.
  - `TechArticle` / `BlogPosting`: Author (`Person`), Publisher (`Organization`), Headline, Image, DateModified.
  - `SoftwareApplication`: ApplicationCategory, OperatingSystem, Offers (`Price`, `PriceCurrency`).
  - `LocalBusiness`: Address (`PostalAddress`), GeoCoordinates, OpeningHoursSpecification, AreaServed.

---

## 7. Editorial Blog Posts & Multimedia Architecture (`@theme.tools/blog`)

Every editorial article, thought-leadership piece, and developer deep-dive must satisfy the Fleet Blog Post Doctrine:

1. **Semantic HTML5 Skeleton**:
   - Encapsulated in `<article class="tt-blog-article">` with max-width 768px.
   - Header containing category pill badge, benefit-first H1, author info, published `<time datetime="...">`, and estimated reading time.
   - Hero picture preloaded with `fetchpriority="high"` in an aspect-ratio bounding box (1200×630).
   - `.tt-lead-paragraph`: Standalone 30–70 word direct answer to search intent.
   - `<aside class="tt-callout tt-callout-key-takeaways">`: Executive summary bulleted grid.
   - `<nav class="tt-toc">`: Hierarchical Table of Contents with deep anchor links.
   - `<main class="tt-article-body">`: Structured body with tables, interactive code blocks, and media.
   - Native `<details name="blog-faq">` exclusive accordions for FAQs.
   - `<footer class="tt-citations-footer">`: Numbered primary source citations (`rel="noopener noreferrer" target="_blank"`).

2. **Zero Layout Shift (CLS = 0) Multimedia**:
   - **Responsive Pictures**: `<picture>` with AVIF + WebP sources, explicit `width`, `height`, and inline CSS `aspect-ratio` bounding box.
   - **Cloudflare Stream Video**: Responsive 16:9 wrapper paired with `VideoObject` Schema.org JSON-LD and collapsible transcript in `<details class="tt-video-transcript">`.
   - **Interactive Code Blocks**: Filename header, language badge, and accessible contrast on deep space canvas (`#060610`).

3. **Complete JSON-LD Schema (`BlogPosting` / `TechArticle`)**:
   - `headline`, `description`, `image`, `datePublished`, `dateModified`.
   - `author`: `Person` with `name`, `jobTitle`, `url`, and `sameAs` entity links.
   - `publisher`: `Organization` with `name` and `logo`.
   - `speakable`: CSS selectors for voice assistants (`.tt-lead-paragraph`, `.tt-key-takeaways`).
   - `citation`: Array of verifiable primary reference URLs.
   - `hasPart`: Video chapter Key Moments clips.

4. **Programmatic Validation**:
   Audit any article before publish:
   ```bash
   node ~/.agentskills/bin/blog-post-validator.ts --file path/to/article.html
   ```

---

## 8. Machine-Readable AI Manifests: `llms.txt` & `llms-full.txt`

In addition to human-facing pages, provide clean, token-efficient Markdown manifests for AI agents and coding tools:

- **`/llms.txt`**: Standardized Markdown table of contents at the domain root:
  ```markdown
  # Project / Company Name
  > One-sentence mission statement and technical summary.

  ## Core Documentation
  - [Architecture](/docs/architecture.md): System architecture and data flow.
  - [API Reference](/docs/api.md): Endpoints, authentication, and schemas.
  ```
- **`/llms-full.txt`**: Comprehensive single-file Markdown bundle aggregating all core technical documentation for single-fetch agent ingestion.

---

## 9. Automated Crawl Directives & Instant Indexing

### Robots.txt AI Policy
Explicitly declare permissions for legitimate AI search engines while maintaining control over training scrapers:
```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /private/

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://example.com/sitemap.xml
```

### Instant Search Indexing via IndexNow
- Expose the verification key at `/{INDEXNOW_KEY}.txt`.
- Trigger automated POST pings to `https://api.indexnow.org/indexnow` upon page publication or deployment.
- Sync with Cloudflare Crawler Hints to immediately notify Bing, Yandex, Naver, and Seznam.

---

## 10. Programmatic SEO (pSEO) at Scale

Scalable programmatic page generation (e.g. `{Integration} × {Use-Case}`, `{Service} in {City}`):
- **Unique Value Floor**: Every programmatic page must contain ≥800 unique words, customized data tables, ≥1 unique infographic/diagram, and localized/contextualized FAQs.
- **Canonical Discipline**: Prevent index bloat. Canonicalize duplicate parameter variations to root slugs.
- **Internal Linking Web**: Link parents to children, siblings to related siblings, and terminal pages back to primary hubs. Never leave orphan pages.

---

## 11. Automated Pre-Flight SEO & GEO Verification Gate

No website or web service may be deployed without passing the automated audit:
```bash
node ~/.agentskills/bin/seo-auditor.ts --url https://example.com
```
Must pass 100% of checks:
- Title (50–60 chars) & Meta Description (120–156 chars) present.
- Exactly one `<h1>` tag in static SSR HTML.
- Valid JSON-LD Schema without parse errors.
- Dynamic 1200×630 OG image returns HTTP 200.
- `robots.txt`, `sitemap.xml`, and `llms.txt` return HTTP 200.
- Zero broken internal `<a>` links.
- Image `alt` tags present on all informative images.
