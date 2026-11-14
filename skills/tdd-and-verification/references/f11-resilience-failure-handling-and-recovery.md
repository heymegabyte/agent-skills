---
name: "F11 — Resilience, failure handling, and recovery"
familyId: "F11"
defaultLayer: "resilience_chaos"
defaultTier: "required_ci"
itemCount: 30
---

# F11: Resilience, failure handling, and recovery (F11.01–F11.30)

- **Default Verification Layer**: `resilience_chaos`
- **Default Execution Tier**: `required_ci`
- **Authorized Pilot Implementation**: `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F11.01` | **Dependency timeout injection** | Inject timeouts at provider boundaries and verify bounded fallback without corrupting state. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.02` | **Malformed upstream response containment** | Reject DataForSEO envelopes where HTTP 200 contains task status_code !== 20000. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.03` | **Retry classification and jittered backoff** | Retry only transient 429/503 errors; halt immediately on 401/402 auth or billing errors. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.04` | **Cancellation resource release** | Release Browser Run leases and abort in-flight work when a test or job is cancelled. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.05` | **Circuit-breaker degradation** | Open provider circuit breakers on repeated failures and fall back to valid cached briefs. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.06` | **Poison message isolation** | Quarantine malformed queue/import payloads without blocking unrelated valid articles. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.07` | **Dead-letter replay safety** | Replay failed workflow stages idempotently from the last valid checkpoint artifact. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.08` | **Batch restart resumption** | Resume interrupted multi-stage workflows without repeating completed paid provider calls. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.09` | **Ambiguous side-effect reconciliation** | Consult ProviderOperation task ledger before retrying a timed-out paid POST request. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.10` | **Workflow step checkpoint durability** | Persist stage outputs in EditorialWorkflowLedger across worker restarts. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.11` | **Durable Object hibernation recovery** | Reconstruct DurableYjsRoomAuthority state from persisted CRDT snapshots and updates. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.12` | **Partition conflict reconciliation** | Detect divergent baseRevisionId edits after reconnect and present conflict resolution UI. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.13` | **Commit outcome reconciliation** | Verify publishedRevisionId pointer switch and run smoke check before marking slot published. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.14` | **Corrupt fixture containment** | Quarantine unsupported MDX/HTML blocks during migration instead of crashing or dropping prose. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.15` | **Fail-closed security under cache outage** | Never grant authoring or publishing permissions when session or membership lookup fails. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.16` | **Model and image tier failover** | Escalate from economical flux-1-schnell to fallback tier only when quality checks fail within budget. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.17` | **Auth dependency outage behavior** | Keep public static article reading 100% functional even if auth providers are unreachable. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.18` | **Clock skew and expiry resilience** | Test token and lease expiration across clock skew boundaries. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.19` | **Backup restoration verification** | Verify canonical Plate documents, source ledgers, and revisions restore with intact hashes. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.20` | **Measured RTO and RPO rehearsal** | Measure rollback and restoration latency during post-publish smoke failure rehearsals. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.21` | **Missing/rotated secret diagnostics** | Emit clear configuration errors when provider secrets are absent without leaking values. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.22` | **Migration rollback and repair** | Retain original raw source alongside imported Plate nodes for lossless rollback. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.23` | **Automatic post-publish smoke rollback** | Revert publishedRevisionId to previousPublishedRevisionId automatically when smoke check fails. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.24` | **Offline client draft persistence** | Persist unsaved Plate edits to user/tenant/article-scoped localStorage while offline. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.25` | **Session refresh continuity** | Preserve EditorialSessionUser across page navigation and reload without re-submitting mutations. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.26` | **Delayed/duplicate callback handling** | Ignore duplicate or stale provider task callbacks once an operation is reconciled. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.27` | **Fail-soft edge metadata rewriting** | Ensure a Worker HTMLRewriter error falls back to serving the working SPA shell rather than a 500. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.28` | **Retry-After header compliance** | Respect Retry-After delays within the remaining run deadline in BrowserRunPoolCoordinator. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.29` | **Bounded fault-injection scope** | Scope chaos and fault-injection tests to isolated in-memory or test-namespace stores. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
| `F11.30` | **Executable recovery runbooks** | Verify rollback and incident recovery procedures in automated tests and documented guides. | `resilience_chaos` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/testing/src/browser-run.ts` |
