---
name: "F09 — Data correctness and distributed behavior"
familyId: "F09"
defaultLayer: "worker_integration"
defaultTier: "required_ci"
itemCount: 30
---

# F09: Data correctness and distributed behavior (F09.01–F09.30)

- **Default Verification Layer**: `worker_integration`
- **Default Execution Tier**: `required_ci`
- **Authorized Pilot Implementation**: `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F09.01` | **Transaction rollback boundaries** | Verify failed publish attempts leave previousPublishedRevisionId intact with zero partial state. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.02` | **Constraint enforcement under concurrency** | Enforce unique topic reservation and slot claim constraints across concurrent callers. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.03` | **Monetary integer micro-unit precision** | Perform all cost and budget arithmetic in integer micro-USD (1 USD = 1,000,000 micro-USD). | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.04` | **Idempotency key deduplication** | Deduplicate repeated provider operations and slot claims using deterministic idempotency keys. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.05` | **Uniqueness race prevention** | Prevent check-then-insert races in AtomicTopicReservationStore and PublicationSchedulerEngine. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.06` | **At-least-once queue consumer idempotency** | Ensure repeated queue/cron triggers for the same slot publish at most once. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.07` | **Out-of-order message convergence** | Preserve state machine invariants when status updates or callbacks arrive out of order. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.08` | **Commit-before-ack durability** | Persist revision and asset records before switching publishedRevisionId or acknowledging completion. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.09` | **Backward/forward schema compatibility** | Support schemaVersion migrations and legacy content import without breaking existing readers. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.10` | **Migration data integrity** | Verify importLegacyContentToPlate preserves headings, prose, code, and links while quarantining unknown MDX. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.11` | **Tombstone and stale-update rejection** | Reject stale baseRevisionId saves with explicit STALE_BASE_REVISION conflict outcomes. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.12` | **Eventual consistency tolerance** | Design cache invalidation and read paths to tolerate edge propagation delays safely. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.13` | **Post-mutation cache invalidation** | Invalidate article, index, sitemap, and RSS caches only after atomic pointer commit. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.14` | **Object storage digest verification** | Bind sha256 contentHash, evidenceHash, and assetManifestHash into reviewedRevisionDigest. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.15` | **Durable Object state serialization** | Ensure DurableYjsRoomAuthority persists CRDT updates before acknowledging writes. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.16` | **Workflow checkpoint resumption** | Record per-stage artifacts in EditorialWorkflowLedger so retries resume from the last valid stage. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.17` | **Real-time collaborative conflict rules** | Route collaborative edits through DurableYjsRoomAuthority and revoke disconnected non-members. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.18` | **Timezone and DST timestamp accuracy** | Resolve 09:00, 14:00, and 19:00 America/New_York slots accurately across EDT and EST. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.19` | **Cursor and pagination stability** | Maintain deterministic ordering across article lists, revisions, and citation numbering. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.20` | **Serialization boundary fidelity** | Round-trip Unicode, micro-USD integers, nulls, and ISO timestamps across JSON boundaries. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.21` | **Import/export round-trip reporting** | Emit explicit conversion reports and quarantined block counts during legacy migration. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.22` | **Partial failure batch accounting** | Report per-item outcomes in batch scheduling and evaluation runs without masking failures. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.23` | **Cross-store compensation** | Automatically roll back publishedRevisionId if post-publish smoke verification fails. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.24` | **Deduplication window retention** | Retain task and slot idempotency records across the full retry window. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.25` | **Lease expiry and fencing tokens** | Enforce leaseExpiresAt on topic reservations and slot claims so expired workers cannot overwrite state. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.26` | **Aggregate and ledger reconciliation** | Reconcile MicroUsdBudgetManager ledger totals against individual ProviderOperation costs. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.27` | **Query and sort determinism** | Ensure ComparisonTable sorting handles null cells deterministically with explicit missingValuePolicy. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.28` | **Schema drift detection** | Validate all 14 core contracts and 15 theme schemas in CI before build. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.29` | **Multi-worker namespace isolation** | Isolate test fixtures by unique tenant/site/run prefixes across parallel Vitest and Playwright workers. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
| `F09.30` | **Orphan cleanup idempotence** | Ensure repeated reservation/session cleanup leaves valid active leases untouched. | `worker_integration` | `required_ci` | `verified` | `packages/blog/src/publishing.ts & packages/blog/src/topic-strategy.ts` |
