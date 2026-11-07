---
name: "cloudflare-domain-launch-monitoring"
last_reviewed: 2026-10-25
superseded_by: null
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Cloudflare Domain Launch → Uptime Kuma (auto-register monitoring)

**Standing rule (Brian, 2026-10-25):** whenever a new domain is launched + deployed via Cloudflare, it MUST be added to Uptime Kuma automatically, the SAME turn. A live production domain with no uptime monitor is a gap — monitoring is part of "done," like the deploy + prod-verify step.

## Fires on

- A new CF zone goes active, a new site/app is deployed behind a CF tunnel/Pages/Worker custom domain, or a new Coolify service gets a public hostname.
- Any `verification-loop` deploy that results in a NEW public hostname (pair registration with the prod-E2E step).

## Do this

- Run `~/.claude/skills/uptime-kuma-register/add-domain.sh <domain-or-url> [group]` (idempotent). It adds an HTTP monitor + puts it on the `status.megabyte.space` public status page.
- Default group `Websites`; use `Infrastructure` for internal services, `Docker Containers` for container health.
- Bulk backfill from a list is safe (idempotent): `while read d; do add-domain.sh "$d"; done < domains.txt`.

## Where it lives

- Skill + helper: `~/.claude/skills/uptime-kuma-register/` (SKILL.md + `add-domain.sh`).
- Target instance: Uptime Kuma self-hosted on the Coolify host (`status.megabyte.space`), creds `get-secret UPTIME_KUMA_USER/PASSWORD`. Full ops: project memory `uptime-kuma-status`.

## Why (so it's never skipped)

- Uptime Kuma has no REST API; the helper runs `uptime-kuma-api` (socket.io) in a throwaway container on the Coolify host against the internal `http://localhost:3011`. That plumbing is already solved — the only recurring action is calling the helper, so there is no excuse to defer it.

Cross-links: [[verification-loop]] (register at deploy time) · [[cloudflare-native-provisioning]] · [[production-observability-default-on]] · [[interconnectedness]] (every live surface reachable + monitored).
