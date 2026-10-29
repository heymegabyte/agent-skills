# Fleet optimization — the top-30 knobs

The full set of concrete, non-obvious knobs that make the Paperclip → OpenClaw → claw-router → tier-agent layers PERFORM — the expansion behind `rules/paperclip-openclaw-fleet-doctrine.md` § Fleet config knobs. GENERIC + reusable; per-deployment specifics (company id, API base, account names, creds) stay in project memory + Infisical/get-secret, NEVER here. Adapter subscription-auth is already HARD in `[[agent-provider-policy]]` — a stray `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` in any adapter env is a violation.

## A. Subscription pooling + model routing

1. **claw-router reserve** — run official `openclaw/clawrouter` as the subscription POOL; set `grantRouting.includedQuotaReservePercent` (~10–20) so a pooled account STOPS before its 5h/weekly window → no silent paid-API overage.
2. **Headroom awareness** — watch per-account reset times via the Subscriptions page / `GET /v1/admin/upstream-grants/usage`; route AROUND an exhausted account rather than letting it fall through to paid.
3. **Stale-pool default** — a stale claw-router pool silently blocks every `claude_local` agent ("no live execution path"); re-auth is interactive, so DEFAULT agents to `opencode_local`/DeepSeek and reserve `claude_local` for genuine judgment roles.
4. **Cost-aware routing scores USER messages only** — never the big system prompt (which would inflate every call to the top tier) → the cheapest CAPABLE model handles ~80% of calls.
5. **Session handoff** — downgrade a live session expensive→cheap the moment the hard thinking is done (a stuck Claude session → Codex). The key cost lever.
6. **Quota preservation** — the Claude Max 5h/weekly window is the SCARCE resource; route aggressively to OpenCode/DeepSeek, spend Claude only where it uniquely wins.

## B. Heartbeats + scheduling

7. **Heartbeat cadence** — `agents.defaults.heartbeat.every` (30m API / 1h OAuth) + `activeHours` + `skipWhenBusy`.
8. **Lean monitor heartbeats** — `lightContext:true` (inject only a per-repo `HEARTBEAT.md`) + `isolatedSession` for monitor wakes; a WORKING heartbeat picks up + drives an issue to done.
9. **Materialize the cron row** — heartbeats silently don't fire if the cron row is off → `openclaw doctor --fix`.
10. **Prefer working over monitor** heartbeats wherever a queue has items (the loop is generative — real work almost always exists).
11. **Schedule resilience** — stagger off :00/:30; GitHub schedules drop → persisted deadlines + catch-up + a stale-heartbeat watchdog (don't make the failed scheduler its own watchdog).

## C. Sandboxes + workers

12. **Crabbox per untrusted/parallel turn** — disposable box with an `idleTimeout` lease-heartbeat + a `target` OS (linux default; windows/wsl2/macos for OS-specific work).
13. **Worker credentials** — put `gh` on the worker PATH + bind creds via the sealed launcher + `get-secret`, never baked into the image.
14. **Execution-gate: `environment probe` MUST pass** — a `managed-sandbox-only` instance with a broken provider blocks the ENTIRE fleet; verify the probe BEFORE expecting any agent to run (it masquerades as an adapter/pool problem but is upstream).
15. **Isolate a provider bug from a credential issue** — test the sandbox provider's RAW API directly; a provider that boots via its own API while Paperclip's integration fails proves the bug is in the orchestrator.
16. **One worker profile** serves both an OpenClaw worker-turn and a Codex remote-exec.

## D. Cost + budgets

17. **Enforce caps where they exist** — `maxBudgetUsd` (orchestrator) + `includedQuotaReservePercent` (router) + Paperclip per-agent/project budgets; NOT at the OpenClaw gateway (it exposes usage-cost but has NO per-agent budget-cap key).
18. **Unify the three cost ledgers** — `clawo runs` (per-turn $) + `openclaw gateway usage-cost` + claw-router per-grant usage → one Paperclip budget view.

## E. Execution-gate diagnostics (silent blockers — verify with a real `heartbeat run`, not a config read)

19. **NULL `repoRef`** on a workspace → every turn dies "Could not read execution-target Git context" (no blockReason); set `repoRef`/`defaultRef` = the repo's actual default branch.
20. **Dead-pool assignee** → an issue assigned to a stale-pool `claude_local` agent can never run; reassign to a pool-independent `opencode_local`/DeepSeek agent.
21. **`pending_cleanup` lease** (from an auth-failed cleanup) has no CLI/REST release → targeted DB surgery (`UPDATE environment_leases SET status='released'`).
22. **A `heartbeat run` is ground truth** — the trace proves env-lease + model-invoked + commit and names the NEXT blocker; a config read proves nothing.

## F. Observability

23. **All rails on every project** — PostHog + GA4 + Sentry + Langfuse + Cloudflare AI Gateway; trace the fleet's OWN agent runs too (Langfuse for model calls).
24. **Signal → backlog automatically** — a `fleet-health` routine turns run telemetry into work; a stalled loop surfaces on the heartbeat, never spins silently.

## G. Secrets

25. **Infisical-injected at run start** — never baked/logged/pasted into prompts; subscription auth (Claude/Codex) is NOT a secret to inject — it stays in the CLI/claw-router homes.

## H. Governance + the issue→merge pipeline

26. **Done-criteria** — a run is DONE only when an acceptance contract it did NOT write passes (reviewer ≠ author); use clawo councils (worktrees + consensus) for hard issues, a single session for routine ones.
27. **Single-writer invariants** — NEVER retry a 409; every mutating request carries `X-Paperclip-Run-Id`.
28. **Selective decomposition** — split on real boundaries only (a plan's steps are NOT each a task); sequence via `blockedByIssueIds` (parent/child nesting + prose do NOT delay execution).
29. **Agent-path disambiguation** — ACP/acpx (harness session) vs native `/codex` (app-server) vs CLI-backends (model runtime); `coding-agent` delegation is `background:true` always, `pty:true` for Codex/OpenCode, and Codex never inherits ambient `CODEX_HOME`.
30. **Computer-Use routing** — session-affinity (route a CU task to the node holding the logged-in session) + a CU-capability flag on adapters (never route GUI-CU to an incapable adapter) + evidence-rich approval gates (before/after screenshot + screen-recording) for irreversible CU.

## Cross-links

`[[paperclip-openclaw-fleet-doctrine]]` (the doctrine this expands) · `[[agent-provider-policy]]` (subscription-only) · `reference/PAPERCLIP-OPS.md` (the API capability matrix).
