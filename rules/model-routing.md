---
last_reviewed: 2026-10-04
superseded_by: null
name: "model-routing"
priority: 2
pack: "ai"
triggers:
  - "opus"
  - "sonnet"
  - "haiku"
  - "claude model"
paths:
  - ".claude/agents/**"
  - ".claude/settings.json"
  - "**/opus-quota*"
---

# Model Routing

Select the correct model tier by task complexity and cost — Claude tiers plus approved alternates; never use a deep-reasoning model for tasks a fast one can handle.

## Fable 5 (`claude-fable-5`) — frontier (newest, runtime-confirmed)

- Newest Claude tier per the runtime env; sits above Opus 4.8 for the hardest reasoning Opus can't close.
- Context / pricing / effort params NOT pinned here — verify at `docs.anthropic.com/en/docs/about-claude/models/overview` before routing production or batch work to it (cost unknown).
- Default routing stays Opus 4.8 / Sonnet 4.6 / Haiku 4.5. Web claims that "Opus 5 / Sonnet 5" supersede the 4.x line are UNVERIFIED against the runtime (which reports Opus 4.8 + Fable 5 as current) — do NOT swap the 4.x IDs on that basis; a wrong model ID breaks every spawn.

## Opus 4.8 (`claude-opus-4-8`) — flagship

- **Use for** — same surfaces as Opus 4.7; zero-cost upgrade (same $5/$25 per MTok pricing).
- 1M context, 128K output. Adaptive thinking only.
- Source: Anthropic. (2026). *Models overview*. `docs.anthropic.com/en/docs/about-claude/models/overview`
- Migration: `rg "claude-opus-4-7" ~/.claude ~/.agentskills` → s/4-7/4-8/. Keep 4.7/4.6 as fallback chain per `opus-quota-fallback`.

## Opus 4.7 (`claude-opus-4-7`) — fallback

- **Use for** — architecture decisions, complex multi-file refactors, security review, planning, competitive analysis, visual QA, completeness verification, agentic orchestration.
- 1M context, 128K output.
- **Adaptive thinking is the ONLY mode** — manual `thinking.type:"enabled"` with `budget_tokens` returns 400.
- `thinking.display:"omitted"` is default — set `"summarized"` to surface reasoning.
- `xhigh` effort recommended (Opus-4.7-only; falls back to `high` elsewhere).
- New tokenizer produces ~35% more tokens per input vs 4.6 — factor into cost.

## Opus 4.6 (`claude-opus-4-6`)

- Stable fallback if 4.7 unavailable.
- 1M context, 128K output.
- `thinking.type:"enabled"` deprecated but still works; prefer `adaptive`.

## Sonnet 4.6 (`claude-sonnet-4-6`)

- **Use for** — standard implementation, feature building, debugging, testing, code simplification, deployment.
- 1M context, 64K output.
- `interleaved-thinking-2025-05-14` header still needed for manual interleaved mode.

## Haiku 4.5 (`claude-haiku-4-5`)

- **Use for** — formatting, linting review, changelog generation, content writing, simple code review, hook evaluation, cost estimation.
- 200K context, 64K output.
- Prefer evergreen alias `claude-haiku-4-5` over the dated `…-20251001` snapshot.

## Provider portability (Anthropic ↔ DeepSeek)

Config must reference model **tier aliases** (`opus` / `sonnet` / `haiku`), NEVER full provider-specific IDs (`claude-opus-4-8[1m]`, `deepseek-v4-flash`). Claude Code hardcodes the three aliases and resolves them per-provider:

- **Anthropic** — aliases map to the current Claude tier (`opus`→Opus 4.8, `sonnet`→Sonnet 4.6, `haiku`→Haiku 4.5).
- **DeepSeek** (`ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic`) — `ANTHROPIC_DEFAULT_{OPUS,SONNET,HAIKU}_MODEL` + `CLAUDE_CODE_SUBAGENT_MODEL` remap the aliases to DeepSeek IDs; the endpoint also prefix-maps `claude-opus*`→`deepseek-v4-pro`, `claude-{sonnet,haiku}*`→`deepseek-flash`.

Rules (enforce in agent frontmatter + settings):

- Agent **and slash-command** frontmatter `model:` / `fallback_model:` use **aliases only**. A full ID (`claude-opus-4-8[1m]`) is provider-locked — invalid on native Anthropic (the `[1m]` suffix) and a wrong ID 404s → breaks the spawn. (Eval/judge model pins that call a model client directly may use the evergreen `claude-haiku-4-5` form — portable via DeepSeek's `claude-*` prefix-map — never a dated `-20251001` snapshot.)
- Never hardcode a provider's model IDs in `settings.json` (the base, provider-agnostic layer — set `"model": "opus"`). Put provider specifics in `settings.local.json` (the DeepSeek override) or the shell env, so switching providers = swapping only that layer.
- Secrets via `apiKeyHelper` (→ `get-secret DEEPSEEK_API_KEY`), never a hardcoded `ANTHROPIC_AUTH_TOKEN`/`ANTHROPIC_API_KEY` on disk. **Gotcha:** `apiKeyHelper` has LOWER precedence than those two env vars — a hardcoded token silently disables the helper (it "isn't used"), so REMOVE the token for the helper to take effect. `apiKeyHelper` DOES work with a custom `ANTHROPIC_BASE_URL` (its output is sent as `Authorization: Bearer`, which is what DeepSeek's endpoint expects).
- Current DeepSeek IDs (per DeepSeek's official Claude Code docs, Sep 2026): `deepseek-flash` / `deepseek-flash[1m]`. `deepseek-v4-flash` is undocumented ON THIS RAIL — prefer `deepseek-flash`. (The OpenCode/Zen rail below uses a DIFFERENT namespace where `deepseek-v4-*` IS canonical — never copy IDs across rails.)

## OpenCode harness — Zen unified billing (DeepSeek + MiniMax rails)

OpenCode's **Zen** gateway is the unified pay-per-use billing rail (one account key via `/connect` → `opencode.ai/auth`; auto-reload $20 when balance <$5); **Go** is its flat-rate subscription twin — same key, same model IDs. Verified 2026-10-04 against `dev.opencode.ai/docs/zen`. Catalog + prices churn weekly — treat the figures below as last-verified, not pinned; re-check at integration.

- **Config**: `opencode.json` references models as `opencode/<model-id>` — never raw provider endpoints while on unified billing. Secrets stay in `get-secret` (`OPENCODE_API_KEY`), never inline.
- **Tier mapping** (the Reasoning / Balanced / Fast tiers → Zen IDs):
  - **Reasoning (opus-tier)** → `opencode/deepseek-v4-pro` (MoE, GA 2026-08-13, 1M ctx, reasoning-effort high/xhigh) — Zen dashboard still lists $1.74/$3.48 per MTok but the direct DeepSeek API + `opencode-go` config now show **$0.435/$0.87** (dropped); VERIFY at use. Architecture, security review, hard debugging.
  - **Balanced (sonnet-tier)** → `opencode/minimax-m2.7` or `opencode/minimax-m3` ($0.30/$1.20) — this IS the "MiniMax OpenCode" rail; `opencode/deepseek-v4.1-flash` ($0.30/$1.20) is the DeepSeek-flavored equivalent. Implementation, tests, migration.
  - **Fast (haiku-tier)** → `opencode/deepseek-v4-flash` — $0.14/$0.28 (a `deepseek-v4-flash-free` variant exists; `-vision-exp` adds image input at the same price). Changelogs, renames, formatting, transcription.
- **Deprecations**: `minimax-m2.5` deprecated 2026-08-05 and `minimax-m2.1` 2026-03-15 — route MiniMax work to `m2.7`/`m3` only.
- **Rail discipline**: three distinct ID namespaces now exist — Anthropic (`opus`/`sonnet`/`haiku` aliases), DeepSeek-direct for Claude Code (`deepseek-flash`), and OpenCode/Zen (`opencode/deepseek-v4-*`, `opencode/minimax-*`). Config carries TIER ALIASES; only the per-harness adapter layer resolves to a rail's IDs (per `[[agent-neutrality]]`).

## Retired models (requests error)

- `claude-3-opus`
- `claude-3-haiku`
- `claude-sonnet-3-7`
- `claude-haiku-3-5`
- **Retired Apr 19 2026** — `claude-haiku-3`
- **Retired Jun 15 2026** — `claude-sonnet-4` (alias `claude-sonnet-4-0` → `…-20250514`), `claude-opus-4` (alias `claude-opus-4-0` → `…-20250514`)

## Never

- **Opus** — single-file edits, formatting, commit messages, simple bug fixes
- **Haiku** — architecture, security, complex logic, multi-file refactors

## Agent routing

- **Opus** — architect, completeness-checker, computer-use-operator, incident-responder, meta-orchestrator, performance-profiler, security-reviewer, visual-qa (each has `model_fallback: claude-sonnet-4-6` + `effort_fallback: high` per `opus-quota-fallback`)
- **Burst capacity until 2026-11-04**: claimed Claude cloud-session credits run OUTSIDE plan limits — route round-sweeps / fan-outs / unattended batches to `claude --cloud` first, per `account-entitlements`.
- **Sonnet** — accessibility-auditor, browser-operator, content-writer, deploy-verifier, media-orchestrator, migration-agent, motion-choreographer, resource-broker, seo-auditor, test-writer
- **Haiku** — changelog-drafter, changelog-generator, code-simplifier, cost-estimator, dead-code-remover, dependency-auditor, formatter, model-router, renamer, transcriber

## Quota-aware routing

- `/model claude-sonnet-4-6` session → Opus-pinned agents spawn as Sonnet via `model_fallback`.
- `~/.claude/.opus-disabled` flag OR `CLAUDE_OPUS_DISABLED=true` → same fallback.
- Opus API 429 on `rate_limit`/`quota_exceeded` → Monitor sets in-memory `OPUS_AVAILABLE=false` for 5 min.
- Fast Mode (`/fast`) auto-disables when `OPUS_AVAILABLE=false`.
- Sonnet fallback is ~5-10% quality drop — acceptable; never blocks work.
- Defer `supreme-polish` / `source-site-enhancement` § 9-agent fan-out / payment+auth security reviews until Opus restores.

## Effort parameter

- **`xhigh`** — architecture / security / planning on Opus 4.8 / 4.7
- **`max`** — same on 4.6
- **`high`** — implementation / testing
- **`medium`** — content writing
- **`low`** — formatting / changelog

## Batch API

- 50% discount.
- Extended-output via header `output-300k-2026-03-24` unlocks 300k output for Opus 4.8/4.7/4.6 + Sonnet 4.6.
- Pre-warm cache with `max_tokens:0` (not in batch / streaming / extended-thinking paths).

## Cloudflare Workers AI (`env.AI.run`)

- **Always reach for the FP8 variants** — full-precision aliases are deprecated on most accounts and return 400 at runtime.
- **Llama 3.3 70B (legacy)** → `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (free; superseded by Llama 4 Scout as production default)
- **Llama 3.1 8B** → `@cf/meta/llama-3.1-8b-instruct-fp8`
- **Llama 4 Scout 17B (production default)** → `@cf/meta/llama-4-scout-17b-16e-instruct` ($0.27/$0.85 per MTok, multimodal, on free tier)
- **Never use** — `@cf/meta/llama-3.3-70b-instruct`, `@cf/meta/llama-3.1-8b-instruct`, `@cf/meta/llama-3.1-70b-instruct` (retired)
- Verify availability via REST: `GET /accounts/{id}/ai/models/search?search=<term>` before shipping a model name in code.
- Reference incident (2026-05-24, projectsites.dev): AI chat returned "service is unavailable" 100% — 18 files referenced retired aliases; patched to `…-fp8-fast` + `…-fp8` in one sed pass.

## Provider cost tiers (premium / mid-grade / instant)

Standing routing policy for APPLICATION LLM calls + agent build pipelines — a DIFFERENT axis from the Claude-altitude orchestration tiers (which picks which *Claude* model runs a loop phase; this picks which *vendor* serves an app/build call). Brian's directive 2026-06-17.

- **Premium — Anthropic (Claude) / OpenAI (ChatGPT).** Higher-order research, architecture + planning, security/payment/auth decisions, and ALL vision (DeepSeek has none). Reserve for judgment, not volume.
- **Mid-grade — DeepSeek** (`deepseek-chat`; `deepseek-reasoner` for higher-order). The DEFAULT for most generation/implementation/build work, AND the primary provider for headless **Claude Code build agents** via DeepSeek's Anthropic-compatible endpoint: `ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic` + `ANTHROPIC_AUTH_TOKEN=$DEEPSEEK_API_KEY` + `ANTHROPIC_MODEL=deepseek-chat` (keep `ANTHROPIC_API_KEY` as passive fallback; `BUILD_LLM_PROVIDER=anthropic` forces Claude). API base `https://api.deepseek.com`; key `DEEPSEEK_API_KEY` is ALWAYS a `wrangler secret` / get-secret entry — never committed.
- **Instant — Cloudflare Workers AI** (`env.AI.run` `@cf/meta/llama-*`, free, edge). Pre-routing, classification, moderation, embeddings — sub-ms latency default for reflex-speed work.
- **End state:** collapse everything toward Workers AI as it catches up. Until then — premium for judgment, DeepSeek for volume, Workers AI for reflexes.
- Reference impl: projectsites.dev `external_llm.chooseProviderForTier(env, 'premium'|'standard'|'instant')` + `ai_gateway` deepseek slug + container `_deepseekKey`/`_anthropicBaseUrl` injection. Cloudflare AI Gateway supports a `deepseek` provider slug — route through it for caching/observability. **Unified Billing** (open beta 2025-11, extended to Workers AI 2026-08): one prepaid credits wallet across OpenAI/Anthropic/Workers-AI/20+ providers, 5% fee, opt-in ZDR, elevated Workers-AI rate limits — an alternative to per-provider keys; weigh against direct keys per `account-entitlements` spend order.

## Hierarchical orchestration

1. **Orchestrator** — Opus, `xhigh`
2. **Specialists** — Sonnet, `high`
3. **Grunts** — Haiku, `low`

Hierarchical compounds gains over flat fanout. Sub-agent prompts 100–300 words — beyond that you're cloning context, not specializing.

Spawned specialists for batch test/feature work run on the standing `CLAUDE_CODE_SUBAGENT_MODEL=claude-sonnet-4-6` default per `parallel-subagent-economy` — Opus orchestrates, Sonnet builds. Opus-pinned reviewers (architect/security/visual-qa/meta-orchestrator) override that default with an explicit `model: opus` on the spawn; the call-level model param takes precedence over the env default.
