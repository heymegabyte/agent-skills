---
last_reviewed: 2026-06-29
superseded_by: null
priority: 2
pack: core
triggers:
  - "loop arc"
  - "/loop"
  - "cron arc"
  - "how much did the arc cost"
  - "arc economics"
  - "token cost"
  - "when to start arc"
  - "when to stop arc"
paths:
  - ".claude/**"
  - "rules/**"
---

# Loop Arc Economics

Measured reference data from the 10-iteration doctrine saturation arc (2026-06-18).
Use this to calibrate future arcs, set realistic budgets, and know when to stop.

## Reference arc: 30-30-true-saturated

- Iterations: 10
- Total tasks completed: 36
- Total files produced: ~190 (rules, skills, utils, type definitions)
- Doctrine coverage: 30/30 principles PRESENT at close
- Wall-clock: ~70 min per 4-agent iteration batch × 10 = ~12 hours total (spread across 2 sessions)
- Final state: `audit-doctrine --milestone=30-30-true-saturated`

## Token economics

| Unit                              | Approximate value             | Notes                                          |
|-----------------------------------|-------------------------------|------------------------------------------------|
| Tokens per agent per iteration    | ~70K Sonnet tokens            | Complex write agents; research agents lower    |
| Agents per iteration              | 4 (parallel)                  | Architect + 3 specialist writers               |
| Tokens per iteration              | ~280K                         | 4 × 70K                                        |
| Total arc tokens                  | ~2.8M Sonnet tokens           | 280K × 10 iterations                           |
| Brian's typical daily usage      | ~500K                         | Baseline from prior session patterns           |
| Arc vs. daily ratio               | ~5.6× daily baseline          | Concentrated spend; arc is a deliberate spike  |

Opus was disabled for this arc (quota). Sonnet 4.6 at high effort was the primary model.
If Opus is available, expect ~1.5-2× token cost per agent but 20-30% fewer iterations
to reach the same quality floor.

## Saturation curve (marginal value by iteration)

| Iteration range | Files per iteration | Typical yield                                      |
|-----------------|---------------------|----------------------------------------------------|
| 1–3             | 5–8                 | High-value foundational rules, new skill scaffolds |
| 4–6             | 3–5                 | Gap-filling, cross-links, type utils               |
| 7–8             | 2–4                 | Edge-case handling, test coverage, polish          |
| 9–10            | 1–3                 | Incremental refinement, audit-doc finalization     |

By iteration 9 each file refined an existing concept rather than adding a capability —
genuine saturation, not waste.

## When to START a new arc

All three conditions must hold:

1. **Doctrine gap detected** — `/audit-doctrine --gate` fires LOST/DEGRADED for ≥2 principles
   OR a new capability domain (e.g., new payment provider, new test framework) has zero
   covering rules.
2. **Contiguous work block available** — ≥3 hours of uninterrupted session available.
   Arcs interrupted mid-iteration produce partial files that need cleanup next session.
3. **Not already in a deploy cycle** — arcs are planning/infrastructure work. Never run
   one concurrently with an active prod deploy or incident response.

Optional trigger: "always find 50 more things" (`brian-preferences`) — if Brian
self-assessment is that a surface feels thin, that intuition is sufficient to start.

## When to STOP an arc

Stop immediately on ANY of:

- **2 consecutive iterations produce <2 new files** — saturation reached; further
  iterations produce diminishing marginal value below cost threshold.
- **Retrospective document shipped** — the arc's synthesis doc (e.g., `post-arc-retrospective`)
  captures and commits all insights; there is nothing left to produce.
- **Context window grows long** — keep the lead lean (delegate heavy passes to fresh subagents,
  conclusions-only), checkpoint to `progress.md`, and CONTINUE in-session; autocompact carries the
  summary forward. Never hand off to the user for a fresh session (`[[agent-self-manages-context]]`).
- **Brian explicitly stops it** — `/loop cancel` or `/ralph-loop cancel`.

Do NOT stop early because "it feels done." Run the `/audit-doctrine --gate` check to
confirm. Feeling done and being done are different.

## Cost-benefit heuristic

A 10-iteration arc at ~2.8M Sonnet tokens (~$8-12 at current pricing) produces ~190
files of infrastructure that eliminates ad-hoc prompt churn for weeks. Break-even is
roughly: if the arc saves ≥10 future prompts that each would have consumed 280K tokens,
the arc paid for itself in tokens alone — before counting the time saved.

## Standing cron on a CONVERGED surface — verify the tail, then HOLD (don't manufacture)
<!-- grow-ok: adds the recurring-cron-on-a-converged-surface discipline (the inverse of arc-start) + the projectsites 846-880 reference arc; a genuine gap this rule lacked, not churn -->

A recurring cron that fires a *converged* surface is the inverse of starting an arc: the danger is
**manufacturing churn to look productive**, which degrades a mature artifact (`[[monitor-orchestration]]`
healthy-iteration #4). Two disciplines, in order:

1. **A convergence DECLARATION is not final — verify the small-gate TAIL before holding.** After an
   audit declares a surface converged, real small-gate slices often REMAIN that the audit didn't
   enumerate (a drift, a missing regression-lock, a built-but-unwired orphan, an icon/label bug). Keep
   finding + shipping those genuine slices — ONE verified slice per fire — until the tail is honestly dry.
   "Converged" ≠ "nothing left"; it means "no FEATURE-sized slice left," not "no slice."
2. **Once the tail IS drained, HOLD honestly — the cron is an OPERATOR problem, not a prompt to invent work.**
   A standing cron on a drained surface keeps firing; the correct output is a convergence-verify fire
   (fresh evidence from a NEW angle each time — liveness, then standards, then live-data reconcile) + a
   SHARP surfacing of the specific operator unblock (retire the subsumed cron · grant Figma approval · run
   the gated fan-out · supply the vendor secret). Never fabricate a cosmetic change; a no-product-change
   fire is CORRECT here.

Distinguish the two with evidence, not feel: re-scan the arc (standards, orphans, drift, test gaps) from an
angle you have not checked; if that scan is clean, you are in state 2 (hold), not state 1 (keep shipping).

**Reference arc (projectsites.dev, fires 846-880):** fire-846 declared the inline frontier converged — yet
fires **861-865** still shipped FIVE genuine small-gate slices the audit missed (an MCP 10th tool · a
de-scoped-KV demo removal · a `connection` type + a real `iconForKind('durable_object')`→cloud-glyph bug · an
R2-invariant partway/concurrent regression-lock · a client↔worker secret-parity guard), and **879-880** added
two more (a routing-decision lock + a diff-stat "not-reversed" lock). fires **866-878** then held or
live-verified (§2/§3/§4 against the real site) with NO product change, each SHARPLY surfacing the one operator
unblock (retire the subsumed crons). That is the full cycle: ship the tail, then hold + surface — never
manufacture. Cross-links `[[monitor-orchestration]]` §healthy-iteration, `[[verify-against-source-of-truth]]`,
`[[split-work-into-ledger]]`.

## Post-arc checklist

Run these AFTER every arc closes:

1. `/audit-doctrine --save --milestone=<YYYY-MM-DD-<slug>>` — capture fresh baseline
2. Update `principle-stability-monitoring.md` MILESTONE env var in CI workflow
3. Commit baseline JSON alongside any new rules in the SAME commit
4. Run `post-arc-retrospective` skill to synthesize lessons
5. Update this file if the reference data changes materially

## See also

- `[[loop-driven-development]]` — the `/loop` arc mechanics and iteration structure
- `[[brian-preferences]]` — "always find 50 more things" creative doctrine
- `[[audit-doctrine]]` — the audit skill that gates arc completion
- `[[principle-stability-monitoring]]` — CI gate that keeps gains from decaying
- `[[post-arc-retrospective]]` — synthesis skill run at arc close
- `[[monitor-orchestration]]` — parallel agent orchestration inside each iteration
