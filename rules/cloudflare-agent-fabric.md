---
last_reviewed: 2026-10-06
superseded_by: null
name: cloudflare-agent-fabric
priority: 1
pack: ai
triggers: ["cloudflare agent","code mode","mcp portal","dynamic route","ai search","browser run","@cloudflare/computer"]
paths: ["concern:ai-features","concern:cloudflare-workers"]
---

# Cloudflare Agent Fabric

Cloudflare is part of the capability fabric underneath agents: current platform knowledge, account control, progressive tool discovery, model routing, retrieval, browser sensing, lightweight compute, secret distribution, and telemetry.

## Cloudflare Agents vs Claude Code / Codex

Cloudflare Agents SDK is a server-side runtime/framework for building durable agents on Workers + Durable Objects. It provides state, identity, SQLite, connections, MCP integration and model/tool loops. It is **not** a drop-in replacement for Claude Code, Codex or OpenCode, which remain the primary coding-agent harnesses for repo editing, testing and shipping.

A Cloudflare Agent can host coding-like behaviors when paired with `@cloudflare/computer`, Browser Run, MCP and AI Search, but it does not replace Claude/Codex intelligence, developer UX or subscription entitlements.

Do not adopt durable fibers or Cloudflare Workflows as defaults under this directive.

## Official Cloudflare skills upstream

Use `cloudflare/skills` as the live upstream Cloudflare knowledge layer. This repository remains the opinionated overlay.

- Claude Code: install Cloudflare's official plugin/marketplace package.
- Codex: install the official Cloudflare skills/plugin.
- OpenCode or any Agent Skills client: `npx skills add https://github.com/cloudflare/skills`.
- When local doctrine conflicts with current Cloudflare mechanics, verify against official Cloudflare skills/docs and repair local doctrine.

## Cloudflare API MCP

Connect `https://mcp.cloudflare.com/mcp` directly.

Preference order:
1. ProjectSites MCP for high-level product operations.
2. First-party Worker binding when already executing on Cloudflare.
3. Cloudflare API MCP for broad account/platform operations.
4. Specialized Cloudflare MCP only when it adds useful domain ergonomics.
5. Wrangler/CLI.
6. Raw REST only when needed.

The API MCP uses Code Mode progressive discovery across 2,500+ operations instead of loading thousands of tool schemas.

## Bindings before APIs

Inside Workers, use first-party bindings before REST for AI, AI Search, Browser Run, D1, R2, KV, DO, Queues, Hyperdrive, Vectorize, Images, Workflows, service bindings, and Secrets Store when available.

## @cloudflare/computer

Use `@cloudflare/computer` for lightweight Cloudflare-hosted agent filesystem, file-editing, Git and shell-like work. Keep it behind a typed adapter because it is preview technology.

It is **not a GUI desktop**.

Heavy/full-Linux execution order:
1. Daytona
2. Coolify MCP-managed runner
3. GitHub runner on the Ubuntu Desktop VM on Proxmox
4. another explicitly configured VM/runner

Cloudflare Sandbox is not the default coding-agent execution environment.

## Code Mode

Code Mode lets the model write a small JavaScript program that discovers and composes tool/API calls rather than selecting one native tool per model round trip.

Use it when:
- tool/API catalogs are large or fast-changing;
- pagination, loops, joins, filtering, branching or parallel calls are needed;
- intermediate results are large and only a distilled result should enter model context;
- tool definitions would consume significant prompt budget.

Prefer direct tools when:
- one or two predictable calls solve the task;
- a result needs model judgment before the next call;
- a risky write benefits from an explicit model-visible boundary.

Pros:
- much smaller tool-schema context;
- fewer model round trips;
- easy loops, joins, filtering and `Promise.all`;
- large intermediate results stay out of model context;
- credentials remain host-side.

Cons / guardrails:
- extra execution/discovery indirection;
- generated orchestration code can be harder to debug;
- Cloudflare Code Mode is experimental;
- avoid nested Code Mode;
- authorization must remain in the underlying tools/host;
- never expose unrestricted credentials/network authority to generated code.

Reference: https://developers.cloudflare.com/agents/tools/codemode/

## MCP Server Portal

Run `node bin/audit-cloudflare-mcp-fleet.mjs` whenever MCP config changes.

Portal candidates:
- remote HTTP/Streamable HTTP MCPs shared by multiple agents/projects;
- private HTTP MCPs reachable through Cloudflare One/Tunnel;
- SaaS MCPs that benefit from Access, OAuth centralization, DLP, logging, server toggles, tool allowlists or Code Mode.

Keep outside:
- local stdio-only tools unless deliberately re-hosted as authenticated HTTP;
- localhost-only development MCPs;
- `mcp.cloudflare.com/mcp` (keep direct to avoid nested Code Mode);
- upstreams that force Code Mode when the portal would also force it.

Use portal Code Mode for large fleets; direct tools for small predictable sets.

## AI Gateway Dynamic Routes

For customer/product API traffic, use named/versioned Dynamic Routes instead of hardcoded model selection.

Canonical route intents on both `megabyte-space` and `projectsites-dev`:
- `dynamic/fast`
- `dynamic/standard`
- `dynamic/premium`
- `dynamic/vision`
- `dynamic/bulk`

Pass routing metadata such as `task_type`, `importance`, `tenant_or_project`, `budget_class`, `capability`.

Routes own provider/model conditions, percentage rollouts, rate/budget limits, timeouts, retries and fallbacks. Log route name/version + routing reason.

Current Dynamic Routes use the OpenAI Chat Completions request shape; do not send Anthropic Messages-format calls directly through them. Internal Claude Code/Codex subscription-CLI orchestration remains outside this paid product API routing.

Reference: https://developers.cloudflare.com/ai-gateway/features/dynamic-routing/

## Browser Run

Browser Run is the Cloudflare-native production sense organ. Prefer CDP for DOM/style/accessibility/network/console/performance inspection.

Canonical verification target = **the real production URL**. Do not create Worker Previews.

Fallback: Browser Run → Browserbase/Stagehand where its auth/session ergonomics help → Playwright/approved real browser session.

## AI Search

Follow `[[ai-search-knowledge-fabric]]`. Durable unstructured knowledge should be retrieved before expensive reasoning when relevant.

## Secrets Store

Programmatically centralize actual Cloudflare project secrets in account Secrets Store. Bind only the minimal subset each Worker needs. IDs, URLs, flags and public values remain normal vars. Never bind Cloudflare account-control/deploy credentials into product Workers.

## Tail Workers

Long-running/multi-step Worker surfaces should emit structured telemetry compatible with Tail Workers:
`project skill agent run_id phase trace_id model_route cost duration_ms result rollback_id`.

Never log secrets, private raw prompts or unnecessary customer payloads.

## Explicitly not adopted

- Worker Previews
- Cloudflare Sandbox as coding-agent default
- durable fibers
- Cloudflare Workflows as agent-skill orchestration default
