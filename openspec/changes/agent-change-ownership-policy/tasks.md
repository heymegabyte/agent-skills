# Tasks: Agent OpenSpec Change-Ownership Policy

> Owner: claude (this session). One owner performs every task below.

## 1. Canonical policy
- [x] 1.1 Author `rules/openspec-change-ownership.md` (invariant, decompose, one-owner, capture, reconciliation, verify, anti-patterns).

## 2. Always-loaded invariant (all 4 agents)
- [x] 2.1 Insert concise invariant into `CLAUDE.md` (Claude Code).
- [x] 2.2 Insert concise invariant into `AGENTS.md` (Codex + OpenCode).
- [x] 2.3 Insert concise invariant into `GEMINI.md` (Gemini CLI).

## 3. Distribute to installed copies (existing sync mapping)
- [x] 3.1 Copy repo `CLAUDE.md` → `~/.claude/CLAUDE.md`.
- [x] 3.2 Copy repo `AGENTS.md` → `~/.codex/AGENTS.md` AND `~/.config/opencode/AGENTS.md`.
- [x] 3.3 Copy repo `GEMINI.md` → `~/.gemini/GEMINI.md`.

## 4. Capture follow-up proposals (OpenSpec, with real content)
- [x] 4.1 `agent-ownership-checkpoint-hooks` (proposed).
- [x] 4.2 `openspec-four-agent-global-integration` (proposed).
- [x] 4.3 `change-ownership-atomic-dispatcher` (proposed).
- [x] 4.4 `change-ownership-verification-suite` (proposed).

## 5. Verify + ship
- [x] 5.1 Grep the invariant present in all 4 installed files.
- [x] 5.2 `openspec validate agent-change-ownership-policy --strict`.
- [x] 5.3 Commit + push to `origin/main`.
