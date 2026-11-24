---
last_reviewed: 2026-06-29
superseded_by: null
name: "naming-no-transient-prefixes"
priority: 3
pack: "core"
triggers:
  - "wave"
  - "rename"
  - "top100"
  - "idea list"
  - "naming convention"
  - "cleanly named"
---

# Naming — No Transient Prefixes, No Vibe Names

Names describe WHAT a thing is — never WHEN it was built (transient prefixes), never
how the author FELT about it (vibe/hype adjectives), and never the ORDINAL a thing held
in a brainstorm or idea-list (numbered-idea-list nomenclature). Durable identifiers read
like a domain model, not a changelog, a hype deck, or a "top-N ideas" worksheet.
<!-- grow-ok -->
<!-- grew for: +numbered-idea-list/ordinal ban class + style-guide gate + theme.tools reference incident (Brian directive 2026-11-23) -->

## Banned in durable identifiers (build-fail)

- `wave<N>_*` / `waveN-*` / `sprint<N>_*` / `phase<N>_*` / `batch<N>_*` / `v<N>_*` (when N = a build wave, not a real API version)
- Applies to: **feature-flag keys**, **feature-module folders**, **route paths** (`/api/wave28-*`), **D1 table names**, **exported symbols / classes / components**, **DO classes**, **migration-defined object names**.

## Also banned — vibe / hype adjectives (build-fail)

- Subjective quality/hype words as durable identifiers: `brilliant.*`, `big_bets.*`, `awesome.*`, `magic.*`, `amazing.*`, `epic.*`, `ultimate.*`, `killer.*`, `genius.*`, `secret_sauce.*`, `game_changer.*`. They describe a FEELING, not a function.
- Same identifier surfaces as the transient ban: file names, exported symbols/classes, module folders, feature-flag keys, route paths, D1 tables, DO classes. Import aliases too (`import * as B from …` is a vibe-alias — name it for the module).
- **Grab-bag smell**: a file named for a vibe (`brilliant.ts` = "10 brilliant features") is usually ALSO an anti-pattern grab-bag of unrelated features (per `inverted-abstraction-pyramid`). Rename descriptively now; splitting into per-feature modules is the deeper fix.
- Legit domain terms that LOOK hype are fine: `pro.ts` (the Pro subscription tier), `super_admin.ts` (the super-admin role) — these name a real product concept, not a vibe.

## Also banned — numbered-idea-list / ordinal-brainstorm nomenclature (build-fail)

- A durable identifier must NEVER encode a brainstorm's ORDINAL or an idea-list COUNT — the position a thing held in a "top-N ideas" / "next-N" / "wave-N" generation pass is build-history, not domain meaning. Banned: `Top100*` / `functionTop100Ideas()` / `top30*` / `next50*` / `next-100-*` / `editorial-100-*` / `recursive-top100-*` / `NEW_RECOMMENDED_*` / `firstBatch*` / `round2*`, and any `<noun><N>` / `<N>-<noun>` where N is a brainstorm count or pass index.
- Same surfaces as the transient ban: file/dir names, exported symbols/classes/components, variables/constants, route paths (`/api/top-100`), config keys, flags, and package subpath exports (`./wave3-engines`). A SELECTION of ideas ships AS its features — each named for what it DOES; the "30 ideas" / "next 100 components" framing lives in the backlog/commit, NEVER in the code.
- The idea-count is the tell of a grab-bag (per `[[inverted-abstraction-pyramid]]`): `cf-native-wire-compat-and-top100.ts` / `wave4-complete-engines.ts` bundle unrelated things named by their generation batch. Rename each to what it IS; split the grab-bag.
- ALLOWED (not ordinals): a real product/consumer name that contains a word (`oneprompt-packed-consumer.mjs` tests the OnePrompt consumer product — a domain noun, not an idea-count); a domain taxonomy code encoding a real classification (`C01`–`C31` catalog categories, `F01`–`F11` editorial families); a genuine semantic API version (`/api/v2`); and a cardinality that is the thing's ACTUAL spec (`base64`, `oauth2`, `3dSecure`, a `max50Rows` limit). The test: does N describe the THING, or the ORDER it was dreamt up in? The latter is banned.

## Required instead — descriptive, domain-meaningful names

- A flag for U-Haul rental cross-sell is `truck_rental_cross_sell`, NOT `wave29_truck_rental`.
- A module for mid-job NPS is `mid_job_nps` / `features/mid-job-nps/`, NOT `wave31-mid-job-nps`.
- A route is `/api/group-move`, NOT `/api/wave28-group-move`.
- A consolidated experimental-feature service is `experimental_features.ts` / `advanced_features.ts`, NOT `brilliant.ts` / `big_bets.ts` (projectsites, 2026-08-15 — Brian directive; renamed both + the `B` import alias → `experimentalFeatures`, tables were already descriptive so no migration needed).

## Where chronology IS allowed

- **Migration FILENAMES only** — `0101_crew_intake.sql`, `0084_lead_ideas.sql`. The numeric prefix orders migrations; that's its whole job. The TABLES/COLUMNS/FLAGS inside still get descriptive names. An APPLIED migration's filename is a historical artifact — do NOT rename it later (breaks the runner's applied-migrations tracking, e.g. wrangler `d1_migrations`); fix the identifiers INSIDE, not the filename.
- **Commit messages / changelog / PR titles** — narrate the wave there, never in the code.
- **Real semantic API versions** — `/api/v2/...` when it's a genuine versioned contract, not a build wave.

## When you inherit wave-named identifiers

- Treat them as drift per `drift-detection`. Rename to descriptive names in careful batches: rename the symbol/flag/route + update EVERY caller + migration-rename live DB rows/tables + verify (typecheck + tests + the route's frontend callers) before moving to the next batch. Never rename a live route without updating its callers in the same change.
- A large inherited campaign (dozens of files, routes, flags) is **ledger intake** per `[[split-work-into-ledger]]` — decompose into an OpenSpec change + drain ONE verified batch per fire. NEVER mark the campaign "done" in a sweep you did not verify (see the fake-green incident below).

## 100% clean, style-guide-driven — across every language + surface

- Every durable identifier in EVERY part of the architecture is named per the AUTHORITATIVE style guide for its language/environment (per `[[style-guide-driven-decisions]]` + `[[code-style]]`): TS/JS → Google TS Style (camelCase vars/fns, PascalCase types, CONSTANT_CASE consts, kebab-case files); CSS tokens → the project token scheme; routes → resource nouns (Google API Design); SQL → snake_case. Mixed-convention or taste naming is drift to fix on sight (`[[drift-detection]]`).
- Enforce with a GATE, not a reminder (per `[[determinism-ratchet]]`): a repo `scripts/check-naming.mjs` (or equivalent) scans tracked SOURCE for the banned classes above and reports/fails on violations. A checked-off "renamed everything" task a gate would have caught is exactly why the gate must exist — a ticked box is not proof (`[[verify-against-source-of-truth]]`).

## Reference incident (theme.tools, 2026-11-23 — Brian directive)

Brian flagged a `package:oneprompt:write` script + the hypothetical `functionTop100Ideas()` and mandated 100%-clean style-guide naming across every part of the architecture. Audit found `oneprompt`/`projectsites`/`portfolio-consumers` PROPER (real consumer-product parity gates — a domain noun, not an idea-count), but ~90 tracked source files carrying ordinal/wave names: a whole `wave20`/`wave28`/`wave29` field-service subsystem (`/api/wave20/*` routes, `wave27_live_job_map` flags, DOs), `wave{1,3,4}-engines.ts` in `shared-utils`, `cf-native-wire-compat-and-top100.ts`, `execute-next-50-*` / `apply-wave3-*` scripts, and `editorial-100` / `recursive-top100` specs — PLUS 7,820 committed `.dist-build-*` build artifacts (separate drift: build output should be git-ignored). A prior OpenSpec task had marked "rename wave*-engines + cf-native-wire-compat-and-top100 + remove `/api/top-100`" as `[x]` DONE while the files still existed verbatim — a fake-green a gate would have caught. Lesson = this section + the gate: codify the ordinal ban, enforce it deterministically, and drain the inherited campaign in verified batches, never a fake-green sweep.
