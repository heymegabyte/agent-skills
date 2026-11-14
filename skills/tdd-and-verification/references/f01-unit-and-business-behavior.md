---
name: "F01 — Unit and business behavior"
familyId: "F01"
defaultLayer: "unit"
defaultTier: "required_ci"
itemCount: 30
---

# F01: Unit and business behavior (F01.01–F01.30)

- **Default Verification Layer**: `unit`
- **Default Execution Tier**: `required_ci`
- **Authorized Pilot Implementation**: `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F01.01` | **Independent examples** | Translate business rules into explicit input/output examples with independently calculated expectations, including rejected cases. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.02` | **Legacy characterization** | Characterize correct behavior in critical existing paths before changing them; distinguish compatibility from known defects. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.03` | **Minimal defect reproductions** | Reduce each discovered business defect to its smallest public-interface reproducer, observe failure, and retain after repair. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.04` | **Equivalence classes** | Build readable tables for meaningful input classes with descriptive case names exposing policy differences. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.05` | **Boundary neighborhoods** | Exercise values immediately below, at, and above thresholds, plus absent, null, empty, zero, and negative inputs. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.06` | **Monetary representation** | Verify monetary calculations using integer micro-USD or declared precision; reject floating-point drift at domain boundaries. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.07` | **Rounding and allocation** | Test rounding direction, discount order, tax order, and remainder allocation with independently worked examples. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.08` | **Rule precedence** | Exercise overlapping business rules deliberately, proving which restriction, entitlement, or exception wins. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.09` | **Expiration edges** | Inject a controllable clock to test just-before, exact-boundary, and just-after expiry behavior for tokens, leases, and deadlines. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.10` | **Calendar semantics** | Separate calendar-day rules from elapsed-duration rules; test DST transitions, leap days, and month ends. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.11` | **Randomness and identifiers** | Inject randomness and identifier generation so tests reproduce collisions, retry limits, and selection decisions deterministically. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.12` | **Text normalization** | Specify whitespace, Unicode normalization, case sensitivity, and empty-string handling without merging distinct values. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.13` | **Representation semantics** | Test serialization and deserialization for absent fields, explicit nulls, defaults, and legacy values. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.14` | **State transitions** | Enumerate valid and invalid transitions for critical domain state machines, asserting resulting state and rejected side effects. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.15` | **Repeated commands** | Verify repeated command decisions respect idempotency rules across duplicate requests and completion events. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.16` | **Mutation boundaries** | Check that domain operations preserve caller-owned inputs and unrelated nested state. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.17` | **Domain error contracts** | Assert stable error categories, machine-readable codes, and recovery information rather than incidental wording. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.18` | **Validation diagnostics** | Verify validation identifies the correct fields and actionable reasons while preserving acceptable values. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.19` | **Asynchronous completion** | Exercise resolution, rejection, and cancellation of async domain operations without unobserved promise failures. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.20` | **In-process races** | Use controlled scheduling to exercise competing calls to shared state, proving single-flight or conflict handling. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.21` | **Resource lifecycle** | Verify ownership and release of resources acquired by domain adapters across cancellation and exceptional exits. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.22` | **Cache decisions** | Unit-test cache eligibility, key partitioning, expiry decisions, and invalidation rules with deterministic inputs. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.23` | **Ordering and pagination** | Test stable tie breakers, cursor boundaries, empty pages, and insertion between pages against declared ordering. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.24` | **Aggregation arithmetic** | Verify empty aggregates, weighted calculations, excluded records, and denominator-zero behavior. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.25` | **Numeric validity** | Exercise NaN, infinity, unsafe integers, and negative zero so numeric validation fails before contaminating state. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.26` | **Configuration semantics** | Test meaningful policy branches, missing settings, and explicit overrides (unset vs disabled). | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.27` | **Units and dimensions** | Verify conversion factors, dimensional consistency, signs, and rounding for sizes, durations, rates, and quantities. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.28` | **Useful dependency fakes** | Model external dependency responses only at genuine seams and assert externally meaningful outcomes. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.29` | **Value-object identity** | Test equality, canonical identity, and duplicate recognition for domain value objects. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
| `F01.30` | **Partial updates** | Verify patches distinguish omitted fields, explicit clearing, and replacement values while preserving invariants. | `unit` | `required_ci` | `verified` | `packages/blog/test/blog-system.test.ts & packages/testing/test/testing-discipline.test.ts` |
