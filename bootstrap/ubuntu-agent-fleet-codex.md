# Ubuntu Agent Fleet Bootstrap (Codex)

You are Codex running on my persistent Ubuntu Desktop VM under Proxmox. This machine is the primary always-on development/orchestration host. You are already installed and authenticated here. Treat this host as durable: preserve useful machine-level configuration, credentials, agent state, caches, repo checkouts, services, and preferences across runs.

Today is 2026-10-06. Before relying on syntax for fast-moving tools, inspect current official docs/README files and installed versions. Prefer supported current mechanisms over stale snippets.

## Primary objective

Turn this Ubuntu VM into the persistent control plane and worker for my autonomous development fleet, with:

- GitHub Actions as the scheduler and canonical run history.
- One central 15-minute portfolio tick.
- Every enabled repository launched on every tick for now.
- OpenClaw as the project/system orchestrator and primary UI/runtime.
- Codex as the preferred system/setup agent on this Ubuntu host.
- Three Claude Code subscription accounts pooled through Claw Router using usage-aware routing.
- OpenCode using the DeepSeek API directly from DEEPSEEK_API_KEY, never through Cloudflare AI Gateway locally.
- heymegabyte/agent-skills as the canonical global skills/rules/commands source.
- agent.megabyte.space as the polished UI/control plane for anything that benefits from a UI.
- Git-backed/file-backed state as the source of truth; Cloudflare AI Search/R2/D1 may provide derived indexes/search/control-plane acceleration where useful.
- Persistent self-hosted GitHub runners on this VM. DO NOT make them ephemeral.
- Multiple jobs/processes may execute concurrently on this machine.
- main is the normal working branch. Do not turn this into a PR/feature-branch-first workflow.
- Feature branches are exceptional. Temporary worktrees/throwaway branches are allowed when concurrency or risky experimentation truly needs isolation, but integrate the result back to main during the same run when safe.
- Browser Harness is explicitly out of scope.
- 9Router is not in the critical path for this implementation.
- Local Claude/Codex/OpenCode/DeepSeek traffic must NOT go through Cloudflare AI Gateway.
- Cloudflare AI Gateway may be used for Cloudflare-hosted applications when useful.

Do the work autonomously. Do not stop for ordinary design decisions. Only require me when an external OAuth/login/approval flow genuinely cannot be completed without a human. When that happens, minimize interaction: print one numbered action at a time, open the browser automatically when possible, and resume immediately afterward.

Never print secrets or tokens.

## 1. Inspect first; preserve what works

Before changing anything:

1. Inventory this Ubuntu VM: OS/version, CPU/RAM/disk; repo roots; git/gh/node/npm/pnpm/bun/python/uv/jq/curl; codex version/auth; claude; openclaw; opencode; claw-router/cr; cloudflared/wrangler; GitHub runners; relevant systemd services; get-secret or equivalent.
2. Inspect GitHub state for heymegabyte/agent-skills, the five enabled project repos, and whether heymegabyte/agent.megabyte.space already exists.
3. Clone/fetch only where needed. Do not create duplicate canonical checkouts.
4. Read heymegabyte/agent-skills before designing replacements. It already contains substantial /run-the-loop machinery. Extend it; do not create a competing framework.
5. Project-local .claude/commands/run-the-loop.md and project-owned loop state win over generic shared behavior.
6. Run read-only health checks before mutating configuration.

Use the existing repo root if one is established; otherwise use ~/repos.

## 2. Enabled repositories

Initial enabled repos:

- projectsites.dev
- megabyte.space
- gitl.ink
- deskl.ink
- bricklabor.com

Resolve exact GitHub owner/repo names from current account/org rather than guessing.

Do NOT schedule heymegabyte/agent-skills itself as a product loop.

Create a simple canonical Git-versioned enabled-repos manifest in heymegabyte/agent-skills using an existing convention if present, otherwise control-plane/enabled-repos.json. Include at minimum:
- repo full name
- local workspace path
- OpenClaw agent id
- enabled boolean
- runner labels/capabilities
- optional schedule override
- notes

Git is the source of truth.

## 3. GitHub scheduler architecture

Implement this hybrid model:

### A. Central portfolio ticker in heymegabyte/agent-skills

Create:
.github/workflows/portfolio-tick.yml

Schedule:
- 2,17,32,47 minutes of every hour
- America/New_York if current GitHub timezone-aware cron syntax is supported
- workflow_dispatch for manual runs

The central ticker may use a GitHub-hosted runner because it only dispatches work.

For now, dispatch EVERY enabled repo on EVERY tick. Do not add AI priority/table-slotting yet.

Read the enabled-repos manifest and dispatch each project's local run-the-loop workflow independently. One failed dispatch must not prevent the others. Produce a clean summary table.

Prefer a GitHub App installation token if a suitable existing App/credential exists. Otherwise use the narrowest existing cross-repo credential available via get-secret/current environment. Never echo it.

### B. Reusable shared execution workflow

Create:
.github/workflows/run-the-loop-reusable.yml

in heymegabyte/agent-skills with workflow_call and workflow_dispatch as appropriate.

This owns shared execution logic.

Verify GitHub Actions settings allow private project repos to call this public reusable workflow.

### C. Tiny local workflow in every enabled project

Each enabled project gets:
.github/workflows/run-the-loop.yml

It should:
- support workflow_dispatch
- be dispatchable by the central ticker
- call the reusable workflow in heymegabyte/agent-skills
- keep each project's run visible in that project's Actions history
- run the actual development job on this Ubuntu VM self-hosted runner pool
- avoid duplicating scheduler/business logic

Use a deliberate stable ref/tag/SHA for the reusable workflow and create a simple promotion/update mechanism. The canonical editable source remains heymegabyte/agent-skills.

This hybrid layout is intentional: central logic in agent-skills, local visibility/history in each project.

## 4. main branch behavior and worktrees

Scheduled loops work on main by default.

Do NOT impose:
- required PRs
- required feature branches
- merge queues
- branch-protection workflow as a prerequisite

If a concurrent subtask benefits from isolation:
- create a temporary git worktree
- only create a temporary branch when technically required
- perform/verify the subtask
- integrate/cherry-pick/merge back to main during the same overall loop
- remove stale worktrees/branches afterward

The normal successful final state is updated main.

## 5. Persistent self-hosted runner pool

This VM is persistent. DO NOT make runners ephemeral.

Configure an org-level GitHub self-hosted runner pool for heymegabyte if permissions allow, shared by the enabled repositories.

Because each runner process executes one job at a time, install MULTIPLE persistent runner instances on this same Ubuntu VM.

Inspect CPU/RAM first. Default target: 4 concurrent runner instances unless the machine clearly supports more/fewer.

Each runner instance:
- unique name, e.g. agent-ubuntu-01..04
- unique work directory
- persistent systemd service
- automatic restart
- accurate labels such as self-hosted, linux, x64, ubuntu, ubuntu-desktop, proxmox, persistent, agent-fleet, codex, openclaw
- add real hardware/capability labels discovered on this machine
- never encode secrets in labels

Prefer an org-level runner group such as agent-fleet.

Verify every runner appears online before proceeding.

## 6. OpenClaw persistent control plane

Install/update OpenClaw using the current official stable mechanism.

Run one persistent OpenClaw Gateway on this Ubuntu VM as a durable service with persistent state and automatic restart.

Keep the native Control UI available locally. Do not expose the raw Gateway publicly without protection.

Create/manage OpenClaw agents:
- system / portfolio
- projectsites
- megabyte
- gitlink
- desklink
- bricklabor

Bind each project agent to the correct local repository.

Cross-agent visibility should remain unrestricted under assumed ideal conditions. Do due diligence and document material implications, but do not add restrictive visibility policy merely for theoretical safety.

OpenClaw should delegate to:
- native Codex for strong system/setup/implementation/review work
- Claude Code via Claw Router for strong independent architecture/implementation/review
- OpenCode + direct DeepSeek API for high-volume/cheap parallel work

Use current native OpenClaw harness/session integration where possible instead of unnecessary shell glue.

## 7. Codex is the preferred system agent on this Ubuntu host

This machine already has an authenticated Codex CLI. Reuse that authenticated official state rather than creating an unnecessary OpenAI API-key path.

Configure OpenClaw using its current supported native Codex integration/harness if available.

Verify:
- codex CLI auth works
- OpenClaw can invoke Codex successfully
- a small OpenClaw agent turn can execute through Codex in a test repo
- existing Codex auth/sessions are not destroyed

Do not route local Codex traffic through Cloudflare AI Gateway.

Preserve this machine-level preference in durable agent-skills/system docs so future automation knows Ubuntu -> Codex is the default system/setup agent.

## 8. Three Claude Code accounts through Claw Router

Install/update:
- official Claude Code CLI
- dennisonbertram/claw-router (cr)

Configure three Claude subscription accounts:
- claude-1
- claude-2
- claude-3

Use isolated official Claude Code login state through Claw Router. Do not manufacture Anthropic API keys.

These browser/OAuth sign-ins are expected human-interaction points. When ready:
1. launch/print the exact current command for claude-1
2. pause only for successful auth
3. repeat for claude-2
4. repeat for claude-3

Minimize typing and open the browser automatically when possible.

After all three:
- cr list
- cr doctor/current equivalent
- cr usage/status
- set usage-aware policy
- set exhausted threshold around 90%
- set a reasonable current usage cache TTL after verifying current docs
- enable any supported safe auto-refresh
- relink/share global Claude settings/commands/rules/skills across isolated accounts if the installed release supports it
- verify each account independently
- verify usage-aware selection/rotation

Credentials remain on this persistent VM. Do not network-mount or duplicate these OAuth stores.

## 9. OpenClaw Claude capability backed by Claw Router

Research the CURRENT supported OpenClaw/ACP integration before implementing.

Goal:
OpenClaw -> Claude ACP/external coding harness -> Claw Router -> official Claude Code -> one of claude-1/2/3

Use the current supported adapter mechanism. If the current Claude ACP adapter supports overriding the Claude executable, create a tiny durable wrapper that points it at cr and preserves signals/exit codes without logging secrets.

Run OpenClaw's current ACP diagnostics.

Acceptance:
- OpenClaw launches a Claude task
- task runs through Claw Router
- Claw Router selects a healthy account using usage-aware routing
- task can read/write/test in a repo
- repeated jobs can use different healthy pooled accounts according to policy

Do not separately import three Claude accounts into OpenClaw if the pooled Claw Router adapter works.

## 10. OpenCode + direct DeepSeek

Install/update OpenCode.

Configure DeepSeek DIRECTLY:
DEEPSEEK_API_KEY -> OpenCode -> official DeepSeek API

Rules:
- no Cloudflare AI Gateway in this local path
- no OpenRouter intermediary unless explicitly requested later
- retrieve DEEPSEEK_API_KEY through get-secret/current secret mechanism
- never print it
- prefer env-backed configuration rather than copying the key into committed files

Select the best current stable DeepSeek coding/reasoning model supported by OpenCode after inspecting current provider docs/catalog.

Test a REAL MULTI-TURN tool-using session, not merely a hello. Ensure any reasoning/interleaved-content requirements are handled correctly.

Verify:
- OpenCode sees DeepSeek
- direct auth works
- multi-turn session works
- tool calls work
- code changes/tests work in a scratch repo
- OpenClaw can invoke OpenCode through its current supported integration/ACP path
- no local request uses Cloudflare AI Gateway

## 11. heymegabyte/agent-skills is canonical

Treat heymegabyte/agent-skills as canonical for:
- shared skills
- rules
- commands
- /run-the-loop shared machinery
- model/delegation guidance
- scheduler/reusable workflows
- machine bootstrap/runbooks where appropriate

Inspect and reuse existing sync scripts/conventions.

Global shared files may sync to host/repos, but:
- project-local run-the-loop command wins
- project-owned .claude/run-the-loop backlog/ledger/state/logs remain project-owned
- never overwrite project-owned state with global templates

Update agent-skills docs with the final Ubuntu architecture.

Add a machine health-check command for future validation.

## 12. /run-the-loop semantics

Do NOT invent a portfolio slotting system yet.

Treat /run-the-loop as the existing iterative command runnable within any repo.

Every scheduled project workflow should:
1. checkout/update safely
2. sync canonical agent-skills using the existing supported mechanism
3. ensure main is current
4. invoke the project's /run-the-loop through the project OpenClaw agent
5. let OpenClaw delegate to Codex/Claude/OpenCode as useful
6. allow multiple subprocesses/agents concurrently
7. test/deploy according to project loop rules
8. commit/push useful results to main by default
9. update project Git-backed loop ledger/state
10. write a polished GitHub Actions Job Summary

If a prior run failed halfway, the next scheduled tick recovers from current Git/GitHub/project state. Do not create a separate durable overflow queue just for this.

## 13. GitHub is the canonical run ledger

Do not create a separate primary run database.

Use:
- Git history
- GitHub Actions run history
- existing .claude/run-the-loop/LEDGER.md/log/state conventions
- per-run Markdown/JSON artifacts when useful

Each workflow run must generate a polished GITHUB_STEP_SUMMARY including, when available:
- project
- run id/link
- machine/runner slot
- duration
- initial/final commit
- clean/dirty state
- OpenClaw agent
- Codex/Claude/OpenCode delegation summary
- Claw Router pool/account alias status without secrets
- tests/checks
- deployment URLs
- files/areas changed
- outcome
- failures/retries
- next recommended work
- links to project ledger/history

Make the Markdown beautiful, concise, readable and information-dense. Use clear hierarchy/tables/details/status sections. Do not create a GitHub Issue per run.

Upload a machine-readable JSON artifact where useful.

## 14. Derived semantic memory via Cloudflare

Git remains canonical.

Where useful, implement derived memory:

Git/GitHub files -> sanitized Markdown/JSON export -> Cloudflare R2 -> Cloudflare AI Search -> agent.megabyte.space search UI / optional retrieval

Index useful material such as:
- run summaries
- important .claude/run-the-loop docs
- requirements
- architecture docs
- agent-skills docs
- durable decisions

Never index secrets, .env contents, OAuth/auth files, tokens, cookies, or private credentials.

Use D1 only where structured metadata/querying materially helps, e.g. repo registry cache, document metadata, UI state, sync cursors, run/search pointers.

Do not duplicate the entire Git ledger into D1 without a reason.

## 15. agent.megabyte.space control plane

Create GitHub repo heymegabyte/agent.megabyte.space if absent.

Build/deploy a polished Cloudflare-native TypeScript control-plane at agent.megabyte.space.

Visual direction:
- black + cyan
- sophisticated, gorgeous, information-dense but calm
- excellent typography
- tasteful motion
- responsive
- useful first, decorative second

All tasks that genuinely require a UI should converge here rather than creating random dashboards.

Progressively expose:

### Fleet
- Ubuntu VM health
- GitHub runner slots
- CPU/RAM/disk
- service health
- OpenClaw Gateway status

### Repositories
- enabled state
- last run
- next expected tick
- current commit
- dirty/clean
- running/queued/completed
- manual Run /run-the-loop
- GitHub Actions/repo/deployment links

### AI compute
- Codex health/auth presence
- Claude pool aliases/headroom/reset status from Claw Router, never secrets
- current routing policy/next account when available
- OpenCode/DeepSeek health
- delegation/model status

### Runs
- attractive history
- active jobs
- summaries/details
- tests/deployments
- filters/search
- canonical GitHub links

### Memory/search
- Cloudflare AI Search over sanitized docs/runs
- source repo/path/commit/run links
- derived search is never presented as canonical

### Controls
- enable/disable repo in Git-backed manifest
- run one repo now
- run all now
- refresh usage
- sync agent-skills
- health-check fleet
- safe service controls when justified

Mutating controls must be authenticated/auditable.

Protect the site with Cloudflare Access or existing identity. Do not expose OpenClaw admin controls anonymously.

It is acceptable to integrate/deep-link/proxy the native OpenClaw Control UI where better than reimplementing it, while keeping the Gateway protected and WebSockets functional.

## 16. Cloudflare usage rules

You may create Workers, D1, R2, KV, Durable Objects, Queues, Workflows, AI Search, Browser Run, service bindings, Access, Tunnels and related Cloudflare resources when they concretely improve:
- agent.megabyte.space
- projectsites.dev
- megabyte.space
- this development/control-plane environment

Use the simplest primitive that solves the problem.

Cloudflare AI Gateway:
- YES for Cloudflare-hosted application traffic where useful.
- NO for this Ubuntu VM's local Codex/Claude/OpenCode/DeepSeek execution path.

## 17. Security due diligence without over-regulating

Assume ideal/trusted conditions for cross-agent collaboration and keep visibility broad.

Still ensure:
- secrets are not committed
- service/config files have sane local permissions
- OAuth stores are limited to the relevant local user
- agent.megabyte.space is protected
- OpenClaw Gateway is not publicly exposed raw
- workflow tokens are reasonably scoped
- untrusted fork code does not automatically execute with privileged persistent-runner credentials

Document material risks without turning this into a policy project.

## 18. Persistence/services

Create or repair durable systemd/user services where appropriate for:
- OpenClaw Gateway
- multiple GitHub runner instances
- cloudflared tunnel if used
- any tiny helper that truly needs to be always-on

Use restart policies and sensible logging.

Keep durable state in conventional persistent locations, not temporary directories.

Add an agent-skills health-check command reporting:
- OpenClaw
- runner slots
- Codex
- Claw Router
- Claude account status
- OpenCode
- DeepSeek connectivity
- GitHub connectivity
- Cloudflare control-plane connectivity where configured
- disk/RAM
- enabled repos and checkout health

## 19. Validation gates

Do not claim completion until applicable checks pass:

1. Codex still works directly.
2. OpenClaw Gateway is persistent/healthy.
3. OpenClaw Control UI loads.
4. OpenClaw System Agent uses intended Codex route.
5. Five project agents map to correct workspaces.
6. OpenCode talks DIRECTLY to DeepSeek via DEEPSEEK_API_KEY.
7. Multi-turn DeepSeek tool-use works.
8. Claw Router contains claude-1/2/3.
9. Usage-aware status/routing works.
10. OpenClaw can launch Claude through Claw Router-backed integration.
11. Repeated Claude runs can use healthy pooled accounts.
12. Multiple persistent self-hosted runner instances are online.
13. Manual run-the-loop succeeds for one repo.
14. Multiple repos can run concurrently enough to prove runner-slot behavior.
15. Central portfolio tick dispatches every enabled repo.
16. Each project run appears in that project's Actions history.
17. Job Summary is polished and useful.
18. main receives successful loop changes according to project policy.
19. agent-skills remains canonical and project-owned loop state remains intact.
20. agent.megabyte.space deploys and is protected.
21. Derived AI Search, if created, can retrieve sanitized historical/run/docs context with source links.

## 20. Final output

At the end, print a compact operator report with:
- what was installed/changed
- all services and health
- runner names/labels
- OpenClaw agent IDs/workspaces
- Codex integration status
- Claude aliases + routing status (no credentials)
- OpenCode/DeepSeek status
- enabled repo manifest
- GitHub workflow URLs
- agent.megabyte.space URL
- Cloudflare resources created
- exact manual run command
- exact health-check command
- any remaining human-only OAuth/login action
- any known limitation

Also commit/push all appropriate repo changes.

Bias toward actually completing the setup, not merely documenting how it could be done.
