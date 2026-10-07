---
name: "e2e-testing"
priority: 2
pack: "testing"
triggers:
  - "test"
  - "e2e"
  - "playwright"
  - "tdd"
  - "visual"
  - "screenshot"
  - "ai vision"
paths:
  - "concern:e2e-testing"
last_reviewed: 2026-09-26
superseded_by: null
---

# E2E Testing — TDD Organization + Visual Inspection

Playwright E2E doctrine: how specs are organized + run (TDD-RED-first, hermetic, parallel) and how they self-inspect (random snapshot sampling + new-section AI vision + axe-on-prod). (Consolidated 2026-09-26 from e2e-tdd-organization + e2e-visual-inspection.) Numeric quality bars live in `quality-metrics`; RED-before-GREEN in `[[verification-loop]]`.

## TDD Organization

Every clickable element / form field / nav link / API endpoint / modal / keyboard shortcut / error / empty / loading state has ≥1 Playwright E2E that runs against PROD and goes RED before any implementation. Specs shard across N parallel runners with zero coordination (flip parallelism = one flag).

### Hard rules

- Failing test FIRST. Watch fail. THEN implement. Watch pass. No exceptions.
- No feature ships without ≥1 spec. No bug fix without ≥1 regression spec.
- `fullyParallel: true` × N workers × 6 viewports × 3 browsers — every spec hermetic.
- Hermetic = no shared FS state, no shared D1 rows another spec writes, no order-dependent fixtures, no global singletons.

### Directory layout + naming

- Canonical `e2e/` tree: `FEATURES.md`, `COVERAGE.yml`, `playwright.config.ts` + `.prod.config.ts` + `.shard.config.ts`, `_fixtures/` (auth/seed/reset), `_helpers/` (snapshot/axe/visual), `__snapshots__/` (baselines, version-controlled), `__seen-routes__.json`, per-feature dirs (`happy-path.spec.ts` / `edge-cases.spec.ts` / `a11y.spec.ts` / `visual.spec.ts`), `_smoke/`, `_agents/`. See `reference/e2e-tdd-organization.md` for the full annotated tree + `defineConfig` scaffold.
- Spec file `<concern>.spec.ts` (single concern, <200 lines); `describe` matches filename; `test` titles imperative ("it should ___"); `data-testid` `<feature>-<element>-<action>`; page objects `<Feature>Page` in `_fixtures/` (never inline selectors).

### Hermetic spec contract (all 6, else build-fail)

1. Starts at `/` — navigate via clicks/keyboard, never `page.goto` for internal nav after load.
2. Seeds own data via `_fixtures/` before-each. 3. Cleans own data after-each (or txn rollback).
4. Doesn't write localStorage/IDB/cookies the next spec reads. 5. No `Date.now()`/timezone/random dependence (fixed seeds or `page.clock.install()`). 6. No live third-party network (MSW/stub).

### Parallel-runner config (the knob)

- `fullyParallel: true`, workers `50%` CI / `75%` local. 6 viewports: 375·390·768·1024·1280·1920. 3 browsers: Chromium·Firefox·WebKit. Sharded: `--shard=$INDEX/$TOTAL` (no config change local→distributed).

### Inventory + test-account discipline

- `e2e/FEATURES.md` (feature · dir · spec count · last-pass commit); `e2e/COVERAGE.yml` (CI fails any feature with `specs: 0`). Pre-commit warns on new component/route without a matching spec.
- `test@megabyte.space` (customer) / `crew-test@megabyte.space` (crew); passwords/OTPs from env, never hardcoded. Real-user navigation only (`click`/`keyboard`); bare API calls only for seed/teardown.

### Playwright Test Agents (v1.59+ MCP) + failure triage

- `npx playwright init-agents --loop=claude` once/repo. Planner/Generator/Healer scaffold + auto-repair; run Healer before manual selector rewrite after a refactor.
- Triage each red spec INDIVIDUALLY (never "all flaky" from spot-checks): re-run alone, then curl its backing API. Three outcomes — load-flake / stale selector / real bug — each a different fix. See `reference/e2e-tdd-organization.md` for the full protocol.

### Done definition (the gate)

- New feature → spec written FIRST + RED → GREEN · `npm run e2e:prod` exits 0 · screenshots to R2 (local `artifacts/` in dev) · axe-core 0 violations at all 6 viewports · no console errors / CSP violations / 4xx-5xx · new routes in `__seen-routes__.json` AND covered by the first-render gate (below).

### Enforcement (deterministic)

- **PostToolUse hook** `~/.claude/hooks/enforce-tdd-e2e.py` fires after `Write|Edit|MultiEdit` on `src/web/components/**`, `src/worker/routes/**`, `src/web/pages/**`, `apps/dashboard/src/app/features/**`; scans `e2e/` for a spec naming the edited basename; none → system-reminder. **SessionStart hook** emits the SUPREME-rules reminder. Wired in `~/.claude/settings.json`. Per `hooks > rules > skills > prompts`.

### Folded from Superpowers — test-driven-development

*Vendored from [obra/Superpowers](https://github.com/obra/Superpowers) (MIT). Full skill: `20-superpowers` → test-driven-development.*

- **Iron Law:** NO production code without a failing test first. Wrote code before the test? Delete it (don't keep as "reference", don't adapt).
- Watch RED fail for the RIGHT reason (feature missing, not a typo/import error). A test that errors isn't RED.
- Passes on first run? You're testing existing behavior — the test is wrong. GREEN = minimal code to pass (YAGNI). Fails after GREEN? Fix the CODE, never the test. REFACTOR only after green.
- "Tests-after" is not TDD (biased by your impl; loses the proof the test catches the bug). Hard-to-test = hard-to-use — fix the interface (DI), don't pile on mocks.
- **Anti-patterns:** testing mock behavior · test-only methods in prod · mocking without understanding the side-effect · incomplete mocks (mirror the COMPLETE real shape) · over-mocking "to be safe" · asserting implementation details (call counts) · tests as afterthought.

## Visual Inspection

### Surface 1 — random snapshot sampling

- Each step has a **30%** chance of `randomSnapshot(page, 'step')`, seeded by `${TEST_TITLE}:${STEP}:${SHARD_INDEX}` (reproducible). First run = baseline in `e2e/__snapshots__/…`. Then `pixelmatch` `threshold: 0.1` AND `maxDiffPixelRatio: 0.005` — exceed either → fail with diff artifact. Anti-alias/font masked via `page.evaluate` style injection (NOT `page.addStyleTag({content})` — throws under Trusted Types).

### Surface 2 — new-section AI vision

- `e2e/__seen-routes__.json` = durable inventory keyed `<route>:<viewport>`. Before a route's first interaction, `assertNewSection` checks it; unknown → mandatory full-viewport screenshot + AI-vision call. Rubric: **layout sane · contrast AA · brand (dark #060610 / cyan #00E5FF) · no AI-slop (no lorem/`[Name]`/broken images) · score ≥ 8/10**. Pass → added with hash+score; fail → spec fails with feedback. New components (no route) detected via first-seen `data-testid`. See `reference/e2e-visual-inspection.md` for helpers.
- **Cost:** ~$0.005/image, fires only on never-seen routes (~5–20/suite, ≤$0.10/CI). Baselines + `__seen-routes__.json` committed; merge runner appends+dedups (shards write temp).

### Reliable axe-on-prod recipe (`scanAxeStable`)

Battle-tested over a 26-round arc (~210 WCAG nodes fixed). Copy into every project gating a11y on prod:

1. **Freeze animations** — inject CSS zeroing `animation/transition-duration` + `transform:none !important` via `page.evaluate` `style.textContent` (NEVER `addStyleTag({content})` on a Trusted-Types-hardened site — throws `requires a TrustedHTML value`; `textContent` is not TT-governed).
2. **Force-settle scroll-reveals** — for `.reveal, [data-reveal], main section, .reveal-stagger > *, .hero-rise > *` add visible class + inline `opacity:1; transform:none; animation:none`. Only animation-marked elements; genuinely-hidden content stays hidden.
3. **`iframes: false`** — third-party embeds (Square/Stripe/YouTube) load async → per-frame throws "context destroyed"; vendor's a11y responsibility.
4. **Self-heal contrast flake** — on a `color-contrast` violation, re-settle (increasing hold) + re-scan up to 3× (static violation persists; mid-animation sample clears).
5. **`scroll: false`** for scroll-spy pages (replaceState + smooth scrollIntoView races the scan and destroys context).
6. **Neutralize floating chrome** — drop `position:fixed`/`sticky` to `static` after settle (phantom `target-size` hits at narrow widths).
7. **`retries: 3` + `workers: 2`** in prod config; pair with a wait-prod-settle step (served bundle hash == just-built).
8. **Plain-axe probe FIRST** when a route fights manipulation — trust `AxeBuilder().analyze()` as ground truth, gate with least-manipulation mode.

### Recurring real-defect classes the gate catches

`<dl>` misuse (stray `<p>`/`<details>` in dt/dd) · decorative oversized numerals in pale tokens (<3:1) · eyebrow/label text in `*-500` on white (~4.0:1) · `landmark-unique` (dup section/aside) · `landmark-complementary-is-top-level` (nested `<aside>`) · `aria-hidden-focus` (collapsed panel still focusable → add `inert`) · `nested-interactive` (focusable inside `role="img"` svg) · `scrollable-region-focusable` (overflow wrapper needs `tabIndex=0` + `role="region"` + label). (Cross-link `text-contrast`.)

**Present-but-invisible controls (mobile audits must be VISUAL, not overflow-only).** An element can pass every presence + overflow + axe check yet render invisible. Ref: agent.megabyte.space 2026-10-06 — the mobile nav hamburger was a correct 44×44 button with `aria-label="Toggle menu"`, but its 3 `<span>` bars computed to **0×2px** (empty blocks in a `column` flex with `align-items:center` and no `width`), so the menu button was invisible empty space. Overflow E2E (`scrollWidth`) and "element exists" never catch this — only a **real mobile-viewport screenshot** did. Lock it by asserting the ICON's `getBoundingClientRect().width > 0`, not just the button's. Checking mobile for overflow ≠ checking mobile is gorgeous — screenshot real device viewports every pass. And overflow/visual checks must exercise EXPANDED states (open every accordion / modal / tab first) — collapsed-by-default content hides its overflow from a default-state scan (ref: a long FAQ `git clone … ~/.codex/skills/agent-skills` command overflowed 11px at 390px only once its answer was opened; the page-level overflow test, which runs with FAQ collapsed, never saw it). And audit the **intermediate "tablet dead-zone" (≈769–1024px)** between the mobile hamburger breakpoint and desktop — a nav/top-bar that *gained* an item (a new link, button) can crowd or wrap there while desktop AND mobile both look clean, so re-check tablet after adding any top-bar item (ref: agent.megabyte.space 2026-10-06 — a 7th nav link jammed the logo into the first link + wrapped "Try It" to two lines at 800px; 1280 and 390 were both fine. Fix: raise the hamburger breakpoint to cover the dead-zone).

### Anti-patterns

- Snapshot the whole viewport when one component changed (scope via `locator.screenshot()`) · set `threshold: 1` to silence flake (fix the flake) · skip the new-section gate for "internal pages" · stub the AI-vision call in CI (costs are trivial; the gate is the value).
