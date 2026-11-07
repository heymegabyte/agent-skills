# CONVERGENCE — Autonomous Product Development & Growth OS

**Scope:** install the directive's OS into the agent-skills estate (doctrine + runtime + policy + loop home),
preserving all working systems. Product/distribution features land in each product's own repo.

## Status
- **OS layer (doctrine + runtime + policy + tests): CONVERGED** — two consecutive independent clean passes (Fire 1 gate verification + Fire 6 adversarial sweep); all repo gates green; both test suites pass.
- **Product/infra layer: BACKLOG** — live cron deploy + GitLink features + token-accounting are not built (different repos / infra); nothing deployed or measured yet. No false "done".

## Fire log
### Fire 1 (2026-10-10) — doctrine + registries + loop home (shipped, verified)
token-allocation-policy + categories.json (50 cats=100%, lifecycle, protected 5% SEO) · worker-pool-and-task-ledger + task-ledger.schema.json · autonomous-growth-orchestrator (50-strategy registry, safeguards, 1000-cell matrix) · growth-strategist agent (registered) · _packs/growth.yml · canonical `.claude/run-the-loop/` home. Gates ✔.

### Fire 2 — ORCH runtime (shipped, TESTED)
`bin/task-ledger.mjs` (append-only, schema-validated, idempotent completeOnce) · `bin/worker-pool.mjs` (MAX-5 leases + heartbeat + reclaim + weighted-fair selectNextCategory) · `bin/__tests__/scheduler-sim.mjs`. **Sim: maxConcurrent=5, reclaimed=2487, 0 starved, maxDeviation=0.04pp, PASS.** Idempotency: retry skipped. → ORCH-POOL, ORCH-LEDGER-BIN, SIM-SCHED done.

### Fire 3 — qualified-traffic-attribution (shipped)
Qualified-visitor definition + source→activation→revenue rollup + CPA_q channel ranking → feeds suballocation. → QUALIFIED-ATTR done.

### Fire 4 — growth-cron (template shipped, NOT deployed)
`.claude/run-the-loop/templates/growth-cron-worker/` — DST-safe CF Cron Worker triggering ST-1/ST-2 via the OpenClaw runner, idempotency-keyed. Deploy is per-product. → GROWTH-CRON template done; deploy open.

### Fire 5 — growth-policy engine (shipped, TESTED)
`bin/growth-policy.mjs` (§10 scoring, dedupe, Awesome-List cap+90-day+rejected, CPA_q ranking) · `bin/__tests__/growth-policy.test.mjs` **11/11 PASS**. → E2E-GROWTH done.

### Fire 6 — hygiene + adversarial review (shipped, verified)
Fixed 10 pre-existing `_packs` drifts (→ 0 drift) + created `thinking.yml`. Full gate sweep + both suites re-passed = 2nd clean pass. → PACK-DRIFT done.

## Verification evidence (this run)
audit-plugin-manifest ✔ (29/23/186) · validate-agents 0 ERRORS · check-pack-frontmatter 0 drift · rule-metadata 0 HIGH/ERROR · scheduler-sim PASS · growth-policy 11/11 · JSON valid · always-load budget unaffected.

## Open (next fires) — see BACKLOG.md
GROWTH-CRON deploy · GitLink G-1 (SSR `/repo/:owner/:name`) → G-10 · GROWTH-SKILL-PROMOTE (optional) · TOKEN-ACCOUNTING actuals · portfolio extension. Not committed: changes sit in the working tree atop a pre-existing dirty tree — awaiting review.
