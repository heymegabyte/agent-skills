# DeepSeek cost — routing, cache pre-warming, effort escalator (issue #6)

Tracking issue: [heymegabyte/agent-skills#6](https://github.com/heymegabyte/agent-skills/issues/6).
Goal: cut DeepSeek V4 cost 40%+ on internal agent work.

## What shipped

| Sub-feature | Where | Status |
| --- | --- | --- |
| Agent-level model routing | `bin/deepseek-routing.sh agent-coverage` / `resolve`; `agents/visual-qa.md`; `rules/model-routing.md` § DeepSeek rail routing | implemented + gated |
| Cache pre-warming | `bin/deepseek-routing.sh warm` / `run` (lazy warm, prefix-hash TTL stamp) | implemented; needs a real key to verify |
| Effort escalator | `bin/effort-escalator.py` (`classify` / `hook`); wired into `deepseek-routing.sh run --variant` | implemented + tested |

Routing was already supported through agent frontmatter `model:` aliases (verified: 25 of 28 agents already resolved to the Flash tier). What was missing:

1. No DeepSeek tier → model-ID table lived anywhere, so the issue's Pro/Flash split was not enforceable or testable.
2. `visual-qa` was on the Pro tier (Opus), contradicting the issue's target table.
3. No cache warm-up path existed.
4. No effort automation existed; `CLAUDE_CODE_EFFORT_LEVEL` is static in `settings.json`.

## 1. Agent-level routing

`bin/deepseek-routing.sh agent-coverage` audits `agents/*.md` against the target table from the issue and exits 1 on drift:

| Target | Alias | DeepSeek ID | Agents |
| --- | --- | --- | --- |
| Pro[1m] | `opus` | `deepseek-v4-pro[1m]` | architect, security-reviewer, completeness-checker |
| Flash | `sonnet` / `haiku` | `deepseek-flash` | test-writer, code-simplifier, changelog-generator, visual-qa, content-writer, and every other non-judgment agent |

Result on this branch: `✓ routing table matches agents/*.md`, flash-tier agents **21/28 (75%)**.

Change made: `agents/visual-qa.md` moved Opus → Sonnet (`effort: xhigh` → `high`) with a `routing_note`. Rationale: visual QA is screenshot diffing plus DOM assertions, not judgment. The tier lists in `rules/model-routing.md`, `rules/emdash-fleet.md`, `rules/agent-selection.md`, and `rules/parallel-subagent-economy.md` were updated with it; `bin/check-agent-routing.sh` and `bin/check-agent-fallback.sh` both pass.

Agent files still use **aliases only** — per `rules/model-routing.md` § Provider portability — so the same files keep working on the Claude rail. The DeepSeek mapping is one table in one script.

## 2. Cache pre-warming

`bin/deepseek-routing.sh warm <model> <prefix>` sends one `max_tokens=1` request for the exact system-prompt prefix the next call will send, then writes a stamp keyed by the prefix hash with a TTL (`DEEPSEEK_WARM_TTL`, default 1800 s). `run -a <agent> …` warms lazily (only when the stamp is stale) and `exec`s `opencode run` with the agent's model.

Design notes:

- **Prefix, not a dummy string.** Provider prompt caches key on the request prefix; a warm request with different bytes warms nothing. The script takes the real prefix (for `run`, the agent's frontmatter block) and hashes it.
- **One request, minimal output.** `max_tokens: 1`, `temperature: 0`, no streaming — the cheapest write that establishes the entry.
- **Failure is non-fatal.** A non-200 warm logs a warning and the real run continues.
- The response's `usage.prompt_cache_hit_tokens` / `prompt_cache_miss_tokens` are reported, so a real key can confirm whether the provider cached the prefix at all.

**Not verified here:** this host's `DEEPSEEK_API_KEY` reference is unavailable to the agent session, so the warm path is exercised for argument handling and failure mode only. The 91%/120× figures in the issue stay an input assumption, not a measurement.

## 3. Effort escalator

`bin/effort-escalator.py classify "<task text>"` scores keywords into `low | medium | high | max`:

- `max` — architecture, refactor, security, auth, payment, debug/root-cause, migration, race/deadlock, incident, multi-file, correctness (one hit is enough; a max keyword is never demoted by a low one).
- `low` — rename, format/lint, typo, changelog, docs-only, comment, bump-version, dead-code, move-file.
- `high` — feature implementation keywords, or a long (> 1200 char) prompt with no low-tier evidence.
- `medium` — everything else, including empty input.

Word-boundary matching (`reformat` does not fire `format`). `hook` reads a Claude-style `PreToolUse`/prompt payload JSON on stdin (`prompt`, `message`, or `tool_input.{command,description,…}`). `run` passes the level as `opencode run --variant`.

Not wired into `settings.json` hooks here: the repo's `settings.json` is the macOS Claude Code config, and this agent's OpenCode rail has no `PreToolUse` hook contract. The OpenCode wiring is the `run` wrapper; a Claude Code user can add a `PreToolUse` command hook calling `bin/effort-escalator.py hook`.

## 4. Measured cost delta (model, fixed workload)

`bin/deepseek-cost-model.py` runs a fixed 10-agent, 246-call workload (`DEFAULT_WORKLOAD` in the script) before/after:

- **Before** — every agent on `deepseek-chat`, no cache.
- **After** — Pro tier for the 3 judgment agents, Flash for the rest, 91% system-prompt cache hit.

With the placeholder price file (`docs/deepseek-prices.example.json` — **not real prices**):

| Scenario | Before | After | Saved |
| --- | ---: | ---: | ---: |
| Routing only (no cache) | $0.67 | $0.44 | **34.5%** |
| Routing + 91% cache hit | $0.67 | $0.20 | **69.8%** |

So routing alone lands below the 40% goal on this workload; the cache pre-warm term closes it. Both numbers move with real prices — re-run before quoting:

```sh
bin/deepseek-cost-model.py --prices <real-prices.json> --cache-hit <observed-hit-rate>
```

Cache hits are capped at 95% inside the model, and a cache-hit discount of 90% (hit ≈ 10% of miss price) is assumed.

## Verification

```sh
bash bin/deepseek-routing.sh agent-coverage                 # exit 0, 75% flash
bash bin/check-agent-routing.sh && bash bin/check-agent-fallback.sh
python3 -m pytest control-plane/tests/test_effort_escalator.py control-plane/tests/test_deepseek_cost_model.py
shellcheck -x -S warning bin/deepseek-routing.sh
ruff check bin/effort-escalator.py bin/deepseek-cost-model.py
```

## Remaining

- Fill `docs/deepseek-prices.example.json` with the published price list (or point `--prices` at a live copy) and re-record the table above.
- With a real `DEEPSEEK_API_KEY`, run `bin/deepseek-routing.sh warm deepseek-flash "<system prompt>"` twice and read `cache_hit_tokens` to confirm the provider retention window.
- `opencode run --variant` is accepted on the installed OpenCode (1.18.35) for provider-specific reasoning effort. It is a *variant* name, not a numeric level — if the DeepSeek provider rejects `low|medium|high|max`, map them in one place (`cmd_run` in `bin/deepseek-routing.sh`).

Generated by `bin/deepseek-cost-model.py`. **Model, not invoice.**
