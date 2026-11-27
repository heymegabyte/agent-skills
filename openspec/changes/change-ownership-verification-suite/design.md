# Design: Change-Ownership Verification Suite

## Harness

- `bin/verify-change-ownership.sh` runs the §7 checks against the live repo + installed agent files,
  classifying each as **STATIC** (file/validator), **RUNTIME** (executed here), or **LIMITED** (needs a
  live agent/host — reported honestly, never faked). Exit 0 only when all STATIC + RUNTIME checks pass.
- Read-only and idempotent; the idempotency probe copies canonical files into a disposable tmp dir.

## Checks

- STATIC: invariant present EXACTLY ONCE in each of the 4 installed agent files (catches re-sync dupes);
  canonical rule present; cross-links resolve (`bin/audit-crosslinks.mjs`); every workflow proposal has
  real content (>400 bytes, not a bare dir).
- RUNTIME: `bin/change-ownership.test.mjs` (atomic one-owner + concurrent-claim-refused); `openspec
  validate --strict` on all five workflow changes; `hooks/hooks.json` has exactly one handler per event
  (no duplicate); distribution is idempotent (re-copy == source, installed == canonical, no drift); an
  unrelated proposal coexists with completed changes.
- LIMITED (reported): fresh-session invariant load inside live Codex/Gemini/OpenCode runtimes; live
  multi-agent decomposition behavior; cross-host distribution beyond `git push` (per-host sync/pull).

## Boundary

- The suite verifies THIS repo's change-ownership workflow surfaces; it does not launch the other agent
  binaries (reported as LIMITED). It is the capstone for `agent-change-ownership-policy`,
  `change-ownership-atomic-dispatcher`, and `agent-ownership-checkpoint-hooks`.
