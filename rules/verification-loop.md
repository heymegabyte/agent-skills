---
name: "verification-loop"
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
last_reviewed: 2026-06-29
superseded_by: null
---

# Verification Loop

Enforce build→deploy→prod-curl/E2E→fix-forward after every code change; never report DONE without a live PROD URL assertion confirming the change.

## Deploy + Prod-E2E mandate (EVERY ADD/FIX)

Any code change to a deployable project:

1. Build
2. Deploy
3. `curl` / Playwright E2E against PROD URL targeting changed pages/routes/endpoints
4. Fix-forward (max 3 redeploys)
5. Report DONE only then

### Auth fallback chain

`wrangler whoami` failure is NOT a pass:

1. `get-secret CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` via `/Users/Apple/.local/bin/get-secret`
2. Fall back to `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL`
3. If both stale, ask user `! npx wrangler login` and resume deploy

### Two BANNED rationalizations for skipping a Cloudflare deploy

Deterministically enforced by `~/.claude/hooks/enforce-cloudflare-deploy.py` (fires on any `wrangler.*`/`cloudflare.config.ts` write). Both have skipped deploys before — neither is ever valid:

- **"env var unset ⇒ no credentials ⇒ BLOCKED_EXTERNAL."** FALSE. An unset env var proves nothing; the `get-secret` broker is the source of truth. You MUST actually run `get-secret CLOUDFLARE_API_TOKEN` (+ `CLOUDFLARE_ACCOUNT_ID`) before writing BLOCKED_EXTERNAL for ANY credential. Only after the broker AND `wrangler login` both fail is a credential truly blocked — and then cite the exact failing command as evidence. (The CF creds ARE in the broker.)
- **"greenfield / first slice ⇒ no deployed surface yet ⇒ defer deploy."** FALSE. Per the Prime Directive, the FIRST pass deploys a skeleton to `*.workers.dev`. "No URL yet" means create one now (`wrangler d1 create` → apply migrations `--remote` → `wrangler deploy` → curl live `/health`), never defer to "a later phase." A tested local build that was never deployed is NOT shipped.

### Docker (Cloudflare Worker container builds)

- Container/Durable-Object image builds require **Docker daemon running** locally.
- On macOS: `open -a "Docker Desktop"` then poll: `until docker info >/dev/null 2>&1; do sleep 2; done` (~20-40s). Deploy only after `docker info` succeeds.
- If Docker can't start (headless/CI): push → Workers Builds (CF CI has Docker) or `gh workflow run container-deploy.yaml`. Frontend R2 deploys have no Docker dependency.

### Done definition

- Local typecheck + build pass is NEVER sufficient.
- DONE requires change verified live.
- Every page relevant to add/fix MUST be HTTP-fetched post-deploy and asserted (new content present, no 5xx, security headers intact, no CSP/console errors).

## TDD

- Failing Playwright test FIRST → implement → pass.
- Real user flows: homepage → navigate via clicks/keyboard → interact → verify.
- Test account: `test@megabyte.space` (`TEST_USER_PASSWORD`).

## Code-change flow

Code change → `SPEC.md` → failing tests (PROD_URL) → implement slice-by-slice → deploy + purge → E2E 6bp → screenshot → AI vision → fix → redeploy (max 3) → DONE when all pass.

## Ralph Loop

- `SPEC.md` + `progress.md` → pick AC → test → build → deploy → verify → mark done → next
- Context >60% → save + spawn fresh
- All ACs done → recommendations loop → zero remain

## Playwright Test Agents (built-in v1.56+)

- **Planner** → Markdown plan; **Generator** → test code; **Healer** → auto-fix broken selectors
- Init: `npx playwright init-agents --loop=claude`
- v1.59+ adds `browser.bind()` for MCP interop + `page.screencast` for video receipts
- Use Healer for flaky selector recovery before manual rewrite
- MCP a11y tree testing preferred over screenshot-based assertions — more reliable, faster, catches real a11y issues

## Visual regression

- **Percy AI Visual Review** — 3× faster review, 40% OCR-based noise filter — full-page + flows
- **Chromatic** — component-level via Storybook
- **pixelmatch** (or `toHaveScreenshot()`) — local deterministic CI
- Three-tier: local → PR → deploy

## INP debugging

- `PerformanceObserver` type:`long-animation-frame` (LoAF, Chrome 123+)
- SPA per-route CWV: web-vitals v6 (API since v4) with `softNavs:true`

## Hard rules

- No screenshot = not verified
- No test = not done
- No deploy = not shipped
- Crons = monitoring ONLY

## Post-deploy smoke test (canonical 5-min recipe — run after EVERY deploy)

A build that passes `npm run check`/CI is NOT verified — local gates can't see prod headers, the live Service Worker, or real DNS. After every deploy, run this against the PROD URL. Six surfaces, each with an explicit pass condition. Any red → `wrangler rollback` + fix-forward (max 3 redeploys).

The curl-only steps (health, 404-status, donation API) run headless in ~20s and catch the most common breakages; the browser steps (offline, error-boundary, render) need real Chrome.

1. **Homepage sanity** — `GET /` → 200, paints (H1 + nav), `document.getElementById('root').innerHTML.length > 0`, ZERO red console errors. Blank/white/5xx = roll back now.
2. **404 (both halves)** — a styled 404 page AND a real `404` status. `curl -s -o /dev/null -w "%{http_code}" /this-page-does-not-exist` → **404** (a `200` is a soft-404 regression that indexes junk URLs); `curl … /<real-route>` → **200** (a real route must not false-404). In-browser: the friendly 404 renders with a working Home link.
3. **Offline (PWA)** — visit once to install the SW (DevTools → Application → Service Workers: activated), then DevTools → Network → **Offline** → reload → the **branded `offline.html`** appears (not the browser dino, not a raw error). Cached routes still load. SW often registers prod-only + idle-deferred — wait a beat before testing.
4. **Error boundary** — a render crash shows the recovery card ("Something went wrong" + Reset/Refresh/Sign-out), never a white screen. There's usually no user-facing "break me" button by design, so the authoritative gate is a unit test rendering a throwing child + asserting the fallback (`tests/unit/error-boundary.test.ts`); the manual step is a spot-check.
5. **API health + security headers** — `GET /api/health` → `{status:"ok"}`, response carries `strict-transport-security`/`content-security-policy`; `GET /api/<bogus>` → clean JSON **404** (not the SPA shell — an unmatched `/api/*` returning 200 index.html is a soft-404).
6. **Donation/conversion happy-path** — the revenue route (`/donate`) renders live counters + form; its data API (`/api/campaigns`) returns live JSON (not just static fallback); amount selection enables the pay button + mounts the payment field. **Never submit a real card in a manual pass** — a test card belongs in the E2E suite, not post-deploy smoke.

- **Soft-404 doctrine**: unknown HTML path = real 404 STATUS while still serving the SPA shell (so the styled 404 page renders). Gate the known-route set in a shared SSOT module (`known-routes.ts` / `isKnownRoute`) imported by BOTH the Worker's status-rewrite AND the build-time link validator so they can't drift; unit-test `isKnownRoute` directly (the ASSETS-fallback path often isn't reachable in the Miniflare workers pool).
- **Offline contract**: SW precaches `offline.html` at install; `networkFirstNav` falls through cached → index → shell → `offline.html` → 503. Bump `CACHE_VERSION` whenever the precache list changes.
- Per-project full runbook lives at `docs/smoke-test.md` (reference impl: njsk.org). Copy it into every deployed-surface project; tailor route names + campaign/feature specifics.

## Console-error gate

- Console errors = not done.
- Check browser console after every deploy: CSP violations, JS errors, failed resource loads.
- Fix ALL before marking complete.
- Gate captures: CSP `report-uri` violations, Trusted Types violations, deprecation warnings, `beforeunload` misuse, autoplay blocks, third-party script errors — each = build fail.
- **A perpetually-RED gate is a BLIND gate — it gets ignored, so a REAL defect hides in the noise. Keep gates green by precisely filtering BENIGN noise, never by loosening the real check.** A console/error gate that fails every run on benign-by-nature events (a cancelled request, a test-ENVIRONMENT warning, an extension's console spam) trains everyone to ignore it — and then a genuine error (a CSP violation on every load) sits undetected right next to the noise. The discipline: a gate's GREEN state must mean "clean," so that any NEW failure is a real signal. Filter benign classes PRECISELY (by their nature, not blanket): `net::ERR_ABORTED` is a CANCELLATION not a load failure (streaming `<audio>` aborts its initial GET to switch to range requests; lazy-load/img-decode cancels; fetch aborts on navigation) — ignore it, but keep failing on `ERR_FAILED`/`ERR_CONNECTION_*`/4xx-5xx; a "blocked by Playwright"/"blocked by the test runner" warning is a test-env artifact — ignore it; an extension-origin message is not your code — ignore it. And make the gate's MATCHER cover the real classes: a CSP check that only greps `style-src|font-src` misses a `connect-src` violation. Ref: bz.rocks 2026-10-25 — the SW re-fetches Google Fonts (a `connect-src` op, even though `style-src`/`font-src` already allow the fonts, so they render); `connect-src` blocked it → a console error on EVERY load, hidden because `console-clean.spec` was perpetually red on benign `ERR_ABORTED` AND its CSP sub-test only matched `style-src|font-src`. Fixed the CSP, then revived the gate (filter `ERR_ABORTED`, extend the matcher to `connect-src`, reload so the SW is active) → 12/12 green. (Also: `<link rel=preload as=audio|video>` is unsupported — browsers warn + ignore it; use `rel=prefetch` to warm the HTTP cache a `<audio>`/`<video>` reuses.) Cross-links `[[verify-against-source-of-truth]]`, `[[drift-detection]]`.
  - **The INSIDIOUS twin of the red-gate is the FALSE-GREEN gate: a test whose PREMISE a GLOBAL test-config setting silently DISABLES passes VACUOUSLY — green, but exercising nothing.** A Playwright suite's global `use` (`serviceWorkers:'block'`, `offline`, a denied permission, a forced `colorScheme`/`reducedMotion`, `javaScriptEnabled:false`) can negate the very mechanism a specific test depends on — so the test runs, asserts, and passes without ever testing its target. The classic: a CSP/`connect-src` gate whose comment says "reload so the SW is active… the SW re-fetches the fonts" — but the global `serviceWorkers:'block'` means the SW NEVER installs, so the connect-src path never fires and the gate is green-but-vacuous (the earlier "revived the gate" fix above was itself vacuous for exactly this reason). The `networkidle` waits such a test often uses ALSO hang for minutes on a streaming/polling page (never settles → repeated nav timeouts). Fix pattern: (1) scope `test.use({ <setting>: '<enabled>' })` to a nested `describe` wrapping ONLY the tests that need the premise; (2) **ASSERT the premise actually held** (`expect(swActive).toBe(true)`) so it can NEVER silently go vacuous again — a gate that can't exercise its target must go RED, not green; (3) replace `networkidle` with `domcontentloaded` + a deterministic premise-ready wait (`waitForFunction(() => registration.active)`). Re-run the test and confirm BOTH the premise-assert AND the real assert pass on known-good prod. Ref: bz.rocks 2026-10-26 — `console-clean`'s CSP-SW gate was vacuous under global `serviceWorkers:'block'` (+ an ~8-min `networkidle` hang); scoped `serviceWorkers:'allow'` to it, asserted the SW activated, switched to `domcontentloaded`+SW-ready → 6.2s, SW-active confirmed, 0 CSP violations. Cross-links `[[verify-against-source-of-truth]]` (a probe/gate that doesn't meet its condition tests the wrong thing).

## Gradual deploy verification

1. 1% → watch error rate 5 min
2. 10% → watch 5 min
3. 100%

- Auto-rollback at p99 error >1% or LCP regression >20%.

## Value extraction every prompt

- Universal → `~/.claude/`
- Project → `./.claude/` (path-scoped)
- New projects auto-scaffold `.claude/` + `SPEC.md` + tests

## TDD-First + Total-Coverage

Every clickable / form field / nav link / API endpoint / modal / keyboard shortcut / error / empty / loading state has ≥1 Playwright test against PROD.

### Inventory

- `e2e/FEATURES.md` + `e2e/COVERAGE.yml`
- CI fails if any feature lacks entry or test

### Execution

- `fullyParallel: true` × 4-8 workers × 3 browsers × 6 breakpoints
- Spawn parallel Playwright Test Agents — one per feature

### Bug + change protocol

- Bug fix = failing test first reproducing the bug
- Code change: (1) write failing test → (2) implement → (3) `npm run e2e:prod` → (4) screenshot artifacts uploaded to R2
- No feature without ≥1 test; no bug fix without ≥1 regression test

## Self-application — when this rule is N/A

- **agentskills repo** — no deployed surface; ship via `git push` + npm publish. Deploy+prod-E2E gate replaced with: `validate-packs.mjs` + `sha-pin-actions.mjs --check` + actionlint + ruff + shellcheck/shfmt + markdownlint + semgrep on every push per `lefthook.yml` + `publish.yml` CI.
- **CLI tools without webapp** — replace E2E-against-prod with unit + integration tests + manual CLI smoke.
- **Library packages (`@scope/lib`)** — replace prod-E2E with `npm run test` matrix across supported Node versions + downstream consumer integration tests.

For any repo with a deployed surface (Cloudflare Worker, Pages, Vercel, etc.), the deploy+prod-E2E mandate applies as written. No exceptions for "internal-only" or "low-traffic".

<!-- grow-ok -->
<!-- Growth justified: folded vendored Superpowers verification-before-completion discipline (2026-06-28, user request) — net-new epistemic layer, not redundancy. -->

## Folded from Superpowers — verification-before-completion

*Vendored discipline from [obra/Superpowers](https://github.com/obra/Superpowers) (MIT, Jesse Vincent). Full skill: `20-superpowers` → verification-before-completion/SKILL.md.*

- Iron law: no completion claim without FRESH verification evidence — if the proving command didn't run in THIS message, you can't claim it passes.
- Gate before any success statement: identify the proving command → run it FULL → read output + exit code → claim only WITH the evidence. A prior run or "looks correct" is not evidence.
- Applies to ALL completion language — paraphrases, synonyms, and any wording that merely IMPLIES success. Spirit over letter.
- Red-flag rationalizations = STOP-and-run, never ship: "it should work", "I'm confident", "the change is trivial / just this once", "I'm tired", "partial check is enough".
- Distinct gates need distinct output: confidence ≠ evidence; linter passing ≠ compiler/build passing.
- An agent's "success" report is not verification — independently check the VCS diff / artifacts before relaying completion. Requirements met ≠ tests pass: checklist the plan line-by-line, verify each item.
- Binding before committing, pushing, or opening a PR — each is a completion claim demanding the gate first. See `20-superpowers`.

## Fresh-hostname DNS gotcha (2026-09-29)

- Verifying a JUST-created hostname (Worker custom domain, brand-new subdomain) after having queried it while unresolved → the LOCAL negative-DNS cache serves ENOTFOUND false-RED while the edge is already live.
- Cross-check via `dig @1.1.1.1 <host>` + `curl --resolve <host>:443:<ip>` BEFORE declaring the deploy broken; flush macOS cache (`sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder`) so node/browser verifiers resolve again.
- First seen: megabyte.space Cloudflare OS launch — apex ENOTFOUND locally for minutes while 1.1.1.1 + `--resolve` proved the Access 302 live.

## Verifying a hard-to-trigger queue/DLQ consumer (2026-10-30)

- A CF Queues consumer whose trigger is HARD to produce naturally — a **dead-letter queue** (needs a job to exhaust `max_retries`), a rare message type, a crash-path — is still fully LIVE-verifiable: **push a synthetic message straight to the target queue via the CF Queues HTTP publish API** `POST /accounts/{acct}/queues/{queue_id}/messages` with `{"body": {...}}` (needs a `Queues Edit` token; the global key works). The consumer can't tell a pushed message from a real one, so this exercises it end-to-end. This is an **OPERATIONAL action, NOT a prod code backdoor** — never ship a "make-me-fail" test endpoint to force a DLQ delivery.
- Get the queue_id from `GET /accounts/{acct}/queues` (match `queue_name`). Then: push → poll the effect (a Run → `failed`, a record written) → **reconcile against the real store** (`wrangler d1 execute --remote` / direct query), never render-alone, per `[[verify-against-source-of-truth]]`.
- Sibling of the time-based-sweep recipe: synthesize a reclaim/retention sweep's stranded row via a **backdated direct-D1 INSERT**, then run the sweep. Both turn an "only happens in rare prod conditions" path into a deterministic, repeatable proof. Pair each with a smoke assertion of the READ surface (the list/diagnosis endpoint) for the half that needs no special creds.
- First seen: browse.tools WF-4b / C14.13 — the DLQ consumer that records dead-letters; a `POST …/queues/<dlq-id>/messages` push drove a real Run → `failed` + a `dead_letter_captures` row, reconciled via direct-D1 (display==store).

<!-- grow-ok -->
<!-- Growth justified: new egress gotcha (CF Zero Trust Gateway TLS inspection breaks Python verification) — a distinct cross-repo failure class, sibling to the Fresh-hostname DNS gotcha, not redundant with any existing bullet. 2026-10-31. -->

## Python HTTPS fails through Cloudflare Zero Trust Gateway TLS inspection (2026-10-31)

- **Symptom:** a Python tool (`requests` / `python-socketio` / `websocket-client` / a vendored API client) raises `SSLCertVerificationError: self-signed certificate in certificate chain` against a NORMAL public HTTPS host, while `curl` + browsers on the SAME machine succeed. socket.io masks it as a bare `unable to connect` — don't read it as "the endpoint is down" or "websocket blocked."
- **Root cause:** egress is TLS-inspected by Cloudflare Zero Trust Gateway (WARP), which re-signs TLS with an OS-trusted root (`Gateway CA - Cloudflare Managed G1 …`). That root is in the macOS keychain (so curl/Safari trust it) but ABSENT from Python's `certifi`/custom cacert bundle → Python verification fails. Confirm: `echo | openssl s_client -connect <host>:443 -servername <host> | openssl x509 -noout -issuer` → a "Gateway CA - Cloudflare Managed" issuer = inspection, not a bad host.
- **FIX — verify against the OS trust store; NEVER disable verification** (`verify=False` / `cert_reqs=CERT_NONE`), especially for a credentialed login (that sends the password over an unverified channel). macOS: `security find-certificate -a -p /System/Library/Keychains/SystemRootCertificates.keychain /Library/Keychains/System.keychain ~/Library/Keychains/login.keychain-db > ca.pem` → export `SSL_CERT_FILE=ca.pem` + `REQUESTS_CA_BUNDLE=ca.pem` (covers BOTH `requests` polling AND `websocket-client`). Ship a `*_CA_BUNDLE` override env for CI/Linux with its own bundle.
- First seen: status.megabyte.space `brand/apply-theme.sh` (Uptime Kuma theme apply via `uptime_kuma_api` socket.io) failed `unable to connect`; fixed by baking the macOS-keychain CA-bundle derivation into the runner with a `UK_CA_BUNDLE` override. Sibling of the Fresh-hostname DNS gotcha above (an egress quirk trips a Python script that `curl`/browsers survive). Cross-links `[[fetch-defaults]]` (CF challenge escalation), `[[verify-against-source-of-truth]]`.
- **Node / long-running SERVICE variant (not just one-shot scripts):** the same WARP Gateway TLS-inspection root cause hits Node — fix = **`NODE_EXTRA_CA_CERTS=<ca-bundle>`** (Node's global `fetch`/undici honors it; on a Linux VM the WARP CA is `/etc/ssl/certs/managed-warp.pem` or `/usr/local/share/ca-certificates/managed-warp.pem`; confirm with the same `openssl s_client … -issuer` → "Gateway CA - Cloudflare Managed"). Two traps a one-shot script never hits: (1) a **long-running process + its spawned child/plugin workers go STALE on WARP-CA rotation** — they keep throwing `SELF_SIGNED_CERT_IN_CHAIN` on internal HTTPS until **restarted** (a script re-reads the CA each run; a daemon doesn't), so a `systemctl restart` is the fix even when `NODE_EXTRA_CA_CERTS` is already correct; (2) it surfaces as a GENERIC app error — a UI "**Failed to fetch**" / "extensions unavailable" — not a stacktrace, so on a WARP-enrolled VM suspect this class first. **Durable prevention:** route internal service-to-service calls to the **loopback** `http://127.0.0.1:<port>` (never WARP-inspected), not the public URL. First seen: swarml.ink Paperclip `paperclipai.service` github-plugin worker → `SELF_SIGNED_CERT_IN_CHAIN` on `https://swarml.ink/api/.../labels` (~45/min), surfaced as the UI "Plugin extensions unavailable: Failed to fetch"; `systemctl --user restart paperclipai.service` cleared it (the CA env was already set — the workers were stale). 2026-10-30.
