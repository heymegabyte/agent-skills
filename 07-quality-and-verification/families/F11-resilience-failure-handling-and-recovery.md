---
name: "F11-resilience-failure-handling-and-recovery"
family: "F11"
title: "F11 — Resilience, failure handling, and recovery"
default_layer: "resilience-recovery"
default_tier: "conditional-release"
recommendations_count: 30
updated: "2026-11-04"
---

# F11 — Resilience, failure handling, and recovery (30 Recommendations: F11.01–F11.30)

> **Summary**: Dependency timeouts, malformed upstream responses, retry classification & jittered backoff, poison-message DLQ replay, crash-between-side-effect-and-commit reconciliation, fail-closed auth outages, backup restoration rehearsals, and rollback safety.
> **Default Layer**: `resilience-recovery` · **Default Execution Tier**: `conditional-release` · **Primary Tools**: Fault Injection Harness, ControllableClock, Disposable Recovery Rehearsal

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F11 Recommendation Catalog (F11.01–F11.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F11.01`** | Dependency timeout injection | `P0` | `resilience-recovery` | `conditional-release` | `verified` | Inject dependency timeouts at call boundaries and verify bounded responses, cancellation, and committed state preservation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.02`** | Malformed upstream payload containment | `P0` | `resilience-recovery` | `conditional-release` | `verified` | Return malformed, truncated, and inconsistent upstream responses, preventing partially parsed data from becoming state. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.03`** | Retry classification & jittered backoff | `P0` | `resilience-recovery` | `conditional-release` | `verified` | Test retry classification, caps, exponential backoff, and jitter with a controllable clock. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.04`** | Mid-flight cancellation cleanup | `P0` | `resilience-recovery` | `conditional-release` | `verified` | Cancel requests during DB, network, and model work; verify abandoned operations release resources and stop side effects. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.05`** | Circuit-breaker & degraded truthfulness | `P0` | `resilience-recovery` | `conditional-release` | `verified` | Exercise circuit breaking and degraded mode, checking recovery probes and truthful user disclosure. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.06`** | Poison queue message containment | `P0` | `resilience-recovery` | `conditional-release` | `verified` | Feed poison queue messages into isolated consumers and verify bounded attempts, diagnostics, and progress for valid items. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.07`** | Dead-letter queue (DLQ) replay safety | `P0` | `resilience-recovery` | `conditional-release` | `verified` | Replay DLQ messages through a controlled recovery path, verifying idempotency, schema compatibility, and permissions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.08`** | Consumer batch restart resumption | `P0` | `resilience-recovery` | `conditional-release` | `verified` | Restart consumers during batches and confirm durable work resumes safely without unbounded duplicate processing. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.09`** | Crash-before-receipt reconciliation | `P0` | `resilience-recovery` | `conditional-release` | `verified` | Crash between an external side effect and its completion record, proving recovery reconciles the ambiguous outcome. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.10`** | Workflow step interruption & resume | `P0` | `resilience-recovery` | `conditional-release` | `verified` | Resume Workflows from interrupted steps and new worker instances without lost or duplicated transitions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.11`** | Durable Object restart & delayed alarms | `P1` | `resilience-recovery` | `conditional-release` | `verified` | Test Durable Object restart and alarm recovery against persisted state, including delayed alarms and obsolete work. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.12`** | Simulated network partition reconciliation | `P1` | `resilience-recovery` | `conditional-release` | `verified` | Simulate network partitions in isolated environments and verify how conflicting or stale state reconciles. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.13`** | Ambiguous commit reconciliation | `P1` | `resilience-recovery` | `conditional-release` | `verified` | Simulate database failures around commit and response delivery so unknown outcomes trigger reconciliation, not blind replay. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.14`** | Disposable fixture corruption containment | `P1` | `resilience-recovery` | `conditional-release` | `verified` | Introduce controlled corruption into disposable fixtures and verify detection and containment before derived outputs. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.15`** | Fail-closed cache & auth outages | `P1` | `resilience-recovery` | `conditional-release` | `verified` | Test cache outages and stale fallbacks without weakening authorization or exposing cross-tenant data. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.16`** | Model & provider failover parity | `P1` | `resilience-recovery` | `conditional-release` | `verified` | Exercise model/provider failover while preserving tool restrictions, structured output schemas, and quality disclosure. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.17`** | Fail-closed policy engine outage | `P1` | `resilience-recovery` | `conditional-release` | `verified` | Test authentication and policy dependency outages, verifying sensitive operations fail closed while public routes survive. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.18`** | Clock skew & lease expiration resilience | `P1` | `resilience-recovery` | `conditional-release` | `verified` | Advance and skew test clocks around token expiry, leases, and scheduled work to eliminate tight clock sync assumptions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.19`** | Disposable backup restore verification | `P1` | `resilience-recovery` | `conditional-release` | `verified` | Restore disposable backups into a fresh environment and verify relational integrity, R2 references, and workflows. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.20`** | Measured RTO & RPO rehearsal | `P1` | `resilience-recovery` | `conditional-release` | `verified` | Measure actual recovery time (RTO) and data loss (RPO) during rehearsal rather than assuming backups work. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.21`** | Rotated-secret recovery diagnostics | `P1` | `resilience-recovery` | `conditional-release` | `verified` | Exercise restoration with missing or rotated secrets and unavailable dependencies to verify actionable diagnostics. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.22`** | Failed migration rollback/forward repair | `P1` | `resilience-recovery` | `conditional-release` | `verified` | Rehearse failed data migration recovery using supported rollback or forward-repair strategies. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.23`** | Deployment rollback with live schema | `P2` | `resilience-recovery` | `conditional-release` | `verified` | Test deployment rollback with current data and compatible dependencies without unsafe database reversal. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.24`** | Offline client queue & reconnect sync | `P2` | `resilience-recovery` | `conditional-release` | `verified` | Exercise offline queued writes, reconnect synchronization, conflict handling, and accurate sync status. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.25`** | Session & refresh recovery idempotency | `P2` | `resilience-recovery` | `conditional-release` | `verified` | Test session recovery after browser refresh or disconnect without replaying completed financial/destructive actions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.26`** | Delayed & duplicated webhook reconciliation | `P2` | `resilience-recovery` | `conditional-release` | `verified` | Delay and duplicate webhooks through recovery scenarios, rejecting obsolete state transitions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.27`** | Approved failover topology rehearsal | `P2` | `resilience-recovery` | `conditional-release` | `verified` | Rehearse regional or provider unavailability in approved test infrastructure to verify actual failover routing. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.28`** | Quota recovery & anti-thundering-herd | `P2` | `resilience-recovery` | `conditional-release` | `verified` | Test throttling responses and quota recovery windows so clients respect Retry-After without synchronized bursts. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.29`** | Bounded chaos injection verification | `P2` | `resilience-recovery` | `conditional-release` | `verified` | Bound chaos scenarios by target, duration, traffic, and cleanup, and verify the fault injection actually triggered. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
| **`F11.30`** | Executable runbook rehearsals | `P2` | `resilience-recovery` | `conditional-release` | `verified` | Run recovery procedures against disposable environments as executable tests and update stale runbook steps. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F11`)* |
