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

# Portable Secret Resolution — Infisical authority, explicit offline exceptions

`get-secret KEY` is the universal single-secret interface. Infisical is the preferred operational authority.
Product-native secret bindings remain valid delivery mechanisms, but ordinary configuration stores references,
not values.

| Machine / context | Backend | Notes |
|---|---|---|
| Dev Macs (this host) | **Infisical** via `~/.local/bin/get-secret` | Local values only for declared pre-network/offline operation |
| Cloudflare Workers | **CF Secrets Store** / `wrangler secret` | product runtime; bound at the edge |
| Machines WITHOUT either — Proxmox Ubuntu VM (`codexrye`), GitHub runners, DeskLink-provisioned desktops | **Infisical** | the central rail that fills the gap so those boxes have secrets at all |

Infisical owns operational secret lifecycle and authorization. Cloudflare/platform bindings may deliver a
referenced secret to a runtime, but must be reconciled from the same declared authority rather than becoming
an undocumented second source of truth.

## Rules
- **[MUST]** Always call `get-secret KEY` or a manifest-driven runtime wrapper. Precedence is process injection
  from the authorized launcher, then Infisical. A configured Infisical identity fails closed on denial/outage.
- **[MUST]** Local material is allowed only for an explicit machine-scoped pre-network, offline, or recovery
  dependency. It must use an allowlist, protected storage, expiry/rotation/revocation, and denied-name tests.
- **[MUST]** Non-interactive auth only on servers/runners: Infisical **machine identities** (`INFISICAL_TOKEN`
  universal-auth) or **GitHub Actions OIDC** exchange — never `infisical login`, never a committed token.
  Least privilege per workload, project, environment, fixed leaf path, action, and secret-name allowlist.
- **[MUST]** Never use organization-wide credentials, recursive parent-path export, caller-selected production
  scope, controller-store fallback, or a shared fleet identity.
- **[MUST]** Secrets never land in logs, shell history, frontend bundles, or committed `.env`. The resolver
  prints the value to stdout only; diagnostics to stderr; rotation-compatible (resolve at runtime, don't cache to disk).
- **[SHOULD]** Verify `infisical secrets get` flags against the installed CLI at setup (the resolver uses the
  documented `--plain --silent --env --projectId` form). Self-hosted → `INFISICAL_API_URL`.
- The internal-agent provider policy is unchanged: this governs SECRET RESOLUTION, not which model runs —
  subscription CLIs + DeepSeek still per [[agent-provider-policy]]; `DEEPSEEK_API_KEY` may now come from
  Infisical on a runner that lacks chezmoi.

## Cross-links
- `bin/get-secret-infisical.sh` (the Infisical rail) · `~/.local/bin/get-secret` (portable resolver).
- `secret-provisioning` · `secret-auto-provisioning` (provisioning flows feed whichever rail the machine uses).
- [[agent-provider-policy]] (provider auth is a separate axis) · DeskLink desktop provisioning (new boxes get the Infisical rail).
