---
name: "F14-content-analytics-and-observability"
family: "F14"
title: "F14 — Content, analytics, and observability"
default_layer: "observability"
default_tier: "required-ci"
recommendations_count: 30
updated: "2026-11-04"
---

# F14 — Content, analytics, and observability (30 Recommendations: F14.01–F14.30)

> **Summary**: SEO/canonical/robots/sitemap/hreflang/JSON-LD fact parity, zero placeholder copy, PostHog/GA4 event schema & deduplication, consent withdrawal, Sentry release/sourcemap attribution, correlation IDs, Langfuse redaction, and synthetic traffic exclusion.
> **Default Layer**: `observability` · **Default Execution Tier**: `required-ci` · **Primary Tools**: Captured Telemetry Sink, Sentry/PostHog/Langfuse Contract Validators, SEO/JSON-LD Auditor

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F14 Recommendation Catalog (F14.01–F14.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F14.01`** | Canonical URL, title & indexing metadata | `P0` | `observability` | `required-ci` | `verified` | Validate titles, descriptions, canonical URLs, and indexing intent across public pages and pagination. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.02`** | Robots.txt & sitemap publication policy | `P0` | `observability` | `required-ci` | `verified` | Test robots directives and sitemap membership so private, preview, and deleted pages are never indexed. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.03`** | Localized hreflang & language parity | `P0` | `observability` | `required-ci` | `verified` | Check alternate language links and canonical relationships against the actual language of rendered content. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.04`** | Structured data (JSON-LD) visible-fact parity | `P0` | `observability` | `required-ci` | `verified` | Validate JSON-LD structured data against visible page facts and schemas to catch invented prices or ratings. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.05`** | Crawler SSR & protected-route isolation | `P0` | `observability` | `required-ci` | `verified` | Inspect SSR output with crawler user-agents for public content while preserving auth on protected routes. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.06`** | Internal link, anchor & asset integrity | `P0` | `observability` | `required-ci` | `verified` | Check internal links, document anchors, downloads, and navigation targets on changed conversion paths. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.07`** | Zero placeholder & unresolved template copy | `P0` | `observability` | `required-ci` | `verified` | Detect placeholder copy, unresolved template variables, stale brand names, and misleading labels. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.08`** | Factual calculation & citation source parity | `P0` | `observability` | `required-ci` | `verified` | Validate consequential dates, units, calculations, and citations against approved source fixtures. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.09`** | Search snippet Unicode & deletion freshness | `P0` | `observability` | `required-ci` | `verified` | Test search indexing and displayed snippets with Unicode, punctuation, missing fields, and deleted records. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.10`** | Captured notification sink verification | `P0` | `observability` | `required-ci` | `verified` | Render notifications into captured test delivery sinks to validate recipients, links, and localization safely. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.11`** | PostHog & GA4 event schema conformance | `P1` | `observability` | `required-ci` | `verified` | Validate PostHog and GA4/GTM events at emission boundaries for event names, required properties, and types. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.12`** | Idempotent analytics conversion deduplication | `P1` | `observability` | `required-ci` | `verified` | Test analytics event deduplication across retries, double-clicks, redirects, and client/server dual emission. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.13`** | Consent-gated telemetry & queue purge | `P1` | `observability` | `required-ci` | `verified` | Assert analytics consent rules on initial load, preference withdrawal, and pre-withdrawal queued events. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.14`** | Anonymous-to-authenticated identity merge safety | `P1` | `observability` | `required-ci` | `verified` | Test anonymous-to-authenticated transitions and account switching so unrelated users or tenants never merge. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.15`** | Sentry error grouping & sourcemap attribution | `P1` | `observability` | `required-ci` | `verified` | Inject controlled frontend/backend errors and verify Sentry grouping, release tags, and sourcemap resolution. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.16`** | Distributed correlation ID propagation | `P1` | `observability` | `required-ci` | `verified` | Follow correlation IDs across HTTP handlers, queues, Workflows, and external calls without leaking secrets. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.17`** | Langfuse AI telemetry & redaction accuracy | `P1` | `observability` | `required-ci` | `verified` | Validate Langfuse telemetry for prompt versions, model ID, token counts, tool calls, and PII redaction. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.18`** | Error-preserving trace sampling policy | `P1` | `observability` | `required-ci` | `verified` | Test trace sampling and export behavior so consequential failures remain diagnosable under sampling. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.19`** | Committed-outcome audit log parity | `P1` | `observability` | `required-ci` | `verified` | Compare audit entries with committed business outcomes, avoiding false success logs for rolled-back actions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.20`** | Synthetic alert routing & deduplication | `P1` | `observability` | `required-ci` | `verified` | Exercise alert conditions with synthetic signals and captured sinks without paging real on-call responders. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.21`** | Grafana query & unit fixture validation | `P1` | `observability` | `required-ci` | `verified` | Validate monitoring queries and dashboards against known fixture metrics for labels, aggregations, and units. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.22`** | Bounded metric label cardinality | `P1` | `observability` | `required-ci` | `verified` | Test metric label cardinality to prevent user IDs, raw URLs, or high-entropy values from exploding series. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.23`** | End-to-end diagnostic secret redaction | `P2` | `observability` | `required-ci` | `verified` | Plant synthetic sensitive values in failures and verify redaction across logs, traces, exceptions, and bundles. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.24`** | Truthful readiness & dependency health probes | `P2` | `observability` | `required-ci` | `verified` | Test health and readiness endpoints against actual dependency state so uninitialized services report not-ready. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.25`** | User-outcome SLI numerator & denominator accuracy | `P2` | `observability` | `required-ci` | `verified` | Validate SLI numerators, denominators, and exclusions with synthetic requests so error budgets reflect reality. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.26`** | Non-blocking telemetry exporter failure | `P2` | `observability` | `required-ci` | `verified` | Fail telemetry exporters and analytics endpoints deliberately to verify user workflows and memory stay healthy. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.27`** | Normalized telemetry clock & unit schemas | `P2` | `observability` | `required-ci` | `verified` | Check timestamp formats (ISO-8601 UTC), monotonic durations, and units across all telemetry boundaries. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.28`** | Explicit unknown/missing telemetry distinction | `P2` | `observability` | `required-ci` | `verified` | Test missing and delayed telemetry so reports distinguish unknown evidence from zero errors or proven success. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.29`** | Executable runbook & docs query verification | `P2` | `observability` | `required-ci` | `verified` | Execute maintained documentation examples and operational queries in disposable contexts. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
| **`F14.30`** | Synthetic test-traffic analytics exclusion | `P2` | `observability` | `required-ci` | `verified` | Mark synthetic test traffic and verify its exclusion from business conversion reports while keeping diagnostics. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F14`)* |
