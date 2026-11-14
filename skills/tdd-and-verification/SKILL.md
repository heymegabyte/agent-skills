---
name: "tdd-and-verification"
version: "3.0.0"
updated: "2026-11-04"
description: "Canonical Test-Driven Development (Red-Green-Refactor), legacy characterization-first retrofit, Nx selective impact execution, 300-second CI gate, Cloudflare Browser Run parallel CDP orchestration, and 15-family (450-item) verification policy."
provenance:
  absorbed_from:
    - "obra/superpowers test-driven-development & verification-before-completion (adapted to preserve existing code and support legacy characterization)"
    - "heymegabyte/agent-skills 07-quality-and-verification & @theme-tools/testing"
---

# TDD & Verification Discipline (`F01.01–F15.30`)

This skill governs test selection, Red-Green-Refactor execution, legacy characterization, selective CI within a 300-second budget, parallel remote Chromium verification via Cloudflare Browser Run, and honest completion reporting across all 15 testing families (`F01–F15`, 450 obligations).

## 1. Core Operating Rules (Non-Negotiable)

1. **Behavioral Oracle First**: Every test must assert observable domain outcomes, persisted state transitions, HTTP/RPC contracts, accessibility semantics, or security boundaries—never private implementation details or mock call counts alone (`F01.01`, `F14.07`).
2. **Genuine Red $\to$ Green $\to$ Refactor**:
   - **New features & bug fixes**: Write the smallest automated test at the lowest convincing layer first. Run it and confirm it **fails for the expected behavioral reason** (not syntax, import, or harness errors). Write the minimal production code to pass, re-run, and refactor while keeping tests green (`F14.01–F14.03`).
   - **Existing untested legacy code**: Never delete working code merely to manufacture a fake test-first history. Write **characterization tests** that lock in current observable behavior first, verify they pass, then add a failing test for the new behavior or refactor safely (`F01.30`, `F14.04`).
3. **Critical-Path Retrofit Priority**: Before expanding breadth, protect critical existing paths:
   - Authentication, session lifecycle, OAuth PKCE, Magic Links, and CSRF/Origin checks (`F08.01–F08.08`).
   - Multi-tenant and 6-role RBAC authorization (`owner`, `publisher`, `editor`, `author`, `reviewer`, `viewer`), including negative tests proving unauthorized mutations fail closed (`403`) (`F02.07`, `F08.05`).
   - Durable state transitions, immutable revision pointers, optimistic concurrency (`baseRevisionId`), and automatic rollback on post-publish smoke failure (`F03.04`, `F09.01`).
   - Consequential external side effects, idempotency keys, outbox/webhook replay safety, America/New_York DST slot scheduling, and integer micro-USD budget caps (`F02.18`, `F05.03`, `F10.21`).
   - Shared UI tokens, 15 OKLCH themes, WCAG 2.2 AA contrast, Storybook component states, and code-split Plate/Slate authoring (`F02.01`, `F06.01`).

## 2. Layer Selection Decision Matrix

Always choose the **lowest layer that provides convincing fidelity**, paired with a small set of real-browser critical journeys:

| Change Type | Primary Layer | Secondary / Sentinel Layer | Cacheable in CI? |
|---|---|---|---|
| Pure domain rule, parser, validator, cost math, DST slot calculation | `unit` / `property` (Vitest) | Contract schema check | Yes (deterministic inputs) |
| Shared UI component, Plate/Slate block, theme token, keyboard/focus state | `component_storybook` + `accessibility` | Affected Storybook + Showcase E2E | Build/unit yes; live browser no |
| Worker route, API handler, auth/RBAC guard, DataForSEO client, SSRF guard | `worker_integration` + `contract` + `security` | Critical browser smoke | Unit/contract yes; live probe no |
| Queue consumer, cron scheduler, retry/backoff, checkpoint recovery | `resilience_chaos` + `unit` (injected clock) | Idempotency replay test | Yes |
| User-visible route, checkout/publish flow, preview deployment | `e2e_browser` (Cloudflare Browser Run / Playwright) | Post-deploy console/CSP/axe gate | **Never** (fresh execution required) |

## 3. Nx Selective Execution & Uncertainty Fallbacks (`@theme-tools/testing/nx-selector`)

Use `computeAffectedSelectionManifest` (`packages/testing/src/nx-selector.ts`) and `nx.json` to select tasks within the 300-second CI budget:
- **Deterministic cacheable tasks** (`validate`, `typecheck`, `test`, `build`): May reuse verified artifact/task cache when `namedInputs` (`production`, `default`, `testingDiscipline`, `sharedGlobals`) match.
- **Live browser specs** (`test:e2e`, `e2e:prod`): Marked `cacheable: false` and `freshExecutionRequired: true`.
- **Mandatory Conservative Fallbacks**: Expand automatically to the full deterministic suite + all critical browser sentinels whenever:
  1. `baselineValidInGitHistory === false` or the git base SHA is missing/shallow (`F15.14`).
  2. `impactMapFresh === false` or dynamic imports/routing changes have unmapped blast radius (`F15.13`).
  3. Global harness files (`pnpm-lock.yaml`, `tsconfig.base.json`, `nx.json`, `playwright.config.ts`, `.github/workflows/`, `packages/testing/`) are modified.

## 4. Five-Minute (300-Second) Required CI Gate (`@theme-tools/testing/ci-gate`)

The required CI path (`.github/workflows/ci-required-5min.yml`) enforces a strict **300-second** wall-clock budget:
- **`0–30s` (`selection_and_restore`)**: Checkout, pnpm store restore, baseline verification, `computeAffectedSelectionManifest`, and duration-balanced shard partitioning (`partitionSelectedSpecsAcrossShards`).
- **`30–120s` (`deterministic_and_build`)**: Parallel static/typecheck, unit/property/contract suites, 15-theme contrast validation, and static preview builds (`apps/web`, `apps/ui`).
- **`120–270s` (`remote_browser_and_smoke`)**: Sharded Playwright E2E journeys over Cloudflare Browser Run CDP against the verified preview artifact.
- **`270–300s` (`reconciliation_and_teardown`)**: `reconcileDeploymentGate` audits every expected task and shard, verifies `discoveredTestCount > 0`, checks `QuarantineRegistry` (rejecting expired or unreplaced critical-path quarantines), and guarantees remote browser session teardown.

**Fail-Closed Gate Rules**:
- Any missing, cancelled, timed-out, or zero-test shard/task fails the gate immediately (`F12.11`, `F14.19`).
- Passing on retry is classified as `flaky_passed_on_retry` with the first-failure message/trace preserved (`F13.06`).

## 5. Cloudflare Browser Run Parallel CDP Rules (`@theme-tools/testing/browser-run`)

1. **Header Authentication & Secret Redaction**: Connect via `buildBrowserRunCdpConfig` with `Authorization: Bearer <token>` in headers—never in query strings. Scrub tokens from logs, traces, and screenshots via `redactBrowserRunDiagnostics`.
2. **Rate & Concurrency Governance**: `BrowserRunPoolCoordinator` enforces an account concurrency semaphore (default `16`, max `200` on Workers Paid) and a sliding-window launch rate limiter (`<= 3` new sessions/sec default, max `30/sec`), respecting HTTP `429 Retry-After` within `runDeadlineMs`.
3. **Worker Reuse & Context Isolation**: Reuse one remote Chromium session per shard worker and allocate a fresh `BrowserContext` per test (`allocateIsolatedContext`), closing all sessions in `finally` (`withWorkerSession`).
4. **Preview Identity Verification**: Call `verifyPreviewDeploymentIdentity` before running E2E assertions to confirm `x-deployment-id` and `x-commit-sha` match the tested revision; reject unexposed `localhost` URLs in remote Browser Run.

## 6. Anti-Gaming & Honest Verification Reporting (`@theme-tools/testing/skill-eval-harness`)

Before claiming completion, run `detectAssertionWeakeningOrFalseGreen` and report:
- Exact commands executed, exit codes, durations, and test counts by layer.
- Explicit separation between **`freshly_executed`**, **`reused_cached_evidence`**, and **`flaky_passed_on_retry`**.
- Explicit disclosure of any skipped targets, `not_applicable` rationales, or missing external credentials. Never claim a live provider or remote browser ran when only local/cached fixtures executed.

## 7. Referenced 15 Testing Family Guides (`F01–F15`, 450 Recommendations)

Load only the family reference(s) matching your current task:
- [F01: Unit and business behavior (`F01.01–F01.30`)](references/f01-unit-and-business-behavior.md)
- [F02: Components and interactions (`F02.01–F02.30`)](references/f02-components-and-interactions.md)
- [F03: Integration and contracts (`F03.01–F03.30`)](references/f03-integration-and-contracts.md)
- [F04: System and end-to-end journeys (`F04.01–F04.30`)](references/f04-system-and-e2e-journeys.md)
- [F05: Visual regression and compatibility (`F05.01–F05.30`)](references/f05-visual-regression-and-compatibility.md)
- [F06: Accessibility and usability (`F06.01–F06.30`)](references/f06-accessibility-and-usability.md)
- [F07: Generated and adversarial inputs (`F07.01–F07.30`)](references/f07-generated-and-adversarial-inputs.md)
- [F08: Security and privacy (`F08.01–F08.30`)](references/f08-security-and-privacy.md)
- [F09: Data correctness and distributed behavior (`F09.01–F09.30`)](references/f09-data-correctness-and-distributed-behavior.md)
- [F10: Performance, capacity, and cost (`F10.01–F10.30`)](references/f10-performance-capacity-and-cost.md)
- [F11: Resilience, failure handling, and recovery (`F11.01–F11.30`)](references/f11-resilience-failure-handling-and-recovery.md)
- [F12: Deployment, platform, packaging, and infrastructure (`F12.01–F12.30`)](references/f12-deployment-platform-packaging-and-infrastructure.md)
- [F13: AI, agent, and evaluation behavior (`F13.01–F13.30`)](references/f13-ai-agent-and-evaluation-behavior.md)
- [F14: Content, analytics, and observability (`F14.01–F14.30`)](references/f14-content-analytics-and-observability.md)
- [F15: Test suite effectiveness and testing skill quality (`F15.01–F15.30`)](references/f15-test-suite-effectiveness-and-skill-quality.md)
