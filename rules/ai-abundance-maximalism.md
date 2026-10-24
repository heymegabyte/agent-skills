# AI Abundance — take everything 100 miles further

Cheap, abundant inference is the FLOOR under every build, not a line item to ration. This rule raises the ambition ceiling of `extra-mile`, `predictive-completeness`, `expand-context-always`, and the website-build-doctrine "AI-native spiral" (Phase 4).

## Core premise

- Inference is now cheap + abundant (DeepSeek Flash ~$0.14/M in · Pro ~$0.87/M out · Workers AI `env.AI` near-free tier). Treat the COST side of any AI enhancement as ~0.
- Invert the old "add AI only where essential / ration the calls" instinct. Default to MORE AI, not less.
- Every surface, feature, and interaction gets taken 100 miles further because an AI can power it at trivial marginal cost. The question is no longer "can we afford to?" — it's "why wouldn't we?"

## Operational (what this changes)

- When weighing an AI-powered enhancement, the cost side of the ledger is ~0. Ship it unless it harms UX, latency, or trust.
- Prefer generative / semantic / agentic over static: NL search > keyword filter · semantic rank > plain sort · generated per-item prose > blank/empty fields · chat-as-UI > rigid forms where natural · multimodal in > single text field.
- Backfill every thin or empty surface with grounded AI content (liner notes, analyses, summaries, recommendations, per-item explanations) — never ship a blank field an AI could fill.
- Precompute + cache aggressively (KV / D1 / R2). Cheap inference means you can pre-generate per-track / per-page / per-item AI artifacts at build or first-request and serve them for days.
- Multiply, don't single-shot: ensembles, multiple personas/lenses, self-critique passes, re-rank — all affordable now.
- Re-prompting on a surface that "just works" is a prediction miss: assume the next pass should add an AI dimension the last one left on the table.

## Guardrails (cheap ≠ careless — all PRESERVED)

- Ground every generation to authorized real data. No invented people, facts, quotes, or stats. GROUNDED stays non-negotiable.
- Zod-validate AI outputs at the boundary, then convert to typed domain objects (Contract-First AI).
- Cache to protect latency and the free-tier rate limits; never let an AI call block first paint.
- Gate generation quality with evals where correctness matters.
- Never fake an AI capability in the UI. No selector/toggle that claims a model (or tier) it doesn't actually use — label the real model. An honest "Llama fast / Llama deep" beats a fake "Claude Opus".

## Model routing (internal dev)

- Throughput / bulk / mechanical → DeepSeek via OpenCode (cheapest).
- Frontier judgment / architecture / hard verify → subscription CLIs (`claude`, `codex`).
- Customer-facing PRODUCT AI → the project's platform-billed provider (e.g. Workers AI `env.AI` for bz.rocks) — a separate, preserved axis from internal dev providers.

## Applies to

Every build, audit, and enhancement. When you ask the Phase-4 question "what's possible BECAUSE AI is programming?", assume the answer is affordable and build it.

Cross-links: [[extra-mile]], [[expand-context-always]], [[predictive-completeness]], ai-permanence.
