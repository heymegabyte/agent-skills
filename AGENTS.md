# Emdash Skills — Agent Instructions

This repository contains 23 skill categories, 52 agents, and 149 reference docs for autonomous product building.

## Stack

CF Workers + Hono | React 19 + Vite + shadcn/ui (sites) / Angular 22 + Spartan UI (apps) | D1/Neon | Drizzle v1-rc | Clerk | Stripe + Link (default) · Square on request | Inngest | Amazon SES | Bun | Playwright v1.63+ | PostHog | Sentry

## Usage

Load skills on demand via the skill router (`_router.md`). Each category has a `SKILL.md` with submodules listed in frontmatter.

## Key Files

- `CONVENTIONS.md` — shared constants, patterns, stack config
- `_router.md` — routes prompts to smallest useful skill subset
- `SKILL_PROFILES.md` — default bundles by product type (SaaS, API, Marketing, etc.)
- `llms.txt` — LLM-optimized index of all skills

## For AI Coding Tools

This repo is compatible with the agentskills.io open standard. Skills work in Claude Code, OpenAI Codex, Cursor, GitHub Copilot, VS Code, Windsurf, Augment, OpenHands, Gemini CLI, and 30+ other tools.

## Platform Variants (30 total)

Modern formats: `.cursor/rules/` (MDC) | `.windsurf/rules/` (trigger frontmatter) | `.augment/rules/` (type frontmatter) | `.github/instructions/` (applyTo frontmatter) | `.openhands/microagents/` | `.aiassistant/rules/` | `.kiro/steering/` | `.void/rules/`
Legacy formats: `.cursorrules` | `.windsurfrules` | `.clinerules` | `.rules` | `.augment-guidelines` | `.aider-conventions.md` | `.github/copilot-instructions.md`
Named formats: `AGENTS.md` | `GEMINI.md` | `AMP.md` | `CODEX.md` | `QODO.MD` | `replit.md`
Directory formats: `.amazonq/rules/` | `.junie/` | `.trae/rules/` | `.tabnine/guidelines/` | `.kilo/rules/` | `.roo/rules/` | `.continue/rules/` | `.agents/skills/` | `.bolt/` | `.cursor/BUGBOT.md`

Install: `claude plugin install heymegabyte/agent-skills`
Codex: Clone into `~/.codex/skills/` or `.agents/skills/`
npm: `npm i @heymegabyte/agent-skills`
<!-- EMDASH:POLICY:BEGIN id="operational-prompt-hydration" version="1.0.0" digest="sha256:4833e290e756aecb61e14bdcff1be6f01137730bc3a27b7445eb1a78dcad960e" source-revision="4833e290e756aecb61e14bdcff1be6f01137730b" -->
Hydrate engineering requests into complete intended outcomes using repository context, current research, explicit requirements, and recorded assumptions. Use a small team of role-based agents to challenge the architecture, then express the work in OpenSpec and execute independent tasks in parallel. Build reusable capabilities in theme.tools and consume its packages. Verify behavior, update documentation, and promptly commit and push coherent changes to main. Learn reusable lessons and user preferences from evidence. After delivering the requested outcome, implement applicable improvements and repeat across the product until no justified work remains or execution must pause. Preserve exact resumable state. Respect explicit scope, current user corrections, platform constraints, and existing authorization.

The policy is projected only through supported user-controlled repository, global, plugin, harness, coordinator, and worker surfaces. It never claims to replace provider-controlled system or developer instructions. Explicit user corrections, platform constraints, authorization boundaries, and higher-priority instructions remain controlling.
<!-- EMDASH:POLICY:END -->
