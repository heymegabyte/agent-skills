# Split Work Into the Ledger (Favor Many Small Optimization Cycles)

Default to DECOMPOSING a large ask into the loop ledger/backlog and advancing ONE small, verified
slice per cycle — never try to complete a big prompt, feature, or refactor all at once. Many focused
optimization cycles on specific elements/functions/components beat one mega-pass: each cycle ships
green, is independently verifiable, and compounds. (Brian directive 2026-10-02.)

Cross-links: `[[loop-driven-development]]` · `[[predictive-completeness]]` · `[[monitor-orchestration]]` · `[[parallel-subagent-economy]]` · `[[inverted-abstraction-pyramid]]` · `[[agent-resilience-discipline]]` · `[[loop-arc-economics]]`

## The rule

- **A big ask is ledger intake, not a single turn's deliverable.** When a prompt/feature/refactor is large, the FIRST deliverable is its DECOMPOSITION into concrete backlog items (each sized for one fire), written to the ledger — then advance only the slices that fit this cycle's budget.
- **One coherent, verified slice per cycle.** Ship it green (test → implement → deploy → prod-verify), tick its backlog line, append the ledger, leave the rest queued. Re-fire to take the next slice.
- **Prefer depth per element over breadth per pass.** Many optimization cycles on a SPECIFIC element/function/component (one hero, one handler, one query, one editor tab) out-compound a shallow sweep across everything at once.
- **Never ingest a giant source in the lead.** Delegate decomposition of large prompts/specs/files to a fresh agent that returns ≤150 lines of ledger items; the lead holds conclusions only (per `[[monitor-orchestration]]` § context budget — oversized-read guard blocks 64K+ reads).
- **The ledger IS the memory.** Work parked in the backlog is not lost — it's the durable queue the loop drains over fires. "Done with an intake" = its spirit is decomposed into the ledger, not that the whole thing was executed this turn.

## When to split (fire this)

- A prompt larger than a few KB, a feature touching >1 surface, a refactor spanning >~3 files, or any "do everything / all phases / master prompt" ask.
- Any `~/Downloads/projectsites*.md` / `ProjectSites*.md` master-prompt intake (per the project `run-the-loop` § 0.5 Prompt Intake Queue) — decompose into the backlog, drain ONE per fire, delete the source after its spirit is absorbed.

## Anti-patterns

- Trying to execute a 100K master prompt in one turn → context thrash, shallow output, half-finished surfaces, a re-prompt.
- Reading the giant source wholesale in the lead (oversized-read guard / autocompact thrash).
- A sweep that touches 20 components shallowly instead of making ONE component excellent, then the next.
- Leaving decomposed work only in chat instead of writing it to the durable ledger.
