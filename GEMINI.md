# Emdash Skills for Gemini

Load CONVENTIONS.md for stack defaults. Load _router.md for skill routing.
23 categories, 149 reference docs, 28 agents.

## Stack

CF Workers + Hono | React 19 + Vite + shadcn/ui (sites) / Angular 22 + Spartan UI (apps) | D1/Neon | Drizzle v1-rc | Clerk | Stripe + Link (default) · Square on request | Inngest | Amazon SES | Bun | Playwright v1.63+ | PostHog | Sentry

## Rules

- **Prefer TypeScript over Python** (Node 24 native strip-types / Bun + Bash for system glue; never reach for Python by default for scripts, automation, verifiers, exporters, or tests)
- **Top-X List Selection Feedback Loop (`rules/prompt-as-training-signal.md` §8)**: When a "Top X" (e.g., Top 30) list is printed and the user states which items they want implemented, note the selected items (and any exclusions), ask yourself **why each wanted feature wasn't automatically implemented before the user asked for the Top X ideas**, and modify `~/.agentskills` (and upstream bootstrap/template repos like `install.doctor`) in the same turn so the idea gets automatically integrated on pass 1 next time.
- TypeScript strict, never `any`, prefer `interface` over `type`
- Hono inline handlers for RPC type inference
- Zod validation on all inputs
- TDD: failing test first, Playwright 6 breakpoints
- Dark-first design, #060610 bg, #00E5FF accent
- Deploy to CF Workers, purge CDN after every deploy

See CONVENTIONS.md for full patterns.
