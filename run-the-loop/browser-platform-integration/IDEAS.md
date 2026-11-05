# Browser / Web-Platform Capabilities — the 30 (source of truth)

The 30 capabilities to integrate across the agent skills so generated sites opportunistically
use every high-leverage modern browser API **whenever possible**. Produced by two adversarial
deep-research passes (2026-10-19 → 2026-10-20).

- Provenance tags: **✅V** = independently verified this research with a primary citation
  (support date was in-flux). **◾** = well-established Baseline status (stable public data; not
  re-verified — flagged for honesty). All ship as **progressive enhancement** with the stated fallback.
- Research run IDs: `wf_3f2863c2-a2b` (pass 1, frontier/in-flux) + `wf_c7e95a5b-42f` (pass 2, uncovered cohort).
  44 adversarially-verified claims across both passes; 220 agents.
- Canonical catalog (with copy-paste examples + triggers): `rules/web-platform-capabilities.md`.

## Tier 1 — MUST-SHIP (Baseline; make DEFAULT in every generated site)

1. Same-document (SPA) View Transitions — ✅V Baseline 2025-10-14 (all 3 engines; FF 144 omits types) → `11`, `16`, `cinematic-ui-patterns.md`
2. Popover API (`popover`/`popovertarget`) — ✅V Baseline Widely Apr 2025 (iOS<18.3 JS light-dismiss shim) → `gorgeous-by-default.md`, `shadcn-design-system.md`, `10`
3. Native `<dialog>` + `showModal()` auto-inert + `::backdrop` — ✅V Baseline Widely 2022 → `frontend-stack.md`, `24`
4. `fetchpriority` / Priority Hints — ✅V Baseline 2024 (Google Flights LCP 2.6s→1.9s) → `fetch-defaults.md`, `quality-metrics.md`, `12`
5. Navigation API (`navigate` + `intercept()`) — ✅V Baseline early 2026 (~91%; Safari lacks precommitHandler) → `frontend-stack.md`
6. Container queries + **style queries** — ✅V style() Baseline 2026 (FF 151) → `frontend-stack.md`, `10`, `shadcn-design-system.md`
7. `:has()` relational selector — ◾ Baseline 2023 → `10`, `gorgeous-by-default.md`
8. `@property` typed custom properties (animatable gradients/angles) — ◾ Baseline 2024 → `11`, `cinematic-ui-patterns.md`
9. `color-mix()` + relative color syntax (OKLCH variants) — ◾ Baseline 2023-24 → `text-contrast.md`, `10`
10. `text-wrap: balance` / `pretty` — ✅V shorthand ~94%; balance headings-only, pretty body-only → `copy-writing.md`, `gorgeous-by-default.md`
11. Dynamic viewport units `dvh/svh/lvh` — ◾ Baseline 2022 → `16`, `gorgeous-by-default.md`
12. `subgrid` — ◾ Baseline 2023 → `gorgeous-by-default.md`, `10`
13. `prefers-reduced-motion` / `prefers-contrast` / `forced-colors` — ◾ Baseline → `e2e-visual-inspection` (user `.claude`), a11y gate, `11`
14. Trusted Types + Reporting API (CSP violation report-to a Worker) — ✅V Baseline 2026 → `csp-trusted-types.md`, `13`

## Tier 2 — HIGH (Baseline-Newly / strong support; default behind `@supports`)

15. CSS Anchor Positioning (`anchor()`/`position-area`; pairs with Popover) — ✅V Baseline Newly Jan 2026 (FF 147) → `gorgeous-by-default.md`, `10`
16. Invoker Commands (`command`/`commandfor`) — ✅V Baseline Newly Dec 2025 (Safari 26.2) → `frontend-stack.md`
17. Scroll-driven animations (`animation-timeline: scroll()/view()`) — ✅V ~83% (Chrome 115/Safari 26; FF flagged) → `11`, `cinematic-ui-patterns.md`
18. `field-sizing: content` (auto-grow inputs/textarea) — ✅V Baseline 2026-06 (~80%) → `frontend-stack.md`, `24`
19. `<details name>` exclusive accordions — ◾ Baseline 2024 → `blog-and-content-engine.md` (`06`), `23`
20. `hidden=until-found` + `content-visibility:auto` — ◾ content-visibility ~2024; until-found Chromium+Safari → `15`, `quality-metrics.md`
21. Web Share + Share Target — ◾ share broad mobile/Safari; Share Target Chromium/install-gated → `13`, PWA rules
22. Async Clipboard API — ◾ Baseline → `gorgeous-by-default.md`
23. Intersection / Resize Observers (replace scroll/resize listeners) — ◾ Baseline → `11`, `quality-metrics.md`
24. WebAuthn / passkeys + Credential Management conditional UI — ◾ broad (pairs with Better Auth) → `21`

## Tier 3 — OPPORTUNISTIC (Chromium-only / device- or install-gated; feature-detect, never load-bearing)

25. Speculation Rules prerender/prefetch — ✅V Chromium-only (~76%); gate side-effects on `document.prerendering` → `16`, website-build-doctrine
26. Cross-document (MPA) View Transitions — ✅V Chrome 126/Safari 18.2; **Firefox holdout** → `16` (vite-ssg marketing)
27. Built-in on-device AI (Gemini Nano: Prompt/Translator/Summarizer/Writer/Rewriter) — ◾ Chromium; Prompt API ~stable Chrome 148; **fallback Workers AI** → `28`, AI-native spiral
28. WebGPU (+ WebGL2 fallback) — ✅V Limited (~88%, Firefox-blocked) → `12`, `multimedia-enrich`
29. Background Sync + Periodic Sync + Web Push — ✅V Chromium-only (~77%); IndexedDB-queue fallback → PWA rules, `21`
30. Badging API + advanced Web App Manifest (`shortcuts`/`screenshots`/`share_target`/`file_handlers`/`launch_handler`) — ✅V install-gated → PWA rules, `15` Site Mode §3

## Build / QA tooling should adopt

- Long Animation Frames (LoAF) + `web-vitals` v4 attribution — ✅V Chromium 123+ (names the culprit script; Taboola −36% INP) → `07`, `quality-metrics.md`
- Scroll-TRIGGERED animations (`animation-trigger`) — ✅V Chrome 146-only → opportunistic, `11`
- Playwright forced-colors / reduced-motion / dark-mode axe runs across 6 breakpoints → `e2e-visual-inspection` (user `.claude`)

## AVOID (adversarially refuted)

- `contrast-color()` for "guaranteed-legible" text — still Emerging, NOT reliable; keep manual/`color-mix` logic in `text-contrast.md`. (0-3)
- Ray-Ban Speculation-Rules conversion stats (+101%/+156% CR, −13% exit) — unsubstantiated at the 3-vote bar; cite the Chrome CWV *mechanism*, never the numbers. (0-3 / 1-2)

## Primary sources (canonical)

- web.dev/baseline + web.dev/baseline/2026; MDN Baseline badges; caniuse; web-platform-dx web-features explorer
- Chrome for Developers blog (prerender, LoAF, io26, fetch-priority); WebKit blog (scroll-driven, Safari 26.2, Badging); Mozilla Firefox release notes
