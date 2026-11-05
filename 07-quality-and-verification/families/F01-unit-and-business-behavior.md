---
name: "F01-unit-and-business-behavior"
family: "F01"
title: "F01 — Unit and business behavior"
default_layer: "unit"
default_tier: "required-ci"
recommendations_count: 30
updated: "2026-11-04"
---

# F01 — Unit and business behavior (30 Recommendations: F01.01–F01.30)

> **Summary**: Independent input/output examples, legacy characterization, minimal defect reproducers, equivalence classes, boundary neighborhoods, monetary/rounding precision, controllable clocks, state machines, idempotency, and mutation boundaries.
> **Default Layer**: `unit` · **Default Execution Tier**: `required-ci` · **Primary Tools**: Vitest, ControllableClock, DeterministicIdGenerator

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F01 Recommendation Catalog (F01.01–F01.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F01.01`** | Independent examples | `P0` | `unit` | `required-ci` | `verified` | Translate business rules into explicit input/output examples with independently calculated expectations, including rejected cases. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.02`** | Legacy characterization | `P0` | `unit` | `required-ci` | `verified` | Characterize correct behavior in critical existing paths before changing them; distinguish accepted compatibility from known defects. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.03`** | Minimal defect reproductions | `P0` | `unit` | `required-ci` | `verified` | Reduce each discovered business defect to its smallest public-interface reproducer, observe failure, and retain after repair. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.04`** | Equivalence classes | `P0` | `unit` | `required-ci` | `verified` | Build readable tables for meaningful input classes (eligible, ineligible, exceptional, grandfathered) with descriptive case names. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.05`** | Boundary neighborhoods | `P0` | `unit` | `required-ci` | `verified` | Exercise values immediately below, at, and above thresholds, plus absent, null, empty, zero, and negative inputs. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.06`** | Monetary representation | `P0` | `unit` | `required-ci` | `verified` | Verify monetary calculations using declared precision and currency scales; reject floating-point drift or unsupported fractions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.07`** | Rounding and allocation | `P0` | `unit` | `required-ci` | `verified` | Test rounding direction, discount order, tax order, and remainder allocation whose line items reconcile to the declared total. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.08`** | Rule precedence | `P0` | `unit` | `required-ci` | `verified` | Exercise overlapping business rules deliberately, proving which restriction, entitlement, discount, or exception wins. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.09`** | Expiration edges | `P0` | `unit` | `required-ci` | `verified` | Inject a controllable clock to test just-before, exact-boundary, and just-after expiry behavior for tokens, quotes, and deadlines. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.10`** | Calendar semantics | `P0` | `unit` | `required-ci` | `verified` | Separate calendar-day rules from elapsed-duration rules; test DST transitions, leap days, month ends, and inclusive/exclusive bounds. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.11`** | Randomness and identifiers | `P1` | `unit` | `required-ci` | `verified` | Inject randomness and ID generation so tests reproduce collisions, retry limits, and selection decisions deterministically. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.12`** | Text normalization | `P1` | `unit` | `required-ci` | `verified` | Specify whitespace, Unicode normalization, case sensitivity, and empty-string handling without merging distinct values. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.13`** | Representation semantics | `P1` | `unit` | `required-ci` | `verified` | Test serialization/deserialization for absent fields, explicit nulls, defaults, and legacy values. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.14`** | State transitions | `P1` | `unit` | `required-ci` | `verified` | Enumerate valid and invalid transitions for critical domain state machines, asserting resulting state and rejected side effects. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.15`** | Repeated commands | `P1` | `unit` | `required-ci` | `verified` | Verify repeated command decisions respect domain idempotency rules across repeated cancellations, approvals, and completions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.16`** | Mutation boundaries | `P1` | `unit` | `required-ci` | `verified` | Check that domain operations preserve caller-owned inputs and unrelated nested references without accidental mutation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.17`** | Domain error contracts | `P1` | `unit` | `required-ci` | `verified` | Assert stable error categories, machine-readable codes, and recovery information rather than incidental wording. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.18`** | Validation diagnostics | `P1` | `unit` | `required-ci` | `verified` | Verify validation identifies the correct fields and actionable reasons, preserves valid values, and reports multiple independent problems. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.19`** | Asynchronous completion | `P1` | `unit` | `required-ci` | `verified` | Exercise resolution, rejection, and cancellation of async domain operations, preventing unobserved promise failures. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.20`** | In-process races | `P1` | `unit` | `required-ci` | `verified` | Use controlled scheduling to exercise competing calls to shared in-process state, proving single-flight or conflict handling. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.21`** | Resource lifecycle | `P1` | `unit` | `required-ci` | `verified` | Verify ownership and release of resources acquired by domain adapters across cancellation and exceptional exits. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.22`** | Cache decisions | `P1` | `unit` | `required-ci` | `verified` | Unit-test cache eligibility, key partitioning, expiry decisions, and invalidation rules with deterministic inputs. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.23`** | Ordering and pagination | `P2` | `unit` | `required-ci` | `verified` | Test stable tie breakers, cursor boundaries, empty pages, and insertion between pages against the declared ordering contract. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.24`** | Aggregation arithmetic | `P2` | `unit` | `required-ci` | `verified` | Verify empty aggregates, weighted calculations, excluded records, denominator-zero behavior, and reconciliation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.25`** | Numeric validity | `P2` | `unit` | `required-ci` | `verified` | Exercise NaN, infinity, unsafe integers, overflow-prone conversions, and negative zero before contaminating downstream state. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.26`** | Configuration semantics | `P2` | `unit` | `required-ci` | `verified` | Test meaningful policy branches, missing settings, and explicit overrides, distinguishing unset from disabled options. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.27`** | Units and dimensions | `P2` | `unit` | `required-ci` | `verified` | Verify conversion factors, dimensional consistency, signs, and rounding for sizes, durations, rates, and quantities. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.28`** | Useful dependency fakes | `P2` | `unit` | `required-ci` | `verified` | Model external dependency responses only at genuine seams and assert externally meaningful outcomes. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.29`** | Value-object identity | `P2` | `unit` | `required-ci` | `verified` | Test equality, canonical identity, and duplicate recognition for domain value objects. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
| **`F01.30`** | Partial updates | `P2` | `unit` | `required-ci` | `verified` | Verify patches distinguish omitted fields, explicit clearing, and replacement values while preserving unrelated properties. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F01`)* |
