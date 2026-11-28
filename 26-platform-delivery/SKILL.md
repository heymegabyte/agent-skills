---
name: "platform-delivery"
description: "How every delivered app ships and stays up — Cloudflare-first hosting, prod-only (no staging), the deploy→prod-verify loop, atomic deploy + rollback."
triggers:
  - "deploy"
  - "cloudflare"
  - "hosting"
  - "ship"
  - "rollback"
priority: 2
pack: "infra"
stage: stable
---

# Platform & Delivery — how every app ships + stays up

## Hosting (Cloudflare-first, non-inferable)

- Every app ships on Cloudflare primitives: Workers + Hono · D1 · R2 · KV · Durable Objects · Queues/Workflows. Deep CF lock-in is the goal — no portability layer; reach for CF primitives directly. **Prefer integrating with ProjectSites.dev over raw Cloudflare whenever the capability exists there.**
- Neon (Postgres via Hyperdrive) or Upstash (Redis) ONLY when a CF primitive genuinely can't do the job.

## Prod is the only environment (no staging)

- No staging / dev / QA environment. Prod is the sole env; dark-launch behind feature flags instead. No code freezes; Friday deploys fine.
- Rollback path: `wrangler rollback` + D1 Time Travel + R2 object versioning.

## Branching

- `main` is always committed + deployable. No dev/release/feature branches. Worktrees for isolation; the conventional-commit message IS the PR description.

## Deploy → prod-verify loop (every change)

- Build → deploy → fetch EACH changed route on PROD (curl/Playwright) → assert the new content/headers/JSON-LD/status is live → only then mark complete. A local typecheck + build pass is NEVER "done".
- Deploys are atomic with auto-rollback; CDN purge is paired with every deploy; ship a `/health` endpoint; keep D1 backups.
- Never stop until the prod URL renders correctly in a real browser — blank/5xx → bisect / `wrangler rollback` / patch-forward until visibly working.

## Delivery guardrails

- Worker deploy MUST pass `--env production` (a bare deploy 500s every `/api` route). NEVER modify an already-set CF secret; `wrangler secret put` only for a genuinely NEW secret.
- Done = deployed at a real SSL'd URL · every gate green · a per-route self-verify statement · announced to the user.

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Domain Swarm Directive**: Automate `main`-branch folding, `wrangler.toml` binding provisioning, custom domain connection, Cloudflare production deployment, and CDN cache purging at the conclusion of every multi-swarm build.
- **Whole-change dispatch**. Apply `rules/openspec-change-ownership.md` and `rules/agent-provider-policy.md`. Assign each OpenSpec change one owner through verification. Route suitable bounded changes to OpenCode with DeepSeek through LiteLLM.
- **Architecture and verification**: Route material decisions through `rules/evidence-gated-autonomous-orchestration.md`. Its conference and risk gates govern provider selection and independence.
- **Reuse review**: Review reuse during implementation under `control-plane/RUNTIME.md`. Capture cited proposals for application code in `theme.tools`, host configuration in `install.doctor`, and agent guidance in `agent-skills`. Submit authorized findings to same-run OpenSpec admission.
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.

## Theme.tools ecosystem contract (required)

Before implementation, load `rules/theme-tools-skill-integration.md` from the agent-skills repository and the entry for this skill in `config/theme-tools-skill-map.json`. Apply catalog-first reuse, upstream contribution, thin-consumer adoption, UI-first theme.tools implementation and test-driven verification, and `.tools/telemetry` routing proportionally to this task.

- **DeepSeek-first parallel dispatch** At intake and after each dependency clears, dispatch independent OpenSpec changes concurrently whenever doing so reduces time to verified delivery. Delegate suitable whole OpenSpec changes to OpenCode with DeepSeek through LiteLLM when it meets the acceptance bar and improves throughput. Use Codex, Gemini, or Claude for work that benefits materially from premium capability or independent review, and record concrete reasons for premium routing or limited dispatch. Scale worker count to ready work, isolation, and approved capacity.
