# Episodic Failure Memory & Context Budget Allocation

## 1. Doctrinal Intent
Autonomous agents must learn from prior failed trajectories, avoid repeating anti-patterns within a codebase, and manage context windows deterministically to prevent token exhaustion and starvation.

## 2. Core Protocols

### Episodic Memory & Negative Constraints
- All dead-end hypotheses and failed execution attempts must be recorded using [`bin/episodic-memory.ts`](file:///Users/Apple/.agentskills/bin/episodic-memory.ts) in `logs/episodic-memory.jsonl`.
- Before formulating an execution plan, agents must query episodic memory for active negative constraints associated with the project path.

### Context Budget Partitioning
- Context allocation must be monitored by [`bin/token-budget-allocator.ts`](file:///Users/Apple/.agentskills/bin/token-budget-allocator.ts) to enforce explicit limits:
  - System Prompt & Rules: $\le 15\%$
  - Repository AST & Symbols: $\le 30\%$
  - Conversation History: $\le 25\%$
  - Scratchpad & Verification: $\le 30\%$
- Verbose execution logs must be compressed via [`bin/trajectory-distiller.ts`](file:///Users/Apple/.agentskills/bin/trajectory-distiller.ts) to save context tokens.
- AST symbol tables must be pre-indexed into prompt-cache friendly structures via [`bin/ast-cache-warmer.ts`](file:///Users/Apple/.agentskills/bin/ast-cache-warmer.ts) to achieve $>85\%$ cache hit ratios.
- Resolved incidents must be distilled into indexed markdown articles via [`bin/kb-absorber.ts`](file:///Users/Apple/.agentskills/bin/kb-absorber.ts).
