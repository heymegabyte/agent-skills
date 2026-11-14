---
last_reviewed: 2026-10-29
superseded_by: null
priority: 2
pack: core
triggers:
  - "sign in"
  - "sign-in"
  - "login methods"
  - "SSO"
  - "single sign-on"
  - "Authentik"
  - "magic link"
  - "Google sign-in"
  - "GitHub sign-in"
  - "social login"
  - "auth provider for users"
paths:
  - "src/worker/**"
  - "workers/**"
  - "**/login/**"
  - "**/auth/**"
---

# SSO + Human Sign-In Standard

The DEFAULT human sign-in methods across the estate (Brian directive 2026-10-29). Public apps
offer Google + GitHub + email magic-link; non-public/internal services sign in through **Authentik**
(authentik.megabyte.space) federated to Google, jumping STRAIGHT to the Google page. This governs
WHICH sign-in methods a human gets; `[[oauth2-provider-discipline]]` governs how you BUILD OAuth,
`[[login-screen-webgl]]` how the screen LOOKS, `[[public-front-door]]` where `/login` sits.

## Public apps (customer-facing) — three methods, always

- [MUST] Every public app offers exactly these human sign-in methods: **Google**, **GitHub**, and
  **email magic-link** (passwordless). No bare username/password-only login ships.
- [SHOULD] Magic-link is the no-OAuth fallback for users without a Google/GitHub account — never the
  only method. Implement via the app's auth layer (Better Auth / the estate auth rail), not hand-rolled.
- [MUST] The three buttons live on the `/login` screen (`[[public-front-door]]` keeps the apex public,
  the app behind `/login`); style per `[[login-screen-webgl]]`.

## Non-public / internal services (Coolify, Proxmox, Grafana, admin tools) — Authentik → Google

- [MUST] Internal services authenticate through **Authentik** (authentik.megabyte.space) as the IdP,
  federated to Google via a Google OAuth **Source** — one estate login, not a per-service password.
- [MUST] **Jump STRAIGHT to the Google page** — skip Authentik's "pick a provider" chooser. Mechanisms,
  best-first: (1) point the service's login at the source-login deep-link
  `…/source/oauth/login/<google-source-slug>/?next=<app>`; (2) an identification-stage flow whose only
  source is Google with auto-redirect. Verify the real redirect lands on `accounts.google.com`, not the
  Authentik form.
- [SHOULD] Where a service can't federate through Authentik, fall back to **Google + GitHub SSO**
  directly on that service — or as close to Google-first as its auth supports. Never leave it on a
  local admin password.
- [MUST] Gate the service host at the edge too (Cloudflare Access / tunnel) — Authentik SSO is the app
  login, not a substitute for network gating (`[[public-front-door]]`, `[[remote-desktop-webtop]]`).

## Headless setup — have the admin keys FIRST

- [MUST] Before wiring SSO, confirm the admin keys exist in `get-secret` so it's configurable headlessly:
  a VALID `AUTHENTIK_API_TOKEN` (presence ≠ valid — test `GET /api/v3/core/users/me/` → 200), plus the
  Google + GitHub OAuth **client** creds (`GOOGLE_OAUTH_CLIENT_ID/SECRET`, `GITHUB_OAUTH_CLIENT_ID/SECRET`).
- [MUST] A dead/expired `AUTHENTIK_API_TOKEN` is refreshed headlessly, NOT by asking the human: Authentik
  runs on the Coolify host, so mint a named API token via `docker exec <authentik-server> ak shell`
  (create a non-expiring `intent=api` Token on a superuser), persist to the vault, round-trip-verify.
- [MUST] Only the GENUINELY vendor-minted step needs the human: registering the Google/GitHub OAuth
  **app** in the Google Cloud / GitHub console (the one-time client_id/secret). Everything downstream —
  Authentik sources, providers, applications, flows, per-service wiring — is API-provisionable + reversible,
  so do it (`[[secret-provisioning]]` source-exhaustion before asking; `[[cloudflare-native-provisioning]]`).
- [MUST] Secrets NEVER echoed/committed/logged — redacted fingerprints only (`[[secret-provisioning]]`).

## Anti-patterns

- A public app with only email+password, or missing any of Google / GitHub / magic-link.
- An internal service left on a local admin password when Authentik federation was available.
- Authentik SSO that dumps the user on the provider-chooser instead of jumping straight to Google.
- Asking the human to "create an Authentik token" when it's mintable headlessly on its host.
- Treating app-level SSO as a replacement for edge gating (CF Access / tunnel).

## Reference incident (grafana.megabyte.space, 2026-10-29)

The vault's `AUTHENTIK_API_TOKEN` 403'd (present-but-dead); Authentik (`goauthentik/server:2025.6.3`)
runs on the same Coolify host as Grafana, so a fresh `intent=api` token was minted via `ak shell`,
persisted, and verified (200) — headlessly, no human. Grafana (an internal service) is wired to
Authentik→Google per this rule; the Google/GitHub OAuth client registration is the only human step.

## Cross-links

`[[oauth2-provider-discipline]]` (how to build OAuth) · `[[auth-permissions-security-supervisor]]` ·
`[[login-screen-webgl]]` · `[[public-front-door]]` · `[[remote-desktop-webtop]]` (web-desktop CF Access
single-sign-in) · `[[secret-provisioning]]` · `[[secrets-portable-resolution]]` ·
`[[cloudflare-native-provisioning]]`.
