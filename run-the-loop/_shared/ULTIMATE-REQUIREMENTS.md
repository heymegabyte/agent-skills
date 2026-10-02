# ULTIMATE-REQUIREMENTS — megabyte.space steering distillation

> **2026-10-01 Brian supplements (OPERATING-PRINCIPLES § Canonical answers 2026-10-01 is the
> authoritative text; newest wins on conflict):** auth = Better Auth app identity (Google +
> GitHub + magic link from day one) with Access kept as thin edge gate (amends req 14's "one
> identity" implementation); OS skin = Kumo components themed black/cyan (interprets req 1);
> cadence = continuous 15-min cron + adaptive 3-6-role fires; loop spend = no ceiling,
> anti-stagnation is the only throttle.

> Source: `~/Downloads/ULTIMATE-megabyte-space-project-steering-run-the-loop-prompt (2).md` (13,994 lines / 364KB, baseline 2026-09-29). Cites (≈Ln) point back into that doc. Brian-global rules (TDD, deploy-verify, flags, a11y basics) are assumed, not restated.

## Mission

- megabyte.space is a Cloudflare-native **spatial AI operating system** for websites and businesses — an OS, not a dashboard, coherent across Ask/Speak/Show/Point/Edit/Browse/Build/Query/Connect/Automate (≈L4913).
- **Cloudflare OS is the permanent shell** (never a transitional stop); ProjectSites.dev becomes a native capability inside it — Sites resource type + editor + money path (≈L1415, ≈L9539).
- Prime Directive: **increase capability faster than complexity** — AI absorbs complexity via inference/automation/defaults; the system feels smaller as it gets more powerful (≈L48, ≈L9282).
- Frontier surface: WebGL/WebGPU spatial UI, realtime voice/video/screen-share, device capability bus, generative UI, Supabase+NocoDB+Directus-class data UX, dense premium dashboards — every frontier capability flagged, degraded, and evidence-verified.
- Two products: megabyte.space = upstream frontier laboratory; ProjectSites = distilled downstream. Backport only proven capability after complexity compression. $50/mo bar: "I can't believe this is included" (≈L59, ≈L6949, ≈L9261).

## Hard requirements

### Platform

1. Kumo is the sole design system for OS UI; use existing Cloudflare OS concepts/components before inventing Megabyte-only ones; custom primitive only after proof neither suffices (≈L9603, ≈L12159).
2. Upstream cloudflare-os modification ladder: /admin config → target wrapper → custom Gatekeeper → service binding → Blueprint/extension → small pinned patch. Never fork wholesale (≈L12134).
3. Stable internal `siteId` independent of hostname/repo/runtime; atomic guest→account claim preserves siteId + history (≈L10039, ≈L10067).
4. Repo-less by default: anonymous sites get ephemeral principal + TTL/quota; Git is a capability (none / Artifacts / GitHub), never identity; "publish site" ≠ "push Git" (≈L10049, ≈L11493).
5. Immutable releases: workspace → revision → build → release manifest (frozen bytes) → WfP; production = pointer move, never mutable directory; one-click rollback to any release (≈L10105–10171).
6. R2 is the immutable warehouse (sources, releases, exports, replays, backups) with reachability-based GC — never a fake POSIX filesystem or runtime (≈L10105, ≈L12855).
7. Execution ladder — cheapest correct runtime: T0 browser → T1 Worker/DO/Code Mode → T2 Dynamic Worker → T3 Sandbox → T4 Browser Run → T5 WfP production. Never wake Sandbox when T1/T2 suffices; checkpoint Sandbox before sleep (≈L9965, ≈L9738).
8. CF-native data mapping: D1 global relational · DO SQLite per-entity/hot/serialized (locks, budgets, collaboration, agent sessions) · R2 blobs · KV cache-only · Queues fan-out · Workflows durable multi-step · Realtime SFU media · Agents SDK agent state (≈L7540, ≈L12264).
9. Live Context Manifest: every important AI interaction receives typed, compact state pointers (IDs, versions, capabilities, health) — never stale dumps, never full-constitution context bloat; retrieve sections by heading (≈L5158, ≈L8171).
10. Model the OS as a **state graph, not a page tree**: resources + state transitions; deep exploration tests transitions, not URLs (≈L5240).
11. Custom domains via Cloudflare for SaaS with truthful state: CNAME presence ≠ connected — assert hostname validation + SSL active (≈L10199, ≈L12860).
12. Two-tier editing: instant DO-backed Kumo editor (files/search/diff/preview/AI/revisions) is default; "Open Full IDE" boots Sandbox (code-server + xterm + Claude Code) behind an authenticated Worker proxy, on demand only (≈L11143–11188).
13. Everything works from Claude Code Web: required behavior is repo-checked-in, account-synced, or MCP-exposed — never laptop-only (~/.claude aliases/scripts/secrets) (≈L4068).
14. One authorized identity; one tenant/project/site model; one capability/connection/permission framework across the whole OS (≈L13139).

### Data UX (tables · grids · charts)

15. Flagship Database Studio on D1: Supabase SQL power + NocoDB multi-view + Directus data modeling. Modes: Tables | SQL | Schema | Relations | Views | History | Access | Import/Export | AI Agent (≈L13475–13514).
16. Views: Grid, Form, Gallery, Kanban, Calendar, Timeline, List (Gantt only when data supports); personal + shared saved views (≈L13502).
17. Tables mode: pagination, filters, inline edit, add/delete/bulk, column controls, JSON editor, copy/export (≈L13489).
18. SQL IDE: Monaco/CodeMirror, schema autocomplete, run-selected, result tabs, timing, accurate errors, history, favorites, AI explain/fix (≈L13494).
19. Schema mode shows real tables/columns/types/defaults/PK/indexes/relations with migration preview + safe apply; field modeling separates DB properties from UI metadata — UI metadata never pretends to change schema (≈L13498–13508).
20. AI Database Agent with separate read / write / schema grants: explain schema, write SQL, propose migrations, indexes, reports (≈L13510).
21. Generative UI is a **controlled component registry** (DataGrid, SiteDiffCard, ApprovalCard, ConnectionPicker, CustomerTimeline, WorkflowRunInspector, SpatialGraph…): agent picks data + component type; shell validates and renders; sandboxed (≈L6082, ≈L13553).
22. Shared typed state between human + UI + agent, real-time in both directions — user edits visible to agent, agent proposals update UI immediately; prefer typed state over hidden chat text (≈L6118).
23. Typed context attachments (site, page, file, db-row, browser-session, screenshot, screen-share, device, customer); **selection is context** — "fix this" must resolve against the selected thing (≈L7247, ≈L7267).
24. One object, many views: Lead/Connection/BrowserSession keep a single identity + state across every surface (≈L7368).
25. Zero dead screens: every view answers what-is-this / what-matters / what-can-I-do / what-can-AI-do; every displayed number can explain its anomaly or opportunity (≈L1296).
26. Global permission-filtered search across all resource types (Sites, Pages, Tables, Rows, Agents, Runs, Workflows, Connections, Knowledge, Customers…); results become commands (≈L8058, ≈L13680).
27. Command palette = universal outcome actions: create site, improve page, publish, rollback, open IDE, run audit, connect domain, create agent (≈L8090, ≈L13684).
28. Best interaction = direct manipulation + deterministic command + AI assist together (filter grid directly, run SQL, or ask AI — same surface) (≈L7309).

### Automation (agents · workflows)

29. Agent object model: identity, role, goal, instructions, model policy, skills, knowledge, memory scope, connections, tools, site scope, approval policy, schedule, budget, version, health; forkable presets; teams (Site Growth, Customer Ops, Engineering…) (≈L6393, ≈L13595).
30. Capability chain: **Connection → Gatekeeper → Capability → Toolkit → Tool/MCP → Agent/Workflow/API-key/Gadget**; grants bind to concrete accounts, never to "Gmail" abstractly (≈L13137, ≈L13310).
31. Effective authority = intersection of owner/RBAC ∩ key/OAuth ∩ site ∩ resource ∩ connection ∩ action ∩ entitlement ∩ revocation ∩ approval policy ∩ budget (≈L11544).
32. Workflow Studio reads as business intent ("When form → enrich → qualify → notify → draft → approve → send"), one execution model for manual/scheduled/event/agent/API/MCP invocation — explicitly not an n8n node canvas (≈L6567).
33. Knowledge + Memory = one context layer, two views; scoped (user/org/project/site/agent/team/workflow/customer/run) with provenance, confidence, expiry; automatic learning is review-gated (run → insight → proposal → review → publish), never silent self-modification (≈L6450, ≈L13586).
34. Every consequential action emits a receipt: who, what, resource, before/after, when, tool/provider, cost, result, rollback available — human-readable AND machine-queryable; signed for build/publish/domain/agent runs (≈L7400, ≈L12321).
35. Browser Run is both customer capability and internal sense organ: first-class object (goal, session, screenshots, actions, recording, network, cost, result); Live View HITL for MFA/CAPTCHA; session recordings for flaky-journey diagnosis (≈L6632, ≈L11334).
36. Autonomy split: reversible actions fully autonomous; approval required for destructive/irreversible/financial/public-comms/physical-device/credentials/customer-data-deletion/mass-action. A model saying "confirmed" is NOT human approval (≈L6785, ≈L11675).
37. Every long operation: durable run ID, state, checkpoints, idempotency key, retry policy, timeout, cancel, resume; after refresh/sleep/reconnect the UI truthfully answers what's running/finished/failed/changed (≈L12809).
38. OpenAI/Anthropic-compatible project API mapped server-side to the same capability layer; key-creation UX scopes protocol, sites, connections, actions, expiry, budgets, models (≈L11589).
39. Generation-AI boundaries: AI may classify vertical, draft structure, select components, write copy, generate assets, detect gaps; AI must NOT invent factual claims, grant permissions, publish irreversible effects, fake tests, or hide provider truth (≈L12201–12227).
40. Multi-agent is a product feature: users compose teams without framework jargon — fan-out specialists → evidence → critic → converge → report, with budgets and stop conditions (≈L7777).

### Dashboards

41. Sites workspace converges to: Header (identity/status/domain/revision/primary actions) + Main tabs (Chat/Preview/Pages/Content/Code/Database/Agents/Automations/Analytics/Customers/Inbox/Booking/Domains/Releases/History/Logs/Browser-QA) + Right rail (recommendations/diffs/tests/approvals) + Bottom (terminal/logs/browser) (≈L6177, ≈L11105).
42. CRM + Inbox + Booking unified: canonical objects Person/Company/Lead/Opportunity/Conversation/Appointment/Activity/FormSubmission; ONE customer timeline (visits, forms, chats, email/SMS, appointments, agent actions); Cal.com-class booking with AI qualification/routing (≈L6533, ≈L13646).
43. Site flywheel instrumented end-to-end: Visitor → Site → Form/Chat → Lead → CRM → AI qualify → Appointment → Follow-up → Growth Agent → site improvement (≈L6506).
44. Resource Center (Appwrite-inspired, CF-native): Website | Data | Storage | Functions | Queues | DOs | Workflows | Connections | Knowledge; every resource card answers why-exists, what-uses-it, usage, health, cost, access (≈L13668).
45. Observability dual-track: normal = "43 tasks · 37 succeeded · 2 failed · $3.71"; advanced = full trace tree (provider, model, tokens, spans, latency, cache, cost, evals). Correlation IDs everywhere: requestId, traceId, tenantId, siteId, revisionId, releaseId, runId, agentId (≈L13706, ≈L12306).
46. Cost is UX: tasks show duration, $ cost, % of allowance; meter true marginal cost (premium models, media gen, Sandbox, Browser Run, OCR, voice/SMS, storage); software-cheap core included at $50/mo — never artificially withheld (≈L7980, ≈L13144–13193).
47. Presence: collaborators, active agents, browser tasks, Sandbox tasks, call participants, devices — states active/thinking/running/waiting/needs-input/failed/complete/offline (≈L7748).
48. Time is first-class: revisions, runs, customer journeys, knowledge freshness, deploys all answer what-is-true / what-changed / when / why / can-I-restore (≈L7434).
49. Progressive disclosure both real: novice sees outcome language (Cloudflare plumbing invisible); advanced mode exposes resource IDs, bindings, SQL, manifests, traces, release SHA, capability scopes (≈L8638, ≈L8663).
50. Blueprints + Gadgets: reusable app templates → user-owned, AI-editable, sandboxed, capability-scoped instances (Site Growth, Lead Review, Inventory, Customer Health…) (≈L8031).
51. Real progress from real events only — never fake boot percentages or build completion; generation timeline shows actual workflow stages (research → structure → assets → build → verify → ready) (≈L11363, ≈L11971).

### WebGL + advanced APIs

52. Three UI layers: L1 deterministic Kumo controls/tables/forms · L2 agentic/generative components · L3 spatial/WebGL-WebGPU. L3 never replaces L1; every spatial view ships a 2D/list/table alternative (≈L8420, ≈L6296).
53. WebGPU behind feature detection with fallback chain WebGPU → WebGL2 → Canvas/DOM → reduced-motion; core product never blocks on WebGPU (≈L5357, ≈L5385).
54. Browser capability maturity tiers: A dependable (WebRTC, WebAudio, OffscreenCanvas, OPFS, Workers, WebSockets); B fallback-required (WebGPU, WebTransport, View Transitions, FS Access, Wake Lock, Web Share); C flagged frontier (Bluetooth/USB/HID/Serial/NFC/XR/Document-PiP/SpeechRecognition) — Tier C never in core-workflow success (≈L8367).
55. Typed BrowserCapability registry + explicit degradation map per capability; never render dead buttons — unsupported states explain and offer the fallback (≈L5425, ≈L7207).
56. Device Capability Bus with adapters (BLE, WebUSB, WebHID, WebSerial, WebNFC, gateway); physical control is privileged, narrowly scoped, with dead-man/timeout/fail-safe — a model never gets unrestricted physical authority (≈L5488, ≈L5614).
57. Voice first-class: mic → WebRTC → Realtime SFU → STT → Agent → TTS; push-to-talk, hands-free, interruption, transcripts, captions, seamless text↔voice switching; credentials server-owned (≈L5623–5673).
58. AI-in-call: Realtime SFU rooms combine human A/V, screen share, AI voice participant, live transcript, workspace context, browser agent, CRM context, meeting artifacts; screen-share frames sampled efficiently with recording indicator, raw media not retained by default (≈L5690, ≈L7612–7662).
59. Off-main-thread mandate: Web/Shared/Service Workers, AudioWorklet, OffscreenCanvas, OPFS sync-in-worker, WebCodecs-in-worker, WASM for code search, diffs, graph layout, media (≈L5389).
60. OPFS = performance/offline layer, never canonical state; PWA offline honesty: show offline/synced/queued/conflict states truthfully (≈L5831, ≈L5867).
61. View Transitions preserve spatial continuity between OS states; never block input; reduced-motion respected on everything (≈L5899).
62. Public homepage may be theatrical (preserve the Three.js cinematic front door; never bury it behind OS chrome); the OS inherits zero marketing gimmicks — premium, fast, legible, alive (≈L6147, ≈L11963, ≈L7083).
63. WebGL in-product = brand atmosphere (ambient gradients, particles, constellation of sites, living site cards) — never text/UI containers; static + reduced-motion fallback mandatory (≈L11965–11970).
64. Spatial graph rules: semantic layout, legible labels, stable clustering, keyboard-accessible focus/zoom, selection syncs to 2D inspector, huge graphs aggregate — no 10K-node hairball (≈L8539).
65. Frontier features tested for: detection, unsupported path, permission denied, disconnect mid-session, reconnect, cleanup, mobile, reduced-motion; never claim cross-browser from one Chrome test (≈L9208).

### Integrations

66. ProjectSites MCP is the preferred high-level control plane: `sites.resolve/inspect/files.*/assets.update/deploy/cache.invalidate/preview/verify/rollback/logs/database.*/browser.*/git.*` (≈L2029, ≈L3421).
67. Tool preference ladder: ProjectSites MCP → specialized MCP → CF API/MCP → GitHub API → wrangler/CLI → shell → manual last (≈L3399).
68. Tool ownership boundaries: browser-owned (selection, DOM, device APIs, clipboard — browser mediates permission), server-owned (CF API, DB, publish, billing — secrets never proxied to browser), sandbox-owned (shell, packages, git — explicit scoped capability) (≈L7904–7960).
69. Code Mode + progressive tool discovery for large catalogs (toolkit summaries + search, then matching tools); direct tools for small predictable sets; never dump every integration into the system prompt (≈L7880, ≈L11579, ≈L13620).
70. Model routing via AI Gateway: filter by capability/policy/privacy/context/cost/latency/measured quality; log the routing reason; Workers AI for cheap triage/classification/vision; billing authority stays in Megabyte state; prevent retry/recursion cost multiplication (≈L6860, ≈L11621–11646).
71. Upstream-absorb program: registry of ~30 repos with GitHub metadata + license + SHA + attribution policy (LobeHub agents-operator, Dify workflow composition, Composio connections, RAGFlow explainable ingestion, Twenty CRM, Cal.com booking, Payload drafts/versions, Supabase/NocoDB/Directus DB, Langfuse traces, Chatwoot inbox, CrewAI crews, Mem0/Supermemory memory); study behavior → reimplement CF-native (≈L13195–13292, ≈L6309).
72. One universal Connection/capability picker (live search, health, scopes, owner, usage) reused by Agent, Team, Workflow, API key, OAuth, Gadget (≈L13614).
73. Treat as untrusted: generated code, imported code, user content, MCP, external websites, browser content, files, device input, WebRTC peers, models, webhooks. Generated code never receives platform master credentials; visitor-facing agents never inherit owner authority (≈L6804–6835).

### Quality gates

74. Evidence gate on every meaningful action: intent → plan → execution → evidence → result. Screenshot ≠ backend truth — reconcile authoritative state; "code exists" ≠ done (≈L476, ≈L7110).
75. Browser Run is canonical production visual evidence (Playwright/CDP); record the provider truthfully — local-browser fallback must be labeled and file a blocker, never claimed as Browser Run (≈L11311, ≈L12869).
76. Promotion gate: revision immutable, tests green, build reproducible, manifest complete, assets present, Worker bundle valid; post-promotion assert public URL, release provenance, clean console/network; periodically prove rollback (≈L12372–12387).
77. Per-surface p50/p95 tracked: apex LCP/INP/CLS, OS bootstrap, workspace open, first file read, edit acknowledgment, edit→preview, preview cold/warm, Sandbox cold/restore, terminal connect, build, publish, domain verification, palette, search. Budgets set from measured baselines then ratcheted — no unmeasured "sub-second" claims (≈L11793–11814).
78. Acceptance criteria auto-compiled from the user prompt into machine-checkable GIVEN/WHEN/THEN assertions; production verification checks the request, not optimism (favicon = document references new asset from new deploy) (≈L2350, ≈L3816).
79. Risk-sized validation: MICRO / SMALL / NORMAL / STRUCTURAL / HIGH-RISK. MICRO = surgical lookup → smallest patch → targeted checks → deploy → targeted invalidation → prod assert; no architecture review for a favicon (≈L2091–2158).
80. Targeted cache invalidation ladder: asset/URL → cache tag → prefix → hostname → environment → whole zone only if necessary (≈L2260).
81. Rollback identifier (deployment, commit, config, command) captured BEFORE deploy; auto-rollback on severe regression; bounded fix-forward loops that escalate, never spin (≈L2319, ≈L3890).
82. Deployment receipt every change: request, site, repo, commit, deployment + validation ✓s + cleanup ✓s + rollback id + LIVE URL last line (≈L2557).
83. Reversible test state: testRunId + mutation ledger + cleanup validation; never mutate legitimate customer data to test production (≈L3838).
84. Honest states everywhere: ready/loading/running/waiting/degraded/offline/permission-required/unsupported/failed/complete; never show success for simulated, queued, unverified, or disconnected work (≈L8483, ≈L12345).
85. Error design: what failed, whether anything changed, what can retry, what the system is doing, what the user can do, correlation ID (≈L12336).
86. Constitutional test before major change: more OS less dashboard? strengthens the editor? AI context without bloat? composes with Sites/Agents/Knowledge/Connections? right CF primitive? progressive fallback? fast, beautiful, accessible, reversible, cost-aware? can we DELETE something? (≈L9298).
87. Generated-site quality: dense, distinctive, truthful metadata, purposeful motion; NEVER invent awards, testimonials, certifications, counts, press, or stats without a source (≈L12232–12260).
88. Latency instrumentation of the loop itself: per-stage timings (resolution, locate, implement, test, build, deploy, invalidate, verify, cleanup, total wall-clock) with rolling per-project stats; optimize wall-clock far more aggressively than tokens (≈L2406, ≈L3176).

## Doctrines

- **beautify-10x** — gorgeous = systematic, not decorated: typography hierarchy, density, state clarity, fast tables, calm complexity, meaningful motion; recursive-excellence questions each pass ("simpler? faster? fewer steps? more beautiful?"); no generic AI purple, fake glassmorphism, or animation-for-its-own-sake (≈L7056–7086, ≈L1836).
- **modifier-matrix** — `/run-the-loop` carries standing lanes on every fire: Prompt/Skill Evolution, Product Split, Agent Council (14 critic councils, fan out only when useful), Primitive Approximation ("what would this become if the current implementation were merely the first approximation?" then "can it be simpler?"), Evidence gate, Research lane, Style-guide lane, Starred-Repo Scout (every 4 fires), Business Value Agent (≈L404–557).
- **absorb-projectsites** — port outcomes, not screens: Migration Capsule per feature (user outcome, donor impl + SHA, OS/CF/Kumo primitives, AI opportunity, acceptance journey); MIGRATION-MATRIX.md tracks status inventory→prod-verified→superseded; delete the redundant old path once parity is proven; the money path (discover → build → preview → publish → improve) stays sacred (≈L5087, ≈L10444, ≈L10895, ≈L8594).
- **playground-vs-stability** — Idea Lab → experiment→product pipeline (PoC → adapter → prototype → compat → security → cost → real job → flag → slice → measure → converge/REMOVE; no zombie experiments); homepage theatrical, OS truthful; Tier-C APIs never load-bearing; "build for the future, ship the present" as thin complete slices (≈L9165–9207, ≈L8575).
- Every prompt teaches the project: requirement graph JSON (status, domain, confidence, evidence, supersedes/conflictsWith) reconciled each fire and compiled into a small PROJECT-CONTEXT.md (≈L266–403).
- Embarrassingly-easy AND advanced-mode-real are the same product: infer/prefill/default for novices, full IDs/SQL/traces/manifests for experts (≈L12682, ≈L8663).
- Self-improvement is evidence-guided only: observe → hypothesis → bounded change → verify → keep/revert → encode; no uncontrolled recursive self-modification (≈L7461).
- Publish things worth finding — nothing that only exists to game search; no manufactured AI noise (≈L1700).

## Loop directives (every fire)

- Claim the fire lease first (heartbeat each phase, stale reclamation, coalesce overlapping fires, release in `finally`) (≈L10326).
- Run phases 0–11: orient cheap → Migration Capsule / re-imagine decision → fan out named roles in ONE wave → RED failing journey + baseline screenshots → smallest **complete** slice (no empty pages, dead buttons, unreachable tables) → Browser Run before/after every changed surface → convergence (normalize Kumo/types/tenancy; delete donor duplicates) → adversarial review (assume subtly wrong: mocked acceptance, tenant escape, wrong primitive, orphaned code) → one coordinated deploy → production proof (apex, /login, Access gate, changed behavior, backend matches UI, rollback possible) → reconcile matrix/backlog/cost ledger → ≥1 concrete loop improvement (≈L10430–10614).
- Roster: 18 named roles + dynamic specialists; category budget Product 30–45% · Testing 15–25% · Architecture 10–20% · UX 10–20% · Cleanup/perf/cost 5–15% · Docs 5–10% · Discovery 5–10% · Loop ~5% (≈L10614, ≈L10876).
- Standing/scheduled roles: Long-Trail TDD case owner; Deep UI Explorer (nested menus/drawers/modals; settled screenshot after every meaningful action; NEVER fabricate findings to satisfy quota); Site Template Evolution; Cloudflare Tech Scout; Upstream Product Intelligence every 4 fires → Feature Harvest (current vs upstream vs combined design, CF mapping, license) (≈L10807, ≈L11237, ≈L13740).
- Product-split lane: is this Megabyte-only? mature enough for ProjectSites? what complexity compresses before backport? (≈L421).
- Research-before-build for material features: live repo → donor → CF docs → MDN/standards → 3–7 upstreams; every research pass ends in adopt/adapt/experiment/watch/reject + ADR/test — never links-as-decoration (≈L689–733).
- Never ask what to work on when the backlog is ready; replenish continuously via discovery; repeated pain becomes a gate/script/brief; never let looping become busywork (≈L12494, ≈L12393, ≈L7140).
- Worktree isolation, disjoint file ownership, no `git add -A`, DO leases for shared metadata, ≤6 concurrent writers (≈L10344, ≈L11202).

## Explicit non-goals / cautions

- DO-NOT-DO (≈L12848–12875): no VibeSDK-as-shell; no embedding public os.cloudflare.app; no second auth system; no second Sites source of truth; no forced GitHub per site; no R2-as-POSIX; no Sandbox per request; no Browser-Run-as-shell; no Dynamic Worker per keystroke; no mutable promoted releases; CNAME ≠ domain-ready; no donor Angular/Spartan UI copied into Kumo; no giant donor ledgers copied; no vendors carried forward without re-evaluation (Neon/Redis included ≈L12300); no fake progress/events; no secrets to generated code; no ambient integration access for agents; no model-initiated side effects; no shared mutable working trees; no claiming Browser Run when a local browser ran; no claiming Artifacts without entitlement; no stopping at scaffolding when a thin slice was possible; no busywork docs; no unverified visual-AI "recommendations"; no asking questions the code answers.
- Do not reduce the product to: chat sidebar, website builder, low-code canvas, CRM, DB admin, IDE, MCP catalog, workflow builder, or "AI dashboard" (≈L4932).
- Not north stars: OpenHands, n8n, Activepieces (≈L6296, ≈L13862). No second low-code platform; no feature islands — every subsystem must prove composition (≈L13436, ≈L13550).
- Top-100 starred repos are a design-space corpus, not a shopping list; every dependency earns runtime need, license, CF compat, and a deletion path (≈L1008–1022).
- "Too advanced" is not a rejection reason; "cool" is not a ship reason — ship for comprehension/productivity/conversion/trust (≈L9129–9164).
- More agents ≠ better; budgets + stop conditions always (≈L7805). No private chain-of-thought exposed in any UI (≈L5728).
- WebContainers + Artifacts: verify commercial license/entitlement before any dependency (≈L9947, ≈L11443).
- Don't replace WebSockets just because WebTransport is newer; no custom media stacks when standard WebRTC/MediaRecorder suffices (≈L5791, ≈L5827).
- Do not spatialize/3D-ify admin screens for decoration; spatial must improve comprehension (≈L6300).
- Do not silently capture screens; device permission UX explains what/why/duration/egress and shows visible device state (≈L5712, ≈L6839).
- Deletion is a feature: remove duplicate services, dead flags, obsolete adapters, valueless wrappers as capabilities grow — flags are not an excuse for permanent dead code (≈L7493, ≈L12363).
