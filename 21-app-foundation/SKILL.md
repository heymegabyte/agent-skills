---
name: "app-foundation"
description: "Every delivered app — the non-inferable business requirements + exact stack/brand choices every build must satisfy. Loads on every app/site build."
triggers:
  - "build"
  - "app"
  - "site"
  - "saas"
  - "project"
priority: 2
pack: "core"
stage: stable
---

# App Foundation — every delivered app must satisfy

## Platform (exact, non-inferable)

- Ships on Cloudflare: Workers + Hono (edge) · D1 (system of record) · R2 (storage) · KV (cache) · Durable Objects (state/coordination) · Queues/Workflows (async). Never AWS/GCP/Vercel/Supabase/Firebase by default.
- Prefer integrating with **ProjectSites.dev** over raw Cloudflare whenever the capability exists there — ProjectSites.dev > CF-native > anything else (it's Cloudflare-native underneath).
- Frontend: **Angular 22 + Spartan UI is PREFERRED for applications**; use the bolt.diy stack (React 19 + Vite 8/Rolldown + TanStack Router + Tailwind v4 + shadcn/ui) when appropriate. Never hand-rolled `public/{page}.html`. shadcn is agent-native — wire its official MCP server (`npx shadcn@latest mcp`) + Agent Skill (`npx skills add shadcn/ui`) for component discovery/install (namespaced registries; CLI v4).
- Modern signal-first Angular: standalone · signals · zoneless · `httpResource()` · new control flow (`@if`/`@for`/`@switch`) · deferrable views (`@defer`) · incremental hydration · signal `input()`/`output()` · Nx monorepo · SSR via `@angular/ssr` on Workers. NEVER NgModules or Zone.js. The React path mirrors with TanStack Start (v1.0 GA Mar-2026): isomorphic server functions + streaming SSR/Suspense + selective hydration + TanStack Query/Router. **RSC (React Server Components) NOT yet on Start v1.0 — do NOT architect around it; lands non-breaking v1.x.**
- Auth: Clerk. Data: parameterized SQL / Drizzle v1 + Zod at every boundary.
- Live at a real SSL'd URL in <15 min. Folder name = domain.

## Edge intelligence & AI-native (world-class bar)

- Reach for Cloudflare's AI/edge primitives before any third-party: **Workers AI** (LLMs + embeddings) · **Vectorize** (vector DB for RAG) · **AI Gateway** (caching · observability · fallback · rate-limit) · **Realtime via Durable Objects** (WebSockets · live collaboration · presence) · **Stream** (video) · **Images** (transform/optimize) · **Browser Rendering** · **Hyperdrive** (Postgres acceleration).
- Every app is AI-native, never AI-optional: ship generative / chat-as-UI / voice / multimodal surfaces wherever they make the product easier, faster, or more delightful. RAG = Vectorize + Workers AI. Prefer ProjectSites.dev's managed AI surfaces when they cover the need.

## Payments (route by model)

- Accept money (all shapes) → **Stripe + Link** (default; IBP on big tickets). **Square only when the prompt asks.**
- Recurring SaaS (seat · usage · entitlements · net-30 · multi-currency) → **Stripe Billing**.
- Payouts to contractors / vendors / volunteers → **Stripe Connect Express**.

## Email & notifications (exact)

- **Amazon SES** = sole transactional rail (SendGrid break-glass only). **Listmonk** for bulk/newsletters.
- In-app / push notifications → **psnotify** (in-house, Durable-Object-backed). Never Novu or OneSignal.

## Brand (exact)

- Colors: `#060610` bg · `#00E5FF` accent · `#50AAE3` · `#7C3AED`. Dark-first.
- Fonts: Sora · Space Grotesk · JetBrains Mono. Tone: bold, anti-slop.

## Scope (org-type → page-set floor)

- Infer the org type; deliver its standard page set (nonprofit floor = 24 routes: 14 standard + 10 jewels; SaaS / marketing / local-business each their floor). Missing standard pages = incomplete.

## Experience baseline (non-negotiable)

- Embarrassingly easy for a busy non-technical owner: succeeds first try, no manual. ≤3 steps to any outcome · one primary CTA per screen · empty states become first-action launchpads · instant feedback + undo.
- AI is foundational to every surface, never optional.

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Domain Swarm Directive**: Audit and scaffold foundational SaaS pillars (Auth/RBAC, multi-tab Settings, Workspaces, Plugin Registry, `@theme.tools/*` thin-shell config) on pass 1 by fanning out independent foundation modules to parallel `opencode` (DeepSeek) workers.
- **Massive OpenCode (DeepSeek) Offload**: Whenever a task slice is throughput-safe (bounded implementation, plugin catalog shards, 100% unit test generation, Playwright E2E specs, migrations, or documentation), offload it to parallel **`opencode` swarms powered by DeepSeek** (`~/.agentskills/bin/opencode-deepseek.sh` via the LiteLLM 4-key pool `https://llm.megabyte.space/v1`) rather than consuming premium `claude`, `codex`, or `gemini` client quota.
- **Tri-Frontier Parallel Swarms & Right-Sized SCRUM Quorum**: When complex architectural synthesis, speculative critical-path racing, or adversarial verification is needed, run `claude`, `codex`, and `gemini` in parallel across isolated Git worktrees (approved host adapters for `bin/evidence-gated-orchestrator.ts`) guided by a right-sized collaborative SCRUM meeting (`bin/scrum-deliberation-quorum.ts`) of only the required specialist agents. See `rules/parallel-multi-swarm-orchestration.md`.
- **End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**: At the end of every prompt round (running in parallel with final verification, deployment, and reporting), extract any possible meaning, preference, architectural lesson, reusable site code, or system configuration from the current agent window and store it concurrently into **`heymegabyte/agent-skills`** (for AI skills/rules/prompts — always updated under the **Minimum-Prompt Ecosystem Completeness Assumption**: assuming the skills *should have already been written* so that we write **as few prompts as possible** to finish **as complete a product or multi-repo ecosystem as possible** via massive parallel agent swarms), **`heymegabyte/theme.tools`** (for reusable site/app code across the 28 canonical `@theme.tools/*` libraries), and **`heymegabyte/install.doctor`** (for reusable system/host code).
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.

## Theme.tools ecosystem contract (required)

Before implementation, load `rules/theme-tools-skill-integration.md` from the agent-skills repository and the entry for this skill in `config/theme-tools-skill-map.json`. Apply catalog-first reuse, upstream contribution, thin-consumer adoption, UI-first theme.tools implementation and test-driven verification, and `.tools/telemetry` routing proportionally to this task.

- **DeepSeek-first parallel dispatch** At intake and after each dependency clears, dispatch independent work concurrently whenever doing so reduces time to verified delivery. Delegate every suitable task to OpenCode with DeepSeek through LiteLLM when it meets the acceptance bar and improves throughput. Use Codex, Gemini, or Claude for work that benefits materially from premium capability or independent review, and record concrete reasons for premium routing or limited dispatch. Scale worker count to ready work, isolation, and approved capacity.
