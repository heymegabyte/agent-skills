# Recovery controls

For task checkpoints, writer leases, exact resume, worker handoff and Git reconciliation, follow the [durable execution runbook](DURABLE-EXECUTION.md). This file retains the higher-level PACE and exercise policy.

PACE routing evaluates deadline, retry budget, circuit state, authorization, and
health in that order. It never selects an unauthorized alternate. Cancellation
propagates a checkpoint reference to running children and releases outstanding
reservations within the configured grace period.

Exhausted work becomes a deterministic dead letter. Replay uses its stable
replay key and requires a new authorized decision; it is never automatically
retried. Corrective Paperclip work uses the corresponding origin key so repeated
evaluation creates one logical issue.

Non-destructive exercises cover database restore, gateway loss, provider
outage, runner loss, and credential unavailability. Each runs against fixtures
or scratch resources and records its objective, elapsed time, outcome, and
evidence digest. Production databases, credentials, and active processes are
never mutated by an exercise.
