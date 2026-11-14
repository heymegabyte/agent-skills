---
last_reviewed: 2026-11-11
superseded_by: null
name: "kill-switch-covenant"
priority: 2
pack: "security"
triggers:
  - "cron"
  - "background job"
  - "autonomous"
  - "scheduled"
paths:
  - "*"
---

# Kill-Switch Covenant — Nothing Runs Forever Unattended

Every autonomous, scheduled, background, or long-running behavior ships with three things from day
one: a VISIBLE pause (instant stop), an AUDIT trail (what it did), and an EXPIRY (it stops on its own
unless renewed). A process that can run indefinitely with no off-switch and no record is a liability,
not a feature — the covenant is a dead-man's-switch on everything that acts without a human watching.

Cross-links: `[[computer-use-safety]]` · `[[ai-agent-security]]` · `[[full-autonomy]]` · `[[healthchecks-job-monitoring]]` · `[[feature-flags]]` · `[[agent-permission-discipline]]`

## The three guarantees (every autonomous behavior)

- **Pause — instant + visible.** A one-action stop that takes effect immediately (every pending +
  future action refused while paused), reachable from the surface that runs it. Not buried in config.
- **Audit — everything it did, recorded.** A durable log of actions (args summarized, never secret
  values) so a human can answer "what has this been doing?" after the fact (`[[ai-agent-security]]`).
- **Expiry — it stops itself.** A TTL / token expiry / renewal requirement so an unattended behavior
  winds down by default instead of running forever. Renewal is a deliberate act, not the default.

## The rule

- **Applies to:** crons, scheduled jobs, agent loops, background workers, device/agent tokens,
  long-running automations, computer-use sessions, autonomous deploy/ops routines.
- **Default-deny + scoped, too.** Capabilities are granted explicitly and narrowly, never
  blanket-on — the pause/audit/expiry sit on top of a least-privilege grant.
- **Crons are monitoring-only by default.** A scheduled job that MUTATES must justify it + carry the
  full covenant; prefer read/alert-only schedules (estate doctrine).
- **A feature-flag kill-switch counts as the pause** when the behavior is a product capability (`[[feature-flags]]`).

## Anti-patterns

- A cron / agent loop / background worker with no pause and no "what did it do" log.
- A device/agent token with no expiry — a leaked or forgotten one runs forever.
- Blanket-granted autonomy with no scope and no off-switch ("it's internal, it's fine").
- An unattended mutating schedule with no audit trail or renewal boundary.
