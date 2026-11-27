# Design: Atomic Change-Ownership Dispatcher / Claim Lock

## Mechanism

- The atomic lock is an exclusive-create of `openspec/changes/<id>/owner.json` via Node
  `writeFileSync(path, data, { flag: "wx" })` (`O_CREAT|O_EXCL`). Two concurrent `claim`s on one change →
  exactly one `wx` succeeds; the rest get `EEXIST` → refused (exit 3). This is a genuine atomic lock; a
  mutable YAML owner field or separate Git checkouts are NOT.
- Tool: `bin/change-ownership.ts` — `claim` / `release` / `transfer` / `show` / `list` (`--root`, `--json`).
  Exit codes: 0 ok · 2 usage · 3 refused (conflict) · 4 not-owner · 5 not-found.
- Idempotency: same-owner re-claim returns 0. Serialize: a different-owner claim returns 3 (caller waits/
  queues). Handoff: `transfer --from --to` ends prior ownership + records `{from,to,at,note}`; the on-disk
  sidecar survives compaction/session resume (it is re-read from the change dir).

## Boundary

- The atomic lock is LOCAL + filesystem-based (correct for one checkout / serialized fleet access per
  `[[main-only-branch]]`). Recording the same ownership in the Paperclip higher-level task tracker
  (cross-host visibility/routing) is a separate follow-up and is NOT required for the atomic guarantee.

## Verification

- `node bin/change-ownership.test.mjs` (disposable tmp fixtures) — 14 assertions incl. concurrent
  winner==1, 11 refused (exit 3), owner-gated release, transfer handoff, idempotent re-claim, not-found.
