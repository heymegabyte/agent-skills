# Proposal: Total Multi-Axis Convergence, Parallel Triad Sync & Frontier OpenSpec → Paperclip Handoff

> **Architect:** claude / antigravity (hydrated frontier context — non-OpenCode spec)

## Why

Previously, micro-task convergence loops (`CREATE → RENDER → EXPERIENCE → CRITIQUE → MODIFY → COMPARE`), 16-state widget visual matrices, and the 10-pass critique lenses lived inside `run-the-loop/_shared/CONSTITUTION.md` and only fired when `/run-the-loop` was explicitly invoked. Additionally, end-of-prompt self-improvement only consistently updated `agent-skills`, without automatically running parallel OpenSpec + implementation passes across `install.doctor` and `theme.tools` (`ui.theme.tools`) and registering linked tasks in Paperclip. Finally, Langfuse needed an explicit fail-open + bounded timeout contract (`2500ms`) so downstream observability outages never block LLM/agent execution.

## What Changes

1. **Extracted Micro-Task & Multi-Axis Convergence Loops in Always-Loaded Configs**:
   - Distill `MICRO LOOP`, `PRODUCT LOOP`, `ORGANIZATION LOOP`, the 16-state Visual State Matrix, and the 10-pass critique lenses into `rules/total-convergence-and-openspec-handoff.md`, `rules/always.md`, `rules/gorgeous-by-default.md`, `~/.claude/CLAUDE.md`, `CLAUDE.md`, `GEMINI.md`, and `~/.gemini/GEMINI.md`.
2. **Parallel End-of-Turn Triad Sync (`agent-skills` + `install.doctor` + `theme.tools` + Touched Projects)**:
   - Require every prompt pass to infer and apply updates in parallel across `heymegabyte/agent-skills`, `heymegabyte/install.doctor`, and `heymegabyte/theme.tools` (`ui.theme.tools`), saving multi-step/future work via OpenSpec and linking every OpenSpec change to a Paperclip issue.
3. **Frontier Architect Gate (`claude` / `codex` / `antigravity` ONLY — NEVER `opencode`)**:
   - Enforce in doctrine and `bin/openspec-paperclip-sync.ts` that OpenSpec details (`proposal.md`, `design.md`, `tasks.md`, `specs/`) are authored strictly by a Frontier Architect with hydrated context, rejecting `opencode`-authored specs.
4. **Langfuse Always-On with Graceful Timeout & Circuit Breaker (`bin/lib/langfuse-safe.ts`)**:
   - Provide a zero-dependency TypeScript fail-open client (`AbortSignal.timeout(2500)`, 3-strike 60s circuit breaker, local JSONL spool) and codify the contract in `rules/production-observability-default-on.md` and `reference/litellm-gateway.md`.
