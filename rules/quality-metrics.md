---
last_reviewed: 2026-10-04
superseded_by: null
name: "quality-metrics"
priority: 2
pack: "testing"
triggers:
  - "lighthouse"
  - "perf"
  - "quality"
---

# Quality Thresholds

## Readability

- Flesch ≥ 60
- Sentences ≤ 25 words
- Paragraphs ≤ 150 words

## Performance

- **Core Web Vitals — house cinematic targets per `_kernel/standards.md#cwv`** (LCP ≤2.0s · CLS ≤0.05 · INP ≤100ms; INP >200ms = fail). Phase-debug: LCP 4-phase (TTFB→load-delay→load-time→render-delay), INP 3-phase (input-delay→processing→presentation).
- Worker CPU ≤ 50ms p99 as OUR budget (plan limits: free 10ms CPU; paid default 30s CPU, config to 5 min; wall unlimited while connected)
- Debug INP via **Long Animation Frames API** (`PerformanceObserver` type:`long-animation-frame`, web-vitals v6 — `longAnimationFrameEntries` since v4)
- SPA per-route CWV: **Soft Navigations API** (`softNavs:true`, web-vitals v6 — since v4)

## Budgets

- JS ≤ 200KB gz total/route; no single chunk > 250KB gz (code-split React.lazy + manualChunks)
- CSS ≤ 50KB gz
- Fonts ≤ 100KB woff2 preload + unicode-range subset
- Images: use-based, not per-image cap (icons 5–50KB · cards 40–120KB · content 80–250KB · hero 250–500KB · fullscreen 400–900KB when justified). Page budget: <1MB above-fold, <2MB total.
- Photos → **AVIF primary** (20-30% smaller than WebP, 94% browser support (94.9%, caniuse Mar 2026)) + WebP fallback + JPEG legacy; SVG for logos/icons. Responsive `srcset` 320/640/960/1280/1920w.
- Drop JPEG XL (10% support)
- og-image 1200×630 ≤ 100KB BRANDED CARD (not raw photo)
- apple-touch-icon 180×180 mandatory
- WebSocket payload up to 32 MiB (CF Workers + DOs, 2025-10-25)
- JSRPC payload up to 32 MiB

## A11y

- axe-core 0 violations — **axe 0 ≠ AA conformance** (auto-tests only 2.5.8 of 9 new WCAG 2.2 SC, ~57% of issues by volume). Green axe is necessary, never sufficient.
- Lighthouse ≥ 95
- Contrast ≥ 4.5:1
- Target size ≥ 24px (WCAG 2.2 2.5.8 — the one criterion axe auto-tests)
- Focus Not Obscured (2.4.11, AA) — focused element never hidden behind sticky headers/footers
- **Manual review REQUIRED** — the 8 WCAG 2.2 criteria axe can't auto-test (per `_kernel/standards.md#wcag22`). Run that checklist every a11y pass.

## Best Practices (Lighthouse)

- **A sudden BP drop (e.g. 100→81) with a single `deprecations` failure is usually NOT your code — it's the CDN's injected bot script.** Cloudflare Bot Fight Mode / JS Detections injects `cdn-cgi/challenge-platform/scripts/jsd/main.js`, which uses deprecated APIs (`StorageType.persistent`, Protected Audience). Always check the failed audit's source URL before touching your code. For **agent-facing** sites (built to be read by AI agents/crawlers), disable Bot Fight Mode / JS Detections regardless — bot-challenge tooling contradicts the agent-welcoming goal AND its deprecated-API script tanks BP. Ref: agent.megabyte.space 2026-10-06. Cross-links `[[verify-against-source-of-truth]]`.

## Code

- Functions ≤ 50 lines
- Cyclomatic ≤ 10
- Params ≤ 3

## Security

### Required headers

- HSTS
- CSP Level 3 (strict-dynamic + per-response random nonce, never reused)
- Trusted Types (DOM-XSS prevention)
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- COOP
- COEP
- CORP

### Remove

- X-XSS-Protection
- Expect-CT
- HPKP

### Cookies + integrity

- **CHIPS** — set `Partitioned` on any cross-site cookie (OAuth iframe, embedded widget) or the session silently breaks under third-party-cookie partitioning. Safari ignores the attribute but partitions independently; Firefox partitions via Total Cookie Protection — test all three.
- **SRI** — `integrity` (SHA-384) + `crossorigin="anonymous"` on every externally-hosted `<script>`/`<link rel="stylesheet">`; pair with CSP `require-sri-for script style`. Not applied to dynamically-injected scripts — guard those separately.
- **CSP reporting** — emit BOTH `report-to` AND `report-uri` until report-to has universal support; Trusted Types is Chromium-full / Firefox+Safari-partial.

## SEO strict

- Title 50-60 chars HARD
- Meta desc 120-156 chars HARD
- Keyphrase 0.5-3%
- JSON-LD per page per `_kernel/standards.md#jsonld` (WebPage floor; add Organization/BreadcrumbList/FAQPage/Person/Product/Service only for real on-page entities; FAQPage only for real Q&A — never pad)
- Exactly 1 H1 in HTML shell (prerender, NOT script-injected)
- Every internal asset ref resolves to real file in build output
- `sitemap.xml` every `<url>` has `<lastmod>`
- Canonical uses custom hostname when `primary_hostname` set
- `color-scheme` meta present
- JSON-LD claims must match visible content (don't lie via schema)
- Person + `sameAs` on author pages when there's a real author bio
- BreadcrumbList on multi-level routes (≥2 segments deep)

## Animation

- transform/opacity only
- `prefers-reduced-motion` on all
- `will-change` sparingly
- Scroll-driven off main thread (Chrome stable, Safari 26+, Firefox unsupported — pair with `prefers-reduced-motion` AND `animation-duration:1ms` Firefox fallback)

## CSS

- Cascade layers (`@layer reset, base, components, utilities`)
- Container queries for components (Baseline Widely Available 2025)
- `:has()` for parent selection (Baseline Newly Available)
- Native nesting
- View Transitions (same-document SPA / cross-document MPA both `@view-transition { navigation: auto; }`)
- Anchor Positioning (Chrome/Edge 133+ stable, Firefox late 2025, polyfill v0.7+ for Safari)
- Popover API (Baseline Newly Available)
