# Tasks: OpenSpec Global Integration for the Four Agents

> Status: Proposed — assign ONE owner before implementation; that owner does every task.

## 1. Inspect

- [ ] 1.1 Confirm `openspec update` targets + current global config for claude/codex/gemini/opencode.

## 2. Implement

- [ ] 2.1 Run/verify `openspec update` for the four agents (preserve project-specific config).
- [ ] 2.2 Make `openspec init --tools claude,codex,gemini,opencode,agents` the bootstrap default.
- [ ] 2.3 Fold the ownership invariant into OpenSpec proposal/spec/design/tasks templates + schema guidance.

## 3. Verify

- [ ] 3.1 Fresh fixture project passes `openspec validate`; bootstrap includes the invariant; re-run is duplicate-free.
