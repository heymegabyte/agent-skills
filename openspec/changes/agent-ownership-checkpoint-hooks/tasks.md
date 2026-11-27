# Tasks: Agent Ownership Checkpoint Hooks

> Owner: claude-session-fire3 (this session). One owner performed every task below.

## 1. Inspect
- [x] 1.1 Enumerated Claude Code hook events (settings.json wires SessionStart/UserPromptSubmit/PreToolUse/PostToolUse/Stop/PreCompact/…; plugin wires via `hooks/hooks.json`). Codex/Gemini/OpenCode hook surfaces differ → Claude Code implemented; other agents are a documented follow-up.

## 2. Implement (Claude Code, via plugin `hooks/hooks.json`)
- [x] 2.1 SessionStart → `hooks/openspec-ownership-session-start.sh`: surface the invariant + list active OpenSpec changes/owners (scoped to OpenSpec repos).
- [x] 2.2 Before-dispatch readiness/ownership/conflict = enforced by `bin/change-ownership.ts claim` (refuse-on-conflict, exit 3); intentionally NOT a per-tool-call model hook (per the "don't launch a model after every tool call" guidance).
- [x] 2.3 PreCompact → `hooks/openspec-ownership-precompact.sh`: remind the agent to persist owner/progress/recommendations into OpenSpec before compaction.
- [x] 2.4 Wire additively in `hooks/hooks.json` (declarative = idempotent); `~/.claude/settings.json` untouched.

## 3. Verify
- [x] 3.1 Hook scripts execute standalone (emit sane context, exit 0); SessionStart lists this repo's active changes; `hooks.json` is valid JSON with exactly one SessionStart + one PreCompact entry (no duplicate handler).

## Follow-up (separate changes)
- Before-completion reconcile: extend the existing `agentskills-stop-gate.sh` (not modified here).
- Port the session-start/pre-compact reminders to Codex / Gemini CLI / OpenCode hook surfaces.
- Runtime activation: a Claude Code restart loads the new plugin hooks (reported, not runnable from this session).
