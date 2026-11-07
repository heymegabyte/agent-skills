---
name: cua-spaces-integration
description: Provision and operate Cua Spaces for isolated desktop automation and agent execution on eligible machines with explicit user consent and least privilege.
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Cua Spaces Integration

Offer Cua Spaces during system provisioning when the machine has at least 16 GiB RAM and a supported OS. Installation, screen/microphone permissions, Keyvault unlock, sharing, Teleport and remote control require explicit user consent.

1. Verify current requirements and licensing at `https://cua.ai/docs/spaces/guides/install` and `https://github.com/trycua/cua`.
2. Run the installer in dry-run mode before installation: `curl -fsSL https://cua.ai/install.sh | sh -s -- --dry-run`.
3. Install only after approval: `curl -fsSL https://cua.ai/install.sh | sh`.
4. Verify with `cua runtime doctor`, then `cua connect detect`, `cua connect setup --agents claude,codex,gemini,opencode --yes`, and `cua connect status`.
5. Default observation agents to `cua daemon mcp --permissions spaces:readonly`; escalate specific tools per task.
6. Never auto-unlock Keyvault or copy host credentials into a Space. Prefer platform credential stores. Exclude Linux AppImage from production provisioning because it runs without the normal sandbox.
7. Record installed version, agent connections, permissions, health and rollback commands. Refresh managed integration with `cua connect update`.

Cua is a computer-use execution substrate, not the governance plane: Paperclip assigns and budgets work; OpenClaw/ACP route it; Cua supplies isolated desktops and computer tools.
