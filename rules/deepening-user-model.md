---
last_reviewed: 2026-10-29
superseded_by: null
name: deepening-user-model
description: Maintain the user model as a DEEPENING, periodically re-synthesized representation (derived inductive/deductive conclusions + confidence), not a flat append-only list of point-facts. Absorbed from NousResearch/hermes-agent's Honcho dialectic user modeling — the PRINCIPLE; the Honcho service (AGPL) is an owner-gated option.
pack: "thinking"
priority: 3
triggers:
  - "user model"
  - "deepening model"
  - "who the user is"
  - "dialectic user modeling"
  - "honcho"
---

# Deepening User Model (synthesize, don't just append)

The user model is a MAINTAINED, DEEPENING representation — periodically RE-SYNTHESIZED from accumulated signals into derived conclusions — not a flat append-only pile of point-facts. Absorbed from `NousResearch/hermes-agent`'s "deepening model of who you are across sessions" (powered by Honcho dialectic user modeling) per [[upstream-absorption-register]]; it deepens the `04-preference-and-memory` skill's Voice-of-Customer model, which already captures the raw signals.

## What we already have (the raw-signal layer — keep it)

- `04-preference-and-memory` captures `type:user` facts + the VoC model (exact language · dissatisfaction · aspiration · stylistic prefs) + confidence bands (0.70-1.0) + promotion/demotion + staleness. That is the STORAGE + incremental-capture layer — this rule adds the synthesis ON TOP, it does not replace it.

## The delta — a derived, re-synthesized representation

- **Synthesize, periodically** — beyond appending each new signal, periodically CONSOLIDATE the accumulated signals into a deeper representation: the user's recurring patterns, values, working style, what they reward vs reject — inductive + deductive CONCLUSIONS, not just the facts that seeded them.
- **Conclusions are hypotheses, with confidence** — a DERIVED conclusion ("favors depth over breadth") is lower-confidence than a STATED fact; tag it (reuse the existing 0.70-1.0 bands) and verify before acting on an inference ([[verify-against-source-of-truth]]). NEVER persist a speculative inference AS a fact.
- **It changes over time** — re-derive when new signals CONTRADICT the model; demote/replace the stale conclusion (the skill's promotion/demotion) — the model deepens AND corrects, it doesn't only grow.
- **Bounded + grounded** — synthesize from REAL captured signals only (no invented traits); keep the consolidated model compact (a lens, not an archive).

## The Honcho option (owner-gated — absorb the PRINCIPLE now)

- Honcho (`plastic-labs/honcho`, **AGPL-3.0**) is the infra that does this at scale — a background "deriver" builds per-peer REPRESENTATIONS + derived CONCLUSIONS from messages, with first-party plugins for our runtimes (Claude Code · OpenCode · Codex · OpenClaw) + Hermes (`hermes memory setup`).
- Adopting the SERVICE is an OWNER-GATED infra decision: AGPL → run ONLY across the HTTP/service boundary per [[agpl-isolation-via-http-boundary]], never vendored; it needs Postgres+pgvector + a deriver worker + an LLM key. We absorb the PRINCIPLE now; the service is a backlog/owner call, never a loop-autonomous install.

## Cross-links

`04-preference-and-memory` skill (the raw-signal + VoC layer this deepens) · [[cross-session-recall]] (sibling Hermes recall absorption) · [[verify-against-source-of-truth]] (a derived conclusion is a hypothesis) · [[prompt-as-training-signal]] · [[agpl-isolation-via-http-boundary]] (if the Honcho service is ever adopted) · [[upstream-absorption-register]] (provenance).
