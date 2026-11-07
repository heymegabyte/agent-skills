# BACKLOG — frontier (next unmet units)

`[x]` done · `[~]` partial · `[ ]` open. Resume here every fire.

## Orchestrator runtime — DONE (Fire 2)
- [x] **ORCH-POOL** — `bin/worker-pool.mjs`: MAX-5 leases + heartbeat + reclaim + weighted-fair `selectNextCategory`.
- [x] **ORCH-LEDGER-BIN** — `bin/task-ledger.mjs`: append-only, schema-validated, idempotent `completeOnce`.
- [x] **SIM-SCHED** — `bin/__tests__/scheduler-sim.mjs`: 1000 iters, maxConcurrent=5, 0 starved, maxDeviation=0.04pp.
- [ ] **ORCH-WIRE** — wire `worker-pool.mjs` into the live `bin/claude-pool.sh` seat lifecycle + `autonomous-orchestrator` so real fires acquire/heartbeat/release leases (currently standalone + sim-proven).
- [ ] **TOKEN-ACCOUNTING** — capture actual per-category/project tokens+cost into `ledger.ndjson`; weekly rebalance report drives ST-3 off real actuals.

## Growth system
- [x] **GROWTH-DOCTRINE** — orchestrator + 50-strategy registry + safeguards + allocation + `growth-strategist` agent (Fire 1).
- [x] **QUALIFIED-ATTR** — `rules/qualified-traffic-attribution.md` (Fire 3).
- [x] **E2E-GROWTH** — `bin/growth-policy.mjs` + test (scoring, dedupe, Awesome-List caps, CPA_q ranking) 11/11 (Fire 5).
- [~] **GROWTH-CRON** — template shipped (Fire 4); **[ ] deploy** per product (needs CF account + runner webhook `GROWTH_RUNNER_URL`).
- [ ] **GROWTH-SKILL-PROMOTE** (optional) — promote the growth rule into a registered `29-growth-orchestrator/` skill. Recipe: SKILL.md (`priority:3`,`pack:growth`,≥2 triggers,`paths:[]`) → plugin.json `skills[]` + `23→24-category` → add dir to `_packs/growth.yml` → `evals/` → run skill audits. (Low value — growth already live as rules + registered agent.)

## GitLink (growth stage — in the `gitl.ink` repo, Angular/Nx; NOT built here)
- [ ] **G-1 (top ROI)** — SSR `/repo/:owner/:name` (flip Client→Server in `app.routes.server.ts`, reuse `/brief`+`/p/` head builders). *Acceptance:* raw `curl` of a repo URL returns per-repo title + JSON-LD; in sitemap.
- [ ] **G-2** — public-ize + register the MCP server (drop 401 read-tools, `/.well-known/mcp.json`, submit Glama/Smithery).
- [ ] **G-3** — embeddable `/embed/:owner/:name` scorecard (SSR card + relaxed `frame-ancestors` on that path + snippet).
- [ ] **G-4…G-10** — alternatives SEO pages · VS Code ext · GitHub Marketplace app · weekly newsletter send · video factory · syndication · Chrome/Raycast/npm/Action. Score per §10 before building.

## Repo hygiene — DONE (Fire 6)
- [x] **PACK-DRIFT** — 10 pre-existing `_packs` claim/membership drifts fixed → 0 drift; `thinking.yml` created.
- [ ] **AGENT-HYGIENE** — pre-existing `validate-agents` warnings on `resource-broker` (missing `context`/`maxTurns`); 10 other agents warn too (not mine).

## Verification program
- [x] SIM-SCHED · [x] E2E-GROWTH (growth-policy).
- [ ] **ORCH-E2E** — once ORCH-WIRE lands, a real fire that acquires leases, runs a slice, reclaims on a killed worker.

## Portfolio (Phase Five — per product, distinct audience)
- [ ] DeskLink · ProjectSites.dev · FuegoLink · TheBestSites.com — run `growth-strategist` per product; don't assume GitLink's channels transfer.
