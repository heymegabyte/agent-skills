---
description: Fires on `/fast-fix` for tiny prod changes (favicon, color, copy, spacing) — a FAST-lane alias to /ship that forces minimal checks and one warm browser verify, still against the live URL.
argument-hint: "<tiny change, optionally 'on <domain>'>"
---

# /fast-fix — FAST-lane alias to /ship

For trivial, low-risk prod changes only: favicon, a color, a copy tweak, spacing. Delegates to the `/ship` pipeline.

## What it forces

- **Lane = FAST** — override ccctl's lane down to `fast` (never up; if ccctl returns `high`, abort and use `/ship`).
- **Targeted checks only** — `tsc` on the touched file + directly-related unit tests. No full check, no E2E suite.
- **Single warm browser session** — one remote browser session, reused for the verify (open once, screenshot, assert, close).
- **Still verify the LIVE URL** — `ccctl verify <verifyUrl>` + one browser screenshot of the changed element. A trivial change is still not done until it's observable in prod.

## Flow (delegates to ship.md)

- Run ccctl `plan` (Step 0 of `/ship`), then execute ship.md's pipeline with the FAST overrides above.
- Same DEPLOY discipline: capture rollback ref, never deploy mid-build, scoped cache invalidation (no full-zone purge).
- Same CLEAN + REPORT (exact `/ship` headings) — recycle the one browser session in a finally block.

## Guardrail

- If the change turns out non-trivial (touches logic/auth/data, or targeted tests reveal uncertainty) → escalate to `/ship` NORMAL/HIGH automatically. `/fast-fix` is for genuinely tiny edits only.
