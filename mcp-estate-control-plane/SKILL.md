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
7. Select an install manifest from `heymegabyte/mcp.megabyte.space/generated/profiles/index.json`; do not invent a universal profile. `macos-human` and `ubuntu-human` are interactive OAuth profiles. `macos-automation` and `ubuntu-automation` use different Infisical projects and different Access service tokens. `canary-human`, `sandbox-human`, and `ops-human` are explicit-only.
8. Treat inventory as evidence, not authorization. A discovered public GitHub MCP endpoint or repository receives zero portal, profile, server, and tool grants until the canonical registry records a reviewed grant and live authorization evidence.
9. Brandfetch remains canary-only: per-human OAuth/DCR, default-disabled, with only `brand_search`, `get_brand_data`, `get_brand_context`, and `build_logo_urls` enabled. Do not promote it or enable newly synchronized tools implicitly.

## Identity contract

- WARP is a device-posture/private-routing signal, not an MCP credential. Humans complete Cloudflare Access browser OAuth.
- Use one Access service token per machine workload. Require Service Auth at the portal and every linked upstream; set `on_behalf=false` only for explicitly approved admin-credential execution.
- Service-token headers must be resolved at process launch from the exact runtime references in the selected generated profile. Missing, empty, expired, cross-host, or shared-fleet references fail closed.
- Protect upstream endpoints independently. Portal policy alone does not prevent direct URL bypass.
- Keep credentials out of generated files and Git; inject machine headers through the approved secret broker.

## Change workflow

- Begin with a sanitized inventory of every actual client registration and running process. Never print secret values.
- Update the canonical registry first, regenerate, and validate deterministic output.
- Install only the exact host/client manifest selected by the canonical index, pinned to its recorded source digest or revision. Consumers merge that manifest; they do not copy endpoint tables or reconstruct grants.
- Migrate one upstream at a time through shadow and canary. Prove initialize, tool discovery, an allowed call, forbidden discovery, a forced forbidden call, expiry/revocation, failure handling, and rollback before removing a local route.
- Retire no local or predecessor route until every named live consumer has used the replacement successfully and rollback evidence is retained. Repository declarations, generated manifests, and a single canary client are not consumer proof.
- Operations that may exceed Cloudflare's 60-second upstream timeout use job/status/cancel/result tools.
- Preserve unrelated client entries and make installation atomic with a rollback copy.

Read [references/architecture.md](references/architecture.md) for profiles, plane ownership, limitations, and verification gates when designing or changing infrastructure. Read [references/service-routing.md](references/service-routing.md) when adding or migrating a server.

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Whole-change dispatch**. Apply `rules/openspec-change-ownership.md` and `rules/agent-provider-policy.md`. Assign each OpenSpec change one owner through verification. Route suitable bounded changes to OpenCode with DeepSeek through LiteLLM.
- **Architecture and verification**: Route material decisions through `rules/evidence-gated-autonomous-orchestration.md`. Its conference and risk gates govern provider selection and independence.
- **Reuse review**: Review reuse during implementation under `control-plane/RUNTIME.md`. Capture cited proposals for application code in `theme.tools`, host configuration in `install.doctor`, and agent guidance in `agent-skills`. Submit authorized findings to same-run OpenSpec admission.
- **DeepSeek-first parallel dispatch** At intake and after each dependency clears, dispatch independent OpenSpec changes concurrently whenever doing so reduces time to verified delivery. Delegate suitable whole OpenSpec changes to OpenCode with DeepSeek through LiteLLM when it meets the acceptance bar and improves throughput. Use Codex, Gemini, or Claude for work that benefits materially from premium capability or independent review, and record concrete reasons for premium routing or limited dispatch. Scale worker count to ready work, isolation, and approved capacity.
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.
