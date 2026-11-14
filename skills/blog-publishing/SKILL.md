---
name: "blog-publishing"
description: "Shared research-driven editorial and blog publishing system for the Megabyte Labs ecosystem (@theme-tools/blog, ui.theme.tools, and adopting Cloudflare Workers sites). Activate when generating, researching, citing, illustrating, editing in Plate/Slate, or scheduling 2,000–3,000+ word reference articles with live DataForSEO v3 keyword intelligence, claim-level citations, 30 visual applications (E01–E30), and 3 daily publishing slots."
triggers:
  - "blog-publishing"
  - "research blog"
  - "dataforseo blog"
  - "plate authoring"
  - "daily publishing slots"
  - "reference article"
priority: 1
pack: "content"
stage: stable
---

# Shared Research-Driven Blog Publishing (`@theme-tools/blog`)

Canonical skill for producing, verifying, rendering, and authoring reference-grade editorial articles across the Megabyte Labs ecosystem (`theme.tools`, `ui.theme.tools`, and adopting site repositories).

## Ownership & Package Boundaries

- **Shared Package (`@theme-tools/blog` in `theme.tools/packages/blog`)**: Owns the 14 Zod v4 contracts (`./schema`), 15-idea topic strategy (`./topic-strategy`), DataForSEO v3 client and capture validator (`./dataforseo`), SSRF-safe evidence & citation ledger (`./evidence`), 30 visual applications `E01–E30` (`./visuals`), shared editorial components (`./components`), zero-editor-runtime static HTML renderer (`./renderer`), lazy-loaded Plate/Slate authoring shell (`./editor`), 9-stage editorial workflow & 12-check release gate (`./workflow`), 3-slot scheduler (`./publishing`), RBAC & OAuth/magic-link security (`./auth`), analytics (`./analytics`), and legacy MDX/HTML migration (`./migration`).
- **Component Workshop (`ui.theme.tools` / `apps/ui`)**: Documents and exercises all shared blog components and adversarial edge-case fixtures (`stories/BlogComponents.stories.tsx`) across light and dark themes.
- **Adopting Site Repository (`apps/web`)**: Owns tenant editorial charter, `/blog` and `/blog/:slug` routes, Cloudflare Worker edge metadata/JSON-LD injection, RSS/sitemap generation, and role-gated lazy loading of `LazyPlateEditor`.

## Non-Negotiable Operational Defaults

1. **Three Daily Publishing Slots (Per Configured Site)**: Default schedule is `09:00`, `14:00`, and `19:00` in `America/New_York` (DST-aware UTC conversion via `resolveLocalSlotToUtc`), backed by a minimum 6-article release-eligible ready buffer (`I01–I06`). Never multiply slots across unconfigured domains.
2. **2,000+ Substantive Editorial Words (`D01–D03`)**: Every new generated article must contain at least **2,000 substantive editorial words** (normally `2,000–3,000`, or `>3,000` when depth warrants). Navigation, bibliography, table cells, captions, code blocks, alt text, and boilerplate are excluded from `computeSubstantiveWordCount`. Historical imported articles preserve their original length (`H28`).
3. **~12 Substantive Visual Placements (`E01–E30`)**: Plan approximately 12 distinct visual placements (typically 8–12 approved custom images plus deterministic charts, comparison tables, interactive calculators, and authentic product captures). Never count crops or decorative dividers as original visuals.
4. **Live or Valid Cached DataForSEO v3 Brief (`B01–B30`)**: Production release requires a verified `DataForSeoProviderCapture` (`isFixture: false`). Fixture briefs permit local development and draft authoring but are hard-blocked by `runQualityAndReleaseGate` (`check #3`). Treat keyword density strictly as an editorial diagnostic (`0.4%–2.2%`), never a mechanical stuffing target.
5. **Claim-Level Evidence & Citations (`C01–C30`)**: Every externally verifiable factual, numerical, benchmark, or pricing claim must map to an inspected `SourceVersion` and `EvidenceReference` via an inline `CitationNode` (`[n]`) linking to the bottom `BibliographyWidget`.
6. **Documented Review Policy (`I15–I17`)**: Scheduled publishing requires an approved `ReviewRecord` matching the site's `ReviewPolicy` (`human_batch`, `automation_assisted`, or `authorized_autonomous`) bound to the exact `contentHash`, `bibliographyHash`, and `visualSetHash`.
7. **Authentication vs. Authorization (`G04–G05`, `K01–K11`)**: Sign-in via Google, GitHub, or email magic link identifies a user; only active site members with `author`, `editor`, `publisher`, or `owner` roles see the prominent `+ New article` homepage button or load the Plate/Slate editor chunk.

## Mandatory 9-Stage Workflow for Every Article

Execute these stages in order and persist stage transitions in `EditorialWorkflowLedger`:

1. **Stage 1 — Charter & Budget Hydration**: Load `SiteEditorialCharter`, existing inventory, and `MicroUsdBudgetManager` remaining daily/monthly micro-USD cap.
2. **Stage 2 — 15-Idea Research Slate**: Propose 15 distinct article candidates (`IdeaCandidateSchema`) with reader problem, search intent, original contribution, evidence sources, visual opportunities, and overlap metrics. Rank via `computeWeightedEditorialScore` and persist the decision record (`A07–A10`).
3. **Stage 3 — Overlap Check & Atomic Reservation**: Check candidate #1 against published, draft, scheduled, and reserved topics (`evaluateCandidateOverlap`). Fall back to candidate #2..#15 if blocked, and atomically reserve via `AtomicTopicReservationStore` (`A11–A14`).
4. **Stage 4 — DataForSEO v3 Keyword & SERP Brief**: Query DataForSEO Labs (`keyword_suggestions`, `related_keywords`, `bulk_keyword_difficulty`, `search_intent`—omitting `location_code` on `search_intent` per `B08`) and live Google Organic SERP (`B09–B10`). Build a `KeywordBrief` via `buildVerifiedDataForSeoBriefFromCapture`.
5. **Stage 5 — Primary Evidence & Claim Ledger**: Fetch primary sources through `validateSafeExternalUrl` (SSRF guard) and `sanitizeRetrievedPassage` (prompt-injection stripping). Record immutable `SourceVersion`, `EvidenceReference`, and `ClaimRecord` entries.
6. **Stage 6 — Visual Plan (`E01–E30`)**: Plan ~12 visual placements across the 30 cataloged visual applications (`VISUAL_APPLICATION_CATALOG`), pairing custom brand art briefs (`createBrandArtBrief`) with deterministic `FiniteChart`, `ComparisonTable`, `CalculatorBlock`, and authentic captures.
7. **Stage 7 — Canonical Plate Document Authoring**: Write the 2,000–3,000+ word article directly as a `ValidatedPlateDocument` with `CitationNode` inline links, TL;DR answer card, worked examples, failure modes, and bottom `BibliographyWidget`.
8. **Stage 8 — 12-Point Release Gate**: Run `runQualityAndReleaseGate` to verify schema validity, `>= 2,000` substantive words, non-fixture DataForSEO freshness, 100% claim/citation resolution, visual completeness, anti-slop writing quality, metadata parity, accessibility, and `ReviewRecord` digest match.
9. **Stage 9 — Slot Assignment & Atomic Publish**: Claim the next `America/New_York` slot (`09:00`, `14:00`, `19:00`), switch the immutable `publishedRevisionId` pointer atomically, run post-publish smoke checks, and emit sitemap/RSS updates.

## Progressive-Disclosure References

Load only the reference file needed for your active stage:

- [`references/topic-selection.md`](references/topic-selection.md) — 15-idea slate prompt, weighted scoring formula, overlap thresholds, and atomic reservation (`A01–A30`).
- [`references/dataforseo.md`](references/dataforseo.md) — DataForSEO v3 endpoint payloads, `search_intent` schema rules, SERP overlap clustering, caching TTLs, and micro-USD cost tracking (`B01–B30`).
- [`references/evidence-and-citations.md`](references/evidence-and-citations.md) — URL canonicalization, SSRF & prompt-injection guards, claim ledger schema, inline `[n]` citations, and bibliography rendering (`C01–C30`).
- [`references/editorial-writing.md`](references/editorial-writing.md) — 2,000+ substantive word counter exclusions, anti-padding & anti-slop rules, section rhythm, and E-E-A-T disclosures (`D01–D30`).
- [`references/visual-production.md`](references/visual-production.md) — Catalog of all 30 visual applications (`E01–E30`), brand art briefs, model tier routing, chart accessibility, and authentic captures (`E01–F30`).
- [`references/plate-authoring.md`](references/plate-authoring.md) — Canonical Plate/Slate node schemas, custom blocks, `+ New article` homepage button, lazy-loading boundary, and optimistic concurrency (`G01–H30`).
- [`references/publishing-operations.md`](references/publishing-operations.md) — Three daily slots (`09:00`, `14:00`, `19:00 America/New_York`), 6-article buffer, RBAC matrix, OAuth/magic-link security, budgets, and rollbacks (`I01–K30`).
- [`references/examples.md`](references/examples.md) — Golden 2,000+ word reference article specification vs. rejected padding/unverified-claim counterexample (`L10–L11`).
- [`requirement-manifest.json`](requirement-manifest.json) — Complete 360-item (`A01–L30`) machine-readable requirement trace.

## Cross-Linked Canonical Skills (`L14`)

- Brand voice, anti-slop copy, and baseline SEO floors: [`../23-content-seo/SKILL.md`](../23-content-seo/SKILL.md) and [`../09-brand-and-content-system/SKILL.md`](../09-brand-and-content-system/SKILL.md)
- Design tokens, OKLCH contrast, and component states: [`../10-experience-and-design-system/SKILL.md`](../10-experience-and-design-system/SKILL.md)
- Site generation & Cloudflare Workers deployment: [`../15-site-generation/SKILL.md`](../15-site-generation/SKILL.md) and [`../06-build-and-slice-loop/blog-and-content-engine.md`](../06-build-and-slice-loop/blog-and-content-engine.md)
