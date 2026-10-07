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
- **In CI E2E, guard CLS (deterministic) but NOT LCP/INP (timing-dependent → flaky); measure LCP/INP out-of-band.** CLS is layout-stability (not network/CPU-dependent), so a `CLS < 0.05` assertion is stable across runners + catches the real regressions (an `<img>` without width/height, late above-the-fold content, a font swap that reflows). An `LCP < 2s` / `INP` assertion flakes on a slow runner — measure those in a one-off perf script. Measure CLS via `new PerformanceObserver({type:'layout-shift', buffered:true})` set up in `addInitScript` BEFORE navigation, then SCROLL the full page to trigger reveals (`getEntriesByType('largest-contentful-paint'|'layout-shift')` queried late misses buffered entries → returns null/0). Ref: agent.megabyte.space 2026-10-07 — prod LCP 648ms (hero H1), CLS 0.003; shipped a CLS-only CI guard, measured LCP/INP out-of-band.
- SPA per-route CWV: **Soft Navigations API** (`softNavs:true`, web-vitals v6 — since v4)
- **Static-asset caching on CF Workers (`_headers`): cache-busted files need an EXPLICIT `immutable` rule, and a hardcoded preload `?v=` rots.** (1) Each `?v=`-busted file (`styles.css`, `app.js`) needs its OWN `/path` → `Cache-Control: public, max-age=31536000, immutable` line — the ASSETS default is `max-age=0, must-revalidate`, so a MISSING rule silently re-validates it every visit (add the rule when you externalize a file — `app.js` was re-validated for weeks because only `styles.css` had one). Icons/manifest/sitemap get a moderate `max-age` (604800 / 86400). (2) A `Link: </styles.css?v=X>; rel=preload` with a hardcoded `X` DRIFTS the moment you bump the CSS `?v=` → the browser preloads the WRONG url (double-fetch, zero benefit). DERIVE the preload `?v=` from the HTML at build (same hardcoded-value-rot class as the sitemap lastmod — `[[verify-against-source-of-truth]]`). (3) **CF Early Hints caches the `Link` header SEPARATELY** — after a `_headers` change the OLD preload lingers as a 2nd `Link` from the Early-Hints cache until a few requests re-cache it; verify with REPEATED fetches, not one. E2E-guard: cache-busted asset is `immutable`, icons are cached, and every preload `?v=` equals the served CSS version. Ref: agent.megabyte.space 2026-10-07.

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
  - **Actually RUN axe in the E2E (`@axe-core/playwright`, across viewports) — "Lighthouse a11y 100" + visual review MISS real contrast failures.** Lighthouse samples; a full axe pass over the real DOM finds them all. Ref: agent.megabyte.space 2026-10-07 — a site long claimed "Lighthouse a11y 100" had **82 serious color-contrast violations** the moment axe was wired in. Two pitfalls dominated (watch for both): **(1) opacity-dimming meaningful text** — de-emphasizing a label/tile with `opacity: 0.4–0.6` silently drops its contrast below 4.5:1 (axe computes the *blended* color). De-emphasize with a muted-but-readable COLOR (a `--text-dim` that's ≥4.5:1 at full opacity) + other cues (border, glow, weight), NEVER opacity that makes text unreadable. **(2) a dark BRAND color used as text on a dark theme** — brand accents picked for logos/fills (e.g. `--purple: #7C3AED` = 2.9:1 on dark) are usually too dark for text; define a lighter tint token (`--purple-light: #a78bfa`, ~6:1) for text-on-dark and use it for every text/badge/tag use, keeping the dark brand value for backgrounds/borders. Both pass visual review (they "look dim/on-brand") yet fail AA. Fixing them often IMPROVES UX (the dimmed content becomes readable). **Run axe across STATES, not just the default view** — open every accordion/`<details>`/overlay + the mobile menu, and audit the 404 and other served pages; collapsed-by-default + overlay content hides its own violations from a one-shot homepage scan (same reason overflow checks must open expanded states — `[[e2e-testing]]`). Cross-links `[[text-contrast]]`, `[[verify-against-source-of-truth]]`.
  - **`.withTags(['wcag2a','wcag2aa',…])` EXCLUDES axe BEST-PRACTICE rules — `heading-order`, `region`, `landmark-*`, `page-has-heading-one` are NOT in a WCAG-tagged run.** So a WCAG-tagged axe pass can read 0-violations while the heading OUTLINE is broken (two `<h1>`s, a skipped `h2→h4`) or content sits outside landmarks. Either add `'best-practice'` to the tags (may surface new issues — the `region` rule wants ALL content inside a landmark) OR guard the specific invariants separately (one `<h1>` + no skipped `h1→h2→h3` levels is a cheap, non-flaky DOM-structure E2E). Ref: agent.megabyte.space 2026-10-07 — WCAG-tagged axe was green for 30+ fires while the heading outline (1 h1 / 12 h2 / 75 h3, no skips) stayed unguarded until a dedicated outline test was added.
- Lighthouse ≥ 95
- Contrast ≥ 4.5:1
- Target size ≥ 24px (WCAG 2.2 2.5.8 — the one criterion axe auto-tests)
- Focus Not Obscured (2.4.11, AA) — focused element never hidden behind sticky headers/footers
- **Manual review REQUIRED** — the 8 WCAG 2.2 criteria axe can't auto-test (per `_kernel/standards.md#wcag22`). Run that checklist every a11y pass.

## Best Practices (Lighthouse)

- **A sudden BP drop (e.g. 100→81) with a single `deprecations` failure is usually NOT your code — it's the CDN's injected bot script.** Cloudflare Bot Fight Mode / JS Detections injects `cdn-cgi/challenge-platform/scripts/jsd/main.js`, which uses deprecated APIs (`StorageType.persistent`, Protected Audience). Always check the failed audit's source URL before touching your code. For **agent-facing** sites (built to be read by AI agents/crawlers), disable Bot Fight Mode / JS Detections regardless — bot-challenge tooling contradicts the agent-welcoming goal AND its deprecated-API script tanks BP. **HOW (do it, don't just note it):** the injector is `bot_management.enable_js` — `PUT /zones/{zone_id}/bot_management {"enable_js": false}` (it's a ZONE-wide setting; the `cdn-cgi/challenge-platform/.../jsd/main.js` injection stops within ~seconds). Send the SBFM fields back with it (`sbfm_definitely_automated`, `sbfm_verified_bots`, `sbfm_static_resource_protection`, `optimize_wordpress`, `suppress_session_score`) so the PUT doesn't reset actions; a bare PATCH/partial may no-op or reset. **Verify-after**: re-read `bot_management` and confirm you changed ONLY `enable_js` — especially that `ai_training` (content-protection) and the `sbfm_*` actions are untouched — then confirm the script is gone from prod (cache-busted curl + a real-browser `performance.getEntriesByType('resource')` check, not just one fetch). Note: if SBFM actions are already `allow`, JS Detections is injecting a BP-tanking script whose scores block nothing — pure downside, clean to remove. Ref: agent.megabyte.space 2026-10-06 (found) → 2026-10-07 (fixed via `enable_js:false`, verified script gone + 0 console errors; BP recovers). Cross-links `[[verify-against-source-of-truth]]`.

## Code

- Functions ≤ 50 lines
- Cyclomatic ≤ 10
- Params ≤ 3

## Security

### Required headers

- HSTS
- CSP Level 3 (strict-dynamic + per-response random nonce, never reused)
  - **Static/mostly-static site served by a Worker — drop `script-src 'unsafe-inline'` WITHOUT per-request nonces** (nonces mean rewriting HTML every request, and `strict-dynamic` *ignores* host-source allowlists — which breaks host-based third-party scripts like the CF Web Analytics beacon). Instead: (1) **externalize** the one executable inline `<script>` to a `'self'` file (end-of-body, self-contained scripts move cleanly); (2) **JSON-LD** (`type="application/ld+json"`) blocks are DATA — exempt from `script-src`, no nonce/hash; (3) the **speculation-rules** block (`type="speculationrules"`) is allowed by the **`'inline-speculation-rules'`** keyword; (4) keep host-sources (CF beacon etc.) by NOT adding `strict-dynamic`. Result: `script-src 'self' 'inline-speculation-rules' <hosts>` — no `unsafe-inline`, no per-request work. Verify in a REAL browser: 0 CSP violations AND the externalized script's features actually run AND JSON-LD/speculation-rules/beacon all still present (don't trust the header alone — `[[verify-against-source-of-truth]]`). `style-src 'unsafe-inline'` is separate + harder (inline `<style>` + `style=` attrs + Trusted Types need refactoring `innerHTML`). Ref: agent.megabyte.space 2026-10-07.
  - **Cloudflare edge optimizations inject inline content AFTER your origin — they can force `'unsafe-inline'` no matter how clean your source is.** `curl` prod and diff against your source before claiming/attempting a strict CSP. Concretely: **Cloudflare Fonts** (zone `fonts:on`) self-hosts Google Fonts by replacing your `<link>` with an edge-injected `<style>@font-face{…/cf-fonts/…}</style>` — which REQUIRES `style-src 'unsafe-inline'` (hashing it is fragile: the `/cf-fonts/v/<font>/<version>/` URL bumps on CF updates → hash breaks → fonts silently fall back). So a strict `style-src` is incompatible with CF Fonts unless you disable it (zone-wide, re-adds a Google dependency + hits sibling subdomains). Decide by value: CF Fonts' privacy/perf usually beats strict `style-src` on a zero-XSS static site. Same class: Rocket Loader, Email Obfuscation, Mirage all inject edge content your origin CSP must accommodate. STILL make first-party content inline-style/handler-free (0 `style=`, 0 `on*=`, 0 inline `<style>`) so the moment the edge optimization is off, `style-src` goes strict with no further work. Ref: agent.megabyte.space 2026-10-07 (`fonts:on` blocked strict style-src after all first-party inline styles were already removed). Cross-links `[[verify-against-source-of-truth]]`.
- Trusted Types (DOM-XSS prevention)
  - **Enabling `require-trusted-types-for 'script'` (the Hard Gate) on a Worker site: refactor ALL first-party DOM sinks to ZERO first, then leave `trusted-types` OFF the CSP for third-party compat.** It blocks every `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write`/`new Function` STRING assignment (even `innerHTML=''`). Audit (`grep -nE 'innerHTML|outerHTML|insertAdjacentHTML|document.write|new Function'`) + refactor to safe APIs: `el.innerHTML='<b>'+n+'</b> '+l` → `createElement('b')`+`.textContent=n`+`el.append(b,' '+l)`; `el.innerHTML=''` → `el.replaceChildren()`. Zero first-party sinks ⇒ no policy needed. Do NOT add `trusted-types 'none'` when a third-party script loads (the CF Web Analytics beacon) — omit `trusted-types` entirely so policy creation stays unrestricted (the beacon may define its own); `require-trusted-types-for 'script'` ALONE still enforces sinks + satisfies the gate. Verify in a REAL browser: E2E for 0 `TrustedHTML`-requires violations (from YOUR js AND the beacon) + the dynamic UI still renders. Ref: agent.megabyte.space 2026-10-07 — closed the gate, 2 innerHTML → createElement/replaceChildren, beacon unaffected.
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
