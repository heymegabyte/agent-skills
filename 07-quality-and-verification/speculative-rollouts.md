---
name: "speculative-rollouts"
version: "3.0.0"
updated: "2026-11-05"
description: "Speculative execution and rollout tournament engine. Explores candidate patches in isolated temporary workspaces, scoring candidates via MCTS pass-rate and AST complexity heuristics (bin/speculative-rollout.ts, bin/mcts-patch-selector.ts)."
triggers:
  - "speculative"
  - "rollout"
  - "candidate-tournament"
  - "mcts-patch"
---

# Speculative Rollouts & MCTS Patch Selection

This skill enables agents to evaluate multiple competing implementation hypotheses concurrently in temporary scratch branches without polluting the primary workspace.

## 1. Operating Doctrine

When facing complex bug fixes or architectural refactorings:
1. Formulate up to 3 distinct hypotheses (e.g. candidate fix A vs B vs C).
2. Execute parallel speculative candidate rollouts via [`bin/speculative-rollout.ts`](file:///Users/Apple/.agentskills/bin/speculative-rollout.ts).
3. Score candidates with Monte Carlo Tree Search (UCB1) using [`bin/mcts-patch-selector.ts`](file:///Users/Apple/.agentskills/bin/mcts-patch-selector.ts).
4. Select the candidate that maximizes test pass rate while minimizing AST complexity deltas.

## 2. Evidence Recording

Every winning candidate must log its proof to [`bin/evidence-ledger.ts`](file:///Users/Apple/.agentskills/bin/evidence-ledger.ts) with the git commit SHA and tree OID.
