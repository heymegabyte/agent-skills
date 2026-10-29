# Paperclip — operations & capability matrix

API-accurate Paperclip operations the fleet loop executes against — the reference detail for `rules/paperclip-openclaw-fleet-doctrine.md`. This is the GENERIC capability map + invariants (reusable across any Paperclip deployment). Per-deployment specifics (API base/port, company id, credentials) stay in project memory + Infisical/get-secret — NEVER here.

## Install + surfaces

- Managed install via `npx paperclipai@latest onboard --yes` (Node ≥24.11; Docker ok); CLI binary `paperclipai`.
- A local AUTHED API on loopback. Agents reach it via the LOOPBACK base (`PAPERCLIP_RUNTIME_API_URL`), NOT the Cloudflare-Access-gated public origin (which 302s an unauthenticated write). Keep `PAPERCLIP_API_URL`/`PAPERCLIP_PUBLIC_URL` on the public origin for UI + auth-link generation.
- Embedded Postgres locally → external Neon in prod. Never expose the raw Gateway/Control UI; gate behind Cloudflare Access.
- CLI subcommands: `plugin` · `cost` · `agent` · `routine` · `environment` · `heartbeat` (+ issue/case operations).

## Capability matrix

| Capability | Supported | How | Caveat |
|---|---|---|---|
| Task/issue coordination | yes | issues/cases (mirror GitHub issues) with assignee / reviewer / approvers / watchdog / parent / blocked-by | selective decomposition — a plan's steps are NOT each a task |
| Agent roster + org chart | yes | `agent` (hire / list / runtime-state) | capability-matched assignment; subscription-only adapters |
| Scheduled routines | yes | `routine` (trigger: webhook / api / cron) | a cron row must be materialized + ON (`openclaw doctor --fix`) |
| Budgets + cost | yes | `cost` + the `cost_events` table + `maxBudgetUsd` | enforce at the orchestrator (`maxBudgetUsd`) + router reserve, NOT the OpenClaw gateway (no per-agent budget-cap key there) |
| Approval gates | yes | review → final-approval, evidence-rich (before/after + preview URL) | only irreversible / high-stakes / spend-over-budget |
| Heartbeats | yes | `heartbeat run --agent-id <id>` | a MONITOR heartbeat (lightContext + isolatedSession) only checks; a WORKING heartbeat drives an issue to done |
| Sandboxed execution | conditional | CF Sandbox / Daytona / Crabbox / Local | `environment probe <id>` MUST return ok:true or NO agent executes (see gates) |
| Per-agent budget cap AT the gateway | no | — | use orchestrator `maxBudgetUsd` + router `includedQuotaReservePercent` instead |
| Native GUI Computer Use flag on adapters | no | — | add a CU-capability flag so CU never routes to an incapable adapter |

## HARD invariants (non-negotiable)

- NEVER retry a 409 — the issue is owned by another agent (single-writer). Retrying corrupts ownership.
- EVERY mutating request carries an idempotency run-id header (`X-Paperclip-Run-Id`).
- Agents persist across heartbeats via a memory file; a skill that only works interactively is drift (fleet agents are a runtime too).
- Subscription-only adapters: `claude`/`codex` via the sanitizing launcher, DeepSeek via OpenCode — a stray `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` in any adapter env is a policy violation (`[[agent-provider-policy]]`).

## Execution gates (SILENT blockers — verify with a real `heartbeat run`, never a config read)

- **managed-sandbox-only + a broken sandbox provider** → NO agent executes (`environment probe` ok:false, CF "fetch failed" / Daytona "sandbox creation failed"); masquerades as an adapter/pool problem but is UPSTREAM. Fix one provider's creds OR deliberately allow local execution.
- **NULL `repoRef` on a workspace** → every turn dies "Could not read execution-target Git context" with no blockReason. Set `repoRef`/`defaultRef` = the repo's actual default branch.
- **Stale claude-pool (OAuth expired)** → `claude_local` agents can't run; reassign to `opencode_local`/DeepSeek (also the quota-preservation default) + surface interactive re-auth.
- **`pending_cleanup` lease** (from an auth-failed cleanup) has no CLI/REST release → targeted DB surgery (`UPDATE environment_leases SET status='released'`).

## The 9-step heartbeat (the drain cycle)

1. Reconcile prior runs / expired leases / partial side effects. 2. Refresh incident signals + applicability. 3. Select overdue + soon-due by effective deadline + severity + dependency readiness. 4. Reserve capacity for work due before the next planning opportunity + bounded retries. 5. Dispatch independent work up to account/runner/model limits. 6. Use only remaining capacity for exploration. 7. Record evidence + forecast the next 24h. 8. Done-criteria: a reviewer ≠ author acceptance contract must pass. 9. Close the linked issue on the merged-PR webhook.

## Contract test (fleet-dependent — deferred)

A contract test asserting the LIVE API matches this matrix (CLI subcommands resolve, 409-is-never-retried, the idempotency header is required, `environment probe` gates execution) needs a running Paperclip deployment → fleet-dependent (like the fleet-blocked backlog items); run it from a fleet runtime, not agent-skills CI.

## Cross-links

`[[paperclip-openclaw-fleet-doctrine]]` (the doctrine this details) · `[[agent-provider-policy]]` (subscription-only adapters) · `[[verify-against-source-of-truth]]` (a `heartbeat run` is ground truth, a config read is not).
