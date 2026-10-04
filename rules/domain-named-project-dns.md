---
last_reviewed: 2026-10-04
superseded_by: null
name: "domain-named-project-dns"
priority: 1
pack: "core"
triggers:
  - "dns"
  - "domain"
  - "custom domain"
  - "deploy"
  - "go live"
  - "website up"
  - "workers.dev"
paths:
  - "*"
---

# Domain-Named Project → DNS Must Be Live at That Domain (first prompt)

If the project folder is a **git repo whose name is a domain** (contains a public TLD —
`deskl.ink`, `projectsites.dev`, `njsk.org`, `megabyte.space`, …), then **the folder name
IS the production domain.** Treat setting up DNS + pointing it at the deployment as part of
the task — the site must be LIVE at `https://<folder-name>` by the end of the FIRST prompt,
never left on a `*.workers.dev` / `*.pages.dev` / `*.vercel.app` / staging URL.

Extends the Prime Directive ("folder name = domain; deploy skeleton to CF first prompt") +
`[[cloudflare-native-provisioning]]` (the API HOW) + `[[website-build-doctrine]]`.

## The mandate (when the folder name is a domain)

- **The real domain is the deliverable URL.** Deploying to the platform's throwaway subdomain
  and reporting THAT is under-delivery — wire the custom domain the same turn and report the
  real one. Shipping on `workers.dev` and waiting for the user to ask "why isn't it at X?" is
  the failure this prevents.
- **Ensure the DNS is pointed correctly, end-to-end:**
  1. Is the zone in the account? `GET /zones?name=<domain>` (global key per `[[cloudflare-native-provisioning]]`). Active → attach now.
  2. **Attach the custom domain** — Worker: `routes = [{ pattern = "<domain>", custom_domain = true }]` (+ `www`), keep `workers_dev = true` so nothing goes dark during propagation. Pages/other: the platform's custom-domain API.
  3. Zone **not** in the account / not registered → create it (`POST /zones`) + surface the **nameservers** to the user as the one human step (registrar NS flip); pre-stage records + custom domain so they activate on flip.
- **Verify it's actually UP before "done":** `https://<domain>` + key routes return 200 with real content + TLS valid. Fresh-hostname TLS/DNS lags — retry, and cross-check the EDGE (`dig @1.1.1.1 <domain>`, `curl --resolve <domain>:443:<ip>`) past a stale LOCAL negative-DNS cache (flush: `sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder`) before declaring it broken.
- **"All the particulars":** favicon + `apple-touch` + `og:image` (per `[[logo-generation]]`), canonical/`og:url` on the real domain, security headers, and point tests/monitors at `https://<domain>` (not the throwaway URL).

## Reference incident (deskl.ink, 2026-10-04)

The deskl.ink app shipped + was reported on `deskl-ink-api.manhattan.workers.dev` for many
turns; Brian: *"Why are you giving me the workers.dev URL? It should be at deskl.ink."* The
`deskl.ink` zone was already active in-account — a one-edit custom-domain attach + redeploy
would have had it live at `https://deskl.ink` on the first deploy. Lesson = this rule.

## Anti-patterns

- Reporting a `*.workers.dev`/`*.pages.dev` URL as the deliverable when the folder is a real domain.
- "DNS is a later step" — it's part of the first prompt when the folder name is the domain.
- Declaring the site up from a `curl` that hit a stale local negative-DNS cache (verify via the edge).
- Leaving tests/monitors pointed at the throwaway subdomain after the custom domain is live.

## Cross-links

`[[cloudflare-native-provisioning]]` (zones/custom-domains/Turnstile API) · `[[website-build-doctrine]]` ·
`[[logo-generation]]` (favicon/og particulars) · `[[verification-loop]]` (fresh-hostname DNS gotcha) ·
`[[secret-provisioning]]` (global-key auth for the CF API).
