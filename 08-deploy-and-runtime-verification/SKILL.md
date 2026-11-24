---
name: "deploy-and-runtime-verification"
description: "MANDATORY deploy after every code change. Typecheck → deploy → purge CDN → E2E on production → visual verify → fix-forward loop. Workers Builds native CI/CD, D1 Time Travel PIT recovery, D1→R2 long-term backups, wrangler rollback, wrangler secrets management, structured observability, cross-browser smoke tests, rollback procedures, and GitHub auto-configuration."
metadata:
  version: "2.1.0"
  updated: "2026-10-04"
  effort: "high"
  model: "sonnet"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
submodules:
  - backup-and-disaster-recovery.md
  - changelog-and-releases.md
  - ci-cd-pipeline.md
  - critical-css.md
  - font-subsetting.md
  - gh-fix-ci.md
  - launch-day-sequence.md
  - pipeline-health-check.md
  - r2-lifecycle.md
  - service-worker.md
  - uptime-and-health.md
priority: 2
pack: "backend"
stage: stable
triggers:
  - "deploy"
  - "wrangler deploy"
  - "rollback"
paths:
  - "concern:cloudflare-workers"
---

# 08 — Deploy and Runtime Verification

Enforce the mandatory typecheck→deploy→CDN-purge→prod-E2E→visual-verify loop after every code change; never mark done without a live PROD assertion.

## Mandatory deploy loop (every code change)

1. Build + typecheck
2. `wrangler deploy` (or platform equivalent)
3. Purge CDN (`wrangler cache purge` or `curl -X POST https://api.cloudflare.com/client/v4/zones/{id}/purge_cache`)
4. Fetch each changed route on PROD URL via curl + Playwright
5. Assert new content / headers / JSON-LD / status live
6. AI vision QA at 6 viewports (per `_kernel/standards.md#breakpoints`)
7. Fix-forward (max 3 redeploys) — never silently fail
8. Only then mark DONE

"Local typecheck + build pass" is NOT done. Per `rules/verification-loop.md`.

## Auth fallback chain

- `CLOUDFLARE_API_TOKEN` from `/Users/Apple/.local/bin/get-secret`
- On 401: `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL`
- Both stale: prompt `! npx wrangler login`, resume deploy once fresh
- NEVER silently skip deploy because creds missing — surface as blocker

## Cloudflare `cf` CLI transition (beta — doctrine stays wrangler-first)

- `cf` CLI open beta since 2026-09-28: ~3,000 generated API commands (vs wrangler's ~280). Wrangler gets ONE final major redirecting to cf, then 18-month maintenance; config format moves `wrangler.jsonc` → `cloudflare.config.ts` with typed bindings. Wrangler now requires Node ≥22.
- Keep every deploy command wrangler-based while cf is beta (still beta 2026-10, no GA date); re-evaluate at cf GA (signal: non-beta npm dist-tag). Even post-GA, cf shells out to wrangler for esbuild/Rust/Python Workers + can't yet stream live logs (`wrangler tail`) or set single secrets (`wrangler secret put`).

## Workers Builds (native CI/CD)

- Configure in `wrangler.jsonc` `build` block
- Auto-deploys on push to `main` per `rules/main-only-branch.md`
- Runs `npm install` + `npm run build` + `wrangler deploy`
- Secrets injected via dashboard or `wrangler secret put` per `rules/secret-provisioning.md`

## Secrets management

- `wrangler secret put KEY` — runtime secrets; `wrangler secret list` — names only, never values
- Two-way mirror: every prod secret also in chezmoi (`~/.local/share/chezmoi/home/.chezmoitemplates/secrets/{KEY}`)
- `scripts/check-secrets.mjs --audit` runs before every deploy
- Per `rules/secret-provisioning.md` + `rules/secret-auto-provisioning.md`

## D1 backup strategy

- **Time Travel** — 30-day PIT, free: `wrangler d1 time-travel restore <db> --timestamp=<ts>`
- **D1 → R2 long-term** — `wrangler d1 export <db> --output=backup.sql` + upload to R2 daily via cron
- **Pre-migration safety** — `wrangler d1 export` BEFORE any destructive migration
- 1 TB storage limit per account, 10 GB per database

## Rollback procedures

- **Worker** — `wrangler rollback <version-id>` in <30s
- **D1** — Time Travel PIT to known-good timestamp
- **R2** — bucket versioning enabled; revert via object version
- **Combined deploy** — log `{commit, version_id, timestamp}` to D1 after every deploy; rollback target one query away

## Auto-rollback gates (gradual deployment)

- 1% → watch error rate 5 min → 10% → watch 5 min → 100%
- Auto-rollback at p99 error >1% or LCP regression >20%

## Browser console gate

Per `rules/verification-loop.md` § Console-error gate — all must be 0:

- Console errors / CSP report-uri violations / Trusted Types violations / Deprecation warnings / Third-party script errors

Run as part of `npm run e2e:prod` Playwright suite.

## Cross-browser smoke

Per `_kernel/standards.md#breakpoints` × 3 browsers (Chromium, Firefox, WebKit):

- Homepage loads; primary CTA clickable; form submit succeeds (Turnstile invisible)
- No console errors at any breakpoint
- Lighthouse Perf ≥75 + A11y ≥95

## Observability check post-deploy

Verify each is firing (missing = blocker):

- Sentry — recent events in dashboard
- PostHog — recent pageviews + captures
- Workers Tracing — recent traces in Axiom (Tier 2)
- AI Gateway — recent LLM calls logged (Tier 3)
- GA4 — recent events (Tier 2)

## GitHub auto-configuration

- New project: `gh repo create` with template
- Add CF Workers Builds via dashboard or API
- Wire OIDC + `cloudflare/wrangler-action@v3` for CI
- Trust policy: GitHub OIDC token verifies repo + branch — no long-lived `CLOUDFLARE_API_TOKEN` in repo secrets

## Per-deploy CHANGELOG entry

Every deploy logs to `CHANGELOG.md` (`## [version] — YYYY-MM-DD` / `### Added / Changed / Fixed`). Auto-generated by `changelog-generator` agent from conventional commits.

## See submodules: workers-builds.md, d1-backups.md, rollback.md, github-config.md.

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Domain Swarm Directive**: Run pre-deploy contract gates in parallel, fold verified swarm worktrees cleanly onto `main`, provision Cloudflare Worker bindings (`wrangler.toml`) and custom domain SSL routing, deploy to production, purge the Cloudflare CDN cache, and run parallel post-deploy Browser Run smoke probes.
- **Massive OpenCode (DeepSeek) Offload**: Whenever a task slice is throughput-safe (bounded implementation, plugin catalog shards, 100% unit test generation, Playwright E2E specs, migrations, or documentation), offload it to parallel **`opencode` swarms powered by DeepSeek** (`~/.agentskills/bin/opencode-deepseek.sh` via the LiteLLM 4-key pool `https://llm.megabyte.space/v1`) rather than consuming premium `claude`, `codex`, or `gemini` client quota.
- **Tri-Frontier Parallel Swarms & Right-Sized SCRUM Quorum**: When complex architectural synthesis, speculative critical-path racing, or adversarial verification is needed, run `claude`, `codex`, and `gemini` in parallel across isolated Git worktrees (`bin/multi-swarm-orchestrator.ts`) guided by a right-sized collaborative SCRUM meeting (`bin/scrum-deliberation-quorum.ts`) of only the required specialist agents. See `rules/parallel-multi-swarm-orchestration.md`.
- **End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**: At the end of every prompt round (running in parallel with final verification, deployment, and reporting), extract any possible meaning, preference, architectural lesson, reusable site code, or system configuration from the current agent window and store it concurrently into **`heymegabyte/agent-skills`** (for AI skills/rules/prompts — always updated under the **Minimum-Prompt Ecosystem Completeness Assumption**: assuming the skills *should have already been written* so that we write **as few prompts as possible** to finish **as complete a product or multi-repo ecosystem as possible** via massive parallel agent swarms), **`heymegabyte/theme.tools`** (for reusable site/app code across the 28 canonical `@theme.tools/*` libraries), and **`heymegabyte/install.doctor`** (for reusable system/host code).
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.
