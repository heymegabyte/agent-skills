# Proposal: Agent Ownership Checkpoint Hooks

> **Architect:** claude (hydrated frontier context — non-OpenCode spec)
> **Status:** Proposed — not yet owned (queued for the 30m loop / next assignment).

## Why / Problem
The change-ownership invariant is documented but not reinforced by deterministic checkpoints. Agents can
forget to load the policy at session start, dispatch without a readiness/conflict check, or lose
owner/progress/recommendations across compaction/handoff. Per `determinism-ratchet`, a repeatedly-needed
behavior should become a hook, not a prose reminder.

## Evidence / Assumptions
- Claude Code supports `SessionStart` / `UserPromptSubmit` / `PreToolUse` / `PreCompact` hooks via
  `~/.claude/settings.json` (existing: router-reconcile, guard-oversized-read, enforce-tdd-e2e).
  Codex/OpenCode/Gemini hook surfaces differ and MUST be inspected per each tool's real event names.
- Assumption: a lightweight session-start + pre-dispatch + pre-compact hook materially improves reliability
  without launching a model per tool call.

## Proposed Improvement
Bounded, idempotent, recursion-safe hooks: (1) session start → surface the invariant + list active OpenSpec
changes/owners; (2) before implementation dispatch → check readiness/ownership/dependencies/conflicts;
(3) phase boundaries → prompt a brief capture + decomposition check; (4) before compaction/handoff → persist
owner/progress/decisions/newly-discovered recommendations; (5) before completion → reconcile tasks +
verification evidence + outstanding proposals. Use each tool's actual event names/schemas; preserve existing
hook-trust/permissions. Hooks VALIDATE observable state + remind — they do NOT launch a model after each tool call.

## Expected Benefit
Deterministic enforcement of plan-decompose-early + one-owner + capture, surviving compaction/handoff.

## Scope / Priority / Dependencies
Scope: Claude Code hooks first (known surface); other agents where a supported event exists. Priority: high.
Dependencies: `agent-change-ownership-policy` (invariant reinforced); `change-ownership-atomic-dispatcher`
(owner state the hooks read).

## Acceptance
A fresh session surfaces the invariant + active changes; a dispatch with an unmet dependency/conflict is
flagged; a pre-compact run persists owner+progress+recommendations; hooks are idempotent + recursion-safe;
running `install-hooks` twice adds no duplicate handlers.
