# RUNNER-AND-CRITICS — cloud loop runner + cheap vision critics (fire-59 research, 2026-10-01)

> Answers Brian's two questions: (1) cloud-hosted `/run-the-loop` runner off the Mac,
> (2) cheaper independent vision critics + whether CF Unified Billing credit can pay OpenAI.
> All claims web-verified 2026-10-01; sources at bottom. Companion BACKLOG items live in
> `./BACKLOG.md` § FRONTIER 0 (`discovered_by: fire-59-research`).

---

## § Runner options

### The economics gate first (why auth choice decides everything)

- Loop load: **1.8–3M subagent tokens/fire × 72 fires/day (20-min cadence) = 130–216M tokens/day**.
- Sonnet 4.6 API pricing: **$3/M input · $15/M output · $0.30/M cache-read · $3.75/M 5-min cache-write**.
- Blended $/M at realistic agentic mixes (≈90% input-side):
  - No caching (90/10 in/out): ~$4.20/M → **$545–907/day ≈ $16K–27K/mo**
  - Good caching (70% cache-read / 20% fresh+write / 10% out): ~$2.46/M → **$319–531/day ≈ $9.6K–16K/mo**
  - Heroic caching (85% cache-read): ~$1.94/M → **$252–419/day ≈ $7.6K–12.6K/mo**
- vs Max 20× subscription: **$200/mo flat**. API-key billing is **38–135× the subscription cost**.
- **VERDICT: API-billed 20-min heavy fires are NOT sane.** Subscription OAuth (`CLAUDE_CODE_OAUTH_TOKEN`)
  is the only economical rail. It draws the SAME Max 20× pool the Mac loop uses today
  (5-h rolling window + weekly caps ≈ 240–480 Sonnet h/wk + 24–40 Opus h/wk) — the cloud move is
  **quota-neutral**: it replaces the laptop's consumption, doesn't add to it.

### Option A — GitHub Actions + anthropics/claude-code-action (RECOMMENDED SLICE 1, effort S)

- **Subscription auth is officially supported**: run `claude setup-token` locally (long-lived token;
  Pro/Max/Team/Enterprise) → repo secret `CLAUDE_CODE_OAUTH_TOKEN` → pass `claude_code_oauth_token:`
  to `anthropics/claude-code-action@v1`. Docs explicitly bless swapping `anthropic_api_key` for it.
  (Older raw-OAuth tokens expired in ~1 day — issue #727; `setup-token` is the fix.)
- **Cron**: `on: schedule` min interval 5 min (`*/20` fine). Caveats: UTC-only; runs ONLY from the
  default branch (we're main-only — fine); delays of 15–60 min under GH load (cadence jitter);
  public-repo schedules auto-disable after 60 days of repo inactivity (our daily commits make this moot).
- **Limits**: 6 h max per hosted job (ours: `timeout-minutes: 25`); workflow run max 35 days.
- **Lease for free**: `concurrency: { group: run-the-loop, cancel-in-progress: false }` queues/coalesces
  overlapping fires — GH-native replacement for the fire-lease mutex in CI.
- **Arbitrary updates**: prompt step = read `.claude/commands/run-the-loop.md` + constitution from the
  checkout — the loop definition already lives in-repo, so every fire self-updates. Zero harness state.
- **Minutes cost**: 72 × ≤20 min ≈ ≤43.2K min/mo. Public repo: $0. Private repo: ~(43,200−3,000 included)
  × ~$0.006/min (post Jan-2026 rate cut) ≈ **~$240/mo** — mitigate with a self-hosted runner
  (GH never bills self-hosted; the planned $0.002/min self-hosted charge was cancelled Dec 2025) or
  shorter average fires (billing is actual minutes, rounded up per job).

### Option B — Cloudflare-native: Cron Trigger → Container running headless Claude Code (SLICE 2, effort M)

- **Feasible**: Workers Cron Triggers (1-min granularity, 250/account on Paid) → `scheduled()` handler
  starts a Container via its DO binding. The 15-min scheduled-Worker wall cap applies to the TRIGGER
  worker only; the container runs under its own lifecycle (billed while awake, sleeps after the fire).
  Image: node + `@anthropic-ai/claude-code` + git; runs `claude -p "$(cat .claude/commands/run-the-loop.md)"`.
- **Auth needed**: `CLAUDE_CODE_OAUTH_TOKEN` (same setup-token), GitHub deploy key/PAT (clone + push main),
  `CLOUDFLARE_API_KEY`+email (deploys), existing loop secrets via get-secret export. Logs → R2.
- **Compute cost**: standard-1/2 instance (4–6 GiB), ~24 active h/day:
  memory ~$0.9–1.3/day + vCPU ~$0.4–0.9/day + disk ~$0.05–0.07/day ≈ **$1.4–2.2/day ≈ $40–70/mo**
  (+$5 Workers Paid). Cheaper than private-repo GH minutes; fully CF-native; no 60-day disable; exact cadence.
- **Model tokens**: same OAuth subscription rail as Option A — the container is just where the CLI runs.
- Why slice 2 not 1: Dockerfile + DO container class + secret plumbing + log shipping ≈ a day of work vs
  one workflow file; Option A proves laptop-independence TODAY, B is the lock-in-leveraged end-state.

### Option C — API-key billing anywhere — REJECTED by the cost math above ($9.6K–27K/mo vs $200/mo).

### RECOMMENDATION

1. **Build Option A first (effort S, ~90 min)**: one workflow (`.github/workflows/run-the-loop.yml`) +
   `claude setup-token` secret + concurrency lease + `--max-turns`/timeout governors + artifact upload of
   the fire transcript. Honors Max economics, 20-min cadence, in-repo loop definition, laptop independence.
2. **Then Option B (effort M)** as the CF-native runner, reusing the identical in-repo prompt; keep the
   Mac harness cron as dormant fallback. Quota governor in both: on Anthropic limit/429 responses the fire
   no-ops cleanly and the next cron retries (same behavior the Mac loop has when the window exhausts).

---

## § FOSS lessons (prior art → transferable)

1. **Ralph (ghuntley / anthropics `ralph-wiggum` plugin)** — the repo IS the memory: prompt file + plan +
   git history carry ALL state between iterations. Our loop already does this (command + constitution +
   BACKLOG/LEDGER in-repo) — keep ZERO state in the harness so any runner host is swappable.
2. **Ralph plugin stop-hook** — gate exit on an explicit completion promise + max-iterations cap; never
   open-ended. Wire `--max-turns` + `timeout-minutes` into every cloud fire.
3. **OpenHands resolver (GitHub-Action-native agent)** — budget caps as REPO VARIABLES
   (`max_iterations: ${{ vars.OPENHANDS_MAX_ITER || 50 }}`), retries cap, accumulated-cost cutoff —
   "don't ship a headless agent without all three". Expose our caps as repo vars → tune without commits.
4. **OpenHands failure mode** — a hard iteration ceiling the model never SEES ends fires as ERROR instead
   of wrap-up. Inject remaining-budget/turns into the prompt so fires close out gracefully (checkpoint + ledger).
5. **SWE-agent** — per-instance cost limit ($1–3) + turn limit; every stop condition produces
   degraded-success AUTOSUBMIT (commit what's green) rather than hard failure. Matches our salvage doctrine.
6. **SWE-agent/OpenHands trajectories** — persist the full run transcript as an artifact per fire
   (Actions artifact / R2) for post-hoc audit — the cloud analog of our LEDGER + `.output` files.
7. **Aider in CI** — headless `--message --yes-always` applies ONE pass with no verification and ships
   compile-broken "green" unless `--auto-test --test-cmd` closes the loop. A runner must carry its own
   verify gates (ours: typecheck/Jest/prod-E2E) — never trust single-pass green.
8. **GH-native coalescing** — `concurrency.group` with `cancel-in-progress: false` is the
   battle-tested lease for scheduled agent workflows; custom mutexes only needed outside CI.

---

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
