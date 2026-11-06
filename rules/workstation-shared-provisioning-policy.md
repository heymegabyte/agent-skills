---
name: workstation-shared-provisioning-policy
description: Canonical ownership, 3-tier pass-through Nexus caching, and Install Doctor source-of-truth mandate for workstations, servers, dotfiles, package managers, and system configurations.
triggers: ["install.doctor", "dotfiles", "package manager config", "system config", "nexus", "pass-through proxy", "workstation provisioning", "legion.megabyte.space", "ubuntu.megabyte.space", "chezmoi"]
---

# Workstation & Shared Provisioning Operational Policy

**Scope & Precedence**: This policy governs physical and virtual workstations, persistent agent fleet hosts (`legion.megabyte.space`, `macbook-pro`, `ubuntu.megabyte.space`), `install.doctor` provisioning recipes, and Coolify-hosted shared developer infrastructure (`coolify.megabyte.space`). The LiteLLM routing preference below applies strictly to **workstation and local/fleet AI inference**; do not propagate it into unrelated customer-facing product architectures without an explicit instruction.

## 1. Install Doctor as Canonical Source of Truth (Dotfiles, Package Managers & System Configs)

- **Install Doctor (`heymegabyte/install.doctor`) is the single source of truth** for all reusable user dotfiles, package-manager configurations, shell exports, local helper daemons, and cross-host `/etc` system templates.
- **Same-Turn Upstream Sync Mandate**: Whenever you create or modify a dotfile, package-manager config, shell profile, LaunchAgent/systemd unit, or system `/etc` file on a live machine or host repo (`legion.megabyte.space`, `ubuntu.megabyte.space`, `macbook-pro`), you **MUST update `install.doctor` in the same turn** whenever the configuration makes sense in the bootstrap project. Never leave reusable configuration changes stranded on a single host.
- **Declarative Chezmoi Templates First**: Store all package manager and user/system configurations as first-class Chezmoi templates under `home/` in `install.doctor`:
  - **npm / pnpm**: `home/dot_config/npm/private_npmrc.tmpl` + `home/symlink_dot_npmrc.tmpl`
  - **Yarn / Bun**: `home/dot_config/yarn/config.tmpl` + `home/symlink_dot_yarnrc.tmpl` + `home/dot_bunfig.toml.tmpl`
  - **Python (`pip` & `uv`)**: `home/dot_config/pip/pip.conf.tmpl` + `home/dot_config/uv/uv.toml.tmpl`
  - **Rust (`cargo`)**: `home/dot_local/share/cargo/config.toml.tmpl` + `home/dot_cargo/config.toml.tmpl`
  - **Maven & Gradle**: `home/dot_config/maven/settings.xml.tmpl` + `home/dot_m2/settings.xml.tmpl` + `home/dot_local/share/gradle/init.gradle.tmpl` + `home/dot_gradle/init.gradle.tmpl`
  - **NuGet**: `home/dot_config/NuGet/NuGet.Config.tmpl`
  - **Docker**: `home/dot_config/docker/daemon.json.tmpl` + `home/symlink_dot_docker.tmpl`
  - **Shell & Cache Hierarchy**: `home/dot_config/shell/megabyte-cache.sh.tmpl` + `home/dot_config/shell/exports.sh.tmpl`
  - **Local Proxy & System Units**: `home/dot_local/bin/executable_megabyte-local-proxy`, `home/Library/LaunchAgents/space.megabyte.local-proxy.plist.tmpl`, `home/dot_config/systemd/user/megabyte-local-proxy.service.tmpl`, `home/dot_config/system/etc/systemd/system/megabyte-local-proxy.service.tmpl`, and `home/dot_config/system/etc/apt/`
- **Ownership Split**:
  - **Install Doctor (`heymegabyte/install.doctor`)**: Declarative Chezmoi templates (`home/`), capability detection (`scripts/lib/detect_os.sh`), package/service hooks (`home/dot_local/bin/post-installx/`), and universal lifecycle scripts (`home/.chezmoiscripts/universal/`).
  - **Host Repository (`heymegabyte/legion.megabyte.space`, `heymegabyte/ubuntu.megabyte.space`)**: Host-specific hardware inventory, `snapshots/desired-state.json`, `ENVIRONMENT.md`, `RECOVERY.md`, `BACKUP-RECOVERY.md`, `ZFS-MIGRATION.md`, and verification harnesses.
  - **Central Infrastructure (`heymegabyte/coolify.megabyte.space`)**: Central hosted services on Coolify (`llm.megabyte.space` LiteLLM, `nexus.megabyte.space` / `registry.megabyte.space` Sonatype Nexus).
  - **Agent Skills (`heymegabyte/agent-skills`)**: Durable operational policies, scope boundaries, and agent routing doctrine.

## 2. Three-Tier Pass-Through Proxy & Scoped `.cache/megabyte` Architecture

1. **Three-Tier Pass-Through Caching Hierarchy**:
   - **Tier 1 — Local On-Machine Pass-Through Proxy (`http://127.0.0.1:4880`)**: Managed via `megabyte-local-proxy` (`space.megabyte.local-proxy.plist` on macOS, `megabyte-local-proxy.service` on Linux). Caches all immutable blobs and metadata in `~/.cache/megabyte/local-proxy/{blobs,meta}` for `<1ms` local hits (`X-Megabyte-Cache: HIT-LOCAL`).
   - **Tier 2 — Central Fleet Sonatype Nexus Proxy (`https://nexus.megabyte.space` & `https://registry.megabyte.space`)**: On a local cache miss, `megabyte-local-proxy` pulls through Nexus group/proxy repositories (`npm-group`, `pypi-group`, `docker-group`, `maven-public`, `go-proxy`, `cargo-proxy`, `cargo-crates-proxy`, `nuget-group`, `apt-ubuntu-proxy`, `apt-security-proxy`, `huggingface-proxy`, `github-releases-proxy`) (`X-Megabyte-Cache: MISS-VIA-NEXUS`).
   - **Tier 3 — Canonical Upstream Registry Failover**: When Nexus misses, Nexus pulls from upstream and caches for the fleet. If Nexus is unreachable, `megabyte-local-proxy` and client fallback lists automatically fail over to canonical upstream registries (`registry.npmjs.org`, `pypi.org`, `files.pythonhosted.org`, `proxy.golang.org`, `index.crates.io`, `static.crates.io`, `repo1.maven.org`, `archive.ubuntu.com`, `security.ubuntu.com`) (`X-Megabyte-Cache: MISS-VIA-UPSTREAM`).
2. **Scoped Local Caches**: Place all package, build, AI model, and disposable agent working caches under `${XDG_CACHE_HOME:-$HOME/.cache}/megabyte/{local-proxy,packages,build,ai,agents}`. Never use `/home/ubuntu/AI` as a cache directory.
3. **CI & Buildkite Package Registries**: Keep **GitHub Actions** as the canonical CI runtime (**Legion Runner 1**, **Legion Runner 2**, **Legion Runner 3** in `persistent-agent-fleet` under `legion-runners.slice`), and use `buildkite-registry-oidc.sh` for OIDC token exchange when publishing/pulling Buildkite Package Registries.

## 3. Native Firewall, Loopback Binding & Zero Trust Ingress

1. **One Native Firewall Controller per OS**: Use `ufw` on Ubuntu/Debian (with `DOCKER-USER` container-forwarding rules integrated into `/etc/ufw/after.rules` and `/etc/ufw/after6.rules`) and `socketfilterfw` on macOS via `executable_post-firewall.sh`. Never create competing host-specific firewall daemons.
2. **Loopback-Only Local Services**: Bind all management, local proxy, desktop, inference, metrics, and backup daemons (`4880`, `5900`, `8444`, `9222`, `9835`, `9898`, `11434`, `11435`, `12345`, `19999`) strictly to `127.0.0.1`.
3. **Cloudflare Tunnel Exclusivity**: Expose cross-node or remote endpoints exclusively through Cloudflare Zero Trust Tunnels with authenticated origin gates. Never introduce Tailscale or Dagger Engine.

## 4. Live Desktop Sharing & Official Cua Driver Default

1. **Share the Actual Live Physical Desktop**: On Linux GNOME Wayland workstations (`legion.megabyte.space`), share the live physical session (`:0` / `wayland-0`) via `gnome-remote-desktop` (`127.0.0.1:5900`) bridged into `Xkasmvnc :20` (`127.0.0.1:8444`) with `-AcceptSetDesktopSize 0` and `-RemoteResize=0`. Never replace the live GNOME session with an isolated XFCE desktop.
2. **Official Cua Driver by Default**: Provision the official `cua-driver` and `cua` CLI by default on every supported desktop (`has_configured_desktop` in `detect_os.sh` and `executable_post-cua-driver.sh`). Never treat an SSH shell (`SSH_TTY` / empty `DISPLAY`) as proof that a machine is headless.

## 5. GPU Split, Ollama Nodes & LiteLLM Workstation Routing

1. **Dual-GPU Workstation Split**: On hybrid Intel/AMD iGPU + NVIDIA dGPU hosts (`legion.megabyte.space`), pin desktop compositing and KasmVNC DRI3 encoding (`-drinode /dev/dri/renderD129`) to the integrated GPU and reserve the NVIDIA dGPU (`/dev/dri/renderD128`) for Ollama inference and NVIDIA Container Toolkit CDI (`nvidia.com/gpu=all`) workloads.
2. **LiteLLM Workstation Hub (`https://llm.megabyte.space`)**:
   - Preserve the 4 rotating DeepSeek API keys (`DEEPSEEK_API_KEY`, `_2`, `_3`, `_4`), Redis response cache, Langfuse, and Prometheus callbacks.
   - Enroll eligible Ollama nodes (`ollama-legion.megabyte.space`, `ollama-macbook.megabyte.space`) behind Bearer-authenticated loopback proxies (`127.0.0.1:11435` -> `127.0.0.1:11434`) via `executable_post-litellm-enroll.sh`.
   - Provide `local-llm` / `ollama-coder` (local Ollama fleet only, no external fallback) and `workstation-ai` / `hybrid-coder` (local Ollama fleet with automatic fallback to `deepseek-chat`).

## 6. Backups, Unencrypted ZFS & TPM2 Keyring Unlock

1. **Backrest + Restic + Cloudflare R2**: Run Backrest on loopback (`127.0.0.1:9898`) with Restic backing up authoritative host configuration to Cloudflare R2 (`06f8b23920`) and verify restore drills before any storage migration.
2. **Unencrypted ZFS Root/Data**: Bound ZFS ARC (`zfs_arc_max=8 GiB` on 32 GiB hosts), use `compression=zstd`, `ashift=12`, and `encryption=off` so unattended reboots never block on a disk passphrase prompt, and identify disks strictly by `/dev/disk/by-id/` and partition UUID.
3. **TPM2 Keyring Unlock**: Enable `systemd-creds` TPM2-backed GNOME keyring unlocking (bound to PCR 7 via `executable_post-tpm2-keyring.sh`) only when GNOME, keyring, `/dev/tpmrm0`, `systemd-creds`, and PAM password fallback are all verified.

## 7. Eager-Minimum vs. Lazy-Everywhere CLI Policy & Legion/Omen Host Role Matrix

1. **Eager-Minimum + Lazy-Everywhere CLI Architecture**:
   - **Eagerly Preloaded (`_preload: true` / `executable_post-legion-workstation.sh`)**:
     - **CNF Lazy-Install Substrates**: `node`/`npm`, `bun`, `deno`, `go`, `rust`/`cargo`, `python3`, `uv`/`uvx`, `mise`, `chezmoi`, `task`, `zsh`, `git`, `curl`, `jq`, `yq`, `gum`.
     - **AI Coding Agents & LSP Core**: `claude` (`@anthropic-ai/claude-code`), `opencode` (`opencode-ai`), `gemini` (`@google/gemini-cli`), `codex`, `cua-driver`, `emdash` (**never install Superset**; remove `superset` if present), `~/.agentskills` + `~/.claude` doctrine, and core LSPs (`typescript-language-server`, `pyright`, `bash-language-server`, `vscode-langservers-extracted`, `yaml-language-server`).
     - **Secrets & Encryption Stack**: `infisical`, `age`, `sops` (do not install `onlykey` or `fido2` tools unless explicitly requested).
     - **Daily Shell, Editor & Hardware Primitives**: `tmux`, `ripgrep` (`rg`), `fd`, `fzf`, `bat`, `nvim`, `vim`, `code` (VS Code), `nvtop`, `btop`, `sanoid`/`syncoid`, and `MesloLGS NF` Nerd Fonts.
   - **Lazy-Loaded on First Use (`_preload: false` via `~/.config/shell/not-found-hook.sh` + `~/.cache/cnf/shims`)**:
     - All convenience TUIs, DevSecOps linters, cloud CLIs, and specialized tools (`lazygit`, `lazydocker`, `dive`, `zellij`, `starship`, `zoxide`, `eza`, `delta`, `glow`, `atuin`, `shellcheck`, `shfmt`, `actionlint`, `yamllint`, `semgrep`, `trivy`, `gitleaks`, `hadolint`, `syft`, `grype`, `aws`, `gcloud`, `flyctl`, `kubectl`, `helm`, `k9s`, `terraform`, `tofu`, `ansible`, `rclone`, `hyperfine`, `duf`, `dust`, `procs`) lazy-load on first invocation via `~/.config/shell/not-found-hook.sh` (interactive shells) and tail-of-`PATH` `~/.cache/cnf/shims` (`executable_cnf-build-shims`, for non-interactive AI agent subshells), backed by the 3-tier `megabyte-local-proxy` (`127.0.0.1:4880` $\rightarrow$ `https://nexus.megabyte.space`).
2. **Legion (`legion.megabyte.space`), Omen (`omen.megabyte.space`) & Zen (`zen.megabyte.space`) Host Matrix**:
   - **All Linux Workstations (`legion.megabyte.space`, `omen.megabyte.space`, `zen.megabyte.space`)**: AI coding agents (`claude`, `opencode`, `agy`, `codex`, `cua-driver`, `emdash`), `~/.agentskills` + `~/.claude`, CNF substrates & lazy shims (`mise`, `node`, `bun`, `deno`, `uv`, `go`, `rust`, `chezmoi`, `task`, `not-found-hook.sh`, `~/.cache/cnf/shims`), secrets (`infisical`, `age`, `sops`), 3-tier `megabyte-local-proxy` (`127.0.0.1:4880`), ZFS `sanoid` snapshots + `bpool` `65%` / `rpool` `85%` capacity guard (`fleet-zfs-autosnap-guard`) + OpenZFS 2.4 `zpool prefetch -t brt` + recursive `atime=off` & `xattr=sa` + monthly `zpool scrub`, GPU/hardware monitors (`nvtop`, `btop`, `<host>-hw-exporter.service` on `127.0.0.1:9835`), Docker (`userland-proxy: false`, `builder.gc` 20GB, `willfarrell/autoheal:1.2.0`, `fleet-docker-gc.timer`), Grafana Alloy (`node` + `cadvisor` + `cloudflared` `:20241` + `loki.source.docker`), CrowdSec (`crowdsec-firewall-bouncer` in native `nftables` mode + `fleet-egress-guard.nft`), `zsh` + `tmux` + `rg` + `fd` + `fzf` + Nerd Fonts, `code` + `nvim` + `vim`, `flatpak` + GNOME Clipboard Indicator, and `bbr` + `vm.swappiness=100` (with ZSTD ZRAM and `zswap` disabled) sysctl tuning.
   - **Strictly `zen.megabyte.space` (ASUS ZenBook Pro `N501JW`)**: Closed-lid persistence (`HandleLidSwitch=ignore` + `IgnoreLid=true`), Intel Wireless 7260 (`wls1`) Always-Active CAM mode (`options iwlmvm power_scheme=1`, `options iwlwifi power_save=0 swcrypto=0 bt_coex_active=0 uapsd_disable=3`, `wifi.powersave=2`), `/usr/local/bin/zen-asus-ctl`, Intel HD 4600 iGPU (`renderD128` + `LIBVA_DRIVER_NAME=i965`) DRI3/VA-API offload for `Xkasmvnc :20` while reserving GTX 960M (`renderD129`) for CUDA/NVENC, Samsung SM951 AHCI PCIe SSD (`MZHPV512HDGL`) `autotrim=off` + SATA ALPM `max_performance` + rate-limited weekly `zpool trim -r 128M`, and 2 GiB ZFS ARC cap (`zfs_arc_max=2147483648`) on 16 GiB RAM.
   - **Strictly `legion.megabyte.space` Only**: Lenovo `ideapad_acpi` Battery Conservation Mode (`conservation_mode=1` via `legion-conservation-mode.service`), Lenovo Legion 9i (`16IRX9`) EC/WMI control (`legion-ec-ctl`), TI `TAS2781` smart-amplifier speaker initialization (`legion-tas2781-init.service` + `snd_soc_avs` blacklist), dedicated `rpool/ai-models` (`recordsize=1M`) dataset, RTX 4090 Ollama models (`qwen2.5:7b-instruct`, `qwen2.5-coder:14b`, `nomic-embed-text`), 3 GitHub Actions runners (`legion-runner-1..3`), and orphaned `xfce4-*` package cleanup.
