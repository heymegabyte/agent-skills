---
name: claude-cloud-first
description: Aggressively consumes claimed, expiring Claude Code cloud-session credit for suitable GitHub-backed unattended work while preserving local subscription capacity.
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Claude Cloud First

Until the claimed credit expires on 2026-11-04, route every suitable GitHub-backed, unattended task to `bin/claude-cloud.sh run` before consuming local Claude quota. Good work includes architecture sweeps, independent reviews, migrations, test generation, backlog slices and long-running repository audits.

Use local Claude for interactive judgment, session-bound local tools, secrets that cannot enter the cloud environment and work needing the current unpushed worktree. Use OpenCode/DeepSeek for cheaper routine throughput. Cloud tasks must use a committed GitHub state, a self-contained OpenSpec/task brief, explicit acceptance tests and no local-only secrets. Inspect the resulting branch/PR; cloud output never self-approves.

**Parallelize AGGRESSIVELY while it lasts (Brian 2026-10-30).** The credit expires 2026-11-04 — spend it to the fullest. For independent GitHub-backed slices, fan out MULTIPLE concurrent cloud sessions (one per slice) rather than running them serially, and in the SAME wave fan out OpenCode/DeepSeek swarms (`[[litellm-gateway]]`, `[[agent-provider-policy]]` § Throughput) for the throughput-safe units — the two rails run in parallel, maximizing coverage per wall-clock and draining the expiring credit on real work. Generalize to ANY expiring credit (track the expiry date; spend highest-expected-value-first) — never let claimed credit lapse unused, and never manufacture busywork to burn it.

Do not manufacture work solely to consume credit. Prefer the highest expected value per credit and record remaining/expiry evidence when available.
