---
name: "complete-saas-before-first-review"
priority: 1
pack: "core"
triggers: ["saas", "build app", "ship", "release", "deploy", "verify", "coverage", "mutation", "acceptance", "done", "e2e", "production journey"]
paths:
  - "*"
last_reviewed: 2026-11-28
superseded_by: null
---

# Complete SaaS Before First Review — Evidence-Complete Delivery & Release Verification

Deliver the COMPLETE intended SaaS before Brian's first manual review — autonomously through implement → test → small commits to main → prod deploy → verify → correct. "Complete" = every declared requirement has VALID EVIDENCE of its real user outcome. A coverage/pass percentage is an input, never proof; "tests passed" is never a substitute for proof of the required user outcome.

This is the capstone contract over `[[intent-complete-delivery]]` (scope), `[[verification-loop]]` (deploy+prod-E2E mechanics), and `[[feature-expansion-mandate]]` (the feature floor) — it adds the EVIDENCE, COVERAGE, and RELEASE-INTEGRITY gates those don't spell out. Applies to new apps AND ongoing changes.

## Evidence over percentages (the completion test)

- DONE = every in-scope requirement + catalogued user action has FRESH evidence of its real outcome. Percentages (coverage %, pass %) never establish correctness.
- Relay the proven USER OUTCOME (durable result, persisted, visible, reachable) — never report "tests passed / 100% coverage" as completion.
- An accepted request / toast / async `200` / `202` is INTERMEDIATE evidence — verify the completed durable result (the row written, the file exported, the email delivered to the sandbox).
- A short/vague prompt never silently removes the SaaS baseline — thin brief ≠ thin scope (`[[predictive-completeness]]`).

## Scope → OpenSpec → one owner (plan the whole SaaS)

- Expand the prompt into OpenSpec requirements + acceptance criteria + roles + domain objects + state transitions + integrations + a testable completion checklist; keep requirement IDs; record assumptions.
- Apply the full SaaS baseline unless Brian overrides: auth (signup/login/logout/verify/recover) · onboarding · orgs/workspaces/invites/roles/tenant-isolation · profiles/settings · plans/billing/invoices/quotas/entitlements · domain CRUD/search/filter/sort/paginate/import/export/delete · notifications · API keys/integrations/webhooks · admin/audit/help/support · responsive accessible UI · background jobs/health/telemetry/migrations/recovery. Add every product-specific promise; reuse through `@theme.tools`.
- One owner per OpenSpec change drives its WHOLE implementation + tests (`[[openspec-change-ownership]]`); parallelize ACROSS changes; use independent review.
- Reconcile requirements against ACTUAL routes/controls/APIs/components/jobs/integrations/product-claims; route every discovered gap to the owning change (`[[drift-detection]]`).

## Build the interface from user goals (create the missing action, whole)

- Before trusting the existing UI, build a **role × state × intended-action × outcome catalog**: prerequisites · entry point · controls · permissions · validation · pending/success/failure feedback · durable result · cancel/retry/undo/recovery.
- Where a required control doesn't exist, CREATE it end-to-end — nav/button/menu/form/dialog/status + its authorization + API + persistence + async work + Storybook states + tests. A click handler or success toast is NOT the feature (`[[interconnectedness]]`).
- Every catalogued action has a DISCOVERABLE route for authorized users in its applicable state + a verified outcome. Never present an inert control as usable — disable with the reason + fix, or hide (`[[embarrassingly-easy-to-use]]`).
- Independent UNSCRIPTED review: a reviewer attempts the persona's representative tasks with NO step-by-step, flagging missing/confusing controls (`[[adversarial-twin-before-ship]]`). Record speculative features separately.

## Coverage + mutation gates (numeric floors, anti-gamed)

| Scope / metric | Required minimum |
| --- | --- |
| All owned executable production source, per app/package | 85% lines, statements, functions; 80% branches |
| New/changed executable LINES vs last-verified baseline | 90% (all lines are new for a new app) |
| Each critical module (auth, authz, tenant-isolation, billing/balance, destructive-action, persistence) | 95% lines, statements, functions, branches — enforced SEPARATELY |
| Mutation score — core business logic | 80% |
| Mutation score — critical business logic | 90% |
| In-scope acceptance criteria + catalogued user actions verified | 100% |
| Critical acceptance criteria automated | 100% |
| Routine acceptance criteria automated | 90%; directly verify the remainder yourself |
| Designated golden paths + critical production journeys | 100% pass |
| Enumerated critical integration / permission / boundary / failure / state-transition / forbidden-action cases | 100% verified at the appropriate layer |

- Apply the HIGHER applicable threshold; enforce critical-module gates separately.
- Denominators INCLUDE unimported + untested owned production source; test/fixture code can't inflate them. Merge coverage by SOURCE IDENTITY, never average percentages. Measure changed LINES, not whole changed files.
- Mutation: full valid-mutant score including uncovered mutants; FAILING exit enforced. Investigate surviving critical mutants; separate mutant-timeouts from runner failures; report + independently justify every exclusion/invalid/equivalent mutant.
- Behavior/requirement coverage governs functional + E2E completeness — don't invent an E2E code-coverage quota; a behavior counts only when its OUTCOME is asserted.
- Never weaken assertions, thresholds, scope, or visual baselines merely to pass.

## Golden-path families (honest, independent, no cheating)

- Traceability: requirement → role/state/transition/invariant → scenario → explicit assertions → release evidence. Journeys compose reusable actions with pre/postconditions.
- Each golden path proves a real business result INCLUDING persistence after reload / fresh session, the right permissions, and completion of async work.
- Cover success + invalid input + empty/populated + rejection + cancel + retry + duplicate submit + concurrent edit + partial failure + recovery + forbidden transition; critical transition pairs; before/at/after expiry/trial/renewal/cancel/quota-reset; event ordering (duplicate/out-of-order webhooks + jobs) tested separately from input combos.
- Property/model tests for invariants (tenant isolation, idempotency, accounting consistency, serialization, state validity); derive expectations from a SIMPLE independent model, never copied implementation logic; save failing seeds + minimized examples as regressions.
- **Seed prerequisites, never the outcome the journey must produce.** Start from ordinary navigation with accessible names/roles + real pointer/keyboard/touch — never forced clicks, hidden routes, internal calls, or fixture writes standing in for the action under test. Test required deep links separately. No single dependent mega-test; never claim exhaustive path coverage.

## TDD layering + Storybook

- Author acceptance scenarios FIRST. Local red→green→refactor with unit/component/focused-isolated-integration. Author full-system E2E first but RUN it only against the deployed prod build (`[[no-staging-doctrine]]`) — never deploy broken code/mutants to manufacture a red.
- Any complete workflow through the assembled app is E2E-type (incl. API-only). Mocks only at declared boundaries; prod journeys hit real owned services.
- Put UI states + interaction assertions + a11y checks + visual fixtures into `ui.theme.tools`/Storybook (`@storybook/addon-vitest`, portable stories, shared fixtures). A11y failures FAIL the command. Semantic locators + deterministic fixtures + condition-based waits — no arbitrary sleeps, no implementation-mirroring tests (`[[error-recovery]]` § condition-based-waiting).

## Release workflow + deployment authority (local `pnpm ship`, no CI dependency)

- One local command (`pnpm ship`) enforces every gate with CI unset: resolve affected scope → local type/lint/security/build-readiness + required local tests → small coherent main commit + safe push → build an IMMUTABLE artifact from a clean checkout of the committed SHA (inject release identity as build metadata) → deploy prod → readiness → fresh prod E2E/visual/operational → fix or recover → publish evidence.
- Commit + deploy promptly after local gates; don't wait for hosted CI; no mandatory staging/PR (`[[solo-rituals-eliminated]]`, `[[no-staging-doctrine]]`). Preserve unrelated work; never force-push over it.
- ONE deployment authority: acquire a per-app release LEASE before pushing a deployable candidate; hold it through verify/recovery. Coordinate or disable git-triggered deploys so they can't race or bypass. A newer-than-expected deployment INVALIDATES earlier candidate verification.
- Bind every test/build/deploy record to source SHA + artifact digest + config/dependency inputs + shared-package versions + actual deployment identity. Rerun affected gates after any intervening edit/merge/rebase/hook/generated-source change. Never report one version's results for another.

## Verify the ACTUAL running production release

- Every deployed HTTP service exposes a readiness check = EXACTLY `200` + a populated structured body + release identity. Non-HTTP workers: instrumented synthetic-work completion surfaced via readiness/telemetry.
- A successful HTML route = exact `200` + correct content-type + nonempty route-specific document identity + permitted redirect/final URL + a populated post-hydration DOM with the actionable controls + required scripts/styles + release marker. Reject stale releases, wrong-context login/interstitial, wrong-route SPA fallback, empty shells, stuck loaders, failed required assets, unexpected exceptions (`[[verify-against-source-of-truth]]`; soft-404 + assets-first gotchas in `[[verification-loop]]`).
- Respect each endpoint's contract: legitimate `201/202/204` and negative `401/403/404` must NOT be forced to `200`/HTML to make a check green. Inspect correlated logs/telemetry for the tested failures (never expose secrets).

## Isolate prod tests; verify lifecycle compatibility

- Use scoped SYNTHETIC prod tenants/accounts with ordinary auth. Isolate by release/app/browser-project/shard/worker/test; separate contexts + data per concurrent role. Route payments/messaging through provider SANDBOXES / controlled destinations.
- NEVER bypass authorization, switch global prod credentials, charge real customers, modify unrelated customer data, change shared prod time, assume a browser clock changes server time, or rewind shared prod data. State exactly which integration boundaries were verified.
- Idempotent scoped cleanup + expiry for interrupted runs; verify cleanup (`[[idempotency-by-default]]`, `[[kill-switch-covenant]]`). Mutation / negative-control / fault-injection runs stay at isolated local boundaries.
- After deploy, verify backwards-compat: existing-session / old-client + new-backend, unsaved work, retained-asset compatibility, queued operations, compatible schema transitions (specify expected client/server versions per scenario). Use compatible migrations; retain a recoverable last-verified artifact + config (`[[backwards-compatibility-removal-cadence]]`).

## Browser profiles (honest labels)

- Routine release: run required journeys primarily in REAL Chrome desktop + mobile layout/interaction checks (narrow-screen nav, forms, dialogs, overflow, touch targets). Select actual Chrome (Playwright `chrome` channel) and record the real browser/version; label emulation accurately — never claim Chrome when you ran Chromium.
- Final / major-feature handoff (or material compatibility risk): run Chromium + Firefox + WebKit across the support matrix; record the chosen profile + the expansion reason. "Final" = acceptance-ready, not every intermediate push.

## Parallelize, but keep evidence fresh + complete

- Target ~60s verification for a warm small release: dependency-aware scheduling, independent OpenSpec owners, duration-balanced shards, warm browser pools, fresh isolated contexts; bound by CPU/RAM, browser/session limits, DB contention, provider quotas, prod capacity. Causal steps stay sequential — parallelism can't remove an async dependency.
- Affected-graph selection (Nx or equivalent) from the last FULLY-verified SHA to the candidate — include transitive code, tokens/themes, config, adapters, lockfiles, runtime inputs; broaden when impact is uncertain.
- Maintain the shared-library consumer registry: when `ui.theme.tools`/`@theme.tools` changes, EVERY affected consumer app receives the candidate version AND passes its own checks — testing an old deployed dependency does NOT qualify (`[[dogfood-theme-tools-main-and-logo-registry]]`, `[[one-canonical-seam]]`).
- Reuse only deterministic LOCAL results whose complete inputs match; PROD checks are ALWAYS fresh. Report verification time + total release time separately; never drop a required check to hit the target.

## Verify the verifier; recover correctly

- Enforce gates unconditionally: no focused/`.only` tests, no unexpected zero-test discovery, no skipped required tests, no missing/crashed shards, no stale reports, no unhandled errors, no swallowed exits, no below-threshold pass. Reconcile expected test/shard IDs against complete reports. A diagnostic retry must NOT launder a failed required check into a clean pass; record flakes.
- When the verifier or its config changes, prove with isolated NEGATIVE CONTROLS that assertion-failure, missing evidence, wrong SHA, insufficient coverage, failed cleanup, and runner errors each CANNOT produce a "verified" release. Pending mutants + infra-invalid results stay unresolved.
- Classify every failure: application regression | verification-infra failure | external blocker. Auto-restore a compatible last-verified RELEASE (code, never data) for regressions causing outage / security / data-integrity risk / broken core flow — a layout defect that blocks a core action counts. Fix-forward when rollback can't recover. After recovery, verify the ACTUALLY-ROUTED restored version (readiness + correct HTML + critical flows). The failed candidate stays incomplete until a replacement meets its requirements.

## Finish only when (completion gate)

- Required scope + inferred controls + numeric gates + fresh prod journeys + independent visual review + affected consumers + cleanup ALL have valid evidence, with zero unresolved completion-blocking finding.
- Report: prod URLs · verified SHA/deployment/shared-package versions · actual coverage + mutation denominators/results · acceptance/action/journey counts · browser/device profiles · visual references + findings · shard completeness · timings · recovery status. Attach useful reports/traces/screenshots. Disclose every true blocker or unverified claim.

## Anti-patterns

- "Tests passed / 100% coverage" reported as done without proof of the user outcome.
- Averaging coverage, counting changed-FILES not changed-LINES, or excluding untested owned source from denominators.
- E2E that force-clicks hidden routes, writes fixtures for the action under test, or seeds the very outcome it should produce.
- Treating an async `200`/`202`/toast as the durable result; forcing `201/202/204/401/403/404` endpoints to `200`/HTML to green a check.
- A second racing git-triggered deploy; reporting one version's results against another SHA.
- Charging real customers, mutating unrelated customer data, or rewinding prod data during tests.
- Shipping a `@theme.tools` change without re-verifying every consumer app on the new version.
- A verifier that can't fail (no negative control), a `.only` left in, or a diagnostic retry laundering a red into green.

## Cross-links

`[[intent-complete-delivery]]` · `[[verification-loop]]` · `[[predictive-completeness]]` · `[[feature-expansion-mandate]]` · `[[openspec-change-ownership]]` · `[[no-staging-doctrine]]` · `[[solo-rituals-eliminated]]` · `[[verify-against-source-of-truth]]` · `[[adversarial-twin-before-ship]]` · `[[drift-detection]]` · `[[embarrassingly-easy-to-use]]` · `[[interconnectedness]]` · `[[idempotency-by-default]]` · `[[dogfood-theme-tools-main-and-logo-registry]]` · `[[backwards-compatibility-removal-cadence]]` · `[[kill-switch-covenant]]` · `[[one-canonical-seam]]` · `saas-feature-completeness` skill · `long-trail-tdd` skill.
