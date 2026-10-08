---
name: "research-expansion-orchestration"
priority: 1
pack: "research"
triggers:
  - "research expansion"
  - "research saturation"
  - "web research"
  - "deep research"
  - "prompt expansion"
  - "context saturation"
  - "phase 0 research"
paths:
  - "org:website_build"
last_reviewed: 2026-10-07
superseded_by: null
---

# Research Expansion Orchestration (beginning-of-build research runs on the CLIs, gum-logged)

The research that happens at the START of a build/non-trivial prompt — Phase 0 context saturation,
prompt expansion, competitor/peer scanning, "predict the 80% from the 20%" — is routed through the
**subscription CLIs + OpenCode**, never the OpenAI/Anthropic *APIs*, and is driven by the
deterministic, `gum`-logged `bin/research-orchestrator.sh` so a human can SEE the whole breakdown.
Governs internal research only; customer product LLM calls are the preserved product axis
([[agent-provider-policy]] § Product-runtime boundary).

## Provider routing (replaces OpenAI/Anthropic-API research)

- **`claude`** (Claude subscription, via `bin/with-subscription-cli.sh claude`) — deep / judgment
  research, synthesis of all sessions, and the final "what's missing" critic. This is what used to
  reach for the **Anthropic API** — it now runs on the subscription CLI.
- **`codex`** (ChatGPT subscription, via `bin/with-subscription-cli.sh codex`) — the independent
  heavy researcher / second angle / adversarial critic. This is what used to reach for the
  **OpenAI API**. Run it on the SAME core questions INDEPENDENTLY from claude, then claude
  synthesizes (synthesize, never concat). **Codex not provided/authed is NOT fatal** → claude does
  an extra independent pass; log that decision with its reason.
- **`opencode` + DeepSeek** (via `bin/opencode-deepseek.sh`) — ALWAYS leveraged for throughput
  breadth: enumeration, many-source scans, routine lookups, candidate generation, section/catalog
  sweeps. Swarm it when the breadth is parallelizable; reserve claude/codex for depth + judgment.
- Web fetching/search/crawl tools (Exa, Perplexity, Cloudflare Web Search, `/crawl`, Browser Run)
  are the EVIDENCE layer the models reason over — a model is not itself a crawler ([[competitor-research]], [[fetch-defaults]]).

## Mandatory gum visibility (via `bin/research-orchestrator.sh`)

Every research expansion MUST narrate itself through the orchestrator so the breakdown is visible:

1. `research-orchestrator.sh phase "<step>" "<detail>"` — announce EVERY major step of the prompt
   logic (e.g. `phase "RESEARCH EXPANSION — started"`). Narrate the pipeline, not just research.
2. `… plan <N> "<thesis>"` — "expansion started → decomposing into N sessions" (N = the number of
   web-research sessions the human will count).
3. For each session: `… run --k K --n N --provider claude|codex|opencode --role "…" --question "…"`
   — logs a **before** line (`▶ session K/N · provider · role · ask`), a **does-research: YES +why**
   or **NO +why** decision, runs the right CLI, then prints an **after** summary box of what it
   retrieved. Use `… log-result …` when the agent produced the result with its own tools instead.
4. `… skip --k K --provider P --why "…"` — a session deliberately NOT run, with the reason.
5. `… verdict --k K --provider P --used yes|no --why "…"` — **honesty gate**: for EVERY session say
   whether its result was USED in the final plan (+why it mattered) or NOT USED (+why it was
   discarded: redundant / low-signal / contradicted / out-of-scope). Never silently drop research.
6. `… summary` — a `gum table` (k · provider · role · ran · used · why) + a counts box (total · ran ·
   used · per-provider breakdown).

Human output is `emdash_*`/`gum` (CI-safe fallback per [[terminal-styling]]); the only stdout is the
machine-readable result path. Secret-safe (the DeepSeek key is injected by the launcher into its
child only — never printed/logged).

## Flow (independent → synthesize → critic → loop-until-dry)

1. `phase` + `plan N` — decompose the prompt into N research questions scaled to its appetite (a thin
   prompt still gets broad coverage — [[predictive-completeness]], [[first-time-excellence]]).
2. `run` the sessions: claude (depth) + codex (independent 2nd angle, if provided) on judgment
   questions; opencode/DeepSeek on breadth questions (parallel when independent).
3. **claude synthesizes** all session outputs into the plan (not a concat of transcripts).
4. **claude completeness critic** — "what modality/angle/source did we NOT research?" → if gaps, run
   another round; stop when a round surfaces nothing new.
5. `verdict` each session, then `summary`. The `.research/sessions.ndjson` ledger + per-session files
   are the secret-free, reproducible provenance of the expansion.

## Hard rules

- **[MUST]** NEVER `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` to make a model research at the beginning —
  use the CLIs ([[agent-provider-policy]], enforced by `check-provider-policy.mjs`). DeepSeek via
  OpenCode is the one allowed internal API.
- **[MUST]** Every session is logged RUN(+why) or SKIP(+why) AND USED(+why) or NOT-USED(+why). An
  unlogged research session is a defect — the point is a visible, auditable breakdown.
- **[SHOULD]** Degrade gracefully: missing codex → claude extra pass; missing opencode/DeepSeek →
  claude/codex cover breadth; missing gum → `emdash_*` plain fallback. Never block a headless run.

## Cross-links

- `[[agent-provider-policy]]` — the SSOT this operationalizes (frontier CLIs + throughput OpenCode).
- `[[terminal-styling]]` — the `emdash_*`/gum output standard the orchestrator uses.
- `[[competitor-research]]` · `[[fetch-defaults]]` · `[[crawling-testing-browser-supervisor]]` — the
  research pack's evidence-gathering members this sequences.
- `[[website-build-doctrine]]` (Phase 0) · `02-goal-and-brief` — the beginning-of-build callers.
- `[[predictive-completeness]]` · `[[first-time-excellence]]` — why a thin prompt still gets broad research.
- Driver: `bin/research-orchestrator.sh`. Launchers: `bin/with-subscription-cli.sh`, `bin/opencode-deepseek.sh`.
