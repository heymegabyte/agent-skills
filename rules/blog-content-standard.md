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

## Universal minimum — EVERY blog page, EVERY project (Brian 2026-11-10)

This rule is the GLOBAL floor for any blog page the estate produces — every project, not one repo's
CLAUDE.md. It loads on every `blog` / `article` / `content` prompt; project `CLAUDE.md` + any
`content-policy.json` MIRROR it, never redefine it. The standard MINIMUM for any substantive blog
article/guide/feature:

- **2000+ words** of substantive editorial prose (features / evergreen guides 2000–3000). Only genuine
  SHORT formats — a news brief, a software profile, a glossary entry — keep their own concise contract
  and are NEVER padded to hit the count (padding/duplication is a hard fail).
- **Real keyword research via DataForSEO** before writing (search intent + a primary keyword + a
  persisted `research/<slug>.json` record). No creds → the research gate is `blocked`, never fabricated
  metrics, never a keyword-density quota.
- **Tons of theme.tools widgets — and ROTATE the FULL catalog.** ≥10 widget instances across ≥6 types
  from `@theme.tools/blog` (`/widgets` + `/media`), but DO NOT reuse the same few every article: sample
  BROADLY + semi-randomly across the whole catalog (comparison · decision-matrix · timeline · steps ·
  checklist · stat-cards · pros-cons · glossary · callout · takeaways · annotated-figure · featured ·
  image-gallery · video-browser · …) so articles never look samey and every widget earns exercise. Each
  widget is chosen because it genuinely presents THIS material better — never to hit a count, never an
  empty wrapper.
- **Tons of official, high-quality images from the internet.** Real licensed imagery is the PRIMARY
  richness driver (not merely a fallback): pull MANY genuinely-relevant official/press/product/doc
  images — CC0 / public-domain / royalty-free / explicitly-licensed ONLY, downloaded + SELF-HOSTED
  (never hotlinked), each with recorded license + source URL + author + date + attribution where
  required. Fill to the 6–8 visual floor (features/evergreen ≥10) via the v1.2.0 sourcing ladder below.
- **Real screenshots where relevant.** When the piece discusses an actual UI/CLI/output, use a REAL
  screenshot (captured, provenance recorded) — never a fabricated or AI interface labelled as a
  screenshot.
- **A YouTube video widget.** A `@theme.tools/blog/media` `renderVideoBrowser` (≥2 tabs × ≥4 REAL
  oembed-verified videos, privacy-facade, our own channels periodically) on every substantive article.
- Everything above is the FLOOR, enforced by the deterministic validator — not aspiration. Missing a
  required external credential (DataForSEO, image-gen, a provider) → that gate reports `blocked` with
  the exact missing key; unrelated gates still apply. Honesty from v1.0–v1.2 is preserved verbatim.

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

<!-- grow-ok: v1.2.0 adds the multimedia sourcing ladder + 6–8 visual floor (Brian directive 2026-11-10) -->

## v1.2.0 additions (Brian 2026-11-10) — more multimedia, a 6–8 visual FLOOR + a sourcing LADDER

- **Every article carries MORE multimedia.** The floor is **≥6–8 distinct visuals on EVERY article**
  (not only flagship features); flagship features + substantial evergreen guides still target **≥10**.
  A thin 1-image post is below standard — bring it to the floor.
- **Sourcing LADDER (prefer high up; fill down; honesty-gated at every rung):**
  1. **High-relevance licensed REAL imagery from web search** — prefer genuinely-depictive photos/
     imagery (the "90%+ relevance" bar: it actually shows the subject). HARD gates: only CC0 /
     public-domain / royalty-free / explicitly-licensed-for-use; **download + self-host** it (never
     hotlink); record license + source URL + author + date as provenance; attribute where the license
     requires. An image whose license you cannot verify is NOT usable — drop it.
  2. **AI-GENERATED via an authorized creation API** — fill to the floor when real imagery is thin.
     Preferred generator = **Cloudflare Workers AI image models** (`@cf/black-forest-labs/flux-1-schnell`
     / `flux-2-dev`) via the CF global key — CF-native, no third-party key, always available WHEN the CF
     key is present. **OpenAI GPT Image 1.5** (OpenAI's current image model) only where an `OPENAI_API_KEY` is genuinely authorized
     for this product (a platform-billed product feature, never an internal-dev key). Label AI output as
     illustration; it must NEVER masquerade as a screenshot/chart/benchmark/factual evidence.
  3. **Deterministic brand SVG diagrams / infographics** — FIRST-CLASS and often PREFERRED for technical
     / data / conceptual content (the Linear/Stripe approach): the three-layer model, a 3-2-1 rule, a
     recovery matrix, a flow. Authored as code, no credential, perfectly crisp, honest (a diagram, not a
     fake screenshot). These COUNT toward the 6–8 floor. For a technical how-to, several precise brand
     diagrams beat stock photos.
- **Honesty (non-negotiable, every rung):** each visual is real + resolves + renders + has alt + a
  caption + recorded provenance; dedupe variants to one. **No generic/cheesy stock. No unlicensed
  hotlink. No fabricated/placeholder/unresolved URL. No AI-as-screenshot.** If a REQUIRED generation has
  **no credential**, that article's image gate is **`blocked`** with the exact missing key — never a
  fake success, never an invented asset. (Reference: desktop.management, 2026-11-10 — no image-gen
  credential in-env, so a backup guide was brought to 7 visuals with deterministic brand SVG diagrams,
  and the ladder was recorded here for when web/AI sourcing is credentialed.)
- **Per-format floors (reconciles the numbers above):** feature / evergreen guide **≥10**; standard
  article / how-to guide **≥6–8**; brief / software-profile / glossary = their own concise contract (do
  NOT pad a brief to feature length — the floor is a quality bar for substantive articles, not a quota
  for reference entries).

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
