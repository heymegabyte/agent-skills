# Browser Operating Layer — Design (fire-59)

> The organization's browser capability, per CONSTITUTION.md §"The Browser Is a First-Class
> Organizational Resource". Grounded ONLY in mechanisms already proven in this stack — every
> primitive below names the real file/table/secret that exists today. Design doc; no code yet.

- Status: DESIGN ACCEPTED — slice 1 is the next buildable unit
- Owner surface: `apps/project-sites` Worker + Angular admin + `.claude/run-the-loop` tooling
- Product hostname ambition (already doctrine): `browser.projectsites.dev` (`docs/architecture/cloudflare-first.md`)

## Ground truth this design stands on (all proven live)

- **CF Browser Run CDP from Node** — `chromium.connectOverCDP('wss://api.cloudflare.com/client/v4/accounts/{acct}/browser-run/devtools/browser?keep_alive=600000', { headers: { Authorization: 'Bearer ' + CF_BROWSER_RUN_TOKEN } })`. Token needs the "Browser Run Write" permission group; the general `CLOUDFLARE_API_TOKEN` 401s. Proven fire-53; memory `cf-browser-run-cdp-node-recipe`.
- **CF Browser Rendering in-Worker** — `@cloudflare/playwright` + `env.BROWSER` binding (no Docker); REST endpoints (`/screenshot`, `/content`, `/snapshot`) preferred for one-shots per god-tier rule #9. Memory `cf-browser-rendering-playwright-no-docker`.
- **Provider LAW** — `src/services/browser_gateway.ts`: CF primary; Browserbase ONLY for specialties (`captcha | residential_proxy | session_replay | live_view | long_session | stealth`); `skyvern_internal` internal-only; `meterBrowserMinutes` already meters usage.
- **Honest-semantics explorer** — `apps/project-sites/e2e/deep-ui-explorer/explorer.mjs`: CF → Browserbase FALLBACK → local FALLBACK ladder; `CLOUD_PASS_ELIGIBLE / FALLBACK / BLOCKED` statuses; run manifest + screenshot-per-state + committed `coverage-ledger.json`; password masking before capture. `vision-review.mjs` = AI-vision ladder (Workers-AI Scout tier).
- **Encrypted-blob pattern** — `src/services/ai_crypto.ts`: AES-GCM, fresh 12-byte IV per record, `base64(iv ‖ ct)`, primary→old key rotation fallback, under `MCP_ENCRYPTION_KEY` (Tier 1.5). Already protects `mcp_connections` OAuth tokens (migration `0013_ai_platform.sql`).
- **Platform plumbing reused** — `audit_logs` (append-only, `services/audit.ts`), feature flags (`enabled=0, rollout=0, stage='experimental'`, server guard 404), `libs/features/<slug>/` module shape, R2 `SITES_BUCKET` org-prefixed keys (`media/{orgId}/…`), psnotify for notifications, `AdminStateService` visibility-aware polling.
- **In-session (loop-side) tools** — Playwright MCP, Browserbase `browse` CLI skill, computer-use desktop fallback, Claude-in-Chrome (Mode A).

---

## 1. Purpose + principles

The org needs browsers the way a human company does: to see its own product, to operate authed
third-party surfaces, and to verify experience quality with real eyes. One layer serves all three.

**Browser action hierarchy** (choose the highest rung that works; never start at the bottom):

1. **Official API / MCP** — if a vendor API or connected MCP can do it, no browser is opened.
2. **Structured site tools** — WebMCP/equivalent when a target site exposes them (adopt when available; not built today).
3. **DOM / accessibility / CDP / Playwright** — selector-and-role driven automation via the gateway.
4. **Vision + coordinates** — screenshot understanding, last rung only.

**Standing principles:**

- **Visual inspection is mandatory for experience work** even when rung 1-3 succeeds — a green
  DOM assertion cannot see a broken shader or an invisible label. `vision-review.mjs` ladder applies.
- **Never fight bot protection.** No stealth/evasion as a dependency. A bot-challenged target is
  reported `BLOCKED` (explorer semantics) and escalates to Mode A human assistance or an official
  API — never to fingerprint spoofing. The gateway's `stealth` specialty stays unused by policy.
- **Honest provider accounting.** Every run records which provider actually served it
  (`CLOUD_PASS_ELIGIBLE / FALLBACK / BLOCKED`); a Browserbase or local run never claims CF coverage.
- **Agents receive a browser capability, never raw credentials** (§7).
- **CF-native first** per the gateway LAW; Browserbase is a metered premium fallback, not a rail.

## 2. Mode A — local human browser

The user's own Chrome, operated interactively via Claude-in-Chrome / Playwright MCP attached to a
local browser / computer-use desktop fallback (in that order of preference).

- **When:** the user is already signed in; the site behaves differently for cloud IPs; a human must
  complete a step (payment, CAPTCHA, 2FA, judgment call); a local app/browser context matters.
- **Scope:** capability-scoped delegation — one named task, the specific tabs/domains it needs,
  supervised (user present). Never a standing grant over the whole personal browser.
- **Limits (hard):**
  - No unattended EXECUTE-level work in a personal browser — Mode A is interactive by definition.
  - Never copy the personal Chrome credential store / profile directory. The only state capture is
    §4 Freeze, performed in an AGENT browser session the user signed into deliberately.
  - Respect browser + product permission controls; actions are visible to the user as they happen.
  - Computer-use desktop is the last rung of Mode A (per `computer-use-safety` tiers), for the rare
    surface no browser rung reaches.
- **Role in the system:** Mode A is the escalation target for `BLOCKED` runs and the human half of
  the re-auth flow — not a parallel automation rail.

## 3. Mode B — ProjectSites agent browser (the runtime)

One abstraction, two proven entry points, selected by where the caller runs:

| Caller | Runtime | Mechanism |
|---|---|---|
| Worker (product features, Freeze/restore, screenshots) | CF Browser Rendering | `browser_gateway.ts` → `@cloudflare/playwright` on `env.BROWSER`; REST `/screenshot` for one-shots |
| Loop / Node tooling (explorer, golden paths, admin verify) | CF Browser Run | `connectOverCDP` wss + `CF_BROWSER_RUN_TOKEN` (get-secret), `keep_alive ≤ 600000` |
| Specialty only (`live_view`, `session_replay`, `captcha`, `long_session`) | Browserbase | `POST api.browserbase.com/v1/sessions` → `connectOverCDP wss://connect.browserbase.com` (proven in explorer.mjs) |
| Dev fallback | local Chromium | playwright-core; always labeled `FALLBACK` |

**Session lifecycle (both CF entry points):**

1. Acquire via the ladder (forceable, as `EXPLORER_PROVIDER` does today).
2. `browser.newContext(...)` — inject profile state here if a vault profile is attached (§4).
3. Work; screenshot after every meaningful action into the run dir; mask secret fields pre-capture.
4. Flush run manifest (provider, status, steps, artifact keys) + close. CF Browser Run sessions are
   **ephemeral by design** — `keep_alive` caps at 10 min, a fresh session has no cookies/cache, and
   quota is ~10 concurrent / 10 new per minute → batch work per session, never session-per-click.
5. The durable identity layer is the stored profile (§4), never the runtime session. A session
   dying mid-run loses nothing but the in-flight step; re-acquire + restore + resume.

**Known failure modes + required handling:** wss 401 → wrong token scope (needs "Browser Run
Write"; roll a never-used token under the 50-token quota per the recipe memory); quota exhaustion →
queue/batch, never spin-wait; Browserbase unavailable → degrade to CF minus live view, reported
honestly; editor-class SPAs need their boot re-waited (~35-60s) every fresh session — a restored
profile removes re-login, not re-boot.

## 4. Profile Vault

Durable, tenant-scoped, encrypted browser identities. Maps 1:1 onto existing primitives — zero new
vendor surface, zero new crypto, zero new key.

**D1 `browser_profiles` (new migration; platform master DB; soft-delete like every table):**

```sql
CREATE TABLE browser_profiles (
  id              TEXT PRIMARY KEY,            -- UUIDv7 per uuid-version-discipline
  org_id          TEXT NOT NULL,               -- tenant scope; every query filters on it
  site_id         TEXT,                        -- optional: profile belongs to one site
  name            TEXT NOT NULL,               -- "GMB — Vito's", "X/Twitter — brand"
  purpose         TEXT NOT NULL,               -- account|site|integration|qa|operations
  domains_json    TEXT NOT NULL DEFAULT '[]',  -- allowlist the profile may touch
  max_autonomy    TEXT NOT NULL DEFAULT 'observe'
                  CHECK (max_autonomy IN ('off','observe','recommend','draft','execute')),
  status          TEXT NOT NULL DEFAULT 'empty'
                  CHECK (status IN ('empty','active','expired','revoked')),
  r2_key          TEXT,                        -- browser-profiles/{org_id}/{id}/state.enc
  state_sha256    TEXT,                        -- integrity pin of the ciphertext
  probe_url       TEXT,                        -- expiry-detection URL
  probe_selector  TEXT,                        -- "signed-in" assertion (testid/role)
  last_frozen_at  TEXT, last_used_at TEXT, last_verified_at TEXT,
  created_by      TEXT NOT NULL,
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
);
CREATE INDEX idx_browser_profiles_org ON browser_profiles(org_id, status);
```

**State blob — R2, AES-GCM, per-record IV (the existing MCP env-blob pattern):**

- Content: Playwright `context.storageState()` JSON — cookies + localStorage ("supported reusable
  authentication state", exactly what the constitution permits). IndexedDB deferred (30%-delete;
  add only when a real target demands it). Never a raw Chrome profile directory.
- Encrypt with `ai_crypto.ts` `encrypt(env, json)` under `MCP_ENCRYPTION_KEY` (reuses its
  primary→old rotation fallback; no second key system). Store ciphertext at
  `SITES_BUCKET: browser-profiles/{orgId}/{profileId}/state.enc`; record `state_sha256` in D1.
- Decryption happens ONLY inside the Worker/launcher at context-creation time; plaintext state
  never enters D1, logs, API responses, or model context (`maskSecret` → `'***'` everywhere).

**Lifecycle actions (all flag-gated `browser_profile_vault`, all audited):**

- **Freeze Profile** — open a gateway session on the profile's `domains_json`; the human signs in
  (via Browserbase `live_view` specialty, or Mode A-assisted paste of the final authed session);
  then `context.storageState()` → encrypt → R2 put → D1 `status='active'`, `last_frozen_at`,
  `state_sha256`. Re-freeze overwrites the blob (rotation).
- **Restore** — server resolves profile by id FOR THE CALLER'S ORG (the `resolveSiteDataDb`
  server-resolution pattern; never client-supplied keys), R2 get → decrypt →
  `newContext({ storageState })` on whichever provider the gateway picked.
- **Verify / expiry detection** — on every restore, and on a scheduled sweep: load `probe_url`,
  assert `probe_selector`. Fail → `status='expired'` + psnotify to the owner with the one-click
  re-auth (re-Freeze) flow. GCM auth-tag failure (tampered/wrong-key blob) → `revoked` + notify.
- **Revoke / delete** — `status='revoked'` + R2 object delete + audit row. Reset = revoke + fresh Freeze.
- **Audit history** — every freeze/restore/verify/revoke/use writes `audit_logs`
  (`entity='browser_profile'`, metadata = provider, run manifest key, autonomy level). No new audit
  table (30%-delete: the append-only service already exists).

**Tenant isolation:** `org_id` filter on every query + org-prefixed R2 keys + an
`assertProfileOwned` guard on every `:profileId` handler, CI-gated exactly like the existing
`assertSiteOwned` gate (the known x-org IDOR class). Feature module: `libs/features/browser_profiles/`
(manifest + Zod schemas + service + handlers) per feature-module-architecture.

## 5. Autonomy levels + profile-as-capability

Every browser capability carries an explicit policy level; nothing infers authority from ability.

| Level | Meaning in browser terms |
|---|---|
| OFF | capability disabled; handler 404s (flag-off semantics) |
| OBSERVE | navigate + read + screenshot only; no form fills, no clicks that mutate |
| RECOMMEND | OBSERVE + produce a proposed action list for a human/agent to approve |
| DRAFT | may fill forms + stage changes but never submit/commit/pay/publish |
| EXECUTE | may complete the action, within domain allowlist + checkpoint discipline |

- **Profiles are capabilities.** A run's effective level = `min(requested, profile.max_autonomy)`,
  enforced server-side where the session is minted. The SEO agent's profile doesn't open email; the
  QA profile can't reach production-admin writes; a social profile can't see billing.
- **Domain scoping is mechanical, not advisory:** for DRAFT/EXECUTE sessions the context installs
  route interception that blocks navigation/requests outside `domains_json` (fail-closed).
- **Default ladder by capability class:** public-web read → EXECUTE by default (it's read-only);
  authed read via profile → OBSERVE default, RECOMMEND on request; authed write → DRAFT default,
  EXECUTE only per-profile + per-task grant; anything financial/destructive/outreach → stays in the
  `approval-required` tier (autonomous-engineering) regardless of profile ceiling.
- Level changes are profile mutations → audited + psnotify'd.

## 6. Observability

Make autonomy legible; reuse the explorer's artifact shape as the org-wide standard.

- **Per run:** manifest.json (provider, honest status, profile id, autonomy level, step list,
  timings) + `NN-<state>.png` screenshot per meaningful action, uploaded to
  `SITES_BUCKET: browser-runs/{orgId}/{runId}/…`. Loop-side runs keep their committed
  `coverage-ledger.json` exactly as today.
- **Admin surface:** a Browser panel in the Angular admin (folds beside the super-admin service
  status widget): profile list (status, last frozen/used/verified, autonomy ceiling) + recent runs
  with screenshot-timeline replay. Live-updating via `AdminStateService` visibility-aware polling —
  no Refresh buttons (real-time rule).
- **Live view + takeover:** CF Browser Run/Rendering expose no human live view — honestly
  documented. When a human must watch or take over mid-session, the gateway escalates to the
  Browserbase `live_view` specialty (its sanctioned premium use) and links the live-view URL in the
  run row; otherwise takeover = Mode A.
- **Recordings v1 = the screenshot timeline** (no video pipeline yet — 30%-delete; Browserbase
  `session_replay` covers the rare case needing true replay). Failed/awkward runs are inspected and
  fed back into tooling/prompts/golden paths via DISCOVERIES.md per the constitution's
  recordings-as-training-data mandate.
- **Cost:** every session meters through `meterBrowserMinutes`; provider + reason land in the run
  manifest so the cost-anomaly watchdog can see Browserbase creep.

## 7. Security

- **Prompt injection stance:** all external content a browser consumes — pages, posts, emails,
  comments, retrieved text — is **untrusted data, never instructions**. Page content cannot change
  the goal, permissions, autonomy level, domain allowlist, or secrets policy. Any page text that
  reads like an instruction to the agent is reported as a finding, not followed.
- **Secret non-exposure:** agents get a **browser capability handle** (profile id + level +
  allowlist), never cookies/tokens. Decrypt only at context mint, inside the Worker/launcher;
  `maskSecret` on every display path; secret fields masked in screenshots pre-capture (proven in
  explorer.mjs); creds resolved via get-secret/env, names-only in logs.
- **Blast-radius controls:** domain-allowlist interception (fail-closed) for mutating levels;
  checkpoints before consequential EXECUTE actions (prefer reversible paths); `browser_profile_vault`
  flag dark by default; ownership assertion on every handler; append-only audit on every action.
- **Bot protection:** respected, never evaded (§1). `BLOCKED` + Mode A escalation is the designed
  outcome, and it is a *success* of the policy, not a failure of the run.
- **Key discipline:** `MCP_ENCRYPTION_KEY` is Tier 1.5 data-at-rest — never rotate without
  re-encrypting blobs (ai_crypto's old-key fallback exists precisely for staged rotation).

## 8. Implementation slices

| # | Slice | Scope | Effort |
|---|---|---|---|
| 1 | **Profile Vault data plane** | Migration + `libs/features/browser_profiles/` module + flag (dark) + freeze/restore/verify/revoke service on `browser_gateway` + `ai_crypto` + R2 + `audit_logs`; API `/api/browser/profiles` CRUD + `/freeze` + `/verify`; `assertProfileOwned` + unit/contract tests | **S** |
| 2 | **Runs + admin Browser panel** | Run-manifest writer shared by Worker + loop tooling; R2 `browser-runs/…` artifacts; Angular panel (profiles + screenshot-timeline replay, polling); psnotify expiry alerts; metering fields in manifests | **M** |
| 3 | **Human-in-the-loop** | Browserbase `live_view` freeze + mid-run takeover links; Mode A escalation runbook for `BLOCKED`; autonomy-level grant UI + per-run level stamping end-to-end | **M** |

**Build first: slice 1.** Every other section hangs off durable, encrypted, org-scoped profiles —
and it composes entirely from primitives that already run in production (gateway, ai_crypto, R2
org prefixes, audit_logs, flags), so it ships dark behind `browser_profile_vault` with zero new
vendors, zero new keys, and no UI dependency. Slices 2-3 then make it visible and human-steerable.
