---
last_reviewed: 2026-10-06
superseded_by: null
name: "cloudflare-hostable-supervisor"
priority: 2
pack: "backend"
triggers:
  - "cloudflare"
paths:
  - "concern:cloudflare-workers"
---

# Cloudflare-Hostable Supervisor

Prefer Cloudflare primitives for product runtime, data, AI edge, browser automation and agent capability fabric. Do not force Cloudflare into heavy engineering-compute jobs better handled by Daytona/Coolify/GitHub runners.

## Doctrine

- Cloudflare-first product runtime: Workers, D1, R2, KV, DO, Queues, Hyperdrive, Vectorize, AI Gateway, AI Search, Browser Run, Workers for Platforms and Cloudflare One.
- Cloudflare Agents SDK for product agents that benefit from durable identity/state/connections. It is a runtime/framework, not Claude Code/Codex.
- Official knowledge/control: `cloudflare/skills` upstream + direct Cloudflare API MCP (`https://mcp.cloudflare.com/mcp`).
- `@cloudflare/computer` for lightweight Cloudflare-hosted agent filesystem/shell/Git work; adapter-isolate because it is preview.
- Heavy compute: Daytona → Coolify MCP runner → GitHub runner on Ubuntu Desktop VM/Proxmox. Cloudflare Sandbox is not the coding-agent default.
- Bindings before REST inside Workers.
- AI Gateway Dynamic Routes own product-runtime model policy.
- AI Search owns durable unstructured knowledge retrieval.
- MCP Server Portal centralizes appropriate remote MCP fleets.
- Browser Run owns Cloudflare-native headless/CDP production verification.
- Tail Workers are the preferred sidecar observability shape for long-running/multi-step Worker execution.
- No Worker Previews; verify the production link.

## Adapter ports

- `StoragePort` — R2 | S3 | local-fs
- `KvPort` — Workers KV | Upstash | in-memory
- `SqlPort` — D1 | Neon via Hyperdrive | local SQLite
- `QueuePort` — CF Queues | Upstash QStash | in-memory
- `AiPort` — AI Gateway/Workers AI | provider | local model
- `VectorPort` — AI Search/Vectorize where appropriate | pgvector | in-memory
- `ComputerPort` — `@cloudflare/computer` | Daytona/Coolify/runner adapter
- `BrowserPort` — Browser Run/CDP | Browserbase/Stagehand | Playwright
