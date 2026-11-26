# Design: Atomic Commit → Push → Publish Pipeline & Parallel Triad Subagent Execution

> **Architect:** antigravity / claude (hydrated frontier context — non-OpenCode spec)
> **Architect Role:** assigned

## Architectural Overview

### 1. Atomic 4-Stage Finish Line (`Commit → Push → Publish → Live Edge Verify`)

Every implementation turn targeting a web property, Cloudflare Worker, or SaaS application executes an indivisible 4-stage closure pipeline:

1. **Build & Test**: Run typecheck, unit tests, and production bundle build (`pnpm build`).
2. **Git Commit & Push**: Commit tested working tree and push to `origin/main` (`git push origin main`).
3. **Live Edge Publish & CDN Purge**: Execute `pnpm deploy` / `npx wrangler deploy` followed immediately by Cloudflare Zone cache purge (`purge_everything: true`).
4. **Live Production Edge Verification**: Verify live HTTP `200` and content-type headers on `https://<domain>/`, `/api/health`, `/og.png`, `/favicon.svg`, and `/apple-touch-icon.png`.

### 2. Concurrent Parallel Subagent Execution (`invoke_subagent`)

To prevent sequential bottlenecking or skipped ecosystem extraction, the lead orchestrator spawns parallel subagents during the turn:
- **Subagent 1 (`theme.tools` Value Absorber)**: Extracts reusable components, brand presets, and 16-state OKLCH assets into `/Users/Apple/emdash/repositories/theme.tools` and pushes to `origin/main`.
- **Subagent 2 (`install.doctor` Provisioning & Verifier Absorber)**: Extracts CLI verifiers, shell shims, and domain health probes into `/Users/Apple/emdash/repositories/install.doctor` and pushes to `origin/main`.
- **Subagent 3 (`agent-skills` System Prompt & Rule Enforcer)**: Codifies the root-cause lesson and OpenSpec change into `/Users/Apple/.agentskills` and global harness system prompts (`~/.gemini/GEMINI.md`, `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`) and pushes to `origin/main`.
