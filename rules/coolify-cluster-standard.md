---
name: "coolify-cluster-standard"
last_reviewed: 2026-11-04
superseded_by: null
priority: 2
pack: "infra"
triggers:
  - "coolify"
  - "omen.megabyte.space"
  - "legion.megabyte.space"
  - "zen.megabyte.space"
paths:
  - "*"
---

# Coolify Multi-Node Cluster & GPU Workload Standard (Pass-1 Mandate)

Whenever provisioning, onboarding, auditing, or modifying a Coolify server or multi-node workstation (`localhost` VM 100 `10.0.0.155`, `legion.megabyte.space` `10.0.0.143`, `omen.megabyte.space` `10.0.0.161`, `zen.megabyte.space` `10.0.0.162`), automatically apply all 28 pass-1 standards below without waiting for a "Top 30" audit prompt.

## 1. GPU Workload Placement & Routing (#1, #2, #3)
- **Never run CUDA/ROCm GPU workloads on a CPU-only control plane (`VM 100`)**:
  - **ComfyUI (#1)**: Dedicate `omen.megabyte.space` (`10.0.0.161`, NVIDIA RTX 3080 Ti **16 GiB GDDR6X VRAM**) to `comfyui` (`/opt/comfyui/docker-compose.yml`, `gpus: all`, PyTorch 2.6+ CUDA 12.4), and route `comfy.megabyte.space` to `http://10.0.0.161:8188`.
  - **LiteLLM + Ollama (#2)**: Route local LLM traffic via `routing_strategy: latency-based-routing` across **Legion** (`https://ollama-legion.megabyte.space`, RTX 4080 12 GiB) + **MacBook** (`https://ollama-macbook.megabyte.space`, M1 Pro 32 GiB) + the 4-key DeepSeek pool + Redis cache. Never route LiteLLM to a CPU-only `http://ollama:11434` container on VM 100, and keep Omen's 16 GiB GPU reserved for ComfyUI.
  - **Immich Machine Learning (#3 — Ask Before Moving)**: Do not move `immich-machine-learning` off VM 100 without explicit user confirmation of target GPU placement (Legion vs. Omen vs. CPU).

## 2. Multi-Node Onboarding, Sentinel, & CI Runners (#4, #5, #6, #7, #8, #9, #19)
- **Workstation Onboarding (#4)**: Every workstation (`legion`, `omen`, `zen`) MUST be onboarded in Coolify with `user = coolify`, shared key `legion-coolify-ed25519` (`private_key_id = 3`), LAN IP (`10.0.0.143`, `10.0.0.161`, `10.0.0.162`), UFW rule allowing `10.0.0.155 -> 22/tcp`, and `ssh_key@*` permissions `0600 9999:root`.
- **Sentinel & Traffic Analytics (#5, #25)**: Enable `is_sentinel_enabled = true`, `is_metrics_enabled = true`, and `is_traffic_analytics_enabled = true` on all functional servers.
- **Sysbox Ephemeral Runners (#6, #8)**: Install `sysbox-ce` (`sysbox-runc`) on all runner nodes (`legion`, `omen`, `zen`) and set `docker_mode = "sysbox"` with explicit resource limits (`legion`: `12` CPUs / `20g`; `omen`: `8` CPUs / `12g`; `zen`: `6` CPUs / `8g`).
- **Pre-Baked Runner Image (#7)**: Use `registry.megabyte.space/megabyte/coolify-runner:latest` (with `gh`, `nodejs` 22, `pnpm`, `bun`, `uv`, `python3`, `jq`, and Nexus proxy cache env vars pre-configured) and pre-distribute to all runner hosts along with `docker:29.8-dind`.
- **Build Concurrency (#9)**: Set `concurrent_builds` proportional to core count (`localhost`: 2, `legion`: 4, `omen`: 3, `zen`: 2).
- **Persist Coolify Source Overrides (#19)**: Mount any PHP hotfixes (such as `GithubRunnerApi.php` PAT fallback) via `/data/coolify/source/overrides/` in `/data/coolify/source/docker-compose.custom.yml` so Coolify upgrades never wipe them.

## 3. Edge Security, Traefik, & Resource Governance (#10–#18, #20)
- **`DOCKER-USER` Firewall Guard (#10)**: Maintain the `DOCKER-USER` block in `/etc/ufw/after.rules` allowing `RELATED,ESTABLISHED`, `lo`, `127.0.0.0/8`, `10.0.0.0/24` (LAN cluster nodes), `172.16.0.0/12`, and `80,443`.
- **CrowdSec + WordPress Traefik Hardening (#11, #12)**: Run `crowdsec` ingesting `/data/coolify/proxy/access.log` and maintain `/data/coolify/proxy/dynamic/wordpress-security.yaml` (`wp-security-headers`, `wp-login-ratelimit`).
- **Traefik Version Parity & Log Ignore (#13)**: Keep `coolify-proxy` on `traefik:v3.7` across all servers and ignore `proxy/access.log*` in `.gitignore`.
- **Cloudflare Access App Per Admin Surface (#14)**: Ensure `grafana.megabyte.space` (and every admin dashboard) has a dedicated Cloudflare Access app with `Owner` + `Claude Code` service token policies.
- **YAML 1.2 Merge Key Compliance (#15)**: Never place `<<: *alias` inside a YAML sequence (`- KEY=VAL`); always use mapping syntax (`KEY: VAL`) so Symfony YAML parses compose files with zero warnings.
- **Tiered Container Memory Limits & Sablier (#16, #17)**: Enforce tiered memory limits (`4g` core/AI, `2g` DB/cache, `1g` apps/exporters) and Sablier idle middleware.
- **Unified Alloy + eBPF Beyla (#18, #21)**: Run a single unified `alloy` container per host (never duplicate `alloy` + `alloy-logs`) with `beyla.ebpf` RED auto-instrumentation enabled and HTTP bound to `127.0.0.1:12345`.
- **Instance Settings (#20)**: Keep `is_backup_before_update_enabled = true`.

## 4. Observability, 3-2-1 Backups, PITR, & Infisical Cloud (#22–#24, #26–#30)
- **Grafana Renderer & DMS Heartbeat (#22)**: Configure `shm_size: 1gb` and `RENDERING_ARGS=--no-sandbox,--disable-dev-shm-usage,--disable-gpu` on `grafana-renderer`, plus `/etc/cron.d/grafana-dms-heartbeat`.
- **Uptime Kuma Hygiene (#23)**: Prune decommissioned monitors (e.g., retired Beszel `monitor.megabyte.space` or self-referential broken `docker:uptime-kuma` checks).
- **Pre-Filtered Alert Gate (#24)**: Gate automated alert-to-issue escalation through `/data/coolify/scripts/grafana-alert-gate.py` (critical/high severity, actionable allowlist, deduplication, 3/day circuit breaker).
- **Full `/opt` Stack Backup Coverage (#26)**: Include `/opt/observability`, `/opt/karakeep`, `/opt/nexus`, `/opt/alloy`, and `/opt/crowdsec` in `/data/coolify/scripts/volume-backup.py`.
- **Wasabi 3-2-1 Offsite Sync (#27)**: Mirror daily database archives to `s3://coolify-wasabi.megabyte.space/coolify-backups/` via `/data/coolify/scripts/wasabi-offsite-sync.py`.
- **PostgreSQL Continuous WAL Archiving / PITR (#28)**: Enable `wal_level = replica` and `archive_mode = on` on `coolify-db`, shipping compressed WAL segments to `s3://coolify/pitr/coolify-db/` via `/data/coolify/scripts/pitr-wal-shipper.py`.
- **Infisical Cloud Sync (#30)**: Sync Coolify control-plane `.env` and backup secrets to Infisical Cloud (`https://eu.infisical.com`) via `/data/coolify/scripts/infisical-cloud-sync.py` (never deploy a heavy self-hosted Infisical stack when Infisical Cloud credentials exist in `get-secret`).

## 5. Explicit Negative Blocklist (#29 Excluded)
- **Do NOT deploy Diun or pin floating `:latest` tags (#29)**: The estate intentionally uses rolling `:latest` tags with automated updates; never recommend or deploy Diun or replace `:latest` tags with static digests unless explicitly asked.
