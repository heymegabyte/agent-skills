# Architecture and verification

## Portal surfaces

- `https://mcp.megabyte.space/mcp`: approved humans doing development, research, observability, and bounded media work; browser OAuth plus device posture.
- `https://automation.mcp.megabyte.space/mcp`: scheduled jobs, webhooks, CI, and unattended agents; a unique Cloudflare Access service token per workload, supplied at runtime as `CF-Access-Client-Id` and `CF-Access-Client-Secret`.
- `https://sandbox.mcp.megabyte.space/mcp`: approved humans testing non-production accounts, compatibility, and integrations; browser OAuth plus device posture.
- `https://ops.mcp.megabyte.space/mcp`: narrow human incident diagnosis and privileged operations; Code Mode off and destructive step-up retained at the upstream.
- `https://canary.mcp.megabyte.space/mcp`: portal, upstream, and authorization canaries before promotion.

Profiles are deny-by-default. A server/tool allowlist controls discovery but is not a substitute for upstream authorization.

Canonical install assignments are generated from `registry/client-profiles.json` into `generated/profiles/` in `heymegabyte/mcp.megabyte.space`. A client reconciler owns only remote entries whose names begin with `megabyte-`; it preserves unrelated registrations and the profile's `preserveLocalServers` entries. Never use the human primary endpoint as an automation fallback or reuse one host's service-token references on another host.

## Cloudflare-native availability baseline

Baseline portal operation may depend only on Cloudflare Portal, Access, DNS, Gateway, Workers, and independently hosted remote SaaS MCPs with recorded failure-domain evidence. It must not depend on home Internet, Coolify, Proxmox, private LAN routes, tunnels to those origins, local stdio, CUA Driver, BrowserMCP, filesystem, shell, Docker, or an interactive workstation session. Those tools remain local or in explicitly labeled extended profiles. An outage of an extended origin must not prevent baseline authentication, initialize, `tools/list`, an allowed baseline call, or an unauthorized-call denial.

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
