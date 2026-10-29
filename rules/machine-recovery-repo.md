---
name: machine-recovery-repo
description: A repo named for a HOST/MACHINE (a hostname or FQDN that is also a server, e.g. ubuntu.megabyte.space) must be able to FULLY resurrect that machine from bare metal — all non-secret config committed (generators or captured records), secrets excluded-but-documented via get-secret/Infisical, a single authoritative RECOVERY.md runbook, and a snapshot timer that keeps it current. Use when auditing/building a host or machine-config repo, when asked "can this repo rebuild the machine", for disaster-recovery / resurrection work, or when adding a service/system-config to a host repo.
triggers: ["resurrect the machine", "rebuild the host", "disaster recovery", "DR", "recover the machine", "machine recovery", "can this repo rebuild", "bare metal restore", "host repo", "infrastructure as code for a host", "snapshot the machine config", "recovery runbook"]
---

# Machine-Recovery Repo — a host repo must resurrect its host

When a git repo is named for (or governs) a **host/machine** — a hostname/FQDN that is also a
server the fleet runs on (`ubuntu.megabyte.space`, a VM, a bare-metal box) — the repo's job is to be
that machine's **infrastructure-as-code**: a fresh clone + its runbook must bring the box back from
nothing. This is the host sibling of `[[domain-named-project-dns]]` (which makes a domain-named
*website* live at its domain); this rule makes a host-named *machine* resurrectable.

## The mandate

- **Full resurrection from the repo.** Everything needed to rebuild the machine is committed — as a
  **generator** (an idempotent `setup.sh` / install script that reproduces the config) OR a **captured
  record** (verbatim bytes under `snapshots/`). "It's on the host" is not committed; add it.
- **Secrets are the ONLY exception** — never in git. Exclude every token/key/OAuth/host-key, but
  DOCUMENT the secret rail (`get-secret` → chezmoi/age on Macs, Infisical on servers) + the exact
  re-provision step for each. A lost secret broker is the #1 recovery blocker — call it out.
- **One authoritative `RECOVERY.md`** at the repo root: (A) a **fast path** (restore the whole box
  from its hypervisor/PBS backup) and (B) a **bare-metal path** (fresh OS → bootstrap → clone →
  secret rail → generators in order → verify). Ordered, every step a real command/script.
- **A capture timer keeps it current.** A `snapshot.py`-style job (on a systemd timer) commits the
  non-secret config each hour (systemd units, crontab, `/etc/*` hardening records, service composes,
  service metadata) so the repo never silently drifts from the live box.
- **Every new service / system-config → generator + capture, SAME TURN** (`[[drift-detection]]`).
  Adding a container, a tunnel ingress, an `/etc` tweak, a timer? Ship its `setup.sh`/`harden-fleet.sh`
  line AND confirm the snapshot captures it. An orphan config (on the host, no generator, uncaptured)
  is a recovery hole.

## What "complete" must cover (audit checklist)

- **OS + bootstrap** (fresh-install prereqs, the estate bootstrap, guest-agent for clean snapshots).
- **Every service** as a deploy dir (`<service>/` with compose + idempotent `setup.sh`): the app, its
  DB, the web/desktop surface, the telemetry agent (Alloy/Netdata) — none "assumed to already exist".
- **System config** via one generator (sysctl, zram/swap, journald caps, firewall default-deny,
  fail2ban, **docker `daemon.json`** — easy to forget; it decides whether ports bind loopback or LAN).
- **systemd units** (user + system) + **crontab** + `/etc/cron.d` captured and restored.
- **Network/edge**: the tunnel + every ingress rule + the Access apps reproducible from a provisioning
  script (needs the CF API key from `get-secret`), not just one hostname.
- **The secret rail itself** (`get-secret` + its importer) restored before anything that needs a secret.

## Verify it actually resurrects (don't assume)

- A fresh clone + `RECOVERY.md` must reproduce the box. Dry-run the bare-metal path mentally against
  the repo; any step that references a host file not in the repo is a gap — fix it.
- Prefer a periodic **test-restore drill** (restore the hypervisor backup to a scratch VM, run the
  per-service `setup.sh`s, confirm healthy). A backup/record you've never restored isn't proven.
- Verify an exposed surface's gate from the real edge (off-WARP) per `[[verify-against-source-of-truth]]`.

## Reference impl — ubuntu.megabyte.space (2026-10-29)

`RECOVERY.md` (PBS fast-path + bare-metal path) · generators `scripts/harden-fleet.sh` (all `/etc` +
docker daemon.json), `observability/setup.sh` (Alloy), `web-desktop/setup.sh` (KasmVNC), `paperclip/`,
`scripts/provision-tunnel.sh` · records in `snapshots/` (systemd, crontab, `snapshots/system/*`) ·
`scripts/snapshot.py --push` on the hourly `ubuntu-machine-backup.timer`. The audit that produced this
found Alloy (0% committed), docker `daemon.json` (no generator), and an orphan `harden-fleet.sh` (not
in any runbook) — all closed the same turn.

## Cross-links

`[[domain-named-project-dns]]` (website→domain; this is host→resurrection) · `[[drift-detection]]`
(orphan config = merge-blocker) · `[[verify-against-source-of-truth]]` (prove the restore, don't assume) ·
`[[secret-provisioning]]` / `[[secrets-portable-resolution]]` (the excluded-but-documented secret rail) ·
`[[healthchecks-job-monitoring]]` (the snapshot/backup timers are dead-man's-switch jobs).
