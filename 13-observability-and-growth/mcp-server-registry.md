---
name: "MCP Server Registry"
description: "Authority, health, drift, and credential-rotation boundaries for the Megabyte MCP estate."
updated: "2026-11-26"
always-load: false
---

# MCP server registry

The canonical runtime-routing registry is the private `heymegabyte/mcp.megabyte.space` repository:

- `registry/servers.json`: server ownership, transport, route, authentication, risk, and profile eligibility.
- `registry/portals.json`: primary, automation, sandbox, operations, and canary Cloudflare portal surfaces.
- `registry/profiles.json`: deny-by-default authorization classes.
- `registry/client-profiles.json`: host, client, portal, workload, runtime-secret-reference, and local-preservation assignments.
- `generated/profiles/index.json`: deterministic install-manifest index consumed by fleet tooling.

`mcp-servers/_registry.json` in this repository is only an implementation-package inventory. It does not decide runtime routing. There is no canonical `~/.claude/mcp-registry.json`; do not create one or model hosted SaaS integrations as per-session stdio by default.

## Monitoring contract

Monitor each remote portal and upstream from a Cloudflare-native worker with sanitized results in approved telemetry storage. Record initialize, `tools/list`, one allowed read-only call, expected denial, latency, sync state, credential-expiry window, and last successful check. Never store raw tokens, request payloads, tool results containing customer data, or authentication headers.

Alert when:

- primary or automation fails authentication or initialize;
- an upstream changes tools outside its reviewed allowlist;
- a portal/server enters Waiting, Stale, Error, or Sync required;
- a service token or OAuth grant approaches expiry;
- wrong-endpoint or cross-workload credentials stop being denied;
- the Cloudflare-native baseline depends on a workstation, home Internet, Coolify, Proxmox, or a private tunnel.

Use the `mcp-estate-control-plane` skill for routing, migration, verification, and rollback procedures.
