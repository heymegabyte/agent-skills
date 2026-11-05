---
name: 'TDD Verification'
version: '3.0.0'
updated: '2026-11-04'
description: 'Use for features, bug fixes, refactors, test failures, and release verification. Selects the cheapest convincing tests, enforces genuine red-green-refactor, and produces complete evidence.'
---

# TDD and truthful verification

Use this as the authoritative testing workflow. Load only the relevant family guides from `references/testing-families/`; the machine catalog is `references/testing-catalog.json`.

## First establish the test contract

1. State the observable requirement, invariant, ordinary example, and consequential failure.
2. Build the application profile and inspect the existing suite, failures, durations, flakes, dependencies, ownership, and last trustworthy baseline.
3. Separate intended compatibility from discovered defects. Characterize critical correct legacy behavior before refactoring; do not canonize a bug.
4. Choose the cheapest layer that can prove the behavior independently: static, unit/property, component/story, runtime integration/contract, browser/API journey, deployed check, or human evaluation.
5. Bind the requirement to catalog IDs, stable test IDs, inputs, execution tier, owner, and evidence in the existing OpenSpec/requirements record.

## Genuine red → green → refactor

1. Write one focused test before production behavior.
2. Run it and observe a semantic failure caused by absent or incorrect behavior. Syntax, import, fixture, login, credential, or environment failures are harness defects—not RED.
3. If the test passes immediately, it may be characterization or existing behavior; record that truth. Do not invent a red history.
4. Implement the smallest coherent change satisfying the requirement. Never hardcode test inputs, add test-only production paths, or mirror the implementation in assertions.
5. Run focused GREEN, then affected required checks. Refactor only under green and verify again after the final edit.
6. For pure refactors, trustworthy existing tests establish the baseline; no artificial failure is required. For generated code, test the generator plus important consumer contracts. For copy/format-only edits, use proportionate existing checks and inspection.

## Brownfield protection

- Prioritize authentication/recovery, authorization/tenant isolation, billing/irreversible effects, durable writes/deletion, migrations, publishing/rollback, Preview versus Production, AI tool execution, and one complete user journey.
- Add characterization before risky refactors. Every confirmed defect retains a minimal public-interface regression test.
- Expectations come from specifications, domain rules, provider contracts, or independently worked examples—not copied code.
- Preserve critical existing behavior across shared themes, components, schemas, routes, flags, assets, configuration, and external versions.

## UI and Storybook

- Construct application UI from canonical theme.tools themes/assets and ui.theme.tools web components. Add missing reusable capabilities in their canonical repositories rather than duplicating them in applications.
- Storybook is the executable discovery surface for components, sections, complete pages, and full sites. Cover meaningful loaded/loading/empty/error/pending states, interactions, accessibility, responsive behavior, and consumer contracts.
- Keep addon-vitest as the canonical story interaction path. Reuse stories and assertions in remote Playwright against an immutable built Storybook when Browser Run compatibility is required.

## Selective execution

- Prefer the established task graph; use Nx only after inspecting the installed version and proving its graph/inputs are correct. Do not maintain competing graphs.
- Select from validated affected tasks, changed tests/config/fixtures, explicit requirement/route/API/component mappings, supported runner dependencies, trustworthy history, critical sentinels, and risk obligations.
- Missing baselines, deleted/new files, stale maps, dynamic dependencies, unknown global inputs, graph errors, and uncovered behavior widen selection. They never yield an empty pass.
- Emit a selection manifest before execution. Live browser/provider checks run fresh; cache only deterministic work with complete provenance.
- Prove selectivity with controlled changes and periodically compare against broader trusted runs. Disable unsafe optimization at a boundary after a miss.

## Five-minute required path

- Target 300 seconds from workflow acceptance to complete verdict: selection/cache ≤30s; static/unit/component/contract and preview preparation by 120s; selected remote browser and sentinels by 270s; reconciliation in the final 30s.
- Record queue, setup, execution, cold/warm behavior, capacity, cache provenance, browser minutes, external calls, and cost separately.
- At deadline, unfinished, missing, cancelled, infrastructure-blocked, or artifact-lost required checks block deployment. Optimize selection/setup/caching/parallelism; never weaken validation to hit the number.
- Deeper mutation, fuzzing, load/soak, recovery, compatibility, and live-model evaluation may be immutable-revision prerequisites outside the normal path when risk requires them.

## Cloudflare Browser Run

- Control Playwright from existing CI and connect remote Chromium over authorized CDP. Start with one owned session per worker; reuse its browser, create a fresh context per test, and isolate backend namespaces.
- Use an account-scoped leased semaphore and launch-rate limiter, reserve ordinary product capacity, respect Retry-After within deadline, and close contexts/sessions in `finally` and cancellation handlers.
- Verify the exact immutable preview identity before assertions. Scope credentials to approved origins and prevent redirects/third parties from receiving them.
- Run a capability probe for context isolation, upload/download, trace, screenshot, storage state, dialogs, interception, service workers, and failure cleanup. Report unsupported behavior honestly.
- Browser Run is the primary remote Chromium lane, not proof of Firefox, WebKit, real devices, assistive technology, or human usability.

## Evidence gate

- One authority reconciles every required task, test, shard, retry, cache receipt, deeper prerequisite, and human obligation.
- States are fresh-pass, valid-cache, failed, incomplete, blocked, or explicitly not-applicable. Unexpected zero discovery, skipped required tests, disabled targets, cancelled shards, missing reports, or infrastructure errors cannot pass.
- Preserve first failure and classify retry success as flake evidence. Quarantine requires owner, reason, expiry, and replacement protection.
- Record revision, build/deployment identity, graph/selector version, runtime/browser, config, seed, duration, attempts, cache trust, and useful redacted artifacts.
- Inspect final diff, expectations, snapshots, exclusions, tolerances, thresholds, and gate changes. Expectation changes require a behavioral reason; do not delete failures or broaden mocks for green.

## Family routing

- F01 domain/unit; F02 components; F03 integration/contracts; F04 system journeys; F05 visual/compatibility.
- F06 accessibility/usability; F07 generated/adversarial; F08 security/privacy; F09 distributed data; F10 performance/cost.
- F11 resilience/recovery; F12 deployment/platform; F13 AI/agents/evals; F14 content/analytics/observability; F15 suite/skill effectiveness.
- Every family has IDs `.01`–`.30`. A single convincing test may satisfy several IDs; irrelevant items require a specific rationale. Policy coverage and application rollout state remain distinct.

## Layer adapters

- Unit/property: Vitest and fast-check with deterministic seeds and independently calculated oracles.
- Worker integration: the installed supported Cloudflare Vitest integration with per-file storage isolation and explicit per-test cleanup.
- Contracts: executable Zod/API/message/provider fixtures plus compatibility evidence for independently deployed consumers.
- Components: Storybook addon-vitest, semantic Testing Library interaction, axe enforcement, and shared theme/component contracts.
- Journeys: Playwright with persisted outcome checks, bounded condition waits, isolated identities/data, and provider sandboxes only when authorized.
- Mutation/fuzz/load: targeted Stryker, bounded fast-check/fuzz corpora, and k6-style thresholds in deeper tiers selected by risk.
- AI: deterministic tool/state boundaries first; Promptfoo/Langfuse datasets and bounded live evaluations only with approved budget.

## Resource discipline

- Use explicit run/application/account limits for browser minutes, sessions, launch rate, provider calls, AI tokens, and dollars.
- Test data factories issue tenant/run-scoped identifiers and cleanup manifests; retries and shards cannot share mutable server state accidentally.
- Retain only useful redacted traces, screenshots, reports, seeds, and minimal reproducers for a declared period in test-only artifact storage.
- Never add paid capacity, disable access control, run destructive production tests, or contact real customers to force a verdict.

## Independent review

- High-risk acceptance review receives the requirement and raw artifacts, not hidden answers or the implementation's own rationale as an oracle.
- Deterministic requirements use exact assertions; qualitative design/usability/accessibility uses calibrated human or model review with limitations.
- Positive and negative controls prove the harness can pass a known-good case and fail deliberately broken behavior.

## Report

Report actual commands, immutable revision/artifacts, selected-test reasons, outcomes, timing, parallelism, cache behavior, costs, fresh versus reused evidence, critical paths protected, counts by family/state, and concrete blockers. Never claim an unexecuted check or unavailable provider receipt.
