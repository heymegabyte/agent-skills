---
name: theme-tools-skill-integration
description: Required theme.tools package routing, ui.theme.tools reuse, upstream contribution, thin-consumer adoption, approval-gated visual delivery, and shared telemetry contract for every agent skill.
alwaysApply: true
---

# Theme.tools skill integration contract

Every skill applies this contract proportionally to its task. Read `config/theme-tools-skill-map.json` for the skill's preferred packages, consumer boundary, and contribution triggers.

## Reuse and contribution sequence

1. Search package exports, ui.theme.tools component/docs manifests, themes, templates, and tests before designing a local implementation.
2. Import the narrowest stable `@theme.tools/*` or `@theme-tools/*` entrypoint. Keep server credentials and execution code out of browser bundles.
3. When a reusable capability is missing or weak, implement and test it in theme.tools, publish or explicitly link the immutable package, and adopt it in the consumer in the same deliverable.
4. Consumers own product policy, content, routes, bindings, and thin configuration. They do not own reusable components, templates, hooks, validators, workflows, integrations, schemas, or application utilities.
5. Reusable host/account/secret provisioning belongs in install.doctor. Shared agent behavior belongs here in agent-skills.

Do not manufacture a shared abstraction when evidence shows the work is truly product-specific. Record that classification and proceed locally.

## Visual work

- Search ui.theme.tools before creating or copying components. Preserve the UniversalSite/editorial authorities and package boundaries.
- New or materially changed visual UI requires explicit approval of the current Figma artifact before implementation. A previous artifact, inferred approval, or a textual brief is not current approval.
- Without current Figma approval, complete only nonvisual contracts, backing services, view models, sanitized fixtures, accessibility semantics, and tests; record the visual layer as blocked by the exact missing artifact or approval.
- After current Figma approval, implement the complete responsive scaffold with typed fixtures and real theme.tools components, templates, tokens, libraries, and interaction states, then verify it in a browser and complete behavior through failing tests and vertical slices.
- Reusable UI must include applicable loading, empty, partial, error, denied, reconnect, responsive, keyboard, and reduced-motion states.

## Shared telemetry and site-specific analytics

Use `@theme.tools/telemetry`; do not hand-roll SDK initialization in sibling projects.

| Rail | Canonical responsibility |
|---|---|
| Sentry | Server-side Worker errors, traces, releases, and safe fingerprints; baseline for every Worker |
| PostHog | Product events, experiments, feature exposure, and consented replay |
| GA4 | Acquisition and key-event reporting where the product/site requires it |
| GTM | Consented marketing/vendor tag orchestration where required |
| Langfuse | AI, LLM, and agent spans with a strict 2500 ms fail-open boundary |
| Cloudflare | Runtime, routing, Worker, Queue, storage, and infrastructure evidence |
| Promptfoo | Model/prompt evaluation evidence, not production runtime truth |
| Site-specific | Typed adapters and configuration behind the same consent, redaction, correlation, and delivery contracts |

- Capability and consent determine enabled rails; missing configuration disables a rail safely.
- Cookie-free does not mean consent-free. Evaluate GPC, region, purpose, autocapture/replay, and site policy.
- Correlate rails with approved trace/session identifiers; never place raw secrets, tokens, prompts, message contents, or unnecessary PII in events.
- Installed SDKs are not verification. Prove delivery, deduplication, redaction, CSP behavior, consent transitions, and disabled/failure behavior.

## Completion gate

Verify the shared package, immutable distribution or explicit link, consumer adoption, removal of superseded local code, browser/server boundaries, and relevant observability delivery. Report simulation, sandbox, staging, and production evidence separately.
