---
name: "healthchecks-job-monitoring"
last_reviewed: 2026-10-25
superseded_by: null
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Healthchecks Job Monitoring (leverage it wherever it makes sense)

**Standing rule (Brian, 2026-10-25):** wherever it makes sense, leverage the self-hosted Healthchecks (**healthchecks.megabyte.space**) as the dead-man's-switch for jobs. Use ALL its features — not just a success ping:

- **/start** ping at job start (measures duration; detects "started but never finished").
- **terminal ping keyed on exit status** — success when the command exits 0, `/fail` (or `/<code>`) otherwise.
- **attach the job log** (stdout+stderr) to the terminal ping body so failures are debuggable from the HC UI.
- **schedule + grace** per check so a MISSED run alerts (not only a failed one), and wire each check's alert channels (Slack / email).

## Fires on

Any cron / systemd timer / scheduled job / backup / deploy script / data sync / crawl / rotation / cleanup / cert-or-secret renewal / `/run-the-loop` routine / agent cron — anything that runs unattended or must be known to have finished.

## Do this

- Wrap with the helper: `~/.claude/skills/healthchecks-monitor/hc-run.sh <slug> -- <command...>` (pings start + success/fail with the log attached; fails-soft if unconfigured). Skill: `healthchecks-monitor`.
- New recurring job → create its check (auto-provisions on first ping with `HEALTHCHECKS_PING_KEY`) and set its schedule + grace + alert channel the same turn.
- Prefer the slug form (`hc-run.sh my-job -- …`) so checks self-create with readable names.

## Setup dependency

- `get-secret HEALTHCHECKS_PING_KEY` (project Ping Key) enables slug auto-provisioning; `HEALTHCHECKS_API_KEY` enables Management-API check config. Until a ping target is set the wrapper runs jobs unmonitored (never blocks them) — so wiring it in early is safe.

Cross-links: [[verification-loop]] (deploys are jobs too) · [[production-observability-default-on]] · [[cloudflare-domain-launch-monitoring]] (uptime of endpoints) · [[secret-store-chezmoi]] · [[terminal-styling]] (job scripts).
