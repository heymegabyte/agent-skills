---
last_reviewed: 2026-10-06
superseded_by: null
name: ai-search-knowledge-fabric
priority: 1
pack: ai
triggers: ["ai search","knowledge","rag","research corpus","requirements","competitor research","agent memory"]
paths: ["concern:ai-features"]
---

# AI Search Knowledge Fabric

Cloudflare AI Search is the managed retrieval layer for durable knowledge agents repeatedly need. It complements Git/grep/Serena for exact code, D1/Postgres for transactional state, and MCP/APIs for live state/actions.

## Top 20 integrations

1. Agent-skill retrieval — canonical skills/rules/commands, retrieved on demand.
2. Requirements/decision retrieval — SPECs, requirement graphs, ADRs, decisions and acceptance criteria.
3. Per-project/site knowledge — business facts, FAQs, operator notes, canonical content.
4. Whole-site research corpora — normalized crawl Markdown/JSON.
5. Deployment receipts + production evidence — commit, prod URL, tests, Browser Run findings, rollback ID.
6. Incident/fix memory — signatures, root causes, successful fixes, failed attempts, regression tests.
7. Competitive intelligence — feature harvests, pricing snapshots, UX observations with provenance.
8. Accepted agent learning — reviewed patterns, rejected approaches, eval winners, durable preferences.
9. Internal Cloudflare/ProjectSites runbooks — local operating knowledge; official current CF facts still come from official Cloudflare skills/MCP first.
10. SEO/local-search knowledge — clusters, service/location/entity research, content gaps.
11. Model/provider evaluations — cost/latency/quality/failure summaries by workload.
12. Architecture/code maps — generated module/API/dependency summaries, not every source file.
13. MCP/tool recipes — successful multi-tool playbooks and capability summaries.
14. Design-system knowledge — tokens, component guidance, visual QA/accessibility lessons.
15. Analytics insight memory — durable summaries of PostHog/GA/Sentry/AI Gateway trends.
16. Customer/user voice — privacy-scoped feedback themes, requests, objections and churn reasons.
17. Content corpus — approved brand voice, existing pages, canonical claims/media metadata.
18. Onboarding/runbooks — environment facts and known service-specific traps.
19. Artifact catalog — summaries/metadata for reports, screenshots, recordings, crawls and evals in R2.
20. Cross-project pattern library — sanitized reusable product/engineering lessons.

## First wave: implement #1–#8

These have the highest leverage on quality and repeated-context cost.

### Skills

Normalize `SKILL.md`, `rules/*.md`, `commands/*.md` and compact compiled context into R2, then index with AI Search. Retrieve the few relevant instructions before expanding a large task. Keep priority/supersession metadata.

### Requirements

Index SPECs, requirement graphs, ADRs, architecture docs, active roadmap facts and acceptance criteria. Retrieve before architecture/completeness judgments.

### Per-project/site knowledge

Prefer one AI Search instance per tenant/site where data is private or lifecycle isolation matters. Shared indexes require strong metadata filtering. Never rely on prompt text alone for tenant isolation.

### Research

Whole-site crawler → normalized Markdown/JSON → R2 → AI Search. Store canonical URL, crawl timestamp, provenance/hash and extraction confidence. Re-crawl only when stale.

### Deploy evidence

After each deploy, write a compact evidence record with repo/commit, production URL, changed surfaces, tests, Browser Run console/network/visual findings, rollback identifier, failures/fix-forward and final status.

### Incidents

Index compact reviewed incident records, not sensitive raw logs: signature, component, root cause, successful fix, failed attempts, test added, version/date and links to evidence.

### Competitive intelligence

Every crawl/teardown becomes queryable. Store source URLs and capture date. Separate observation from recommendation.

### Accepted learning

Automatic learning = proposal → evidence/review → accepted knowledge. Never silently mutate doctrine from raw agent scratch work.

## Query contract

1. Live operational state? → source/MCP/API.
2. Exact source-code behavior? → Git/grep/Serena.
3. Durable unstructured history/research/knowledge? → AI Search.
4. Transactional/customer state? → D1/Postgres/CRM; AI Search may hold safe summaries.
5. Freshness uncertain? → inspect source timestamp and refresh if stale.

## Metadata

Stable high-value metadata:
- `tenant`
- `project`
- `kind` = skill | requirement | research | incident | deploy | learning | content | design | seo | eval
- `version`
- `status` = active | superseded | accepted | draft | archived

Preserve source/provenance on every result.

## Storage / ingestion

- R2 is the preferred durable document source.
- Keep canonical originals and index normalized text/Markdown.
- Content-address normalized documents.
- Reindex on source change, not every query.
- Partition large crawls by project/site and time.
- Tenant deletion must remove source documents and associated index scope.

## Agent pattern

```
goal
→ classify knowledge need
→ scoped AI Search
→ authoritative live lookup where needed
→ reason/tools
→ evidence
→ accepted durable learning → R2 → AI Search
```

Expose AI Search through Worker bindings for Cloudflare-hosted agents, AI Search MCP for coding agents, and ProjectSites MCP when it owns the knowledge object.

## Quality rules

- Important work: 2–4 complementary searches, then deduplicate.
- Prefer active/current over superseded.
- Keep provenance/citations.
- Weak retrieval → use live source search rather than guess.
- Measure retrieval hit rate, useful-context ratio, stale-hit rate, answer quality and token savings.

## Serving + measuring for AI search (GEO, site-side)

The complement to the agent-retrieval fabric above: how OUR shipped sites get read + cited by AI engines (added 2026-10-25, estate-upgrade audit — `[[estate-upgrade-audit]]`). Pairs with `[[website-build-doctrine]]` GEO + `[[seo-keyword-research]]`.

- **CF Markdown-for-Agents (edge content-negotiation) — prefer over static `llms.txt`.** Serve clean Markdown when a client sends `Accept: text/markdown`; Cloudflare converts HTML→MD at the edge (~80% fewer agent tokens), no per-page `.md` files, no `/llms-full.txt` to regenerate. CF-native, zero template churn. Keep a minimal `llms.txt` as a cheap, low-confidence experiment (studies show ~0.1% of AI-bot hits target it, and its main consumer is coding agents, not answer engines) — don't invest heavily in it.
- **Structure for extraction:** lead each section with a **40–80-word direct answer**; lists/quotes/stats correlate with 30–40% higher AI-answer visibility; attach a source+date+number to every claim; cover **query fan-out** (the sub-queries an engine decomposes into); own in-category "best-of"/comparison pages.
- **MEASURE GEO, don't just optimize:** track **AI Citation Rate** (pages cited ÷ tracked), **Response Inclusion Rate**, **Share-of-Voice** across AI platforms, citation sentiment, and **AI-referred traffic** (GA4 attribution). Feed to `[[qualified-traffic-attribution]]`. Traditional rank tools miss these signals.

## Never index

Secrets/tokens/passwords/private keys/cookie jars, OAuth tokens, unnecessary customer PII, hidden chain-of-thought, raw sensitive logs, or speculation presented as fact.

AI Search is not a relational DB, secret store, authorization system, exact code search replacement, or excuse to load more context.
