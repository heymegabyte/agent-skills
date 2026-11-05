# Emdash Skills for Gemini

Load CONVENTIONS.md for stack defaults. Load _router.md for skill routing.
23 categories, 190 doctrine rules, 30 agents, 38 slash commands.

Route substantial tasks through `bin/skill-router.py`; load selected skills progressively. Apply `rules/low-hanging-fruit.md`, use OpenSpec for material changes, and run `bin/run-perfect-loop.mjs` before claiming repository-wide convergence.

Require explicit user approval of the current Figma artifact before implementing any surface Figma can materially guide; store the approval reference in OpenSpec.

## Stack

CF Workers + Hono | React 19 + Vite + shadcn/ui (sites) / Angular 22 + Spartan UI (apps) | D1/Neon | Drizzle v1-rc | Better Auth | Stripe + Link (default) · Square on request | Inngest | Amazon SES | Bun | Playwright v1.63+ | PostHog | Sentry

## Rules

- **Prefer TypeScript over Python** (Node 24 native strip-types / Bun + Bash for system glue; never reach for Python by default for scripts, automation, verifiers, exporters, or tests)
- **Implement Every Recommendable Idea & Top-X Feedback Loop (`rules/prompt-as-training-signal.md` §8, `rules/auto-integrate-recs.md`, `rules/improvement-audit.md`)**: **Any of the ideas that the AI thinks are recommendable should be implemented.** Never cap at 4–6 or 30%: implement every recommendable idea in the same turn (using `opencode-swarm.mjs`, feature flags, or lazy CLI shims `cnf-build-shims`), ask yourself **why each wanted feature wasn't automatically implemented before the user asked for the Top X ideas**, and modify `~/.agentskills` + upstream templates (`install.doctor`, `theme.tools`, `template.projectsites.dev`) in the same turn so the idea gets automatically integrated on pass 1 next time.
- **Total Multi-Axis Convergence & Micro-Task Loops (`rules/total-convergence-and-openspec-handoff.md`, `rules/gorgeous-by-default.md`)**: Run `CREATE → RENDER/EXECUTE → EXPERIENCE → CRITIQUE → MODIFY → COMPARE` on every UI widget (across all 16 visual states and `0.333s` OKLCH transitions), sub-feature, business rule, performance path, security boundary, and AI execution surface.
- **Parallel End-of-Turn Triad Sync (`agent-skills` + `install.doctor` + `theme.tools` + touched projects)**: At the end of every prompt pass, infer and apply updates in parallel across `heymegabyte/agent-skills`, `heymegabyte/install.doctor`, and `heymegabyte/theme.tools` (`ui.theme.tools`). Save future/deferred work, recommendations (`Recs:`), or remaining slices of huge prompts via **OpenSpec** (`openspec/changes/<change-id>/`) in each respective repo and create/sync the linked issue in **Paperclip** (`~/.agentskills/bin/openspec-paperclip-sync.ts`).
- **Frontier Architect Only for OpenSpec (`claude` / `codex` / `antigravity` — NEVER `opencode`)**: **Claude Code (`claude`) with a fully-loaded, hydrated context** (or `codex` / `antigravity`) is the Architect who authors OpenSpec details (`proposal.md`, `design.md`, `tasks.md`, `specs/`). **NEVER spell out the details of the app or OpenSpec with `opencode`.**
- **Explicit role gate:** Only an agent explicitly assigned the `architect` role for the specific change may author or modify those artifacts; Gemini/model identity alone is insufficient. Record `**Architect Role:** assigned` in proposal and design.
- **Langfuse Always-On + Graceful Timeout Fallback (`2500ms`)**: Always trace AI/LLM/agent calls to Langfuse with a strict `2500ms` timeout (`AbortSignal.timeout(2500)`), 3-strike circuit breaker, and fail-open local JSONL spool (`~/.agentskills/bin/lib/langfuse-safe.ts`) so Langfuse outages never block execution.
- TypeScript strict, never `any`, prefer `interface` over `type`
- Hono inline handlers for RPC type inference
- Zod validation on all inputs
- TDD: failing test first, Playwright 6 breakpoints
- Dark-first design, #060610 bg, #00E5FF accent
- Deploy to CF Workers, purge CDN after every deploy

See CONVENTIONS.md for full patterns.
