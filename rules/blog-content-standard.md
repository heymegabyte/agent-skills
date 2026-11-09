---
last_reviewed: 2026-11-08
superseded_by: null
name: "blog-content-standard"
priority: 2
pack: "content"
triggers:
  - "blog"
  - "article"
  - "content policy"
  - "word count"
  - "blog images"
  - "blog widgets"
---

# Blog Content Standard (machine-readable policy — the SSOT every blog path loads)

Every blog article is governed by ONE versioned, machine-readable contract:
`reference/blog-content-policy.json` (this repo). Generators, validators, editors, and publishing
gates MUST load it BEFORE writing or shipping — never a self-declared `compliant:true` flag.
Validation is deterministic, against structured content + rendered output + sidecar records.
(Brian 2026-11-08.)

## The contract (v1.0.0 — see the JSON for exact thresholds)

- **Length** — 2000–3000 words of SUBSTANTIVE editorial prose. Count deterministically; EXCLUDE
  frontmatter, nav, metadata, code listings, image alt, captions, widget labels, hidden text,
  boilerplate. Never pad or duplicate to hit the count.
- **Research** — a real DataForSEO record per article (`research/<slug>.json`: primary + secondary
  keywords, location, language, intent, date, returned metrics, provider-response ref, rationale).
  NEVER fabricate metrics or claim research that didn't run. No creds → the gate reports `blocked`
  (environmental), NOT `pass` and NOT a silent skip.
- **Images** — ≥10 DISTINCT, successfully-generated AI images (1 hero + ≥9 supporting), each exists +
  loads + appears + has alt + caption + provenance (prompt/provider/assetId). Dedupe variants/crops/
  responsive to ONE. Prompts/placeholders/unresolved URLs do NOT count. Illustrative AI imagery must
  not masquerade as a screenshot/chart/factual evidence.
- **Widgets** — ≥8 substantive content-widget instances spanning ≥5 types, from the shared
  `@theme.tools/blog` package (`@theme.tools/blog/widgets`). Basic typography / nav / empty wrappers /
  repeated generic widgets don't count. A missing reusable widget is IMPLEMENTED in theme.tools (+
  Storybook) and consumed via the package — never invented import paths.
- **Structure/GEO** — single H1 · 40–80-word answer capsule under the first H2 · ≥40% question
  headings · ≥1 sourced stat per ~200 words (every stat cited) · FAQ · ≥1 comparison table · early
  internal link + ≥1 external link · objective voice.
- **Metadata** — title 50–60 chars with a number/year · description 120–156 · one canonical ·
  BlogPosting+Person+Organization+BreadcrumbList JSON-LD · OG image · indexable · truthful dates.
- **Anti-inflation** — no hidden text, no duplicate passages (unique-sentence ratio ≥0.9), no
  placeholders/slop, no fabricated people/quotes.

## v1.1.0 additions (Brian 2026-11-09) — immaculate art · featured image · video browser · tons of components

- **Immaculate bar** — every post must visibly SUPERSEDE the best competitor article on the topic. Custom
  brand graphics or real photography, NEVER generic/cheesy stock. Every sentence earns its place.
- **Featured image** — a gorgeous featured image that DOUBLES as the blog-index thumbnail + the OG image
  (≥1200px wide) and also appears in the article. It is one of the ≥10 images.
- **Image source preference** — prefer TONS of relevant REAL photography / licensed web imagery; fall back
  to AI-generated; custom deterministic brand graphics (SVG) are first-class where superior to stock (the
  Linear/Stripe approach for technical content). Never generic stock, never fabricated/unlicensed hotlinks.
  No image-gen/stock/photo credential available → use custom brand graphics + report the exact unblock.
- **Tabbed video browser** — a `@theme.tools/blog/media` `renderVideoBrowser` with ≥2 tabs × ≥4 real videos,
  privacy-facade (poster → click → youtube-nocookie, no autoload, no tracking). **REAL oembed-verified IDs
  ONLY** (`https://www.youtube.com/oembed?url=…` returns 200 for a real video — NO API key needed); INCLUDE
  our own channels periodically (Open-Source Wizardry / Install Doctor · bZ · Megabyte Labs). No verifiable
  video → omit, never fake.
- **Tons of components** — **≥10 widget instances across ≥6 types** (was ≥8/≥5) from `@theme.tools/blog`
  (`/widgets` + `/media`): comparison · timeline · steps · stat-cards · pros-cons · glossary · callout ·
  takeaways · featured-image · image-gallery · video-browser · …

## Supersedes (older conflicting targets — RETIRED)

- `blog-autopublish` 1500-word floor / 1800 cornerstone → **2000–3000** band.
- `blog-autopublish` "1 hero + 8 inline + 1 infographic" → **≥10 distinct** (de-duplicated).
- ALL OTHER documented requirements (DataForSEO, Yoast 3-band, citations, image-provenance,
  internal-linking, no-fabricated-people, GEO/AEO) are PRESERVED and folded into the JSON.

## How an agent loads + verifies the policy (mandatory workflow)

1. Load `reference/blog-content-policy.json` before writing (its thresholds are authoritative).
2. Research the keyword via the configured DataForSEO integration; persist the record. No creds →
   STOP that article at the research gate honestly (never fabricate).
3. Write 2000–3000 words; place ≥8 `@theme.tools/blog` widgets across ≥5 types; generate + persist
   ≥10 images with provenance; add the GEO structure + metadata.
4. Run the deterministic validator against the RENDERED output + sidecars; publishing is REJECTED on
   any `fail`. Re-validate whenever content or assets change (an old pass can't authorize a new revision).

## Enforcement is deterministic, format-agnostic, and gate-wired

- Validate the RENDERED HTML + sidecar records (research, image provenance), NOT the source — so the
  same gate holds whether the source is Markdown or a PlateJS/ArticleDocument CMS.
- Wire the validator into EVERY publishing entry point (build, deploy, scheduled generator, manual
  flow, CMS/editor save). Reference impl: desktop.tools `apps/web/scripts/validate-content.ts`
  (+ `policy/content-policy.json` mirror + drift guard + 22 regression tests proving each violation
  class fails). Project-local, documented `grandfather` exceptions keep existing pages live until
  their compliant replacements pass — surfaced loudly, never a silent pass.

## Cross-links

`blog-autopublish` + `yoast-seo-compliance` skills (operative generators — reconcile their numbers to
this policy) · `[[seo-keyword-research]]` (DataForSEO) · `[[image-quality]]` · `[[citations]]` ·
`[[blog-post-doctrine]]` · `[[drift-detection]]` (a publishing path that skips the gate is drift) ·
`[[verify-against-source-of-truth]]` (validate real output, never a declared count) ·
`reference/blog-content-policy.json` (the machine-readable SSOT).
