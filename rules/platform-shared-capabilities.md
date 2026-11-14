---
name: "platform-shared-capabilities"
priority: 1
pack: "platform"
triggers:
  - "oneprompt"
  - "theme.tools"
  - "desktop.management"
  - "inbox.vision"
  - "pdf.kitchen"
  - "run-the-loop"
paths:
  - "concern:shared-platform"
last_reviewed: 2026-10-31
superseded_by: null
---

# Shared platform decisions and execution contract

User directive, 2026-10-31. Applies to OnePrompt.site (including its ProjectSites.dev migration source), theme.tools/ui.theme.tools, desktop.management, Inbox.vision, pdf.kitchen, and shared services used by them. This scope supersedes older conflicting defaults, not unrelated products. These are implementation requirements, not claims of installed or verified functionality.

## Mandatory choices

- Use **Bolt.diy, not VibeSDK**, for the builder foundation; adapt the existing fork rather than creating a competing editor.
- Use **Cloudflare Agents** for stateful product agents, **AG-UI** for agent-to-interface events, **json-render** for catalog-constrained generative UI, and **MCP Apps** for portable interactive tools.
- Use **Better Auth** for authentication, **Cloudflare AI Search instead of QMD** for approved knowledge retrieval, **PlateJS** for rich-content editing, **React Flow** for useful node-based views, and **Remotion** for reusable video capability.
- Keep **Infisical authoritative**; integrate **Infisical Agent Vault** for supported credentialed agent/API access. These choices do not authorize exposing credentials or replacing official subscription CLI authentication.
- Build a shared **Cloudflare-native integration & OAuth platform** (`@theme.tools/integrations`), **workflow automation library** (`@theme.tools/workflows`), and **social scheduling & distribution engine** (`@theme.tools/social`) inside **`heymegabyte/theme.tools` (`@theme.tools`)**; follow file-level licenses. Always name `@theme.tools/*` packages by what they are (their functional capability), never after an upstream vendor brand. Anything that can be reused across sites MUST be stored in `@theme.tools` across its **28 Default Libraries** (`rules/theme-tools-canonical-components.md`):
  - **Tier 1 (5 Core Packages)**: `@theme.tools/themes`, `@theme.tools/ui`, `@theme.tools/blog`, `@theme.tools/catalog`, `@theme.tools/testing`.
  - **Tier 2 (15 CF-Native Absorbed SaaS Engines)**: `@theme.tools/workflows`, `@theme.tools/integrations`, `@theme.tools/social`, `@theme.tools/scheduling`, `@theme.tools/signing`, `@theme.tools/forms`, `@theme.tools/links`, `@theme.tools/keys`, `@theme.tools/notifications`, `@theme.tools/crm`, `@theme.tools/inbox`, `@theme.tools/billing`, `@theme.tools/status`, `@theme.tools/kb`, `@theme.tools/dataplane`.
  - **Tier 3 (8 Foundational Cross-Site Utility Libraries)**: `@theme.tools/telemetry`, `@theme.tools/auth`, `@theme.tools/flags`, `@theme.tools/agent-ui`, `@theme.tools/seo-geo`, `@theme.tools/media-video`, `@theme.tools/crawl-research`, `@theme.tools/i18n-a11y`.
- Preserve Cloudflare, PostHog, Sentry, GA4, GTM, Langfuse Cloud, and Promptfoo. Keep vendor responsibilities distinct and validate real delivery.

Read [agent/UI contracts](platform-agent-ui.md), [knowledge/auth/integrations](platform-knowledge-integrations.md), and [publishing/media](platform-content-media.md) when touching those concerns. The [research record](../reference/platform-research-2026-10-31.md) supplies primary sources; recheck changing APIs, prices, limits, and licenses before implementation.

## Component and approval invariants

- Follow [canonical component governance](theme-tools-canonical-components.md). Every visual component is sourced, edited, updated, managed, tested, and published through the repository behind **ui.theme.tools**. **theme.tools** owns starting themes/tokens.
- Search the catalog first; reuse, extend variants, or improve the canonical implementation before creating a replacement. Product-specific visual compositions also live in appropriately scoped canonical packages.
- Version packages, theme tokens, component schemas, fixtures, and renderer adapters together through a compatibility manifest. Consumers pin immutable versions; no production runtime imports from mutable Storybook output.
- Include responsive, accessible, loading, streaming, waiting-for-content, empty, error, editing, success, cancelled, and stale behavior as applicable. Shared wrappers may implement common states; do not burden every primitive with agent logic.
- Guide the user through Figma approval by screen or complete design, recording exact revision/snapshot, scope, approver, responsive/state coverage, and component versions. **Do not implement new/materially changed screens before explicit approval.** A general implementation request is not that approval.
- Already-approved components may be composed by customers without a Figma ceremony for every content edit. Independent backend contracts, tests, and security work may proceed.
- Preserve existing frameworks during migration. React Flow, Plate, Remotion Player, and the React json-render renderer can live in lifecycle-managed, lazy React islands inside the existing Angular shell. Test ownership, unmount, focus, routing, CSS and state bridges; do not invent an Angular package or rewrite the whole app merely to integrate them.

## Shared packages, not a monolithic platform rewrite

- Prefer existing package homes. Establish independently testable contracts for identity/authorization, agent events, composition, knowledge, content/publishing, connectors, automations, media, credential access, and telemetry.
- Build each capability once and prove reuse in a second real consumer. UI packages belong to theme.tools; nonvisual libraries use a lightweight API/docs/consumer catalog, not a second visual authority.
- Separate presentation, domain state, execution, and vendor adapters. A React Flow graph is a projection of an executable workflow contract, not the engine; a json-render spec is a view, not the tenant database.
- Preserve stable workspace/site/document/node/scene/connection/run IDs, schema versions, trace IDs, immutable revisions, provenance, and migration adapters. Export and import round trips must not silently discard unsupported fields.
- Keep the native Bolt editor integrated with app navigation/auth/project state. Generated previews and MCP Apps retain their separate sandbox boundaries; removing the editor-shell iframe does not mean removing all iframes.
- Preserve the large-tab project switcher, enlarged project-management popup, minimal WebGL theme ring, and accessible/static fallbacks through approved canonical designs.

## Runtime and infrastructure placement

- Workers/Hono: trusted APIs, authorization, dispatch, small transforms. Agents/Durable Objects: scoped sessions, serialized mutations, refresh locks, safe realtime state. Workflows: durable orchestration, approvals, scheduling and retry checkpoints. Queues: buffering/delivery, not exactly-once execution.
- D1: compatible metadata/content workloads. Neon/Postgres only where required, optionally through Hyperdrive; Upstash only for demonstrated Redis needs. Preserve established per-project budget caps unless explicitly changed; resolve missing allowances before enabling paid resources.
- R2: private source/media assets, immutable builds and output artifacts. WfP: isolated customer execution with least-privilege bindings. Preserve per-site Preview/Production resources; Preview editable, Production read-only through the editor. A shared prefix is not dedicated-bucket isolation.
- Browser Run/Stagehand: real browser capture, QA, and supported browser automation. Remotion rendering requires a supported browser/codec runtime: evaluate hardened Cloudflare Containers first, then an already-authorized isolated runner when necessary. Ordinary Worker isolates are not general Node/FFmpeg hosts.
- Review Cloudflare's full current directory and maintain an adopt/defer/not-applicable matrix with workload, maturity, entitlements, security, cost, measured benefit, and owner. Evaluate AI Gateway, Workers AI, AI Search, storage, media, networking, and security; do not enable services merely because they exist.
- AI Gateway governs product inference routing, budgets and fallbacks; retain the distinction between product APIs and official internal subscription CLIs. Preserve existing email/payment providers unless an explicit migration is approved.
- Consider Images for transformations, Stream for delivery, Realtime only for genuinely interactive media, Access/Tunnel for internal access, and WAF/Turnstile/API Shield/rate limits as applicable. These do not replace application authorization or Remotion rendering.

## Features and verification

- Features lists optional capabilities, prerequisites, quotas, and configuration. Separate purchased entitlements, user permissions, site enablement, and rollout/experiment flags; enforce all relevant gates server-side.
- Never charge-gate tenant isolation, consent, accessible controls, basic security, or safe recovery. Meter expensive generation, renders, advanced connector volume, and retention against explicit allowances.
- Share typed, redacted telemetry adapters and correlation identifiers. Keep PostHog product behavior, GA4 acquisition, GTM marketing delivery, Sentry failures/releases, Langfuse AI traces, Promptfoo evaluations, and Cloudflare operational signals distinct.
- Before the **November 16, 2026** Langfuse Cloud removal milestone, audit legacy read/ingestion paths and migrate to supported APIs/OTel with runtime-safe flushing and delivery tests. Consult the current compatibility matrix; do not assume all endpoints share one deprecation status.
- No duplicated GA pageviews or competing replay defaults. Mask private editor/inbox/doc content. Export telemetry through supported runtime-safe APIs without breaking normal editing when a sink fails; missing required release evidence still blocks promotion.
- Treat SDK installation, documentation, a mock, a core reducer, runtime wiring, live vendor delivery, and verified production deployment as different statuses.

## Apply during /run-the-loop

1. Resolve the actual repository, deployed surface, shared-skill revision and package versions; inspect existing code/tests/CI and prior receipts. Never infer migration completion from a product name.
2. Load this policy and relevant modules; reconcile older Clerk/VibeSDK/QMD/editor defaults explicitly. Preserve behavior until tested replacement cutover.
3. Maintain a capability-by-product matrix with owner, evidence, dependencies, approval, license, budget, runtime, next test and status: not-started, specified, implemented, wired, verified, deployed, or blocked.
4. Research only material uncertainties against primary sources. Rank ideas by user value, security/reliability, cross-product reuse, latency/cost gain, and implementation risk. Implement the highest-value ready vertical slice.
5. Test contracts and real user journeys, inspect telemetry, repair regressions, then reassess adjacent improvements. Reject speculative frameworks, duplicate planes and cosmetic churn.
6. Commit coherent tested slices, preserve concurrent work, and publish via ordinary fast-forward workflows. Record source SHAs, test commands/results and any unverified checks; never force-push or bypass CI.
7. A shared-policy commit is not fleet synchronization. Update applicable pinned shared revisions only after compatibility checks; record each consumer's acknowledgement. Missing host/registry access remains a named blocker. Do not replace schedulers or add duplicate cron loops.
8. Stop at the existing run deadline/budget, a real approval/license/access blocker, or two evidence-based passes finding no additional high-value ready work. Persist a resumable checkpoint; do not claim absolute perfection or promise invisible background work.

Execution prompt: [platform convergence](../prompts/platform-convergence.md). Machine-readable contract: [platform stack](../reference/platform-stack.json).
