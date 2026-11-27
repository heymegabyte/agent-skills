# Proposal: Agent OpenSpec Change-Ownership Policy (plan-decompose-early, one-owner-per-change)

> **Architect:** claude (hydrated frontier context — non-OpenCode spec)
> **Architect Role:** assigned
> **Owner:** claude (this session) — the single owner performs EVERY subtask of THIS change.

## Why

Across the four coding harnesses (Claude Code, Gemini CLI, Codex, OpenCode) there was no explicit,
always-loaded invariant to (a) plan & decompose authorized work into coherent OpenSpec changes before
substantial implementation, (b) keep each change owned end-to-end by one agent instance, and (c) capture
high-value recommendations into OpenSpec the moment they surface. The existing swarm doctrine
(`parallel-multi-swarm-orchestration`, `agent-provider-policy`) encouraged fragmenting a change's subtasks
across workers, which blurs ownership and lets mid-task recommendations die in chat. Brian directive
(2026-11-26): make plan-decompose-early + one-owner-per-change a core engineering philosophy on every
always-loaded surface, with the detailed procedure in a reusable rule.

## What Changes

1. New canonical rule `rules/openspec-change-ownership.md` — the detailed procedure (invariant, decompose
   questions, operational one-owner, continuous recommendation capture, swarm-doctrine reconciliation,
   verification, anti-patterns).
2. Concise invariant inserted into the three always-loaded canonical files:
   - `CLAUDE.md` → synced to `~/.claude/CLAUDE.md` (Claude Code).
   - `AGENTS.md` → synced to `~/.codex/AGENTS.md` AND `~/.config/opencode/AGENTS.md` (Codex + OpenCode).
   - `GEMINI.md` → synced to `~/.gemini/GEMINI.md` (Gemini CLI).
3. Distribution via the existing `bin/sync-fleet-harnesses.ts` copy mapping (repo-root file → `$HOME`
   target); the same four copies are applied this turn so installed copies match canonical sources.
4. Four follow-up proposals captured in OpenSpec with real content (checkpoint hooks, four-agent OpenSpec
   global integration, atomic ownership dispatcher, verification suite) — proposed, not yet owned.

## Impact

- Affected: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `rules/openspec-change-ownership.md`, and the four
  installed copies under `$HOME`.
- Behavior: every agent loads the invariant each session; multi-outcome requests decompose into changes
  before implementation; parallelism moves to the change level; recommendations are captured into OpenSpec.
- Reconciliation: refines (does not revoke) the swarm doctrine — disjoint worker ownership = disjoint
  CHANGES. Additive to always-loaded instructions; non-breaking.
- Verification: invariant present in all four installed files; `openspec validate` passes; sync re-run is
  idempotent (overwrite-copy).
