---
last_reviewed: 2026-10-20
superseded_by: null
name: "web-platform-capabilities"
priority: 2
pack: "design"
triggers:
  - "browser api"
  - "web platform"
  - "view transition"
  - "popover"
  - "anchor positioning"
  - "scroll-driven"
  - "speculation rules"
  - "navigation api"
  - "progressive enhancement"
  - "@supports"
  - "super boost"
paths:
  - "org:website_build"
---

# Web-Platform Capabilities — reach for these WHENEVER POSSIBLE

30 modern browser/web-platform capabilities that make generated sites faster, more polished, more
capable, and more AI-native than the mandated baseline. **This is the SUPER-BOOST layer: on every
build, scan the trigger table and opportunistically deploy every capability whose trigger matches.**

- **Opportunistic ≠ reckless.** Every capability below ships as **progressive enhancement** with the
  stated fallback, is `prefers-reduced-motion` / contrast-safe, and must never regress INP/LCP/CLS or
  a11y. A Chromium-only API is NEVER a hard dependency — feature-detect and degrade.
- **Provenance:** ✅V = verified in deep-research (2026-10-20) with a primary citation; ◾ = established
  Baseline (stable public data). Full record + sources: `run-the-loop/browser-platform-integration/IDEAS.md`.
- **Baseline tiers:** *Widely* = safe default; *Newly* = default behind `@supports`; *Limited /
  Chromium-only* = opportunistic, feature-detect. "Baseline" = Chrome+Edge+Firefox+Safari all support it.

## Fast trigger table (situation → deploy these #)

| When you are building… | Deploy |
| --- | --- |
| Any SPA route / state change | #1 same-doc View Transitions, #5 Navigation API, #23 Observers |
| Static multi-page marketing (vite-ssg) | #26 cross-doc View Transitions, #25 Speculation Rules prerender |
| Tooltip / menu / dropdown / popover | #2 Popover + #15 Anchor Positioning + #16 Invoker Commands |
| Modal / dialog / drawer | #3 native `<dialog>` (auto-inert), #2 Popover for non-modal |
| Hero / above-the-fold image | #4 `fetchpriority=high`, #11 `dvh` |
| Scroll reveals / parallax / progress bar | #17 scroll-driven animations, #23 IntersectionObserver |
| Any form (contact, multimodal, search) | #18 `field-sizing`, #3 dialog, #24 passkeys |
| FAQ / accordion | #19 `<details name>`, #20 `hidden=until-found` |
| Bento / asymmetric grid | #12 `subgrid`, #6 container+style queries |
| Design-system component / variant | #6 style queries, #7 `:has()`, #8 `@property`, #9 `color-mix()` |
| Headings + body copy | #10 `text-wrap: balance`/`pretty` |
| Brand theming / hover tints | #9 `color-mix()`+relative color, #8 `@property` |
| Share / copy affordance | #21 Web Share, #22 async Clipboard |
| Installable PWA / SaaS app | #30 manifest+Badging, #29 Background Sync+Push, #24 passkeys |
| AI-native surface (summarize/translate/chat) | #27 built-in on-device AI (→ Workers AI fallback) |
| GPU visual / 3D / client inference | #28 WebGPU (→ WebGL2 fallback) |
| CSP / security hardening | #14 Trusted Types + Reporting API |
| Perf/QA instrumentation | LoAF + web-vitals attribution (Build/QA section) |
| Any animation at all | #13 `prefers-reduced-motion` gate (always) |

---

## Tier 1 — MUST-SHIP (Baseline; make these the DEFAULT)

### 1. Same-document (SPA) View Transitions — ✅V Baseline 2025-10-14

Animate route/state changes with `startViewTransition()`; cinematic motion, near-zero JS.

```js
// Progressive: unsupported engines just apply the end state instantly.
function navigate(update) {
  if (!document.startViewTransition) return update();
  document.startViewTransition(() => update());
}
// Shared-element morph: give the persistent element the same name on both states.
// .hero-img { view-transition-name: hero; }
```

Fallback: `if (document.startViewTransition)`. Firefox 144 lacks VT *types* → gate type usage. (TanStack Router / Angular: wrap the route commit.)

### 2. Popover API — ✅V Baseline Widely Apr 2025

No-JS top-layer overlays (tooltips, menus, teaching UI): auto light-dismiss, Esc-to-close, no z-index wars.

```html
<button popovertarget="menu">Menu</button>
<div id="menu" popover>…</div>            <!-- popover="auto" = light-dismiss -->
```

Fallback: iOS < 18.3 light-dismiss bug → add a JS outside-click shim for that range. Popover does NOT trap focus or assign menu ARIA roles (use `<dialog>` / explicit roles for that).

### 3. Native `<dialog>` + `showModal()` — ✅V Baseline Widely 2022

`showModal()` auto-inerts the rest of the page, provides `::backdrop`, and traps focus — free.

```html
<dialog id="d"><form method="dialog"><button>Close</button></form></dialog>
<script>d.showModal()</script>
```

Add explicit focus-return on close + `overscroll-behavior: contain` scroll-lock (neither is automatic). Use `showModal()` not `show()`/`open` (only modal inerts).

### 4. `fetchpriority` / Priority Hints — ✅V Baseline 2024

The cheapest LCP lever: prioritize the hero/LCP image, de-prioritize offscreen assets.

```html
<img src="/hero.avif" fetchpriority="high" alt="…">
<img src="/carousel-3.avif" fetchpriority="low" loading="lazy" alt="…">
<link rel="preload" as="image" href="/hero.avif" fetchpriority="high">
```

Zero-risk (ignored if unknown). The image must be the real LCP element and NOT `loading="lazy"`.

### 5. Navigation API — ✅V Baseline early 2026

One `navigate` event + `intercept()` replaces pushState+popstate+click-handler for SPA routing.

```js
if ('navigation' in window) {
  navigation.addEventListener('navigate', (e) => {
    if (!e.canIntercept || e.hashChange) return;
    e.intercept({ handler: async () => renderRoute(new URL(e.destination.url).pathname) });
  });
}
```

Fallback: `'navigation' in window` → History API. Safari lacks `precommitHandler` (gate advanced use).

### 6. Container queries + **style queries** — ✅V style() Baseline 2026

Style components by their container's size AND `--token` values — real context-driven design-system components.

```css
.card { container: card / inline-size; }
@container card (inline-size > 24rem) { .card__body { display: grid; grid-template-columns: 1fr 1fr; } }
@container style(--density: compact) { .card { padding: .5rem; } }   /* custom props only */
```

Fallback: `@supports` + a sensible default. Style queries currently support custom properties only.

### 7. `:has()` relational selector — ◾ Baseline 2023

Style a parent from its descendants/state with zero JS (card-with-image, form-with-error, has-badge).

```css
.card:has(img) { grid-template-rows: auto 1fr; }
.field:has(:user-invalid) { outline: 2px solid var(--danger); }
label:has(+ input:checked) { font-weight: 600; }
```

Fallback: none needed — Baseline Widely; a non-matching `:has()` is simply inert.

### 8. `@property` typed custom properties — ◾ Baseline 2024

Register a type so gradients/angles/colors *animate* (conic spinners, animated borders, hover sweeps).

```css
@property --angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
.ring { background: conic-gradient(from var(--angle), var(--accent), transparent); transition: --angle .333s; }
.ring:hover { --angle: 360deg; }
```

Degrades to a static value. Pair with `prefers-reduced-motion`.

### 9. `color-mix()` + relative color syntax — ◾ Baseline 2023-24

Derive hover/tint/alpha/contrast variants from ONE brand token in OKLCH — kills palette sprawl.

```css
--brand: oklch(62% .19 256);
--brand-hover: color-mix(in oklch, var(--brand), black 12%);
--brand-tint:  color-mix(in oklch, var(--brand), white 85%);
--brand-a20:   oklch(from var(--brand) l c h / .2);
```

Keep guaranteed-legibility logic in `text-contrast.md` (do NOT use `contrast-color()` — see AVOID).

### 10. `text-wrap: balance` / `pretty` — ✅V shorthand ~94%

Balanced multi-line headings; no orphans/rivers in body copy.

```css
h1, h2, .kicker, figcaption { text-wrap: balance; }  /* headings only (≤6-line Chromium cap) */
p, .prose { text-wrap: pretty; }                      /* body only (~10% layout cost) */
```

Degrades silently. `balance` for short blocks; `pretty` for long text where layout beats speed.

### 11. Dynamic viewport units `dvh/svh/lvh` — ◾ Baseline 2022

Correct full-height heroes on mobile with a moving URL bar (no more cut-off `100vh`).

```css
.hero { min-height: 100svh; }   /* safe: smallest viewport; dvh if you want it to track the bar */
```

Fallback: none needed — Baseline Widely; older engines use the `vh` you also set.

### 12. `subgrid` — ◾ Baseline 2023

Child grids inherit parent tracks → bento cards with perfectly aligned rows/footers.

```css
.bento { display: grid; grid-template-columns: repeat(3, 1fr); }
.card  { display: grid; grid-row: span 2; grid-template-rows: subgrid; }
```

Fallback: a normal grid (rows just won't cross-align).

### 13. `prefers-reduced-motion` / `prefers-contrast` / `forced-colors` — ◾ Baseline

A11y-as-craft: respect OS motion/contrast and survive Windows High Contrast. Gate EVERY animation.

```css
@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
@media (prefers-contrast: more) { :root { --border: CanvasText; } }
@media (forced-colors: active) { .btn { border: 1px solid ButtonText; } }
```

Fallback: none needed — Baseline; an unknown media query is a no-op (content stays fully usable).

### 14. Trusted Types + Reporting API — ✅V Baseline 2026

Doctrine mandates CSP L3 + Trusted Types; both are now Baseline → enforce as DEFAULT and collect
real-world violations by pointing `report-to` at a Worker.

```http
Content-Security-Policy: require-trusted-types-for 'script'; report-to csp-endpoint
Reporting-Endpoints: csp-endpoint="https://example.com/__cspreport"
```

Old engines ignore it (additive). See `csp-trusted-types.md` for the nonce + strict-dynamic policy.

---

## Tier 2 — HIGH (Baseline-Newly / strong support; default behind `@supports`)

### 15. CSS Anchor Positioning — ✅V Baseline Newly Jan 2026

Tether tooltips/menus to a trigger in pure CSS; pairs with #2 Popover → deletes Floating-UI/Popper.

```css
.trigger { anchor-name: --t; }
.tip { position: absolute; position-anchor: --t; position-area: block-end; }
@supports (anchor-name: --x) { /* enhanced */ }
@position-try --flip { position-area: block-start; }  /* @supports-guard advanced sub-props */
```

Fallback: normal-flow / JS positioning for non-supporting engines.

### 16. Invoker Commands `command`/`commandfor` — ✅V Baseline Newly Dec 2025

Declarative buttons that open/close popovers + dialogs with zero JS.

```html
<button commandfor="dlg" command="show-modal">Open</button>
<button commandfor="dlg" command="close">Close</button>
<dialog id="dlg">…</dialog>
```

Fallback: `invokers-polyfill` for Safari < 26.2, or a 3-line JS click handler.

### 17. Scroll-driven animations `animation-timeline` — ✅V ~83%

Compositor-thread reveals / parallax / reading-progress bars — no scroll listeners, INP-safe.

```css
@supports (animation-timeline: scroll()) {
  .progress { animation: grow linear; animation-timeline: scroll(root block); transform-origin: left; }
  .reveal   { animation: fade-up linear both; animation-timeline: view(); animation-range: entry 0% cover 35%; }
}
@keyframes grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }
```

Author the finished (visible) state as the default so non-supporting engines (Firefox) show content. Animate transform/opacity only.

### 18. `field-sizing: content` — ✅V Baseline 2026-06

Auto-grow textareas/inputs with pure CSS — removes the JS auto-grow hack on every form.

```css
@supports (field-sizing: content) { textarea, select { field-sizing: content; max-block-size: 40svh; } }
```

Fallback: `min-height` / existing JS auto-grow where unsupported (~20%).

### 19. `<details name>` exclusive accordions — ◾ Baseline 2024

Native single-open FAQ accordion, no JS, and `FAQPage` JSON-LD-friendly.

```html
<details name="faq"><summary>Q1</summary>…</details>
<details name="faq"><summary>Q2</summary>…</details>  <!-- opening one closes the others -->
```

Fallback: none needed — Baseline Widely; an unknown `name` degrades to independent (non-exclusive) accordions.

### 20. `hidden=until-found` + `content-visibility:auto` — ◾ mixed

Collapsed content stays Ctrl-F findable + deep-linkable; skip offscreen rendering for big scroll perf.

```html
<section hidden="until-found" id="spec">…</section>
```

```css
.long-section { content-visibility: auto; contain-intrinsic-size: auto 600px; }
```

Fallback: `until-found` degrades to normal `hidden` (Firefox); always set `contain-intrinsic-size` to avoid scrollbar jump.

### 21. Web Share + Share Target — ◾ broad mobile / Chromium install

Native OS share sheet for blog/product pages; an installed PWA can register as a share *target*.

```js
if (navigator.share) await navigator.share({ title, url });
else await navigator.clipboard.writeText(url);   // copy-link fallback
```

### 22. Async Clipboard API — ◾ Baseline

One-tap copy on code blocks, coupons, referral/share links (rich `write()` too).

```js
await navigator.clipboard.writeText(code);   // then show a "Copied ✓" micro-toast (0.333s)
```

Fallback: none needed — Baseline; `document.execCommand('copy')` only for pre-2020 engines.

### 23. Intersection / Resize Observers — ◾ Baseline

Reveal-on-scroll, lazy sections, container-aware widgets WITHOUT scroll/resize listeners (protects INP).

```js
new IntersectionObserver((es) => es.forEach(e => e.isIntersecting && e.target.classList.add('in')),
  { rootMargin: '0px 0px -10% 0px' }).observe(el);
```

Prefer #17 scroll-driven animations for pure-visual reveals; use observers for logic (lazy-init, counters). Fallback: none needed — Baseline Widely.

### 24. WebAuthn / passkeys + Credential Management conditional UI — ◾ broad

Passkey autofill on sign-in — highest-security, highest-conversion auth. Pairs with mandated Clerk.

```js
const cred = await navigator.credentials.get({ mediation: 'conditional', publicKey: opts }); // autofill UI
// <input autocomplete="username webauthn">
```

Fallback: password / email-link. Clerk exposes passkeys — enable rather than hand-roll.

---

## Tier 3 — OPPORTUNISTIC (Chromium-only / device- or install-gated; feature-detect, never load-bearing)

### 25. Speculation Rules prerender/prefetch — ✅V Chromium-only (~76%)

Near-instant next-page nav (verified CWV win: near-zero LCP, lower CLS, better INP).

```html
<script type="speculationrules">
{ "prerender": [{ "where": { "href_matches": "/*" }, "eagerness": "moderate" }] }
</script>
```

Gate on-load side effects with `document.prerendering` / `prerenderingchange`. Non-supporting browsers ignore the script. **Do NOT cite the Ray-Ban conversion numbers** (refuted — see AVOID).

### 26. Cross-document (MPA) View Transitions — ✅V Chrome 126 / Safari 18.2

Cinematic transitions between full static-page navigations (the vite-ssg marketing routes).

```css
@view-transition { navigation: auto; }           /* root cross-fade needs no names */
.logo { view-transition-name: logo; }             /* shared-element morph across pages */
```

Fallback: **Firefox holdout** → instant navigation. Same-origin pages only.

### 27. Built-in on-device AI (Gemini Nano) — ◾ Chromium; Prompt API ~stable Chrome 148

Free, private, zero-latency summarize / translate / "TL;DR" / rewrite — AI-native polish at no server cost.

```js
if ('Summarizer' in self && (await Summarizer.availability()) === 'available') {
  const s = await Summarizer.create(); article.tldr = await s.summarize(text);
} else { /* FALLBACK: Workers AI (estate default) */ }
```

Always feature-detect + degrade to **Workers AI**. Translator/LanguageDetector are the most broadly available; Writer/Rewriter stage behind flags/trials.

### 28. WebGPU (+ WebGL2 fallback) — ✅V Limited (~88%, Firefox-blocked)

GPU hero visuals / shaders / client-side inference.

```js
if (navigator.gpu) { const adapter = await navigator.gpu.requestAdapter(); /* … */ }
else { /* WebGL2 or a static poster image */ }
```

WebGL2 or static fallback is mandatory. Never gate core content on it.

### 29. Background Sync + Periodic Sync + Web Push — ✅V Chromium-only (~77%)

Offline form-submit replay + re-engagement for installed SaaS PWAs.

```js
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  const reg = await navigator.serviceWorker.ready; await reg.sync.register('outbox');
} else { /* FALLBACK: IndexedDB queue + replay on next page load */ }
```

No Safari/Firefox → the IndexedDB-queue fallback IS the real path for ~23% of users; never load-bearing.

### 30. Badging API + advanced Web App Manifest — ✅V install-gated

Installable-PWA polish: jumplist `shortcuts`, richer install UI via `screenshots`, `share_target`, `file_handlers`, `launch_handler`, app-icon badges.

```json
{ "shortcuts": [{ "name": "New", "url": "/new" }],
  "screenshots": [{ "src": "/s1.png", "sizes": "1280x720", "form_factor": "wide" }],
  "launch_handler": { "client_mode": "navigate-existing" } }
```

```js
if ('setAppBadge' in navigator) navigator.setAppBadge(unread);   // installed PWA only
```

Feature-detect `navigator.setAppBadge`; manifest fields are additive (ignored if unknown).

---

## Build / QA tooling should adopt

- **Long Animation Frames (LoAF) + `web-vitals` v4 attribution** — ✅V Chromium 123+. INP says *an*
  interaction was slow; LoAF names the exact culprit script (`sourceURL`). Wire into RUM/CI; degrade to `longtask`.

  ```js
  import { onINP } from 'web-vitals/attribution';
  onINP(({ attribution }) => report(attribution.longAnimationFrameEntries?.[0]?.scripts?.[0]?.sourceURL));
  ```

- **Scroll-TRIGGERED animations (`animation-trigger`)** — ✅V Chrome 146-only. Opportunistic declarative
  alternative to IntersectionObserver for firing time-based animations; mandatory `@supports` fallback.
- **Playwright forced-colors / reduced-motion / dark-mode axe runs** across the 6-breakpoint matrix —
  catch #13 regressions in CI (see user `.claude` `e2e-visual-inspection`).

## AVOID (adversarially refuted — do not ship / do not cite)

- **`contrast-color()`** for "guaranteed-legible" text — still *Emerging*, not reliable. Keep the manual /
  `color-mix()` contrast logic in `text-contrast.md`. (verified 0-3)
- **The Ray-Ban Speculation-Rules conversion stats** (+101% / +156% CR, −13% exit) — unsubstantiated at the
  3-vote bar. Cite the Chrome CWV *mechanism* (#25), never those numbers. (0-3 / 1-2)

## Self-critique (before shipping any surface)

1. Did I scan the trigger table and deploy every capability whose trigger matched this surface?
2. Does every Tier-2/3 use have its `@supports` / feature-detect guard + a real fallback path?
3. Is every animation gated by `prefers-reduced-motion` (#13) and contrast-safe?
4. Did I keep Chromium-only items (#25-30, LoAF) strictly non-load-bearing?
5. Did I avoid `contrast-color()` and the Ray-Ban numbers?
6. Would removing JS libraries (Floating-UI, auto-grow, scroll-reveal, share) in favor of #2/#15/#17/#18/#21 shrink the bundle? → do it.
