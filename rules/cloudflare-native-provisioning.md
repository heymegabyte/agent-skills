---
last_reviewed: 2026-06-29
superseded_by: null
name: cloudflare-native-provisioning
description: Provision Cloudflare-native products (Turnstile widgets, DNS zones + records, custom domains) programmatically via the CF REST API using CLOUDFLARE_API_KEY + CLOUDFLARE_EMAIL — never hand-create in the dashboard or ask the user for keys CF itself mints.
pack: "infra"
triggers:
  - "turnstile widget"
  - "provision cloudflare"
  - "cloudflare dns zone"
  - "cloudflare custom domain"
  - "cf rest api provision"
metadata:
  type: reference
---

Cloudflare-native products are provisionable by API with the global key — do NOT ask the user for a key/secret that CF itself issues, and do NOT hand-create in the dashboard. Auth header pair: `X-Auth-Email: $CLOUDFLARE_EMAIL` + `X-Auth-Key: $CLOUDFLARE_API_KEY` (global key from `get-secret CLOUDFLARE_API_KEY`; email `blzalewski@gmail.com`). Account id: `GET /accounts`.

<!-- grow-ok -->
<!-- growth 2026-10-04: AI Gateway domain-naming convention + BYOK provisioning (Brian directive) -->

## Naming convention — derive EVERY per-project CF resource name from the project DOMAIN

**Dots → hyphens.** A project's AI Gateway (and its other per-project CF resources, by default) is named after its domain: `megabyte.space` → `megabyte-space`, `projectsites.dev` → `projectsites-dev`, `ask.megabyte.space` → `ask-megabyte-space`. Never invent ad-hoc names (`megabyte-os`, `cloudflare-megabyte-space`, `bridge`) — the domain IS the name, so the resource is self-describing and collisions are impossible. Inherited an off-convention name? Rename it (recreate under the domain-derived name → migrate BYOK secrets + code refs → delete the old) AND update the project repo's gateway ref (`AI_GATEWAY_NAME`, `aiGateway.name`) the same turn.

## AI Gateway BYOK (bring-your-own provider key) via REST API

All THREE are required — missing any one fails as a misleading `Authentication Fails (governor)` / 401:

1. **Secrets-Store secret** named `{gateway_id}_{provider_slug}_{alias}` (e.g. `megabyte-space_deepseek_default`), **scope `ai_gateway`** (NOT `workers`, NOT `ai-gateway`): `POST /accounts/{acct}/secrets_store/stores/{store}/secrets` body `[{name,value,scopes:["ai_gateway"]}]`. Provider slug = the gateway path segment (`deepseek`,`ideogram`,`openai`…). The NAME is the link — no separate provider-config call.
2. **Gateway `authentication:true` AND `store_id` set** to the Secrets-Store id — set via **`PUT`** the gateway (PATCH silently ignores `store_id`; an empty `store_id` means the gateway can't find its BYOK keys). The dashboard sets it automatically; the API does not.
3. **An "AI Gateway Run" token** in `cf-aig-authorization: Bearer` on each request (create via `POST /accounts/{acct}/tokens` with that permission group). Then `POST gateway.ai.cloudflare.com/v1/{acct}/{gw}/{provider}/…` with NO provider key — the gateway injects the stored one. Allow ~1–5 min Secrets-Store propagation before the first success.

**Unified Billing covers only OpenAI/Anthropic/Google/xAI/Groq** — DeepSeek, Ideogram, etc. are routeable but BYO-key (see `[[logo-generation]]`). Reference: ask.megabyte.space session, 2026-10-04 (`projectsites-dev` + `megabyte-space`).

<!-- growth 2026-10-27: R2 S3 credential minting recipe (grafana.megabyte.space off-site backup) -->

## R2 S3 credentials (for rclone / aws-cli / any S3 client) — mint via CF API (grafana.megabyte.space, 2026-10-27)

R2's S3 API needs an **Access Key ID + Secret Access Key** — NOT the global key, NOT a bearer token. Mint them from a CF API token with the global key:

1. **Permission group — use the BROAD one.** `Workers R2 Storage Write` (`bf7481a1826f439697cb59a20b22293e`) + `Workers R2 Storage Read` (`b4992e1108244f5d8bfbd5744320c2e1`). ⚠️ `Workers R2 Storage **Bucket Item** Write` (`2efd5506…`) **403s on PutObject/multipart** — it authenticates (not 401) but can't write objects. Fetch current ids: `GET /user/tokens/permission_groups?per_page=200` (grep R2).
2. **Mint:** `POST /user/tokens {"name":"<proj>-r2","policies":[{"effect":"allow","resources":{"com.cloudflare.api.account.<ACCT>":"*"},"permission_groups":[{"id":"bf7481a1…"},{"id":"b4992e11…"}]}]}` → `{result:{id,value}}`.
3. **DERIVE the S3 creds** (the non-obvious part): **Access Key ID = the token `id`** (32 hex); **Secret Access Key = `sha256(value)` hex** (`printf '%s' "$value" | sha256sum | cut -d' ' -f1`). This is why an existing `R2_ACCESS_KEY_ID` is 32 hex and `R2_SECRET_ACCESS_KEY` is 64 hex — same derivation.
4. **Endpoint:** `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (the CF account id IS the R2 account id). rclone env: `RCLONE_CONFIG_R2_{TYPE=s3,PROVIDER=Cloudflare,REGION=auto,ACCESS_KEY_ID,SECRET_ACCESS_KEY,ENDPOINT}`.
5. **Persist project-scoped** (`<PROJ>_R2_ACCESS_KEY_ID` / `_SECRET_ACCESS_KEY`) — `printf '%s' "$v" | chezmoi encrypt > ~/.local/share/chezmoi/home/.chezmoitemplates/secrets/<KEY>` (round-trip-verify via `get-secret <KEY>`). NEVER overwrite the shared `R2_*` keys (other projects use them; they may also be revoked).
6. **Create the bucket + test before relying on it** (propagation ~5-10s): `POST /accounts/{acct}/r2/buckets {"name":"<domain-dashed>-backups"}`, then `rclone copy f R2:<bucket>/_selftest/ && rclone ls R2:<bucket>/ && rclone delete R2:<bucket>/_selftest/`.

Note: inherited `R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY` in get-secret may be REVOKED (401) — mint fresh rather than debug the old ones.

## Turnstile (CAPTCHA) — keys are CF-minted, retrieve via API (njsk.org, 2026-06-27)

- **Create a widget** → returns the **sitekey** (public, → build var e.g. `VITE_TURNSTILE_SITEKEY`) AND the **secret** (→ `wrangler secret put TURNSTILE_SECRET_KEY`):
  `POST /accounts/{acct}/challenges/widgets` `{"name":"…","domains":["njsk.org","www.njsk.org","<worker>.workers.dev"],"mode":"managed"}`
- The create response shows the secret ONCE. If you mask/lose it, **rotate** to get a fresh value and pipe straight into wrangler (never echo it):
  `POST /accounts/{acct}/challenges/widgets/{sitekey}/rotate_secret {"invalidate_immediately":true}` → `.result.secret` → `printf '%s' "$SECRET" | npx wrangler secret put TURNSTILE_SECRET_KEY`.
- Sitekeys are PUBLIC (embedded in client HTML) — safe to commit to `.env.production`. Secrets are Worker secrets only.

## ⚠️ `routes` in wrangler.toml disables workers.dev — set `workers_dev = true` (incident njsk.org 2026-06-28)

- Declaring ANY `routes`/`custom_domain` block in `wrangler.toml` makes Wrangler default **`workers_dev = false`** — the `<worker>.<subdomain>.workers.dev` URL starts returning **404 on EVERY path** (homepage, `/api/health`, all routes). If the custom domain's zone isn't active yet (NS not flipped), workers.dev was the ONLY live URL → the whole site goes dark silently.
- **ALWAYS add `workers_dev = true` in the same edit that adds `routes`** when the custom-domain zone is still pending. Custom domains stay staged and activate on NS flip; workers.dev keeps serving meanwhile.
- **HTTP-verify the LIVE URL after ANY routing/wrangler.toml change** — not just the deploy "Success" line or an API check. `curl -s -o /dev/null -w '%{http_code}' https://<worker>.workers.dev/` MUST be 200. A deploy that succeeds can still 404 the whole site (incident: njsk.org ran dark across ~3 deploys because only the CF-API custom-domain attach was verified, never an HTTP GET of workers.dev).
- Recovery: add `workers_dev = true` → `wrangler deploy` → site 200 in seconds (`wrangler rollback` also works).

## ⚠️ Workers Static Assets: `run_worker_first` gates whether the Worker even SEES a path (questionl.ink, 2026-10-07)

With `[assets]` + a Worker, the ASSETS layer serves requests FIRST by default — and when
`run_worker_first` is a PATH LIST (e.g. `["/api/*"]`), ONLY those paths hit the Worker. Any Worker
route — or HTMLRewriter meta-injection — on a path NOT in the list silently never runs: with
`not_found_handling: "single-page-application"` the asset layer returns `index.html` instead.
**Symptom: your new route 200s but with `content-type: text/html` (the SPA shell), not your output.**

- Dynamic routes at ARBITRARY top-level paths (per-entity OG cards at `/og/:slug` via
  **workers-og** satori/resvg; per-page OG/meta injection on `/:slug` via **HTMLRewriter**) can't be
  globbed → set **`run_worker_first: true`** (Worker runs first for EVERY request). The Worker's
  `notFound` must then serve every static asset via `env.ASSETS.fetch(c.req.raw)`, and the dynamic
  branch MUST guard against asset paths (skip anything containing a `.` or `/`) so `/assets/x.js`,
  `/favicon.ico` fall straight through. Correctness then holds for every path.
- Use a negative-glob list (`["/*","!/assets/*","!*.png",…]`) only to keep static assets edge-served
  without the Worker hop; `true` is simpler and the notFound fallback makes it correct regardless.
- **HTTP-verify the content-TYPE, not just the status** — a route that returns `200 text/html` when
  you expected `image/png` means the Worker never ran (it was the asset layer's SPA fallback).

## DNS zones + records + Worker custom domains — all API

- Create zone: `POST /zones {"name":"njsk.org","account":{"id":"{acct}"},"type":"full"}` → returns `name_servers` (give those to the user for the registrar). Zone is **pending** until NS flip — records + custom domains can be PRE-STAGED on a pending zone and activate automatically when it goes active.
- Add records: `POST /zones/{zone}/dns_records {"type":"TXT","name":"…","content":"…"}`.
- Worker custom domains: add `routes = [{ pattern = "njsk.org", custom_domain = true }, …]` to `wrangler.toml` + `wrangler deploy` — CF provisions the proxied DNS + TLS for the custom domain when the zone is in the same account.

## PostHog — CLOUD-HOSTED, not self-hosted (exception to the self-host default)

- Per Brian (2026-06-27): PostHog is one of the FEW services we do NOT self-host — we use **PostHog Cloud** (US region: ingestion `https://us.i.posthog.com`, assets `https://us-assets.i.posthog.com`). Do not stand up a self-hosted PostHog.
- Public project key `phc_…` is client-embedded by design (build-env-gated `VITE_POSTHOG_KEY`); the personal API key is a secret.
- A **PostHog MCP** is connected — verify ingestion by querying the backend (`$pageview` trends), NEVER by headless browser (posthog-js bot-filters automation → 0 events is an artifact, not a bug). Cross-ref ``auto-meta-work`` § PostHog.

## SES email auth caveat

- SES domain identity (DKIM/SPF/DMARC) lives on the SENDING domain's zone. Check `BRAND.email` first — if the site domain ≠ sending domain (e.g. njsk.org site sends from @njsoupkitchen.org), the records belong on the sending domain's zone, which may differ from the site zone. Surface the mismatch to the user before staging DKIM.

## Workers assets: `binding = "ASSETS"` is NOT implicit + CF Fonts needs `font-src 'self'` (claude.megabyte.space, 2026-10-03)

- A `[assets]` block WITHOUT `binding = "ASSETS"` deploys the asset layer but exposes NO `env.ASSETS` — any worker code calling `c.env.ASSETS.fetch(...)` (typically `app.notFound`) throws → every unknown path 500s. The deploy "Success" output lists bindings — if `env.ASSETS — Assets` is absent, the fetch WILL crash. Static (non-SPA) sites with a `404.html` should also set `not_found_handling = "404-page"` (styled 404 + real 404 status), never `single-page-application`.
- Zone-level **Cloudflare Fonts** rewrites Google Fonts to FIRST-PARTY `/cf-fonts/*.woff2` — a CSP of `font-src https://fonts.gstatic.com` (no `'self'`) blocks every font with console CSP violations that curl can never see. Pair `font-src 'self' https://fonts.gstatic.com`; CF Web Analytics beacon additionally needs `script-src https://static.cloudflareinsights.com` + `connect-src https://cloudflareinsights.com`. Keep `_headers` AND the worker secureHeaders CSP in sync — the asset layer serves `/` from `_headers`, the worker serves its own routes. Hardcoded `fonts.gstatic.com/s/...` preload URLs rot (Google rotates paths) and are useless under CF Fonts — delete them.
