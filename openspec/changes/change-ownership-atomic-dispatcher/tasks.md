# Tasks: Atomic Change-Ownership Dispatcher / Claim Lock

> Owner: claude-session-fire2 (this session). One owner performed every task below.

## 1. Design

- [x] 1.1 Owner sidecar schema `owner.json` (changeId, owner instance, state, dependencies, allowedWriteAreas, claimedAt, updatedAt, handoff[]).

## 2. Implement

- [x] 2.1 Atomic claim/release/transfer via `bin/change-ownership.ts` — exclusive-create (`wx` = `O_CREAT|O_EXCL`) of `owner.json` is the atomic lock (a YAML field / separate checkout is NOT). Same-owner re-claim is idempotent.
- [x] 2.2 Serialize on conflict: a different-owner claim is refused (exit 3 → caller waits/queues); main-only branch policy preserved.
- [x] 2.3 Explicit handoff: `transfer --from --to` ends prior ownership + appends a handoff entry; `owner.json` persists on disk so ownership survives compaction/session resume.
- [x] 2.4 Sidecar reader/validator + `show`/`list` (`--json`); a corrupt sidecar fails closed.

## 3. Verify

- [x] 3.1 `bin/change-ownership.test.mjs` — 14/14 pass incl. "concurrent claims: exactly 1 winner, 11 refused (exit 3)", owner-gated release, transfer handoff, idempotent re-claim, not-found.

## Follow-up (separate change — NOT this change's atomicity mechanism)

- Record the same ownership in the Paperclip higher-level task tracker (routing / cross-host visibility) — deferred; needs the Paperclip control-plane (may require remote creds). The atomic guarantee here does not depend on it.
