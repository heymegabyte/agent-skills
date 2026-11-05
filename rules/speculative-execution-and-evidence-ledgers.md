# Speculative Execution & Revision-Aware Evidence Ledgers

## 1. Doctrinal Intent
Autonomous agents must not mutate the primary repository branch blindly when fixing complex bugs or refactoring core architecture. All exploratory fixes must undergo speculative evaluation, and every verification claim must be backed by an immutable cryptographic evidence entry.

## 2. Core Protocols

### Speculative Candidate Branching
- Whenever a problem has multiple viable solution hypotheses, the agent must evaluate them concurrently in isolated scratchpads or branches using [`bin/speculative-rollout.ts`](file:///Users/Apple/.agentskills/bin/speculative-rollout.ts).
- Candidate patches are scored via Monte Carlo Tree Search heuristics using [`bin/mcts-patch-selector.ts`](file:///Users/Apple/.agentskills/bin/mcts-patch-selector.ts), balancing test pass rates against AST complexity deltas.

### Revision-Aware Evidence Ledgers
- Agents must record proof-of-verification using [`bin/evidence-ledger.ts`](file:///Users/Apple/.agentskills/bin/evidence-ledger.ts).
- Every proof entry binds the exact Git commit hash, Git tree OID, test command, and SHA-256 output digest.
- If files in the tree change, prior proofs are invalidated and must be re-proven.

### Flaky Test Elimination & Automated Bisect
- Suspect tests must be stressed $N \ge 10$ times with timing jitter via [`bin/flaky-test-stressor.ts`](file:///Users/Apple/.agentskills/bin/flaky-test-stressor.ts). A single passing run is insufficient to claim a bug is resolved.
- Regressions in existing tests must be isolated through automated binary search using [`bin/git-bisect-agent.ts`](file:///Users/Apple/.agentskills/bin/git-bisect-agent.ts).
