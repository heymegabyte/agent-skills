---
last_reviewed: 2026-10-10
superseded_by: null
name: "worker-pool-and-task-ledger"
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Worker Pool & Task Ledger

The persistent scheduling layer the ephemeral `01-operating-system/autonomous-orchestrator` delegates to.
**[MUST] EXTEND, never rewrite** the existing primitives: `bin/claude-pool.sh` (Claude seat LRU+TTL),
`bin/worktree-pool.sh` (isolation slots), `bin/claim-task.sh` (git-commit claim lock),
`rules/parallel-subagent-economy` (≤6 fan-out ceiling), `rules/agent-selection` (role taxonomy).

## [MUST] Five-worker global pool

- Cap **MAX 5 concurrently active AI workers** per global execution pool. Workers are **dynamically
  assigned** per fire (e.g. 3 engineering + 1 QA + 1 research; or 2 eng + 1 SEO + 1 growth + 1 docs) —
  not five permanent specialists.
- Concurrency spans **Claude Code, Codex, OpenCode, OpenClaw, subagents, and independently scheduled jobs**.
- Count active **model-driven coordinators** as workers; lightweight deterministic scheduling processes do **not** occupy a slot.
- Only **one** agent controls a given interactive desktop at a time (desktop lease — see `computer-use-safety`).
- The ≤6 subagent fan-out ceiling (`parallel-subagent-economy`) is the per-orchestrator Agent-call width; this 5-worker cap is the **global** live-coordinator count. They compose: a fire runs ≤5 coordinators, each fanning ≤6 subagents in waves.

## [MUST] Durable leases (hardens the seat model)

Each worker holds a **lease**: `owner`, `pid`, `heartbeat_ts`, `expires_ts`, `task_id`. Expired/stale lease
→ **reclaim** the slot + **re-queue** its slice (salvage any commit first, per `monitor-orchestration` §ECONNRESET).
Builds on `claude-pool.sh` flat-file state (`.limited`/`.lastused`) by adding lease/heartbeat/owner/reclaim.
**Status: schema + policy defined here; the runtime daemon is BACKLOG** (`.claude/run-the-loop/BACKLOG.md` → ORCH-POOL).

## [MUST] Persistent task-ledger schema

SSOT per repo = append-only `.claude/run-the-loop/ledger.ndjson` (schema: `.claude/run-the-loop/task-ledger.schema.json`);
ephemeral in-session tracking may use the harness Task tools. Each task record carries:

`project · category (1–50, per token-allocation) · skill · task_type · origin+evidence · priority ·
dependencies · due+recurrence · est_tokens · est_cost · actual_tokens · actual_cost · assigned_worker ·
lease · status · artifacts/code_refs · acceptance_criteria · verification_evidence · measured_outcomes · next_action`.

- **[MUST]** idempotency + recovery for interrupted jobs.
- **[MUST NOT]** duplicate a successful publish / external contribution / account action after a retry (dedupe on an idempotency key before any outward action).

## [MUST] Weighted-fair scheduler (anti-starvation)

Select the next task by **priority × category-budget-deficit × deadline-proximity**, where deficit = the
category's target (from `token-allocation.categories.json`) minus its recent actual share. Over-weight a
starved category until the mix rebalances; rotate roles fire-to-fire so nothing rots. **[MUST NOT]** invent
busywork to hit a band (see [[token-allocation-policy]] anti-busywork). Lightweight + deterministic — the
scheduler itself never occupies a worker slot.

## Recurrence cadence (defaults — respond to real need/budget/capacity)

- **Every fire:** review status · urgent bugs/incidents · select prioritized work · track allocations · verify completed · update state.
- **Daily:** publish eligible articles · discover acquisition opportunities · review critical prod/workflow errors · run due scheduled work.
- **Weekly:** keyword research · content optimization · competitive research · doc audit · security review · growth-channel measurement · qualified community-outreach discovery · skill-effectiveness review.
- **Monthly:** portfolio allocation review · growth-channel profitability · partnership analysis · content-strategy refresh · model-routing/cost optimization · backlog consolidation.

Standing per-fire tasks live in `.claude/run-the-loop/SPECIAL-TASKS.md`. Persistent scheduling must run
through OpenClaw / Cloudflare Cron (session-independent), **not** a manually-open Claude Code session.
