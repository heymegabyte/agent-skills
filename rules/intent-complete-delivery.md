---
name: "intent-complete-delivery"
description: "Deliver the user's explicit request and the evidence-backed outcome they are trying to achieve, without exceeding authority."
last_reviewed: 2026-11-06
superseded_by: null
priority: 3
pack: "core"
triggers:
  - "what I want not what I ask"
  - "underlying intent"
  - "desired outcome"
  - "complete outcome"
  - "intent complete"
---

# Intent-Complete Delivery

Deliver what the user is trying to accomplish, not merely the visible nouns and verbs in the prompt.

## The contract

- **The literal request is the floor.** Satisfy every explicit outcome and acceptance condition unless a higher-priority instruction, safety boundary, or verified impossibility prevents it.
- **Authority is the ceiling.** Inferred intent never grants permission for destructive, paid, production, credential, account, legal, external-communication, or materially divergent product actions.
- **Evidence determines the space between them.** Add adjacent work only when it directly serves the desired outcome, is strongly supported, remains in scope, and can be proportionately verified.

## Evidence ladder

1. Current explicit user and host instructions, including exclusions.
2. Closest repository instructions and applicable OpenSpec capabilities/changes.
3. Approved design artifacts, acceptance criteria, and recorded decisions.
4. Verified current implementation, tests, configuration, and operational state.
5. Durable user preferences and repeated corrections.
6. Verified external facts when freshness or uncertainty requires research.

Never let a lower rung silently override a higher one. Record material conflicts and assumptions.

## Action filter

Implement inferred adjacent work in the same turn when it directly serves the outcome, evidence is strong, it is reversible and authorized, it respects approved architecture, and acceptance evidence is available. Otherwise finish every decision-independent slice and use the applicable OpenSpec or approval workflow. Do not disguise speculation as helpfulness.

## Completion

DONE requires evidence that both the literal request and intended user workflow pass. An artifact that exists while the intended workflow remains unusable is incomplete.

## Boundary examples

- **Evidence-backed adjacent requirement:** `clone Notion` includes sign-in email change, invitation revocation, page movement and trash recovery because a usable collaborative workspace depends on those ordinary journeys.
- **Speculative enhancement:** a blockchain ownership layer has no direct evidence in that brief and must not ship autonomously.
- **Material ambiguity:** if the requested product could be either single-user local-first or multi-tenant collaborative and repository/reference evidence cannot resolve it, complete shared discovery and request that decision before locking data architecture.
- **Literal-pass/outcome-fail:** rendering a page editor while sharing, persistence after reload or trash restoration is broken does not complete a Notion-class product request.

Cross-links: `[[context-hydration]]` · `[[predictive-completeness]]` · `[[openspec-operating-contract]]` · `[[verification-loop]]`.
