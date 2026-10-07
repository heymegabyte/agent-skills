# RUNNER-AND-CRITICS — persistent fleet and product vision critics

## Runner policy (supersedes the 2026-10-01 cloud/session-cron proposal)

Canonical policy: [control-plane/FLEET.md](../../control-plane/FLEET.md). GitHub schedules each enabled project at `2,17,32,47 * * * *`, using its local caller workflow and an immutable shared workflow revision. The persistent Ubuntu Proxmox VM executes through independent self-hosted runner processes → OpenClaw → the real Claw Router → official Claude/Codex subscription CLIs. Routine compute uses direct OpenCode/DeepSeek. No ephemeral GitHub execution hosts, copied OAuth tokens, local AI Gateway, session harness cron, Cloudflare execution containers or execution-state queue are part of this fleet. GitHub and git/files are authoritative history and memory.

The vision-critic notes below apply to Cloudflare-hosted product features, not local CLI orchestration. Verify current prices/models before product integration.

## § Vision critic ladder

Cost model: ≈1MP screenshot (~0.8–4K image tokens, model-dependent) + ~300-token rubric prompt +
500-token review. **$/1000 critiques** (image-token counts are estimates; prices verified):

- **Gemini 2.5 Flash-Lite** — $0.10/$0.40 per M → **≈$0.31/1000**. Free tier ≈1,000 RPD (sources conflict
  250–1,500; check live AI Studio quota) → 200/day fits FREE. Note: 2.5 Flash (not Lite) deprecates
  2026-10-16 — pin current Flash-Lite alias, plan Gemini-3-family bump.
- **Qwen3-VL 32B (OpenRouter)** — $0.104/$0.416 → **≈$0.37/1000** (8B variant retires 2026-10-09).
- **Workers AI `@cf/meta/llama-3.2-11b-vision-instruct`** — $0.049/$0.676 → **≈$0.44/1000**;
  ~40 neurons/critique → the free **10K neurons/day covers ~250 critiques/day = $0** at our volume.
- **Pixtral 12B (Mistral)** — $0.10–0.15 both ways but image-token-hungry (~4K tok/MP) → **≈$0.72/1000**;
  Pixtral Large $2/$6 → ~$11/1000 (skip).
- **OpenAI gpt-5-mini** — $0.25/$2.00 → **≈$1.35/1000** (gpt-4o-mini lists cheaper but its image-token
  multiplier erases the gap; GPT-5.4-mini $0.75/$4.50 → ~$3.30/1000).
- **Gemini 2.5 Flash** — $0.30/$2.50 → **≈$1.58/1000** (deprecating; use Lite).

### Unified Billing verdict (the "can't we use CF credit for OpenAI?" answer)

**YES.** AI Gateway **Unified Billing** (open beta 2025-11-06, docs now carry no beta label) lets
**OpenAI, Anthropic, Google AI Studio, Google Vertex, xAI, Groq, and Workers AI** requests be paid from a
prepaid **Cloudflare credit wallet** — no provider API keys needed (AI binding or HTTP API both work).
Enable: dash → AI Gateway → *Credits Available* card → **Manage → Top-up credits** (+ set the gateway's
"Workers AI Billing" to Unified to cover `@cf/*` models too). Caveats: it's a **separate prepaid wallet —
existing CF account credits do NOT apply**; **5% fee on credit purchases**; per-token rates are
pass-through (no markup); per-gateway spend limits available; opt-in ZDR supported. So the ENTIRE vision
ladder (Gemini + OpenAI + Workers AI) can run on one CF wallet through our existing gateway on account
`84fa0d1b16ff8086dd958c468ce7fd59`.

### RECOMMENDED LADDER (200 critiques/day ≈ 6,000/mo)

1. **PRIMARY — Gemini 2.5 Flash-Lite** via AI Gateway (Google AI Studio provider): best quality-per-$,
   free tier alone covers the volume; paid worst case **$1.9/mo**.
2. **SECONDARY — Workers AI llama-3.2-11b-vision** via the same gateway: CF-native, $0 inside the daily
   10K-neuron allocation; availability fallback + cheap second opinion when primary and gate disagree.
3. **ARBITER/FALLBACK — OpenAI gpt-5-mini via Unified Billing** (CF credits): escalation for
   disagreements + the ≥8/10 ship-gate call; at ~10% escalation ≈ **$0.80/mo**.
- **Estimated total: <$5/month** (typical ~$1–3; all three rails billable through the one CF wallet,
  with a per-gateway spend limit set at $10/mo as the governor). This replaces the fragile
  OpenAI-429/Anthropic-$0 ladder noted in the Deep UI Explorer memory.

---

## § Sources (accessed 2026-10-01)

- Claude Code GitHub Actions (OAuth token, setup-token, cron): https://code.claude.com/docs/en/github-actions
- claude-code-action OAuth expiry issue #727: https://github.com/anthropics/claude-code-action/issues/727
- Max-subscription-in-Actions announcement recap: https://wain.blog/en/claude-code-github-actions-max-support-8NB583zS/
- Scheduled-pattern writeups: https://dispatchseo.com/blog/claude-code-github-actions · https://dev.to/nick_t_eac6be7ee8e88de2f3/i-handed-a-tiny-business-to-claude-code-agents-on-a-cron-schedule-heres-the-architecture-2615
- GH Actions limits/pricing (6h job, 5-min cron floor, 60-day disable, Jan-2026 rate cut, self-hosted free):
  https://cicdcalculator.com/github-actions · https://sengi.run/blog/github-actions-pricing · https://cronjobpro.com/blog/github-actions-scheduled-workflows
- Claude Max weekly caps (240–480 Sonnet h / 24–40 Opus h): https://claudelimit.com/claude-max-limits/ · https://portkey.ai/blog/claude-code-limits/
- Sonnet 4.6 pricing ($3/$15, cache 0.1×/1.25×): Anthropic claude-api skill model table + https://platform.claude.com/docs/en/pricing.md
- Cloudflare Containers pricing + instance types: https://developers.cloudflare.com/containers/pricing/ · https://sliplane.io/blog/cloudflare-released-containers-everything-you-need-to-know
- Workers Cron Triggers limits (1-min floor, 15-min wall): https://runhooks.app/blog/cloudflare-workers-cron-triggers-limits/ · https://developers.cloudflare.com/workers/platform/limits/
- Ralph technique + official plugin: https://github.com/ghuntley/how-to-ralph-wiggum · https://github.com/anthropics/claude-code/blob/main/plugins/ralph-wiggum/README.md
- OpenHands resolver budget vars: https://github.com/OpenHands/OpenHands/blob/main/openhands/resolver/examples/openhands-resolver.yml · https://github.com/All-Hands-AI/OpenHands/issues/5263
- SWE-agent cost limits: https://swe-agent.com/latest/reference/model_config/
- Aider headless CI (+verify-loop gap): https://github.com/Aider-AI/aider/issues/4923
- AI Gateway Unified Billing (providers, 5% fee, top-up, Workers AI setting): https://developers.cloudflare.com/ai-gateway/features/unified-billing/ · https://developers.cloudflare.com/ai-gateway/changelog/
- Gemini pricing + free tier: https://www.cloudzero.com/blog/gemini-pricing/ · https://aipromptshub.co/blog/gemini-api-free-tier-rate-limits · https://tokenmix.ai/blog/gemini-api-free-tier-limits
- Workers AI pricing + free neurons + llama-3.2-11b-vision rates: https://developers.cloudflare.com/workers-ai/platform/pricing/ · https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/
- OpenAI pricing (gpt-5-mini $0.25/$2, gpt-5.4-mini $0.75/$4.50): https://www.morphllm.com/openai-api-pricing · https://pricepertoken.com/pricing-page/model/openai-gpt-5.4-mini
- Mistral Pixtral pricing: https://www.cloudzero.com/blog/mistral-api-pricing/ · https://pricepertoken.com/pricing-page/model/mistral-ai-pixtral-12b
- Qwen3-VL OpenRouter pricing: https://openrouter.ai/qwen/qwen3-vl-32b-instruct · https://openrouter.ai/qwen/qwen3-vl-235b-a22b-instruct
