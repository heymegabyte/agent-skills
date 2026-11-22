# Emdash Skills — Agent Instructions

This repository contains 23 skill categories, 28 agents, and 149 reference docs for autonomous product building.

## Scoped shared-platform mandate (2026-10-31)

For OnePrompt.site/ProjectSites.dev, theme.tools/ui.theme.tools, desktop.management, Inbox.vision, pdf.kitchen and their shared infrastructure, load [rules/platform-shared-capabilities.md](rules/platform-shared-capabilities.md) before older stack defaults, then its relevant modules. The [platform pack](_packs/platform.yml) and [execution prompt](prompts/platform-convergence.md) require Bolt.diy, Cloudflare Agents, AG-UI, json-render, MCP Apps, Better Auth, AI Search instead of QMD, PlateJS, React Flow, Remotion, Infisical Agent Vault, shared connectors and automation. These scoped decisions supersede conflicting defaults below; preserve unrelated policies and migrate safely. Apply them during `/run-the-loop`, retain explicit Figma approval, and distinguish committed policy from verified product functionality and acknowledged consumer sync.

## Stack

CF Workers + Hono | React 19 + Vite + shadcn/ui (sites) / Angular 22 + Spartan UI (apps) | D1/Neon | Drizzle v1-rc | Clerk | Stripe + Link (default) · Square on request | Inngest | Amazon SES | Bun | Playwright v1.63+ | PostHog | Sentry

## Canonical UI, approval, and Opportunistic `theme.tools` Upstream Extraction (HARD RULE)

For every UI, component, Storybook, theme, Figma, OnePrompt, or ProjectSites task, first read [rules/theme-tools-canonical-components.md](rules/theme-tools-canonical-components.md). Every visual component is sourced, edited, updated, managed, tested, and published through the source repository backing **ui.theme.tools**; **theme.tools** owns starting themes/tokens. **Opportunistic `theme.tools` Upstream Extraction Mandate (Thin-Shell Consumer Repositories)**: Always opportunistically upgrade `theme.tools` (`@theme.tools/*`) while working whenever any component, calculator, advisor, workflow, validator, hook, or library code can potentially be reused across sites or applications. Consumer repositories must contain primarily overall structure, routing, data bindings, and thin configuration adapters rather than standalone source implementations for reusable components and libraries. Consume pinned packages, not local forks or mutable hosted scripts. This supersedes older draftl.ink and per-app copied-component defaults. Guide Brian through explicit Figma approval per screen or for the complete design before programming new/materially changed UI. A general request to implement everything is not design approval. OnePrompt requires Cloudflare, PostHog, Sentry, GA4, GTM, Langfuse Cloud, and Promptfoo, with verified delivery rather than merely installed SDKs. Use manifest-first progressive previews and smallest-sufficient, authorized stack patches; keep generated previews isolated.

## Internal Agent Providers (HARD RULE)

Internal dev/research/agent-orchestration runs on **subscription CLIs** (`claude` + `codex`) for frontier judgment and **DeepSeek-via-OpenCode** (`bin/opencode-deepseek.sh`) for throughput — NEVER the `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` paid APIs to make a model research/plan/review/write code when a CLI can do it. Launch every internal CLI via `bin/with-subscription-cli.sh` (a child `claude` must not inherit `ANTHROPIC_API_KEY`; a child `codex` must not inherit `OPENAI_API_KEY` — either overrides the subscription and bills). Customer-facing OpenAI/Anthropic PRODUCT features are a separate, preserved, platform-billed axis. SSOT: `rules/agent-provider-policy.md`.

## Usage

Hydrate every material prompt before executing it. Use `bin/prompt-hydrator.ts` (or the Claude `UserPromptSubmit` adapter) to preserve the verbatim request, resolve live instructions/specs/code/dependencies, separate explicit/inferred/researched requirements, and select the focused-change or recursive greenfield SaaS cascade. A request such as `clone Notion` loads `rules/greenfield-saas-prompt-hydration.md` and continues research → OpenSpec → implementation → browser verification → gap closure.

The `decisionReadiness` gate is fail-closed: discovery is not loaded context. Material decisions wait for fresh evidence across applicable instructions/authority, OpenSpec/architecture, source/tests/runtime, Context7 or official installed-version documentation, market/users, competitors/substitutes, Cloudflare operations, and shared-platform ownership. After verification, implement every authorized in-scope improvement at confidence `>=0.8` with positive net value, refresh evidence, and stop after two consecutive rounds produce no new qualifying winner. This loop never invents deployment, paid, destructive, credential, or external-communication authority.

For recurring development and local host operations, read [control-plane/FLEET.md](control-plane/FLEET.md) and the matching profile under `machines/`. GitHub owns the per-project schedule; the persistent Ubuntu Proxmox VM is the primary host and prefers Codex for setup. OpenClaw orchestrates official subscription CLIs through Claw Router and direct OpenCode/DeepSeek. Main is normal; feature branches are exceptional. Do not schedule this skills repository.

## End-of-Round Parallel Meaning & Preference Triad Extraction (`agent-skills` + `theme.tools` + `install.doctor`)

At the end of **every prompt round** — executed in **parallel** with final verification, deployment, and reporting (`bin/triad-end-of-turn-sync.ts`) — run a parallel process that extracts any possible meaning, preference, architectural lesson, reusable site module, or system configuration from the current agent window and stores the value concurrently into:

1. **`heymegabyte/agent-skills` (for AI skills, rules & agent master prompts)** — updated under the **Minimum-Prompt Ecosystem Completeness Assumption**: always author and update skills assuming they *should have already been written* so that we write **as few prompts as possible (ideally one)** to finish **as complete a product (or entire multi-repo ecosystem) as possible**, by automatically expanding scope and executing via **massive agent parallelization swarms** (`Claude` + `Codex` + `Gemini` Frontier Triad + 80%+ `OpenCode` DeepSeek throughput swarms).
2. **`heymegabyte/theme.tools` (for site & application code)** — extracting reusable UI components (16 visual states, `0.333s` OKLCH transitions), themes, calculators, workflows, validators, hooks, and cross-site engines into the 28 canonical `@theme.tools/*` libraries.
3. **`heymegabyte/install.doctor` (for system & host code)** — extracting reusable dotfiles, shell environment defaults, lazy CLI shims (`cnf-build-shims`), daemon units, and workstation/server provisioning logic.

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
