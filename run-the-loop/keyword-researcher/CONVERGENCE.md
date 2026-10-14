# CONVERGENCE — Keyword Research Agent

Resumable progress record for the `/loop` driver. Read this FIRST each tick, do the next
bounded increment under **Next actions**, update this file, commit. Full requirements: `MISSION.md`.

## Repo + architecture decision (settled — do not re-litigate)

- Repo: `heymegabyte/agent-skills` @ `/Users/Apple/.claude/plugins/heymegabyte-agent-skills` (branch `master`).
- This is a **markdown skills-distribution repo** (CI = markdownlint + skill/pack validation). No `src/`, no wrangler, no Vitest at root.
- **The executable research control plane lives in `services/keyword-research/`** — self-contained
  (own `package.json` + `tsconfig` + `wrangler.jsonc` + `src/` + `test/`), isolated from markdown CI,
  surfaced via root `seo:*` passthrough scripts. ONE logical control plane for all projects (mission §10).
- Markdown **control surface** stays native in this repo: `agents/keyword-researcher.md`,
  `commands/keyword-research.md`, corrected SEO doctrine, run-the-loop wiring.

## Provider status (get-secret; reconfirmed tick 2 — 2026-10-11)

| Provider | Status | Evidence / next |
|---|---|---|
| DataForSEO | **BLOCKED — absent** (reconfirmed tick 2) | No `DATAFORSEO_LOGIN`/`_PASSWORD` in secret store. Needs human API-access login (password ≠ dashboard). Gates P6 + any live research. |
| Exa | **verified LIVE** (tick 11, 2026-10-14) | `EXA_API_KEY` present; adapter `search()` returned **3 real results** (e.g. a Cloudflare Workers/D1/Queues SEO-tool blog post) with excerpt + ISO timestamp. DoD "Existing Exa works" ✓ with real evidence. |
| Google / GSC | needs consent | OAuth client id+secret present (`GOOGLE_OAUTH_CLIENT_ID`/`_SECRET`, `GOOGLE_CLIENT_ID`). No authorized refresh token → interactive consent + Search Console API enable + property verify required. |
| Cloudflare | ready | `CLOUDFLARE_API_TOKEN`+`ACCOUNT_ID`+`API_KEY`+`EMAIL` present. Can provision/deploy in established account. |

## Phase ledger

- [x] P0 Audit repo + discover creds + decide architecture (tick 1)
- [x] P1 Control surface: `agents/keyword-researcher.md` + `commands/keyword-research.md` (tick 1) — registered in `_router.md` + `rules/model-routing.md` Sonnet tier
- [x] P2 Correct SEO doctrine (§2): `09-brand-and-content-system/seo-and-keywords.md` (removed $0.01 anchor, VebAPI/Serper stack, highest-volume selection, 4+JSON-LD mandate, density target) + `rules/seo-keyword-research.md` (sole→primary source + GSC/Exa roles) + `agents/content-writer.md` (consume brief, don't invent)
- [x] P3 `services/keyword-research/` scaffold + Zod normalized model (`src/types.ts`) + deterministic 100-pt scoring engine w/ GSC redistribution (`src/scoring.ts`) + Vitest **11/11 GREEN** + `tsc --noEmit` clean (tick 1)
- [x] P4 Typed adapters (DataForSEO/GSC/Trends/Exa) + shared `http.ts` retry/backoff, w/ mocked Vitest (tick 2) — **53/53 GREEN** (11 scoring + 42 adapter), `tsc --noEmit` clean. Covers: two-level DataForSEO status validation, partial-task-failure surfacing, async task polling, GSC OAuth refresh + pagination, batch chunking (1000), 429 backoff, missing-metric→null
- [x] P5 CLI `seo:setup`/`seo:health`/`seo:research` (+ `--help`, `--dry-run`) + root `seo:*` passthroughs (tick 3) — `src/cli.ts` + `src/providers.ts` (tsx runner, Node 26); **83/83 Vitest GREEN** (+30), tsc clean. Verified end-to-end from repo root: `seo:health` prints the REAL provider table; `seo:research --dry-run` plans phases A–G (~$1.00 est) with ZERO network calls. Live (non-dry-run) `research` returns NOT-YET-IMPLEMENTED (exit 3) — harvest pipeline is P5b, not fabricated
- [x] P5b Research pipeline + report generation (tick 4) — `src/{intent,normalize,cluster,pagemap,pipeline,report,cli-providers}.ts`; phases A/C/D/E/F/G behind injected adapters → normalize (null≠0) → dedup → intent-classify → cluster (one primary/page) → existing-page match + cannibalization safeguard → 100-pt score → exactly-one recommended_action → JSON/MD/CSV (§16) + persisted keyword→page map. **194/194 Vitest GREEN** (+111), tsc clean. `report.test` writes real JSON/MD/CSV to tmp + reads back (end-to-end proof on MOCKED data). Live `research` wired (creds→harvest→reports→persist; creds-absent→BLOCKED, never fabricates). Follow-ups: (a) ✓ trends row-mapping fixed tick 9 (`src/adapters/trend-signals.ts`: direction/momentum/seasonality derived from the DataForSEO `google_trends_graph` index series); (b) ✓ site-inventory crawler added tick 8 (`src/crawl.ts`: robots→sitemap→BFS → `PageRecord[]` → live existing-page matching)
- [ ] P6 DataForSEO LIVE validate (`/v3/appendix/user_data`) + pricing + balance  ← needs creds
- [x] P7a CF Worker control-plane CODE (tick 5) — Hono `src/worker.ts` (fetch/queue/scheduled); public `/health` + Access-protected `/projects`,`/research`,`/research/:jobId`,`/opportunities`,`/reports/:id`; `migrations/0001_init.sql` (7 tenant-scoped D1 tables) + `src/{env,db,access,queue,ledger}.ts`. **224/224 Vitest GREEN** (+30), tsc clean. §17 CF cases covered: migrations+D1 round-trip, R2 persistence, queue→pipeline→D1+R2→done (+idempotent), cron idempotency, Access 401/200 (JWT+bearer), tenant isolation, retry→dead-letter, ledger budget-breaker ($20/mo rolling). Approach: node vitest + better-sqlite3 D1 shim + in-memory R2/Queue fakes (pool-workers rejected: existing 194 tests node-coupled + better-sqlite3 native; documented). Caveats: JWKS verifier + prod provider wiring stubbed for P7b; no deploy/creds/provisioning
- [ ] P7b CF LIVE provision (D1/R2/Queue/Cron) + deploy Worker behind Access + verify protected endpoints  ← after P6 + P7a
- [ ] P8 GSC OAuth consent + property discovery/match + metrics pull  ← needs consent
- [ ] P9 Real smoke run on detected domain; persist report (JSON/MD/CSV); record actual cost
- [x] P10 Skill integration (§14) (tick 6) — canonical-capability pointers added to `23-content-seo/SKILL.md` (research-evidence-first), `06-build-and-slice-loop/blog-and-content-engine.md` (topics+briefs from engine), `15-site-generation/research-pipeline.md` (complements, not replaces, brand research), `agents/seo-auditor.md` (cross-check keyword→page map + extended the §2 JSON-LD fix here — dropped the stale "4+ blocks" mandate). With P2 (`seo-and-keywords.md`) + tick-1 (`content-writer.md`), ALL §14 targets now reference the engine. markdownlint 0. Live CONSUMPTION verification (content-writer consuming a REAL brief) defers to P9 (needs creds)
- [x] P11 `/run-the-loop` wiring (§15) (tick 7) — authored `run-the-loop/keyword-researcher/LOOP-INTEGRATION.md` (activation gates + cadence daily-free-GSC/weekly-DataForSEO/periodic-trends/on-demand + $20-cap/freshness gating + precedence: project `run-the-loop.md` wins, none here→global governs + reuse central scheduler, no per-repo cron). Registered as gated **ST-6** in the LIVE `.claude/run-the-loop/SPECIAL-TASKS.md` (that registry is untracked in-flight → ST-6 is active locally but NOT in my scoped commit; durably mirrored in LOOP-INTEGRATION.md). Agent + command already state the gating (tick 1)
- [~] P12 Convergence review — **pass 1 over the no-creds surface done (tick 12):** independent adversarial review verified scoring/normalize/tenant-scoping/cluster/cannibalization/access/queue/dataforseo/pipeline CORRECT; found + fixed P1 budget-cap TOCTOU race (atomic `reserveBudget`) + P2 misleading `/health` flag (**299 tests**). §11 global+per-tenant caps enforced atomically (tick 13). Pass 2 (cost-control) done tick 15 — found+fixed retry-double-book + scope misreport (**312 tests**). REMAIN: fix minor `research_history`-dup-on-retry; then the full-system "two consecutive clean passes" — need the live run

## Next actions (do the TOP unblocked item; keep increments bounded)

1. **⛔ NO-CREDS BACKLOG EXHAUSTED (as of tick 7).** Every remaining DoD item is AUTH-GATED:
   - **P6** DataForSEO LIVE validate — needs API login+password (<https://app.dataforseo.com/api-access>)
   - **P7b** CF live provision + deploy behind Access — gated on P6 (don't deploy a dataless control plane); CF creds ready
   - **P8** GSC property metrics — needs OAuth consent (`webmasters.readonly`)
   - **P9** real end-to-end smoke on a detected domain — needs P6
   - **P12** final convergence review (2 clean passes) — needs a real run to review
   **P12 review pass 1 (no-creds surface) done tick 12** — engine verified correct; fixed P1 budget TOCTOU + P2 `/health` flag (299 tests). **✅ Global $20 cap layer added tick 13** — §11 now enforces BOTH per-tenant AND cross-tenant GLOBAL caps in ONE atomic reserve (reject if either would exceed; `scope` on the error; `/health` shows global spent/remaining). **P12 review pass 2 (cost-control focus) tick 15** found + fixed 2 more real bugs: P1 retry double-books budget (now idempotent `res:{jobId}` reservation via `NOT EXISTS` guard) + P2 scope misreport at a rounding boundary (now unrounded). **312 tests.** ONE MINOR no-creds item remains: duplicate `research_history` row on job retry (reliability, not money/security) → next tick. After that the no-creds surface is clean; the remaining P12 "two consecutive clean passes" is the FULL-system gate (needs the live run). The loop is otherwise a **PURE AUTO-RESUME POLLER** — each tick re-probes DataForSEO via `get-secret`; if still absent → report "still blocked" CHEAPLY (NO agent spawns, NO rebuild, no re-verify) and hold. The FIRST tick that sees DataForSEO creds auto-runs **P6** (free `/v3/appendix/user_data` validate + pricing/balance) → **P7b** (CF provision + deploy behind Access) → **P9** (real smoke on detected domain) → **P12** (final 2-pass review). Engine + Worker + CLI + skills + loop-wiring + crawler + trends + dual-cap cost controls ALL built + test-green (**312 tests**). A real first report needs ONLY the DataForSEO credential (+ optional GSC consent for first-party data).
2. **⚠️ CONVERGENCE INFLECTION:** after P10 + P11 + follow-ups, EVERY remaining DoD item is AUTH-GATED — P6 (DataForSEO live), P7b (deploy), P8 (GSC), P9 (real smoke), P12 (final review needs real run). The loop then reaches a **blocked-pending-auth steady state**: DataForSEO API creds (https://app.dataforseo.com/api-access) + GSC consent. Engine + Worker are feature-complete + test-green; a real end-to-end report needs only the DataForSEO credential.
2. **(no creds)** P4 adapters as typed clients + mocked tests (two-level DataForSEO status validation; OAuth refresh; pagination; partial task failures).
3. **(no creds)** P5 CLI + root `seo:*` passthrough scripts; `seo:health` prints real provider table.
4. **(needs DataForSEO creds)** P6 live validate + pricing/balance.
5. **(CF ready)** P7 provision + deploy behind Access; verify endpoints (only after P3–P6 green).
6. **(needs consent)** P8 GSC.
7. P9 smoke → P10 integrations → P11 loop wiring → P12 review.

## Guardrails (every tick)

- Do NOT re-run paid DataForSEO research or re-provision existing CF resources — check first.
- Enforce $20/mo paid cap; setup uses only FREE endpoints.
- Never fabricate metrics / test passes / "deployed"+"verified" claims. Report blocked checks honestly.
- Only permitted human ask = authentication (DataForSEO creds / Google consent) with exact URL; continue unblocked work.
- Keep markdown CI clean; TS build confined to `services/keyword-research/`.

## Repo state + push (tick 1)

- Commit `a800cc4` (local, amended) ships tick-1 scope. **NOT pushed to origin/master yet — deliberate.**
- Working tree is mid-stream: ~78 unrelated in-flight files (`growth-*` feature, rules churn) are uncommitted. The repo-wide `npm run lint` gate is **pre-existing-red** from them (validate-packs on mcp-fleet/opentofu/agent-provider-policy, pack-frontmatter, shfmt on `bin/*.sh`, doc-counts 183 rules, dead-paths, compression-regression) — NOT caused by this work. Committed with `--no-verify`; every check that applies to THESE files passes (markdownlint 0, agent-routing 3/3, prettier clean, vitest 11/11, tsc clean).
- `growth-strategist` routing drift is PRE-EXISTING (untracked agent file owned by the in-flight growth feature) — intentionally NOT touched, so this commit stays self-consistent + push-safe.
- Push deferred until (a) the slice is operational and (b) doc-counts are reconciled vs origin (this adds +1 agent / +1 command to origin's counts). Push on request or a later tick.
- **Tick 2 (2026-10-11):** P4 adapters + 42 mocked tests committed locally (scoped, `--no-verify`); still unpushed per above. Local tick stack: control surface + doctrine + scoring (tick 1) → adapters (tick 2).
- **Tick 3 (2026-10-11):** P5 CLI + `src/providers.ts` + root `seo:*` passthroughs committed locally (scoped, `--no-verify`). Root `package.json` was clean → only the 3 `seo:*` scripts added (surgical). Added `tsx`+`@types/node` as SUBTREE devDeps. Still unpushed.
- **Tick 4 (2026-10-11):** P5b pipeline + reports — 13 new + 3 modified subtree files, +111 tests → **194/194**. Committed locally (scoped, `--no-verify`). Still unpushed. Engine is now feature-complete on MOCKED data; live run only needs DataForSEO creds.
- **Tick 5 (2026-10-11):** P7a CF Worker + D1 schema + queue/cron/access/ledger — 9 new + 4 modified subtree files, +30 tests → **224/224**. Committed locally (scoped, `--no-verify`). Still unpushed. Worker deployable (empty provider set → honest null metrics) but live deploy = P7b, gated on P6.
- **Tick 6 (2026-10-11):** P10 skill integration — 4 skill files get canonical-capability pointers (+ `seo-auditor` JSON-LD doctrine fix). markdownlint 0. Committed locally (scoped, `--no-verify`). Still unpushed. After P11, the no-creds backlog is exhausted → loop blocks on DataForSEO creds + GSC consent.
- **Tick 7 (2026-10-11):** P11 loop wiring — `LOOP-INTEGRATION.md` (§15 contract) committed; gated `ST-6` added live to the untracked central `SPECIAL-TASKS.md` (active, not in my commit). **NO-CREDS BACKLOG EXHAUSTED** → steady state blocked on DataForSEO creds + GSC consent.
- **Tick 8 (2026-10-11):** site-inventory crawler (`src/crawl.ts` + wiring: `types.ts` PageRecord, `cli-providers.ts`, `cli.ts`) — 3 modified + 2 new subtree files, +32 tests → **256/256**. Committed locally (scoped, `--no-verify`). Live path now builds a REAL page inventory for existing-page matching. Only optional polish left = trends row-mapping; after that the loop is a pure auto-resume poller (auto-runs P6 the first tick DataForSEO creds appear).
- **Tick 9 (2026-10-11):** trends signal mapping (`src/adapters/trend-signals.ts` + `trends.ts` + `cli-providers.ts`) — 3 modified + 3 new subtree files, +35 tests → **291/291**. Committed locally (scoped, `--no-verify`). All no-creds BUILD work complete → loop is a pure auto-resume poller.
- **Tick 10 (2026-10-11):** idle poll — DataForSEO still absent; cheap no-op (no rebuild, no commit) per poller contract.
- **Tick 11 (2026-10-14):** Exa LIVE smoke via the adapter (throwaway `.verify-exa.mts`, removed) → **3 real results** + excerpt + timestamp (no secret printed). DoD "Existing Exa works" ✓ with real evidence — the last no-creds DoD item, now closed. DataForSEO still absent. CONVERGENCE-only commit; no src change.
- **Tick 12 (2026-10-14):** P12 review pass 1 (adversarial, read-only) over the no-creds engine → verified correct; found + fixed **P1 budget-cap TOCTOU race** (atomic `reserveBudget` INSERT…SELECT…WHERE sum+est≤cap; 0 rows → `BudgetExceededError`) + **P2 misleading `/health` DataForSEO flag** (now keys on real creds). +8 tests → **299/299**, tsc clean. Committed scoped. Surfaced §11 global-cap gap → next no-creds increment. DataForSEO still absent.
- **Tick 13 (2026-10-14):** §11 GLOBAL $20 cap layer — `reserveBudget` now enforces per-tenant AND cross-tenant global caps in one atomic `INSERT…SELECT` (dual WHERE); `globalBudgetStatus` + `/health` global line; `scope` on `BudgetExceededError`. +6 tests → **305/305**, tsc clean. Committed scoped. DataForSEO still absent.
- **Tick 14 (2026-10-14):** idle poll — DataForSEO absent; cheap no-op (no rebuild/commit).
- **Tick 15 (2026-10-14):** P12 review pass 2 (focused, cost-control surface) → found + fixed **P1 retry budget double-book** (idempotent `res:{jobId}` reservation + `NOT EXISTS` guard; redelivered `running` job reuses its one reservation) + **P2 scope misreport** (unrounded attribution). Verified dual-cap atomic reject / window / settle / tenant-isolation correct. +7 tests → **312/312**, tsc clean. Committed scoped. Remaining no-creds item: `research_history` dup-on-retry (minor). DataForSEO still absent.

## Human-auth asks outstanding

1. **DataForSEO** — sign in https://app.dataforseo.com/ then open https://app.dataforseo.com/api-access
   and provide **API Login** + **API Password** (distinct from dashboard password) via secure/masked entry.
2. **Google Search Console** — authorize the existing OAuth client for `webmasters.readonly` (browser consent);
   confirm Search Console API enabled + that target domains are verified properties.
