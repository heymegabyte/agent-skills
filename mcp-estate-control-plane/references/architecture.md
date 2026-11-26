# Architecture and verification

## Portal surfaces

- `mcp.megabyte.space`: human developer, research, observability, and bounded media profiles.
- `automation.mcp.megabyte.space`: workload-specific service identities.
- `sandbox.mcp.megabyte.space`: non-production accounts and data.
- `ops.mcp.megabyte.space`: narrow privileged operations; keep destructive step-up upstream.

Profiles are deny-by-default. A server/tool allowlist controls discovery but is not a substitute for upstream authorization.

## Cloudflare limitations that change decisions

- Portals accept remote Streamable HTTP/SSE upstreams, not stdio.
- Portal clients require browser authentication; WARP identity does not replace that flow.
- Independent MFA, purpose justification, and temporary approval are not enforced for servers authorized through a portal. Keep sensitive step-up at the upstream or use separately audited direct access.
- Admin OAuth can expire without notification. Monitor Error and Sync required states.
- Upstream calls time out after 60 seconds.
- Gateway routing supports Streamable HTTP, not SSE.
- Service tokens are checked at both portal and upstream Access applications.

## LiteLLM boundary

LiteLLM owns model/provider routing, virtual keys, teams, budgets, and application execution. It is not the default public MCP front door. Production keys require explicit server/tool access; model-only keys use `no-mcp-servers`. Never share a fleet-wide LiteLLM key.

## Required evidence

- Registry/schema validation and generated-output drift check.
- Client matrix for every configured harness.
- Positive and negative authorization at both `tools/list` and `tools/call`.
- Expired/revoked OAuth, stale capability sync, rate limit, DLP block, upstream outage, timeout/job polling, and rollback tests.
- One correlation ID across Access, Portal, upstream, LiteLLM when applicable, and observability systems without raw secrets or sensitive payloads.

Primary documentation:

- Cloudflare MCP Portals: https://developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals/
- LiteLLM MCP: https://docs.litellm.ai/docs/mcp/
- LiteLLM MCP access: https://docs.litellm.ai/docs/proxy/access_management/mcp
