---
name: "F03-integration-and-contracts"
family: "F03"
title: "F03 — Integration and contracts"
default_layer: "worker-integration"
default_tier: "required-ci"
recommendations_count: 30
updated: "2026-11-04"
---

# F03 — Integration and contracts (30 Recommendations: F03.01–F03.30)

> **Summary**: Cloudflare Worker workerd runtime fidelity, D1/KV/R2/DO/Queues/Workflows boundaries, service bindings, request/response schema conformance, consumer-driven contracts, version skew, webhook exact-byte signatures, and per-file storage isolation.
> **Default Layer**: `worker-integration` · **Default Execution Tier**: `required-ci` · **Primary Tools**: @cloudflare/vitest-pool-workers, Zod, Pact / Schema Contracts

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F03 Recommendation Catalog (F03.01–F03.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F03.01`** | Worker runtime fidelity | `P0` | `worker-integration` | `required-ci` | `verified` | Exercise real request handlers in the Cloudflare Workers test runtime, exposing differences hidden by Node-only mocks. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.02`** | Database adapter boundaries | `P0` | `worker-integration` | `required-ci` | `verified` | Execute reads, writes, constraint failures, and transactions through real database adapters against isolated test DBs. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.03`** | KV consistency assumptions | `P0` | `worker-integration` | `required-ci` | `verified` | Test KV consumers against declared stale-read and missing-value behavior without assuming global strong consistency. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.04`** | Object-storage contracts | `P0` | `worker-integration` | `required-ci` | `verified` | Exercise R2 storage adapters for content, metadata, checksums, missing objects, conditional updates, and streaming failures. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.05`** | Durable Object interactions | `P0` | `worker-integration` | `required-ci` | `verified` | Verify actual Durable Object routing, persisted state, alarms, and repeated requests across lifecycle transitions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.06`** | Message producer-consumer contracts | `P0` | `worker-integration` | `required-ci` | `verified` | Connect real message serialization and consumer handling across schema versions, duplicates, and poison messages. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.07`** | Workflow step boundaries | `P0` | `worker-integration` | `required-ci` | `verified` | Verify durable workflow steps preserve required inputs, outputs, and resumable state across retries. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.08`** | Service bindings | `P0` | `worker-integration` | `required-ci` | `verified` | Test requests across actual service bindings, verifying methods, paths, identity context, errors, and cancellation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.09`** | Request schema conformance | `P0` | `worker-integration` | `required-ci` | `verified` | Exercise required/optional fields, content types, unknown properties, and invalid encodings against executable API schemas. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.10`** | Response contract conformance | `P0` | `worker-integration` | `required-ci` | `verified` | Validate status codes, headers, body schemas, nullability, and error envelopes for success and failure responses. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.11`** | Consumer-driven compatibility | `P1` | `worker-integration` | `required-ci` | `verified` | Add consumer-driven contracts for critical HTTP/message consumers and verify providers against relevant versions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.12`** | Version-skew scenarios | `P1` | `worker-integration` | `required-ci` | `verified` | Test old consumers with new providers and new consumers with old providers across field removal and enum expansion. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.13`** | API specification drift | `P1` | `worker-integration` | `required-ci` | `verified` | Compare published API contracts with proposed changes and require compatibility evidence for breaking classifications. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.14`** | HTTP semantics | `P1` | `worker-integration` | `required-ci` | `verified` | Verify pagination links, redirects, conditional requests, caching headers, and content negotiation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.15`** | Webhook interchange | `P1` | `worker-integration` | `required-ci` | `verified` | Verify webhook payload serialization, exact-byte signature input, timestamps, event IDs, and acknowledgement. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.16`** | Third-party fixture realism | `P1` | `worker-integration` | `required-ci` | `verified` | Maintain sanitized provider examples for deterministic adapter tests and validate assumptions against sandboxes. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.17`** | Upstream failure protocols | `P1` | `worker-integration` | `required-ci` | `verified` | Exercise provider rate limits, Retry-After instructions, malformed responses, and transient errors through real adapters. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.18`** | Identity-provider interchange | `P1` | `worker-integration` | `required-ci` | `verified` | Verify supported IdP claims, callback parameters, issuer config, and token response formats. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.19`** | Multipart and streaming transport | `P1` | `worker-integration` | `required-ci` | `verified` | Exercise multipart boundaries, binary payloads, streaming chunks, and interrupted uploads through real parsers. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.20`** | Cancellation propagation | `P1` | `worker-integration` | `required-ci` | `verified` | Abort clients during downstream work and verify cancellation releases resources and preserves state consistency. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.21`** | Proxy and routing context | `P1` | `worker-integration` | `required-ci` | `verified` | Test forwarded host, scheme, path prefixes, and redirects through the application's real proxy configuration. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.22`** | Middleware composition | `P1` | `worker-integration` | `required-ci` | `verified` | Execute real routing and middleware chains for allowed and rejected requests, verifying ordering and outcomes. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.23`** | Tenant context propagation | `P2` | `worker-integration` | `required-ci` | `verified` | Trace tenant context across handler, service, and storage boundaries using distinct fixtures. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.24`** | Migration interoperability | `P2` | `worker-integration` | `required-ci` | `verified` | Exercise reads and writes against supported schema transition states and mixed application versions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.25`** | Search-index propagation | `P2` | `worker-integration` | `required-ci` | `verified` | Connect writes, index updates, queries, and deletion handling within a declared convergence deadline. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.26`** | Cache invalidation wiring | `P2` | `worker-integration` | `required-ci` | `verified` | Populate real caches, perform mutations, and verify subsequent reads follow documented freshness and tenant boundaries. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.27`** | Notification transport contracts | `P2` | `worker-integration` | `required-ci` | `verified` | Send composed notifications to a test sink through the real adapter without delivering to real users. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.28`** | Transaction-to-event consistency | `P2` | `worker-integration` | `required-ci` | `verified` | Verify committed changes produce intended events and failed transactions do not across crash boundaries. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.29`** | Cross-service cleanup | `P2` | `worker-integration` | `required-ci` | `verified` | Force failure after intermediate resources are created and verify compensation removes or marks them correctly. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
| **`F03.30`** | Worker storage isolation | `P2` | `worker-integration` | `required-ci` | `verified` | Account for Workers per-test-file storage isolation by explicitly resetting per-test fixtures and namespaces. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F03`)* |
