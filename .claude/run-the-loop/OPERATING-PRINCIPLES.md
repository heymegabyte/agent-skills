# Operating Principles (invariants for every fire)

- **`/run-the-loop` is the primary interface.** One coherent, verified slice per role per fire; resume from `CONVERGENCE.md`; never a false "converged".
- **[MUST] 5-worker global cap** — ≤5 live model-driven coordinators across claude/codex/opencode/openclaw/subagents/scheduled jobs; dynamically assigned, durable leases + heartbeats + reclaim. (`rules/worker-pool-and-task-ledger.md`)
- **[MUST] 50-category allocation** with the protected **5% SEO** floor; reweight by lifecycle stage, recalc to 100%, never busywork to hit a band. (`rules/token-allocation-policy.md`)
- **[MUST] Growth = qualified outcomes, not pageviews.** Honor every distribution-integrity safeguard; Awesome-List ≤2 PRs/product/month + 90-day no-resubmit; **no unauthorized paid spend**; where outreach needs a human, draft + queue. (`rules/autonomous-growth-orchestrator.md`)
- **[MUST] Subscription-CLI HARD rule preserved** — never `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` to make a model work when a CLI can; launch via `bin/with-subscription-cli.sh`; Paperclip manages OpenClaw + CLIs. (`rules/agent-provider-policy.md`)
- **[MUST] Preserve working systems.** Audit before building; extend existing primitives (`claude-pool.sh`, `worktree-pool.sh`, `claim-task.sh`, `autonomous-orchestrator`); additive-first; never rewrite functioning code to satisfy a directive.
- **[MUST] Persistent scheduling** runs through OpenClaw / Cloudflare Cron (session-independent) — never a manually-open Claude Code session.
- **[MUST] Verify before claim** — deploy + prod-E2E for product changes; paste fresh gate output; honest status: planned | implemented | tested | deployed | measured.
- **[SHOULD] Keep always-loaded instructions short** — new capability lands as `priority: 2/3` rules + lazy-loaded specialists, never `priority: 1` / `paths: ["*"]` (protects the 38k always-load budget).
