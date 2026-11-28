# Emdash Skills for Qodo

Load CONVENTIONS.md for stack defaults. Load _router.md for skill routing.
23 categories, 151 reference docs, 55 agents.

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
<!-- EMDASH:POLICY:BEGIN id="operational-prompt-hydration" version="1.3.0" digest="sha256:ab50d27fdd31042024a610e9572536725d7c35a68d38872202863bc5b3342cc9" source-revision="ab50d27fdd31042024a610e9572536725d7c35a6" -->
Split material engineering requests into research-backed briefs guided by repository context and applicable skills. Have a frontier architect compile independently verifiable OpenSpec changes. Give each change one owner through verification. Dispatch ready changes concurrently within approved capacity, using OpenCode with DeepSeek through LiteLLM where suitable and recording provider exceptions. During implementation, capture and admit justified improvements in OpenSpec, and route reusable application code, host configuration, and agent procedures to theme.tools, install.doctor, and agent-skills respectively. Verify integrated results, update documentation and consumers, and deliver authorized changes. Refresh evidence until no justified in-scope work remains and preserve resumable state.

The policy is projected only through supported user-controlled repository, global, plugin, harness, coordinator, and worker surfaces. It never claims to replace provider-controlled system or developer instructions. Explicit user corrections, platform constraints, authorization boundaries, and higher-priority instructions remain controlling.
<!-- EMDASH:POLICY:END -->
