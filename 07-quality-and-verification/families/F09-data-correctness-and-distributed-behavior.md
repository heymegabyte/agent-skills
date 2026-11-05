---
name: "F09-data-correctness-and-distributed-behavior"
family: "F09"
title: "F09 — Data correctness and distributed behavior"
default_layer: "worker-integration"
default_tier: "required-ci"
recommendations_count: 30
updated: "2026-11-04"
---

# F09 — Data correctness and distributed behavior (30 Recommendations: F09.01–F09.30)

> **Summary**: Atomic transaction rollback, DB constraints, idempotency key races, at-least-once queue deduplication, out-of-order arrival, tombstone anti-resurrection, stale KV reads, DO concurrency/alarms, fencing tokens, and cross-store compensation.
> **Default Layer**: `worker-integration` · **Default Execution Tier**: `required-ci` · **Primary Tools**: Vitest Concurrency Harness, D1/DO/Queue Fixtures, Reconciliation Verifier

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F09 Recommendation Catalog (F09.01–F09.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F09.01`** | Atomic transaction rollback | `P0` | `worker-integration` | `required-ci` | `verified` | Interrupt multi-statement transactions at meaningful boundaries and verify atomic rollback of state and audit records. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.02`** | Database constraint enforcement | `P0` | `worker-integration` | `required-ci` | `verified` | Test database constraints with invalid and conflicting writes when application validation is bypassed or concurrent. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.03`** | Precision & overflow reconciliation | `P0` | `worker-integration` | `required-ci` | `verified` | Exercise currency, quantity, rounding, overflow, and precision boundaries and reconcile stored values. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.04`** | Idempotency key races | `P0` | `worker-integration` | `required-ci` | `verified` | Race identical idempotency keys across workers and assert one committed effect, consistent response, and safe recovery. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.05`** | Uniqueness race handling | `P0` | `worker-integration` | `required-ci` | `verified` | Create concurrent requests targeting uniqueness constraints, proving check-then-insert races cannot create duplicates. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.06`** | At-least-once queue idempotency | `P0` | `worker-integration` | `required-ci` | `verified` | Deliver queue messages more than once and verify idempotent consumers across duplicate delivery windows. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.07`** | Out-of-order message arrival | `P0` | `worker-integration` | `required-ci` | `verified` | Permute message arrival order and delay older updates, asserting domain invariants hold without ordering assumptions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.08`** | Pre-ack persistence failure | `P0` | `worker-integration` | `required-ci` | `verified` | Fail persistence immediately before message ack and prove unpersisted business effects are never acknowledged. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.09`** | Bidirectional message schema skew | `P0` | `worker-integration` | `required-ci` | `verified` | Test message schema compatibility between old producers/new consumers and new producers/old consumers. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.10`** | Data migration distribution verification | `P0` | `worker-integration` | `required-ci` | `verified` | Run data migrations against representative distributions and boundary records before and after migration. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.11`** | Tombstone anti-resurrection | `P1` | `worker-integration` | `required-ci` | `verified` | Replay stale updates after deletion and verify tombstones or version checks prevent record resurrection. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.12`** | Eventual consistency KV reads | `P1` | `worker-integration` | `required-ci` | `verified` | Test behavior under stale KV reads using the documented consistency model without assuming immediate propagation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.13`** | Concurrent cache invalidation | `P1` | `worker-integration` | `required-ci` | `verified` | Exercise cache invalidation after CRUD and permission changes, including overlapping requests that could refill stale data. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.14`** | R2 digest & orphan integrity | `P1` | `worker-integration` | `required-ci` | `verified` | Validate R2 upload/download digests, conditional requests, interrupted multipart uploads, and orphan cleanup. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.15`** | Durable Object concurrency & alarms | `P1` | `worker-integration` | `required-ci` | `verified` | Test Durable Object state transitions under concurrent requests and alarm delivery. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.16`** | Workflow checkpoint replay | `P1` | `worker-integration` | `required-ci` | `verified` | Exercise Workflow checkpoint and replay boundaries with deterministic fixtures without repeating side effects. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.17`** | Real-time collaborative conflict rules | `P1` | `worker-integration` | `required-ci` | `verified` | Test competing real-time edits across reconnects, version gaps, and obsolete base state submissions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.18`** | Cross-timezone & DST storage | `P1` | `worker-integration` | `required-ci` | `verified` | Test timestamps across timezones, DST transitions, leap days, and inclusive/exclusive interval bounds. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.19`** | Concurrent pagination stability | `P1` | `worker-integration` | `required-ci` | `verified` | Paginate while records are added, removed, and reordered, verifying cursor stability and documented behavior. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.20`** | Serialization boundary round-trips | `P1` | `worker-integration` | `required-ci` | `verified` | Round-trip Unicode, BigInt/large integers, nulls, missing fields, binary payloads, and dates across all boundaries. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.21`** | Import/export canonical fidelity | `P1` | `worker-integration` | `required-ci` | `verified` | Compare import and export round-trips against canonical data and report lossy transformations explicitly. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.22`** | Bulk operation partial failures | `P1` | `worker-integration` | `required-ci` | `verified` | Test partial failures in bulk operations and assert per-item outcomes, retry safety, and accurate summaries. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.23`** | Cross-store saga compensation | `P2` | `worker-integration` | `required-ci` | `verified` | Exercise operations spanning D1, R2, and external services, validating compensation and reconciliation on partial failure. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.24`** | Deduplication window expiry | `P2` | `worker-integration` | `required-ci` | `verified` | Test deduplication record expiry against maximum replay windows so cleanup cannot reopen completed operations. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.25`** | Lease fencing tokens | `P2` | `worker-integration` | `required-ci` | `verified` | Test leases, ownership changes, and fencing tokens under delayed workers so expired owners cannot overwrite state. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.26`** | Aggregate & balance reconciliation | `P2` | `worker-integration` | `required-ci` | `verified` | Reconcile aggregates, balances, counters, and denormalized views against source records after retries and writes. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.27`** | Query plan & index correctness | `P2` | `worker-integration` | `required-ci` | `verified` | Verify query correctness when indexes or plans change, including pagination ties, null ordering, and collations. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.28`** | Schema drift detection | `P2` | `worker-integration` | `required-ci` | `verified` | Detect schema drift between declared models, migrations, and deployed test databases before running fixtures. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.29`** | Parallel shard namespace isolation | `P2` | `worker-integration` | `required-ci` | `verified` | Prove test resource isolation across tenants, workers, shards, and reruns even when human-readable names collide. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
| **`F09.30`** | Idempotent orphan cleanup jobs | `P2` | `worker-integration` | `required-ci` | `verified` | Exercise reconciliation and cleanup jobs against interrupted operations, preserving valid records across repeated runs. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F09`)* |
