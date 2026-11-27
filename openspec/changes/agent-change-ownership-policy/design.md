# Design: Agent OpenSpec Change-Ownership Policy

## Canonical source + distribution

- ONE canonical policy: `rules/openspec-change-ownership.md` (detailed) + the concise invariant embedded in
  the repo-root always-loaded files `CLAUDE.md` / `AGENTS.md` / `GEMINI.md`.
- `bin/sync-fleet-harnesses.ts` (lines ~325–335) maps repo-root → `$HOME`:
  `.claude/CLAUDE.md`←`CLAUDE.md` · `.codex/AGENTS.md`←`AGENTS.md` · `.gemini/GEMINI.md`←`GEMINI.md` ·
  `.config/opencode/AGENTS.md`←`AGENTS.md`. Editing the canonical repo files + re-running that copy is the
  supported, overwrite-idempotent distribution path. No per-agent hand-edited copies (sync would overwrite them).

## Precedence / placement

- Essential invariant → always-loaded instruction files (reaches all 4 agents every session).
- Detailed procedure → `rules/openspec-change-ownership.md` (Claude router + referenced by all harnesses);
  priority 2 + triggers so it loads on planning/decompose/dispatch prompts without taxing the every-prompt
  budget (`[[prompt-cache]]` / always-load budget gate).

## Reconciliation with swarm doctrine

- Parallelism unit = the whole OpenSpec change. OpenCode/DeepSeek workers own complete contract-locked
  changes; frontier architects (claude/codex/gemini/antigravity — never opencode) author the OpenSpec.

## Out of scope (separate owned changes)

- Checkpoint hooks, four-agent OpenSpec global config, atomic ownership dispatcher, and the verification
  harness are each captured as their own proposals.
