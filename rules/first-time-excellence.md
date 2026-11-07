---
name: "first-time-excellence"
priority: 1
pack: "website-build"
triggers:
  - "build"
  - "create"
  - "make"
  - "app"
  - "site"
  - "website"
  - "feature"
  - "implement"
  - "generate"
  - "ship"
  - "first time"
  - "polished"
  - "it factor"
  - "wow factor"
  - "excellent"
  - "gorgeous"
last_reviewed: 2026-10-05
superseded_by: null
---

# First-Time Excellence — Prompt-Independent ("it" factor first pass, "wow" after)

## Prime Axiom (non-negotiable)

- **Output quality NEVER tracks input quality.** A thin, vague, lazy, or outright
  bad prompt must still yield an excellent, polished, complete product — first pass.
- A weak prompt is not an excuse; it is the test. Re-prompting on the same surface
  means the prior pass under-delivered (see [[prompt-as-training-signal]]).
- The bar every ship must clear: **"Would a discerning user rave? Would Linear /
  Stripe / Vercel ship this?"** If no, it is not done.
- Two ordered promises: the **"it" factor** on first render (first 5 seconds), then
  the **"wow" factor** the deeper they go.

## A) Thin Brief → Excellent Product (follow for ANY prompt)

1. **Extract the Job, not the words.** Infer the underlying job-to-be-done — the
   progress the user seeks, their context, what they're firing. Build for the job;
   features are hypotheses.
2. **Interpret charitably + reframe.** Assume the smartest version of the request.
   Find the *right* problem before solving the literal one.
3. **Predict the full arc (the 80%).** Enumerate EVERY state up front: empty /
   loading / partial / error / success / success-with-data / permission / offline /
   retry / edge + duplicate input. Ship them all — unbuilt states are the gap a
   re-prompt exposes (see [[predictive-completeness]]).
4. **Decide, don't interrogate.** State explicit assumptions and proceed. Reserve
   questions for high-impact, irreversible, or goal-ambiguous forks only. Endless
   clarifying questions is itself a failure mode.
5. **Scope with appetite.** Fix effort, vary scope: cut *features* ruthlessly, never
   *finish*. One or two complete, delightful things beat many half-built ones.
6. **Minimum LOVABLE, never a skeleton.** Zero placeholders / stubs / TODOs / "polish
   later." A rough version tests burnt pizza, not pizza. Design the intended emotion.
7. **De-risk before "done":** value, usability, feasibility, viability.
8. **Taste gate (§D) before shipping.**

## B) The "It" Factor — first 5 seconds (apply to EVERY build)

- **One focal point** per hero; viewport-scale headline (`clamp()` ~3–5rem); extreme
  whitespace (sections 120–200px apart). Headline names the real value, never vague
  aspiration.
- **Type as craft:** fluid `clamp()` scale (rem-anchored), a variable font with
  `font-optical-sizing: auto`, ONE bespoke-feeling display face (never stock Inter
  alone), `text-wrap: balance` on headings / `pretty` on body, `max-inline-size: ~65ch`.
- **Color & depth:** 2–3 hues max (mono base + one accent doing the work); OKLCH tokens
  with lightness pinned per role; layered shadows sharing ONE light source; a 3–5%
  SVG-noise overlay on gradients/dark surfaces to kill banding (see [[text-contrast]],
  [[image-quality]]).
- **Perceived speed = polish:** LCP ≤2.0s, CLS ≤0.05; dimension-matched skeletons
  (never spinners) for 300ms–1s waits; one purposeful entry/text-reveal via
  `@starting-style` + View Transitions — not effects-for-effects.

## C) The "Wow" Factor — sustained delight (apply to EVERY build)

- **Feedback:** every action responds ≤100ms, at the trigger (inline check, shaking
  field) — not a distant toast. Toggles apply instantly; optimistic UI + visible
  rollback; undo over confirm modals; disable buttons post-submit.
- **Motion, earned:** 150–200ms ease-out; springs for drag/gesture; tasteful stagger;
  `transform`/`opacity` only; pause offscreen loops; prefer native CSS scroll-driven +
  View Transitions (0 KB) over JS. No animation-for-its-own-sake.
- **Every state designed:** empty states orient + offer one easy next action; errors
  give cause + ID + Retry/Learn-more; distinguish loading / empty / unauth / 5xx.
- **Keyboard-first:** ⌘K palette; arrows navigate; focus discipline.
- **AI-native:** stream tokens, optimistic echo, skeleton before first token, render
  answers as widgets not walls of text; per-feature kill-switch.
- **Perf + a11y as craft:** INP ≤200ms (target <150 mobile), tabular-nums to kill
  shift; global `prefers-reduced-motion` (reduce, don't strip); box-shadow focus rings
  that respect radius; `@media (hover:hover)`; 16px+ inputs; icon-only → `aria-label`.

## D) Taste Gate (run before declaring done)

- Does the first screen deliver the "it" factor with ZERO interaction?
- Is every state built (no blank/placeholder/TODO), and does deeper interaction reward
  with "wow"?
- Would a top studio ship this unchanged? Would a discerning user screenshot & share it?
- Any "no" → it is not done. Fix it, re-run the gate. Quality is a choice made at every
  step, not a final pass.

## Composes with

- [[predictive-completeness]] (the 80% arc) · [[supreme-polish]] (final-mile craft) ·
  [[extra-mile]] + [[proactive-improvements]] (unasked value) ·
  [[auto-integrate-recs]] (ship, don't defer) · [[competitor-research]] (beat the
  best by ≥15%) · [[website-build-doctrine]] (phase sequence). This rule is the
  FLOOR beneath all of them: it fires even when the prompt is one careless line.

## Sources (2024–2026, verified)

- NN/g aesthetic-usability & 50ms first impressions; Stripe/Linear/Vercel premium-UI
  teardowns; Josh Comeau (shadows, color); OKLCH (Evil Martians); fluid type (OddBird).
- Rauno Freiberg *Web Interface Guidelines*; Emil Kowalski *Animations on the Web*;
  web.dev INP / Core Web Vitals; generative-UI streaming patterns.
- JTBD (Ulwick/Christensen); Shape Up (Basecamp); Cagan/SVPG discovery; IDEO reframing;
  Minimum Lovable Product (First Round); Linear "why quality is rare."
