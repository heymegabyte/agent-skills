# Specification: Triad Convergence, Frontier OpenSpec & Langfuse Fail-Open

## Requirements

### Requirement: Extracted Micro-Task Convergence Loops
Every UI widget, sub-feature, business rule, performance path, and security boundary SHALL execute the `CREATE → RENDER/EXECUTE → EXPERIENCE → CRITIQUE → MODIFY → COMPARE` micro-loop across all 16 visual states and 10 critique lenses.

### Requirement: Parallel End-of-Turn Triad Sync
At the end of every prompt pass, the agent SHALL infer and apply reusable updates in parallel across `heymegabyte/agent-skills`, `heymegabyte/install.doctor`, and `heymegabyte/theme.tools` (`ui.theme.tools`), saving in-flight or future work via OpenSpec and linking each OpenSpec change to a Paperclip issue.

### Requirement: Frontier Architect Authorship for OpenSpec
OpenSpec `proposal.md`, `design.md`, `tasks.md`, and `specs/` SHALL be authored exclusively by a Frontier Architect (`claude` with full hydrated context, `codex`, or `antigravity`) and SHALL NOT be authored by `opencode`.

### Requirement: Langfuse Always-On with Graceful Timeout Fallback
All LLM/agent/Worker surfaces SHALL trace to Langfuse with a bounded timeout (`<=3000ms`, default `2500ms`) and fail open gracefully when Langfuse is unreachable.
