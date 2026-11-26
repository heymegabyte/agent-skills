# Proposal: Enforce Atomic Commit → Push → Publish (Live Deploy + CDN Purge) → Live Edge Verify & Mandatory Parallel Triad Subagent Execution

> **Architect:** antigravity / claude (hydrated frontier context — non-OpenCode spec)
> **Architect Role:** assigned

## Why

During a multi-worktree site update (`questionl.ink`), changes were committed and pushed to GitHub (`origin/main`) without automatically running `pnpm deploy` / `wrangler deploy` + Cloudflare CDN cache purge + live edge verification in the same turn, and without spawning parallel subagents to absorb inferred value into `heymegabyte/theme.tools`, `heymegabyte/install.doctor`, and `heymegabyte/agent-skills` alongside 12-dimension MECH prompt hydration and OpenSpec generation. Treating `git push` as the finish line leaves production stale and violates the one-prompt complete delivery doctrine.

## What Changes

1. **Top-Level System Prompt Mandate — Atomic `Commit → Push → Publish (Live Deploy + CDN Purge) → Live Edge Verify`**:
   - Codify at the very top of `/Users/Apple/.gemini/config/plugins/agentskills/rules/AGENTS.md` (`/Users/Apple/.gemini/GEMINI.md`), `/Users/Apple/.agentskills/AGENTS.md`, `/Users/Apple/.agentskills/GEMINI.md`, `/Users/Apple/.agentskills/CLAUDE.md`, `/Users/Apple/.agentskills/CONVENTIONS.md`, `/Users/Apple/.claude/CLAUDE.md`, `/Users/Apple/.codex/AGENTS.md`, `rules/always.md`, `rules/production-delivery-closure.md`, and `rules/total-convergence-and-openspec-handoff.md` that every prompt touching a site, worker, or app MUST automatically build, commit, push to `origin/main`, publish live (`pnpm deploy` / `npx wrangler deploy`), purge the Cloudflare CDN cache, and verify the live production endpoints (`https://<domain>/`, `/api/health`, `/og.png`, `/favicon.svg`, `/apple-touch-icon.png`) in the same turn.
2. **Mandatory Parallel Subagent Execution (`invoke_subagent`) for Prompt Hydration, OpenSpec & Sovereign Triad Value Absorption**:
   - Require every prompt to hydrate the 12-dimension MECH prompt context, author/update OpenSpec (`openspec/changes/<change-id>/{proposal.md,design.md,tasks.md}`), and spawn parallel subagents to extract and commit/push every inferred reusable component, brand asset, CLI/system rule, and architectural lesson into `heymegabyte/theme.tools`, `heymegabyte/install.doctor`, and `heymegabyte/agent-skills` concurrently.
3. **Canonical Brand Logo Registry Propagation (`questionl.ink`)**:
   - Record `questionl.ink` (`/logos/10-sovereign-questionlink-crown-ideogram.png`, `10-sovereign-questionlink-crown-transparent.png`, dark-navy `#181B2E` squircle with electric-cyan `#19B5FE` question-mark equalizer waveform bars `/favicon.svg` & `/apple-touch-icon.png`, `1200x630` `/og.png` with `"Train repositories by answering questions"`, and `home.megabyte.space` `/icons/question-link.png`) across all canonical agent instruction surfaces.
