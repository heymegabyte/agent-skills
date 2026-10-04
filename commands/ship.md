---
description: Fires on `/ship <intent>`, "ship it", or "deploy to prod" with a clear ask — self-resolves the target (repo/worker/URL/lane) via ccctl and runs the full understand→improve→implement→test→deploy→verify pipeline.
argument-hint: "<natural language change, optionally 'on <domain>'>"
---

# /ship — the universal implement→deploy→verify command

One shot: UNDERSTAND → IMPROVE → IMPLEMENT → TEST → DEPLOY → INVALIDATE → VERIFY → CLEAN → REPORT.
`/ship` ships ONE change; `/run-the-loop` drives many — integrate, never duplicate that pipeline.

## Step 0 — RESOLVE + PLAN (always first)

- Run `node .claude/control-plane/ccctl.mjs plan [domain] "<intent>" --files <a,b>` FIRST.
  Pass the domain only if the user named one (e.g. "on njsk.org"); else omit — ccctl uses cwd.
- Fallback path if `.claude/control-plane/ccctl.mjs` is absent: `~/.claude/plugins/heymegabyte-agent-skills/control-plane/ccctl.mjs`.
- Read `target` (domain, repo, worker, prodUrl, liveUrl, verifyUrl, dnsStatus, framework, packageManager, buildCmd, checkCmd, testCmd, deployCmd, deployNoBuildCmd, healthPath) and `risk.lane` + `risk.verify`.
- NEVER ask the user for repo / worker / deploy command / framework / build command — ccctl answers all of it.
- `verifyUrl` = workers.dev when `dnsStatus` is pending, else the custom domain. Verify against `verifyUrl`.

## UNDERSTAND (inspect reality before editing)

- Inspect the LIVE `verifyUrl` before touching code (fetch or remote browser) — see what actually renders.
- Grep to locate the implementation yourself; never ask the user which file.
- Speculate in parallel: batch independent tool calls in one block — locate code + inspect prod + find related tests at once.

## IMPROVE (taste, bounded)

- Apply taste: refine copy/spacing/motion; preserve accessibility + contrast (never regress WCAG AA).
- Extra-mile the change where cheap, but NEVER expand a 1-line ask into a redesign.

## IMPLEMENT

- Smallest correct change that satisfies the intent.
- Match surrounding style (naming, imports, formatting) — read the neighbors first.

## TEST (lane-appropriate, from ccctl `risk.lane`)

- FAST → targeted `tsc` + only the directly-related unit tests.
- NORMAL → unit + the changed-route E2E.
- HIGH → full `checkCmd` + worker-runtime tests + a failing-test-first regression.
- Any behavior change is TDD-first (write the failing test, watch RED, then GREEN) regardless of lane.
- Escalate the lane automatically when targeted tests reveal uncertainty — widen, don't guess.

## DEPLOY

- Capture the rollback ref FIRST: `npx wrangler deployments list` → note the current live version id.
- Deploy with `target.deployCmd` (chains build → deploy atomically).
- NEVER run `wrangler deploy` while a build is running — a mid-write `dist/` ships a partial bundle (site-wide 404).
- Prefer capability order: ProjectSites MCP → Cloudflare MCP / CF plugin → wrangler + CF REST (`X-Auth-Email`+`X-Auth-Key` global key) → GitHub push → Workers Builds.

## INVALIDATE

- Run `ccctl invalidation-plan --files <a,b>`; apply the fastest CORRECT option:
  versioned/hashed asset (no purge) > specific-URL purge > bump SW `CACHE_VERSION`.
- NEVER full-zone purge for a scoped change.

## VERIFY (the change must be OBSERVABLE live)

- Fast HTTP first: `ccctl verify <target.verifyUrl> --asset <p> --contains "<s>"` (real Chrome UA, exit 1 on fail).
- THEN remote browser (order: CF Browser Rendering REST → Browserbase/Stagehand → local Playwright):
  screenshot the changed element at the lane's breakpoints, assert computed style / DOM, 0 new console errors.
- Reconcile what RENDERS vs the intent AND vs the data source (a clean 200 can show wrong/stale data).
- "Deploy succeeded" is NOT success — success = the change is visible on the live URL.

## CLEAN (finally-style, even on failure)

- Close/recycle browser sessions; delete temp fixtures.
- Restore any test-created state — tag every test record with a run id so cleanup is exact.

## ROLLBACK

- On a release-attributable failure: `npx wrangler rollback <prior-version>` then re-verify the prior build is healthy.

## REPORT (exact headings)

- **Shipped** — what changed, in one line.
- **Production** — the live URL.
- **Deployment** — commit + version id + preview URL.
- **Verification** — HTTP + browser evidence (asserted style/content, console clean).
- **Cache** — invalidation applied + why.
- **Cleanup** — sessions closed, state restored.
- **Rollback** — ref captured (and used, if triggered).

## Risk lanes

- **FAST** — copy/style/asset; targeted tsc + related unit; 1 breakpoint browser check.
- **NORMAL** — feature/route logic; unit + changed-route E2E; multi-breakpoint check.
- **HIGH** — auth/payments/data/migrations; full check + worker-runtime + regression + rollback preserved + prod-data guarded.
- Escalate automatically when targeted tests reveal uncertainty.

## On claude.ai web (isolated sandbox, no ~/.claude)

- ccctl `resolve` uses cwd — the repo is already cloned; the same pipeline applies.
- May also push a branch / open a PR; optionally draft a deploy-summary email — send only with explicit approval.
