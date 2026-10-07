# Ubuntu Agent Fleet Bootstrap (Codex)

You are Codex running on my persistent Ubuntu Desktop VM under Proxmox. This machine is the primary always-on development/orchestration host. You are already installed and authenticated here. Treat this host as durable: preserve useful machine-level configuration, credentials, agent state, caches, repo checkouts, services, and preferences across runs.

Today is 2026-10-06. Before relying on syntax for fast-moving tools, inspect current official docs/README files and installed versions. Prefer supported current mechanisms over stale snippets.

## Canonical implementation

The original bootstrap prompt below has been consolidated into [control-plane/FLEET.md](../control-plane/FLEET.md), the approved roster in `control-plane/fleet.json`, and `machines/ubuntu-proxmox-primary.md`. These are the current source of truth. Per-project workflows own the `2,17,32,47 * * * *` cadence; there is no central portfolio ticker or ephemeral GitHub execution host. The setup currently excludes publishing the control website.

Executable bootstrap: `bootstrap/linux.sh`. Preserve existing official authentication and secret brokers. Add separate machine profiles for additional hosts rather than duplicating this VM's identity.
