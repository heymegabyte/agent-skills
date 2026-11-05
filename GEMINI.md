# Emdash Skills for Gemini

Load CONVENTIONS.md for stack defaults. Load _router.md for skill routing.
23 categories, 190 doctrine rules, 30 agents, 38 slash commands.

Route substantial tasks through `bin/skill-router.py`; load selected skills progressively. Apply `rules/low-hanging-fruit.md`, use OpenSpec for material changes, and run `bin/run-perfect-loop.mjs` before claiming repository-wide convergence.

Require explicit user approval of the current Figma artifact before implementing any surface Figma can materially guide; store the approval reference in OpenSpec.

## Stack

CF Workers + Hono | React 19 + Vite + shadcn/ui (sites) / Angular 22 + Spartan UI (apps) | D1/Neon | Drizzle v1-rc | Better Auth | Stripe + Link (default) · Square on request | Inngest | Amazon SES | Bun | Playwright v1.63+ | PostHog | Sentry

## Rules

- **Prefer TypeScript over Python** (Node 24 native strip-types / Bun + Bash for system glue; never reach for Python by default for scripts, automation, verifiers, exporters, or tests)
- **Implement Every Recommendable Idea & Top-X Feedback Loop (`rules/prompt-as-training-signal.md` §8, `rules/auto-integrate-recs.md`, `rules/improvement-audit.md`)**: **Any of the ideas that the AI thinks are recommendable should be implemented.** Never cap at 4–6 or 30%: implement every recommendable idea in the same turn (using `opencode-swarm.mjs`, feature flags, or lazy CLI shims `cnf-build-shims`), ask yourself **why each wanted feature wasn't automatically implemented before the user asked for the Top X ideas**, and modify `~/.agentskills` + upstream templates (`install.doctor`, `template.projectsites.dev`) in the same turn so the idea gets automatically integrated on pass 1 next time.
- TypeScript strict, never `any`, prefer `interface` over `type`
- Hono inline handlers for RPC type inference
- Zod validation on all inputs
- TDD: failing test first, Playwright 6 breakpoints
- Dark-first design, #060610 bg, #00E5FF accent
- Deploy to CF Workers, purge CDN after every deploy

See CONVENTIONS.md for full patterns.
