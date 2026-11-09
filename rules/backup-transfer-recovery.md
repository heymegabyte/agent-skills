---
last_reviewed: 2026-11-09
superseded_by: null
name: backup-transfer-recovery
description: restic for versioned encrypted backups + rclone for object-storage transfers + Proxmox VE / PBS / GitOps backup invariants — with the discipline that a transfer is not a backup and an untested restore is not recovery
pack: "infra"
priority: 3
triggers:
  - "backup"
  - "restore"
  - "recovery"
  - "restic"
  - "rclone"
  - "vzdump"
  - "proxmox backup"
  - "pbs"
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

## Proxmox VE, PBS & GitOps Backup Invariants

- **Stopped VFIO VMs in PCIe `D3cold` vs `vzdump`**: On Proxmox VE, `vzdump` launches a minimal `kvm -S` backup helper even for **stopped** QEMU VMs, which attempts to bind any configured `hostpci*` VFIO device. If a passed-through GPU sits in PCIe `D3cold` (`0xff` config space, `invalid PCI interrupt pin 255`), `vzdump` aborts the guest backup and poisons nightly dead-man's-switch checks. Always set `options vfio_pci disable_idle_d3=1` (`/etc/modprobe.d/vfio-d3cold.conf`) AND guard `/usr/local/bin/vzdump-hc-hook.sh` (`job-init` / `job-end` / `job-abort`, pure Bash) to temporarily stash `D3cold` `hostpci*` lines on stopped VMs before `PVE::Cluster::cfs_update()` and restore them on completion.
- **Never clobber `/etc/vzdump.conf` hook scripts**: When writing thermal I/O caps (`bwlimit`, `ionice`, `zstd`) to `/etc/vzdump.conf`, always preserve `script: /usr/local/bin/vzdump-hc-hook.sh` so Healthchecks `pve-vzdump` telemetry continues firing.
- **PBS S3/R2 ownerless group directories**: Empty `<datastore>/{vm,ct,host}/<id>` directories lacking an `owner` file cause PBS garbage collection to fail with missing-owner errors; prune empty ownerless group directories idempotently during convergence (`fleet-proxmox-pbs-converge`).
- **GitOps state capture (`capture-state.sh`)**: Always run `git pull --rebase --autostash -X theirs origin main` **before** regenerating `state/*` snapshots so multi-host commits never wedge nightly state-capture timers in rebase conflicts, and pass `--retry 3 --retry-delay 3 --retry-all-errors` on Healthchecks `curl` pings.
- **Non-interactive SSH jump/proxy helpers (`proxmox-ssh-proxy.sh`)**: Always pass `-o IdentityAgent=none -o IdentitiesOnly=yes -i ~/.ssh/id_ed25519` inside proxy jump helpers so forwarded hardware FIDO2/YubiKey (`ED25519-SK`) keys never block automation waiting for physical touch, and probe upstream `SSH-` banners (`</dev/null`) rather than raw TCP port open.

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
