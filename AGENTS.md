# Emdash Skills — Agent Instructions

This repository contains 23 skill categories, 28 agents, and 149 reference docs for autonomous product building.

## Stack

CF Workers + Hono | React 19 + Vite + shadcn/ui (sites) / Angular 22 + Spartan UI (apps) | D1/Neon | Drizzle v1-rc | Clerk | Stripe + Link (default) · Square on request | Inngest | Amazon SES | Bun | Playwright v1.63+ | PostHog | Sentry

## Internal Agent Providers (HARD RULE)

Internal dev/research/agent-orchestration runs on **subscription CLIs** (`claude` + `codex`) for frontier judgment and **DeepSeek-via-OpenCode** (`bin/opencode-deepseek.sh`) for throughput — NEVER the `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` paid APIs to make a model research/plan/review/write code when a CLI can do it. Launch every internal CLI via `bin/with-subscription-cli.sh` (a child `claude` must not inherit `ANTHROPIC_API_KEY`; a child `codex` must not inherit `OPENAI_API_KEY` — either overrides the subscription and bills). Customer-facing OpenAI/Anthropic PRODUCT features are a separate, preserved, platform-billed axis. SSOT: `rules/agent-provider-policy.md`.

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
