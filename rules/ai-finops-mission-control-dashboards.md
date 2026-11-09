---
last_reviewed: 2026-11-09
superseded_by: null
name: "ai-finops-mission-control-dashboards"
priority: 2
pack: "core"
triggers:
  - "quotas"
  - "finops"
  - "ai dashboard"
  - "usage observatory"
  - "token usage"
  - "api balance"
  - "llm gateway"
  - "litellm"
  - "langfuse"
paths:
  - "packages/*observatory*/**"
  - "packages/agent-ui/**"
  - "packages/ai-gateway/**"
---

# AI FinOps & Fleet Quota Mission-Control Dashboards (Pass-1 Default Standard)

Whenever building or upgrading any AI usage, API quota, token telemetry, or LLM gateway dashboard (across Paperclip plugins, `@theme.tools/agent-ui`, `@theme.tools/telemetry`, or standalone apps), **never ship a static snapshot table on Pass 1**. Benchmark against Portkey, Helicone, Langfuse, LiteLLM, Cloudflare AI Gateway, Linear, and Raycast by shipping all **15 Mission-Control Capabilities** on Pass 1:

1. **Event-Driven SSE Live Push (`ctx.streams.emit` / `EventSource`)**: Never rely solely on rapid HTTP polling. Push real-time snapshots over SSE with an interactive Pause/Live pill and fallback polling only on disconnect.
2. **`⌘K` / `Ctrl+K` Command Palette & Single-Key Shortcuts**: Fuzzy-searchable action modal plus `1`–`6` tab keys, `/` search focus, `R` manual poll, and `E` executive export.
3. **Multi-Horizon Time-Window Selector (`1h` · `6h` · `24h` · `7d` · `30d`)**: Real SQL bucket re-aggregation including both active (`input_tokens + output_tokens`) and `cached_input_tokens`.
4. **Zero-Dependency Monotone Cubic SVG Crosshair Chart**: Smooth `#00E5FF` &rarr; `#7C3AED` area fill, cached-tokens overlay curve, peak marker, and mouse + keyboard (`ArrowLeft` / `ArrowRight`) crosshair slice inspection with `tabular-nums`.
5. **Predictive EWMA Credit Exhaustion Runway & Interactive "What-If" Simulator**: Per-key days-until-exhaustion plus live sliders for concurrency multiplier (`0.5x`–`5.0x`), KV-cache hit target, and off-peak routing share.
6. **Outcome-Attributed Unit Economics (`Cost/Tokens-per-Completed-Issue`)**: Join `agents`, `projects`, `issues`, and `cost_events` using **isolated SQL CTEs** (`WITH issue_agg AS (...), cost_agg AS (...)`) to prevent Cartesian row multiplication.
7. **Statistical FinOps Anomaly & Stuck-Loop Sentinel**: EWMA Z-score velocity spike detection, abnormal output/input token ratio alerts, and rapid repeated issue-run burst detection (`>= 12` runs / `2h`).
8. **2D Latency vs. Cost Pareto Frontier Scatter Matrix**: Log-scaled `P95 TTFT (ms)` vs `Effective $/1M Tokens` scatter plot highlighting the mathematically non-dominated Pareto frontier alongside `P50/P95/P99 TTFT`, `TPOT`, and `TPS`.
9. **Prompt KV-Cache ROI & Off-Peak Window Diagnostics**: Fleet cache hit ratio $H_{rate}$, Anthropic `5m (1.25x)` vs `1h (2.0x)` TTL break-even read thresholds, and live UTC clock detection for DeepSeek off-peak pricing (`16:30–00:30 UTC`).
10. **Interactive Route Pinning, `2500ms` Live Health Probes & Non-Destructive `429` Failover Simulator**: Let operators test gateway reachability and trace deterministic sub-100ms route promotion across accounts without burning tokens.
11. **Provider Rate-Limit & Concurrency Saturation Meters**: Live RPM, ITPM, OTPM, and active concurrency utilization bars per provider pool.
12. **Configurable Soft/Hard Budget & Headroom Guardrail Thresholds**: Persistent JSON/DB thresholds editable in-app (`Daily Soft Cap $`, `Daily Hard Cap $`, `Min Key Balance $`, `Min Headroom %`, `Z-Score Threshold`).
13. **One-Click Executive FinOps Export Suite**: Copy or download **Markdown Sitrep**, **CSV Account & Agent Ledger**, and **OpenTelemetry GenAI Semantic JSON** (`gen_ai.usage.*`, `gen_ai.client.operation.duration`).
14. **1-Per-Identity Consolidated Cards with Micro-Sparklines & Subscription Cost-Avoidance ROI**: Strictly deduplicate accounts by canonical email/identity on the primary view, with 24h inline SVG sparklines and net API dollars saved by flat-rate subscriptions.
15. **OKLCH `#060610` / `#00E5FF` Cockpit Craft & Zero Crash Surface**: Wrap every root slot and tab in an `ErrorBoundary`, enforce `0.333s cubic-bezier(0.22, 1, 0.36, 1)` transitions, `:focus-within` input shells, `prefers-reduced-motion: reduce`, and render all enumerable string arrays as `.quotas-pill` rounded-full chips (never `.join(", ")`).

## Why Pass-1 Previously Missed These (Training-Signal Root Cause)

Earlier quota widgets treated observability as a **read-only balance table** rather than an **interactive FinOps control plane**, leaving SQL `cached_input_tokens`, `agents`/`issues` outcome joins, SSE bridges (`usePluginStream`), and Pareto/runway forecasting unexploited until a "Top 15" audit was requested. Checking all 15 items above during initial architecture eliminates the gap on Pass 1.
