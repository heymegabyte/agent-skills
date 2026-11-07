---
last_reviewed: 2026-10-06
superseded_by: null
name: "main-only-branch"
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# Main is the normal working branch

Update main safely, perform work, run appropriate checks, commit and push. Do not impose PR-only development, branch protection or feature branches as the default. Existing master defaults may be migrated deliberately. Never force-push main or discard another process's edits.

Feature branches are exceptional: conflicting simultaneous work, particularly experimental work, or a task intentionally benefiting from isolation. Keep the reason explicit and integrate verified work when appropriate; do not require experimental work to merge before it is ready.

Use isolated worktrees when concurrent processes would conflict. Persistent fleet runs use detached worktrees from origin/main and publish with an ordinary fast-forward push. Serialize conflicting work for one repository, while allowing different repositories to run concurrently. Retain failed or dirty worktrees for recovery; remove only verified completed work.

Canonical fleet details: [control-plane/FLEET.md](../control-plane/FLEET.md).
