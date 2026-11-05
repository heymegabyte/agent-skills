---
last_reviewed: 2026-11-05
superseded_by: null
name: "trajectory-discipline-and-evaluator-gate"
priority: 1
pack: "ai"
triggers:
  - "trajectory"
  - "evaluator"
  - "critic"
  - "step-limit"
paths:
  - "bin/trajectory-governor.ts"
  - "bin/evaluator-critic.ts"
  - "bin/rigor-scorer.ts"
---

# Trajectory Step Discipline & Evaluator-Optimizer Audit Gate

Autonomous agents must not engage in unconstrained trial-and-error loops. To maximize token return-on-investment (ROI) and prevent context degradation, all agent execution trajectories are bounded by deterministic step limits and independent evaluator gates.

## Trajectory Step Horizon (Max 20 Steps)

1. **Hard Ceiling**: No single sub-task or phase may exceed **20 tool invocation steps**.
2. **Ceiling Action**: At step 17, the agent receives an automated ceiling warning. At step 20, the runner triggers a mandatory halt, checkpoints intermediate state to an isolated worktree (`bin/worktree-sandbox.ts`), and emits an AMBER SITREP requesting architectural guidance.
3. **No Brute-Force Debugging**: If an edit fails a test twice consecutively, the agent MUST stop editing code and inspect the AST / call-graph or read error runbooks rather than guessing blindly.

## The Evaluator-Optimizer Dual-Agent Gate (`bin/evaluator-critic.ts`)

Before any branch is merged into master or shipped to staging:
- An independent **Critic / Evaluator** unit (Architect, AppSec, or QA) evaluates the patch.
- The diff must score >= 70/100 on strict rubrics:
  - Zero `any` or loose type assertions.
  - No leftover `console.log` or debug statements.
  - Verifiable unit/integration test coverage accompanying new logic.
