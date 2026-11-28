---
name: tri-harness-deepseek-ollama-routing
description: Route non-frontier, throughput-safe, and routine heartbeat work across all three CLI harnesses (Claude Code, OpenAI Codex, and OpenCode) onto DeepSeek (deepseek-v4-pro, deepseek-flash, deepseek-chat, deepseek-reasoner) and local Ollama (hybrid-coder, ollama-coder, workstation-ai, qwen2.5-coder:14b) via Claw Router (cr) and the LiteLLM Gateway (https://llm.megabyte.space).
---

# Tri-Harness DeepSeek & Ollama Offload (`claude` + `codex` + `opencode` via Claw Router & LiteLLM Gateway)

## Purpose

Every Paperclip (`swarml.ink`) and OpenClaw (`openclaw.swarml.ink`) agent must preserve premium Frontier subscription quotas (Claude Ultra/Max, Codex Pro, Gemini Ultra) for high-leverage work that genuinely requires frontier reasoning, and offload **all throughput-safe, routine, mechanical, and scheduled work** onto **DeepSeek** and **Ollama** across **all three CLI harnesses**:

1. **Claude Code (`claude` via Claw Router `cr`)**
2. **OpenAI Codex (`codex`)**
3. **OpenCode (`opencode` via `opencode-deepseek.sh`)**

All three harnesses connect through **Claw Router (`cr`)** and the **LiteLLM Gateway (`https://llm.megabyte.space`)**, which provides 4-key DeepSeek load-balancing (`deepseek-v4-pro`, `deepseek-flash`, `deepseek-chat`, `deepseek-reasoner`), local GPU Ollama routing (`hybrid-coder`, `ollama-coder`, `workstation-ai`, `local-llm`, `qwen2.5-coder:14b`) with automatic `deepseek-chat` fallback, and Langfuse observability.

---

## 1. When to Use Frontier vs. DeepSeek / Ollama

| Tier | Allowed Harnesses & Models | Mandatory Workloads |
| --- | --- | --- |
| **Tier 1: Frontier Subscription** | `fleet-cli/claude` (`cr --provider claude`), `fleet-cli/codex` (`codex exec`), `fleet-cli/gemini` (`agy --model gemini-4-carbon-high`) | **OpenSpec Authoring (`proposal.md`, `design.md`, `tasks.md`, `specs/<cap>/spec.md` — NEVER `opencode`)**, cross-repo system architecture, STRIDE threat modeling, complex security reviews, critical production incident root-cause analysis, and final release sign-off. |
| **Tier 2: DeepSeek Throughput (Cloud Offload)** | `fleet-cli/deepseek` (`opencode-deepseek.sh -m litellm/deepseek-v4-pro`), `fleet-cli/claude-deepseek` (`cr @litellm`), `fleet-cli/codex-deepseek` (`codex exec -p deepseek`) | Executing pre-written OpenSpec `tasks.md` checklists, routine heartbeats, Summarizer SITREPs, HR fleet audits, FinOps telemetry, Content/SEO/A11y sweeps, Swarm worktree wave dispatch, and test/lint triage. |
| **Tier 3: Hybrid Ollama + DeepSeek Fallback (Zero-Marginal-Cost Local GPU)** | `fleet-cli/ollama` / `fleet-cli/hybrid-coder` (`opencode-deepseek.sh -m litellm/hybrid-coder`), `fleet-cli/claude-ollama` (`cr @ollama`), `fleet-cli/codex-ollama` (`codex exec -p ollama`) | High-frequency code refactoring (`Refactorer`), mechanical dead-code removal, boilerplate generation, documentation formatting (`Technical-Writer`), and local code edits on `ubuntu.megabyte.space`. |

---

## 2. Exact Invocation Commands Across All 3 Harnesses

### A. Claude Code (`claude`) via Claw Router (`cr`)

Claw Router (`cr`) registers three zero-plaintext API/Gateway backends (`@litellm`, `@ollama`, `@deepseek`) alongside the 3 Claude Max/Ultra OAuth accounts (`brian@megabyte.space`, `hey@megabyte.space`, `blzalewski@gmail.com`):

```bash
# 1. Claude Code harness running DeepSeek V4 Pro via LiteLLM Gateway:
cr @litellm --provider claude -p --output-format stream-json --verbose --dangerously-skip-permissions "Execute task..."

# 2. Claude Code harness running Local Ollama (hybrid-coder -> deepseek-chat fallback) via LiteLLM Gateway:
cr @ollama --provider claude -p --output-format stream-json --verbose --dangerously-skip-permissions "Execute refactor..."

# 3. Claude Code harness running direct DeepSeek Anthropic-compatible endpoint:
cr @deepseek --provider claude -p --output-format stream-json --verbose --dangerously-skip-permissions "Execute task..."

# 4. Frontier Claude Code subscription (auto-rotates lowest-usage OAuth account):
cr --provider claude -p --output-format stream-json --verbose --dangerously-skip-permissions "Author OpenSpec proposal/design/tasks..."
```

### B. OpenAI Codex (`codex`) via LiteLLM Gateway (`wire_api = "responses"`)

Codex CLI is configured in `~/.codex/config.toml` and `~/.codex/{deepseek,deepseek-pro,flash,ollama}.config.toml` to route against `https://llm.megabyte.space/v1` using `LITELLM_API_KEY`:

```bash
# 1. Codex harness running DeepSeek via LiteLLM Gateway:
LITELLM_API_KEY="$(get-secret LITELLM_API_KEY)" codex exec --json --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox -p deepseek "Execute task..."

# 2. Codex harness running Local Ollama (hybrid-coder) via LiteLLM Gateway:
LITELLM_API_KEY="$(get-secret LITELLM_API_KEY)" codex exec --json --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox -p ollama "Execute refactor..."

# 3. Frontier Codex Pro subscription:
codex exec --json --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox "Author OpenSpec or complex multi-file implementation..."
```

### C. OpenCode (`opencode`) via `opencode-deepseek.sh` & LiteLLM Gateway

`~/.config/opencode/opencode.jsonc` declares both `litellm` (`https://llm.megabyte.space/v1`) and `deepseek` (`https://api.deepseek.com`) providers with all DeepSeek and Ollama models:

```bash
# 1. OpenCode running DeepSeek V4 Pro (4-key rotated via LiteLLM):
~/.agentskills/bin/opencode-deepseek.sh run --format json -m litellm/deepseek-v4-pro "Execute task..."

# 2. OpenCode running DeepSeek V4.1 Flash (low-latency triage & summarization):
~/.agentskills/bin/opencode-deepseek.sh run --format json -m litellm/deepseek-flash "Summarize run..."

# 3. OpenCode running Local Ollama Hybrid Coder (qwen2.5-coder:14b with DeepSeek fallback):
~/.agentskills/bin/opencode-deepseek.sh run --format json -m litellm/hybrid-coder "Refactor dead code..."

# 4. OpenCode running Local Workstation GPU Ollama directly:
~/.agentskills/bin/opencode-deepseek.sh run --format json -m litellm/ollama-coder "Generate unit test..."
```

---

## 3. Automatic Task-Tier Offload in `openclaw-fleet/cli.py`

The OpenClaw Fleet CLI plugin (`control-plane/openclaw-fleet/cli.py`) inspects every incoming Paperclip / OpenClaw prompt and `PAPERCLIP_WAKE_REASON`:

1. **Routine Timer Heartbeats & Scheduled Routines (`PAPERCLIP_WAKE_REASON=heartbeat_timer` / `routine_trigger`)**:
   - Automatically offloads onto the agent's harness backed by DeepSeek/Ollama (`claude-deepseek`, `codex-deepseek`, `deepseek`, `ollama`) before touching Frontier subscription quotas.
2. **Throughput-Safe Tasks (Summarization, SITREPs, Audits, Refactors, Boilerplate)**:
   - Automatically executes on `claude-deepseek` / `codex-deepseek` / `deepseek` / `ollama` (`hybrid-coder`).
3. **Frontier OpenSpec & Architecture Tasks (`openspec/changes/`, `proposal.md`, `design.md`, `tasks.md`, `specs/`, `ADR-`, `STRIDE`)**:
   - Enforces Frontier execution (`claude`, `codex`, `gemini`) first, with full PACE fallback continuity.

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Domain Swarm Directive**: Decompose work into contract-locked OpenSpec DAG nodes, convene a right-sized SCRUM quorum (`claude` + `codex` + `gemini`) for key decisions, and offload all throughput-safe implementation, plugin catalogs, unit tests (100% coverage), and parallel Cloudflare Browser Run E2E suites to `opencode` (DeepSeek) swarms.
- **Massive OpenCode (DeepSeek) Offload**: Whenever a task slice is throughput-safe (bounded implementation, plugin catalog shards, 100% unit test generation, Playwright E2E specs, migrations, or documentation), offload it to parallel **`opencode` swarms powered by DeepSeek** (`~/.agentskills/bin/opencode-deepseek.sh` via the LiteLLM 4-key pool `https://llm.megabyte.space/v1`) rather than consuming premium `claude`, `codex`, or `gemini` client quota.
- **Architecture and verification**: Route material decisions through `rules/evidence-gated-autonomous-orchestration.md`. Its conference and risk gates govern provider selection and independence.
- **End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**: At the end of every prompt round (running in parallel with final verification, deployment, and reporting), extract any possible meaning, preference, architectural lesson, reusable site code, or system configuration from the current agent window and store it concurrently into **`heymegabyte/agent-skills`** (for AI skills/rules/prompts — always updated under the **Minimum-Prompt Ecosystem Completeness Assumption**: assuming the skills *should have already been written* so that we write **as few prompts as possible** to finish **as complete a product or multi-repo ecosystem as possible** via massive parallel agent swarms), **`heymegabyte/theme.tools`** (for reusable site/app code across the 28 canonical `@theme.tools/*` libraries), and **`heymegabyte/install.doctor`** (for reusable system/host code).
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.
- **DeepSeek-first parallel dispatch** At intake and after each dependency clears, dispatch independent work concurrently whenever doing so reduces time to verified delivery. Delegate every suitable task to OpenCode with DeepSeek through LiteLLM when it meets the acceptance bar and improves throughput. Use Codex, Gemini, or Claude for work that benefits materially from premium capability or independent review, and record concrete reasons for premium routing or limited dispatch. Scale worker count to ready work, isolation, and approved capacity.
