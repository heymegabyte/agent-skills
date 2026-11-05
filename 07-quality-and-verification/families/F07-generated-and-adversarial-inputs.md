---
name: "F07-generated-and-adversarial-inputs"
family: "F07"
title: "F07 — Generated and adversarial inputs"
default_layer: "property"
default_tier: "required-ci"
recommendations_count: 30
updated: "2026-11-04"
---

# F07 — Generated and adversarial inputs (30 Recommendations: F07.01–F07.30)

> **Summary**: Independent algebraic invariants, valid/targeted-invalid domain generators, biased edge exploration, reproducible seeds & counterexample shrinking, round-trip/idempotence/metamorphic/conservation laws, model-based state sequences, and Unicode/numeric/temporal adversaries.
> **Default Layer**: `property` · **Default Execution Tier**: `required-ci` · **Primary Tools**: fast-check, Seeded PRNG, Curated Regression Corpus

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F07 Recommendation Catalog (F07.01–F07.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F07.01`** | Independent invariants | `P0` | `property` | `required-ci` | `verified` | Derive generated-test properties from domain requirements or algebraic laws rather than recomputing the implementation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.02`** | Valid domain generators | `P0` | `property` | `required-ci` | `verified` | Build generators that produce meaningful valid records and relationships encoding genuine domain constraints. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.03`** | Targeted invalid generators | `P0` | `property` | `required-ci` | `verified` | Generate invalid cases by violating one important constraint at a time while retaining valid outer structure. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.04`** | Biased edge exploration | `P0` | `property` | `required-ci` | `verified` | Bias generation toward threshold neighborhoods, repeated values, empty collections, and rare valid combinations. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.05`** | Useful shrinking | `P0` | `property` | `required-ci` | `verified` | Ensure shrinking preserves prerequisites and relationships needed to reproduce minimal understandable counterexamples. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.06`** | Reproducible counterexamples | `P0` | `property` | `required-ci` | `verified` | Record failing seeds, replay paths, minimized inputs, generator config, and code revision for deterministic replay. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.07`** | Controlled nondeterminism | `P0` | `property` | `required-ci` | `verified` | Control generated clocks, randomness, identifiers, and dependency responses so failing properties replay reliably. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.08`** | Round-trip properties | `P0` | `property` | `required-ci` | `verified` | Assert parser/serializer round-trip behavior according to declared normalization and canonicalization rules. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.09`** | Idempotence properties | `P0` | `property` | `required-ci` | `verified` | Generate repeated application of normalizers, deduplicators, or idempotent commands and assert stability. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.10`** | Metamorphic relationships | `P0` | `property` | `required-ci` | `verified` | Transform inputs via permutation, scaling, or unit conversion and verify predictable output relationships. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.11`** | Conservation properties | `P1` | `property` | `required-ci` | `verified` | Generate allocations, transfers, and reconciliations and verify conserved totals and bounded rounding discrepancies. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.12`** | Commutativity boundaries | `P1` | `property` | `required-ci` | `verified` | Compare execution orders for independent operations and exercise dependent operations separately. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.13`** | Model-based sequences | `P1` | `property` | `required-ci` | `verified` | Generate command sequences against a simpler reference state machine and check observable state after each action. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.14`** | Controlled schedule generation | `P1` | `property` | `required-ci` | `verified` | Explore async interleavings with a deterministic scheduler and shrink failures into reproducible event sequences. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.15`** | Differential oracles | `P1` | `property` | `required-ci` | `verified` | Compare results with an independent reference implementation or prior version and classify expected differences. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.16`** | Parser structure limits | `P1` | `property` | `required-ci` | `verified` | Generate nested, recursive, truncated, and oversized structured inputs to verify depth and size limits. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.17`** | Unicode adversaries | `P1` | `property` | `required-ci` | `verified` | Exercise NFC/NFD variants, combining marks, bidi controls, zero-width spaces, and malformed encoding boundaries. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.18`** | Numeric adversaries | `P1` | `property` | `required-ci` | `verified` | Generate extreme magnitudes, fractional boundaries, NaN/Infinity, and precision-sensitive combinations. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.19`** | Temporal adversaries | `P1` | `property` | `required-ci` | `verified` | Generate date ranges across timezone offsets, DST transitions, leap dates, and invalid intervals. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.20`** | Protocol fuzzing | `P1` | `property` | `required-ci` | `verified` | Generate malformed headers, bodies, media types, and multipart boundaries against authorized test endpoints. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.21`** | Delivery permutations | `P1` | `property` | `required-ci` | `verified` | Generate duplicate, reordered, delayed, and interrupted event sequences to verify convergence and idempotency. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.22`** | Schema evolution inputs | `P1` | `property` | `required-ci` | `verified` | Generate missing optional fields, unknown fields, new enum values, and legacy shapes against version policies. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.23`** | Relational fixture generation | `P2` | `property` | `required-ci` | `verified` | Generate linked records with realistic cardinalities, orphan attempts, and competing updates. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.24`** | Actor-resource combinations | `P2` | `property` | `required-ci` | `verified` | Generate actor, tenant, resource, and operation combinations from an independent security policy model. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.25`** | Constrained combinations | `P2` | `property` | `required-ci` | `verified` | Use pairwise or higher-order covering arrays for flags, locales, roles, and environments. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.26`** | Bounded campaigns | `P2` | `property` | `required-ci` | `verified` | Set runtime, memory, nesting, payload, and example-count limits and report premature termination as incomplete. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.27`** | Realistic distributions | `P2` | `property` | `required-ci` | `verified` | Generate duplicate-heavy, sparse, skewed, and Zipf/long-tail datasets resembling real workloads. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.28`** | Coverage-guided exploration | `P2` | `property` | `required-ci` | `verified` | Apply coverage-guided fuzzing to changed parsers and interpreters and promote minimal counterexamples. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.29`** | Hostile file corpora | `P2` | `property` | `required-ci` | `verified` | Generate bounded corrupt, truncated, mislabeled, and zip-bomb-style files for import pipelines. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
| **`F07.30`** | Curated regression corpus | `P2` | `property` | `required-ci` | `verified` | Promote minimized real failures into a reviewed requirement-linked regression corpus. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F07`)* |
