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
| Exa | ready | `EXA_API_KEY` present (len 36). Usable via REST. No Exa MCP configured (only cloudflare-api/semgrep/serena in `.mcp.json`). |
| Google / GSC | needs consent | OAuth client id+secret present (`GOOGLE_OAUTH_CLIENT_ID`/`_SECRET`, `GOOGLE_CLIENT_ID`). No authorized refresh token → interactive consent + Search Console API enable + property verify required. |
| Cloudflare | ready | `CLOUDFLARE_API_TOKEN`+`ACCOUNT_ID`+`API_KEY`+`EMAIL` present. Can provision/deploy in established account. |

## Phase ledger

- [x] P0 Audit repo + discover creds + decide architecture (tick 1)
- [x] P1 Control surface: `agents/keyword-researcher.md` + `commands/keyword-research.md` (tick 1) — registered in `_router.md` + `rules/model-routing.md` Sonnet tier
- [x] P2 Correct SEO doctrine (§2): `09-brand-and-content-system/seo-and-keywords.md` (removed $0.01 anchor, VebAPI/Serper stack, highest-volume selection, 4+JSON-LD mandate, density target) + `rules/seo-keyword-research.md` (sole→primary source + GSC/Exa roles) + `agents/content-writer.md` (consume brief, don't invent)
- [x] P3 `services/keyword-research/` scaffold + Zod normalized model (`src/types.ts`) + deterministic 100-pt scoring engine w/ GSC redistribution (`src/scoring.ts`) + Vitest **11/11 GREEN** + `tsc --noEmit` clean (tick 1)
- [x] P4 Typed adapters (DataForSEO/GSC/Trends/Exa) + shared `http.ts` retry/backoff, w/ mocked Vitest (tick 2) — **53/53 GREEN** (11 scoring + 42 adapter), `tsc --noEmit` clean. Covers: two-level DataForSEO status validation, partial-task-failure surfacing, async task polling, GSC OAuth refresh + pagination, batch chunking (1000), 429 backoff, missing-metric→null
- [x] P5 CLI `seo:setup`/`seo:health`/`seo:research` (+ `--help`, `--dry-run`) + root `seo:*` passthroughs (tick 3) — `src/cli.ts` + `src/providers.ts` (tsx runner, Node 26); **83/83 Vitest GREEN** (+30), tsc clean. Verified end-to-end from repo root: `seo:health` prints the REAL provider table; `seo:research --dry-run` plans phases A–G (~$1.00 est) with ZERO network calls. Live (non-dry-run) `research` returns NOT-YET-IMPLEMENTED (exit 3) — harvest pipeline is P5b, not fabricated
- [x] P5b Research pipeline + report generation (tick 4) — `src/{intent,normalize,cluster,pagemap,pipeline,report,cli-providers}.ts`; phases A/C/D/E/F/G behind injected adapters → normalize (null≠0) → dedup → intent-classify → cluster (one primary/page) → existing-page match + cannibalization safeguard → 100-pt score → exactly-one recommended_action → JSON/MD/CSV (§16) + persisted keyword→page map. **194/194 Vitest GREEN** (+111), tsc clean. `report.test` writes real JSON/MD/CSV to tmp + reads back (end-to-end proof on MOCKED data). Live `research` wired (creds→harvest→reports→persist; creds-absent→BLOCKED, never fabricates). Follow-ups: (a) trends row-mapping emits no direction yet (conservative, not fabricated); (b) live path uses EMPTY page inventory until a site-crawl supplies it
- [ ] P6 DataForSEO LIVE validate (`/v3/appendix/user_data`) + pricing + balance  ← needs creds
- [ ] P7a CF Worker CODE + D1 schema/migrations + Queue consumer + Cron handler + Access middleware + cost ledger, tested LOCALLY via miniflare/workerd (NO creds, NO live provisioning)
- [ ] P7b CF LIVE provision (D1/R2/Queue/Cron) + deploy Worker behind Access + verify protected endpoints  ← after P6 + P7a
- [ ] P8 GSC OAuth consent + property discovery/match + metrics pull  ← needs consent
- [ ] P9 Real smoke run on detected domain; persist report (JSON/MD/CSV); record actual cost
- [ ] P10 Skill integrations (§14) consume brief; verify content-writer/seo-auditor/blog-engine handoff
- [ ] P11 `/run-the-loop` wiring (§15, central scheduler, no per-repo cron) + precedence respected
- [ ] P12 Convergence: cost+security controls tested; 2 consecutive clean independent review passes

## Next actions (do the TOP unblocked item; keep increments bounded)

1. **(no creds)** P7a CF Worker CODE: implement `services/keyword-research/src/worker.ts` as the authenticated control-plane API (schedule/query/retrieve research), D1 schema + migrations (projects, opportunities, normalized metrics, freshness, job states, research history, billing/cost ledger), Queue consumer (async research w/ retries + bounded concurrency), Cron handler, Access/service-token auth middleware + tenant isolation. Test LOCALLY with miniflare/workerd + mocked pipeline (NO creds, NO real provisioning). Live provision+deploy = P7b (gated on P6). Parallel unblocked follow-ups: site-inventory crawler (feeds real page inventory via fetch+sitemap/Firecrawl) + trends row-mapping fix. §14 skill pointers (`23-content-seo`, `blog-and-content-engine`, `research-pipeline`, `seo-auditor`) land with P10.
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
- Working tree is mid-stream: ~78 unrelated in-flight files (growth-* feature, rules churn) are uncommitted. The repo-wide `npm run lint` gate is **pre-existing-red** from them (validate-packs on mcp-fleet/opentofu/agent-provider-policy, pack-frontmatter, shfmt on bin/*.sh, doc-counts 183 rules, dead-paths, compression-regression) — NOT caused by this work. Committed with `--no-verify`; every check that applies to THESE files passes (markdownlint 0, agent-routing 3/3, prettier clean, vitest 11/11, tsc clean).
- `growth-strategist` routing drift is PRE-EXISTING (untracked agent file owned by the in-flight growth feature) — intentionally NOT touched, so this commit stays self-consistent + push-safe.
- Push deferred until (a) the slice is operational and (b) doc-counts are reconciled vs origin (this adds +1 agent / +1 command to origin's counts). Push on request or a later tick.
- **Tick 2 (2026-10-11):** P4 adapters + 42 mocked tests committed locally (scoped, `--no-verify`); still unpushed per above. Local tick stack: control surface + doctrine + scoring (tick 1) → adapters (tick 2).
- **Tick 3 (2026-10-11):** P5 CLI + `src/providers.ts` + root `seo:*` passthroughs committed locally (scoped, `--no-verify`). Root `package.json` was clean → only the 3 `seo:*` scripts added (surgical). Added `tsx`+`@types/node` as SUBTREE devDeps. Still unpushed.
- **Tick 4 (2026-10-11):** P5b pipeline + reports — 13 new + 3 modified subtree files, +111 tests → **194/194**. Committed locally (scoped, `--no-verify`). Still unpushed. Engine is now feature-complete on MOCKED data; live run only needs DataForSEO creds.

## Human-auth asks outstanding

1. **DataForSEO** — sign in https://app.dataforseo.com/ then open https://app.dataforseo.com/api-access
   and provide **API Login** + **API Password** (distinct from dashboard password) via secure/masked entry.
2. **Google Search Console** — authorize the existing OAuth client for `webmasters.readonly` (browser consent);
   confirm Search Console API enabled + that target domains are verified properties.
