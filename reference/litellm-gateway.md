# LiteLLM Gateway — operating reference (llm.megabyte.space)

Full operating knowledge for the estate's self-hosted LiteLLM proxy. The lean rule is
`rules/litellm-gateway.md`; this is the router-invisible deep reference (0 tokens until Read).
Grounded in docs.litellm.ai (2026) + the live deploy. Last applied: 2026-10-29.

## What + where
- **Endpoint:** `https://llm.megabyte.space/v1` (OpenAI-compatible) · UI `https://llm.megabyte.space/ui/`.
- **Host:** Coolify service `l1fxqlugpg7iyt9mnoxogwqz` (image `ghcr.io/berriai/litellm-database:main-stable`), Postgres + Redis attached, `STORE_MODEL_IN_DB=true`. Config = bind-mounted `config.yaml` at `/data/coolify/services/l1fxqlugpg7iyt9mnoxogwqz/litellm-config.yaml` (edit on host → redeploy via Coolify API). SSH `ssh-coolify.megabyte.space`; Coolify API `https://coolify.megabyte.space/api/v1` (token `get-secret COOLIFY_API_TOKEN`).
- **DNS:** `llm.megabyte.space` → CNAME `3acccb20-…cfargotunnel.com` (proxied) → Coolify cloudflared tunnel `*.megabyte.space` ingress → Traefik → container:4000.
- **Secrets (get-secret):** `LITELLM_API_KEY` = the scoped VIRTUAL key callers use · `LITELLM_MASTER_KEY` = admin/UI only (= Coolify `SERVICE_PASSWORD_MASTERKEY`) · `LITELLM_SALT_KEY` = DB encryption (set once, never rotate) · UI login = `UI_USERNAME`/`UI_PASSWORD` (Coolify `SERVICE_USER_UI`/`SERVICE_PASSWORD_UI`).

## Models (model_name the client requests)
- `deepseek-chat`, `deepseek-reasoner` — each a 4-deployment pool (keys `DEEPSEEK_API_KEY`/`_2`/`_3`/`_4`), router `simple-shuffle` rotation + cooldown-on-429.
- `gpt-4o`, `gpt-4o-mini`, `claude-3.5-sonnet`, `claude-3-haiku`, `voyage-law-2`, `voyage-multilingual-2` (embeddings).

## Redeploy / edit loop (idempotent)
1. Edit `config.yaml` on the host (back up `.bak-$(date +%s)` first; validate `python3 -c "import yaml;yaml.safe_load(open('…'))"`).
2. Env changes → Coolify API `POST/PATCH /services/{uuid}/envs` (value via stdin JSON, never argv).
3. `POST /api/v1/deploy?uuid={uuid}` → wait ~90s (prisma + gunicorn) → verify `/health/readiness` 200 + a completion with `LITELLM_API_KEY`.
4. Rollback = restore the `.bak` + redeploy. A proxy-wide `max_budget` or a bad `allowed_routes` can brick all calls — change those carefully.

## Config doctrine (documented-behavior unless marked REC)
- **Router:** `simple-shuffle` is the only production-recommended strategy (latency/usage-v2 carry a perf penalty). Duplicate `model_name` = one load-balanced pool. `enable_pre_call_checks: true` for context-window + region filtering.
- **Reliability:** `litellm_settings.fallbacks: [{"deepseek-chat":["gpt-4o-mini"]}]` degrades a group to a different provider on exhausted retries; `context_window_fallbacks`, `content_policy_fallbacks`, `default_fallbacks` too. `router_settings.retry_policy` tunes retries per error class (zero for Auth/ContentPolicy — don't waste retries). `litellm_settings.request_timeout: 600` (default 6000s is far too long).
- **Virtual keys (SECURITY):** callers MUST use `/key/generate` keys (`sk-…`), never the master key. `curl …/key/generate -H 'Authorization: Bearer <MASTER>' -d '{"models":[…],"max_budget":50,"budget_duration":"30d","rpm_limit":60,"key_alias":"app"}'`. Lock self-serve with `general_settings.default_key_generate_params` + `upperbound_key_generate_params`; whitelist non-admin routes with `allowed_routes` (test — can break the UI/clients). Set `LITELLM_SALT_KEY` before storing any key.
- **Budgets:** per-key `max_budget`/`soft_budget`/`budget_duration` (hard block vs alert). A proxy-wide `litellm_settings.max_budget` is a backstop but blocks ALL calls when hit — set generously or prefer per-key.
- **Observability:** `success_callback`+`failure_callback: ["prometheus","langfuse"]` (`callbacks` fires on both — don't double-list). Langfuse env `LANGFUSE_PUBLIC_KEY/SECRET_KEY/HOST`. `GET /metrics` (auth on). `turn_off_message_logging: True` + `redact_user_api_key_info: true` for sensitive traffic; `LITELLM_LOG=ERROR` in prod.
- **Caching:** `cache: True` + `cache_params{type:redis,ttl,namespace}` (you have it). `redis-semantic` + `similarity_threshold` where prompt-reuse is high (costs an embedding/call). `/cache/ping` smoke test.
- **Rate limits:** per-key `rpm_limit`/`tpm_limit`/`max_parallel_requests`. ⚠ multi-replica is FAIL-OPEN unless `general_settings.fail_closed_rate_limit_enforcement: true` (+ `fail_closed_budget_enforcement`). `return_response_headers: true` → `x-ratelimit-*`.
- **Prod hardening:** `general_settings{store_model_in_db:true, allow_requests_on_db_unavailable:True, database_connection_pool_limit:10, background_health_checks:true, health_check_interval:300}`; env `LITELLM_MODE=PRODUCTION`, `LITELLM_LOG=ERROR`, `DISABLE_SCHEMA_UPDATE=true` on app replicas. Coolify probes `/health/readiness` + `/health/liveliness`.
- **UI/SSO:** master key is the default UI password; `UI_USERNAME`/`UI_PASSWORD` override. Lock with `ui_access_mode: admin_only` + `disable_env_credential_login: true` (SSO-only) or front the host with **Cloudflare Access** (estate `cf-access-iap` skill) — recommended since it's internet-exposed.
- **Guardrails (optional):** top-level `guardrails:` — `hide-secrets` (`default_on`) blocks leaked keys through the public proxy; `presidio` masks PII.

## Cloudflare AI Gateway interop (the production rail)
- **Production apps do NOT call LiteLLM** — they call **Cloudflare AI Gateway** (`gateway.ai.cloudflare.com/v1/{ACCOUNT}/{GATEWAY}/…`) for edge caching, per-provider analytics, an edge rate-limit layer, and resilience (per `cloudflare-native-provisioning` BYOK). DeepSeek on CF is BYO-key (Unified Billing = OpenAI/Anthropic/Google/xAI/Groq only).
- **LiteLLM CAN route THROUGH CF AI Gateway** as an upstream (REC — verify against installed version): set a model's `api_base` to the per-provider gateway path + `extra_headers.cf-aig-authorization: Bearer <CF_AIG_TOKEN>`. Gives LiteLLM's key-rotation/budgets PLUS CF's edge cache/analytics. Flagged pending (ledger).

## Improvement ledger (the "keep looping" backlog — status 2026-10-29)
**Applied + verified:**
- ✅ 4-key DeepSeek rotation pool (simple-shuffle + cooldown) · ✅ scoped VIRTUAL key `LITELLM_API_KEY` (callers off the master key) · ✅ cross-provider fallbacks (deepseek→gpt-4o-mini / gpt-4o) · ✅ `retry_policy` (0 Auth/ContentPolicy retries) · ✅ `request_timeout: 600` · ✅ Langfuse tracing (success+failure) · ✅ `allow_requests_on_db_unavailable` · ✅ `default`/`upperbound_key_generate_params` · ✅ prometheus metrics · ✅ redis cache · ✅ master-key aligned to get-secret · ✅ old `projectsites-litellm` worker + dead DNS removed · ✅ live at llm.megabyte.space (UI + API) + Uptime-Kuma monitored.

**Pending (next loop slices, highest-value first):**
1. **Cloudflare Access wall on `/ui`** (+ keep `/v1` key-gated) — close the public-admin exposure. [S, security]
2. **Confirm `LITELLM_SALT_KEY` is set on the container** (DB key encryption) — audit; set once if missing. [S, security]
3. **`allowed_routes` whitelist** (block `/key/generate` etc. for non-admin keys) — test against UI/clients. [S, security]
4. **Prometheus alerts** on `litellm_deployment_state>0` + failed-request rate (catch the DeepSeek pool cooling) → Grafana on the same host. [M, observability]
5. **Route the DeepSeek pool THROUGH CF AI Gateway** (api_base + `cf-aig-authorization`) for edge cache + 2nd analytics plane. [M, CF interop]
6. **Semantic cache** (`redis-semantic`) for high-reuse dev prompts. [M, caching]
7. **Per-key budgets per product** (mint one virtual key per dev product/app, each budgeted). [S, cost]
8. **Explicit DeepSeek `input/output_cost_per_token`** for accurate spend. [S, cost]
9. **`fail_closed_*` enforcement** IF scaled past 1 Coolify replica. [S, reliability]

## Sources
docs.litellm.ai (routing, proxy/reliability, proxy/virtual_keys, proxy/users, proxy/logging, proxy/prometheus, proxy/caching, proxy/configs, proxy/prod, proxy/ui, proxy/guardrails) · developers.cloudflare.com/ai-gateway · BerriAI/litellm GitHub.

## 2026-10-30 — OpenCode default + gateway tiers (applied) + fleet-harness switch (tracked)

**Applied ✅ (verified live):**
- Gateway now serves the full DeepSeek tier set: `deepseek-v4-pro` (reasoning) + `deepseek-flash` (fast/vision) added ×4-key each alongside `deepseek-chat`/`deepseek-reasoner` → 16 DeepSeek deployments, 23 total. `/model/info` confirms all four load; `deepseek-v4-pro` + `deepseek-flash` return HTTP 200.
- Virtual key `LITELLM_API_KEY` widened to `[deepseek-v4-pro, deepseek-flash, deepseek-chat, deepseek-reasoner, gpt-4o-mini, gpt-4o]`, `max_budget` 200 (was deepseek-chat-only, $10 → v4-pro was 403).
- OpenCode wired to default through the gateway: `~/.config/opencode/opencode.jsonc` `model: litellm/deepseek-v4-pro` + `small_model: litellm/deepseek-flash`; competing `opencode.json` removed. Proven: a plain `opencode run` logged `llm.provider=litellm` (build→v4-pro, title→flash) + the container logged `POST /v1/chat/completions 200`. Direct `deepseek/*` kept as fallback.

**Tracked (next wiring step, needs a prerequisite — NOT done this turn):**
- Switch the FLEET's per-agent OpenCode harness to the gateway: `bin/gen-opencode-harness.mjs` `MODEL_MAP` (opus/fable→`litellm/deepseek-v4-pro`, sonnet/haiku→`litellm/deepseek-flash`) + regen, and have `bin/opencode-deepseek.sh` export `LITELLM_API_KEY`, and update the `bin/opencode-task.sh` circuit-breaker model string.
- **PREREQUISITE before that flip:** `LITELLM_API_KEY` must be provisioned via `get-secret` on EVERY fleet machine/runner first — a per-agent file pinned to `litellm/*` has no auto-fallback to `deepseek/*`, so a machine lacking the key would fail those agents. Provision-then-flip; do not rush it in a contested repo.
