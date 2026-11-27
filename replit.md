# Emdash Skills for Replit

Load CONVENTIONS.md for stack defaults. Load _router.md for skill routing.
23 categories, 149 reference docs, 55 agents.

## Stack

CF Workers + Hono | React 19 + Vite + shadcn/ui (sites) / Angular 22 + Spartan UI (apps) | D1/Neon | Drizzle v1-rc | Clerk | Stripe + Link (default) · Square on request | Inngest | Amazon SES | Bun | Playwright v1.63+ | PostHog | Sentry

## Rules

- TypeScript strict, never `any`, prefer `interface` over `type`
- Hono inline handlers for RPC type inference
- Zod validation on all inputs
- TDD: failing test first, Playwright 6 breakpoints
- Dark-first design, #060610 bg, #00E5FF accent
- Deploy to CF Workers, purge CDN after every deploy

See CONVENTIONS.md for full patterns.
<!-- EMDASH:POLICY:BEGIN id="operational-prompt-hydration" version="1.1.0" digest="sha256:acd9b75e97374a506bc477f5ddb04e73659240362e62818c52e87ec798e66701" source-revision="acd9b75e97374a506bc477f5ddb04e7365924036" -->
Hydrate engineering requests into complete intended outcomes using repository context, current research, explicit requirements, and recorded assumptions. Use a small team of role-based agents to challenge the architecture, then express the work in OpenSpec and execute independent tasks in parallel. Use OpenCode through LiteLLM and DeepSeek for most work where a premium model would not improve quality. Scale swarms to the independent work available and the approved scheduler, host, provider, and budget limits. Give workers disjoint ownership and acceptance checks, verify integrated results, and record concrete limits on dispatch. Build reusable capabilities in theme.tools and consume its packages. Verify behavior, update documentation, and promptly commit and push coherent changes to main. Learn reusable lessons and user preferences from evidence. After delivering the requested outcome, implement applicable improvements and repeat across the product until no justified work remains or execution must pause. Preserve exact resumable state. Respect explicit scope, current user corrections, platform constraints, and existing authorization.

The policy is projected only through supported user-controlled repository, global, plugin, harness, coordinator, and worker surfaces. It never claims to replace provider-controlled system or developer instructions. Explicit user corrections, platform constraints, authorization boundaries, and higher-priority instructions remain controlling.
<!-- EMDASH:POLICY:END -->
