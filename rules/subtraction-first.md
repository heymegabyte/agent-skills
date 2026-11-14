---
last_reviewed: 2026-11-11
superseded_by: null
name: "subtraction-first"
priority: 2
pack: "core"
triggers:
  - "refactor"
  - "simplify"
  - "add feature"
paths:
  - "*"
---

# Subtraction-First — Try Deleting Before Adding

Default to SUBTRACTION. Before writing new code to reach a goal, spend the first move trying to reach
it by DELETING or simplifying what already exists. The best feature is the one you didn't have to
build; the best fix often removes the thing that caused the bug. Addition is the lazy default — invert it.

Cross-links: `[[state-is-the-enemy]]` · `[[inverted-abstraction-pyramid]]` · `[[dead-code-remover]]` · `[[interconnectedness]]` · `[[god-tier-engineering]]` · `[[blast-radius-minimization]]`

## The rule

- **Attempt the task by removal first.** Can an existing primitive, config, flag, or deletion achieve
  the goal? Try that before authoring anything new.
- **Net-positive LOC carries a justification.** A change that adds more lines than it removes gets a
  one-line "why subtraction was impossible" in the commit/report. Not a ban on adding — a tax on it.
- **Prefer the smaller surface.** Fewer files, fewer branches, fewer options, fewer dependencies,
  fewer states. Every new knob is a permanent maintenance + test + doc liability.
- **A bug fix that only removes code is the best bug fix.** When a defect traces to complexity,
  delete the complexity rather than adding a guard on top of it.
- **Collapse, don't accrete.** Two near-duplicate paths → one. A special-case branch → fold into the
  general case. A wrapper that adds nothing → inline it.

## When it fires

- Any "add X" / "build Y" / refactor / fix where an existing mechanism might already cover it.
- Reviewing a diff: if it's net-additive, ask once more whether a deletion reaches the same outcome.
- A feature request that duplicates ~80% of an existing surface — extend the surface, don't fork it.

## Anti-patterns

- Reaching for a new file/abstraction/dependency before checking whether deletion or an existing
  primitive suffices.
- Adding a guard/flag/branch to paper over complexity instead of removing the complexity.
- A net-additive diff with no justification for why nothing could be subtracted.
- Shipping a parallel second implementation instead of deleting the first (see `[[one-canonical-seam]]`).
