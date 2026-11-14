---
name: "F10 — Performance, capacity, and cost"
familyId: "F10"
defaultLayer: "performance_load"
defaultTier: "required_ci"
itemCount: 30
---

# F10: Performance, capacity, and cost (F10.01–F10.30)

- **Default Verification Layer**: `performance_load`
- **Default Execution Tier**: `required_ci`
- **Authorized Pilot Implementation**: `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F10.01` | **Latency and CWV budgets** | Enforce LCP <= 2.5s (2.0s target), INP <= 200ms (100ms target), and CLS <= 0.1 (0.05 target). | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.02` | **Cold vs warm execution measurement** | Track cold-start vs warm-cache durations separately in the 300-second CI gate report. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.03` | **Realistic cardinality testing** | Test 6 full 2,000–3,000+ word articles with 12 visuals and 15-candidate slates. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.04` | **Five-minute gate budget enforcement** | Enforce the 300-second (0–30s, 30–120s, 120–270s, 270–300s) required CI budget. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.05` | **Capacity boundary identification** | Bound concurrent Browser Run sessions and worker concurrency with explicit semaphore limits. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.06` | **Spike and backlog recovery** | Spread overdue publishing slots via planOutageCatchUp rather than bursting traffic. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.07` | **Soak and memory retention bounds** | Route extended soak and fuzz campaigns to scheduled deeper_audit workflows. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.08` | **Runtime memory and payload limits** | Enforce 10MB upload limits and bounded payload sizes in Worker handlers. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.09` | **Index and lookup efficiency** | Use O(1) Map/Set lookups for theme resolution, citation numbering, and RBAC checks. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.10` | **Bounded fanout (no N+1)** | Batch DataForSEO keywords (up to 1,000 per search_intent/difficulty request) instead of N+1 calls. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.11` | **Cache hit/miss and stampede control** | Key DataForSEO cache by canonical endpoint + locale + query fingerprint with separate TTLs. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.12` | **Streaming and backpressure cleanup** | Clean up aborted requests and browser sessions in finally blocks. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.13` | **Queue drain and retry pacing** | Enforce minimum spacing between catch-up publications and bounded backoff with jitter. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.14` | **Hot-key contention fairness** | Scope locks and reservations per siteId and topic slug rather than a global mutex. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.15` | **Downstream fanout timeout bounds** | Enforce per-stage timeouts so a slow external provider cannot hang the entire workflow. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.16` | **Lab vs field performance distinction** | Distinguish Lighthouse/Playwright lab timings from field RUM metrics in reports. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.17` | **Adversarial input CPU bounds** | Use linear-time tokenization and non-backtracking regexes in word and density counters. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.18` | **Entrypoint bundle and code-split budgets** | Verify LazyPlateEditor (5.41 kB gzip) is code-split from public reader entrypoints. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.19` | **Zero-CLS media dimension locking** | Require explicit integer width and height on every VisualAsset and FigureFrame. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.20` | **Constrained network/CPU usability** | Render complete static semantic HTML so articles are readable before JS hydration finishes. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.21` | **Quota soft-warning degradation** | Downgrade optional image tiers at 80% budget utilization before hitting the 100% hard stop. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.22` | **Token and provider cost accounting** | Record estimated vs actual micro-USD cost for every DataForSEO, LLM, and image operation. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.23` | **End-to-end deadline propagation** | Enforce runDeadlineMs across CI gate stages and Browser Run session leases. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.24` | **Cost per approved outcome tracking** | Compute all-in cost per approved article and accepted visual in MicroUsdBudgetManager. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.25` | **Multi-tenant resource fairness** | Enforce per-site daily/monthly caps alongside the portfolio-wide spending limit. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.26` | **Transfer and compression efficiency** | Verify gzip sizes of built JS/CSS assets and static SEO files during build. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.27` | **Multi-sample noise policy** | Record p50/p95 durations and variance across repeated benchmark samples. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.28` | **Compatible baseline performance comparison** | Compare timing against the last verified baseline revision on matching hardware. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.29` | **Browser Run session reuse and rate tuning** | Reuse one remote Chromium browser per worker with fresh contexts and <= 3 launches/sec. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
| `F10.30` | **Scaling curve verification** | Verify selector and renderer scale linearly from 1 to 15 themes and 1 to 50 articles. | `performance_load` | `required_ci` | `verified` | `packages/testing/src/ci-gate.ts & packages/blog/src/publishing.ts` |
