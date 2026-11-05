# Agent Provider Policy (canonical SSOT)

The standing team is Codex + three Claude subscription accounts + Gemini for independent frontier judgment, with OpenCode + DeepSeek swarms handling context-light research, mechanical coding, tests, migrations and documentation that do not materially lose quality. Paperclip owns tasks, budgets and approvals; GitHub Sync mirrors Paperclip-owned engineering work using immutable origin IDs. Machine-readable routing and the monthly lane exercise live in `config/agent-fleet-routing.json`; never invoke every provider on every task merely to satisfy utilization.

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

## Cross-harness OpenCode delegation mandate

This mandate applies equally when the parent session is **Codex, Claude Code, or Gemini CLI**:

1. Classify each work unit before implementation as `frontier-required` or `throughput-safe`.
2. Delegate every `throughput-safe` unit to OpenCode + DeepSeek whenever it is expected to complete correctly. Premium-model capacity saved is itself sufficient value; a wall-clock speedup is not required.
3. Keep premium/frontier models focused on architecture, ambiguous requirements, security-sensitive judgment, novel debugging, cross-cutting synthesis, conflict resolution, and final acceptance.
4. Do not retain routine work in Codex, Claude, or Gemini merely because that model discovered or planned it. Handoff after the judgment-heavy phase.
5. The parent frontier model owns decomposition, contracts, review, integration, and verification; OpenCode owns the bounded implementation volume.

Typical `throughput-safe` work includes mechanical code changes, scoped feature shards with explicit acceptance criteria, tests, fixtures, migrations, documentation, formatting, cataloging, codebase exploration, independent research breadth, cleanup, and first-pass failure triage. Escalate back to the parent when a worker encounters unclear requirements, architectural choice, sensitive authorization/data handling, repeated failure, or evidence that the task is not actually bounded.

When two or more independent throughput-safe slices exist, launch an **OpenCode swarm** unless coordination, contention, or launch overhead would make the total outcome worse. Do not require a minimum time saving: reduced Codex/Claude/Gemini usage, greater coverage, independent attempts, and preserved premium context all count as benefits. Use 3–4 workers by default when enough real work exists, obey the global host pool, and never exceed configured concurrency or provider limits. Assign disjoint file/module ownership, give each worker a compact contract, and prohibit nested swarms unless the scheduler explicitly permits them. Use serial waves for dependencies or shared hot files. Swarm output is untrusted until the parent folds it, checks conflicts, and runs the complete verification suite once.

### Frontier — architecture · research · judgment · OpenSpec Authoring (subscription CLIs ONLY)
- **Claude Code** (`claude` CLI, user's Claude subscription) — **Primary Architect** with a fully-loaded, hydrated context (`<=900K tokens`), OpenSpec specification author (`proposal.md`, `design.md`, `tasks.md`, `specs/`), integrator, final implementation judge, hard debugging, requirements reconciliation, deep architectural expansion, final verification.
- **Codex** (`codex` CLI, user's ChatGPT subscription) — independent heavy researcher, architecture challenger, OpenSpec Architect/critic, second opinion, adversarial reviewer, plan/prompt critic, independent solution generator.
- **Gemini CLI / Antigravity** (user subscription) — independent multimodal/frontier Architect, OpenSpec author, judgment, and review; like Codex and Claude, it delegates throughput-safe execution to OpenCode rather than consuming its premium context on routine volume.
- **HARD RULE — OpenSpec Authorship (`[[openspec-operating-contract]]`, `[[total-convergence-and-openspec-handoff]]`)**: **NEVER spell out the details of the app or author OpenSpec architectural specifications (`proposal.md`, `design.md`, `tasks.md`, `specs/`) with `opencode` (DeepSeek).** Prefer `claude` (with a fully-loaded, informative context), `codex`, or `antigravity` as the Architect who writes the OpenSpec details and posts the linked task to Paperclip MCP / API.
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
- **DeepSeek endpoint = the LiteLLM rotation gateway, NOT a single raw key (Brian 2026-10-30).** OpenCode's DeepSeek rail defaults through `https://llm.megabyte.space/v1` (`[[litellm-gateway]]`): `litellm/deepseek-v4-pro` (reasoning) + `litellm/deepseek-flash` (fast/vision), wired in `~/.config/opencode/opencode.jsonc` (proven live: `llm.provider=litellm`). The gateway rotates the 4-key pool + cross-provider fallback + Langfuse tracing, so a swarm of parallel OpenCode workers survives the per-key 429s a raw key would hit under load. **Heavily leverage it:** whenever a unit is throughput-safe, run it on OpenCode-via-LiteLLM and fan out swarms — this is the primary lever for throughput AND for preserving Claude/Codex quota. Direct `deepseek/*` (`api.deepseek.com`) is the fallback.
- **Quota preservation — heavily DEFAULT to OpenCode/DeepSeek to protect the finite Claude subscription
  windows (Brian 2026-10-26).** The Claude Max 5h/weekly quota is the SCARCE resource; every routine turn
  spent on Claude is quota NOT available for architecture/judgment. Route aggressively to OpenCode+DeepSeek for
  anything that doesn't need frontier judgment, and use claw-orchestrator **session handoff** to downgrade a live
  session to a cheaper engine/model the moment the hard thinking is done (expensive→cheap mid-task; a stuck Claude
  session → Codex). Spend Claude's quota ONLY where it uniquely wins — that is how you maximize the Claude accounts'
  real capability, not by routing everything to them.

### Research expansion (beginning-of-build research) → [[research-expansion-orchestration]]
- The Phase 0 / prompt-expansion research that used to reach for the OpenAI/Anthropic **APIs** now
  runs on the CLIs: **claude** (deep/judgment + synthesis — replaces Anthropic-API research) +
  **codex** (independent 2nd angle — replaces OpenAI-API research, when provided) +
  **opencode/DeepSeek** (throughput breadth — always leveraged). Codex unavailable → claude extra pass.
- Drive it through `bin/research-orchestrator.sh` so every expansion is `gum`-logged: announce each
  major step, a before/after + summary box per session, run/skip(+why), and a USED/NOT-USED(+why)
  verdict per session + a final table. Full flow + honesty gate: [[research-expansion-orchestration]].

## Fleet management plane — Paperclip over OpenClaw (recommended, as of 2026-10)
- **Paperclip** (`github.com/PaperclipAI/paperclip`, MIT, self-host) is the recommended control
  plane for **managing OpenClaw + every other coding agent** as one governed org: task assignment,
  org chart / roles, per-agent + per-project **budgets & cost tracking**, heartbeats, scheduled
  routines, and **review → final-approval gates** across heterogeneous adapters (Claude Code ·
  Codex · OpenCode · Cursor · Gemini CLI · OpenClaw · custom HTTP). "If it can receive a heartbeat, it's hired."
- **Layering — do not collapse:** Paperclip = management/governance plane → **OpenClaw** =
  per-machine gateway/runtime (chat-in, heartbeat daemon, runs coding sessions) → the **tier agents**
  above (Claude + Codex subscription CLIs; OpenCode+DeepSeek throughput). Paperclip manages OpenClaw;
  it does not replace it.
- **HARD-rule compliance in adapter config (non-negotiable):** Paperclip is BYO-AI (API key *or*
  subscription) — we use **subscription only**. Its `claude`/`codex` adapters launch via
  `bin/with-subscription-cli.sh` (+ `bin/claude-pool.sh` / claw-router for pooled Claude); DeepSeek
  stays via OpenCode. A stray `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` in any Paperclip adapter env =
  policy violation (see HARD provider rules below).
- **Governance maps onto existing doctrine:** Paperclip approval gates = the `autonomous-engineering`
  tiers (autonomous | review-recommended | approval-required | blocked); its budgets = `cost-estimator`
  discipline; its task/comment records pair with `/run-the-loop` + `.claude/run-the-loop/CONVERGENCE.md`.
- **Run it CF-native + safe:** self-host only — never expose the raw Gateway/Control UI; gate behind
  **Cloudflare Access** (as with the OpenClaw Gateway). Embedded Postgres locally → external **Neon**
  in prod. Install `npx paperclipai@latest onboard --yes` (Node ≥24.11; Docker ok); creds via
  `get-secret`. Pin + review deps per `rules/ai-agent-security.md` § Supply chain.
- Supersedes the bare "OpenClaw = orchestrator" framing in `bootstrap/ubuntu-agent-fleet-codex.md`
  + `machines/ubuntu-proxmox-primary.md`: OpenClaw stays the runtime; Paperclip is the plane above it.

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
- `get-secret DEEPSEEK_API_KEY` is the encrypted source of truth. CLI launches inject it only into
  the OpenCode child. Desktop/GUI launches do not inherit shell env, so synchronize it into
  OpenCode's native `~/.local/share/opencode/auth.json` entry with
  `bin/opencode-deepseek-auth.sh sync`; require mode `0600` and preserve other provider entries.
- Never commit, log, echo, paste into docs/source, or place the key in a committed `.env`. Never put
  `"apiKey":"{env:DEEPSEEK_API_KEY}"` in the global OpenCode config when native auth is enabled:
  a GUI launch resolves it to empty and shadows the working native credential.
- Launch DeepSeek jobs through `bin/opencode-deepseek.sh`; it prefers native auth (no key in the
  child environment), falls back to child-scoped `get-secret`, and scrubs ambient OpenAI/Anthropic
  API keys to prevent accidental premium-provider fallback or billing.

## Enforcement tooling (`bin/`)
- `provider-capability.sh` — read-only capability + auth + env-leak detector (JSON; never prints
  secrets; distinguishes model discovery, native auth, config shadowing, and source-secret presence).
- `opencode-deepseek-auth.sh status|sync` — inspect or atomically synchronize native OpenCode auth.
- `opencode-deepseek-doctor.sh [--live]` — local checks by default; optional paid live inference.
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
