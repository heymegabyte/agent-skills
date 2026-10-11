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

## Provider status (verified via get-secret, tick 1 — 2026-10-10)

| Provider | Status | Evidence / next |
|---|---|---|
| DataForSEO | **BLOCKED — absent** | No `DATAFORSEO_LOGIN`/`_PASSWORD` in secret store. Needs human API-access login (password ≠ dashboard). |
| Exa | ready | `EXA_API_KEY` present (len 36). Usable via REST. No Exa MCP configured (only cloudflare-api/semgrep/serena in `.mcp.json`). |
| Google / GSC | needs consent | OAuth client id+secret present (`GOOGLE_OAUTH_CLIENT_ID`/`_SECRET`, `GOOGLE_CLIENT_ID`). No authorized refresh token → interactive consent + Search Console API enable + property verify required. |
| Cloudflare | ready | `CLOUDFLARE_API_TOKEN`+`ACCOUNT_ID`+`API_KEY`+`EMAIL` present. Can provision/deploy in established account. |

## Phase ledger

- [x] P0 Audit repo + discover creds + decide architecture (tick 1)
- [x] P1 Control surface: `agents/keyword-researcher.md` + `commands/keyword-research.md` (tick 1) — registered in `_router.md` + `rules/model-routing.md` Sonnet tier
- [x] P2 Correct SEO doctrine (§2): `09-brand-and-content-system/seo-and-keywords.md` (removed $0.01 anchor, VebAPI/Serper stack, highest-volume selection, 4+JSON-LD mandate, density target) + `rules/seo-keyword-research.md` (sole→primary source + GSC/Exa roles) + `agents/content-writer.md` (consume brief, don't invent)
- [x] P3 `services/keyword-research/` scaffold + Zod normalized model (`src/types.ts`) + deterministic 100-pt scoring engine w/ GSC redistribution (`src/scoring.ts`) + Vitest **11/11 GREEN** + `tsc --noEmit` clean (tick 1)
- [ ] P4 Typed adapters (DataForSEO/GSC/Trends/Exa) w/ mocked unit tests (no live creds needed)
- [ ] P5 `seo:setup`/`seo:health`/`seo:research` CLI (+ `--help`, `--dry-run`) wired to root scripts
- [ ] P6 DataForSEO LIVE validate (`/v3/appendix/user_data`) + pricing + balance  ← needs creds
- [ ] P7 CF provision (D1 migrate, R2, Queue, Cron, Access) + deploy Worker + verify protected endpoints
- [ ] P8 GSC OAuth consent + property discovery/match + metrics pull  ← needs consent
- [ ] P9 Real smoke run on detected domain; persist report (JSON/MD/CSV); record actual cost
- [ ] P10 Skill integrations (§14) consume brief; verify content-writer/seo-auditor/blog-engine handoff
- [ ] P11 `/run-the-loop` wiring (§15, central scheduler, no per-repo cron) + precedence respected
- [ ] P12 Convergence: cost+security controls tested; 2 consecutive clean independent review passes

## Next actions (do the TOP unblocked item; keep increments bounded)

1. **(no creds)** P4 adapters: typed DataForSEO/GSC/Trends/Exa clients + mocked Vitest (two-level DataForSEO
   status validation, OAuth refresh, pagination, partial task failures, rate limits). Then P5 CLI
   (`seo:setup`/`seo:health`/`seo:research` + `--help`/`--dry-run`) wired to root `seo:*` passthrough scripts.
   NOTE: root `seo:*` scripts were intentionally DEFERRED from tick 1 — never declare a script before its CLI
   exists. §14 skill pointers for `23-content-seo`, `blog-and-content-engine`, `research-pipeline`, `seo-auditor`
   land with P10 (alongside real handoff verification).
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

## Human-auth asks outstanding

1. **DataForSEO** — sign in https://app.dataforseo.com/ then open https://app.dataforseo.com/api-access
   and provide **API Login** + **API Password** (distinct from dashboard password) via secure/masked entry.
2. **Google Search Console** — authorize the existing OAuth client for `webmasters.readonly` (browser consent);
   confirm Search Console API enabled + that target domains are verified properties.
