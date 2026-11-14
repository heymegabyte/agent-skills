---
name: "F03 — Integration and contracts"
familyId: "F03"
defaultLayer: "worker_integration"
defaultTier: "required_ci"
itemCount: 30
---

# F03: Integration and contracts (F03.01–F03.30)

- **Default Verification Layer**: `worker_integration`
- **Default Execution Tier**: `required_ci`
- **Authorized Pilot Implementation**: `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F03.01` | **Worker runtime fidelity** | Exercise real request handlers in the Cloudflare Workers runtime integration rather than Node-only mocks. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.02` | **Database adapter boundaries** | Execute representative reads, writes, constraint failures, and transactions against isolated test databases. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.03` | **KV consistency assumptions** | Test KV consumers against declared stale-read and missing-value behavior. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.04` | **Object-storage contracts** | Exercise R2 adapters for content, metadata, checksums, missing objects, and conditional updates. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.05` | **Durable Object interactions** | Verify Durable Object routing, persisted state, alarms, and repeated requests across lifecycle transitions. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.06` | **Message producer-consumer contracts** | Connect message serialization and consumer handling across duplicate delivery and poison messages. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.07` | **Workflow step boundaries** | Verify durable workflow steps preserve required inputs, outputs, and resumable state across retries. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.08` | **Service bindings** | Test requests across service bindings verifying methods, paths, identity context, and error propagation. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.09` | **Request schema conformance** | Exercise required/optional fields, content types, unknown properties, and invalid encodings against API schemas. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.10` | **Response contract conformance** | Validate status codes, headers, body schemas, nullability, and error envelopes. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.11` | **Consumer-driven compatibility** | Verify shared contracts between theme.tools packages and consuming apps (ui.theme.tools, apps/web). | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.12` | **Version-skew scenarios** | Test old consumers with new providers and new consumers with old providers across schema evolution. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.13` | **API specification drift** | Compare published API contracts with proposed changes and require compatibility evidence for breaking diffs. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.14` | **HTTP semantics** | Verify pagination links, redirects, conditional requests, caching headers, and content negotiation. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.15` | **Webhook interchange** | Verify webhook payload serialization, exact-byte signature input, timestamps, and idempotent acks. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.16` | **Third-party fixture realism** | Maintain sanitized provider captures (e.g. DataForSEO v3) validated against live schemas. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.17` | **Upstream failure protocols** | Exercise provider 429 rate limits, Retry-After headers, malformed responses, and bounded retries. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.18` | **Identity-provider interchange** | Verify OAuth/Magic-Link claims, callback parameters, PKCE, and state binding. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.19` | **Multipart and streaming transport** | Exercise multipart boundaries, binary payloads, streaming chunks, and interrupted uploads. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.20` | **Cancellation propagation** | Abort clients during downstream work and verify resource release and consistent state. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.21` | **Proxy and routing context** | Test forwarded host, scheme, path prefixes, and canonical redirects through Worker routing. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.22` | **Middleware composition** | Execute real routing and security-header/auth middleware chains for allowed and rejected requests. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.23` | **Tenant context propagation** | Trace tenantId and siteId across handler, service, and storage boundaries without cross-tenant leakage. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.24` | **Migration interoperability** | Exercise reads and writes across legacy MDX/HTML to Plate schema transition states. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.25` | **Search-index propagation** | Connect publication mutations, sitemap/RSS updates, and index convergence within declared bounds. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.26` | **Cache invalidation wiring** | Populate caches, perform publish/rollback mutations, and verify subsequent reads reflect fresh state. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.27` | **Notification transport contracts** | Send composed notifications to captured test sinks validating recipients, templates, and links. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.28` | **Transaction-to-event consistency** | Verify committed changes emit intended audit/analytics events and failed transactions emit none. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.29` | **Cross-service cleanup** | Force failure after intermediate R2/DB resources are created and verify compensation/rollback. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
| `F03.30` | **Worker storage isolation** | Enforce per-test namespace/storage cleanup so concurrent stateful Worker tests never bleed state. | `worker_integration` | `required_ci` | `verified` | `apps/web/worker/index.ts & packages/blog/src/dataforseo.ts` |
