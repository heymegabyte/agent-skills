# CONVERGENCE — Browser / Web-Platform Capability Integration

Resumable progress record for the `/loop` driver (cron `ec398e1c`, every 15 min). Read this FIRST
each tick, do the next bounded increment under **Next actions**, update this file, commit scoped.
Source of truth for the 30 ideas: `IDEAS.md` (this dir). Canonical catalog: `rules/web-platform-capabilities.md`.

## Goal (settled — do not re-litigate)

Integrate all 30 researched web-platform capabilities into the agent skills with **enough copy-paste
usage examples + explicit triggers** that the AI opportunistically reaches for them WHENEVER a build
situation matches — every one shipped as progressive enhancement with its fallback. "Integrated" =
(a) a canonical catalog rule exists, AND (b) each target skill/rule references the relevant items with
a trigger, AND (c) an always-loaded surface points at the catalog so it is reached by default.

## Guardrails (every tick)

- Markdown repo — keep markdown CI clean (markdownlint-cli2 + validate-skills). No code/CI pollution.
- Edit only the files named in the current wire-in batch; stage explicit paths; verify `git diff --cached`.
- Opportunistic ≠ reckless: every capability is PE + fallback, reduced-motion/contrast-safe, must not
  regress INP/LCP/CLS or a11y. Never present a Chromium-only API as must-ship.
- Honesty: ◾ items are established-knowledge (not re-verified); never upgrade them to "verified".
- Do NOT duplicate 30 examples into every file — each skill gets a SHORT pointer + the item numbers
  relevant to it; the examples live once in the catalog.

## Phase ledger

- [x] P0 Research the 30 (2 adversarial deep-research passes; 44 verified claims) → `IDEAS.md` (tick 1)
- [x] P1 Canonical catalog rule `rules/web-platform-capabilities.md` — all 30 grouped by tier, each with
      what/why/2026-support/fallback/trigger + copy-paste example; fast trigger table; build/QA + avoid
      sections; self-critique (tick 1)
- [x] P2 First live pointer — `rules/gorgeous-by-default.md` references the catalog (always-on design pack) (tick 1)
- [x] P3 Wire-in batch A — motion/visual (tick 2): pointer blocks added to `11-motion-and-interaction-system/SKILL.md`
      (#1,8,17,23 + animation-trigger + LoAF), `rules/cinematic-ui-patterns.md` (#1,2,8,15,16,17), and skill 16 §12 as
      new always-on rule **119** (catalog = super-boost layer; names #2,3,5,6,7,12,15,16,18,19,20,21,22,27). 111-118→111-119 refs updated.
- [x] P4 Wire-in batch B — frontend/components (tick 3): pointer blocks → `rules/frontend-stack.md` (#2,3,5,6,16,18),
      `rules/shadcn-design-system.md` (#2,3,6,15,16,18), `10-experience-and-design-system/SKILL.md` (#1,6,7,8,9,12,15)
- [x] P5 Wire-in batch C — perf/security/obs (tick 4): `rules/quality-metrics.md` (#4,20,23,LoAF),
      `rules/csp-trusted-types.md` (#14), `13-observability-and-growth/SKILL.md` (#14,21,22), `07-quality-and-verification/SKILL.md` (LoAF + Playwright forced-colors/reduced-motion).
      **Correction:** `fetch-defaults.md` dropped from batch — it governs outbound-scraping UA, not resource-loading; #4 `fetchpriority` placed in `quality-metrics.md` where it belongs.
- [x] P6 Wire-in batch D — content/a11y/text (tick 5): `rules/text-contrast.md` (#9 + `contrast-color()` AVOID in Never),
      `rules/copy-writing.md` (#10 `text-wrap`), `06-build-and-slice-loop/blog-and-content-engine.md` (#1,19,20,26), `23-content-seo/SKILL.md` (#19,20)
- [x] P7 Wire-in batch E — app/PWA/AI/CF (tick 6): `21-app-foundation/SKILL.md` (#24,29), `28-cf-integrations-reference/SKILL.md` (#27 → Workers AI fallback),
      `15-site-generation/SKILL.md` (#30 manifest/Badging), `12-media-orchestration/SKILL.md` (#28 WebGPU+WebGL2), `24-functional/SKILL.md` (#2,3,5,18,22)
- [x] P8 Always-on reach (tick 7) — one scoped line in `rules/always.md` (priority-1, paths `*`) points every website/app build at the
      catalog (super-boost by default, detail stays in catalog for token economy); skill 16 §12 rule 119 already enforces it on site builds
- [x] P9 Verify (tick 7) — catalog has exactly **30** numbered entries (#1…#30); **22 files** reference `web-platform-capabilities`
      (the catalog + `always.md` + 12 skills + 8 rules); every capability wired into ≥1 relevant skill; `[[web-platform-capabilities]]` resolves; markdownlint-cli2 clean on all touched files across ticks 1-7
- [ ] P10 Convergence review — 2 independent read-throughs: every item has a trigger + example reachable from its wire-in target; no dead pointers; AVOID items carry the warning

## Next actions (do the TOP item; keep increments bounded, one batch per tick)

1. **P10 — convergence review (pass 1 of 2).** Independent read-through of the catalog + every wire-in target: confirm each of the 30
   has a concrete trigger + a copy-paste example reachable, each Tier-2/3 item states its `@supports`/feature-detect fallback, Chromium-only
   items are non-load-bearing, the two AVOID items carry the warning, and no `[[web-platform-capabilities]]` pointer is dead. Fix any gap found.
2. P10 pass 2 — second independent read-through must be clean (zero new findings) → then STOP and report convergence.

## Tick log

- **Tick 1 (2026-10-20):** P0–P2. Wrote `IDEAS.md` (30 + provenance + sources), this `CONVERGENCE.md`,
  and `rules/web-platform-capabilities.md` (full 30-entry catalog, examples + trigger table). Wired the
  first live pointer into `rules/gorgeous-by-default.md`. Committed scoped. markdownlint-cli2 clean on the
  3 new/edited files. Next: P3 batch A.
- **Tick 2 (2026-10-20):** P3 wire-in batch A (motion/visual). Pointer blocks → `11-motion-and-interaction-system/SKILL.md`
  and `rules/cinematic-ui-patterns.md`; skill 16 §12 gets always-on rule **119** (catalog = super-boost layer); 111-118→111-119.
  markdownlint-cli2 clean on all 4 touched files. Committed scoped. Next: P4 batch B (frontend/components).
- **Tick 3 (2026-10-20):** P4 wire-in batch B (frontend/components). Pointer blocks → `rules/frontend-stack.md`,
  `rules/shadcn-design-system.md`, `10-experience-and-design-system/SKILL.md` (native-primitives-before-libs: Popover/Anchor/Invoker
  drop Floating-UI; `<dialog>`, `field-sizing`, Navigation API, style queries, subgrid). markdownlint clean. Committed scoped. Next: P5 batch C.
- **Tick 4 (2026-10-20):** P5 wire-in batch C (perf/security/obs). Pointer blocks → `rules/quality-metrics.md` (#4,20,23,LoAF),
  `rules/csp-trusted-types.md` (#14 See-link), `13-observability-and-growth/SKILL.md` (#14,21,22), `07-quality-and-verification/SKILL.md`
  (LoAF culprit-script + Playwright forced-colors/reduced-motion a11y matrix). Dropped `fetch-defaults.md` (wrong fit). markdownlint clean. Committed scoped. Next: P6 batch D.
- **Tick 5 (2026-10-20):** P6 wire-in batch D (content/a11y/text). `rules/text-contrast.md` (#9 + `contrast-color()` AVOID in Never),
  `rules/copy-writing.md` (#10 text-wrap render note), `06-build-and-slice-loop/blog-and-content-engine.md` (#1,19,20,26 content primitives),
  `23-content-seo/SKILL.md` (#19 `<details name>`, #20 `hidden=until-found` for crawlable collapsed content). markdownlint clean. Committed scoped. Next: P7 batch E.
- **Tick 6 (2026-10-20):** P7 wire-in batch E (app/PWA/AI/CF). `21-app-foundation/SKILL.md` (#24 passkeys-via-Clerk, #29 Background Sync),
  `24-functional/SKILL.md` (#2,3,5,18,22 forms/modals), `28-cf-integrations-reference/SKILL.md` (#27 on-device Gemini-Nano → Workers AI fallback),
  `12-media-orchestration/SKILL.md` (#28 WebGPU + mandatory WebGL2 fallback), `15-site-generation/SKILL.md` (#30 advanced manifest/Badging via validate-pwa-kit).
  markdownlint clean. Committed scoped. All 7 wire-in batches done → Next: P8 always-on reach, then P9 verify + P10 review.
- **Tick 7 (2026-10-20):** P8 + P9. P8: one scoped super-boost line added to `rules/always.md` (every build scans the catalog; detail
  stays in-catalog for token economy). P9 verify: catalog = exactly 30 entries (#1…#30); 22 files reference `web-platform-capabilities`
  (catalog + `always.md` + 12 skills + 8 rules); every capability wired ≥1×; link resolves; markdownlint clean. Committed scoped. Next: P10 review (2 passes).
