# Tasks: Atomic Change-Ownership Dispatcher / Claim Lock

> Status: Proposed — assign ONE owner before implementation; that owner does every task.

## 1. Design
- [ ] 1.1 Owner sidecar schema (`owner.json`): instance/session id, state, deps, allowed write areas, claimed_at, handoff log.

## 2. Implement
- [ ] 2.1 Claim/release/transfer integrated with the existing dispatcher (Paperclip) — atomic, no duplicate ownership.
- [ ] 2.2 Serialize conflicting changes (shared files/interfaces); preserve main-only policy.
- [ ] 2.3 Explicit handoff: end prior ownership before replacement proceeds; preserve across compaction/resume.
- [ ] 2.4 Sidecar validator/checker.

## 3. Verify
- [ ] 3.1 Concurrent double-claim is blocked; conflicts serialize; handoff + resume preserve ownership.
