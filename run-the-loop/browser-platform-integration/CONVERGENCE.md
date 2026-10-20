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
- [ ] P3 Wire-in batch A — motion/visual: `11-motion-and-interaction-system/SKILL.md` (#1,8,17,23 + animation-trigger),
      `rules/cinematic-ui-patterns.md` (#1,8,17), `16-cinematic-website-prime-directive/SKILL.md` (#1,11,25,26)
- [ ] P4 Wire-in batch B — frontend/components: `rules/frontend-stack.md` (#2,3,5,16,18),
      `rules/shadcn-design-system.md` (#2,6,15), `10-experience-and-design-system/SKILL.md` (#6,7,9,15)
- [ ] P5 Wire-in batch C — perf/security/obs: `rules/fetch-defaults.md` (#4), `rules/quality-metrics.md` (#4,20,23,LoAF),
      `rules/csp-trusted-types.md` (#14), `13-observability-and-growth/SKILL.md` (#14,21), `07-quality-and-verification/SKILL.md` (LoAF+Playwright)
- [ ] P6 Wire-in batch D — content/a11y/text: `rules/text-contrast.md` (#9 + contrast-color AVOID note),
      `09-brand-and-content-system` copy rule (#10), `06-build-and-slice-loop/blog-and-content-engine.md` (#19), `23-content-seo/SKILL.md` (#19,20)
- [ ] P7 Wire-in batch E — app/PWA/AI/CF: `21-app-foundation/SKILL.md` (#24,29), `28-cf-integrations-reference/SKILL.md` (#27),
      `15-site-generation` Site-Mode PWA (#30), `12-media-orchestration/SKILL.md` (#28), `24-functional/SKILL.md` (#3,18)
- [ ] P8 Always-on reach — one line in `rules/always.md` + `16` Hard Gates so the catalog is reached by default on every site build
- [ ] P9 Verify — markdownlint-cli2 clean on every touched file; grep that each of the 30 is referenced from ≥1 target; `plugin-audit`/`skill-health` if counts shifted
- [ ] P10 Convergence review — 2 independent read-throughs: every item has a trigger + example reachable from its wire-in target; no dead pointers; AVOID items carry the warning

## Next actions (do the TOP item; keep increments bounded, one batch per tick)

1. **P3 — wire-in batch A (motion/visual).** Add a short "Opportunistic web-platform capabilities" block to
   `11-motion-and-interaction-system/SKILL.md`, `rules/cinematic-ui-patterns.md`, and `16-.../SKILL.md` pointing at
   `rules/web-platform-capabilities.md` with the item numbers above + a one-line trigger each. Keep examples in the catalog.
2. P4 batch B (frontend/components). 3. P5 batch C (perf/security/obs). 4. P6 batch D (content/a11y).
   5. P7 batch E (app/PWA/AI/CF). 6. P8 always-on reach. 7. P9 verify. 8. P10 review (2 clean passes) → STOP.

## Tick log

- **Tick 1 (2026-10-20):** P0–P2. Wrote `IDEAS.md` (30 + provenance + sources), this `CONVERGENCE.md`,
  and `rules/web-platform-capabilities.md` (full 30-entry catalog, examples + trigger table). Wired the
  first live pointer into `rules/gorgeous-by-default.md`. Committed scoped. markdownlint-cli2 clean on the
  3 new/edited files. Next: P3 batch A.
