---
last_reviewed: 2026-10-29
superseded_by: null
name: cross-session-recall
description: Two-tier cross-session recall — curated memory first (04-preference-and-memory), then on-demand raw past-session-transcript search + LLM summarization when a prior session likely solved it but nothing was curated. Absorbed from NousResearch/hermes-agent (FTS5 session search).
pack: "thinking"
priority: 3
triggers:
  - "cross-session"
  - "past session"
  - "did we do this before"
  - "recall prior"
  - "session search"
  - "search past conversations"
---

# Cross-Session Recall (reuse prior sessions; don't re-derive)

Before non-trivial work, RECALL whether this (or a similar task) was done before — reuse the prior decision/approach/pitfall instead of re-deriving it. Two tiers: curated memory first, raw past-session search as the on-demand fallback. Absorbed from `NousResearch/hermes-agent` (FTS5 session search + LLM summarization) per [[upstream-absorption-register]]; it complements — never replaces — the curated memory system.

## Tier 1 — curated memory (primary, automatic)

- The `04-preference-and-memory` skill (`MEMORY.md` index + `memory/*.md` + mem0 MCP) holds the FACTS we chose to persist; they load into context each session. Check these FIRST — they are the deliberate, high-signal recall.
- A recalled memory reflects what was TRUE when written — if it names a file/flag/API, re-verify it still exists before acting ([[verify-against-source-of-truth]]).

## Tier 2 — raw past-session search (on-demand fallback — the Hermes gap)

- When curated memory lacks it but a PRIOR SESSION likely handled it (a familiar-smelling bug, a decision you suspect was made but never curated, "how did I set up X last time"), SEARCH the raw session transcripts, then LLM-SUMMARIZE the relevant one into the working context — never dump raw transcript.
- Where: the Claude Code session logs (`~/.claude/projects/<project>/*.jsonl`); `rg`/`grep` is the floor, a SQLite FTS5 index (Hermes's mechanism) is the scale upgrade.
- BOUNDED: search → summarize the TOP hit(s) to the decision/approach/pitfall → cite the session (path + date). Don't ingest whole transcripts (oversized-read guard, [[monitor-orchestration]] context budget).

## Discipline (recall is evidence, not authority)

- A past session's approach is a HINT to verify against CURRENT source, not a mandate ([[verify-against-source-of-truth]]) — code/APIs drift between sessions.
- Close the loop: if Tier-2 recall surfaces a reusable lesson that was never curated, PROMOTE it to the memory system the SAME turn ([[prompt-as-training-signal]]) so next time it's a Tier-1 hit.
- Secrets never leave the transcript into a log/prompt/summary; summarize behavior, not credentials.

## Cross-links

`04-preference-and-memory` skill (Tier-1 curated memory) · [[expand-context-always]] (recall = widening context) · [[verify-against-source-of-truth]] (recalled approach = evidence, re-verify) · [[prompt-as-training-signal]] (promote uncurated lessons up) · [[trace-driven-self-evolution]] (sibling Hermes absorption) · [[upstream-absorption-register]] (provenance).
