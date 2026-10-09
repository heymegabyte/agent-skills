# Persistent agent fleet

This is the canonical scheduling and machine-operation policy. It supersedes the old session-cron/cloud-container runner proposals. Product deployment guidance in `ccctl.mjs` remains separate.

## Architecture and authority

GitHub Actions owns recurring schedules and the canonical run ledger. Each enabled project has a small `.github/workflows/run-the-loop.yml`: schedule `2,17,32,47 * * * *` (UTC) plus manual dispatch, calling the shared reusable workflow at an immutable git SHA. Every tick requests one loop for every enabled project. There is no central portfolio allocator or ephemeral execution host.

The primary persistent Ubuntu Desktop VM in Proxmox executes the jobs. The runner design uses three independently registered systemd user services for real concurrent job slots; observed registration state is recorded in the machine profile. OpenClaw's single persistent Gateway orchestrates isolated turns through the `fleet-cli` backend. Claw Router is **dennisonbertram/claw-router**, not a hosted gateway with a similar name. It routes official Claude Code/Codex subscription profiles. The existing official Codex home is registered in place; three separate Claude homes are prepared and disabled until login succeeds.

Codex is preferred for system/setup work on this machine. Routine/high-volume work uses OpenCode → DeepSeek directly with `DEEPSEEK_API_KEY`; an existing environment key takes precedence over `get-secret`. Never route local Claude, Codex, OpenClaw, OpenCode or DeepSeek traffic through Cloudflare AI Gateway. Cloudflare-hosted product features may use it separately.

`fleet.json` is the approved project roster, with repository identity, agent ID, desired scheduling eligibility and runner capabilities. GitHub workflow state records operator pause/resume. Exclude `heymegabyte/agent-skills` from product loops. Repository-owned `.claude/commands/run-the-loop.md` and task/context files retain precedence over the generic command.

## State, workspaces and publication

- `~/ai/repos/<repo>`: persistent canonical checkouts and shared skill source.
- `~/ai/worktrees/<repo>/<run-id>`: isolated run workspaces based on current `origin/main`.
- `~/ai/runners/worker-01..03`: independent persistent runner registration/state.
- `~/ai/logs/<run-id>`: correlated private diagnostics and sanitized run records.
- `~/ai/state`: machine observations and rebuildable SQLite FTS index.
- `~/.openclaw`: single primary Gateway, sessions, configuration and authentication.
- `~/.codex`: existing official Codex authentication and native history, preserved.
- `~/.claw-router`: account registry, isolated Claude profiles, cached account observations.
- `~/.config/opencode`: direct DeepSeek provider configuration and shared skills.
- `~/.config/agent-fleet`: protected local UI credential and optional fallback host secret store.

**Main is the normal working branch.** No PR-only policy, feature-branch default or branch protection is imposed. Worktrees use detached HEAD only to isolate durable runner jobs from shared canonical checkouts. The runner gives the agent a current main snapshot, requires clean committed results, then publishes with ordinary `git push HEAD:main`. No force push, automatic `git add -A`, destructive reset or silent conflict resolution. A failed publication retains the worktree and commits for inspection on the next fire. Feature branches are exceptional: actual conflicting simultaneous work, experimental work or intentionally isolated tasks.

A repository-scoped filesystem lock serializes conflicting mutation/publication for that repository, including repeated scheduled jobs. Different repositories execute concurrently. No global one-job lock is used. There is no durable execution queue. If GitHub arrivals exceed measured execution throughput, jobs wait in GitHub; future scheduling can adjust roster/policy without changing the execution adapter. GitHub scheduled workflows are best-effort, can be delayed, and are not a hard real-time guarantee.

Each run propagates a repository/run-ID/attempt correlation ID through the Gateway message, native CLI child environment (`AI_RUN_ID`), telemetry, diagnostics, result report and GitHub artifact. The CLI adapter reads only non-secret correlation context; official CLIs retain subscription auth. Native CLI commands and usage are observable in compute records; unknown model/headroom/reset values remain unknown.

## Evidence and recovery

Every execution uploads `run.json` and `summary.md` to GitHub with a 90-day artifact retention policy. The step summary includes project/runner, times/duration, objective, actual base/result commits, committed files, observed compute, reported checks/deployment evidence, warnings/failures, next actions, links and timeline. Missing checks and deployment data do not imply success. Local raw stderr/model transcripts stay private and are not uploaded. A fallback finalizer covers preflight/interrupted failures when GitHub can still execute final steps.

The next fire inspects actual git/worktree state, GitHub history, task/context files, commits and tests. Worktrees from failed runs are retained; never reap them without checking their changes and commits. Do not create an issue per run or build a queue to reconstruct execution state.

Git/files are canonical memory. `python3 control-plane/fleet.py index` derives a local SQLite FTS index from skills, requirements/context and run summaries; `search 'query'` retrieves provenance-bearing excerpts. Delete/rebuild it at any time. Cloudflare AI Search/D1/R2 can be introduced if a concrete retrieval need justifies them; they are not canonical ledger replacements. No Cloudflare resources are required for this local version.

## Operator commands

```bash
# Host health and independent runner processes
openclaw health --json
systemctl --user status openclaw-gateway agent-fleet-ui agent-runner-{01,02,03}
cr --provider codex doctor codex-primary
cr --provider codex status --json
cr status --json

# Complete each subscription login interactively (isolated official Claude CLI)
fleet-account-login claude-1
fleet-account-login claude-2
fleet-account-login claude-3

# Live direct DeepSeek probe; never print its key
~/ai/repos/agent-skills/bin/opencode-deepseek.sh run -m deepseek/deepseek-chat 'Reply with exactly OK.'

# Authenticated local UI; opens browser without printing its credential
fleet-ui-open

# Propagate a tested shared-workflow revision to each caller on main
python3 ~/ai/repos/agent-skills/control-plane/update-callers.py <40-character-commit-sha> --push
```

`agent.megabyte.space` is the intended human UI and repository. Current setup excludes website publishing: the authenticated host adapter runs only at `http://127.0.0.1:18888`. Controls dispatch one/all projects, enable/disable their GitHub workflows and pause/resume all. GitHub remains the scheduler. Do not expose this loopback host API publicly without an authenticated hosting and host-connection design.

On machines with no existing broker, `get-secret` can use the explicitly protected local fallback installed by bootstrap; `fleet-secret-import NAME` accepts hidden input and refuses overwrites. Its files are mode 0600 under a mode 0700 directory and never committed. This is a local fallback, not a replacement for an existing encrypted recovery store. Bootstrap preserves any pre-existing `get-secret`.

## Security implications

This is a trusted-owner development fleet. Runner jobs and native CLI tools execute with the host user's access, including persistent credentials and repositories. Cross-agent session visibility is intentionally `all`, with unrestricted agent-to-agent access. Accounts share configured skills/context. This exposes project/session context across agents and does not isolate mutually untrusted tenants. Native scheduled CLIs receive autonomous tool permission as authorized by the owner. Do not enable untrusted pull-request/fork triggers on these privileged runners. The runner group is restricted to the approved project repositories; public-repository access is needed for the owner's public projects.

Official OAuth credentials are never committed, uploaded, parsed into the UI or repurposed as APIs. Router cached usage is best-effort; stale/unknown values remain labeled. UI API/control requests require authentication; state is private, cookies are HttpOnly/SameSite=Strict, mutation endpoints validate origin/host/action headers and repository allowlists. All local services bind loopback. User linger keeps systemd services alive after logout and across boot without requiring root execution.

## Source verification

Installation and adapter contracts were checked against official/current-project guidance on 2026-10-06:

- [OpenClaw installation](https://docs.openclaw.ai/install) and [CLI backend plugins](https://docs.openclaw.ai/plugins/cli-backend-plugins).
- [Claw Router](https://github.com/dennisonbertram/claw-router), including Codex registration in place and provider-scoped usage-aware policy.
- [Official Claude Code setup](https://code.claude.com/docs/en/setup) and installed `claude auth` help.
- [Official Codex authentication](https://developers.openai.com/codex/auth/) and installed CLI help/login status.
- [OpenCode providers](https://opencode.ai/docs/providers/) and configuration schema.
- [GitHub persistent self-hosted runners](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners).

Runtime versions, machine preferences and outstanding auth prerequisites belong in `machines/ubuntu-proxmox-primary.md`. Add separate profiles for macOS or additional Linux/VM hosts rather than copying this machine's identity or credentials.

Shared skills synchronize through `agent-skills-sync.timer` every fifteen minutes. Dirty owner edits defer synchronization; updates require a fast-forward. This timer refreshes skills/search only and never schedules project loops.

## Desktop machine repositories and remote access

Each persistent desktop should have its own private GitHub repository named for its remote-access hostname, separate from product repositories and the shared skill source. The primary Ubuntu desktop uses `ProfessorManhattan/ubuntu.megabyte.space`, with its checkout at `~/ai/repos/ubuntu.megabyte.space`. Machine repositories are excluded from product `/run-the-loop` scheduling. Machine identity records the repository and remote-desktop URL so other agents can discover them.

Back up an explicit allowlist of non-secret recovery configuration and service definitions to git, committing only changes and pushing after GitHub registration. Never mirror the whole home directory or commit OAuth state, private keys, passwords, browser profiles, tunnel/API tokens, raw transcripts or unrelated project files. Full disks/personal data belong in appropriate Proxmox/encrypted backups; project source belongs in its own repository.

Ubuntu remote access uses GNOME VNC on loopback, a persistent Cloudflare Tunnel, and browser rendering behind an explicit owner-only Cloudflare Access policy at `ubuntu.megabyte.space`. Verify Access before publishing the Tunnel/DNS route. No bypass policy or unauthenticated hostname. This shares the existing active GNOME session; pre-login or locked-screen recovery remains available through Proxmox. Other desktops should get distinct identities, repositories and hostname-specific policies, with their OS-native remote-desktop support. This remote-access traffic is separate from local AI compute and never changes the no-AI-Gateway rule.

On this eight-CPU/15-GiB primary desktop, registered workers and OpenClaw Gateway descendants share `agent-fleet.slice`: CPUQuota=600%, MemoryHigh=8G, MemoryMax=10G. Gateway Nice=5 gives interactive desktop processes precedence. Independent worker services still provide three concurrent slots; aggregate limits include native compute launched by the Gateway.

## Infisical secret provider

`get-secret NAME` resolves existing environment first, configured Infisical second, then protected local files only when Infisical is not configured. Configured provider failures fail closed rather than silently using stale local values. `get-secret --exists NAME` resolves without printing. Run `fleet-infisical-setup` in a local terminal to enroll a read-only Machine Identity using Universal Auth. Provide the HTTPS origin (US/EU/self-hosted), project ID, environment slug and folder, then client ID and hidden client secret. Enrollment files are owner-only under ~/.config/agent-fleet/infisical*.json and excluded from backups. Access tokens and fetched secrets remain in memory; requests use verified TLS, no redirects and a 20-second timeout. No CLI dependency, cloud gateway, bulk export or background secret mirroring. The protected client credential persists across reboot for unattended runners. Scope identity access to the intended project/environment/folder. Publish secrets from the other computer into that scope using Infisical's own UI/import tooling. Live access requires enrollment and cannot be verified before credentials exist.
