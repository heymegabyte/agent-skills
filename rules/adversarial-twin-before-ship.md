---
last_reviewed: 2026-11-11
superseded_by: null
name: "adversarial-twin-before-ship"
priority: 2
pack: "testing"
triggers:
  - "verify"
  - "review"
  - "before ship"
paths:
  - "*"
---

# Adversarial Twin — Survive a Red-Team Before Ship

Every non-trivial ship must SURVIVE a dedicated adversary whose only success metric is finding ONE
break. You don't prove your work correct — you fail to break it. Spawn a twin (a subagent, or a
deliberate adversarial pass) tasked to REFUTE: wrong data, broken state, a security hole, an ugly
render, an unhandled edge. Ship only when the twin comes back empty.

Cross-links: `[[verification-loop]]` · `[[verify-against-source-of-truth]]` · `[[self-argue-the-counter]]` · `[[parallel-subagent-economy]]` · `[[agent-provider-policy]]` · `[[quality-metrics]]`

## The rule

- **Adversary, not confirmer.** The twin is prompted to BREAK the work and defaults to "broken if
  uncertain" — never to confirm it. A confirming reviewer finds nothing; a refuting one finds the bug.
- **Distinct lenses, not N identical skeptics.** When a thing can fail multiple ways, give each twin a
  different lens — correctness · security · does-it-reproduce · wrong-data · a11y/render · scale.
  Diversity catches failure modes redundancy can't.
- **Majority-refute kills the claim.** For a finding/fix, run ≥3 independent refuters; survive only if
  a majority fail to break it. Cheap via parallel subagents (`[[parallel-subagent-economy]]`).
- **Different from self-argue.** `[[self-argue-the-counter]]` challenges a DECISION before you make it;
  the twin attacks the IMPLEMENTATION after you build it. Both fire — design-time and ship-time.

## When it fires

- Any security boundary, data surface, money flow, auth path, or destructive action.
- Any "done" claim on a feature a discerning user would notice break.
- Scales with the ask: a quick check → one adversarial pass; "thoroughly audit" → a 3–5 twin panel + synthesis.

## Anti-patterns

- A review pass prompted to confirm ("does this look right?") instead of to refute ("break this").
- One skeptic when the surface fails multiple ways — use diverse lenses.
- Shipping on a green render alone without a twin trying the wrong-data / lying-empty angle.
- Treating the twin's "couldn't break it" as proof of perfection — it's evidence, not a guarantee.
