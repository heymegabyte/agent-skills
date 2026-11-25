# Durable execution and integration runbook

This runbook describes how operators use the implemented orchestration primitives. The implementation remains authoritative: [`orchestration-run-state.ts`](../bin/orchestration-run-state.ts) owns state, leases, dispatch, checkpoints and resume; [`git-reconciliation.ts`](../bin/git-reconciliation.ts) owns clean-worktree integration. This document does not duplicate their algorithms.

## Bounded task briefs and ownership

Register each task with `registerDurableTask` before dispatch. Its immutable identity is the run ID, task ID and task digest; its owner and dependencies are explicit. `dispatchReadyTaskInRun` accepts a bounded brief containing an objective, owned paths, acceptance commands and evidence references. Empty or oversized briefs fail closed.

Independent tasks whose dependencies are ready may run concurrently. Shared schemas, lockfiles, workflows, changesets and release paths remain with the central integration owner. Overlapping ownership is serialized before launch; a worker must not broaden its paths conversationally.

State transitions are:

```text
pending + ready -> running -> succeeded with evidence
pending -> blocked
running -> failed | blocked
running + stale heartbeat -> stalled -> running as the next attempt
```

Terminal work is never relaunched. A duplicate event returns the existing running execution or reuses the completed receipt.

## Integration-writer lease

Before repository integration, call `claimRepositoryIntegrationWriterLease` or its path-backed atomic variant. Exactly one active lease exists per repository.

```text
unclaimed -> active generation 1
active + holder heartbeat -> active with renewed expiry
active + other claimant -> collision receipt + recoverable waiter
expired -> recovered old generation + active next generation
active + holder release -> released
```

Claims, heartbeats and releases use the state digest as optimistic concurrency control. Path-backed operations also use an exclusive lock and atomic rename. A collision receipt names the repository, claimant, holder, lease, generation and timestamp. Never bypass a collision by writing directly to the integration worktree.

## Checkpoint, interruption and exact resume

Every governed mutation appends a digest-bound checkpoint with task, maintenance, lease, dispatch and evidence snapshots. Persist through `saveRunState`; it writes a private temporary file and atomically renames it. A fresh coordinator loads through `loadRunState`, which rejects tampering.

Call `resumeRunFromCheckpoint` with the exact state digest and latest checkpoint ID. Resume dispositions are deliberately distinct:

- completed receipts are reused;
- fresh running work remains in flight;
- stale work launches only with an explicit reassignment worker and persisted brief;
- pending work launches only when ready and its bounded brief is available;
- dependency, missing-brief and external-release edges remain blockers;
- unexpired writer leases are restored, while expired leases are only reported recoverable.

Resume does not invent evidence, a worker, a brief or release completion.

## Worker handoff

A worker handoff contains the dispatch ID, task digest, owner, owned paths, attempt, changed paths, acceptance receipt references and current checkpoint ID. The coordinator rejects a handoff whose digest, owner or paths differ from the frozen brief. Completed evidence is appended before downstream readiness changes.

If a worker stops responding, preserve its worktree and checkpoint. Reassign through `reassignStalledTaskDispatch`; do not create a second active execution. Shared paths return to the central integration owner.

## Clean-worktree Git reconciliation

The edit checkout may be dirty and is never rebased, reset, stashed or blanket-staged by this workflow.

1. `prepareReconciliationWorktree` fetches current remote main and creates a clean detached worktree.
2. `replayTaskCommits` cherry-picks only explicit full task commit SHAs.
3. `affectedChecks` derives the checks invalidated by the actual changed paths.
4. Verification records the exact integration commit as the tested commit.
5. `planTestedTreePush` re-observes remote main and produces a normal push plan without force flags.
6. `executeTestedTreePush` pushes only when worktree HEAD equals the tested commit and remote main has not advanced.
7. `observeRemoteAndCi` closes delivery only when the remote SHA equals the tested commit and applicable CI is successful.

If remote main advances, discard no work: create a new clean reconciliation worktree, replay the same task commits, and rerun invalidated checks. A cherry-pick conflict records only the unresolved paths and aborts the replay cleanly.

## Failure recovery

| Failure | Preserved state | Next action |
|---|---|---|
| Duplicate dispatch | Existing execution or completed receipt | Reuse it; do not launch |
| Writer collision | Waiting claimant and collision receipt | Wait for release/expiry |
| Expired writer | Prior generation marked recoverable | Claim a new generation under policy |
| Coordinator interruption | Atomic checkpoint and worker worktrees | Load, validate and resume exact next actions |
| Missing worker brief | Explicit blocked edge | Reconstruct from the frozen task contract |
| Stalled worker | Prior attempt and worktree | Reassign once with an explicit worker |
| Task patch conflict | Task commits and conflicted path list | Resolve task-owned paths against current main |
| Remote main advanced | Tested commit and observed remote SHA | Reconcile again; never force-push |
| CI pending/failing | Remote SHA and CI observation | Wait or repair before delivery claims |

## Executable simulations

The simulations use temporary state files, worktrees and local bare Git remotes. They do not contact or push to production repositories.

```bash
node --experimental-strip-types --test \
  tests/orchestration-run-state-durability.test.ts \
  tests/integration-writer-leases.test.ts \
  tests/idempotent-task-dispatch.test.ts \
  tests/exact-resume.test.ts \
  tests/maintenance-recursion-guards.test.ts \
  tests/git-reconciliation.test.ts
```

Expected result: every simulation passes. A skipped, blocked or unavailable external observation is not a pass and must retain its exact next action.
