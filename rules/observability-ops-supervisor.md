---
last_reviewed: 2026-06-29
superseded_by: null
name: "observability-ops-supervisor"
priority: 3
pack: "backend"
triggers:
  - "observability"
  - "logging"
  - "tracing"
paths:
  - "concern:observability"
---

# Observability + Ops Supervisor

Major user actions emit telemetry; frontend errors and backend logs are captured and correlated by request/trace/workflow/AI IDs. Analytics stays optional so local dev is reproducible. The observability arm of the supervisor system.

## When this fires

- Any major user action, error path, workflow run, or admin health surface

## Tooling + when to use

- **posthog-js** — product analytics (privacy-aware event names, `persistence:'memory'` cookie-free where possible)
- **@sentry/angular** — frontend error capture + release tracking
- **pino** — backend structured logs
- **OpenTelemetry-compatible abstractions** — traces behind a vendor-neutral port (Workers Tracing OTLP is the CF-native exporter per `auto-meta-work`)
- **Cube** — analytics modeling per `database-data-supervisor`
- **Typesense** — log/search where useful

## Rules

- **Telemetry on major actions** — privacy-aware event names (no PII in the name), tenant-tagged
- **Frontend error capture** (Sentry) + **backend structured logs** (pino)
- **Correlate everything** — `request_id` + `trace_id` + `workflow_run_id` + `ai_trace_id` (where AI exists per `ai-agent-supervisor`) flow through every log line and span
- **Audit logs** for sensitive actions per `auth-permissions-security-supervisor`
- **Admin health/status panels** — surface workflow runs, error rates, queue depth, AI spend
- **Analytics optional for local reproducibility** — the app runs fully with telemetry disabled (no hard dependency on a vendor key)
- Estate baseline per `production-observability-default-on`: server-side Sentry on every Worker + PostHog + Workers Tracing; enterprise adds GA4/GTM and Axiom. Local development remains functional with telemetry disabled.

## OpenTelemetry discipline (§9.3 / §19.2 — spec-verified 2026-10-29)

- **No duplicate spans** — never record the same model generation twice (application instrumentation AND AI-Gateway/platform export). Pick ONE authoritative source per generation; model logical agent spans, tool spans, and provider-call spans with explicit parentage, not flat duplicates.
- **Privacy filtering is PER-EXPORTER** — a Langfuse masking hook does NOT sanitize a second copy exported to Sentry or another collector. Apply redaction/allowlists at EVERY exporter/destination and verify each path with controlled synthetic-secret fixtures.
- **GenAI semantic conventions are `development`-stability AND have MOVED** to the `open-telemetry/semantic-conventions-genai` repo — the main `semantic-conventions` repo's gen-ai pages are now deprecated/unmaintained (verified via Context7). Follow the MAINTAINED repo; PIN the semconv version/maturity you depend on (development-level attributes can change); a deprecated entry in the OLD registry alone does NOT justify dropping/renaming working attributes.
- **Workers caveat** — do NOT assume an arbitrary Node OTel auto-instrumentation SDK runs unchanged inside Workers; verify supported propagation + span attributes against the installed runtime. Workers log/trace export is not a substitute for a separate metrics strategy.
- Carry **W3C Trace Context** across services; prefer stable conventions and pin + document any `development`/`alpha` convention you adopt.
