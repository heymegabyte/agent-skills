---
name: "improvement-audit"
priority: 2
pack: "core"
triggers:
  - "improvement audit"
  - "audit the dimension"
  - "30 ideas"
  - "what else"
  - "exhaust the ideas"
  - "horizons"
last_reviewed: 2026-10-08
superseded_by: null
---

# Improvement Audit

The recursive, per-dimension discipline for inventing + ranking + shipping improvements to a surface. For EVERY significant dimension of a product or skill, generate ~30 candidate ideas, score each on 10 factors, dedupe + combine, ship the clearly-justified ones (≥top-30% is a FLOOR, not a ceiling), sort survivors into 3 horizons, and promote winners into OpenSpec + the backlog. Breadth is earned per-dimension, never faked.

This is the engine BENEATH the §11/§27 delivery-requirement sweeps and the loop's "what else" phase — [[supreme-polish]] is the bounded 100-ideas variant, this is the repeatable per-dimension unit. Fires on the triggers above, inside [[supreme-polish]] / [[website-build-doctrine]] Phase 6, or whenever a surface is "done enough" to interrogate.

## When it fires

- A dimension of a shipped surface is interrogated ("what else could `/analytics` do?", "exhaust the Pulse ideas").
- Inside [[supreme-polish]] (each of its 20 categories IS one improvement-audit dimension) and [[website-build-doctrine]] Phase 6 "what else" loop.
- The loop's per-fire self-improvement step (`.claude/run-the-loop`) — one dimension per fire, not all at once.
- A new skill/rule is authored: audit ITS dimensions (coverage, triggers, cross-links, enforcement) the same way.

## Dimensions (what "a dimension" is)

- A dimension = one axis of the surface a user or operator judges it on. Enumerate them FIRST, then audit each.
- Product dimensions, e.g.: visual/motion · information architecture · copy/microcopy · conversion · a11y · perf/CWV · SEO/AI-search · observability · AI-native capability · trust/provenance · empty/loading/error states · keyboard/command surface · data freshness · cost/quotas · permissions · resilience/rollback.
- Skill/rule dimensions, e.g.: coverage of the real cases · trigger precision · cross-links · enforcement (hook > rule) · examples · anti-patterns called out · house-style conformance.
- A dimension is "significant" if a discerning user/operator would notice its quality. Skip inert axes — don't manufacture dimensions to pad the count.

## The 30-candidate protocol (per dimension)

1. State the dimension in one line + its current level (be specific: "`/analytics` has 1 chart, no comparison, no export").
2. Generate ~30 candidate ideas for THAT dimension. Quantity first — defer judgement; include obvious, premium-parity, and wild differentiation ideas. Thin dimensions may legitimately yield <30; never pad to hit 30.
3. One-line each: `idea — why it helps`. No implementation detail yet.
4. Pull candidates from three knowledge layers (L1 proven · L2 trending · L3 first-principles); prefer L3 for differentiation ideas.
5. For skill-heavy or research-heavy dimensions, fan the generation out — DeepSeek-via-OpenCode (`~/.agentskills/bin/opencode-deepseek.sh`) swarms candidate lists, `codex` critiques, `claude` synthesizes ([[agent-provider-policy]]) — never ANTHROPIC_API_KEY/OPENAI_API_KEY.

## The 10-factor evaluation rubric

Score each candidate 0-10 on all ten; record the vector, not just the mean.

1. **User value** — how much a real user/operator feels it.
2. **Competitive advantage** — does it move us past the [[competitor-research]] floor (beat best-in-class, not match).
3. **Cost** — build + run cost (10 = near-free, 0 = expensive/ongoing).
4. **Feasibility** — can we actually ship it on this stack now (10 = trivial, 0 = needs tech we don't have).
5. **Reusability** — does it generalize to other surfaces / flow back to the template or a rule.
6. **Dependencies** — 10 = self-contained, 0 = blocked on unbuilt prereqs or external approval.
7. **Architectural fit** — matches the surface's existing model + the estate doctrine (0 = fights it / new precedent).
8. **Security** — 10 = no new surface, 0 = introduces auth/data/injection risk ([[ai-agent-security]]).
9. **Maintenance** — 10 = set-and-forget, 0 = perpetual upkeep.
10. **Measurable benefit** — can we instrument the win (telemetry/CWV/eval delta); 0 = taste-only, unmeasurable.

- **Dedupe + combine BEFORE ranking.** Fold near-duplicates into one; merge small ideas that are only valuable together into one stronger candidate. The merged idea is re-scored.
- Rank by composite with a veto: any candidate scoring 0 on **Security** or **Architectural fit** is rejected outright regardless of composite.

## Ship rule — top-30% is a FLOOR, not a ceiling

- Ship **at least** the top 30% of survivors for each dimension — but 30% is the MINIMUM, never the budget.
- **Ship every clearly-justified idea**, even above the 30th percentile: if the vector is strong (high user-value + feasible + good fit + low cost) and it clears the [[auto-integrate-recs]] 4-question filter (<2h, no design conversation, reversible, no external blocker), SHIP IT this turn.
- Only three things stop a justified idea from shipping now: it needs a design conversation, it's an irreversible/precedent-setting call, or it's blocked on an unbuilt prereq/external dependency. Those become Recs with next-prompt language per [[auto-integrate-recs]] — nothing else does.
- Capping shipped ideas at "exactly 30%" to look disciplined is itself a failure mode. Discipline is in the SCORING, not in withholding wins.
- Mark every candidate: ✅ shipped · ⏸ Rec (with reason + next-prompt language) · 🚫 rejected (with reason).

## Three horizons (sort every survivor)

Every survivor lands in exactly one horizon; horizons set sequencing, not whether to ship.

1. **Essential** — table-stakes for the dimension; a discerning user assumes it exists. Ship first, this turn. Its absence is a bug.
2. **Premium-parity** — what best-in-class competitors ship (the [[competitor-research]] floor). Ship to reach parity; these are the ideas that stop us looking second-rate.
3. **Differentiation** — AI-native / first-principles ideas no competitor has (Phase 4 spiral). The moat. Ship the justified ones; the expensive/design-heavy ones become backlog frontier.

- A dimension is not "done" while any **Essential** idea is unshipped — that overrides the 30% floor upward.
- Record each survivor's horizon next to its score so the backlog frontier is self-sorting.

## Promote winners → OpenSpec + backlog (SAME TURN)

- Every shipped non-trivial idea archives an **OpenSpec change** per [[website-build-doctrine]] § OpenSpec: `/opsx:propose "<idea>"` → review → `/opsx:apply` → `/opsx:sync` → `/opsx:archive`; link the archived change from the loop LEDGER row (traceability). Trivial tweaks skip it.
- Every ⏸ Rec (design-blocked / prereq-blocked / differentiation-deferred) is written to the project `BACKLOG.md` as a frontier item with its score vector + horizon + the one-line next-prompt language — never left only in chat.
- Essential + premium-parity survivors that can't ship this turn jump the backlog queue ahead of differentiation items.
- Fold any generalizable pattern the audit surfaced back into the owning rule the SAME TURN ([[prompt-as-training-signal]]).

## Avoid artificial breadth + speculative features

- **No manufactured dimensions.** If a surface honestly has six judged axes, audit six — don't invent a seventh to feel thorough.
- **No manufactured candidates.** A thin dimension yielding 12 real ideas beats 30 with 18 filler; padding wastes the ranking.
- **No speculative features.** An idea that scores high on "cool" but low on **User value** + **Measurable benefit** is a 🚫, not a differentiation win. Differentiation must still serve a real user/operator job.
- **No breadth over depth.** One dimension taken to genuine excellence beats ten dimensions each nudged 5% — the loop audits ONE dimension per fire and finishes it.
- Rejects are logged with reasons so the next pass doesn't re-propose them.

## Hard gates (fail the audit if missed)

- Dimensions enumerated + each significant one audited (no inert-axis padding).
- ~30 candidates generated per audited dimension (or an honest-max with the shortfall noted), each one-lined.
- Every candidate scored on all 10 factors; dedupe + combine done before ranking.
- ≥ top-30% shipped AND every clearly-justified idea shipped (only design/irreversible/blocked items deferred).
- Every survivor sorted into Essential / premium-parity / differentiation; no Essential left unshipped.
- Shipped non-trivial ideas promoted to OpenSpec; deferred ideas written to `BACKLOG.md`; generalizable patterns folded into the owning rule — all SAME TURN.

## Composes with

- [[supreme-polish]] (the bounded 100-ideas = 20 improvement-audit dimensions × 5) · [[auto-integrate-recs]] (the ship/defer filter this rule's ship rule obeys) · [[competitor-research]] (sets the premium-parity + differentiation floors the rubric scores against) · [[extra-mile]] + [[proactive-improvements]] (the unasked-value disposition) · [[first-time-excellence]] (the quality FLOOR) · [[predictive-completeness]] (enumerate the 80% arc of a dimension before auditing it) · [[website-build-doctrine]] § OpenSpec (the promotion path).

## Sources (first-principles + estate practice)

- Estate loop practice: one-dimension-per-fire "what else" + `.claude/modifier-matrix.json` Beautify-10x notes; [[supreme-polish]] 100-ideas pass; the three-horizon product-propagation audit in `.claude/run-the-loop/NORTH-STAR.md`.
- Three-layer knowledge (L1 proven / L2 trending / L3 first-principles) + self-argue-the-counter from `AGENTSKILLS.md` § Thinking; quantity-before-judgement divergent generation.
