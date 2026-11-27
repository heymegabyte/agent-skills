# Service routing checklist

For each server, record its stable ID, owner, official source, endpoint, protocol version, transport, authentication, user-delegation mode, data sensitivity, paid or destructive effects, profiles, exact tool allowlist, timeout class, direct endpoint protection, monitoring, and rollback route.

An inventory record starts with no grants. This includes public GitHub MCP endpoints and repositories: discovery may justify review, but it must not attach the server to a portal, expose tools in a profile, or generate a client entry. Authorization begins only with an explicit canonical registry grant backed by live positive and forced-negative checks.

Prefer a vendor's authenticated hosted MCP when its permission model is adequate. Retain a custom server when it adds product-specific behavior, stronger safety, preview/commit semantics, idempotency, or a narrower schema.

Do not remotely wrap a stdio server merely to reduce local process count. First establish authenticated Streamable HTTP, workload isolation, bounded credentials, audit, health, deployment ownership, and a rollback plan.

Installers consume the exact host/client manifest selected by the canonical generated index and verify its source digest or revision before merging. They preserve unrelated entries and local singletons, fail closed on selector or digest drift, and never fall back to a broader endpoint.

Do not retire the predecessor because the replacement exists in source or passed one canary. Require live receipts from every named consumer showing the pinned manifest, successful initialize and allowed behavior, expected denial, failure handling, and usable rollback; retain the predecessor until that matrix is complete.
