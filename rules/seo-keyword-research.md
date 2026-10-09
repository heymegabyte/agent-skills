---
last_reviewed: 2026-10-08
superseded_by: null
name: "seo-keyword-research"
priority: 2
pack: "website-build"
triggers:
  - "keyword research"
  - "keyword"
  - "dataforseo"
  - "search volume"
  - "keyword difficulty"
  - "seo targeting"
paths:
  - "org:website_build"
---

# SEO Keyword Research

The 17-step pipeline from business objective → tracked, ranking page. One metrics source (DataForSEO), one primary keyword per intent per page, zero invented numbers. This is the §22 thought-loop step made operational.

Codifies `01-operating-system/architecture-thought-loop.md` § 22. The engine (Yoast checklist, pSEO, schema, internal-linking, keyword-to-page map) lives in `09-brand-and-content-system/seo-and-keywords.md` — reference it, don't restate. This rule owns **candidate → metrics → selection → ship → track** and the data-integrity discipline around it.

## Scope gate (fires FIRST)

- SEO targeting applies to **public, indexable SEO pages only** — marketing, blog, docs, pSEO, landing, `/`, `/pricing`, `/features`, `/services/*`, `/c/*`.
- **NEVER** apply keyword targeting, meta-keyword optimization, or SERP work to **private app routes** — authed dashboards, `/admin/*`, account settings, in-product surfaces, anything behind a login. Those are `noindex` and carry zero keyword obligation.
- Check the route's index posture before step 1. A route that isn't crawlable gets no keyword.

## Metrics source (HARD — one source, never invented)

- **DataForSEO is the sole source** of search volume, keyword difficulty, CPC, competition, SERP, and related-keyword metrics. MCP when wired (`dataforseo` server); REST (`api.dataforseo.com`) otherwise.
- Credentials resolve via `get-secret DATAFORSEO_LOGIN` + `get-secret DATAFORSEO_PASSWORD` (Basic auth) — **never printed, never committed, never hardcoded**. Pattern per `secret-provisioning.md`.
- **NEVER invent, estimate, round-for-convenience, or recall-from-memory a keyword metric.** Every volume / difficulty / CPC number traces to a DataForSEO response captured this run. No source → the number does not exist → the keyword is `unverified` and cannot be selected as primary.
- Missing credentials or a failed call is a **blocker, not a license to guess** — surface it, resolve the secret, re-run. Google Autocomplete (free, keyless, per the engine skill) may seed candidates but produces NO metrics — it never substitutes for DataForSEO on volume/difficulty.
- Persist raw responses to `_keywords/{route-slug}.dataforseo.json` (gitignored) so every selected keyword cites a captured response.

## The 17 steps

1. **Business objective** — what this page must achieve (signup / lead / sale / inform / rank-for-authority). The objective, not the prettiest keyword, drives selection.
2. **Audience** — who searches, their vocabulary, their stage. Jargon vs plain language is an audience fact, not a guess.
3. **Topics** — the 3-7 topic clusters this page legitimately covers. No topic the page won't actually deliver.
4. **Keyword candidates** — seed from product per the engine skill § Step 1, expand via Google Autocomplete + DataForSEO related-keywords. 20-50 candidates → `_keywords/{route-slug}.candidates.json`.
5. **Intent** — classify each candidate: informational / navigational / commercial / transactional. Intent must match the page's objective (step 1) — a transactional page does not target an informational query.
6. **SERP competitors** — pull live SERP per candidate via DataForSEO; record who ranks top-10 + their content shape. Cross-ref `competitor-research.md` (same competitor set when it exists).
7. **Metrics** — attach DataForSEO volume + difficulty + CPC + competition to every candidate. This is the ONLY step that mints numbers, and ONLY from a captured response (see § Metrics source).
8. **ONE primary keyword per intent per page** — select exactly one primary (1-4 words, achievable difficulty, objective-matched, `verified` metrics). One page may hold one primary **per distinct intent** it genuinely serves — never two primaries for the same intent, never the same primary on two pages.
9. **Supporting terms** — 2-3 related/longtail per primary (lower competition, semantic variations, PAA questions). Modifier-stacking per the engine skill § Longtail.
10. **Cannibalization check** — diff the proposed primary against the existing keyword-to-page map (engine skill § Keyword-to-Page Map). A primary already owned by another page = **reject + reassign** (merge, re-intent, or pick a distinct primary). No two pages compete for the same primary.
11. **Content requirements** — derive from SERP (step 6) + intent (step 5): required sections, questions to answer, word-count floor, entities to cover, the 40-60 word quotable answer block per `copy-writing.md` § GEO.
12. **OpenSpec** — for a new page or a material re-target, capture the keyword decision as an OpenSpec change (`openspec-propose`): primary + intent + supporting + content requirements + the success metric. The spec is the contract; the write implements it.
13. **Write** — produce copy per `copy-writing.md` (Flesch ≥60, anti-slop, servant framing). Keyword in first 100 words, natural density 0.5-3%, never stuffed. Content-first per thought-loop § 21.
14. **Metadata + internal links** — title (50-60, keyword-first), meta description (120-156, CTA), URL slug, alt text, canonical — all from the primary. Add 2-3 internal links with keyphrase-variation anchors; update the keyword-to-page map.
15. **Verify render + structured data** — page renders, exactly one H1, JSON-LD validates (Google Rich Results Test), accurate schema types only — FAQPage ONLY with real FAQs, never padded (per `always.md` + `copy-writing.md`). Run `seo-auditor`.
16. **Publish** — deploy + prod-verify the live route per the deploy mandate (fetch the URL, assert title/H1/meta/JSON-LD live). Local build ≠ shipped.
17. **Track** — register the primary in Google Search Console; log baseline position + impressions. Re-pull DataForSEO + GSC on a cadence; a page stuck at position >10 with impressions >10 is a re-target signal (step 1 again), not a one-and-done.

## Selection matrix (step 8 shorthand)

| Slot | Rule |
|---|---|
| Primary | 1 per intent, objective-matched, achievable difficulty, `verified` metrics, unique across site |
| Supporting ×2-3 | lower competition, commercial/informational mix, semantic + PAA |
| Reject | duplicate primary (step 10), intent-mismatch (step 5), or `unverified` metrics (step 7) |

## Integrity invariants

- Every selected primary cites a captured DataForSEO response. No citation → not selectable.
- No keyword metric is ever authored by the agent — only read from DataForSEO.
- No two public pages share a primary keyword (cannibalization gate, step 10).
- Private/`noindex` routes carry no keyword (scope gate).
- Schema accurate-only: never fabricate FAQPage/Review/HowTo to chase a snippet (`always.md`).

## See also

- `09-brand-and-content-system/seo-and-keywords.md` — the SEO engine (Yoast checklist, pSEO, schema, keyword-to-page map, API stack). This rule feeds it.
- `competitor-research.md` — SERP-competitor set + per-dim SEO floor; share the competitor list at step 6.
- `copy-writing.md` — the voice + anti-slop + GEO/quotable-block rules the write (step 13) obeys.
- `citations.md` — sourced-facts discipline for long-form copy.
- `agents/seo-auditor.md` — the per-page + site-wide audit run at step 15.
- `secret-provisioning.md` — how `get-secret` resolves the DataForSEO credentials.
