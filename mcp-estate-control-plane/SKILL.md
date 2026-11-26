---
name: mcp-estate-control-plane
description: Route, secure, migrate, or audit Megabyte MCP servers and client configurations through mcp.megabyte.space, Cloudflare MCP Portals, LiteLLM, and local-only boundaries. Use for MCP inventory, remote-first migration, access profiles, duplicated MCP processes, portal deployment, or agent tool-surface design.
---

# MCP Estate Control Plane

Use `heymegabyte/mcp.megabyte.space` as the secret-free source of truth for server ownership, routes, profiles, portals, generated client templates, LiteLLM policy, and Cloudflare infrastructure. Read its current `AGENTS.md`, registry, and active OpenSpec change before material work.

## Routing contract

0. Use the endpoint by caller and risk: `mcp.megabyte.space/mcp` for approved humans, `automation.mcp.megabyte.space/mcp` for unattended workloads with a unique Access service token, `sandbox.mcp.megabyte.space/mcp` for non-production human testing, `ops.mcp.megabyte.space/mcp` for narrow privileged human operations, and `canary.mcp.megabyte.space/mcp` before promotion. Never substitute one endpoint merely because it has a broader tool list.
1. Put shared remote HTTP MCPs behind Cloudflare Access MCP Portal when they benefit from centralized OAuth, device posture, tool curation, context optimization, DLP, or audit.
2. Use LiteLLM for model routing and narrowly scoped application-side MCP execution. Enable `require_key_mcp_access_defined`; give model-only keys no MCP servers.
3. Do not route the same upstream through both planes unless caller identity survives both authorization decisions.
4. Keep CUA, local BrowserMCP, filesystem, shell, and other host-control servers local and lazy.
5. Keep Cloudflare's own Code Mode MCP direct; nested Code Mode is unsupported. Start portal Code Mode opt-in.
6. The Cloudflare-native baseline must initialize, discover tools, execute an allowed read-only call, and deny an unauthorized call when home Internet, Coolify, Proxmox, LAN origins, tunnels to those origins, and workstation sessions are unavailable. Keep those dependencies in explicitly extended/local profiles, never the baseline.

## Identity contract

- WARP is a device-posture/private-routing signal, not an MCP credential. Humans complete Cloudflare Access browser OAuth.
- Use one Access service token per machine workload. Require Service Auth at the portal and every linked upstream; set `on_behalf=false` only for explicitly approved admin-credential execution.
- Protect upstream endpoints independently. Portal policy alone does not prevent direct URL bypass.
- Keep credentials out of generated files and Git; inject machine headers through the approved secret broker.

## Change workflow

- Begin with a sanitized inventory of every actual client registration and running process. Never print secret values.
- Update the canonical registry first, regenerate, and validate deterministic output.
- Migrate one upstream at a time through shadow and canary. Prove initialize, tool discovery, an allowed call, forbidden discovery, a forced forbidden call, expiry/revocation, failure handling, and rollback before removing a local route.
- Operations that may exceed Cloudflare's 60-second upstream timeout use job/status/cancel/result tools.
- Preserve unrelated client entries and make installation atomic with a rollback copy.

Read [references/architecture.md](references/architecture.md) for profiles, plane ownership, limitations, and verification gates when designing or changing infrastructure. Read [references/service-routing.md](references/service-routing.md) when adding or migrating a server.
