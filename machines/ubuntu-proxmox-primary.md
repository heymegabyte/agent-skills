# Ubuntu Proxmox primary machine

## Identity and policy

- Machine ID: ubuntu-proxmox-primary
- Primary persistent Ubuntu Desktop VM hosted in Proxmox; always-on AI development host.
- Preferred local system/setup agent: official Codex CLI.
- Shared skills: heymegabyte/agent-skills. Repository-local skills may extend or override shared skills.
- Normal working branch: main. Feature branches are exceptional (conflicting concurrent work, experimental work, or intentional isolation). Never force-push main.
- GitHub owns recurring scheduling and the canonical run ledger. Schedule each enabled project at `2,17,32,47 * * * *`; each tick fires its loop once. Do not schedule agent-skills itself.
- Management plane: **Paperclip** governs the fleet (tasks · org chart · budgets · approval gates) over OpenClaw; adapters use subscription CLIs via `with-subscription-cli.sh`/`claude-pool`, never API keys. SSOT: `rules/agent-provider-policy.md` § Fleet management plane.
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
| gh / Claude / OpenClaw / OpenCode / get-secret | Not found on the inspected PATH |
| Project checkouts | None found in accessible home paths |
| Runner service state | Unknown: session cannot access systemd buses |
| Local network | Session cannot resolve api.github.com or registry.npmjs.org |
| Secret environment | GH_TOKEN, GITHUB_TOKEN, DEEPSEEK_API_KEY and Cloudflare credentials absent |
| Shared skills default branch | master (observed; not migrated) |

Do not confuse requested capabilities with installed capabilities. No runner labels, active gateways, router registrations, account headroom, DeepSeek execution or deployments have been verified.

## Confirmed project identities

- heymegabyte/projectsites.dev (main)
- heymegabyte/megabyte.space (main)
- heymegabyte/gitl.ink (main)
- heymegabyte/deskl.ink (main)
- bricklabor.com: unresolved in accessible repository discovery; do not guess an owner.

No new automation has been enabled by this inventory.

## Persistent layout and operations

Proposed paths, to create during installation:

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

## Outstanding prerequisite

The current execution session restricts local network and systemd access. Installation, cloning, runner registration, service startup and live provider tests require a host-capable session. GitHub connector access is available but does not confer local CLI authentication or host-service control. Never mark this machine operational from this inventory alone.

## Cloudflare Mesh (connector) — provisioned 2026-10-10

Reached live this session via `ssh ubuntu.megabyte.space` (user `professormanhattan`). Observed: `ens18 10.0.0.156/24`, `ip_forward=1` already set, `docker` usable WITHOUT sudo, `warp-cli` NOT installed, **passwordless sudo unavailable**.

- **ZT side DONE (reversible):** WARP Connector object `mesh-ubuntu-primary` = `6d1b8aab-7faa-4f2a-9c75-d119d0f3c67f` created via API. No route added on purpose (see hazard).
- **Design = node Mesh-IP, NOT a LAN CIDR route.** Do NOT add a `10.0.0.0/24` mesh route: it would overlap the existing `10.0.0.156/32` SSH route (tunnel `73347a40…`, default vnet) and could sever owner SSH. The connector's auto-assigned Mesh IP (100.96/12) gives identity-based reach to this box from any enrolled device, with zero routing conflict. Add scoped LAN routes later only in a DEDICATED vnet if other lab hosts are needed.
- **This Mac is ON the same LAN (`10.0.0.138/24`).** Therefore do NOT modify the Mac's WARP split-tunnel for `10.0.0.0/24` (would route local LAN through Cloudflare and break local access + this SSH path). Mesh's payoff is reaching this box by Mesh IP when the Mac is OFF-LAN.
- **Remaining step = one privileged action (needs root; no official WARP container image → do NOT run an unofficial privileged container on prod).** Run on the VM:
  ```sh
  curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg | sudo gpg --yes --dearmor -o /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflare-client.list
  sudo apt-get update && sudo apt-get install -y cloudflare-warp   # if 26.04 codename 404s, use the nearest supported
  warp-cli --accept-tos connector new "<TOKEN from dash: Zero Trust → Networks → Tunnels → mesh-ubuntu-primary>"
  warp-cli --accept-tos connect && warp-cli --accept-tos status   # expect Connected, connector mode
  ```
- **Verify (from the Mac):** the VM's Mesh IP appears in Zero Trust → My Team → Devices; `ssh <mesh-ip>` / ping reaches the box independent of LAN.
- **Rollback:** `warp-cli disconnect && sudo apt-get remove -y cloudflare-warp`; `DELETE /accounts/<acct>/warp_connector/6d1b8aab-7faa-4f2a-9c75-d119d0f3c67f`.
