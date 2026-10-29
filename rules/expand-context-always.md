---
last_reviewed: 2026-10-09
superseded_by: null
name: "expand-context-always"
priority: 2
pack: "thinking"
triggers:
  - "expand context"
  - "better version"
  - "competitor"
  - "baseline"
  - "integrate with existing"
paths:
  - "*"
---

# Expand Context Always

A standing disposition for every agent-skill, every surface, every pass. The AI should never treat
its current context as complete — it should **keep widening it** toward the best possible version of
the product. Three tenets, applied continuously:

## 1 — Constantly expand context
- Before and during work, actively pull in more relevant context: the product's own surfaces, the
  market, adjacent systems, prior art, real user journeys. A narrow read is a prediction miss waiting
  to happen (see [[predictive-completeness]]).
- Each pass should leave the AI knowing more about the domain than the last — and act on it the same turn.

## 2 — Think about the "better version" — competitors are the baseline, not the goal
- For any product/app/website/feature, **scan comparable products and set the best of them as the floor
  to beat** (see [[competitor-research]]). The baseline is what they already do; the target is clearly past it.
- Ask on every pass: *"What would a materially better version look like?"* Then ship one such improvement.
  Re-baseline against ≥1 competitor whenever you touch a surface.
- Never ship a guess when the baseline is knowable. Skipping the scan = shipping below the floor.

## 3 — Always integrate with existing systems
- Prefer wiring into something that already exists over hand-rolling a new thing: platform primitives,
  standards, APIs, the ProjectSites.dev/Cloudflare estate, live data sources, published datasets.
- Integration compounds; reinvention decays. When a capability can lean on an existing system
  (shields.io for live counts, Ideogram for infographics, codex for images, the skills submodule,
  an upstream standard), lean on it and cite it.

## How to apply
- **Website/app builds** — fold into Phase -1/0: competitor floor + context saturation before code.
- **Features** — one "better than the baseline" improvement per pass; name the competitor you beat.
- **Content** — scan what ranks/gets cited, then exceed it (GEO answer capsules, original data).
- **Loops** — a run-the-loop fire re-baselines ≥1 competitor, expands ≥1 dataset, integrates ≥1 system.
- **Skills themselves** — when a skill is edited, ask what a better version of that skill would do, and
  whether a competitor/upstream already solved part of it worth integrating.

Pairs with [[competitor-research]], [[predictive-completeness]], [[extra-mile]],
[[proactive-improvements]], and the self-improvement loop. This is the disposition; those are the mechanics.
