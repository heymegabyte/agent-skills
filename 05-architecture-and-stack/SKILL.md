---
name: "architecture-and-stack"
description: "Cloudflare-first platform selection. Workers, D1, R2, KV, DO, Queues, Vectorize, Containers, Workflows, native Go CLIs and measured Rust/WASM acceleration. Default stack, override conditions, auth, data patterns and reliability."
metadata:
  version: "2.1.0"
  updated: "2026-10-27"
  effort: "high"
  model: "opus"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
submodules:
  - ai-technology-integration.md
  - api-design-and-documentation.md
  - auth-and-session-management.md
  - background-jobs-and-workflows.md
  - cf-2026-updates.md
  - cf-auto-provision.md
  - coolify-docker-proxmox.md
  - drizzle-orm-and-migrations.md
  - enterprise-multi-tenancy.md
  - heartbeat-polling.md
  - mcp-and-cloud-integrations.md
  - openapi-generation.md
  - shared-api-pool.md
priority: 2
pack: "backend"
stage: stable
triggers:
  - "architecture"
  - "stack"
  - "cloudflare"
  - "d1"
  - "workers"
paths:
  - "concern:cloudflare-workers"
---

# 05 — Architecture and Stack

Default stack: `_kernel/standards.md#stack`. Override conditions below.

## Language and execution placement

- Keep TypeScript/Hono as the Cloudflare product control plane. Build new CLIs in **native Go** using `rules/terminal-styling.md`; extend existing `aid`, not a new portfolio CLI.
- Use **Rust → WASM** for bounded computation only when representative measurements show a significant end-to-end improvement. Profile with existing tools/scripts; include initialization, JS/WASM copies, memory, bundle size and correctness. Do not promise a speedup from the language alone.
- Keep I/O and Cloudflare bindings in the host adapter. Verify the exact crate/features/imports against the deployed Workers runtime; browser WASM, WASI components and native Rust are not interchangeable deployment targets. Batch calls across the JS/WASM boundary.
- Use native Rust/Go jobs for workloads needing processes, large memory, native libraries or prolonged computation. The control plane remains on Cloudflare; apply the idle-compute policy in `rules/cloudflare-hostable-supervisor.md`.
- Prefer native browser/CSS/Web Animations/View Transitions for presentation. Do not move animations to WASM without measured benefit, or make build execution wait for animation playback.

### Approved integration scope (2026-10-27)

- Pursue mail-authentication diagnostics, routing/matching, structured diffing, bounded XLSX processing, restic/rclone-backed backup/transfer jobs, conditional Markdown acceleration and fast incremental previews where the product needs them. Reuse mature implementations; keep secrets/network access in the appropriate host.
- Exclude from this rollout: a new unified `mb` CLI, standalone doctor/benchmark/deployment-planning CLIs, custom MIME or shared-redaction WASM, a shared Go-hosted WASM engine, DuckDB product querying, SVG-card generation, dedicated analytics kernels and a separate telemetry CLI. These are scope decisions, not a ban on existing upstream capabilities.
- Defer event replay tooling. Reconnecting a live build stream to reconstruct its UI remains part of build correctness and does not authorize operational job replay.
- Resolve product identity and repository ownership from current source; do not assign a product role from a domain name alone. **issuel.ink's purpose remains undecided**; no earlier suggested product role is approved by implication.

Sources: [Workers WebAssembly](https://developers.cloudflare.com/workers/runtime-apis/webassembly/), [workers-rs](https://github.com/cloudflare/workers-rs), [Charm CLI guidance](../rules/terminal-styling.md).

## Cloudflare-first decision tree

**Compute**: Workers (default, every HTTP/cron/queue) · Pages (static-only marketing, rare) · Containers (non-JS runtimes: Playwright headful, ffmpeg, Python ML, build orchestration) · Sandbox SDK (generated/risky code before live promotion)

**State**: D1 (default relational, ≤10GB/db, Sessions API read-replicas, Time Travel 30-day PIT) · KV (eventually-consistent, cache/sessions/feature-flags) · R2 (object storage, lifecycle Standard→IA after 30d) · Durable Objects (coordination + strongly-consistent SQLite storage since Apr 2025, chat rooms/builder sessions/rate-limiting) · Hyperdrive (front external Postgres/MySQL) · Vectorize (semantic search/RAG, 5M dim/index, topK 100, 10 metadata indexes)

**Async**: Queues (best-effort, 5000 msg/sec, R2 event notifications) · Workflows v2 (deterministic, 50K concurrent, 300 creates/sec, 2M queued/workflow, `step.do` + `step.sleep` + `step.waitForEvent`) · Inngest (event-driven, better DX/observability)

**AI**: Workers AI (Llama 4 Scout 17B default — multimodal, free tier; GLM-4.7-flash tool-calling; 3.3 70B legacy) · AI Gateway (caching + rate-limit + fallback + logging for every LLM call) · Vectorize (embeddings + ANN search)

## Override conditions (when CF isn't enough)

| Need | Fallback | Adapter |
|---|---|---|
| Advanced SQL (RLS, OLAP, partial indexes) | Neon Postgres via Hyperdrive | `SqlPort` |
| Redis primitives at scale (sorted sets, streams) | Upstash Redis | `KvPort` |
| Sub-millisecond global state | Upstash QStash | `QueuePort` |
| Specific provider (OpenAI assistants, Anthropic batch) | Direct API via AI Gateway | `AiPort` |
| Vector + SQL co-located | Neon pgvector | `VectorPort` |

Adapters live in `libs/core/ports/`. Product code imports port, never vendor SDK directly. See `rules/cloudflare-hostable-supervisor.md`.

## Auth (default Clerk M2M JWT)

- **Clerk** — M2M JWT (free, networkless verification), passkeys, OAuth, magic links; **Better Auth** when Clerk pricing doesn't fit (rare) (free tier: 50K MRU since 2026-02)
- Hash API keys at rest. Audit log every sensitive action.
- Tenant isolation: every table carries `org_id`, every query filters by it (404 on mismatch, never 403)

## Data patterns

**D1**

```toml
[[d1_databases]]
binding = "DB"
database_name = "myapp"
```

- `wrangler types` against `compatibility_date` + bindings (preferred over hand-maintained Env interface)
- Drizzle v1 RQBv2 + Zod for query + validation; batch via `db.batch([...])` (no transactions in D1)
- Sessions API: `db.withSession(bookmark)` · Time Travel: `wrangler d1 time-travel restore`

**R2**: per-extension content-type on upload · lifecycle Standard→IA after 30d · event notifications → Queues at 5000 msg/sec for thumbnailing/indexing · versioning for asset rollback

**Durable Objects**: one DO per stateful entity · SQLite-backed, 10GB per DO · direct stub `env.MY_DO.getByName(name)` · alarm misfires → idempotent handler

## Reliability

- Workers CPU 10ms free / 50ms paid default (configurable 5min); wall time 30s paid
- `ctx.waitUntil()` for async post-response work; `ctx.passThroughOnException()` for graceful degradation
- WebSocket + JSRPC payload up to 32 MiB

## Cost discipline

- Workers free tier: 100k req/day; Workers Paid: $5/mo (10M req + 30M CPU-ms) + $0.30/M extra req + $0.02/M extra CPU-ms
- D1 free: 5M rows-read + 100K rows-written/day — exceeding either hard-fails every query until 00:00 UTC reset (since 2026-09); 500MB/DB, 5GB account total
- D1 on Workers Paid: 5GB + 25B rows-read + 50M rows-written/mo; then $0.75/GB-mo + $0.001/M rows-read + $1/M rows-written; 10GB/DB hard cap; no egress; read replication included (verified 2026-10-04 against developers.cloudflare.com — Workers/D1/R2 rates all unchanged)
- R2: 10GB free, $0.015/GB-mo, $0/egress · Workers AI Llama 4 Scout FREE · AI Gateway free
- Solo SaaS <$100k/mo MRR stays 10-100× cheaper than AWS-equivalent on CF

## Default config (`wrangler.jsonc`)

```jsonc
{
  "name": "myapp",
  "main": "src/worker/index.ts",
  "compatibility_date": "2026-04-15",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "secrets_required": ["CLERK_SECRET_KEY", "RESEND_API_KEY"],
  "d1_databases": [{ "binding": "DB", "database_name": "myapp" }],
  "kv_namespaces": [{ "binding": "CACHE", "id": "..." }],
  "r2_buckets": [{ "binding": "BUCKET", "bucket_name": "myapp-assets" }],
  "ai": { "binding": "AI" }
}
```

## Decision template (use for every architecture call)

1. Can CF primitive do this? → Use it.
2. Does this need adapter for portability? → Adapter only if real business case.
3. Cost projection at 10× current scale → Still affordable?
4. Failure mode → Graceful degradation defined?
5. Migration path → If we have to leave CF, what does it cost?

## See submodules: cloudflare-primitives.md, data-patterns.md, reliability.md, auth-patterns.md.
