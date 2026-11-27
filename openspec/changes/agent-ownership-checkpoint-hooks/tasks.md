# Tasks: Agent Ownership Checkpoint Hooks

> Status: Proposed — assign ONE owner before implementation; that owner does every task.

## 1. Inspect
- [ ] 1.1 Enumerate supported hook events for each of the 4 agents (real event names/schemas).

## 2. Implement (Claude Code first)
- [ ] 2.1 session-start: load invariant + list active OpenSpec changes/owners.
- [ ] 2.2 pre-dispatch: readiness / ownership / dependency / conflict check.
- [ ] 2.3 pre-compact / handoff: persist owner / progress / decisions / recommendations.
- [ ] 2.4 pre-completion: reconcile tasks + verification + outstanding proposals.
- [ ] 2.5 Wire via `install-hooks.sh` idempotently; port to other agents where supported.

## 3. Verify
- [ ] 3.1 Fresh-session + dispatch + pre-compact fixtures; install-twice idempotency.
