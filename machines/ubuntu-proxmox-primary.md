# Ubuntu Proxmox primary machine

Machine ID: ubuntu-proxmox-primary. Persistent always-on Ubuntu Desktop VM in Proxmox; 8 logical CPUs, approximately 15 GiB RAM. Codex is preferred for system/setup. Official CLI authentication stays in its existing profiles. Main is normal; feature branches are exceptional.

## Verified operation (2026-10-09)

- Shared skills: heymegabyte/agent-skills at ~/ai/repos/agent-skills. Fifteen-minute clean fast-forward sync; repository-local skills override shared guidance.
- GitHub owns recurring schedules and canonical run history. Three independently persistent organization runners provide concurrent job slots, labels self-hosted/linux/ubuntu/persistent/proxmox-vm/agent/codex/claude/opencode. User linger enabled.
- Fleet descendants share six CPUs, MemoryHigh=8G and MemoryMax=10G; desktop/interactive agents remain outside that budget.
- OpenClaw 2026.9.8 primary Gateway: authenticated loopback http://127.0.0.1:18789. Local fleet UI http://127.0.0.1:18888 via fleet-ui-open. Publishing excluded.
- Claw Router is dennisonbertram/claw-router. Existing Codex profile authenticated; all three isolated Claude subscription profiles authenticated/enabled on 2026-10-08. Check live readiness before routing.
- OpenCode 1.18.35 configured for direct DeepSeek. Infisical get-secret provider installed; enrollment/key still unverified. Never route local CLI/DeepSeek compute through Cloudflare AI Gateway or paid OpenAI/Anthropic API fallbacks.
- UFW active with incoming deny/outgoing allow; Fail2ban active, no SSH jail because no SSH server. Proxmox guest-agent channel exists; qemu-guest-agent package was not installed at last audit.
- Cua Driver 0.34.0: local graphical-session service, skills/MCP in native clients. Accessibility calculator test passed; WinRects activation/screenshot test still requires verification after desktop logout/login. One desktop input controller at a time. No Browser Harness.

## Persistent state and recovery

~/ai/repos/<repo>, ~/ai/worktrees/<repo>/<run-id>, ~/ai/runners/worker-01..03, ~/ai/logs/<run-id>, ~/ai/state; ~/.openclaw, ~/.codex and ~/.claw-router retain official persistent state. Cross-agent visibility intentionally open on this trusted-owner host.

Private machine repository: ProfessorManhattan/ubuntu.megabyte.space at ~/ai/repos/ubuntu.megabyte.space. Hourly allowlisted non-secret snapshots commit/push changed recovery configuration. Credentials, screenshots, transcripts and personal/project files excluded; full-VM backups belong in Proxmox. Loopback VNC 127.0.0.1:5900 shares an active unlocked GNOME session; Proxmox console handles recovery. Public desktop exposure is cancelled/deferred; owner will configure deskl.ink separately. No Cloudflare desktop resources created.

Approved projects and surfaces: control-plane/fleet.json. Runtime coding contract: control-plane/RUNTIME.md. Host operations: control-plane/FLEET.md. Complete reinstall/recovery instructions: private machine README. Live observations supersede this inventory.
