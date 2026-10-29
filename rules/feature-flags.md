---
last_reviewed: 2026-06-29
superseded_by: null
name: "feature-flags"
priority: 2
pack: "core"
triggers:
  - "feature flag"
  - "rollout"
paths:
  - "*"
---

# Feature Flags

Every feature beyond a trivial one-file edit ships behind a flag. Default: `enabled=0, rollout_percent=0, stage='experimental'`. Admin promotes through stages + dials rollout % from `/admin/feature-flags`. Nothing ships permanently-on at launch.

## STANDARD — Cloudflare Flagship is THE feature-flag service (Brian directive 2026-06-27)

> **MANDATE: use Cloudflare Flagship for ALL feature flags.** Flagship is CF's native
> feature-flag service (OpenFeature standard, KV + DO, edge-evaluated in-isolate, public
> beta 2026) — `cloudflare-lock-in-is-leverage` applies: prefer the CF-native primitive.
> Every project evaluates flags through Flagship via the native Workers binding (no HTTP).
>
> - **New builds**: define flags in Flagship from day one; bind `env.FLAGSHIP`; evaluate via
>   the OpenFeature provider. No bespoke flag worker/admin to maintain.
> - **Existing D1-flag projects**: keep the D1 engine as the **fallback + admin source-of-truth**
>   (its rich `description`/`e2e_tests`/`smoke_steps` governance columns Flagship doesn't model),
>   but wire a `FlagshipEvaluationProvider` behind the OpenFeature port that PREFERS Flagship when
>   bound and falls back to D1 on any miss. Sync all registry flags into Flagship (boolean def +
>   default variant + % rollout + stage tag). Reference impl: projectsites.dev
>   `middleware/feature-evaluation.ts` (`FlagshipEvaluationProvider` + factory) +
>   `scripts/sync-flags-to-flagship.mjs` + ADR-0033. Go-live: provision a Flagship app at
>   dash.cloudflare.com (Feature Flags), set `FLAGSHIP_API_TOKEN`/`FLAGSHIP_APP_ID`, run the sync,
>   add the `[[flagship]]` binding to `wrangler.toml`.
> Docs: https://developers.cloudflare.com/flagship/ · https://blog.cloudflare.com/flagship/

## OpenFeature provider nuances (every provider, incl. Flagship + PostHog — spec-verified 2026-10-29)

- A flag is NOT authorization or a paid entitlement — enforce those independently. Evaluate server-only flags on the SERVER; keep provider secrets server-side.
- Keep targeting context tenant/request-scoped; clear it on identity change; use stable approved IDs + safe default values; keep request-specific context OUT of a shared mutable global singleton.
- **Client/web = STATIC-context paradigm** (flags evaluated once against a cached common context per user/session) vs **server = DYNAMIC context** (targetingKey + context per evaluation) — not interchangeable (verified: openfeature.dev spec).
- **Tracking can be a no-op** — if a provider doesn't implement `track`, the call silently does nothing (verified: openfeature.dev). ASSERT real destination delivery before relying on OpenFeature exposure/experiment data.
- A provider CHANGE is not a free migration of targeting rules, assignment algorithms, or experiment history — re-validate decisions + fallback defaults + context isolation + shutdown on any swap.
- **PostHog provider:** browser identity follows posthog-js `identify`/`reset` — changing `targetingKey` alone does NOT switch the browser user; the server provider uses per-evaluation `targetingKey` as `distinctId` and is async. Dedupe exposure events when the native PostHog SDK + the OpenFeature provider coexist; separate Node/browser packages do NOT prove Workers compatibility (feature-detect). Source: posthog.com/docs/feature-flags/installation/openfeature-js.

## Architecture (D1 fallback engine — kept as admin SoT + governance layer)

Three D1 tables:

- **`feature_flags`** — `key`, `enabled` (0/1), `rollout_percent` (0-100), `stage`, `description` (full prose), `e2e_tests` (JSON paths), `smoke_steps` (markdown recipe), `owner_email`, `created_at`, `updated_at`.
- **`feature_flag_overrides`** — pin per `user` / `email` / `role`. Always wins.
- **`feature_flag_audit`** — every mutation logged: who, what, before/after JSON, when.

Worker module (`worker/feature-flags.ts`):

- `isFlagOn(env, key, user, anonId)` — server-side guard
- `resolveAllFlags(env, user, anonId)` — full set for caller
- `handlePublicFlags(req, env, user)` — GET `/api/feature-flags` (boolean per key only)
- `handleAdminListFlags(req, env)` — admin GET (full state)
- `handleAdminUpdateFlag(req, env, key)` — admin POST (toggle/rollout/stage)
- `handleAdminAddOverride(req, env, key)` — admin POST (pin-on/pin-off scope)

KV cache: 60s TTL on full flag state under `ff:state`. Admin mutations invalidate immediately. Public endpoint adds `cache-control: private, max-age=30`.

React hook (`src/lib/use-feature-flag.ts`):

- `useFeatureFlag('key')` — single boolean, re-renders when flags arrive
- `useFeatureFlags()` — record of every flag for batch UI gating
- `resetFeatureFlagsCache()` — call after admin mutates

Admin UI (`src/pages/admin/feature-flags.tsx`):

- Stage filter pills (all / experimental / beta / stable / deprecated / killswitch)
- Search by key or description
- Per-flag card: on/off toggle + rollout slider + stage-promote button + killswitch button
- Per-scope overrides panel (expandable)
- Audit timestamp + owner attribution

## Mandate (every NEW feature, no exceptions)

1. **Reserve flag key first** — add row to `feature_flags` migration w/ `enabled=0, rollout_percent=0, stage='experimental'`. Naming: lowercase + snake_case + ≤32 chars (`text_to_give`, `dafpay_chariot`, `wcag_22_manual_review`).
2. **Gate server handlers**: wrap w/ `isFlagOn(env, 'key', user, anonId)`; return 404 (not 403 — don't leak existence) when off.
3. **Gate UI components**: `if (!useFeatureFlag('key')) return null;` — never render gated UI for unflagged users.
4. **Wire admin row** — every flag auto-appears in `/admin/feature-flags` via seed migration; manual entry only for hot-patch flags post-deploy.
5. **Document owner** — `owner_email` column = team-member responsible for promotion.
6. **Full description, not a tweet** — `description` is operator's runbook entry. Covers: (a) what feature does, (b) who sees when enabled, (c) surfaces touched (routes, tables, UI), (d) failure mode when off, (e) one-line acceptance. Minimum 240 chars; cap 1200.
7. **E2E coverage column** — `e2e_tests` JSON array of spec paths exercising feature against prod URL per `e2e-testing.md`. Empty array = build fail. Every flag has at least one Playwright spec.
8. **Manual smoke-test column** — `smoke_steps` markdown ordered list a human runs in 2 min post-deploy. Minimum 3 steps.

## Stages

- **`experimental`** — `enabled=0, rollout=0`; audience: devs + Brian (override pin); promotion: code complete + unit tests pass
- **`beta`** — `enabled=1, rollout=5-25%`; audience: internal + selected admins; promotion: 1 week without P1 + axe-clean
- **`stable`** — `enabled=1, rollout=100%`; audience: everyone; promotion: 2 weeks at beta + Lighthouse ≥95
- **`deprecated`** — `enabled=1, rollout=100%`; audience: everyone (UI shows EOL banner); promotion: replacement shipped, sunsetting 30d
- **`killswitch`** — `enabled=0`; audience: nobody; trigger: P1 incident; resolution required before un-killing

Promotion = button in admin UI (`Promote → beta`); rule is policy, not mechanism.

## Experimentation discipline (a flag at partial rollout IS an A/B test — run it honestly)

When a flag's `rollout_percent` is set to MEASURE impact (not just dark-launch), it's an experiment — run it with discipline, not vibes. Most of this is decided BEFORE you dial rollout up. (Added 2026-10-25, estate-upgrade audit — `[[estate-upgrade-audit]]`.)

- **Design before launch (the pre-registration):** a falsifiable hypothesis → ONE **primary metric / OEC** fixed up front (stops cherry-picking a metric that moved by chance) → **1–2 guardrail metrics** (non-inferiority, independent of the primary, measurable in-window, tied to a real cost — power decays `0.8^G`, so cap at ~2) → an **MDE** = the smallest lift worth SHIPPING (never whatever makes the sample convenient; a 2% MDE needs ~25× a 10% MDE's sample) → **sample size + end-date** from a power analysis (α=0.05, power=80%) → fixed randomization unit → the analysis plan.
- **Don't PEEK.** Continuously eyeballing a fixed-horizon test inflates the false-positive rate to 20–40% (the #1 statistical sin). Either hold to the pre-set sample + end-date, OR use **sequential testing** (always-valid confidence sequences / O'Brien-Fleming group-sequential, ~20–30% more sample) that makes peeking valid. Run a **sample-ratio-mismatch (SRM)** check during — an off split invalidates the result.
- **Expect to LOSE — that's the point.** ~10% of experiments win at scale (Netflix/Google/Booking ≈10%, Airbnb Search ≈8%, Microsoft ≈33%); ~1 in 3 show meaningful lift for a young product; at a 10% base rate ~1 in 5 "wins" are false positives. Be skeptical of a HUGE win (Twyman's law — usually an SRM / logging bug, not a breakthrough). Velocity beats cleverness: more honest tests → more of the rare real wins.
- **Holdouts for DURABLE gains, selectively:** short tests catch a novelty mirage (week-1 lift → week-6 flatline); use a long-term holdout only with a clear objective (burn-in / slow discovery), not as a reflex — cumulative real impact is almost always < the sum of the point estimates.
- **Ship / kill / iterate:** shipping FLAT is an error ("not significantly worse" ≠ safe to ship); killing is normal — celebrate **learning**, not shipping; a losing variant may be poor EXECUTION not a bad idea → iterate. Record every result (institutional memory); a winner that never gets implemented is the #1 program-failure mode. Decide on the **revenue/business OEC**, never a proxy.
- **Vehicle vs analysis:** the flag's `stage`/`rollout_percent` delivers the split; the primary + guardrail metrics live in analytics (PostHog/GA per `[[production-observability-default-on]]`). Pairs with `[[autonomous-growth-orchestrator]]`'s measure→improve loop.

## Anti-patterns

- Hardcoding feature on at launch
- **Peeking at a fixed-horizon experiment + stopping when it looks significant** (→ 20–40% false positives) — hold the pre-set sample, or switch to sequential testing
- **Shipping a flat / "not significantly worse" result as a win**, or deciding on a proxy metric instead of the revenue/business OEC
- Hiding feature behind ENV var (env vars don't audit, don't roll out per user, don't surface to admin — ENV is for SECRETS, flags for FEATURES)
- Multiple flags for one feature (sub-toggles via overrides, not new keys)
- Flag without admin entry
- Leaving deprecated flags in code (when feature at `stable, 100%` 30+ days, remove flag check — not feature. Quarterly cleanup)
- Tweet-length descriptions
- Empty `e2e_tests` array
- Missing `smoke_steps`

## Schema

See `reference/feature-flags.md` for the `feature_flags` D1 table DDL (columns: `key`, `enabled`, `rollout_percent`, `stage`, `description`, `e2e_tests`, `smoke_steps`, `owner_email`, `created_at`, `updated_at`).
