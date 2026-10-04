---
description: Update the vendored control plane + core commands in this repo to the latest heymegabyte/claude-bootstrap. Fires when the shared brain has moved on.
argument-hint: "(no args)"
---

Idempotent — a no-op when the repo already matches upstream. Re-copies only the vendored artifacts; never touches project-authored config.

## Steps

1. **Pull the source** — `git clone --depth 1 https://github.com/heymegabyte/claude-bootstrap` into a temp dir (or `git -C <clone> pull` if already present; on desktop, `~/.claude/plugins/heymegabyte-agent-skills` also works).
2. **Re-copy the control plane** — `control-plane/ccctl.mjs` → `.claude/control-plane/ccctl.mjs`.
3. **Re-copy core commands** — `commands/ship.md`, `commands/deploy.md`, `commands/bootstrap-status.md`, `commands/sync-claude.md`, `commands/verify-production.md`, `commands/rollback.md` → `.claude/commands/`.
4. **Diff before write** — skip any file that is byte-identical (report "unchanged"). Only overwrite the vendored files above; leave `.claude/site.json`, `.claude/settings.json`, and all project-authored commands alone.
5. **Report** — list changed files + the `ccctl` version bump (old → new, from `ccctl doctor`). If nothing changed, print "Already up to date at v<version>."
