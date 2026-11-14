# Tasks: Total Multi-Axis Convergence, Parallel Triad Sync & Frontier OpenSpec → Paperclip Handoff

## 1. Doctrine & Always-Loaded Config Extraction
- [x] 1.1 Create `rules/total-convergence-and-openspec-handoff.md` with extracted Micro, Product, and Organization loops, 16-state Visual State Matrix, 10-pass critique lenses, Frontier OpenSpec Architect mandate, and Langfuse fail-open rules.
- [x] 1.2 Update `rules/prompt-as-training-signal.md`, `rules/always.md`, `rules/openspec-operating-contract.md`, `rules/agent-provider-policy.md`, `rules/gorgeous-by-default.md`, `rules/production-observability-default-on.md`, `rules/auto-integrate-recs.md`, and `rules/improvement-audit.md`.
- [x] 1.3 Embed the extracted convergence loops and parallel triad rules into `~/.claude/CLAUDE.md`, `CLAUDE.md`, `GEMINI.md`, and `~/.gemini/GEMINI.md`.

## 2. Fail-Open Langfuse & OpenSpec-Paperclip Tooling
- [x] 2.1 Implement `bin/lib/langfuse-safe.ts` with `2500ms` bounded timeout, 3-strike circuit breaker, and local JSONL spool fallback.
- [x] 2.2 Implement `bin/openspec-paperclip-sync.ts` and `bin/triad-end-of-turn-sync.ts` with Frontier Architect validation and Paperclip issue creation/update.
- [x] 2.3 Add and pass unit tests in `tests/triad-convergence-and-langfuse.test.ts` (`node --test`).
- [x] 2.4 Sync OpenSpec change to the `agent-skills` project (`78ac0baa-b2fd-4f0d-9e25-845192da5d50`) in Paperclip on `ubuntu.megabyte.space`.
