# MISSION — Autonomous Keyword Research Agent

Source of truth for the `/loop` convergence driver. Condensed-but-complete from the
original assignment (2026-10-10). Faithful to every hard requirement, DoD, and guardrail.

## Goal

Ship an operational, reusable keyword-research capability integrated into the
`heymegabyte/agent-skills` system — not a prototype, plan, or doc dump.

## Allowed providers (NO others — never add Ahrefs/Semrush/Serper/Tavily/KeywordsEverywhere)

1. **DataForSEO v3 REST** — primary: keyword discovery, volume, organic difficulty,
   competitor keywords, SERPs, Google Trends. API password ≠ dashboard password.
2. **Google Search Console** — first-party impressions/clicks/CTR/position. OAuth 2.0,
   scope `https://www.googleapis.com/auth/webmasters.readonly` (read-only), offline access.
3. **Google Trends** — official API if authorized, else via DataForSEO Trends Explore,
   else report unavailable + continue. Interest index ≠ absolute volume.
4. **Exa** — competitor/source/topic research + content differentiation. NOT a source of
   numeric volume/difficulty.
5. **Existing tools** — Firecrawl/Playwright only where already authorized + additive.
6. **Cloudflare** — Workers, D1, R2, Queues, Cron, Workflows(only if real benefit), Access.

Agent infra to preserve: Claude/Codex subscription auth, OpenClaw/Claw Router, OpenCode+DeepSeek,
existing routing/skill-packs/model-routing/MCP/commands, `/run-the-loop` precedence, Infisical/CF/local secrets.
NO OpenAI/Anthropic pay-as-you-go for internal reasoning. Workers = deterministic provider I/O;
local subscription CLIs = reasoning/content. Never launch CLI sessions inside Workers; never route CLI through AI Gateway.

## §2 Existing corrections (doctrine fixes — pure markdown)

- Replace hardcoded DataForSEO pricing → read actual account pricing + per-request cost accounting.
- Do NOT auto-pick highest-volume keyword per page.
- Distinguish PAID competition from ORGANIC difficulty.
- Eliminate mandatory keyword-density targets.
- Drop arbitrary required JSON-LD block counts (accurate types only; FAQPage only when real FAQs).
- Preserve brand voice, truthful claims, technical SEO, useful content.
- No near-duplicate location pages / mass thin pSEO.

## §3 Agent — `agents/keyword-researcher.md`

Native frontmatter + router-discoverable + callable directly + usable from `/run-the-loop`.
Responsibilities: identify product/audience/competitors/geo/opportunities; read cached research +
content inventory + keyword→page map; GSC when authorized; DataForSEO discovery+enrichment;
competitor+intent via DataForSEO+Exa; Trends; cluster by intent; improve-vs-create; prioritized
opportunities + evidence-backed briefs; persist structured + human reports; handoff to
content-writer/seo-auditor; measure outcomes → improve. Evidence-driven, geo/lang-aware,
cost-aware, deterministic scoring, no invented metrics, no needless paid calls, no duplicate fresh research.

## §4 Setup — `npm run seo:setup`

Detect tools/connections/secret-stores/CF-auth/provider-creds. Print REAL status table (not hardcoded).
Authenticate only missing providers. DataForSEO: open auth + api-access pages, masked capture,
store in secret manager, validate via FREE `/v3/appendix/user_data`, fetch real pricing + balance.
GSC: reuse OAuth client, PKCE browser flow, offline token, refresh/revoke handling, discover props
`GET /webmasters/v3/sites`, match to domains, support url-prefix + `sc-domain:`; verify at PROPERTY level;
no-property → `not_connected`/`unauthorized` + continue. Exa: reuse existing key/MCP; verify a real request.
CF: reuse wrangler/token/account; `wrangler login` only if missing. Never commit/echo/print secrets.
Never auto-buy credits / enable auto-recharge.

## §5 DataForSEO adapter (typed, tested)

Discovery: Keyword Ideas, Keyword Suggestions, Related Keywords, Keywords-for-Site.
Enrichment: Google Ads Search Volume, Bulk Keyword Difficulty, CPC/paid-competition, monthly history.
Competitor: organic SERP, competitor keyword opportunities, ranking domains/pages, SERP features.
Trends: Explore, related queries/topics, geo+historical interest. Batch + cache; prefer async task
endpoints when non-immediate, Live when interactive. Validate HTTP AND per-task status (20000 vs task errors).
Task IDs, retries, exp backoff, idempotency, polling, provider error reporting. Documented location/language codes.

## §6 GSC intelligence

Queries, landing pages, impressions, clicks, CTR, avg position, countries, devices, daily.
7/28/90-day windows (bounded by real data). Handle reporting delay, pagination, row limits, sampling;
missing rows ≠ zero. Detect: quick wins (high impressions/low CTR or near page-1), content decay,
emerging, cannibalization (evidence-based not naive match), refresh-vs-new, new clusters. Feed rankings.

## §7 Trends intelligence

Historical interest, growth/decline, seasonality, emerging, geo, related topics, stability,
spike-vs-sustained. Official API if available else DataForSEO. Document scaling; never label index as count;
never compare independently-normalized series on one scale. Seasonal → recommend publish ahead of peak.
Trends = one input, not auto-justification for new pages.

## §8 Exa evidence

Complements, not duplicates numeric metrics. Competitor/alt discovery, authoritative sources,
market language/questions/terminology, content positioning, unanswered questions, docs/examples,
content gaps + info-gain. Every external claim in a brief → real attributable source (url + retrieval ts + excerpt).
Never use Exa summaries as volume/difficulty evidence.

## §9 Intelligence + scoring engine

Provider-independent normalized model (fields): keyword, locale, geography, language, search_intent,
intent_confidence, topic_cluster, monthly_search_volume, volume_source, organic_keyword_difficulty,
paid_competition, cpc, gsc_impressions, gsc_clicks, gsc_ctr, gsc_average_position, trend_direction,
trend_momentum, seasonality, competitor_evidence, existing_matching_page, recommended_url,
recommended_action, opportunity_score, scoring_explanation, source_provenance, collected_at,
data_freshness, confidence. `null` for missing — NEVER fabricate zeros. Keep raw per-source values.

Scoring (configurable, deterministic, unit-tested, 100 pts):

| Dimension | Weight |
|---|---:|
| Business & audience relevance | 30 |
| Search intent & conversion value | 20 |
| Organic ranking feasibility | 15 |
| First-party GSC opportunity | 15 |
| Search demand | 10 |
| Trend momentum & timing | 5 |
| Originality & differentiation | 5 |

No-GSC → transparently redistribute its 15 among valid dims (never fabricate GSC). Normalize per source.
Don't let arbitrary high-volume outrank obvious commercial relevance.

Classification — exactly one primary action: Create new page | Improve existing | Consolidate |
Supporting blog | Comparison/integration/use-case | Monitor | Reject (+ rationale + evidence).

Clustering by intent + destination page; prevent multiple primaries competing for one page.
Intents: commercial, informational, navigational, transactional, comparison, local, mixed.
Persistent keyword→page map across runs.

## §10 Cloudflare architecture

Worker (authenticated API: schedule/query/retrieve). D1 (providers, projects, opportunities,
metrics, freshness, job states, history, billing). R2 (versioned reports + large artifacts).
Queues (async tasks, retries, bounded concurrency). Cron (central research + monitoring).
Workflows only if real benefit. Access (protect admin endpoints, M2M service creds).
ONE logical control plane for all projects — not per-repo infra. Security: auth every nonpublic
endpoint, tenant isolation, enforce GSC authz, never expose upstream creds to browsers, encrypt
refresh tokens before persistence, CF secrets + Infisical, provider timeouts + bounded retries,
no secret leakage in logs/traces/errors, staging/prod creds separated.

## §11 Cost controls

Dedup, batch, persistent cache + freshness policy, provider concurrency caps, global + per-project
budgets, actual-vs-estimated reporting, billing telemetry, circuit breakers, idempotent jobs,
budget-aware prioritization. Read live DataForSEO prices; reconcile ledger with task-level actual cost.
Never assume free. **Global paid-research cap $20/mo until changed; never silently exceed.**
No large paid batches during setup; free checks first. Cache by freshness/volatility; don't re-run
expensive research every 15 min.

## §12 Research workflow phases

A Understand (repo/domain/audience/pages/geo/cached) → B Existing opps (GSC) → C Expand (DataForSEO,
small→selective) → D Enrich high-value (volume/difficulty/SERP/trends for screened) → E Competition
(DataForSEO+Exa) → F Cluster+score → G Recommendations (actions/briefs/targets/internal-links/order)
→ H Persist (CF + local artifacts) → I Learn (compare vs later GSC; improve scoring w/ small-sample safeguards).
Each phase tolerates partial provider availability.

## §13 Command — `commands/keyword-research.md`

`/keyword-research projectsites.dev` + NL variants. Infer repo/domain if omitted; default geo/lang or US/English.
CLI (IMPLEMENT, not just doc): `npm run seo:setup`, `seo:health`, `seo:research -- --domain=X`,
`seo:research -- --domain=X --dry-run`. Useful `--help`.

## §14 Skill integration (reference canonical capability, don't duplicate impl)

`09-brand-and-content-system/seo-and-keywords.md` (make DataForSEO+GSC+Trends+Exa the active stack,
replace obsolete prices/providers), `23-content-seo/SKILL.md` (require research evidence before SEO content),
`06-build-and-slice-loop/blog-and-content-engine.md` (consume priorities+briefs),
`agents/content-writer.md` (use handoff, don't invent keywords), `agents/seo-auditor.md`
(keep tech audit separate; use keyword map for targeting/overlap),
`15-site-generation/research-pipeline.md` (make SEO research available without replacing brand research).
Preserve Claude/Codex/OpenCode/OpenClaw compat. No large always-loaded tool sets; no competing router.

## §15 `/run-the-loop` integration (don't replace orchestration; respect project precedence)

Activate when: SEO-eligible public site | content task needs keyword evidence | research stale |
meaningful new GSC/trend opportunity | explicit request. NOT a full paid pass every 15 min.
Schedule: Daily (GSC refresh + assess + actions), Weekly (selected DataForSEO metrics + clusters),
Periodic (trend/seasonal shifts within budget/freshness), On-demand (immediate). Reuse central scheduler;
no redundant per-repo crons. Content opps → existing content workflow (publication keeps existing gates).

## §16 Reports

Per run: structured JSON + readable Markdown + CSV export. Must include: site/audience summary;
provider+freshness statuses; top opportunities; intent+scores; demand + source attribution;
difficulty + competitive context; GSC opportunities; trend/seasonality; clusters + destination pages;
content-gap analysis; top actions; ready briefs for top opps; sources + timestamps; actual cost +
remaining budget; explicit missing-data limitations. Briefs: page type, primary topic, related queries,
audience, intent, outline, UVP, sources, internal links, evidence-based checklist.
NEVER fabricate metrics/competitors/testimonials/citations/projected rankings.

## §17 Testing (Vitest, mocked for CI) + §18 deploy

Adapters: success, invalid creds, expired OAuth, rate limits, provider errors, missing metrics,
pagination, batch limits, async polling, partial task failures. Engine: dedup, clustering, intent,
normalized mapping, scoring arithmetic, missing-source, classification, existing-page match,
cannibalization safeguards. CF: D1 storage+migrations, R2 persistence, queue processing, cron idempotency,
Access, tenant isolation, retry, cost limits. Security: no secret logging, unauthorized rejected,
cross-tenant rejected, secrets excluded from reports, safe OAuth handling. Integration: skill discovery,
MCP routing, `/run-the-loop` compat, CLI exec, agent invocation, content-writer handoff.
Opt-in live smoke after auth. Real run on detected domain verifies each provider HONESTLY
(never claim GSC/deploy verified without real evidence). Run repo validate/lint; fix regressions.
Install deps via repo conventions; provision CF only when needed in established account; migrations +
wrangler config + bindings + queue consumers; deploy once tests pass; verify deployment + protected
endpoints; never deploy public unauthenticated service; no duplicate resources; no silent mocks in prod.

## §19 Convergence + Definition of Done

Focused passes: correctness, API efficiency, cost, security, reliability, research quality, keyword
relevance, agent usability, skill integration, operational completeness. One working vertical slice first.
Every iteration improves impl, not more docs.

DoD (all must be REAL + evidenced):

- [ ] Keyword Research Agent exists + discoverable
- [ ] Claude Code command works
- [ ] Setup command works
- [ ] Existing credentials auto-discovered
- [ ] Missing connections use supported interactive auth
- [ ] DataForSEO integration functional
- [ ] GSC functional for authorized properties
- [ ] Google Trends via authorized path
- [ ] Existing Exa works
- [ ] Results normalized + scored + persisted
- [ ] Cloudflare runtime configured + verified
- [ ] Existing skills consume results
- [ ] `/run-the-loop` integrates w/o duplicated expensive work
- [ ] Cost + security controls work
- [ ] Automated tests pass
- [ ] Real end-to-end smoke succeeds for available providers
- [ ] Docs accurately reflect implementation
- [ ] Changes committed per repo policy

Blocked external authz → report that specific check as blocked; never manufacture a pass.

## §20 Completion report must include

Provider status, agent status, CF deployment+resources, first real result, actual costs,
test results, files changed, commit ref, exact next-research command.
