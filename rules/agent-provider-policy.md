# Agent Provider Policy (canonical SSOT)

> Single source of truth for which providers our **internal development / research /
> agent-orchestration** layer may use. These are hard rules. `CLAUDE.md`, `AGENTS.md`, and
> `rules/model-routing.md` REFERENCE this file — never fork divergent copies.
> Scope = internal dev agents only. Customer-facing product LLM features are governed
> separately (see § Product-runtime boundary).
>
> Objective: maximize **useful + correct + tested + integrated implementation throughput per
> iteration** — cheap DeepSeek workers do most parallelizable implementation; Claude + Codex
> concentrate expensive intelligence on architecture, research, judgment, integration.

## Tiers

### Frontier — architecture · research · judgment (subscription CLIs ONLY)
- **Claude Code** (`claude` CLI, user's Claude subscription) — primary architect, integrator,
  final implementation judge, hard debugging, requirements reconciliation, deep architectural
  expansion, final verification.
- **Codex** (`codex` CLI, user's ChatGPT subscription) — independent heavy researcher,
  architecture challenger, second opinion, adversarial reviewer, plan/prompt critic,
  independent solution generator.
- For important work run Claude + Codex **independently**, then Claude synthesizes (not concat).
- **Codex unavailable/unauthed is NOT fatal** → Claude performs an extra architecture /
  expansion / adversarial-review pass itself, then proceeds.

### Throughput — routine implementation (DeepSeek via OpenCode)
- **OpenCode + DeepSeek** — routine implementation, parallel feature shards, test generation,
  refactors, migrations, repetitive transforms, docs, codebase exploration, independent
  candidate solutions, bug-fix attempts, cleanup, test-failure triage, TODO elimination,
  backlog chunks.
- When enough independent work exists, launch a **DeepSeek swarm** rather than one expensive
  frontier session implementing serially.
- Claude stays architect / integrator / final judge; Codex stays independent review.

## HARD provider rules

### OpenAI (internal orchestration)
- NEVER `OPENAI_API_KEY` for Codex. NEVER the Responses / Chat Completions / Agents API merely
  to make a model research / plan / review / architect / write code / expand a prompt when the
  Codex CLI can do it.
- NEVER silently fall back from Codex subscription → PAYG OpenAI API. NEVER create an OpenAI key.
  NEVER scrape ChatGPT or build an unofficial API. NEVER extract/copy/repurpose Codex OAuth creds.
- Codex uses its official CLI subscription auth only. A stray `OPENAI_API_KEY` must not leak into
  Codex child processes.

### Anthropic (internal orchestration)
- NEVER `ANTHROPIC_API_KEY`. NEVER the Anthropic API/SDK merely to make Claude research /
  architect / review / write code / expand prompts when Claude Code can via subscription.
- NEVER silently fall back subscription → Anthropic Console PAYG. NEVER extract/copy Claude
  subscription OAuth creds.
- Child `claude` processes must NOT inherit `ANTHROPIC_API_KEY` (it overrides the subscription
  and bills). Launch via the sanitizing helper below.

### DeepSeek (ALLOWED — preferred inexpensive implementation provider)
- DeepSeek API usage IS allowed, via OpenCode as the normal harness.
- Credential `DEEPSEEK_API_KEY` resolved at runtime via `get-secret DEEPSEEK_API_KEY`. Never
  committed / logged / echoed / in docs / in source / in a committed `.env` / in shell history
  when avoidable. Inject into the OpenCode child env only when needed.

## Enforcement tooling (`bin/`)
- `provider-capability.sh` — read-only capability + auth + env-leak detector (JSON; never prints
  secrets; `policy_ok` = `claude` installed ∧ DeepSeek present ∧ no API-key env leak).
- `with-subscription-cli.sh claude|codex …` — env-sanitizing launcher: strips
  `ANTHROPIC_API_KEY`/`ANTHROPIC_AUTH_TOKEN` before `claude`, `OPENAI_API_KEY` before `codex`.
  Use it for every internal CLI invocation.
- `check-required-keys.sh` — requires `DEEPSEEK_API_KEY` + CLI presence; `ANTHROPIC_API_KEY` /
  `OPENAI_API_KEY` present in the dev ENV is a WARNING (can override subscription + bill).

## Product-runtime boundary (NOT governed by the internal ban)
- Customer-facing features intentionally offering OpenAI/Anthropic-backed functionality are
  PRESERVED and billed to the platform, not internal agents: the WLK-39 Resolution Engine
  (`/api/resolve`), the model-registry customer API (`/v1/*`), the editor chat router, the
  per-site voice / social / media owner AI, and the AI-Gateway + `$ai_*` telemetry plumbing.
- Never confuse (1) a product intentionally offering OpenAI/Anthropic features with (2) our own
  dev agents spending API money when a subscription CLI / OpenCode could do the work. (2) is
  forbidden; (1) is preserved.
- Product secrets (`ANTHROPIC_API_KEY` / `OPENAI_API_KEY` as Worker secrets) stay — they are
  product-runtime, not internal-orchestration.

## Fallback ladder (internal orchestration)
1. Frontier judgment → `claude` (subscription) [+ `codex` (subscription) when authed] → synthesize.
2. Codex unauthed → Claude does the extra independent pass. Not fatal.
3. Throughput implementation → OpenCode + DeepSeek (swarm when parallelizable).
4. Claude subscription unavailable → surface a clear failure (subscription auth required). Do NOT
   auto-enable API credits or mint keys.
