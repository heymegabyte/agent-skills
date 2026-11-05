---
name: "theme-tools-canonical-components"
priority: 1
pack: "design"
triggers:
  - "ui.theme.tools"
  - "theme.tools"
  - "storybook"
  - "components"
  - "oneprompt"
  - "projectsites"
  - "figma"
paths:
  - "concern:frontend"
  - "concern:design-system"
last_reviewed: 2026-10-31
superseded_by: null
---

# Canonical Components, Themes, and Approval

User directive, 2026-10-31. This rule supersedes older instructions that make draftl.ink or per-application copied UI the canonical component source. It does not authorize production deployment, paid services, or unapproved screen implementation.

## One canonical UI & shared-utilities home (`@theme.tools`)

- **`@theme.tools` (`heymegabyte/theme.tools`) is the single canonical repository and package namespace (`@theme.tools/*` / `@theme-tools/*`) for ALL shared utilities, reusable TypeScript libraries, UI components, design tokens, and complex cross-site engines.** Anything that can be reused across two or more sites or applications MUST be stored in `@theme.tools` so complex features can be easily reused across every site without duplication.
- **CF-Native Absorbed Engines in `@theme.tools`**:
  1. **Activepieces (CF-Native Port — `@theme.tools/activepieces` / `@theme-tools/shared-utils/activepieces`)**: License-permitted Activepieces-derived workflow automation engine, typed piece/trigger/action contracts, React Flow visual builder projections, and Cloudflare Workflows + Queues + Durable Objects execution adapters.
  2. **Nango (CF-Native Port — `@theme.tools/nango` / `@theme-tools/shared-utils/nango`)**: Independently authored Cloudflare-native unified OAuth2/API connection engine, signed PKCE state, Infisical-backed credential reference storage, Durable Object refresh-token fencing locks, webhook signature verification, and incremental two-way sync cursors.
  3. **Postiz (CF-Native Port — `@theme.tools/postiz` / `@theme-tools/shared-utils/postiz`)**: Cloudflare-native multi-channel social media scheduling, cross-network publishing (X/Twitter, LinkedIn, Reddit, Bluesky, Threads, Mastodon, YouTube, TikTok, Pinterest, Discord), AI copy/thread adaptation, OG card generation, and engagement analytics.
  4. **Shared Utility & Cross-Site Capability Packages (`@theme.tools/shared-utils`, `@theme.tools/blog`, `@theme.tools/testing`, `@theme.tools/catalog`)**: All reusable cross-site utilities (Langfuse fail-open telemetry, Better Auth RBAC helpers, Cloudflare AI Search wrappers, feature-flag evaluators, Cal.com-style edge scheduling, Documenso-style PDF/signing, Formbricks-style surveys/forms, Dub-style shortlinks/attribution, Unkey-style API key/rate-limit verification, Novu-style multi-channel notifications, Twenty-style lightweight edge CRM, and Remotion video storyboards) live in `@theme.tools`.
- **Every visual component must be sourced, edited, updated, managed, documented, tested, and published through the design-system source repository backing `ui.theme.tools` (`heymegabyte/theme.tools`).** That Storybook is the authoritative component catalog across applications and generated websites.
- `theme.tools` is the authoritative starting-theme, design-token, and shared-utility source. `ui.theme.tools` is the component source. Record exact versions in every site document/release.
- Storybook is the visual catalog, documentation, and review surface; Git owns source and an authenticated package registry distributes immutable releases. Do not confuse a hosted Storybook with a package manager or edit its deployed static output.
- Create or improve a missing component in the canonical repository FIRST, including product-specific visual compositions in appropriately scoped packages. Consumer repositories own routes, data, permissions, and composition configuration, not divergent visual implementations.
- Import versioned packages. Never silently copy a component into an application, install shadcn/Spartan source separately in each consumer, or load mutable latest JavaScript from Storybook in production.
- Upstream primitives may be absorbed into the canonical library with license notices. React and Angular adapters may differ internally but share tokens, component IDs, behavior contracts, and catalog governance. Do not mount React components directly as Angular components.
- Keep credentials, tenant content, application API calls, and business entitlements outside reusable presentation components. Pass data and capabilities through typed interfaces.
- Publish primitives, sections, layouts, editor controls, charts, overlays, loading states, and app-specific compositions with explicit exports, peer dependencies, changelogs, migration notes, and supported runtime metadata.
- Pin consumer versions. Test affected consumers before upgrades; deploy with rollback support. A library release must never silently mutate already-published customer sites.

## Approval before UI implementation

- Guide Brian through Figma review. Offer approval per screen or for the complete design; record the chosen scope explicitly.
- Before programming a new or materially changed UI, obtain explicit approval of its Figma frame/revision, responsive variants, theme/component versions, and loading/empty/error/permission states.
- Record approver, approval evidence, timestamp, frame identity, revision or snapshot hash, and approved scope in the project approval ledger. Never invent approval or infer it from a general instruction to implement everything.
- Implement only approved scope. Material visual departures or new screens return to review. Independent backend contracts, security fixes, tests, and research may proceed without pretending they are UI approval.
- Link approved Figma components to real canonical implementations, using Code Connect when supported. Validate the built UI against the approved design.
- This developer approval gate is distinct from customers trying the live builder: customers may compose already-approved components without visiting Figma for each content edit.

## Storybook and library governance

- Compose framework-specific catalogs into `ui.theme.tools`; publish immutable version URLs and machine-readable component manifests alongside stories.
- Each catalog entry carries ID, package/import, version, props schema, allowed children/slots, variants, accessibility rules, compatible themes/frameworks, examples, and ownership.
- For nonvisual shared libraries, use a lightweight package catalog with TypeDoc/API documentation, executable examples, contract tests, runtime compatibility, dependency/consumer graph, and release status. Storybook demonstrates visual behavior; it does not manage dependency resolution.
- Prefer the existing workspace/release tooling. Add a full developer portal only when its measured value exceeds maintenance cost. Do not introduce a second component authority.
- CI must check registry provenance, exports, package contents, story/state coverage, accessible interactions, version compatibility, consumer contract tests, and distributable documentation.

## OnePrompt: manifest-first progressive generation

- Build initial sites from a pinned `theme.tools` theme and the component catalog at `ui.theme.tools`. Resolve a small likely component set; do not load the entire catalog into every preview.
- Run research concurrently with composition planning. Render a truthful theme shell and general layout as soon as a valid component plan exists; do not wait for all copy, imagery, code, or research to finish.
- Represent pages as a validated component graph: stable node/stack IDs, component/version references, typed props, child IDs, theme reference, revision, and content provenance. Keep presentation and tenant data separate.
- Use explicit build states: queued, researching, waiting-for-content, streaming, validating, ready, failed, cancelled, and stale. Component stories must demonstrate applicable states through shared build-state wrappers.
- Keep the last valid content visible while updating; reserve media/layout dimensions. State changes must be accessible and reduced-motion-safe. Never present guessed facts, fabricated testimonials, or fake completion percentages as verified content.
- Stream bounded, validated patch envelopes with session/site identity, idempotency key, base revision, next revision, and stable target IDs. Apply accepted patches atomically and support ordered replay/reconnection.
- The existing `rules/event-sourced-build-progress.md` remains the ordering/durability contract; replace its legacy component-source references with this rule's canonical sources.

## Draw-to-edit and minimal updates

- Before registration/claim, support rectangle, lasso, and keyboard/outline selection of preview elements, then a prompt scoped to selected component/stack IDs. Preserve this capability after registration where authorized.
- Resolve coordinates to stable IDs inside the preview renderer; account for iframe coordinates, scrolling, zoom, responsive layouts, nested components, and overlapping selections. A screenshot/coordinate is not an authorization grant.
- Plan the smallest **semantically sufficient** patch: update props before swapping a component, update a component before replacing a stack, and replace a page only when the request requires it.
- Preserve unrelated stacks, stable keys, focus, scroll, unsaved edits, and interactions. Expand scope only for necessary shared dependencies; global theme requests may legitimately affect many stacks.
- Show immediate local acknowledgement and precise loading/error indicators on affected regions. Apply validated manifest/content changes without generating source files, installing packages, or rebuilding the application.
- Code generation is an escape hatch for genuinely new behavior/components. Add reusable visual behavior to the canonical library under the approval gate; never execute arbitrary AI-produced code/HTML in the host shell.
- Require optimistic-concurrency checks, allowed-target checks, atomic validation, undo/redo, cancellation, request idempotency, and tests that unrelated nodes remain unchanged.
- Anonymous drafts use short-lived, scoped server-authorized sessions, quotas, abuse protection, private/noindex previews, and an atomic claim/ownership transfer. Never require registration merely to try the authorized draft editor.

## Platform and integration requirements

- OnePrompt is Cloudflare-first: Workers for Platforms for isolated customer execution; trusted control plane separate from generated code; per-site/environment resource resolution and least-privilege bindings.
- Preserve distinct Preview and Production resources, with Preview editable by default and Production read-only. Never treat a shared R2 prefix as equivalent to dedicated bucket isolation.
- Native editor integration may replace the bolt.diy shell iframe incrementally. Generated customer previews remain isolated on a separate origin with restricted iframe permissions and validated messages.
- Integrate all seven explicitly requested systems: **Cloudflare, PostHog, Sentry, Google Analytics 4, Google Tag Manager, Langfuse Cloud, and Promptfoo**. Older tier defaults do not exempt OnePrompt.
- Assign ownership: Cloudflare execution/routing/infra telemetry; PostHog product analytics and experiments; Sentry errors/traces/releases; GA4 acquisition/key events; GTM governed marketing-tag delivery; Langfuse Cloud AI traces/prompts/scores/cost; Promptfoo repeatable evaluation and red-team gates.
- Use one typed event contract, consent-aware/redacted adapters, a shared correlation scheme, environment separation, bounded retries, and configurable sampling. Do not duplicate pageviews, identity merges, replay capture, or LLM costs across sinks.
- Separate platform instrumentation from customer-site integrations. Keep secret keys server-side and scope vendor credentials/projects to the correct customer. A disabled optional sink must not break editing.
- Installation is not integration completion: require observed test events, real traces, source-map/release verification, funnel validation, and recorded evaluation results in the intended environments. Report credentials/approval/account limitations explicitly.
- Absorb permitted Activepieces capabilities into a **reusable Cloudflare-native library**: runtime-independent contracts, Cloudflare execution adapter, connector adapters, canonical UI, and host SDK. Prove consumption by a second app; do not claim the existing Redis/process-based runtime runs unchanged on Workers.
- Features exposes optional capabilities and usage. Separate enablement, server-side authorization, purchased entitlements, and rollout/experiment flags. Security, consent, isolation, and basic accessibility are never paid gates.

## Bounded improvement loop

- Audit evidence → rank high-value recommendations → implement a coherent authorized slice → test → review → repair → update evidence and backlog.
- Prefer fewer powerful abstractions and simpler operation over speculative feature count. Rank by user value, risk reduction, reuse, latency/cost, effort, and reversibility.
- Continue while a demonstrably high-value, authorized, testable improvement remains within the task's scope. Stop at an explicit approval/credential/runtime boundary or when remaining ideas do not justify their cost/risk.
- Never claim perfection, exhaustive repository coverage, passing unrun tests, completed vendor integration, or deployed behavior from documentation alone. Preserve the exact residual backlog and next acceptance gates.
