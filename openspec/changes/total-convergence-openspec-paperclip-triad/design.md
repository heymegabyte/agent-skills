# Design: Total Multi-Axis Convergence & Parallel Triad OpenSpec → Paperclip Architecture

> **Architect:** claude / antigravity (hydrated frontier context — non-OpenCode spec)

## Architectural Overview

### 1. Three Nested Convergence Loops in Always-Loaded Context
- **Micro Loop (`CREATE → RENDER/EXECUTE → EXPERIENCE → CRITIQUE → MODIFY → COMPARE`)**: Executes on every UI widget, business rule, API endpoint, and sub-feature across all 16 interactive states (`default`, `hover`, `focus-visible`, `active`, `selected`, `disabled`, `loading`, `expanded`, `collapsed`, `dragging`, `drop-target`, `success`, `warning`, `error`, `empty`, `populated`) and 10 critique lenses.
- **Product Loop**: Ensures every feature converges across 8 axes (Beauty, Gorgeousness, Good UI Principles, Functionality & Business Rules, Performance, Security, Observability, AI Execution).
- **Organization Loop**: Parallel end-of-turn triad sync across `agent-skills`, `install.doctor`, `theme.tools`, and Paperclip.

### 2. Frontier Architect OpenSpec Gate & Paperclip Synchronization (`bin/openspec-paperclip-sync.ts`)
- Validates `proposal.md`, `design.md`, and `tasks.md`.
- Parses `**Architect:**` metadata and rejects (`exit 1`) any OpenSpec authored by `opencode` / `deepseek`.
- Maps canonical repositories to Paperclip project UUIDs (`78ac0baa-b2fd-4f0d-9e25-845192da5d50` for `agent-skills`, `d97b0204-ca63-4117-b469-2fe0f2470d18` for `install.doctor`, `298e1246-6c20-4c47-be16-19a1722d4fd2` for `theme.tools`, `d87802d3-48b3-442a-998c-720951c119db` for `legion.megabyte.space`).
- Uses idempotent marker `[openspec:<repo>:<change-id>]` to create or update the Paperclip issue with direct GitHub deep links to `proposal.md`, `design.md`, and `tasks.md`.

### 3. Langfuse Fail-Open Resilience (`bin/lib/langfuse-safe.ts`)
- Uses `AbortSignal.timeout(2500)` on all HTTP ingestion, prompt-fetch, and health-probe requests.
- Trips an in-memory circuit breaker for `60_000ms` after 3 consecutive failures so subsequent calls incur `0ms` latency.
- Spools undelivered traces to `${XDG_CACHE_HOME:-$HOME/.cache}/megabyte/ai/langfuse-spool/traces.jsonl` for background replay via `replaySpool()`.
