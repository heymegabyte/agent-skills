---
name: "platform-knowledge-integrations"
priority: 1
pack: "platform"
triggers:
  - "better auth"
  - "ai search"
  - "nango"
  - "activepieces"
  - "infisical"
paths:
  - "concern:identity-knowledge-integrations"
last_reviewed: 2026-10-31
superseded_by: null
---

# Identity, knowledge, connections and credential boundaries

Applies under [shared platform policy](platform-shared-capabilities.md). Sources: [research record](../reference/platform-research-2026-10-31.md), sections C, D and F.

## Better Auth and authorization

- Standardize product authentication on Better Auth, with Google, GitHub and email magic-link journeys retained. Inventory existing user IDs, sessions, orgs, provider subjects, callbacks and account-linking behavior before cutover; preserve rollback and avoid silent mass logout.
- Enforce user/session validity plus tenant, project/site, resource, role, capability, entitlement, environment and approval constraints server-side. Better Auth organization roles do not automatically scope arbitrary document queries.
- Use explicit permissions for reading, drafting, commenting, reviewing, publishing, scheduling, connector use, workflow edits, render spending and machine actions. A frontend Edit toggle or feature flag is not an authorization boundary.
- Separate platform login OAuth, customer third-party connector consent, and authorization for MCP clients. Request only necessary provider scopes; use state/nonce, PKCE where applicable, exact redirects, appropriate audiences and server-side token verification.
- These products span unrelated registrable domains. Do not try to share a parent-domain cookie across .site/.tools/.management/.vision/.kitchen. Use an audited OAuth/OIDC SSO flow with app-local sessions and logout/revocation behavior, or independent Better Auth installations sharing contracts.
- Prove the database adapter and plugin combination in Workers. Better Auth supports D1, but the reviewed SCIM 1.7 flow explicitly requires transactions unavailable through that D1 integration. Use a supported database within caps only when that feature is required; do not generalize this exception to every auth feature.
- Desktop/CLI sign-in uses an approved device or PKCE flow supported by the selected version, with short-lived scoped tokens. Never extract browser cookies or copy human subscription OAuth profiles into Infisical or customer execution.

## Cloudflare AI Search, not QMD

- Index only approved documentation, specifications, skills and product content. Git/content storage remains authoritative; AI Search is a derived index. No secrets, auth stores, private transcripts or unreviewed repository dumps.
- Prefer isolated instances per tenant/security boundary; scope project and document access within them. A shared instance needs mandatory server-derived pre-retrieval filters and leakage tests. No public search/MCP endpoint for private content.
- Do not trust client tenant headers from documentation examples. Resolve identity, memberships, allowed projects and security partitions from authoritative records; deny absent/unknown scope before search.
- Maintain source ID/URI, exact revision/hash, tenant/project, approval/publication status, visibility/ACL partition, update/delete sequence, parser/index version and ingest status in authoritative metadata.
- Fit indexed metadata to current service limits. Reviewed docs allow five custom fields and filter strings only through their first 64 UTF-8 bytes; do not assume array ACL support. Use short opaque scalar IDs and tested partitions, not long path-prefix authorization.
- Treat indexing as asynchronous. Publishing, edit, ACL change, deletion and revocation emit durable change records; idempotent ingestion upserts/deletes, schedules allowed syncs, retries and reconciles against source inventory.
- Set an immediate authoritative tombstone/ACL revision before asynchronous deletion. Recheck candidate permissions and deletion status **before any snippet reaches the model or user**, including cached answers and citations. If this cannot be guaranteed, fail closed or isolate the instance.
- Return verified source references and approved excerpts. Separate approved global skills from tenant-private knowledge; never let retrieved instructions override security or user/system intent.
- Key caches by security scope, authorization version and corpus/index revision. Measure freshness lag, retrieval quality, denied cross-tenant probes and deletion/ACL convergence. A sync request accepted by the API is not proof of updated search results.
- Preserve old QMD access only for an explicitly tracked migration dependency; do not add new QMD paths. Remove after parity, authorization and deletion tests pass.

## Shared integration and automation plane

- Create versioned TypeScript contracts for Connection, CredentialRef, ConnectorManifest, Action, Trigger, SyncCursor, WebhookReceipt, RateLimitPolicy, Run and typed errors. Share them across every product, agent tool, MCP App and automation step.
- Better Auth establishes actor identity; the integration layer owns customer connections/consent and token lifecycle; Agent Vault brokers supported credentialed requests; Activepieces-derived workflows orchestrate actions. Only one owner refreshes each token family.
- Keep encrypted credentials and refresh tokens server-side behind a scoped secret-reference abstraction, backed by approved Infisical facilities where supported. Product databases store references/metadata, not plaintext. Never use a shared platform token to impersonate a customer's connection.
- OAuth callback state is one-time, signed/bound to actor/tenant/provider/redirect and expires. Defend against account linking, confused-deputy and SSRF attacks; display whose account was connected and granted capabilities.
- Serialize refresh per connection with a durable lock/fencing token; atomically save rotated refresh tokens. Handle expiry, revoked consent, scope loss and invalid_grant by pausing dependent work and showing a reconnect action, not an infinite retry loop.
- Incremental sync advances a cursor only after durable writes; support pagination, overlap windows, deduplication, tombstones, backfills, schema migration and resumable checkpoints. Two-way sync needs explicit field ownership and loop prevention.
- Verify webhook signatures against raw bytes with timestamp/replay checks. Persist dedupe receipt before acknowledgement, queue processing, and enforce event size/tenant mapping. Provider registration, renewal and cleanup are lifecycle-managed.
- Enforce provider/account/tenant quotas, Retry-After and bounded exponential backoff with jitter. Distinguish transient, quota, auth, validation and permanent errors; use dead-letter inspection and deliberate replay.
- External effects use provider idempotency keys or reconciliation. Do not claim exactly-once sends, payments or writes because a Workflow step or Queue message retried.
- Adapt legally reusable Activepieces actions/triggers and author independent equivalents where necessary. Pin flow and piece versions; test suspended-run compatibility. Replace Redis/BullMQ/process assumptions with tested Workers/DO/Workflows/Queues adapters, not dependency-name substitutions.
- Connector code requiring unsupported Node/native libraries runs only in an approved isolated runtime. Untrusted connector/code execution receives capability-scoped network/filesystem access, not control-plane bindings.
- Disconnect revokes tokens where supported, cancels/pauses dependent runs, unregisters webhooks, purges eligible indexes/caches and records retention obligations. Never silently delete legally required audit records.

## Infisical and Agent Vault

- Infisical is the source of truth for managed secrets. Configure Agent Vault with its Infisical-backed credential store where supported; downstream encrypted caches/Cloudflare secret delivery are replicas with explicit freshness/rotation policy, not competing authorities.
- Use supported Agent Vault SDK/protocol, short-lived scoped proxy sessions, isolated broker administration, host/path restrictions, TLS verification and audited server-side substitution. Its preview status requires version pins, compatibility tests and staged rollout.
- Keep broker master keys, CA private keys and management credentials outside agent sandboxes. A local process with host-admin rights can defeat a same-host proxy boundary; deploy stronger separation where that threat matters.
- Proxy environment variables alone are not enforced egress control. Test direct-network bypass, redirects, DNS rebinding, credential echo endpoints and SSRF. Never disable certificate verification to make interception work.
- Credential non-disclosure does not prevent authorized API abuse. Enforce action permissions, scopes, spending limits and approvals independently, with response redaction.
- Verify each runtime/protocol supports the broker. Workers fetch is not assumed to honor HTTP_PROXY/HTTPS_PROXY; use a supported authenticated broker API or trusted scoped server-side executor. Do not build an open URL proxy or claim all SDKs/signature schemes are compatible.
- Preserve native official Claude/Codex subscription authentication and existing billing routes; broker only explicitly supported API access, never subscription-cookie extraction or billing substitution.

## License and supply-chain gates

- Nango's reviewed root license is ELv2, which restricts hosted/managed offerings exposing substantial functionality. Default to independently authored Nango-style capabilities from public API specifications unless a file's license or written grant permits intended reuse.
- Track code origin, upstream commit, package/file license, notices, allowed use and review evidence. Cleanly separate reference-only research from copied code; a paid account or renamed fork is not redistribution permission.
- Activepieces core MIT does not grant commercial enterprise/cloud code rights. Plate's MIT default has package exceptions; Plate Plus terms restrict product-building end products and separate redistribution. WebContainers requires a commercial license for commercial production.
- Remotion software, paid templates and upstream skill content have separate review requirements; follow the media rule. Do not publish restricted source into ui.theme.tools packages or public Storybook source panels.
