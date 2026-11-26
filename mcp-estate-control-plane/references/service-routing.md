# Service routing checklist

For each server, record its stable ID, owner, official source, endpoint, protocol version, transport, authentication, user-delegation mode, data sensitivity, paid or destructive effects, profiles, exact tool allowlist, timeout class, direct endpoint protection, monitoring, and rollback route.

Prefer a vendor's authenticated hosted MCP when its permission model is adequate. Retain a custom server when it adds product-specific behavior, stronger safety, preview/commit semantics, idempotency, or a narrower schema.

Do not remotely wrap a stdio server merely to reduce local process count. First establish authenticated Streamable HTTP, workload isolation, bounded credentials, audit, health, deployment ownership, and a rollback plan.
