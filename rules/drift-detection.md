---
last_reviewed: 2026-06-29
superseded_by: null
name: "drift-detection"
priority: 2
pack: "core"
triggers:
  - "drift"
paths:
  - "*"
---

# Architecture Drift Detection

Drift is the gap between how the system is SUPPOSED to be structured and how it actually is. Fix IMMEDIATELY, in the same turn it surfaces — never deferred. A scattered route, an unflagged feature, an untyped AI output: all drift, all merge-blockers.

## What counts as drift

- Route handler without an owning feature module
- Feature module without a `manifest.ts`
- Feature module without a wired feature flag
- Feature flag without a corresponding `manifest.ts`
- `manifest.ts` without colocated `__tests__/`
- Tests not linked back to a manifest (no `featureSlug` reference)
- API route without a Zod schema at its boundary
- API route that needs a flag guard but has none (`isFlagOn` missing)
- AI output consumed without a schema / contract validating it
- Tool (MCP / function-call) without an input AND output schema
- Dashboard / UI string not run through the i18n layer
- Log line emitted without a request id AND feature correlation id
- Sentry span / breadcrumb without feature context (`featureSlug` tag)
- Duplicate Zod schemas (same shape defined in ≥2 places)
- Duplicate TypeScript types (same shape defined in ≥2 places)
- **A UI PREVIEW/indicator of a computed action that RECOMPUTES it independently from the EXECUTOR** — "up next", "what will happen", a next-step hint, an estimate: when it duplicates the executor's decision logic instead of sharing ONE function, the preview silently LIES the moment the behavior changes. The trap: adding a new BEHAVIOR MODE (a smart/AI autoplay, a new sort, a new routing rule) changes what the action DOES, but every pre-existing preview of that action keeps computing the OLD way — invisibly wrong, no error. Fix on sight: extract the decision into ONE function (`pickNext()`) that BOTH the executor and the preview call, and when you add a mode, audit + re-point every preview of that action IN THE SAME change. Ref: bz.rocks 2026-10-25 — "AI Radio" changed autoplay-next to flow by similarity, but the np-panel "UP NEXT" card still previewed the catalog-next (wrong track + a bogus "why"); fixed by a shared `pickSimilarNext()` used by both `smartNext` + the preview. (Sibling gotcha: adding a keyboard shortcut — check for COLLISIONS. TWO distinct failure modes: (a) a binding later in the SAME `else-if` chain is DEAD — `KeyR` was already bound to Loop, so the new AI-Radio `KeyR` never fired + the button falsely advertised it; (b) two SEPARATE `window` keydown listeners that BOTH match a key BOTH fire — the key triggers two actions at once, no error. Ref: bz.rocks 2026-10-25 — `main.ts` opened the search overlay on ⌘K while `ai-chat.ts` toggled the chat on ⌘K, so pressing ⌘K opened BOTH the search AND the chat, and the FAB's "⌘K" label was a lie. The AUTHORITATIVE owner of a shortcut is its VISIBLE kbd/aria label — the search button showed ⌘/, the chat FAB showed ⌘K — so reconcile the CODE to the labels (search→⌘/ only, ⌘K→chat only), then guard with an E2E asserting each key opens its ONE surface and NOT the other. A VISUAL/interaction audit of the advertised shortcut catches this where a code read of a single module can't.) **The same class extends to two DISPLAY surfaces of the SAME concept with DUPLICATE rendering logic — improve one (a ranking, an affordance, a format) and the other silently keeps the OLD logic (no error, just stale). A VISUAL audit catches what a code/logic audit misses: the stale surface shows visibly different content. Fix: extract ONE function both call, and when you improve the canonical surface, sweep every sibling that renders the same thing IN THE SAME or a follow-up pass.** Ref: bz.rocks 2026-10-25 — the now-playing panel's tag strip had its OWN flatten-and-slice logic, so it kept showing raw-order near-universal tags (SACRED/MERCY) with no explore affordance while the hero chips had gained distinctiveness-ranking + tap-to-explore two fires earlier; a SCREENSHOT surfaced the mismatch → unified both on `topTagsFor`/`tagExplorable`. Cross-links `[[verify-against-source-of-truth]]` (visual modality catches rendering drift a logic pass misses).
- Dead feature flags (no code reads them)
- Dead routes (registered but unreachable / no callers)
- Dead feature folders (module exists, nothing imports it)
- Unused exports (no importers — run `knip`)
- Module missing a `README.md`
- AI-heavy feature missing eval / regression coverage

## Immediacy rule

- See drift → fix drift in the SAME turn. Never punted to a TODO or next PR. (TODOs for genuine future work are fine per `todos-are-roadmap`; ban is scoped to architecture drift.)
- If a drift fix needs a design conversation (rare), surface it in Recs; everything else ships inline.

## Per-repo enforcement

- Validators live at `tools/architecture-validation/`
- `pnpm validate:architecture` runs locally + in CI
- CI fails the merge on serious drift (missing manifest, unguarded route, untyped AI output, untyped tool)
- Cosmetic drift (missing README, unused export) warns; structural drift blocks

## Canonical implementation (projectsites.dev)

- `scripts/validate-feature-manifests.mjs` — asserts every module has all 7 manifest fields + colocated tests
- `scripts/validate-feature-drift.mjs` — asserts route↔flag↔manifest↔e2e↔FEATURES.md coherence, flags dead flags/routes/folders
- `.github/workflows/feature-architecture.yml` runs both on every push
- Copy these verbatim into every new emdash project; wire into `predeploy` + CI

## Build-artifact drift guards

Any artifact GENERATED at build (sitemap, RSS/JSON feed, service-worker precache list, robots.txt, OG/JSON-LD, icon manifest) silently drifts from its source-of-truth when a route/asset/file is added or renamed. **Every generated/curated artifact gets a build gate that re-derives or cross-checks it against its single source of truth, and fails the build on mismatch.**

### The rule

- **One source of truth per route/asset set**, imported by BOTH the app and every validator (Node ≥23 can `import` a `.ts` directly). No hand-maintained second copy.
- Write a gate that asserts coverage/validity, wired into the build chain. Exit 1 on drift.
- When a gate's class first bites, fix the instance AND ship the gate same turn (per `prompt-as-training-signal`).

### Reference guards (njsk.org, 2026-06)

- **sitemap ↔ route source** — `generate-sitemap.mjs` imports `pageMeta`, fails if any public SEO route absent from `STATIC_ROUTES`.
- **SW precache ↔ public/** — `validate-links.mjs` parses `sw.js` `STATIC_ASSETS`, asserts every asset-extension entry exists in `public/`.
- **JSON-LD structural** — `validate-jsonld.mjs` asserts each block has `@context` + `@type` + type-specific required fields (`HowTo→step`, `FAQPage→mainEntity`, `WebPage→name`, …).
- **route manifest ↔ worker soft-404** — shared `known-routes.ts` (`KNOWN_ROUTES` + `isKnownRoute`) imported by link validator AND Worker; unknown HTML paths return real 404 (not 200 soft-404).
- **SPA route ↔ manifest ↔ page-meta** — `validate-spa-routes.mjs` (one gate, two checks): every non-dynamic `KNOWN_ROUTES` entry needs a matching `app.tsx` `<Route>` (else the 200 shell renders the 404 page — a soft-404 on an indexed URL); every INDEXABLE entry needs a `page-meta` block (else wrong title/canonical/OG). A shared `NOINDEX_ROUTES` SSOT (also driving the worker noindex header) is the meta exemption, so the two can't drift. njsk.org `/grants` (no Route) + `/login` (no meta) shipped broken until caught.
- **fabricated-people** — `validate-no-fabricated-people.mjs` flags person-name paired with quote/testimonial lacking a `_confirmations.json` entry. See `copy-writing.md § Fabricated-people build gate`.

### Audit cadence

- Periodically curl/Playwright the LIVE artifacts: `sitemap.xml`, `feed.xml`, `robots.txt`, `site.webmanifest` (every icon/screenshot/shortcut/start_url resolves), `sw.js` precache, OG image dimensions (1200×630 ≤100KB), hreflang reciprocity. Built ≠ served-correctly.

## Scan cadence (before every new feature)

1. `pnpm validate:architecture` — confirm zero existing drift before adding more
2. Grep `libs/features/*/manifest.ts` — does the capability extend an existing module?
3. Grep `src/routes/` + `src/services/` for partial implementations to colocate
4. New capability → scaffold the full module; never scatter handlers in `routes/` without a module

## Agent drift signals

Owned by `agent-diversity-reviewer` role + `/drift-check` and `/agent-diversity-review` commands. Run on every multi-agent turn before DONE. Each is a merge-blocker when found.

- Too many generic agents — undifferentiated agents where named specialists exist
- Agents with overlapping scope — two agents touching same files / owning same concern
- Agents that do not verify their own work — no build / test / E2E / screenshot proof in report
- Agents that change files outside their stated scope
- Agents that skip tests — no failing-test-first, no regression spec, no `e2e/<feature>/` coverage
- Agents that ignore user stack preferences — drift from mandated stack
- Agents that fail to update docs — touched surface but left CLAUDE.md / README / `FEATURES.md` stale
- Agents that propose global changes but don't implement them
- Agents that make architectural changes without a review agent
- Agents that defer obvious in-scope work — push <2h ship-able items to Recs per `auto-integrate-recs`
