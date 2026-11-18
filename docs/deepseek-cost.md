# DeepSeek cost — routing, cache pre-warming, effort escalator (issue #6)

Tracking issue: [heymegabyte/agent-skills#6](https://github.com/heymegabyte/agent-skills/issues/6).
Goal: cut DeepSeek V4 cost 40%+ on internal agent work.

## What shipped

| Sub-feature | Where | Status |
| --- | --- | --- |
| Agent-level model routing | `bin/deepseek-routing.sh agent-coverage` / `resolve`; `agents/visual-qa.md`; `rules/model-routing.md` § DeepSeek rail routing | implemented + gated |
| Cache pre-warming | `bin/deepseek-routing.sh warm` / `run` (lazy warm, prefix-hash TTL stamp) | implemented; cache economics measured (91–92%), warm call needs a DeepSeek key |
| Effort escalator | `bin/effort-escalator.py` (`classify` / `hook`); wired into `deepseek-routing.sh run --variant` | implemented + tested |

Routing was already supported through agent frontmatter `model:` aliases (verified: the large majority already resolved to the Flash tier). What was missing:

1. No DeepSeek tier → model-ID table lived anywhere, so the issue's Pro/Flash split was not enforceable or testable.
2. `visual-qa` was on the Pro tier (Opus), contradicting the issue's target table.
3. No cache warm-up path existed.
4. No effort automation existed; `CLAUDE_CODE_EFFORT_LEVEL` is static in `settings.json`.

## 1. Agent-level routing

`bin/deepseek-routing.sh agent-coverage` audits `agents/*.md` against the target table from the issue and exits 1 on drift:

| Target | Alias | DeepSeek ID | Agents |
| --- | --- | --- | --- |
| Pro | `opus` | `deepseek-v4-pro` | architect, security-reviewer, completeness-checker |
| Flash | `sonnet` / `haiku` | `deepseek-flash` | test-writer, code-simplifier, changelog-generator, visual-qa, content-writer, and every other non-judgment agent |

Result on this branch: `✓ routing table matches agents/*.md`, flash-tier agents **44/52 (85%)**.

Change made: `agents/visual-qa.md` moved Opus → Sonnet (`effort: xhigh` → `high`) with a `routing_note`. Rationale: visual QA is screenshot diffing plus DOM assertions, not judgment. The tier lists in `rules/model-routing.md`, `rules/emdash-fleet.md`, `rules/agent-selection.md`, and `rules/parallel-subagent-economy.md` were updated with it; `bin/check-agent-routing.sh` and `bin/check-agent-fallback.sh` both pass.

Agent files still use **aliases only** — per `rules/model-routing.md` § Provider portability — so the same files keep working on the Claude rail. The DeepSeek mapping is one table in one script.

## 2. Cache pre-warming

`bin/deepseek-routing.sh warm <model> <prefix>` sends one `max_tokens=1` request for the exact system-prompt prefix the next call will send, then writes a stamp keyed by the prefix hash with a TTL (`DEEPSEEK_WARM_TTL`, default 1800 s). `run -a <agent> …` warms lazily (only when the stamp is stale) and `exec`s `opencode run` with the agent's model.

Design notes:

- **Prefix, not a dummy string.** Provider prompt caches key on the request prefix; a warm request with different bytes warms nothing. The script takes the real prefix (for `run`, the agent's frontmatter block) and hashes it.
- **One request, minimal output.** `max_tokens: 1`, `temperature: 0`, no streaming — the cheapest write that establishes the entry.
- **Failure is non-fatal.** A non-200 warm logs a warning and the real run continues.
- The response's `usage.prompt_cache_hit_tokens` / `prompt_cache_miss_tokens` are reported, so a real key can confirm whether the provider cached the prefix at all.

**Verified 2026-11-18 through the fleet gateway** (`llm.megabyte.space`): a 10,511-character system prompt returned **2,432 cache-hit tokens of 2,629 (92.5%)** on `deepseek-flash`/`deepseek-chat` and **2,432 of 2,654 (91.6%)** on `deepseek-v4-pro`, with 6 of 6 sequential calls hitting after the first. The issue's 91% assumption holds in this environment.

**Still not verified:** the `warm` subcommand itself calls `api.deepseek.com` and needs `DEEPSEEK_API_KEY`, which this agent session does not hold; its argument handling and failure mode are tested, the provider call is not. Warm the real prefix and read `cache_hit_tokens` on a host that has the key.

## 3. Effort escalator

`bin/effort-escalator.py classify "<task text>"` scores keywords into `low | medium | high | max`:

- `max` — architecture, refactor, security, auth, payment, debug/root-cause, migration, race/deadlock, incident, multi-file, correctness (one hit is enough; a max keyword is never demoted by a low one).
- `low` — rename, format/lint, typo, changelog, docs-only, comment, bump-version, dead-code, move-file.
- `high` — feature implementation keywords, or a long (> 1200 char) prompt with no low-tier evidence.
- `medium` — everything else, including empty input.

Word-boundary matching (`reformat` does not fire `format`). `hook` reads a Claude-style `PreToolUse`/prompt payload JSON on stdin (`prompt`, `message`, or `tool_input.{command,description,…}`). `run` passes the level as `opencode run --variant`.

Not wired into `settings.json` hooks here: the repo's `settings.json` is the macOS Claude Code config, and this agent's OpenCode rail has no `PreToolUse` hook contract. The OpenCode wiring is the `run` wrapper; a Claude Code user can add a `PreToolUse` command hook calling `bin/effort-escalator.py hook`.

## 4. Measured cost delta (model, fixed workload)

### Inputs, measured on 2026-11-18

- **Prices** — `docs/deepseek-prices.json`, read from `GET https://llm.megabyte.space/v1/model/info`. `deepseek-v4-pro` routes to `deepseek/deepseek-reasoner` and `deepseek-flash` to `deepseek/deepseek-chat`; **both bill $0.28/M input and $0.42/M output**, cache read $0.028/M (90% discount). At these rates tier routing is **not** a rate lever.
- **Cache hit** — 10,511-char system prompt, 6 sequential identical calls per model: 92.5% of prompt tokens hit on `deepseek-flash`/`deepseek-chat`, 91.6% on `deepseek-v4-pro`; 6/6 calls hit after the first. Use 90–92% as the observed range.
- **Pro output volume** — same fixed code-review task (`max_tokens=600`, `temperature=0`, 3 samples): `deepseek-flash` emitted 85/52/52 completion tokens; `deepseek-v4-pro` emitted 600/600/600, of which 588–600 were `reasoning_tokens`, with `finish_reason=length` and empty content. Reasoning tokens bill as output, so the Pro/Flash output ratio is **at least 600/85 = 7.1×**, and Pro did not even finish. `pro_output_multiplier: 7.1` in the price file is that lower bound.

### Result

`bin/deepseek-cost-model.py` runs a fixed 10-agent, 246-call workload (`DEFAULT_WORKLOAD`): **Before** = every agent on `deepseek-chat`, no cache; **After** = Pro for the 3 judgment agents, Flash for the rest.

| Scenario | Before | After | Saved |
| --- | ---: | ---: | ---: |
| Routing only, flat output (multiplier 1.0), no cache | $0.51 | $0.51 | **0.0%** |
| Routing + 91% cache, flat output | $0.51 | $0.18 | **64.2%** |
| Routing + 91% cache + measured 7.1× Pro reasoning output | $0.51 | $0.28 | **43.8%** |
| Same, 11.5× (Pro / median Flash output) | $0.51 | $0.36 | **29.0%** |

Read this honestly:

- **Prompt caching is the whole saving.** Routing contributes 0.0% at flat rates — the earlier 34.5% figure came from a fictional price spread and has been removed.
- **Routing the three judgment agents to Pro eats 20 of the 64 points** the cache buys, because Pro bills 7× or more output on the same task. The 40% goal is met at the measured 7.1× (43.8%) and missed at 11.5× (29.0%).
- Keep Pro for architect / security-reviewer / completeness-checker only where judgment is worth 7× output cost; route anything mechanical to Flash. The multiplier is a lower bound from a truncated sample — re-run on a longer-output task before treating 7.1 as converged.

Reproduce:

```sh
bin/deepseek-cost-model.py --prices docs/deepseek-prices.json --cache-hit 0.916
bin/deepseek-cost-model.py --prices docs/deepseek-prices.json --cache-hit 0.916 --pro-output-multiplier 1.0
```

Cache hits are capped at 95% inside the model.

## Verification

```sh
bash bin/deepseek-routing.sh agent-coverage                 # exit 0, 85% flash
bash bin/check-agent-routing.sh && bash bin/check-agent-fallback.sh
python3 -m pytest control-plane/tests/test_effort_escalator.py control-plane/tests/test_deepseek_cost_model.py
shellcheck -x -S warning bin/deepseek-routing.sh
ruff check bin/effort-escalator.py bin/deepseek-cost-model.py
```

## Remaining

- Re-fetch `docs/deepseek-prices.json` from `/v1/model/info` before quoting any figure; the gateway can re-route an alias and the rate snapshot goes stale silently.
- Re-measure `pro_output_multiplier` on a task that produces a complete Pro answer. The 7.1 figure is a lower bound because Pro hit `max_tokens=600` on reasoning alone.
- With a real `DEEPSEEK_API_KEY`, run `bin/deepseek-routing.sh warm deepseek-flash "<system prompt>"` twice and read `cache_hit_tokens` to confirm the provider retention window. The warm path is not covered by the gateway measurement.
- `opencode run --variant` is accepted on the installed OpenCode (1.18.35) for provider-specific reasoning effort. It is a *variant* name, not a numeric level — if the DeepSeek provider rejects `low|medium|high|max`, map them in one place (`cmd_run` in `bin/deepseek-routing.sh`).

Generated by `bin/deepseek-cost-model.py`. **Model, not invoice.**
