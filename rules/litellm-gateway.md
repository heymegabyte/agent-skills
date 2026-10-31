---
last_reviewed: 2026-10-30
superseded_by: null
name: litellm-gateway
description: Route internal dev/agent/script LLM calls through the self-hosted LiteLLM proxy at https://llm.megabyte.space/v1 (auth via get-secret LITELLM_API_KEY virtual key — never the master key or a raw DeepSeek key). OpenCode defaults here (litellm/deepseek-v4-pro + litellm/deepseek-flash, 4-key rotation + fallback + Langfuse). Production customer-facing apps use Cloudflare AI Gateway instead.
pack: "infra"
triggers:
  - "litellm"
  - "llm.megabyte.space"
  - "llm gateway"
  - "deepseek rotation"
  - "opencode deepseek"
  - "opencode base url"
metadata:
  type: reference
---

# LiteLLM Gateway Routing (internal dev → llm.megabyte.space · prod → CF AI Gateway)

The estate runs a self-hosted **LiteLLM** proxy at **`https://llm.megabyte.space/v1`** (OpenAI-compatible)
that pools + rotates the DeepSeek key fleet and fans out to OpenAI/Anthropic/Voyage. Use it as the ONE
endpoint for internal development + agent LLM calls. Production customer-facing calls use **Cloudflare
AI Gateway**, not LiteLLM directly. Full operating knowledge + the improvement ledger: `reference/litellm-gateway.md`.

Cross-links: `[[agent-provider-policy]]` (the internal-provider SSOT this complements) · `[[cloudflare-native-provisioning]]` (CF AI Gateway BYOK) · `[[secret-hygiene]]` · `[[production-observability-default-on]]`.

## The two rails (pick by surface)

- **Internal dev / agents / scripts / throughput → LiteLLM gateway.** Base URL `https://llm.megabyte.space/v1`, OpenAI-compatible. Auth with the **virtual key** `get-secret LITELLM_API_KEY` — NEVER the master key, NEVER a raw DeepSeek key (the gateway owns the 4-key pool). Models: `deepseek-v4-pro` (reasoning) · `deepseek-flash` (fast + vision) · `deepseek-chat` · `deepseek-reasoner` — all DeepSeek, 4-key-rotated + cross-provider-fallback to `gpt-4o-mini`/`gpt-4o`; plus `gpt-4o`, `gpt-4o-mini`, `claude-3.5-sonnet`, `voyage-*` embeddings. The gateway handles rotation, failover, caching, spend tracking, and Langfuse tracing — callers get all of it for free.
- **Production applications → Cloudflare AI Gateway** (`gateway.ai.cloudflare.com/v1/{account}/{gateway}/…`). Edge cache + per-provider analytics + edge rate-limiting + BYOK key custody, per `[[cloudflare-native-provisioning]]`. Do NOT point a production app at `llm.megabyte.space` — that rail is for internal dev/agent work.

## How to point things at it

- **OpenCode — the estate default throughput rail (WIRED + PROVEN 2026-10-30).** `~/.config/opencode/opencode.jsonc` sets `model: litellm/deepseek-v4-pro` (reasoning) + `small_model: litellm/deepseek-flash` (fast/vision), both pointing at `https://llm.megabyte.space/v1` with `apiKey: {env:LITELLM_API_KEY}` — so every `opencode run` defaults through the rotation gateway (verified live: `llm.provider=litellm` + gateway `POST /v1/chat/completions 200`). Export `LITELLM_API_KEY` from `get-secret` before launching (GUI launches without it fall back to direct `deepseek/*`). HEAVILY default throughput-safe work here and fan out OpenCode swarms (`[[agent-provider-policy]]` § Throughput) — one rotation endpoint survives the per-key 429s that a raw key hits under parallel load.
- **Any other OpenAI-SDK client:** set `baseURL`/`api_base` → `https://llm.megabyte.space/v1`, `apiKey` → `$(get-secret LITELLM_API_KEY)`, model → one of the tiers above.
- **curl / fetch:** `-H "Authorization: Bearer $(get-secret LITELLM_API_KEY)"` → `POST /v1/chat/completions` `{"model":"deepseek-chat",...}`.
- **Admin:** UI at `https://llm.megabyte.space/ui/` (login = `UI_USERNAME`/`UI_PASSWORD`, in the Coolify service env). Mint a per-product virtual key via `/key/generate` (master key) rather than sharing one.

## Guardrails (HARD)

- **Never put the LiteLLM MASTER key in a caller** — it is the admin credential (UI, key-gen, spend). Callers use scoped virtual keys (`LITELLM_API_KEY` or a per-product key). Master key = admin/UI only.
- **Never hardcode a raw DeepSeek key in a dev tool anymore** — route through the gateway so rotation + failover + spend-tracking apply; a bare key bypasses all of it.
- **Internal-provider policy is unchanged** (`[[agent-provider-policy]]`): frontier judgment still = subscription CLIs (`claude`/`codex`); the LiteLLM gateway is the DeepSeek-throughput + multi-model rail (the OpenCode/DeepSeek path now points at the gateway instead of a raw key). Customer-facing product LLM features are the separate, preserved axis → CF AI Gateway.
- **Changes to the gateway** (config.yaml, env, models, budgets) follow the redeploy+verify loop in `reference/litellm-gateway.md` — edit → validate YAML → Coolify redeploy → assert `/health/readiness` 200 + a completion with `LITELLM_API_KEY`; roll back the `.bak` on any unhealthy result.
