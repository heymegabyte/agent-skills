---
last_reviewed: 2026-10-04
superseded_by: null
name: "agent-self-manages-context"
priority: 2
pack: "core"
triggers:
  - "fresh session"
  - "context window"
  - "context budget"
  - "saturation"
  - "autocompact"
  - "compact context"
  - "too long"
paths:
  - "*"
---

# Agent Self-Manages Context — NEVER Punt to a Fresh Session

The agent manages its OWN context. When the context grows long, it compacts, delegates, and
CONTINUES — it NEVER tells the user to "start a fresh session," "run this in a new session," or
"hand off to a fresh context." Pushing context-management onto the human is a defect (Brian
directive 2026-10-04: *"it should be you who reduces the size of the context… make it happen
automatically"*).

## Why "fresh session" is wrong

- **The runtime auto-compacts and continues.** `~/.claude/settings.json` has `autoCompactEnabled: true`;
  Claude Code summarizes the context when it grows long and carries the summary into the next window —
  "work can continue; you don't need to wrap up early or hand off mid-task" (the harness's own context
  note). A human-initiated fresh session is therefore never required to keep going.
- **"Use a fresh session" offloads the agent's job onto the user.** It's the context-management sibling
  of the banned "should I continue?" stop-question (`[[always]]` § Autonomy). The user already said keep
  going; the agent owns staying lean.

## What the agent does INSTEAD (the self-management ladder)

1. **Keep the lead lean by default** — the main thread holds CONCLUSIONS only. Never read giant files;
   never dump huge tool outputs into the lead (cap/summarize them); delegate inventory + heavy reads to
   fresh subagents (they have their OWN context) per `[[delegate-when-saturated]]` + `[[parallel-subagent-economy]]`.
   This is the primary lever — a lean lead rarely saturates.
2. **Delegate the heavy pass** — when work is bounded + mechanical, a fresh-context SUBAGENT does it on a
   tight brief and returns ≤200 words. The lead orchestrates + stays small. The "fresh context" lever is a
   subagent, NOT a fresh main session.
3. **Trust autocompact** — when the window genuinely fills, the harness compacts automatically and the
   session continues transparently. Do not pre-empt it by halting; keep working.
4. **Checkpoint-and-CONTINUE, never checkpoint-and-stop** — if a durable resume point helps, write a tight
   `progress.md`, then KEEP GOING in the SAME session (autocompact carries the summary forward). `progress.md`
   is a safety net for an unexpected kill, not an instruction for the user to restart.

## The only real HARD STOP (and even it doesn't punt to the user)

- A genuine orchestrator failure — the harness itself erroring "Prompt is too long" on a tool call it
  cannot complete, or an `autocompact thrashing` notice — is handled by: checkpoint to `progress.md` →
  let autocompact run → CONTINUE. The session resumes itself on the next step; the agent does not stop and
  ask the human to open a new session.
- A single worker/subagent dying (ECONNRESET / `subagent_tokens: 0` from a drop) is fan-out attrition, not
  lead saturation — salvage its commit + re-queue + keep the loop running (`[[monitor-orchestration]]` §13).

## Banned phrasings (never emit to the user)

"use a fresh session" · "run this in a new/fresh session" · "start fresh" · "hand off to a fresh context" ·
"this needs a clean session" · "ideally in a fresh session" · "the lead is too deep — restart." Replace
every one with: delegate it, checkpoint-and-continue, or just keep going.

## Cross-links

`[[always]]` (§ Context budget — the always-loaded one-liner) · `[[delegate-when-saturated]]` ·
`[[parallel-subagent-economy]]` · `[[monitor-orchestration]]` · `[[emdash-fleet]]` (fleet context economy) ·
`[[loop-driven-development]]`.
