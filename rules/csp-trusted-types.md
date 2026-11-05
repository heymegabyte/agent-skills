---
last_reviewed: 2026-06-29
superseded_by: null
name: "csp-trusted-types"
priority: 2
pack: "security"
triggers:
  - "csp"
  - "trusted types"
  - "content security policy"
  - "nonce"
  - "strict-dynamic"
paths:
  - "concern:cloudflare-workers"
  - "concern:hono-stack"
  - "org:website_build"
  - "src/worker/**"
  - "src/web/**"
---

# CSP Level 3 + Trusted Types — Full Implementation

`[[always]]` and `[[quality-metrics]]` mandate CSP Level 3 strict-dynamic + Trusted Types on every project. This rule covers requirements, DOM sink audit, triage workflow, and deployment checklist.

## When this fires

- Every CF Workers project serving HTML (Hono + HTMLRewriter or vite-ssg)
- Any project where `[[supreme-polish]]` Agent-H runs
- Whenever a third-party script (PostHog, GA4, Intercom, Stripe.js) is added

## Browser support matrix (2026)

| Feature | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| CSP Level 3 `strict-dynamic` | 52+ | 93+ | 15.4+ | 79+ |
| `report-to` (Reporting API v1) | 90+ | 144+ (partial) | 18.4+ | 90+ |
| Trusted Types (full) | 83+ | 144+ (partial) | 18.4+ | 83+ |
| `require-trusted-types-for 'script'` | 83+ | 144+ | 18.4+ | 83+ |

- Safari 18.4+ (March 2025) closes the gap — ship Trusted Types enforced now.
- Firefox partial: violations fire and `trustedTypes.createPolicy` / `require-trusted-types-for` are supported; wrap in feature-detect (see `reference/csp-trusted-types.md`).

## Core requirements

- Generate a fresh 128-bit nonce per response via Web Crypto — NEVER cache, NEVER reuse.
- `script-src` MUST include `'nonce-${nonce}'` and `'strict-dynamic'`; no CDN URL whitelist.
- `require-trusted-types-for 'script'` is mandatory; `trusted-types` must name `app-policy`.
- Wire `cspMiddleware` as `app.use('*', ...)` — FIRST in chain, before CORS and auth.
- HTMLRewriter injects nonce on every `<script>` and `<style>` emitted by Vite.
- Ship `report-to` + `report-uri` pointing to `/csp-report` on your own Worker.
- Use `Content-Security-Policy-Report-Only` for ≥1 week before switching to enforced mode.
- Companion headers ship alongside CSP always: `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy`, `Cross-Origin-Resource-Policy`.

See `reference/csp-trusted-types.md` for the full middleware, nonce builder, HTMLRewriter transform, TT policy bootstrap, feature-detect helper, and violation receiver route.

## DOM sink violations — the dangerous APIs

Audit every use before enforcing. Run `grep -rn 'innerHTML\|outerHTML\|insertAdjacentHTML\|document.write\|setAttribute.*on\|new Function\|eval(' src/web/` — fix every hit.

| Sink | Replace with |
|---|---|
| `el.innerHTML = str` | `el.innerHTML = policy.createHTML(str)` |
| `el.outerHTML = str` | `el.outerHTML = policy.createHTML(str)` |
| `el.insertAdjacentHTML(pos, str)` | `el.insertAdjacentHTML(pos, policy.createHTML(str))` |
| `document.write(str)` | Never use; remove entirely |
| `el.setAttribute('src', url)` (dynamic) | `el.src = policy.createScriptURL(url)` |
| `el.setAttribute('on*', fn)` | Never use; use `addEventListener` |
| `new Function(str)` | Blocked by CSP; restructure |
| `eval(str)` | Blocked by CSP; restructure |
| `script.src = url` | `script.src = policy.createScriptURL(url)` |
| `navigator.serviceWorker.register(url)` | ensure the `default` policy exists FIRST (see below) |
| `new Worker(url)` / `new SharedWorker(url)` / `importScripts(url)` | same — TrustedScriptURL sink under enforced TT |

## Service worker / Worker registration under enforced TT (easy to miss)

`navigator.serviceWorker.register(scriptURL)` (and `new Worker`, `importScripts`) is a **TrustedScriptURL sink** when `require-trusted-types-for 'script'` is enforced — a plain string is **blocked** (`This document requires 'TrustedScriptURL' assignment. The action has been blocked.`) and the SW silently never registers. Two things are BOTH required:

- **`worker-src 'self'`** in the CSP. With `script-src 'strict-dynamic'` and no `worker-src`, `worker-src` falls back through `child-src` → `script-src`, and strict-dynamic blocks a plain worker-script URL. Add `worker-src 'self'` explicitly.
- **The pass-through `default` TT policy must exist on EVERY page that registers** — a string passed to the sink is coerced by `defaultPolicy.createScriptURL`. If one page (e.g. the cockpit) creates the policy but another (e.g. a marketing/landing page) doesn't, registration is blocked only on the page that lacks it. You **cannot** use a scoped named policy (e.g. `sw-url`) when the CSP is `trusted-types default` — that directive is an **allowlist permitting only the `default` name**; widen it to `trusted-types default sw-url` if you genuinely want a scoped one, otherwise reuse `default`.
- **Caught only by a real browser** — curl sees valid JS at `/sw.js`; only a Chromium load shows the TT console error + `getRegistration()` returning none. Verify registration in a headless browser after shipping, but use `getRegistration()` (NOT `serviceWorker.ready`, which can hang forever in automation when no worker activates). Ref incident: inbox.vision fire 44 — cockpit created `default` so `/app` registered, landing didn't → `/` was TT-blocked until the landing boot created the same pass-through `default` policy before `register()`.

## Violation triage workflow

1. **Check PostHog** — `SELECT properties.directive, properties.blockedUri, count() FROM events WHERE event='csp_violation' GROUP BY 1,2` via Insight.
2. **Classify by directive:**
   - `script-src` + `blob:` / `data:` → bundler emitting eval; fix rollup config (`output.inlineDynamicImports: false`).
   - `script-src` + CDN URL → check if script loaded dynamically without nonce; add nonce via HTMLRewriter.
   - `trusted-types` → DOM sink not through policy; grep + fix (§ DOM sink violations above).
   - `connect-src` → new analytics/API domain added without updating `buildCsp`.
   - `style-src` → CSS-in-JS runtime injection; add `nonce` attribute or use static styles.
3. **Never add `'unsafe-eval'`** — that disables XSS protection entirely.
4. **Never add `'unsafe-hashes'` without hashing the EXACT inline string** — regenerate via `openssl dgst -sha256 -binary <<< 'exact-string' | base64`.

## Deployment checklist

- [ ] `cspMiddleware` is `app.use('*', ...)` — not route-specific
- [ ] HTMLRewriter injects nonce on every `<script>` and `<style>` emitted by Vite
- [ ] `report-to` endpoint returns 204 in prod, logs to PostHog
- [ ] No `'unsafe-eval'` anywhere in the header
- [ ] `grep -rn "innerHTML\|insertAdjacentHTML" src/` returns 0 hits not wrapped by `createHTML`
- [ ] Playwright E2E asserts `response.headers()['content-security-policy']` contains `strict-dynamic`
- [ ] `Content-Security-Policy-Report-Only` shipped for 1 week before enforcing

## See

- `[[always]]` — CSP Level 3 strict-dynamic + nonce mandate (§ Security headers)
- `[[quality-metrics]]` — CSP gate in the quality checklist
- `[[supreme-polish]]` Agent-H — runs this implementation as part of security hardening
- ``auto-meta-work`` — analytics-specific connect-src entries (PostHog, GA4)
- `[[verification-loop]]` — browser console CSP violation = build fail
- `[[hono-api]]` — Hono middleware chain order; CSP goes first
