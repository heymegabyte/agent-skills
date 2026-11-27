# Emdash Skills — Agent Instructions

This repository contains 23 skill categories, 55 agents, and 151 reference docs for autonomous product building.

## Scoped shared platform

For products and migration sources in [the reviewed platform scope](reference/platform-stack.json),
including their shared infrastructure, load
[rules/platform-shared-capabilities.md](rules/platform-shared-capabilities.md)
and its relevant modules on demand. The same manifest identifies ProjectSites
as a migration source and lists the policy pack and convergence prompt.

## Stack

CF Workers + Hono | React 19 + Vite + ui.theme.tools (`@theme.tools/ui` — exclusive component system for ALL sites, apps, dashboards, admin consoles, calendars, and portals; NO Angular / NO Spartan UI) | D1/Neon | Drizzle v1-rc | Better Auth | Stripe + Link (default) · Square on request | Inngest | Amazon SES | Bun | Playwright v1.63+ | PostHog | Sentry

## Top-Level Execution Mandates (Every Prompt, Every Surface)

- **OpenSpec Change Ownership — Plan & Decompose Early (`rules/openspec-change-ownership.md`)**: Before substantial implementation, map authorized work into coherent **OpenSpec changes** (one outcome · bounded scope · acceptance · dependencies · verification; small enough for one agent). Each active change has exactly ONE owning agent instance that directly performs EVERY subtask — design, code, tests, docs, fixes, artifact upkeep, completion verification; NEVER split one change's checklist across agents (a reviewer reports, the owner fixes). **Parallelize ACROSS changes, not within one** — to add implementers, split into more changes (the dispatch unit is the whole change, owned end-to-end). On discovering a concrete high-value improvement at ANY phase, immediately preserve it in OpenSpec with real content (problem · evidence · benefit · scope · priority · deps · acceptance), updating the matching change or opening a scoped proposal routed to its owner; capturing a proposal ≠ authorization to build it.
- **Atomic `Commit → Push → Publish (Live Deploy + CDN Purge) → Live Edge Verify` Mandate**: Every prompt touching a site, worker, or app MUST automatically build, commit, push to `origin/main`, **publish/deploy live (`pnpm deploy` / `npx wrangler deploy`)**, purge the Cloudflare CDN cache, and verify the live production domain (`https://<domain>/`, `/api/health`, `/og.png`, `/favicon.svg`, `/apple-touch-icon.png`) in the same turn. Never treat `git push` alone as completion without publishing live.
- **Mandatory Parallel Subagent Execution (`invoke_subagent`) for Prompt Hydration, OpenSpec & Sovereign Triad Value Absorption (`theme.tools` + `install.doctor` + `agent-skills`)**: On every prompt, hydrate the 12-dimension MECH prompt context, author/update OpenSpec (`openspec/changes/<change-id>/{proposal.md,design.md,tasks.md}` via a Frontier Architect: `claude` / `codex` / `antigravity`, NEVER `opencode`), and spawn parallel subagents to extract and commit/push every inferred reusable component, brand asset, CLI/system rule, and architectural lesson into `heymegabyte/theme.tools`, `heymegabyte/install.doctor`, and `heymegabyte/agent-skills` concurrently.
- **Dogfood Principle (`@theme.tools#main`) & Canonical Brand Logo Registry**:
  - Track `heymegabyte/theme.tools#main` live (`@theme.tools/*` / `@theme-tools/ui/coming-soon` `<ComingSoonPage />`) across all sites and apps.
  - **`voice.build`**: `/logos/10-sovereign-voice-crown-signature-ideogram.png` (`/favicon.svg`, `/apple-touch-icon.png`, `home.megabyte.space` `/icons/voice-build.png`).
  - **`qubes.cloud`**: `/logos/10-sovereign-voice-crown-signature-ideogram.png` (`10-sovereign-qubes-crown-signature-ideogram.png`, `/favicon.svg`, `/apple-touch-icon.png`, `home.megabyte.space` `/icons/qubes-cloud.png`).
  - **`publish.engineer`**: `/logos/08-sacred-folio-lissajous.png` (`/favicon.svg`, `/apple-touch-icon.png`, `home.megabyte.space` `/icons/publish-engineer.png`).
  - **`post.vision`**: `/logos/06-chronos-timeline-horizon-ideogram.png` (`/favicon.svg`, `/apple-touch-icon.png`, `home.megabyte.space` `/icons/post-vision.png`).
  - **`template.company`**: `/logos/05-titanium-company-foundry-ideogram.png` (`05-titanium-company-foundry-transparent.png`, `/favicon.svg`, `/apple-touch-icon.png`, `home.megabyte.space` `/icons/template-company.png`).
  - **`status.charity`**: `/logos/06-verifiable-altruism-spectrogram-ideogram.png` (`06-verifiable-altruism-spectrogram-transparent.png`, `/favicon.svg`, `/apple-touch-icon.png`, `home.megabyte.space` `/icons/status-charity.png`).
  - **`questionl.ink`**: `/logos/08-sacred-dialectic-lissajous-ideogram.png` (`08-sacred-dialectic-lissajous-transparent.png`, recolored to the website's `#060610` canvas, `#0B0B18` card, `#00E5FF` cyan, and `#7C3AED` violet OKLCH palette with zero pink/magenta; Question-Mark Equalizer Waveform icon from Edition 10 adapted to `#060610`/`#00E5FF`/`#7C3AED` with Lissajous orbital rings for `/favicon.svg`, `/apple-touch-icon.png`, `/android-chrome-192x192.png`, `/android-chrome-512x512.png`, `/icon-192.png`, `/icon-512.png`, and `home.megabyte.space` `/icons/question-link.png` — used ONLY for the app icon & favicon, while the navbar displays only the `QUESTIONL.INK` wordmark without the icon; and `1200x630` `/og.png` & `/featured-image.png` with `"Train repositories by answering questions"`).
  - **`radiant.website`**: `/logos/06-chromatic-raytrace-spectrogram-ideogram.png` (square horizontal-line gradient spectrogram `/favicon.svg` & `/apple-touch-icon.png`, and `home.megabyte.space` `/icons/radiant-website.png`).
  - **Post-Crowning Dashboard Hygiene (Remove 10-Edition Logo Studio Once Crowned)**: When a project's official logo has been crowned from the 10-edition Codex+Ideogram exploration suite (e.g., `08-sacred-dialectic-lissajous-ideogram.png` for `questionl.ink`), remove the 10-edition Coming Soon Logo Studio / edition switcher / scope-trainer marketing block from below the live application dashboard (`/`) so the production app dashboard only shows its core functional UI (navbar + user pages / get-started prompts).

## Usage

Load skills on demand via the skill router (`_router.md`). Each category has a `SKILL.md` with submodules listed in frontmatter.

## Temporary workspace cleanup

At task closeout, preserve unpublished work and required verification evidence, then remove disposable temporary folders and finished worktrees. Check for active users and concurrent work before removing anything. Use Git to remove worktrees and record why any temporary folder must stay.

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
<!-- EMDASH:POLICY:BEGIN id="operational-prompt-hydration" version="1.2.0" digest="sha256:c30476a5a84ed3e7dd0295f6287877c3817b021b8cac1a28afb4ca12585a7bc0" source-revision="c30476a5a84ed3e7dd0295f6287877c3817b021b" -->
Hydrate engineering requests into complete intended outcomes using repository context, current research, explicit requirements, and recorded assumptions. Use role-based agents to challenge material architecture decisions and express the work in OpenSpec. At intake and after each dependency clears, dispatch independent work concurrently whenever doing so reduces time to verified delivery. Delegate every suitable task to OpenCode with DeepSeek through LiteLLM when it meets the acceptance bar and improves throughput. Use Codex, Gemini, or Claude for work that benefits materially from premium capability or independent review, and record concrete reasons for premium routing or limited dispatch. Scale worker count to ready work, isolation, and approved capacity. Give workers disjoint ownership and acceptance checks, verify integrated results, and record concrete limits on dispatch. Build reusable capabilities in theme.tools and consume its packages. Verify behavior, update documentation, and promptly commit and push coherent changes to main. Learn reusable lessons and user preferences from evidence. After delivering the requested outcome, implement applicable improvements and repeat across the product until no justified work remains or execution must pause. Preserve exact resumable state. Respect explicit scope, current user corrections, platform constraints, and existing authorization.

The policy is projected only through supported user-controlled repository, global, plugin, harness, coordinator, and worker surfaces. It never claims to replace provider-controlled system or developer instructions. Explicit user corrections, platform constraints, authorization boundaries, and higher-priority instructions remain controlling.
<!-- EMDASH:POLICY:END -->
