---
last_reviewed: 2026-11-05
superseded_by: null
name: "multi-agent-dag-orchestration"
priority: 1
pack: "ai"
triggers:
  - "dag"
  - "orchestration"
  - "multi-agent"
  - "acyclic"
paths:
  - "bin/fleet-dag-runner.ts"
  - "agents/ceo.md"
  - "agents/architect.md"
---

# Multi-Agent DAG Orchestration & Disjoint Battlespaces

In complex software engineering campaigns, multi-agent swarms must never be organized into flat conversational groups or circular dependency loops. All complex operations must be decomposed into a Directed Acyclic Graph (DAG) using `bin/fleet-dag-runner.ts`.

## Core Orchestration Principles

1. **Strictly Acyclic Execution**: The mission graph must be topologically sortable with zero cyclic references. If node A depends on node B, node B cannot depend directly or transitively on node A.
2. **Disjoint Battle Space Enforcer**: Two agents operating in parallel MUST NOT have overlapping write permissions on the same file paths or subtrees. Colliding paths force sequential execution.
3. **Phase-Batched Parallelism**: Independent nodes with met dependencies execute concurrently in batched phases, maximizing throughput while eliminating race conditions.
4. **Deterministic Gate Handoff**: A downstream node cannot transition to `running` until all parent nodes have achieved `completed` status with verifiable Proof of Life.
