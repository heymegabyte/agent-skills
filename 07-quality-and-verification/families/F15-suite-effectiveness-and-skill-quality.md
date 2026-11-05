---
name: "F15-suite-effectiveness-and-skill-quality"
family: "F15"
title: "F15 — Test suite effectiveness and testing skill quality"
default_layer: "harness-meta"
default_tier: "required-ci"
recommendations_count: 30
updated: "2026-11-04"
---

# F15 — Test suite effectiveness and testing skill quality (30 Recommendations: F15.01–F15.30)

> **Summary**: Demonstrated Red-then-Green failure before fix, independent expected outcomes, zero-test/missing-shard gate failure, first-failure flake preservation, quarantine expiry & replacement coverage, conservative impact selection, mutation testing, and skill benchmark evaluations.
> **Default Layer**: `harness-meta` · **Default Execution Tier**: `required-ci` · **Primary Tools**: Authoritative Deployment Gate, Affected Selector Verifier, StrykerJS / Fault Seeder, Skill Eval Suite

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F15 Recommendation Catalog (F15.01–F15.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F15.01`** | Observed Red-then-Green behavioral failure | `P0` | `harness-meta` | `required-ci` | `verified` | Prove each new regression test fails for the intended missing behavior before fix and passes after minimal fix. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.02`** | Independent oracle expectations | `P0` | `harness-meta` | `required-ci` | `verified` | Use independently derived expected outcomes for critical assertions rather than copying implementation logic. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.03`** | Zero-test & missing-target gate failure | `P0` | `harness-meta` | `required-ci` | `verified` | Fail required jobs when expected tests are undiscovered or a selected suite unexpectedly runs zero cases. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.04`** | Explicit skipped & blocked classification | `P0` | `harness-meta` | `required-ci` | `verified` | Report skipped and environment-blocked tests separately from passes so missing credentials never look green. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.05`** | First-failure flake preservation | `P0` | `harness-meta` | `required-ci` | `verified` | Preserve the first failure and classify retry success as flakiness evidence rather than an unqualified clean pass. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.06`** | Time-bounded quarantine with replacement guard | `P0` | `harness-meta` | `required-ci` | `verified` | Give quarantined tests an owner, reason, expiry, and replacement protection for critical behavior. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.07`** | Randomized seed & order independence | `P0` | `harness-meta` | `required-ci` | `verified` | Rerun tests with controlled random seeds and varied execution order to expose hidden state coupling. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.08`** | Cross-worker & cross-shard state isolation | `P0` | `harness-meta` | `required-ci` | `verified` | Validate isolation between cases, files, workers, and browser shards across DBs, cookies, ports, and R2 prefixes. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.09`** | Contract-verified mocks & fixtures | `P0` | `harness-meta` | `required-ci` | `verified` | Check mocks and fixtures against real service contracts through focused integration tests to prevent drift. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.10`** | Provenance-bound deterministic cache keys | `P0` | `harness-meta` | `required-ci` | `verified` | Verify cache inputs include code, config, lockfiles, and runtime identity; never cache live deployment checks. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.11`** | Conservative uncertainty-expanding selector | `P1` | `harness-meta` | `required-ci` | `verified` | Test selection logic using dependency impact plus coverage/risk mappings, expanding when dynamic behavior is uncertain. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.12`** | Test-only & helper change execution trigger | `P1` | `harness-meta` | `required-ci` | `verified` | Ensure changed tests, fixtures, helpers, and setup files trigger execution even when zero prod files change. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.13`** | Source-map & build-output impact invalidation | `P1` | `harness-meta` | `required-ci` | `verified` | Invalidate impact mappings when coverage provenance, source maps, build outputs, or dependencies change. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.14`** | Validated git ancestor baseline resolution | `P1` | `harness-meta` | `required-ci` | `verified` | Validate comparison baselines against branch history and last successful run, expanding scope when missing. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.15`** | Duration-balanced bijective shard partitioning | `P1` | `harness-meta` | `required-ci` | `verified` | Balance parallel shards using observed durations within Browser Run limits and verify bijective test coverage. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.16`** | Targeted critical-path mutation testing | `P1` | `harness-meta` | `required-ci` | `verified` | Apply mutation testing selectively to changed or critical domain/permission logic and kill surviving mutants. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.17`** | Risk-to-assertion traceability matrix | `P1` | `harness-meta` | `required-ci` | `verified` | Maintain a traceable mapping from critical business risks and acceptance criteria to concrete test assertions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.18`** | Positive & negative harness self-controls | `P1` | `harness-meta` | `required-ci` | `verified` | Use positive and negative controls to prove deliberately broken behavior fails and known good baselines pass. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.19`** | Seeded-defect skill benchmark evaluation | `P1` | `harness-meta` | `required-ci` | `verified` | Benchmark the testing skill on seeded defects requiring minimal reproducers, correct layer placement, and Red-Green proof. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.20`** | Held-out anti-overfitting skill evaluations | `P1` | `harness-meta` | `required-ci` | `verified` | Keep hidden benchmark cases and independent acceptance checks to detect agents that overfit visible prompts. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.21`** | Anti-cheating assertion & report audit | `P1` | `harness-meta` | `required-ci` | `verified` | Detect weakened assertions, deleted failures, inflated tolerances, and fabricated execution reports as process failures. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.22`** | Practical skill ROI & cost telemetry | `P1` | `harness-meta` | `required-ci` | `verified` | Measure false passes, false alarms, task completion, elapsed time, and compute cost alongside defect detection. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.23`** | Cryptographic/complete shard artifact binding | `P2` | `harness-meta` | `required-ci` | `verified` | Attach test results and diagnostics to commit, environment, seed, shard, and attempt identity before merging. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.24`** | Behavioral review gate for snapshot updates | `P2` | `harness-meta` | `required-ci` | `verified` | Require an explicit behavioral reason for changing snapshots or visual baselines rather than silencing diffs. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.25`** | Fail-closed timeout, crash & cancellation gate | `P2` | `harness-meta` | `required-ci` | `verified` | Treat timeout, cancellation, runner crash, and artifact loss as unresolved blocking checks. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.26`** | Executed-bundle coverage source-map verification | `P2` | `harness-meta` | `required-ci` | `verified` | Verify coverage instrumentation measures the built code actually exercised and catches missing shards. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.27`** | Condition & decision boundary adequacy | `P2` | `harness-meta` | `required-ci` | `verified` | Test decision boundaries and condition combinations for critical logic with coverage as supporting evidence. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.28`** | Independent context acceptance challenge | `P2` | `harness-meta` | `required-ci` | `verified` | Have independent requirement-based acceptance checks challenge agent-generated tests from the same context. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.29`** | Protected-behavior redundancy pruning | `P2` | `harness-meta` | `required-ci` | `verified` | Remove redundant or brittle tests only after confirming equivalent protection and failure localization remain. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
| **`F15.30`** | Scheduled selector-vs-full audit reconciliation | `P2` | `harness-meta` | `required-ci` | `verified` | Periodically compare selective execution with broader audit runs, measure missed failures, and tighten selector rules. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F15`)* |
