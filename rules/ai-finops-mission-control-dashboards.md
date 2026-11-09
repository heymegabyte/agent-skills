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

# AI FinOps & Unbundled Multi-Account Control Planes (Pass-1 Default Standard)

Whenever building or upgrading any AI usage, API quota, token telemetry, or LLM gateway dashboard (across Paperclip plugins, `@theme.tools/agent-ui`, `@theme.tools/telemetry`, or standalone apps), **never combine distinct provider seats or credentials into a single merged item** (for example, never merge an OpenAI Codex Pro subscription and an Anthropic Claude Max subscription into one row simply because they share an email address). Every seat, OAuth CLI session, monthly grant key, prepaid API key, and local GPU node MUST appear as a **separate first-class operational asset** with attributed email metadata and multi-facet filtering.

## Mandatory Pass-1 Capabilities

1. **Unbundled Per-Seat / Per-Key First-Class Account Inventory**: Show every Claude subscription, Codex subscription, Anthropic API key, DeepSeek key, Antigravity session, Gemini API key, and Local GPU node separately—never hiding individual seat exhaustion behind email aggregation.
2. **Linear/Vercel Click-First Multi-Facet Pill Bar, Sort Selector & Card/Table Toggle**: Filter by `Provider`, `Credential Kind`, `Email`, and `Status`, with independent right-aligned sorting and instant Card vs. Compact Table switching.
3. **Dual-Track `5h Rolling Session` vs. `7d Macro Weekly` Reset-Cliff Gantt Bars**: Visually separate rolling micro-session caps from macro weekly ceilings, marking the soft-rotation threshold (`80%`) and interpolating live second-by-second recovery countdowns.
4. **Seat Pool Rotation Queue & Active Cursor Visualizer**: Display live usage-aware router slot ordering, active cursor position, cooling-down seats, and standby headroom.
5. **4-Stage Alluvial / Sankey Attribution Flow (`Provider → Separate Account → Model Tier → Project`)**: Interactive SVG ribbon diagram with click-to-filter drill-down into the account inventory.
6. **`7×24` Hour-of-Day × Day-of-Week Perceptual SVG Density Heatmap**: 168-cell UTC density grid with metric switching (`Tokens`, `USD Spend`, `Runs`) and off-peak discount window highlighting (`16:30–00:30 UTC`).
7. **Context Window Utilization & Prompt Bloat Histogram**: Bucket requests (`0–10k` through `256k+`), surface `Input:Output Token Density Ratio`, and flag right-shift prompt bloat.
8. **Subscription vs. PAYG Dynamic Break-Even Curve ($Q_{be} = S / R_{payg}$) & Semantic Tiering Sandbox**: Plot exact token break-even thresholds per flat-rate subscription alongside an interactive 3-tier task complexity routing simulator.
9. **Composite Autonomous Router Health Score (`0–100`) & Google-SRE Multi-Window SLO Burn Rate**: Combine TTFT, reliability, stream stability, and headroom with `1h Fast Burn (14.4x)` and `6h Slow Burn (3.0x)` error-budget tracking.
10. **Token-Bucket Burst Capacity & Fluid Recovery Gauges**: Show available burst tokens, refill velocity, RPM saturation, and live recovery countdowns.
11. **OAuth Session & Secret TTL Forensics Slide-Over Drawer + Side-by-Side Comparison Matrix**: Inspect auth source, `checkedAt` freshness, and audit trail per credential, or compare `2`–`4` separate accounts side-by-side.
12. **Live Request Waterfall, Isolated-CTE Unit Economics & FinOps FOCUS 1.1/1.5 Ledger**: Pair recent agent span waterfalls and `Cost-per-Completed-Issue` CTEs with normalized FOCUS (`ConsumedQuantity`, `EffectiveCost`, `CommitmentDiscountSavings`) + OTel GenAI exports.
13. **Event-Driven SSE Live Push (`quotas-live`), `⌘K` Command Palette & `#060610`/`#00E5FF` `0.333s` Cockpit Craft**: Zero blind rapid polling, full keyboard navigation, `PluginErrorBoundary` isolation, and zero `.join(", ")` string concatenation.
