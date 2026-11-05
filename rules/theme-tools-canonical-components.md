---
name: "theme-tools-canonical-components"
priority: 1
pack: "design"
triggers:
  - "ui.theme.tools"
  - "theme.tools"
  - "@theme.tools"
  - "storybook"
  - "components"
  - "oneprompt"
  - "projectsites"
  - "figma"
  - "reusable code"
  - "reusable library"
  - "shared library"
  - "shared utility"
  - "shared package"
  - "cross-site"
  - "cross-app"
  - "extract to a package"
  - "monorepo package"
paths:
  - "concern:frontend"
  - "concern:design-system"
  - "concern:architecture"
last_reviewed: 2026-10-31
superseded_by: null
---

# Canonical Components, Themes, and Approval

User directive, 2026-10-31. This rule supersedes older instructions that make draftl.ink or per-application copied UI the canonical component source. It does not authorize production deployment, paid services, or unapproved screen implementation.

## One canonical UI & shared-utilities home (`@theme.tools`)

- **`@theme.tools` (`heymegabyte/theme.tools`) is the single canonical repository and package namespace (`@theme.tools/*` / `@theme-tools/*`) for ALL shared utilities, reusable TypeScript libraries, UI components, design tokens, and complex cross-site engines.** Anything that can be reused across two or more sites or applications MUST be stored in `@theme.tools` so complex features can be easily reused across every site without duplication.
- **Fires on ANY reusable code — not just UI.** The moment you write (or notice duplicated) a utility, helper, library, backend engine, adapter, hook, typed/Zod contract, or CF-native service port — not only a component/theme — that ≥2 sites or apps could use, it belongs in `@theme.tools`: author it THERE and import the versioned package. Never add reusable code to an app repo or copy it between repos. App/product repos keep only their real content, routes, data, permissions, deployment bindings, and thin composition wiring.
- **Earned-generic, not premature** (`[[inverted-abstraction-pyramid]]`): the homing TRIGGER is the SECOND consumer. Write the specific thing in one app first; the instant a second site needs it, EXTRACT it UP into `@theme.tools` rather than copy it down. Do not speculatively abstract a single-use thing — but do not let a genuine second use duplicate either.
- **End-of-turn capture:** the parallel Triad Sync (`[[prompt-as-training-signal]]`, `[[total-convergence-and-openspec-handoff]]`) already evaluates every turn for reusable code to land in `@theme.tools` (via OpenSpec when it can't ship inline). This rule is the standing, in-the-moment version of that: catch it as you write it, not only at end-of-turn.
- **This rule is the SSOT for `@theme.tools/*` package NAMES** (capability-first, enumerated below). Where another rule or doc references an upstream vendor-brand name (e.g. activepieces / nango / postiz), the capability-first name (`@theme.tools/workflows` / `@theme.tools/integrations` / `@theme.tools/social`) is the canonical one; treat any vendor-brand mention as drift to reconcile (`[[drift-detection]]`).
- **Name Packages by What They Are (Capability-First, Never Vendor Brands)**: Every `@theme.tools/*` library MUST be named after **what it is** (`@theme.tools/workflows`, `@theme.tools/integrations`, `@theme.tools/social`, `@theme.tools/scheduling`, `@theme.tools/signing`, etc.), **never** after an upstream vendor inspiration (`activepieces`, `nango`, `postiz`, `cal`, `documenso`, etc.).
- **All 28 Default `@theme.tools` Libraries Are First-Class Citizens** (`DEFAULT_THEME_TOOLS_LIBRARIES` in `@theme-tools/shared-utils/absorbed-catalog`):
  - **Tier 1 — 5 Core Visual, Theme, Editorial & Testing Packages**: `@theme.tools/themes`, `@theme.tools/ui` (`ui.theme.tools`), `@theme.tools/blog`, `@theme.tools/catalog`, `@theme.tools/testing`.
  - **Tier 2 — 15 Cloudflare-Native Absorbed Open-Source Application Engines**: `@theme.tools/workflows`, `@theme.tools/integrations`, `@theme.tools/social`, `@theme.tools/scheduling`, `@theme.tools/signing`, `@theme.tools/forms`, `@theme.tools/links`, `@theme.tools/keys`, `@theme.tools/notifications`, `@theme.tools/crm`, `@theme.tools/inbox`, `@theme.tools/billing`, `@theme.tools/status`, `@theme.tools/kb`, `@theme.tools/dataplane`.
  - **Tier 3 — 8 Foundational Cross-Site Utility Libraries**: `@theme.tools/telemetry`, `@theme.tools/auth`, `@theme.tools/flags`, `@theme.tools/agent-ui`, `@theme.tools/seo-geo`, `@theme.tools/media-video`, `@theme.tools/crawl-research`, `@theme.tools/i18n-a11y`.
- **Every visual component must be sourced, edited, updated, managed, documented, tested, and published through the design-system source repository backing `ui.theme.tools` (`heymegabyte/theme.tools`).** That Storybook is the authoritative component catalog across applications and generated websites.
- `theme.tools` is the authoritative starting-theme, design-token, and shared-utility source. `ui.theme.tools` is the component source. Record exact versions in every site document/release.
- Storybook is the visual catalog, documentation, and review surface; Git owns source and an authenticated package registry distributes immutable releases. Do not confuse a hosted Storybook with a package manager or edit its deployed static output.
- Create or improve a missing component or utility in the canonical repository FIRST, including product-specific visual compositions in appropriately scoped packages. Consumer repositories own routes, data, permissions, and composition configuration, not divergent visual or engine implementations.
- Import versioned packages. Never silently copy a component into an application, install shadcn/Spartan source separately in each consumer, or load mutable latest JavaScript from Storybook in production.
- Upstream primitives may be absorbed into the canonical library with license notices. React and Angular adapters may differ internally but share tokens, component IDs, behavior contracts, and catalog governance. Do not mount React components directly as Angular components.
- Keep credentials, tenant content, application API calls, and business entitlements outside reusable presentation components. Pass data and capabilities through typed interfaces.
- Publish primitives, sections, layouts, editor controls, charts, overlays, loading states, and app-specific compositions with explicit exports, peer dependencies, changelogs, migration notes, and supported runtime metadata.
- Pin consumer versions. Test affected consumers before upgrades; deploy with rollback support. A library release must never silently mutate already-published customer sites.

---

## The 28 Default `@theme.tools` Libraries (Situation → Package Routing Matrix)

Whenever an agent encounters any of the situations below, it MUST reach for the corresponding `@theme.tools/*` default library (and extend it upstream in `heymegabyte/theme.tools` if a capability is missing):

### Tier 1 — 5 Core Visual, Theme, Editorial & Testing Packages (`core-workspace`)
| # | Default Package | Upstream / Standard | When to Use (Automatic Trigger) | Core Exports & Cloudflare Primitives |
|---|---|---|---|---|
| 1 | **`@theme.tools/themes`** | W3C DTCG 2025.10 + OKLCH | Any theme, color palette, dark/light mode, typography scale, or motion token (`0.333s`) | `BASE_THEME`, OKLCH palettes (`#060610`, `#00E5FF`, `#50AAE3`, `#7C3AED`), CSS custom properties |
| 2 | **`@theme.tools/ui`** | `ui.theme.tools` (React 19 + `<tt-*>` Custom Elements) | Any UI primitive, section, card, modal, form control, pill/chip list, or Storybook catalog item | 575+ components, 16-state Visual State Matrix compliance, `:focus-within` wrappers, pill array renderers |
| 3 | **`@theme.tools/blog`** | Ghost + PlateJS + DataForSEO v3 | Any blog, article generation, keyword research, APA citation verification, RSS, or editorial calendar | DataForSEO v3 briefs, SSRF-safe APA citation ledger, 30 SVG/chart briefs, PlateJS inline editor, 3-slot scheduler |
| 4 | **`@theme.tools/catalog`** | Content-Addressed Manifest Registry | Binding theme tokens, component versions, fixtures, and `json-render` catalogs | Immutable SHA-256 compatibility manifests (`Workers`, `R2`, `D1`) |
| 5 | **`@theme.tools/testing`** | Playwright + CF Browser Run + 16-State Verifier | Verifying UI widgets across all 16 visual states and 10 micro-critique lenses | `evaluateWidgetConvergence()`, `VISUAL_STATE_MATRIX_16`, `MICRO_CRITIQUE_LENSES_10`, 450-item testing catalog |

### Tier 2 — 15 Cloudflare-Native Absorbed Open-Source Application Engines (`absorbed-saas-engine`)
| # | Default Package | Absorbed Open-Source Inspiration | When to Use (Automatic Trigger) | Core Exports & Cloudflare Primitives |
|---|---|---|---|---|
| 6 | **`@theme.tools/workflows`** | **Activepieces** (MIT `packages/shared` & pieces) | Any workflow automation, trigger/action builder, webhook orchestration, or React Flow DAG | `validateCloudflareWorkflow()`, `definePiece()`, `projectFlowToReactFlowGraph()` (`Workflows`, `Queues`, `DO`, `D1`) |
| 7 | **`@theme.tools/integrations`** | **Nango** (clean-room CF-native port) | Any OAuth2/PKCE connection, token refresh lock, webhook ingestion, or incremental 2-way sync | `createSignedOAuthState()`, `verifySignedOAuthState()`, `advanceIntegrationSyncCursor()`, Infisical Agent Vault refs (`DO`, `D1`, `KV`) |
| 8 | **`@theme.tools/social`** | **Postiz** (clean-room CF-native port) | Any cross-network social scheduling (X, LinkedIn, Bluesky, Reddit, Threads, Mastodon, YouTube, TikTok, Discord) | `validateAndSegmentSocialPost()`, `SOCIAL_CHANNEL_SPECS`, thread splitter, OG card hooks (`Workflows`, `Queues`, `R2`) |
| 9 | **`@theme.tools/scheduling`** | **Cal.com** (clean-room CF-native port) | Any appointment booking, availability slot solver, calendar sync, round-robin routing, or `.ics` invite | `<tt-booking-calendar>`, timezone slot solver, Google/Outlook sync via `@theme.tools/integrations` (`D1`, `DO`, `Workflows`) |
| 10 | **`@theme.tools/signing`** | **Documenso / OpenSign** (clean-room CF-native) | Any PDF e-signature, contract/waiver/NDA signing, field overlay, or tamper-evident audit trail (`pdf.kitchen`) | `<tt-pdf-signer>`, WebCrypto SHA-256/ECDSA seal, audit certificate generator (`R2`, `D1`, `Workers`) |
| 11 | **`@theme.tools/forms`** | **Formbricks + Tally** (clean-room CF-native) | Any multi-step form, onboarding wizard, conditional survey, NPS/CSAT poll, or multimodal intake | `<tt-conversational-form>`, `<tt-micro-survey>`, Turnstile guard, voice/photo intent extraction (`D1`, `R2`, `Workers AI`) |
| 12 | **`@theme.tools/links`** | **Dub.co + Shlink** (clean-room CF-native) | Any shortlink, dynamic QR code, UTM attribution, geo/device redirect, or click-to-conversion tracking (`linkbl.ink`) | `<5ms` KV redirector, SVG/PNG QR generator, Analytics Engine attribution (`KV`, `Analytics Engine`, `D1`) |
| 13 | **`@theme.tools/keys`** | **Unkey** (MIT-derived CF-native port) | Any customer API key issuance (`sk_live_...`), token/cost quota, sliding-window rate limit, or webhook signing | SHA-256 key verifier, Durable Object sliding-window limiter, `<tt-api-keys-manager>` (`KV`, `DO`, `D1`) |
| 14 | **`@theme.tools/notifications`** | **Novu + Listmonk** (clean-room CF-native) | Any in-app notification bell, toast stream, digest batching, preference matrix, or SES/Listmonk email | `<tt-notification-bell>`, `<tt-notification-preferences>`, Queue/DO fanout, SES + Listmonk adapter (`Queues`, `DO`, `D1`) |
| 15 | **`@theme.tools/crm`** | **Twenty CRM + Attio** (clean-room CF-native) | Any Contact/Org/Lead/Donor/Deal pipeline, activity timeline, kanban board, or AI lead enrichment | `<tt-crm-kanban>`, `<tt-contact-drawer>`, Workers AI enrichment (`D1`, `AI Search`, `Workers AI`) |
| 16 | **`@theme.tools/inbox`** | **Chatwoot + Papercups** (clean-room CF-native) | Any live support chat widget, shared email/chat helpdesk, AI RAG auto-reply, or human handoff (`inbox.vision`) | `<tt-support-inbox>`, `Cloudflare Agents` + `AG-UI` socket, Email Routing parser (`Agents`, `DO`, `Email Routing`, `AI Search`) |
| 17 | **`@theme.tools/billing`** | **Lago + Stripe Billing** (clean-room CF-native) | Any integer micro-USD usage metering, credit wallet, subscription checkout, or server-side entitlement gate | Atomic DO credit ledger, Stripe Payment Element + Link wrapper, `<tt-pricing-table>`, `<tt-usage-meter>` (`DO`, `D1`, `Queues`) |
| 18 | **`@theme.tools/status`** | **OpenStatus + Upptime** (clean-room CF-native) | Any public `/status` or `/trust` page, multi-region synthetic probe, latency histogram, or incident timeline (`status.charity`) | `<tt-status-badge>`, `<tt-uptime-timeline>`, Cron synthetic probes (`Workers`, `Cron Triggers`, `Analytics Engine`, `D1`) |
| 19 | **`@theme.tools/kb`** | **Fumadocs + Mintlify + Outline** (CF-native) | Any `/docs`, `/help`, `/changelog`, `/glossary`, `Cmd+K` semantic search, or `llms.txt` documentation surface | `<tt-cmd-k-search>`, `<tt-changelog-feed>`, PlateJS docs renderer, AI Search RAG (`AI Search`, `D1`, `R2`) |
| 20 | **`@theme.tools/dataplane`** | **Papermark** (clean-room CF-native) | Any secure pitch deck, investor/board data room, dynamic PDF watermarking, or page-by-page dwell analytics | `<tt-secure-deck-viewer>`, viewer-email R2 PDF watermarker, NDA gate (`R2`, `D1`, `Analytics Engine`) |

### Tier 3 — 8 Foundational Cross-Site Utility Libraries (`foundational-utility`)
| # | Default Package | Scope & Standard | When to Use (Automatic Trigger) | Core Exports & Cloudflare Primitives |
|---|---|---|---|---|
| 21 | **`@theme.tools/telemetry`** | 7-Rail Observability + Langfuse Safe | Every Worker/app request, LLM call, analytics event, error boundary, or Promptfoo eval | Cloudflare OTLP, PostHog, Sentry v11, GA4, GTM, **Langfuse `2500ms` fail-open circuit breaker**, PII redactor |
| 22 | **`@theme.tools/auth`** | Better Auth + Infisical Agent Vault | Every login, session check, multi-tenant RBAC gate, cross-site OIDC SSO, or secret reference | Better Auth D1/Drizzle schema, `requireEntitlement()`, Infisical `secretRef` resolver (`D1`, `KV`, `DO`) |
| 23 | **`@theme.tools/flags`** | Canonical D1/KV Feature Flags | Every dark launch, gradual rollout, experiment, or admin flag toggle | `feature_flags` + `feature_flag_overrides` + `feature_flag_audit`, `isFlagOn()`, `useFeatureFlag()`, `<tt-feature-flags-admin>` |
| 24 | **`@theme.tools/agent-ui`** | Cloudflare Agents + AG-UI + `json-render` + MCP Apps | Every stateful AI agent stream, generative UI spec patch, MCP App tool iframe, or HITL approval | `AG-UI` event cursors, `json-render` SpecStream validator, `MCP Apps` bridge, approval nonces (`Agents`, `DO`, `AI Gateway`) |
| 25 | **`@theme.tools/seo-geo`** | Schema.org JSON-LD + Answer-Engine Optimization | Every route's meta tags, OG image, JSON-LD graph, `sitemap.xml`, `robots.txt`, `security.txt`, or `llms.txt` | Dynamic 1200×630 OKLCH OG image generator, JSON-LD validator, discovery route handlers (`Workers`, `R2`, `Images`) |
| 26 | **`@theme.tools/media-video`** | Remotion + Cloudflare Containers / Stream | Every programmable video, audio-synced caption track, aspect-ratio reflow (`16:9`/`1:1`/`9:16`), or media pipeline | Remotion storyboard schema, caption aligner, Cloudflare Containers render client (`Containers`, `R2`, `Stream`, `Images`) |
| 27 | **`@theme.tools/crawl-research`** | SSRF-Safe Scraper + DataForSEO + Public Records | Every external URL scrape, Wayback/Form 990/Google Places entity lookup, or citation verification | SSRF guard (`169.254.0.0/16` & RFC1918 blocked), DataForSEO v3 client, APA claim-citation verifier (`Browser Rendering`, `Workers`) |
| 28 | **`@theme.tools/i18n-a11y`** | Census ACS B16001 Locale + WCAG 2.2 AA | Every locale detection, `hreflang` tag, RTL layout, OKLCH contrast check, or reduced-motion transition | ACS B16001 locale solver, `hreflang` builder, OKLCH `>=4.5:1` contrast solver, `0.333s` motion tokens (`Workers`, `KV`) |

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

## Why this grew

Broadened from a UI/theme/editorial-component charter into the canonical home for **ALL reusable code** — adding the 28-library capability-first routing matrix and the "fires on any reusable code / earned-generic / naming-SSOT / end-of-turn-capture" mandate — per the standing user directive (2026-11-04) that **any reusable code is stored away in `@theme.tools`**. The triggers + `concern:architecture` path were widened so this rule loads when reusable BACKEND code is written, not only UI work. This body is the authoritative routing matrix other rules point to rather than restate.
