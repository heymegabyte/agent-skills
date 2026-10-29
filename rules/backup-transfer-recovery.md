---
last_reviewed: 2026-10-29
superseded_by: null
name: backup-transfer-recovery
description: restic for versioned encrypted backups + rclone for object-storage transfers — with the discipline that a transfer is not a backup and an untested restore is not recovery
pack: "infra"
priority: 3
triggers:
  - "backup"
  - "restore"
  - "recovery"
  - "restic"
  - "rclone"
  - "snapshot"
  - "r2 sync"
  - "object storage transfer"
---

# Backup, Transfer & Recovery (restic + rclone)

When work involves backups, recovery, exports, data relocation, artifact transfer, or object-storage interoperability, reach for **restic** (versioned encrypted backups) and **rclone** (transfers) before hand-rolling a script — but hold the discipline below. Use the native provider/database/Proxmox-Backup facility where it supplies consistency these tools don't. A successful transfer is NOT a versioned backup; an untested restore is NOT recovery.

## Routing — which tool

- **Backup / restore / point-in-time recovery of files + config** → **restic** (encrypted, deduplicated, versioned snapshots with retention).
- **Move / mirror / export bytes between filesystems or S3-compatible stores (incl. Cloudflare R2)** → **rclone**.
- **App-consistent DB backup** → the DB's own dump/snapshot mechanism FIRST, then restic the dump. Never restic/rclone a live database directory — copying active files does not capture a consistent state.

## restic (§22.2 discipline)

- Encrypted, versioned snapshots with an explicit source scope, destination, retention, cadence, owner, and restore objective (RPO/RTO) — not an ad-hoc `tar`.
- Record snapshot IDs + exit status; keep partial/failed backups VISIBLE (a green log is not a good backup).
- Run `restic check` with budgeted `--read-data-subset` integrity verification on a cadence; run periodic ISOLATED restore exercises — proving real app data + dependencies restore, not merely that snapshot metadata exists.
- Separate backup-write credentials from the repository encryption key/password; protect retention/`forget --prune` authority. The repo password is a symmetric passphrase → use `encryptionpass` when choosing one (see `[[secret-provisioning]]`).
- Preview + authorize destructive `forget`/`prune` through policy; NEVER remove the last required restore point to make a job green.
- Official: <https://restic.readthedocs.io/en/stable/050_restore.html> · <https://restic.readthedocs.io/en/stable/060_forget.html>

## rclone (§22.3 discipline)

- **`copy` adds to the destination; `sync` makes the destination MATCH the source — including DELETING destination files** (verified current: rclone.org/commands/rclone_sync). Default to `copy` when destination-only files must survive.
- `copy` can still OVERWRITE a differing file at the same path — use create-only behavior where overwrites are forbidden; define collision/versioning intent.
- Treat `sync` / `move` / `purge` / `bisync` as distinct deletion+conflict semantics; always `--dry-run` (or `--interactive`) a consequential `sync` first (it deletes).
- Verify with `rclone check` (compares size + hash, alters nothing); an object ETag is not universally a full-file checksum — use `--download`/`--checksum` per backend capability.
- Keep remote credentials in `get-secret`/Infisical; `rclone obscure` is NOT secret protection. A `sync` mirror is not a versioned backup, and an unverified mirror is not disaster recovery.
- Official: <https://rclone.org/commands/rclone_copy/> · <https://rclone.org/commands/rclone_sync/> · <https://rclone.org/commands/rclone_check/>

## Runtime + loop integration

- These are CLI binaries — run them on a real host/container/runner, NEVER inside a Worker. Route failures into the common incident ledger.
- Track due jobs, last qualifying success, backup/transfer age, storage capacity, integrity-check age, and restore-test age as explicit obligations; distinguish measured evidence from aspiration.
- Test a real bounded restore AND a bounded transfer before any fleet rollout.

## Cross-links

- `[[secret-provisioning]]` — the restic repo password (`encryptionpass`) + credential rail.
- `[[cloudflare-native-provisioning]]` — minting R2 S3 creds for the `rclone` `R2:` remote (don't duplicate that recipe — reference it).
- `[[healthchecks-job-monitoring]]` — wrap backup/transfer jobs as dead-man's-switch checks.
- `[[verification-loop]]` — a backup/restore is a job whose outcome must be proven, not assumed.
- `[[docker-slim-all-containers]]` · `[[neon-database-conservation]]` — sibling infra discipline.
