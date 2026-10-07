# Ubuntu Proxmox primary machine

## Identity and policy

- Machine ID: ubuntu-proxmox-primary
- Primary persistent Ubuntu Desktop VM hosted in Proxmox; always-on AI development host.
- Preferred local system/setup agent: official Codex CLI.
- Shared skills: heymegabyte/agent-skills. Repository-local skills may extend or override shared skills.
- Normal working branch: main. Feature branches are exceptional (conflicting concurrent work, experimental work, or intentional isolation). Never force-push main.
- GitHub owns recurring scheduling and the canonical run ledger. Schedule each enabled project at `2,17,32,47 * * * *`; each tick fires its loop once. Do not schedule agent-skills itself.
- Target orchestration: GitHub Actions → persistent self-hosted runner → repository /run-the-loop → OpenClaw → dennisonbertram/claw-router → official Claude Code / official Codex.
- Throughput path: OpenClaw → OpenCode → DeepSeek API directly with DEEPSEEK_API_KEY, obtained through get-secret when available.
- Official CLIs own subscription OAuth. Preserve existing Codex authentication. Prepare three isolated persistent Claude account profiles; login remains interactive.
- Never route local Claude, Codex, OpenClaw, OpenCode or DeepSeek traffic through Cloudflare AI Gateway.
- Git/files remain canonical memory. Search/indexes are derived and rebuildable.
- Control UI destination: heymegabyte/agent.megabyte.space at https://agent.megabyte.space. Publishing is excluded from the current request.
- Do not use Browser Harness, ephemeral GitHub execution hosts, PR-only policy, branch protection, or an execution-state queue.
- Cross-agent visibility should remain open; document material implications without exposing secrets.

## Observed inventory (2026-10-06)

| Item | Observed state |
| --- | --- |
| Hostname | ubuntu-desktop |
| OS | Ubuntu 26.04.1 LTS, x86_64 |
| CPU / memory | 8 logical CPUs / approximately 15 GiB RAM |
| Home disk | 136 GiB filesystem, approximately 117 GiB available |
| Home | /home/professormanhattan |
| Node / npm | v24.21.0 / 11.19.0 through Volta |
| Codex | Installed at ~/.volta/bin/codex; official login status reports ChatGPT authentication |
| GitHub connector | Authenticated as ProfessorManhattan; heymegabyte repository access confirmed |
| gh | Installed user-locally (v2.102.0); local OAuth login pending |
| Claude Code | Official native CLI v2.1.292; three isolated profiles prepared, login pending |
| OpenClaw | Official v2026.9.8; primary authenticated loopback Gateway running |
| OpenCode | v1.18.35; direct DeepSeek configured, key missing and execution unverified |
| Claw Router | dennisonbertram/claw-router; existing official Codex profile registered in place, usage-aware policy |
| get-secret | Protected local fallback installed; existing encrypted broker was not present |
| Project checkouts | Persistent checkouts for projectsites.dev, megabyte.space, deskl.ink; gitl.ink needs local GitHub login |
| Runner service state | Three independent official runner directories prepared; registration awaits local GitHub OAuth |
| Local network | Verified GitHub/npm access after full-access relaunch |
| Secret environment | GH_TOKEN, GITHUB_TOKEN, DEEPSEEK_API_KEY and Cloudflare credentials absent |
| Shared skills default branch | main (fleet implementation branch; default-branch migration awaits gh OAuth) |

Do not confuse requested capabilities with installed capabilities. Gateway health and OpenClaw → Claw Router → official Codex execution passed (reply OK). Runner registration, Claude login, account headroom, DeepSeek execution and deployments are not yet verified.

## Confirmed project identities

- heymegabyte/projectsites.dev (main)
- heymegabyte/megabyte.space (main)
- heymegabyte/gitl.ink (main)
- heymegabyte/deskl.ink (main)
- bricklabor.com: unresolved in accessible repository discovery; do not guess an owner.

No project scheduling has yet been enabled. OpenClaw and authenticated local fleet UI run as persistent user services; user linger is enabled.

## Persistent layout and operations

Persistent paths:

- ~/ai/repos/<repository>: persistent canonical checkout/cache.
- ~/ai/worktrees/<repository>/<run-id>: isolated concurrent run workspace.
- ~/ai/runners/<instance>: independently registered runner process and state.
- ~/ai/state: machine inventory and sanitized operational state.
- ~/ai/logs/<run-id>: correlated local logs.
- ~/.openclaw: primary persistent OpenClaw state.
- Existing ~/.codex: preserved official Codex profile.

Use independent runner instances for real concurrent Actions jobs, sized from measured resources. Serialize only conflicting mutation/publication for the same repository; preserve concurrency across repositories. Worktrees may use detached HEAD and fast-forward publication to main without making feature branches the default. Never reset or discard another process's dirty state.

Use a correlation ID including repository, GitHub run ID and attempt. Propagate it into orchestration, child CLI environment, logs, deployment metadata, Markdown summary and JSON artifact. Summaries must report actual objective, timeline, commits, changed files, observed agents/models, checks, deployments, warnings/failures and next actions; label unavailable values honestly.

Failures recover from actual git state, Actions history, commits, checks and repository context on the next tick. Do not introduce a durable execution queue.

## Verified project documentation

- OpenClaw: https://docs.openclaw.ai/install
- Intended Claw Router: https://github.com/dennisonbertram/claw-router
- OpenCode provider guidance: https://opencode.ai/docs/providers/

Claw Router documents isolated Claude profiles, Linux support, provider-specific routing and JSON account status. Codex authentication is delegated to the official CLI; do not copy or parse OAuth credentials to register it. Verify current installation/configuration documentation and runtime compatibility before installation. Router identity is distinct from hosted gateways with similar names.

## Current services and remaining prerequisites

- Primary OpenClaw: `openclaw-gateway.service`, http://127.0.0.1:18789, authenticated and loopback-only.
- Local control UI: `agent-fleet-ui.service`, http://127.0.0.1:18888; open using `fleet-ui-open` without printing its credential. Publishing remains excluded.
- User linger is enabled for persistent services across logout/reboot.
- Authenticated UI passed desktop/mobile Playwright journeys and API authentication/origin/repository-allowlist checks.
- Derived SQLite FTS index: `~/ai/state/search.sqlite`; git/files/GitHub remain canonical.
- Local GitHub OAuth is required for runner registration, private checkouts and local git publication. Connected GitHub app access is available separately.
- Claude logins: `fleet-account-login claude-1`, then `claude-2` and `claude-3`.
- DeepSeek key absent from inspected environment/project secret sources. Import through the existing broker, or `fleet-secret-import DEEPSEEK_API_KEY` for this VM's protected local fallback, then run the direct provider smoke test.

Canonical operation, security implications, workflow pin propagation and installation details: [control-plane/FLEET.md](../control-plane/FLEET.md). Do not mark runners or missing provider accounts operational until their live checks pass.

## Verification evidence

Five integration checks passed: safe main publication, owner checkout preservation, failure recovery, same-repository serialization, cross-repository concurrency and secret/allowlist handling. Three dashboard Playwright journeys passed. The reusable workflow passed Actionlint. Gateway → Router → official Codex native filesystem writes and structured reporting passed.

## Desktop access and machine recovery repository

- Desired private machine repository: `heymegabyte/ubuntu.megabyte.space`; local main checkout at `~/ai/repos/ubuntu.megabyte.space`, committed. Remote repository creation/push awaits local GitHub OAuth.
- Desired browser desktop: https://ubuntu.megabyte.space. Cloudflare Tunnel and Access creation await Cloudflare account/API authentication; the hostname is not yet configured by this setup.
- GNOME 50.1 official source built user-locally with its VNC backend, an IPv4-loopback socket patch and absent-descriptor initialization fixes. Ubuntu system packages preserved. Runtime at `~/ai/tools/gnome-vnc`; build dependencies at `~/ai/tools/grd-build/sysroot`.
- `ubuntu-vnc.service`: active, password-authenticated, origin `127.0.0.1:5900`; live VNC authentication, resize negotiation, actual 1280×800 framebuffer and reconnection tests passed; desktop visually verified. Shares the current desktop, requires an active/unlocked GNOME session; Proxmox remains the recovery console.
- VNC credential in the GNOME keyring and protected `~/.config/ubuntu-desktop/vnc-password`. `ubuntu-vnc-password` displays it locally; never commit it.
- `ubuntu-machine-backup.timer`: active hourly, commits changed allowlisted non-secret snapshots. Remote push remains disabled until private GitHub registration. Credentials/browser data/project files excluded.
- Cloudflare provisioner verifies a concrete owner-email Access allow policy before Tunnel/DNS publication. Three tests passed for ordering, fail-closed policy handling and DNS preservation. No Cloudflare resources were created without authentication.
- Finish interactive account access with `python3 ~/ai/repos/ubuntu.megabyte.space/scripts/finish-setup.py`.
