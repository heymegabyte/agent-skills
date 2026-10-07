---
last_reviewed: 2026-10-06
superseded_by: null
name: "sandbox-execution"
priority: 3
pack: "ai"
triggers:
  - "sandbox"
  - "runner"
  - "untrusted code"
  - "ubuntu desktop"
paths:
  - "concern:ai-features"
---

# Isolated Execution / Runner Selection

Isolation is build hygiene, but Cloudflare Sandbox is **not** the default coding-agent runtime.

## Runtime order

1. Local worktree — normal edits, lint, tests, small builds.
2. `@cloudflare/computer` — lightweight Cloudflare-hosted agent filesystem/file-editing/Git/shell work where its abstraction fits. It is not a GUI desktop.
3. Daytona — preferred ephemeral full-Linux coding workspace.
4. Coolify MCP-managed runner — persistent/self-hosted Linux and Docker-heavy integration work.
5. GitHub runner on the Ubuntu Desktop VM on Proxmox — CI/scheduled/native/desktop-adjacent work.
6. Another explicitly configured runner only when the above cannot satisfy the task.

Do not route ordinary coding-agent jobs to Cloudflare Sandbox merely because Cloudflare offers it.

## Release flow

```
edit → build/test in worktree/runner → deploy production → Browser Run production verification
```

No Worker Preview and no per-PR preview environment.

## Remote runner requirements

- isolated workspace/worktree;
- reproducible checkout;
- scoped credentials only;
- build/test/Playwright support;
- logs + artifacts;
- cleanup/reset;
- deterministic commit/artifact handoff;
- no customer prod data copied in unless explicitly required and scoped.

## Desktop boundary

Real Ubuntu GUI/browser-login/native desktop work goes to the Ubuntu Desktop VM on Proxmox via its approved runner/control path. Never pretend `@cloudflare/computer` is a GUI desktop.

## @cloudflare/computer

Use as a Cloudflare-hosted agent workspace abstraction for files, Git and execution near Workers. Adapter-isolate because it is preview technology. Heavy native workloads and desktop interaction stay on the external runner fleet.

Reference: https://developers.cloudflare.com/changelog/post/2026-08-03-cloudflare-computer/
