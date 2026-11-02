# Workstation & Shared Provisioning Operational Policy

**Scope & Precedence**: This policy governs physical and virtual workstations, persistent agent fleet hosts (`legion.megabyte.space`, `macbook-pro`, `ubuntu.megabyte.space`), `install.doctor` provisioning recipes, and Coolify-hosted shared developer infrastructure (`coolify.megabyte.space`). The LiteLLM routing preference below applies strictly to **workstation and local/fleet AI inference**; do not propagate it into unrelated customer-facing product architectures without an explicit instruction.

## 1. Ownership Boundaries

- **Install Doctor (`megabyte-labs/install.doctor`)**: Owns generic capability detection (`scripts/lib/detect_os.sh`), package/service recipes (`home/dot_local/bin/post-installx/`), chezmoi templates (`home/.chezmoiscripts/`), and cross-platform lifecycle scripts.
- **Host Repository (`heymegabyte/legion.megabyte.space`)**: Owns measured hardware inventory, `snapshots/desired-state.json`, `ENVIRONMENT.md`, host-specific overrides, backup/recovery runbooks (`BACKUP-RECOVERY.md`), ZFS migration plans (`ZFS-MIGRATION.md`), and verification harnesses.
- **Central Infrastructure (`heymegabyte/coolify.megabyte.space`)**: Owns central hosted services on Coolify (`llm.megabyte.space` LiteLLM, `nexus.megabyte.space` / `registry.megabyte.space` Sonatype Nexus, `backrest.megabyte.space`).
- **Agent Skills (`heymegabyte/agent-skills`)**: Owns durable operational policies, scope boundaries, and agent routing doctrine.

## 2. Native Firewall, Loopback Binding & Zero Trust Ingress

1. **One Native Firewall Controller per OS**: Use `ufw` on Ubuntu/Debian (with `DOCKER-USER` container-forwarding rules integrated into `/etc/ufw/after.rules` and `/etc/ufw/after6.rules`) and `socketfilterfw` on macOS via [`executable_post-firewall.sh`](file:///Users/Apple/emdash/repositories/install.doctor/home/dot_local/bin/post-installx/executable_post-firewall.sh). Never create competing host-specific firewall daemons.
2. **Loopback-Only Local Services**: Bind all management, desktop, inference, metrics, and backup daemons (`5900`, `8444`, `9222`, `9835`, `9898`, `11434`, `11435`, `12345`, `19999`) strictly to `127.0.0.1`.
3. **Cloudflare Tunnel Exclusivity**: Expose cross-node or remote endpoints exclusively through Cloudflare Zero Trust Tunnels with authenticated origin gates. Never introduce Tailscale or Dagger Engine.

## 3. Live Desktop Sharing & Official Cua Driver Default

1. **Share the Actual Live Physical Desktop**: On Linux GNOME Wayland workstations (`legion`), share the live physical session (`:0` / `wayland-0`) via `gnome-remote-desktop` (`127.0.0.1:5900`) bridged into `Xkasmvnc :20` (`127.0.0.1:8444`) with `-AcceptSetDesktopSize 0` and `-RemoteResize=0`. Never replace the live GNOME session with an isolated XFCE desktop.
2. **Official Cua Driver by Default**: Provision the official `cua-driver` and `cua` CLI by default on every supported desktop (`has_configured_desktop` in [`detect_os.sh`](file:///Users/Apple/emdash/repositories/install.doctor/scripts/lib/detect_os.sh) and [`executable_post-cua-driver.sh`](file:///Users/Apple/emdash/repositories/install.doctor/home/dot_local/bin/post-installx/executable_post-cua-driver.sh)). Never treat an SSH shell (`SSH_TTY` / empty `DISPLAY`) as proof that a machine is headless.

## 4. GPU Split, Ollama Nodes & LiteLLM Workstation Routing

1. **Dual-GPU Workstation Split**: On hybrid Intel/AMD iGPU + NVIDIA dGPU hosts (`legion`), pin desktop compositing and KasmVNC DRI3 encoding (`-drinode /dev/dri/renderD129`) to the integrated GPU and reserve the NVIDIA dGPU (`/dev/dri/renderD128`) for Ollama inference and NVIDIA Container Toolkit CDI (`nvidia.com/gpu=all`) workloads.
2. **LiteLLM Workstation Hub (`https://llm.megabyte.space`)**:
   - Preserve the 4 rotating DeepSeek API keys (`DEEPSEEK_API_KEY`, `_2`, `_3`, `_4`), Redis response cache, Langfuse, and Prometheus callbacks.
   - Enroll eligible Ollama nodes (`ollama-legion.megabyte.space`, `ollama-macbook.megabyte.space`) behind Bearer-authenticated loopback proxies (`127.0.0.1:11435` -> `127.0.0.1:11434`) via [`executable_post-litellm-enroll.sh`](file:///Users/Apple/emdash/repositories/install.doctor/home/dot_local/bin/post-installx/executable_post-litellm-enroll.sh).
   - Provide `local-llm` / `ollama-coder` (local Ollama fleet only, no external fallback) and `workstation-ai` / `hybrid-coder` (local Ollama fleet with automatic fallback to `deepseek-chat`).

## 5. Sonatype Nexus, Scoped `.cache/megabyte` & Buildkite Registries

1. **Central Sonatype Nexus Cache**: Route `npm`, `pnpm`, `yarn`, `bun`, `pip`, `uv`, `cargo`, `go`, `maven`, `gradle`, and Docker (`registry-mirrors`) through `https://nexus.megabyte.space` and `https://registry.megabyte.space` via [`executable_post-nexus-cache.sh`](file:///Users/Apple/emdash/repositories/install.doctor/home/dot_local/bin/post-installx/executable_post-nexus-cache.sh).
2. **Scoped Local Caches**: Place all package, build, AI model, and disposable agent working caches under `${XDG_CACHE_HOME:-$HOME/.cache}/megabyte/{packages,build,ai,agents}`. Never use `/home/ubuntu/AI` as a cache directory.
3. **CI & Buildkite Package Registries**: Keep **GitHub Actions** as the canonical CI runtime (**Legion Runner 1**, **Legion Runner 2**, **Legion Runner 3** in `persistent-agent-fleet` under `legion-runners.slice`), and use [`buildkite-registry-oidc.sh`](file:///Users/Apple/emdash/repositories/legion.megabyte.space/scripts/buildkite-registry-oidc.sh) for OIDC token exchange when publishing/pulling Buildkite Package Registries.

## 6. Backups, Unencrypted ZFS & TPM2 Keyring Unlock

1. **Backrest + Restic + Cloudflare R2**: Run Backrest on loopback (`127.0.0.1:9898`) with Restic backing up authoritative host configuration to Cloudflare R2 (`06f8b23920`) and verify restore drills before any storage migration.
2. **Unencrypted ZFS Root/Data**: Bound ZFS ARC (`zfs_arc_max=8 GiB` on 32 GiB hosts), use `compression=zstd`, `ashift=12`, and `encryption=off` so unattended reboots never block on a disk passphrase prompt, and identify disks strictly by `/dev/disk/by-id/` and partition UUID.
3. **TPM2 Keyring Unlock**: Enable `systemd-creds` TPM2-backed GNOME keyring unlocking (bound to PCR 7 via [`executable_post-tpm2-keyring.sh`](file:///Users/Apple/emdash/repositories/install.doctor/home/dot_local/bin/post-installx/executable_post-tpm2-keyring.sh)) only when GNOME, keyring, `/dev/tpmrm0`, `systemd-creds`, and PAM password fallback are all verified.
