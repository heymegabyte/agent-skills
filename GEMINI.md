# Emdash Skills for Gemini

Load CONVENTIONS.md for stack defaults. Load _router.md for skill routing.
23 categories, 149 reference docs, 28 agents.

## Stack

CF Workers + Hono | React 19 + Vite + shadcn/ui (sites) / Angular 22 + Spartan UI (apps) | D1/Neon | Drizzle v1-rc | Clerk | Stripe + Link (default) · Square on request | Inngest | Amazon SES | Bun | Playwright v1.63+ | PostHog | Sentry

## Rules

- **Prefer TypeScript over Python** (Node 24 native strip-types / Bun + Bash for system glue; never reach for Python by default for scripts, automation, verifiers, exporters, or tests)
- **Top-X Full-Cohort Auto-Implementation & Feedback Loop (`rules/prompt-as-training-signal.md` §8, `rules/auto-integrate-recs.md`, `rules/improvement-audit.md`)**: Brian wants **almost all (~90–95%+)** of any Top 30 list implemented. Never cap at 4–6 or 30%: auto-implement the entire safe, non-blocklisted cohort (~25–30 of 30) in the same turn (using `opencode-swarm.mjs`, feature flags, or lazy CLI shims `cnf-build-shims`), ask yourself **why each wanted feature wasn't automatically implemented before the user asked for the Top X ideas**, and modify `~/.agentskills` + upstream templates (`install.doctor`, `template.projectsites.dev`) in the same turn so the idea gets automatically integrated on pass 1 next time.
- TypeScript strict, never `any`, prefer `interface` over `type`
- Hono inline handlers for RPC type inference
- Zod validation on all inputs
- TDD: failing test first, Playwright 6 breakpoints
- Dark-first design, #060610 bg, #00E5FF accent
- Deploy to CF Workers, purge CDN after every deploy

See CONVENTIONS.md for full patterns.
