# Emdash Skills for Gemini

Load CONVENTIONS.md for stack defaults. Load _router.md for skill routing.
23 categories, 149 reference docs, 28 agents.

## Stack

CF Workers + Hono | React 19 + Vite + shadcn/ui (sites) / Angular 22 + Spartan UI (apps) | D1/Neon | Drizzle v1-rc | Clerk | Stripe + Link (default) · Square on request | Inngest | Amazon SES | Bun | Playwright v1.63+ | PostHog | Sentry

## Rules

- **Prefer TypeScript over Python** (Node 24 native strip-types / Bun + Bash for system glue; never reach for Python by default for scripts, automation, verifiers, exporters, or tests)
- **Implement Every Recommendable Idea & Top-X Feedback Loop (`rules/prompt-as-training-signal.md` §8, `rules/auto-integrate-recs.md`, `rules/improvement-audit.md`)**: **Any of the ideas that the AI thinks are recommendable should be implemented.** Never cap at 4–6 or 30%: implement every recommendable idea in the same turn (using `opencode-swarm.mjs`, feature flags, or lazy CLI shims `cnf-build-shims`), ask yourself **why each wanted feature wasn't automatically implemented before the user asked for the Top X ideas**, and modify `~/.agentskills` + upstream templates (`install.doctor`, `theme.tools`, `template.projectsites.dev`) in the same turn so the idea gets automatically integrated on pass 1 next time.
- **Total Multi-Axis Convergence & Micro-Task Loops (`rules/total-convergence-and-openspec-handoff.md`, `rules/gorgeous-by-default.md`)**: Run `CREATE → RENDER/EXECUTE → EXPERIENCE → CRITIQUE → MODIFY → COMPARE` on every UI widget (across all 16 visual states and `0.333s` OKLCH transitions), sub-feature, business rule, performance path, security boundary, and AI execution surface.
- **Parallel End-of-Turn Triad Sync (`agent-skills` + `install.doctor` + `theme.tools` + touched projects) & `@theme.tools` 28 Default Libraries (`rules/theme-tools-canonical-components.md`)**: At the end of every prompt pass, infer and apply updates in parallel across `heymegabyte/agent-skills`, `heymegabyte/install.doctor`, and `heymegabyte/theme.tools` (`@theme.tools` / `ui.theme.tools`). **`@theme.tools` is the single canonical home for ALL shared utilities, libraries, UI components, themes, and complex cross-site engines** (always named by what they are, never after a vendor brand) across **28 Default `@theme.tools` Libraries**:
  - **Tier 1 (5 Core Packages)**: `@theme.tools/themes`, `@theme.tools/ui`, `@theme.tools/blog`, `@theme.tools/catalog`, `@theme.tools/testing`.
  - **Tier 2 (15 CF-Native Absorbed SaaS Engines)**: `@theme.tools/workflows`, `@theme.tools/integrations`, `@theme.tools/social`, `@theme.tools/scheduling`, `@theme.tools/signing`, `@theme.tools/forms`, `@theme.tools/links`, `@theme.tools/keys`, `@theme.tools/notifications`, `@theme.tools/crm`, `@theme.tools/inbox`, `@theme.tools/billing`, `@theme.tools/status`, `@theme.tools/kb`, `@theme.tools/dataplane`.
  - **Tier 3 (8 Foundational Utilities)**: `@theme.tools/telemetry`, `@theme.tools/auth`, `@theme.tools/flags`, `@theme.tools/agent-ui`, `@theme.tools/seo-geo`, `@theme.tools/media-video`, `@theme.tools/crawl-research`, `@theme.tools/i18n-a11y`.
  Save future/deferred work, recommendations (`Recs:`), or remaining slices of huge prompts via **OpenSpec** (`openspec/changes/<change-id>/`) in each respective repo and create/sync the linked issue in **Paperclip** (`~/.agentskills/bin/openspec-paperclip-sync.ts`).
- **Frontier Architect Only for OpenSpec (`claude` / `codex` / `antigravity` — NEVER `opencode`)**: **Claude Code (`claude`) with a fully-loaded, hydrated context** (or `codex` / `antigravity`) is the Architect who authors OpenSpec details (`proposal.md`, `design.md`, `tasks.md`, `specs/`). **NEVER spell out the details of the app or OpenSpec with `opencode`.**
- **Langfuse Always-On + Graceful Timeout Fallback (`2500ms`)**: Always trace AI/LLM/agent calls to Langfuse with a strict `2500ms` timeout (`AbortSignal.timeout(2500)`), 3-strike circuit breaker, and fail-open local JSONL spool (`~/.agentskills/bin/lib/langfuse-safe.ts`) so Langfuse outages never block execution.
- TypeScript strict, never `any`, prefer `interface` over `type`
- Hono inline handlers for RPC type inference
- Zod validation on all inputs
- TDD: failing test first, Playwright 6 breakpoints
- Dark-first design, #060610 bg, #00E5FF accent
- Deploy to CF Workers, purge CDN after every deploy

See CONVENTIONS.md for full patterns.
