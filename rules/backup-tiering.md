---
name: "backup-tiering"
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Backup Tiering — git / system-service first, Backrest+Restic only for large data

How to choose a backup mechanism. **Default to git (a repo + a system service that commits+pushes) or a native system service.** Reach for **Restic** — always fronted by **Backrest** — ONLY when the data genuinely cannot live in git. (Brian directive 2026-10-29.)

Cross-links: [[coolify-backup-dr-suite]] · [[neon-database-conservation]] · [[secret-provisioning]] · [[cloudflare-native-provisioning]] · [[verification-loop]] · [[healthchecks-job-monitoring]]

## The ladder (pick the FIRST tier that fits)

1. **git / system-service (DEFAULT — whenever possible).** Config, code, secrets-that-fit, small/medium state, and logical DB dumps that fit under GitHub's 100 MB/file limit → a git repo, committed + pushed by a cron / systemd service (the `backup-commit` + `git-sync` pattern). Versioned, diffable, free, trivially restorable, and already monitored. This is the default for the overwhelming majority of backup jobs.
2. **Backrest + Restic (ESCALATION — large binary/runtime data only).** Use ONLY when the job genuinely can't live in git: **≈5 GB+ of data**, large binary/runtime state (Docker volume data, media libraries, DB *data dirs*), or anything that would take **more than 3 git repositories to hold**. Restic is the dedup/encrypted engine; **Backrest never runs headless-only — it IS the orchestrator/UI in front of restic.**

## The decision test

- "Would this job fit in **≤3 git repositories** under GitHub's limits?" **Yes → git / system-service.** **No (3+ repos' worth, 5 GB+, or big binary) → Backrest+Restic.**
- Restic is the exception, not the default. If you're reaching for restic for config/dumps/small state, stop — use git.

## Estate specifics (the one control plane)

- **Backrest = `backrest.megabyte.space`** — self-hosted on the Coolify host, behind **Cloudflare Zero Trust (Access)**. It is THE restic control plane for the estate (repos · plans · schedules · restore · prune · browse). Do NOT stand up a second Backrest elsewhere — one instance (consolidate any stragglers into it).
- **Restic repo = R2 `coolify-volume-backups`** (encrypted; password in `get-secret RESTIC_VOLUME_BACKUP_PASSWORD`). Backrest manages it.
- **git rails already in place:** `backup-commit.py` → GitHub `coolify.megabyte.space`, `git-sync` → GitHub `coolify-configs`, Coolify DB dumps → R2. These are the Tier-1 default for config/dumps.
- When adding a NEW backup job: default to a git repo + a cron/systemd committer; only if it busts the decision test above do you add a Backrest plan.

## Anti-patterns

- Reaching for restic/Backrest to back up config, code, or a small DB dump that fits in git.
- A headless restic cron with no Backrest in front (lose the UI, scheduling, restore browser, retention policy).
- A second Backrest instance (each new machine mounts/points at `backrest.megabyte.space`, never its own).
- Backup data living only on the box it backs up (always off-box: git remote or R2).
