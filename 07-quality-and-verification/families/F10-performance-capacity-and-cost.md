---
name: "F10-performance-capacity-and-cost"
family: "F10"
title: "F10 — Performance, capacity, and cost"
default_layer: "performance-load"
default_tier: "conditional-release"
recommendations_count: 30
updated: "2026-11-04"
---

# F10 — Performance, capacity, and cost (30 Recommendations: F10.01–F10.30)

> **Summary**: Latency percentiles (p50/p95/p99), cold vs warm separation, production-shaped cardinality/skew, N+1 fanout bounds, cache stampede checks, bundle/CSS/font budgets, AI token & Browser Run cost per outcome, and tenant fairness.
> **Default Layer**: `performance-load` · **Default Execution Tier**: `conditional-release` · **Primary Tools**: k6, Lighthouse CI, Bundle/Token Cost Budget Gate, Browser Run Telemetry

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F10 Recommendation Catalog (F10.01–F10.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F10.01`** | Percentile latency & throughput SLOs | `P0` | `performance-load` | `conditional-release` | `verified` | Define p50/p95/p99 latency, error rate, and throughput expectations for critical journeys under realistic mixes. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.02`** | Cold vs warm separation | `P0` | `performance-load` | `conditional-release` | `verified` | Measure cold and warm execution separately so startup, connection, and cache initialization costs remain visible. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.03`** | Production-shaped cardinality & skew | `P0` | `performance-load` | `conditional-release` | `verified` | Use production-shaped synthetic cardinality and skew when testing queries, lists, and permissions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.04`** | Five-minute gate bounded probes | `P0` | `performance-load` | `conditional-release` | `verified` | Keep bounded regression probes in the 300s gate and route long capacity experiments to risk-selected workflows. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.05`** | Saturation boundary discovery | `P0` | `performance-load` | `conditional-release` | `verified` | Increase load in isolated infrastructure until a documented capacity boundary saturates and verify failure communication. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.06`** | Spike & recovery dynamics | `P0` | `performance-load` | `conditional-release` | `verified` | Test sudden traffic spikes and subsequent recovery, measuring rejection behavior, queue growth, and self-healing. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.07`** | Long-running soak stability | `P0` | `performance-load` | `conditional-release` | `verified` | Run soak scenarios when resource lifetime changes, watching memory, connections, handles, and backlog growth. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.08`** | Memory peak & retention budgets | `P0` | `performance-load` | `conditional-release` | `verified` | Profile peak and retained memory for large inputs, repeated operations, and cancelled requests within Worker limits. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.09`** | Skewed query plan inspection | `P0` | `performance-load` | `conditional-release` | `verified` | Inspect query plans and execution time on representative skewed data when access patterns change. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.10`** | Bounded N+1 fanout assertion | `P0` | `performance-load` | `conditional-release` | `verified` | Detect N+1 requests or queries by asserting bounded fanout as result counts grow across permissions and nested views. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.11`** | Cache hit/miss/stampede dynamics | `P1` | `performance-load` | `conditional-release` | `verified` | Measure cache hit, miss, stampede, oversized key, and churn workloads independently. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.12`** | Slow-consumer streaming backpressure | `P1` | `performance-load` | `conditional-release` | `verified` | Test streaming with slow consumers and backpressure, verifying bounded buffering, TTFB, and disconnect cleanup. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.13`** | Queue drain & burst recovery | `P1` | `performance-load` | `conditional-release` | `verified` | Measure queue drain rates against realistic producer bursts and downstream limits without retry storms. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.14`** | Hot-key & hot-DO contention | `P1` | `performance-load` | `conditional-release` | `verified` | Test hot-key and hot Durable Object scenarios where traffic concentrates, measuring fairness and contention. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.15`** | Downstream fanout & tail amplification | `P1` | `performance-load` | `conditional-release` | `verified` | Bound parallel downstream fanout per request and test latency amplification and cancellation when a dependency slows. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.16`** | Lab vs field CWV alignment | `P1` | `performance-load` | `conditional-release` | `verified` | Compare lab frontend performance budgets with RUM definitions under explicit device, network, and cache conditions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.17`** | Adversarial algorithmic complexity | `P1` | `performance-load` | `conditional-release` | `verified` | Exercise CPU-intensive parsing, validation, and rendering with adversarial valid inputs to detect superlinear growth. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.18`** | Entrypoint bundle & execution budgets | `P1` | `performance-load` | `conditional-release` | `verified` | Track JS bundle, CSS, and asset budgets for changed entrypoints across both gzip transfer size and parse/exec cost. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.19`** | Font & image CLS/LCP budgets | `P1` | `performance-load` | `conditional-release` | `verified` | Test image and font delivery choices against layout stability (CLS), LCP rendering time, and transfer budgets. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.20`** | Throttled CPU & network journeys | `P1` | `performance-load` | `conditional-release` | `verified` | Run critical browser journeys under representative network and CPU constraints before secondary assets finish loading. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.21`** | Quota approach degradation | `P1` | `performance-load` | `conditional-release` | `verified` | Exercise approaching provider quotas and resource limits in bounded tests to verify graceful degradation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.22`** | AI token & tool-call cost accounting | `P1` | `performance-load` | `conditional-release` | `verified` | Measure model input/output tokens, cache hits, and tool calls per successful AI task against transparent pricing. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.23`** | End-to-end deadline propagation | `P2` | `performance-load` | `conditional-release` | `verified` | Test deadline propagation across services and retries so nested timeouts cannot multiply user wait time. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.24`** | Unit economics per business outcome | `P2` | `performance-load` | `conditional-release` | `verified` | Calculate total cost per successful business outcome including retries, storage, tokens, and Browser Run minutes. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.25`** | Multi-tenant noisy-neighbor fairness | `P2` | `performance-load` | `conditional-release` | `verified` | Test tenant fairness under uneven load so one expensive tenant cannot monopolize compute, queues, or connections. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.26`** | Egress & conditional fetch efficiency | `P2` | `performance-load` | `conditional-release` | `verified` | Measure data transfer and repeated downloads on critical routes, checking compression and ETag/304 efficiency. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.27`** | Statistical noise & sample policy | `P2` | `performance-load` | `conditional-release` | `verified` | Use repeated samples and an explicit noise policy to distinguish sustained regressions from shared-runner variance. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.28`** | Baseline-matched performance diffs | `P2` | `performance-load` | `conditional-release` | `verified` | Compare performance against a compatible baseline with identical scenario and environment metadata. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.29`** | Browser Run session & concurrency tuning | `P2` | `performance-load` | `conditional-release` | `verified` | Measure Cloudflare Browser Run session startup, reuse, concurrency, and browser-minute cost within account limits. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
| **`F10.30`** | Multi-point scaling growth curves | `P2` | `performance-load` | `conditional-release` | `verified` | Test growth curves across multiple dataset/input sizes to reject optimizations that degrade near supported limits. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F10`)* |
