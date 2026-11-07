# Public Front Door — Auth Walls Never Sit on `/`

The apex of any Brian product domain is a PUBLIC, gorgeous marketing surface. An identity wall (Cloudflare Access login, Clerk sign-in, HTTP auth) as the FIRST thing a visitor sees at `/` is a defect — even for internal tools. The app lives behind `/login`; the homepage sells what's behind it.

## The rule

- `/` = public cinematic homepage: what the product is, key features, one dominant "log in / enter" CTA. WebGL/scroll-driven per `[[gorgeous-by-default]]` + skill 16.
- `/login` = the auth entry — 302 into the gated surface (subdomain or path) where the IdP handshake happens. Mid-flow login pages are fine; front-door ones are not.
- **Prefer hostname-scoped auth over path carve-outs**: gate `app.example.com` / `os.example.com` whole-host (robust, zero route enumeration) and keep the apex worker public, rather than enumerating protected paths on one host (breaks on upstream route drift, half-loads SPAs for anonymous deep links).
- Deploying a third-party app that ships "auth-on-everything" (cloudflare-os-starter, self-hosted admin tools): re-scope its auth to a subdomain + build the public apex — do NOT ship the default wall at `/`.

## Reference incident (2026-09-29, megabyte.space)

Cloudflare OS launched with the starter's default: Access app on the apex → visiting megabyte.space showed the Cloudflare Access login as the homepage. Brian: "It should just go directly to the Cloudflare OS (behind a /login and a home page with stunning WebGL…)". Fix: app → os.megabyte.space (same Access app re-pointed, AUD preserved), apex → public React+Three.js homepage with `/login` → 302 os subdomain.

## Reference incident (2026-10-01, megabyte.space) — this estate REVERSES the split (deliberate override)

Brian, seeing the OS exiled to `os.megabyte.space`: "CloudFlare OS should be at megabyte.space … make it just show up as a layer that you dismiss that only shows the first time until you press the button to go in." So FOR THIS ESTATE the apex IS the OS, and the gorgeous WebGL homepage becomes a **first-run dismissible intro layer** over it (shown once, an "Enter / go in" button dismisses it, a persisted flag suppresses it on return). This deliberately overrides the base rule here (auth effectively gates the apex; the "public homepage" is now a post-entry first-run welcome, not a standing public marketing page). The rule still holds everywhere else; do NOT "fix" megabyte.space back to the subdomain split per the 2026-09-29 incident. Overlay is injected by a WRAPPER worker in front of the OS router (never a `cloudflare-os` submodule patch). Migration tracked in the estate's `.claude/run-the-loop/BACKLOG.md` WS-11.

## Cross-links

`[[gorgeous-by-default]]` · `[[predictive-completeness]]` (a first-pass deploy should have predicted this) · `[[embarrassingly-easy-to-use]]` · `[[website-build-doctrine]]`
