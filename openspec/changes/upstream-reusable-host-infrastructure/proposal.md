# Proposal

## Why

Reusable infrastructure installed during host-specific work can be stranded in machine repositories, causing future hosts and disaster recovery to miss proven capabilities.

## What Changes

- Require same-turn reconciliation of all reusable host infrastructure into Install Doctor.
- Require every prompt to run a parallel upstream-integration decision: system configuration belongs in Install Doctor; reusable themes and web components belong in theme.tools / ui.theme.tools.
- Make live-GNOME KasmVNC automatic on eligible Linux GNOME desktops with at least 16 GiB RAM.
- Preserve host repositories for identity, secrets, hardware, tunnel, and workload-specific deltas only.

## Capabilities

### New Capabilities

- `reusable-host-infrastructure-upstreaming`: Defines the discovery, ownership, upstreaming, and verification contract for fleet infrastructure.
- `parallel-upstream-integration`: Defines the mandatory every-turn decision and ownership routing for reusable system and visual assets.

### Modified Capabilities

None.

## Impact

Updates workstation provisioning, remote desktop, and machine recovery rules plus Install Doctor routing expectations.
