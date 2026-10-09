---
name: "secrets-portable-resolution"
priority: 1
pack: "infra"
triggers:
  - "infisical"
  - "get-secret"
  - "secrets management"
  - "machine identity"
  - "secret rail"
last_reviewed: 2026-10-08
superseded_by: null
---

# Portable Secret Resolution — one interface, machine-scoped backend

`get-secret KEY` is the UNIVERSAL interface for every script + agent skill. Its BACKEND is chosen by the
machine — they are complementary rails, not competitors (Brian 2026-10-08):

| Machine / context | Backend | Notes |
|---|---|---|
| Dev Macs (this host) | **chezmoi/age** via `~/.local/bin/get-secret` | age-encrypted files in `.chezmoitemplates/secrets-<host>`; env var wins first |
| Cloudflare Workers | **CF Secrets Store** / `wrangler secret` | product runtime; bound at the edge |
| Machines WITHOUT either — Proxmox Ubuntu VM (`codexrye`), GitHub runners, DeskLink-provisioned desktops | **Infisical** | the central rail that fills the gap so those boxes have secrets at all |

**Infisical's role (don't mis-frame it):** it does NOT replace get-secret/CF Secrets Store where those
exist — it SERVES the machines that lack them. Install `bin/get-secret-infisical.sh` AS `get-secret`
(`ln -s … ~/.local/bin/get-secret`) on such a machine, and every existing `get-secret KEY` call resolves
via Infisical transparently. Same interface everywhere; the agent skills never branch on host.

## Rules
- **[MUST]** Never hardcode which backend — always call `get-secret KEY`. Precedence inside any resolver:
  process env → local rail (chezmoi / CF) → Infisical. Env always wins (uniform fast path).
- **[MUST]** Non-interactive auth only on servers/runners: Infisical **machine identities** (`INFISICAL_TOKEN`
  universal-auth) or **GitHub Actions OIDC** exchange — never `infisical login`, never a committed token.
  Least-privilege per environment (`INFISICAL_ENV` = dev|preview|prod), scoped to one `INFISICAL_PROJECT_ID`.
- **[MUST]** Secrets never land in logs, shell history, frontend bundles, or committed `.env`. The resolver
  prints the value to stdout only; diagnostics to stderr; rotation-compatible (resolve at runtime, don't cache to disk).
- **[SHOULD]** Verify `infisical secrets get` flags against the installed CLI at setup (the resolver uses the
  documented `--plain --silent --env --projectId` form). Self-hosted → `INFISICAL_API_URL`.
- The internal-agent provider policy is unchanged: this governs SECRET RESOLUTION, not which model runs —
  subscription CLIs + DeepSeek still per [[agent-provider-policy]]; `DEEPSEEK_API_KEY` may now come from
  Infisical on a runner that lacks chezmoi.

## Cross-links
- `bin/get-secret-infisical.sh` (the Infisical rail) · `~/.local/bin/get-secret` (the chezmoi rail).
- `secret-provisioning` · `secret-auto-provisioning` (provisioning flows feed whichever rail the machine uses).
- [[agent-provider-policy]] (provider auth is a separate axis) · DeskLink desktop provisioning (new boxes get the Infisical rail).
