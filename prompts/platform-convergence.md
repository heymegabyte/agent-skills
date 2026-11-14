# Cross-product shared-platform implementation prompt

Execute this mandate across OnePrompt.site, theme.tools/ui.theme.tools, desktop.management, Inbox.vision, pdf.kitchen, and their applicable shared infrastructure. Treat ProjectSites.dev as OnePrompt's migration source, not a second competing product. Work from current repositories and actual deployed state; do not infer implementation from a domain name or old roadmap.

## Load and reconcile

Read `AGENTS.md`, the applicable repository instructions, `rules/platform-shared-capabilities.md`, and the relevant modules `platform-agent-ui.md`, `platform-knowledge-integrations.md`, `platform-content-media.md`. Also read `rules/theme-tools-canonical-components.md`, the dated research record, and `reference/platform-stack.json`. These scoped user decisions supersede older conflicting Clerk, QMD, VibeSDK, editor and React Flow defaults. Preserve unrelated valid policies and existing working behavior during migration.

Update the canonical skills first when this work produces a reusable decision. Keep rules, packs, routing, the execution prompt and the distributable file list consistent; run `python3 scripts/check-platform-policy.py` and the existing repository validators. Commit coherent tested slices to the authorized branch, preserving concurrent work. Sync consumers through reviewed immutable revisions and record acknowledgements; do not claim a policy push updated installed hosts, npm packages or pinned workflows automatically.

## Desired product experience

A person gives OnePrompt a business or idea. Research begins while a theme from theme.tools and approved components from ui.theme.tools produce a valid, visible layout immediately. Content, media and behavior arrive progressively with truthful per-region states. Before registration, the person can select a region by rectangle/lasso or keyboard and request an edit. Apply the smallest semantically sufficient component/stack patch, preserve unrelated content and interaction state, and show precise local progress and undo. Registration atomically claims the private draft without losing work.

Keep the good prototype structure. Improve the large-tab project switcher into an elegant, larger project-management popup; keep the theme ring minimal, restrained and WebGL-enhanced with accessible static/reduced-motion fallbacks. Source all visual work centrally. **Guide the user through explicit Figma approval per screen or all designs before implementing new/materially changed UI.** Record scope and revision; general permission to implement is not visual approval. Customer composition of already-approved components does not require a Figma round trip.

## Shared implementation architecture

Use Bolt.diy rather than VibeSDK. Integrate the native editor shell with app navigation, Better Auth, project context and telemetry, with adapters for files, execution, builds, preview, deployment and cancellation. Keep generated customer previews isolated; do not remove their sandbox with the editor-shell iframe. Commercial WebContainers use requires confirmed rights.

Use Cloudflare Agents for scoped session coordination and Workflows for long-lived steps. Build actual AG-UI producer/consumer adapters for Bolt, chat, preview, editors, automation, connectors and video. Stream factual messages, tool activity, state, progress, actionable decisions, results and errors. Persist accepted changes before acknowledging; support replay cursors, safe snapshots, idempotency, cancellation propagation, interruption and recovery. Never expose secrets, unauthorized state or hidden chain-of-thought.

Use official json-render as the generated-view layer over approved catalog components. Adapt the existing OnePrompt composition core rather than discard its revision/scope/undo checks. Validate schemas and action permissions, buffer partial specs safely, reject unsafe props/imports/HTML, and publish valid atomic subtrees. Routine props, copy, layout and scene edits must not trigger package installation, arbitrary source generation or whole-app rebuilds.

Expose useful interactive tools through MCP Apps using the official SDK, capability negotiation, sandbox/CSP and non-UI fallback. Use React Flow for understandable workflows, dependency graphs and execution maps, backed by headless typed execution contracts and accessible list/keyboard alternatives. Preserve framework boundaries; lazy React islands may integrate the React tools into the existing Angular shell without an unrelated rewrite.

## Catalog, libraries and compatibility

Search first, reuse second, extend existing variants third, create a new canonical component only when necessary. Publish reusable UI and product-scoped visual compositions through versioned packages documented at ui.theme.tools. Theme tokens originate at theme.tools. Include responsive, accessible, loading, streaming, waiting, empty, error, editing, success, cancelled and stale states where applicable.

Maintain a machine-readable compatibility manifest tying themes, component IDs/props, renderers, package versions and example fixtures together. Consumers pin versions. No local divergent copies or mutable production JavaScript pulled from Storybook. For nonvisual packages provide API docs, executable examples, supported runtimes, owners, consumer graph and releases. Storybook is the visual catalog, not the package registry.

Prefer small shared packages for auth/authorization, events, composition, knowledge, content/publishing, connectors, automation, media and observability. Reuse existing homes and contracts. Prove each promoted shared capability in a second real product before calling it reusable; avoid duplicate connection stores, event logs and competing UI systems.

## Identity, knowledge and integration plane

Standardize on Better Auth while preserving Google/GitHub/magic-link journeys and user identity. Design app-local sessions and audited SSO across unrelated domains. Recheck resource permissions, entitlements and approval requirements on every API/action/resume, not only the Edit button. Use exact redirect allowlists, PKCE/state as appropriate and tested account-linking/revocation. Test the selected Workers database/plugin combination; D1's documented SCIM limitation is feature-specific.

Use Cloudflare AI Search, not QMD, for approved documentation/specifications/skills/content. Keep source truth outside the index. Derive tenant/project scope server-side; prefer isolated security boundaries and tested pre-retrieval filters. Record source revision, provenance and ingestion status. Propagate updates/deletes through durable changes and reconciliation; enforce immediate tombstones/ACL revisions **before snippets reach the model**, including caches and citations. Account for actual metadata limits and asynchronous indexing.

Build an independently reusable Nango-style Cloudflare integration platform with typed connections, actions, triggers, sync cursors, webhooks, rates, retries and errors. Integrate it with the Activepieces-derived automation layer, Agents and MCP tools. Serialize rotating-token refresh, checkpoint sync after durable writes, deduplicate signed webhooks, enforce provider quotas, reconcile ambiguous side effects and clean up on disconnect. Only one service owns each token lifecycle.

Keep Infisical authoritative. Integrate Agent Vault for supported credentialed API access with scoped short-lived sessions, isolated administration, supported runtime adapters and enforced egress/redaction. Workers fetch and native SDKs require compatibility tests; proxy environment variables alone are insufficient. Preserve native official subscription CLI authentication; never extract/mirror those human profiles into product credential stores.

## Publishing and Remotion

Standardize rich-content editing on PlateJS. Authorized users get frontend Edit and New blog post controls. Support selection-aware AI suggestions, comments, media, autosave, revisions, undo/redo, previews and scheduling. Enforce permissions server-side, bind scheduled publication to a revision/timezone, recheck authorization at execution, and publish immutable releases with durable cache/search/SEO effects and reconciliation. Public readers should not download the full editor. Keep Inbox email serialization and pdf.kitchen page/layout rendering as explicit adapters, not assumed lossless web conversions.

Maintain the official Remotion skill reference pin and locally synthesized guidance; do not redistribute unlicensed upstream text. Build typed branded compositions/preview components and versioned storyboards with stable scene IDs. Support article explainers, verified product walkthroughs, releases, onboarding, data stories and social clips. Use approved assets and source-backed facts, actual authorized browser captures, targeted scene updates, reviewed narration/translation, synchronized captions/transcripts, thumbnails and reflowed wide/square/vertical exports.

Use a supported rendering runtime. Harden the official Cloudflare Containers proof of concept with auth, queueing, progress, rate limits and error handling before production; normal Worker isolates are not Node/FFmpeg hosts. Store private source/output in R2; reserve budget, bound resolution/duration/concurrency, implement cancellation/retries and correctness-aware tenant-scoped caching. Verify final audio/video/captions and artifacts; preview success is not export success.

## Product-specific acceptance

| Surface | First complete shared-capability journey |
| --- | --- |
| OnePrompt.site / migration source | Anonymous prompt → progressive theme/component preview → selected-region edit → interruption/recovery → claim → authorized publish and rollback. |
| theme.tools / ui.theme.tools | Find component → approved variant/states → schema/token compatibility tests → immutable package/Storybook publication → consumer upgrade without breaking existing sites. |
| desktop.management | Sign in → choose authorized machine/task → AG-UI progress/decision → scoped credential operation → cancel/recover → auditable result. Preserve current native runtime and remote-desktop choices. |
| Inbox.vision | Connect authorized inbox → incremental sync/webhook → AI-assisted rich reply → review → permitted send → dedupe, revoke and disconnect. Keep private messages outside public knowledge indexes. |
| pdf.kitchen | Open document → select block → AI proposal → accept/undo → revision preview → supported PDF export with correct pagination/fonts and scoped assets. |
| Shared media/automation | Article/release → storyboard → revise scenes → preview → authorized render in two products; workflow/connector runs share the same identity, credentials and telemetry contracts. |

## Release gates and bounded improvement

Before touching code, inventory capabilities, dependencies, current CI failures, licenses, approvals, budgets and supported runtimes. Maintain one capability matrix with `not-started`, `specified`, `implemented`, `wired`, `verified`, `deployed`, or `blocked`, each with evidence and next action. Fix existing release-blocking regressions before multiplying integrations.

Choose the highest-value ready vertical slice. Research material unknowns with primary sources, build failing contract/security tests, implement, verify, inspect real telemetry, then reassess the best adjacent improvements. Favor shared correctness and measured latency/cost gains over speculative abstractions. Repeat within the authorized run deadline and spend allowance; checkpoint blocked/remaining work. Stop after two review passes find no further high-value ready improvement, not with a fictional claim that perfection has been reached.

Keep all seven integrations: Cloudflare operational execution, PostHog behavior/experiments, Sentry errors/traces/releases, GA4 acquisition/key events, GTM governed tags, Langfuse Cloud AI traces/prompts/scores/costs, and Promptfoo evaluation/security gates. Use stable correlations, privacy controls and nonduplicated costs/pageviews. Audit Langfuse legacy paths ahead of its **November 16, 2026** Cloud removal milestone. Review Promptfoo remote processing before using private fixtures.

Evaluate Cloudflare's current directory by workload, maturity, security, entitlements and costs: adopt suitable AI Gateway, Workers AI, AI Search, Workers/WfP, Agents/DO, Workflows/Queues, storage, Browser Run, media, networking and security products. Do not enable everything, silently change providers, exceed established caps or create new paid accounts.

Verify denied cross-tenant access, stale/deleted knowledge, reconnect/replayed/cancelled jobs, concurrent edits, expired approvals, rotated credentials, webhook retries, publishing/scheduling, accessible keyboard flows, supported-browser performance, export correctness and rollback. Require real vendor delivery and end-to-end evidence before production claims. License-check Nango, Activepieces enterprise, Plate commercial pieces, Remotion and WebContainers for the exact offering.

At every `/run-the-loop` exit, record the policy/package/source revisions, implemented slice, tests and failures, design/license/access blockers, deployment status, measured outcomes, sync acknowledgements and next highest-value task. Do not bypass CI or invent approval, tests, deployment, host synchronization or background execution.
