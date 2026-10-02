---
description: Restore the previous Cloudflare deployment and verify recovery. Fires when a deploy broke prod and you need the last-good version back.
argument-hint: "[domain] (optional — defaults to cwd)"
---

Fast recovery. Worker rollback is instant + safe; **D1 schema rollback is approval-required** (see note).

## Steps

1. **List** — `npx wrangler deployments list` → identify the current version + the prior known-good version id.
2. **Pick prior** — select the deployment immediately before the current one (or a specific id if the user names it).
3. **Rollback** — `npx wrangler rollback <version-id>`. Confirm the CLI reports the active version flipped.
4. **Re-verify** — `node .claude/control-plane/ccctl.mjs resolve` → `ccctl verify <verifyUrl> --status 200`, then load the homepage in a real browser and assert it renders with 0 console errors. Do NOT declare recovered until the live URL is healthy.
5. **Report** — restored version id, previous (broken) id, and the health verdict with evidence.

## Note — D1 / data rollback (approval-required)

- A worker rollback does NOT revert database schema/data. If the incident was a bad migration, recovering data uses `wrangler d1 time-travel restore --timestamp <iso>` (or `--bookmark`). This is destructive + approval-required — surface it as a blocker and get explicit sign-off before running.
