---
name: "content-seo"
description: "Copy + discoverability requirements every delivered app must meet — real-brand extraction, anti-slop voice, per-page SEO/JSON-LD, pSEO, GEO/AI-search, truth/citations, competitor floor, i18n, trust surfaces."
triggers:
  - "content"
  - "copy"
  - "seo"
  - "brand"
  - "blog"
priority: 2
pack: "content"
stage: stable
---

# Content & SEO — every app's copy + discoverability must satisfy

## Brand extraction (rebuilds / clients)

- Extract the REAL brand (logo, colors, fonts, tone; Wayback if the source is down). NEVER invent colors, never use Emdash defaults for clients, never infer from category.
- Colors derive from the logo (hue-distance verified). Logo luminance + source-site theme decide light/dark. Every logo render contrasts its container ≥4.5:1. Exactly ONE logo asset per container.

## Anti-AI-slop (mandatory scan)

- Banned words: delve, leverage, unleash, revolutionize, seamless, robust, synergy, elevate, empower, transformative, best-in-class, cutting-edge, discover, innovative.
- Banned patterns: "Welcome to", "Discover [product]", vague aspirational headlines, hedging ("may help"), generic superlatives. Test: "Would the founder actually say this?" — no → rewrite.

## Copy

- Headlines benefit-first, specific, ≤8 words. Subheads 15-25 words. Body one idea/paragraph, active, concrete. Max sentence 25 words. Flesch ≥60 (microcopy ≥70).
- CTAs: action-verb-first, ≤3 words preferred; never "Click here" / "Submit" / "Learn more". Above fold + page end.
- Microcopy: errors = [what happened] + [what to do]; empty states suggest the first action; toasts past-tense success / present in-progress.

## SEO — every page

- Title 50-60 chars keyphrase-first · meta description 120-156 · canonical · OG image 1200×630 · exactly one H1 in prerendered HTML.
- JSON-LD: WebPage floor; Org/BreadcrumbList/FAQPage/Person/Product/Service ONLY when the entity is real — never pad (FAQPage only with real FAQs).
- sitemap.xml (+lastmod) · robots.txt · llms.txt · humans.txt · security.txt.

## Blog & Reference Editorial Publishing (`@theme-tools/blog` — `skills/blog-publishing/SKILL.md`)

- **2,000+ Substantive Editorial Words (`D01–D03`, NON-NEGOTIABLE)**: Every newly authored or generated blog / reference article MUST contain **at least 2,000 substantive editorial words** (target range **2,000–3,000+ words**; navigation, bibliography, table cells, captions, code blocks, alt text, and boilerplate are excluded from `computeSubstantiveWordCount`). **Never settle for 600–900 word thin posts.** Historical imported articles preserve or expand their original length (`H28`).
- **8-Stage Editorial Pipeline & 12-Point Release Gate (`runQualityAndReleaseGate`)**: Topic Discovery (`15-idea topic strategy`) → Live DataForSEO v3 Brief (`isFixture: false`) → SSRF-Safe Evidence & Source Ledger (`SourceVersion` + `EvidenceReference`) → Argument Architecture & Outline → 2,000–3,000+ Word Plate/Slate Draft (`ValidatedPlateDocument`) → ~12 Substantive Visual Placements (`E01–E30`: custom images, deterministic SVG charts, comparison tables, interactive calculators, product captures) → Inline Claim-Level Citations (`CitationNode` `[n]` + bottom `BibliographyWidget`) → 12-Point Quality & Release Gate (`runQualityAndReleaseGate`) + 3 Daily Publishing Slots (`09:00`, `14:00`, `19:00` `America/New_York`).
- Always load and follow `~/.agentskills/skills/blog-publishing/SKILL.md` (and `references/editorial-writing.md`, `references/visual-production.md`, `references/dataforseo.md`, `requirement-manifest.json`) whenever planning, writing, auditing, or building `/blog` and `/blog/:slug`.

## pSEO (when used)

- 5 page types: integration · comparison · use-case · template · location. Each: unique H1 + meta + 1,500–2,000+ unique words + ≥1 unique image + ≥3 internal links + ≥1 outbound citation. Never templatize verbatim.

## GEO / AI search

- Quotable answer blocks (40-60 words). FAQPage schema. Every JSON-LD fact also appears as visible HTML. Lead paragraph answers the query in <40 words. EEAT: author bio + Person schema + `sameAs` + dated revisions + ownership.

## Truth & citations

- Every factual claim APA-cited to a real source. Never fabricate people, stats, timelines, or testimonials. Testimonials carry verifiable attribution.

## Reach

- Competitor floor: outscore the top 5-10 peer sites on every rubric dimension by ≥15% before "done".
- i18n by demographics: any community ≥10% local share (ACS B16001) gets a `/{locale}/*` mirror + hreflang.

## Required pages

- `/privacy` · `/terms` · `/accessibility` · About/Team with real bios.

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Domain Swarm Directive**: Generate per-route metadata, JSON-LD graphs, `sitemap.xml`, `llms.txt`, and research-backed editorial content in parallel waves using `opencode` (DeepSeek) workers.
- **Whole-change dispatch**. Apply `rules/openspec-change-ownership.md` and `rules/agent-provider-policy.md`. Assign each OpenSpec change one owner through verification. Route suitable bounded changes to OpenCode with DeepSeek through LiteLLM.
- **Architecture and verification**: Route material decisions through `rules/evidence-gated-autonomous-orchestration.md`. Its conference and risk gates govern provider selection and independence.
- **Reuse review**: Review reuse during implementation under `control-plane/RUNTIME.md`. Capture cited proposals for application code in `theme.tools`, host configuration in `install.doctor`, and agent guidance in `agent-skills`. Submit authorized findings to same-run OpenSpec admission.
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.

## Theme.tools ecosystem contract (required)

Before implementation, load `rules/theme-tools-skill-integration.md` from the agent-skills repository and the entry for this skill in `config/theme-tools-skill-map.json`. Apply catalog-first reuse, upstream contribution, thin-consumer adoption, UI-first theme.tools implementation and test-driven verification, and `.tools/telemetry` routing proportionally to this task.

- **DeepSeek-first parallel dispatch** At intake and after each dependency clears, dispatch independent OpenSpec changes concurrently whenever doing so reduces time to verified delivery. Delegate suitable whole OpenSpec changes to OpenCode with DeepSeek through LiteLLM when it meets the acceptance bar and improves throughput. Use Codex, Gemini, or Claude for work that benefits materially from premium capability or independent review, and record concrete reasons for premium routing or limited dispatch. Scale worker count to ready work, isolation, and approved capacity.
