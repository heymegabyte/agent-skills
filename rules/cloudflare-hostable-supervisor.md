---
last_reviewed: 2026-10-27
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

## On-demand native compute and integrations

- Keep new product orchestration, job state, routing and durable assets on Cloudflare. Start native runners only for a demonstrated workload/runtime need; do not keep a separate always-on compute tier for a hypothetical optimization.
- Configure on-demand heavy runners/containers to scale to zero after **at most 15 minutes idle**. Idle means no active job/lease after real work; health checks must not keep a runner alive. Persist resumable state/results before shutdown; do not interrupt active work to satisfy an idle timer. Verify the chosen host can actually enforce scale-to-zero.
- This product-job policy does not shut down an intentionally enabled local `aid` daemon, the existing persistent internal fleet, Paperclip host, databases or other deliberately persistent services. Fleet authority remains `control-plane/FLEET.md`.
- Add the requested Paperclip interface as a **thin plugin integrating a Cloudflare-native backend**. Paperclip's current trusted, persistent self-hosted UI/plugin runtime remains a separate deployment; do not claim the entire application runs in Workers or treat its plugin process as untrusted-tenant isolation.
- Apply Rust/WASM only under the measured selection rule in `05-architecture-and-stack/SKILL.md`. Preserve the product's configured model/provider policy and the separate internal fleet policy in `[[agent-provider-policy]]`.

## Adapter ports

- `StoragePort` — R2 | S3 | local-fs
- `KvPort` — Workers KV | Upstash | in-memory
- `SqlPort` — D1 | Neon via Hyperdrive | local SQLite
- `QueuePort` — CF Queues | Upstash QStash | in-memory
- `AiPort` — AI Gateway/Workers AI | provider | local model
- `VectorPort` — AI Search/Vectorize where appropriate | pgvector | in-memory
- `ComputerPort` — `@cloudflare/computer` | Daytona/Coolify/runner adapter
- `BrowserPort` — Browser Run/CDP | Browserbase/Stagehand | Playwright
