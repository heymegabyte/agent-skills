---
name: "tdd-discipline"
version: "3.0.0"
updated: "2026-11-04"
description: "Authoritative TDD workflow, 450-recommendation 15-family testing discipline (F01–F15), Nx conservative affected selection, 300-second required CI contract, Cloudflare Browser Run CDP coordination, and single deployment gate."
triggers:
  - "tdd"
  - "test"
  - "bugfix"
  - "refactor"
  - "verify"
  - "release-gate"
---

# Core TDD & Selective Verification Discipline (F01–F15 · 450 Catalog IDs)

Use this concise core skill on every feature, bug fix, refactor, test failure investigation, and release gate. Load the specific family reference (`families/F01-*.md` .. `families/F15-*.md`) only when working in that testing domain.

## 1. Triggers & Core Mandate

- **New behavior & bug fixes**: Execute strict **Red → Green → Refactor** (§2 below).
- **Existing / legacy code changes**: Write characterization tests first (`F01.02`, `EVAL-13`); record honestly that they started green. Never delete or break working production code merely to manufacture a fake test-first git history.
- **Pure refactors**: Trustworthy existing tests establish the baseline; rerun affected checks after the final edit.
- **Shared library utilities**: Reusable ecosystem test helpers live in `@theme-tools/ui/testing` (`theme.tools`), excluded from production bundles via subpath exports. Component stories and contracts live in `ui.theme.tools`.
- **Provenance**: Absorbs compatible `obra/superpowers` TDD practices (`20-superpowers/NOTICE.md`, `rules/upstream-absorption-register.md`) reconciled with this 450-point specification.

## 2. The 8-Step TDD Workflow Agents Must Follow

1. **State the Requirement & Invariant**: State the observable requirement, invariant, ordinary example, and consequential failure case (`F01.01`). Clarify only genuine specification ambiguity.
2. **Establish the Baseline**: Inspect the existing suite and distinguish pre-existing failures from new regressions.
3. **Select the Cheapest Convincing Layer**: Choose the smallest layer capable of proving the behavior (`unit` → `property` → `component-story` → `worker-integration` → `contract` → `browser-e2e`). Derive expectations from the domain rule or independent oracle (`F15.02`), never by copying implementation code into the assertion.
4. **Write a Focused Test First (Red)**: Run the test and observe that it fails because the desired behavior is absent or incorrect (`F15.01`). A syntax error, missing import, broken auth fixture, or unreachable server is a **harness defect**, not the required behavioral Red state.
5. **Implement the Smallest Coherent Change (Green)**: Satisfy the requirement while preserving architecture boundaries. Never hardcode test inputs in production code.
6. **Verify Green & Refactor Safely**: Run the focused test, then run affected required checks. Refactor while maintaining green and rerun verification after the final edit.
7. **Audit Diff, Assertions & Thresholds**: Require an explicit behavioral reason before changing any snapshot, visual baseline, or assertion (`F05.16`, `F15.24`). Never weaken assertions, skip failures (`.skip`), inflate tolerances, or broaden mocks to force a pass (`F15.21`).
8. **Emit an Honest Verification Receipt**: Report exact commands, commit/artifact SHA, fresh vs. cached status, first-failure flake evidence (`F15.05`), and any unverified or blocked items (`F15.04`, `EVAL-15`).

## 3. Selective Execution with Nx & Conservative Impact Evidence

- **Model the Full Dependency Graph (`F15.11`–`F15.14`)**: Include TypeScript imports, `@theme-tools/*` shared contracts, CSS/DTCG tokens, assets, schemas, routes, runtime flags, lockfiles, and test helpers.
- **Compare Against Last Successful Baseline**: Compare HEAD against the last green validation baseline on the target branch, never blindly `HEAD~1`.
- **Fail-Safe Uncertainty Expansion (`EVAL-11`)**: If the baseline commit is missing, the coverage/impact map is stale, or global lockfile/harness files changed, **widen conservatively to the full required suite** — never treat a missing baseline or graph error as "0 affected tests".
- **Fresh Live E2E vs. Cached Deterministic Checks (`F15.10`)**: Emit a `SelectionManifest` (`computeAffectedTestSelection`) before execution. Selected live Browser Run E2E specs, provider sandbox checks, and live-model evals must execute **freshly** (`fresh-required`) and never satisfy selection via aggregate cache hits.

## 4. The 300-Second (5-Minute) Required CI Contract

| Interval | Budget | Required Work |
| :--- | :---: | :--- |
| **0–30s** | 30s | Resolve baseline/HEAD, validate impact selection, restore provenance-verified caches, publish `SelectionManifest`. |
| **30–120s** | 90s | Run static, unit, property, component (`addon-vitest`), contract, and `workerd` integration checks in parallel; build immutable preview. |
| **120–270s** | 150s | Execute selected fresh remote Browser Run Chromium specs, critical smoke sentinels, and change-specific required checks. |
| **270–300s** | 30s | Reconcile every task/shard against `SelectionManifest` (`reconcileDeploymentGate`), redact/retain artifacts, release Browser Run leases, publish verdict. |

- **Fail-Closed Gate (`F15.03`, `F15.25`, `EVAL-12`)**: Any unfinished, timed-out, cancelled, missing shard, or 0-test-discovered task blocks deployment. Route long soak, broad fuzzing, mutation campaigns, and large live-model evaluations to scheduled/conditional-release workflows unless the change directly modifies the risk they protect.

## 5. Parallel Browsers via Cloudflare Browser Run CDP

- Connect Playwright workers over CDP (`chromium.connectOverCDP`) with server-side `Authorization` headers; keep tokens out of URLs, logs, traces, and screenshots (`redactSecretsFromDiagnosticText`).
- Coordinate sessions via `BrowserRunLeaseCoordinator` (modest initial pool reserving capacity within the 200 concurrent / 3 new/sec paid account limits, respecting `Retry-After`).
- Reuse one browser per worker, create a fresh context per test, namespace backend D1/KV/R2/Queue state per test (`F09.29`), verify the immutable preview artifact SHA (`verifyImmutablePreviewIdentity`), and close only owned sessions on teardown.
- Retain targeted Firefox, WebKit, and real-device lanes where platform contracts require them (`F05.17`, `F05.18`).

## 6. Quarantine, Caching & Resource Budgets

- **Quarantine (`F15.06`)**: Requires `owner`, `reason`, future `expiresAtIso`, and a passing `replacementTaskId` for critical behavior (`validateQuarantineRegistry`).
- **First-Failure Flake Tracking (`F15.05`)**: A test that fails attempt 1 and passes attempt 2 is recorded as `flaky-pass` with its first failure preserved, never an unqualified clean pass.
- **Explicit Budgets (`F10.22`, `F10.29`)**: Enforce run/account caps on browser minutes, concurrent sessions, external API calls, and live AI evaluation spend (`enforceTestResourceBudget`).

## 7. On-Demand Family Reference Index (Load Only When Relevant)

- `families/F01-unit-and-business-behavior.md` (`F01.01`–`F01.30`)
- `families/F02-components-and-interactions.md` (`F02.01`–`F02.30`)
- `families/F03-integration-and-contracts.md` (`F03.01`–`F03.30`)
- `families/F04-system-and-e2e-journeys.md` (`F04.01`–`F04.30`)
- `families/F05-visual-regression-and-compatibility.md` (`F05.01`–`F05.30`)
- `families/F06-accessibility-and-usability.md` (`F06.01`–`F06.30`)
- `families/F07-generated-and-adversarial-inputs.md` (`F07.01`–`F07.30`)
- `families/F08-security-and-privacy.md` (`F08.01`–`F08.30`)
- `families/F09-data-correctness-and-distributed-behavior.md` (`F09.01`–`F09.30`)
- `families/F10-performance-capacity-and-cost.md` (`F10.01`–`F10.30`)
- `families/F11-resilience-failure-handling-and-recovery.md` (`F11.01`–`F11.30`)
- `families/F12-deployment-platform-packaging-and-infra.md` (`F12.01`–`F12.30`)
- `families/F13-ai-agent-and-evaluation-behavior.md` (`F13.01`–`F13.30`)
- `families/F14-content-analytics-and-observability.md` (`F14.01`–`F14.30`)
- `families/F15-suite-effectiveness-and-skill-quality.md` (`F15.01`–`F15.30`)
- Ledger & Evals: `reference/testing-450-catalog-ledger.json` · `evals/tdd-skill-evals.json`
