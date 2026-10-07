---
last_reviewed: 2026-10-06
superseded_by: null
name: tail-worker-agent-observability
priority: 2
pack: infra
triggers: ["tail worker","long running task","agent telemetry","run telemetry"]
paths: ["concern:cloudflare-workers","concern:ai-features"]
---

# Tail Worker Agent Observability

Design long-running/multi-step Worker and agent surfaces so observability can be attached through a Tail Worker without mixing telemetry transport into business logic.

## Event contract

Every meaningful run emits or makes derivable:

- `project`
- `skill`
- `agent`
- `run_id`
- `phase`
- `trace_id`
- `model_route`
- `duration_ms`
- `cost`
- `result`
- `rollback_id`

Include request/deployment identifiers when available.

## Rules

- Tail Worker is a sidecar observer, not a second source of truth.
- Never log secrets, bearer headers, cookie jars, full private prompts, or unnecessary customer payloads.
- Capture exceptions, terminal outcome, service-binding subrequests and Dynamic Dispatch activity when available.
- Correlate AI Gateway metadata and Browser Run production verification with the same `run_id`/trace.
- Durable evidence summaries go to the AI Search `deploy-evidence` or `incident-memory` corpus after redaction/review.
- High-volume raw telemetry goes to the selected observability/analytics sink; AI Search receives compact durable summaries, not raw firehose logs.
