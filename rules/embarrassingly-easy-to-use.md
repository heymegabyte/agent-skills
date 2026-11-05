# Embarrassingly Easy to Use

**Continually, always, make the application embarrassingly easy to use.** This is a standing SUPREME mandate (Brian, 2026-09-15), not a one-off — it applies to EVERY surface, EVERY fire, forever. A busy, non-technical small-business owner must succeed on the FIRST try, with no manual, no training, and no thinking. If they'd have to ask a question, it isn't done.

The bar is not "usable." The bar is **embarrassingly easy** — so simple it feels like it's doing the work for you, so obvious that a competitor's onboarding looks absurd by comparison.

Cross-links: `[[gorgeous-by-default]]` · `[[extra-mile]]` · `[[ttfr-north-star]]` · `[[ai-permanence]]` · `[[brian-preferences]]` · `[[proactive-improvements]]`

## The standing gate (every UX-touching change)

- Every change leaves the surface **EASIER than before, never harder**. Adding a feature that adds a step is a regression — hide it, default it, or fold it into an existing action.
- Pair every feature with the question: **"Would a busy non-technical owner finish this WITHOUT asking a question?"** No → simplify until yes.
- This gate sits beside `gorgeous-by-default` (every iteration more beautiful) — every iteration must also be more effortless. Beauty + effortlessness, both, always.

## The principles (apply to admin + generated sites + create flow + every surface)

- **AI does the work, the user confirms.** Prefill, auto-detect, suggest, generate — never make the user configure what the AI can infer. "Embarrassingly easy" means the AI REMOVES steps, not documents them. (Per `ai-permanence`: when AI can make a surface easier, ship it.)
- **Zero-config defaults.** Every setting has a smart default that's right for 90% of users. Advanced options are progressively disclosed — hidden until asked for, never in the first-run path.
- **One obvious primary action per screen.** Exactly one visually-dominant next step. No decision paralysis.
- **≤3 steps to any outcome.** Count the clicks to the user's goal; if >3, collapse them. Search→build→live should feel like one motion.
- **Inline guidance, never a manual.** A one-line hint at the point of action beats a docs page. If a surface needs a tooltip to be understood, the design is the bug — fix the design first, add the hint second.
- **Instant feedback + undo.** Every action confirms immediately (optimistic UI) and is reversible. Undo everywhere; confirmation dialogs only for the truly destructive.
- **Keyboard + one-click everything.** Cmd+K to anything; every clickable action has a shortcut; every multi-step task has a one-click express path.
- **Empty states are launchpads.** Never "no data" — always the one button that creates the first result (per `extra-mile`).
- **An AI capability behind a GENERIC entry point is INVISIBLE → effectively UNSHIPPED.** A powerful feature (NL/semantic search, a vibe/mood query, chat, a generator) is worthless if the user never discovers it. A box labeled "Search" with a bare empty state hides that it also accepts a MOOD, a QUESTION, a LYRIC — so users only ever type the obvious literal thing and the flagship AI never runs. Fix at the ENTRY POINT: (1) the label/placeholder ADVERTISES the breadth ("Search a title, lyric, or **vibe**…", not "Search"); (2) the EMPTY STATE DEMONSTRATES it with a few **one-click example queries** that, when tapped, fill the input + RUN (so the user SEES the AI work on real, grounded results), the normal browse still below. Cheap (static examples, or AI-generated), and it converts a dormant capability into a used one. Ref: bz.rocks 2026-10-25 — cmdk search had NL vibe search (`/api/vibe`) + lyric-moment jump but said "Search tracks…" with no hints; added "✦ Try a vibe, mood, or lyric" chips (`late night prayer`, `mercy at the checkpoint`, …) that run the query on click → the superpowers are now discoverable. Cross-links `[[extra-mile]]`, ai-first-search (contextual suggestions), `[[ai-abundance-maximalism]]` (take AI 100 miles further includes making it VISIBLE).
- **Never present a doomed or dead control.** A button that will fail (precondition unmet, seat limit, missing config) is disabled WITH the reason + the fix, or hidden. (Per `action-button-must-gate-on-server-precondition`.)
- **Speak the user's words.** Business-owner language, never our internal jargon (no "org", "entitlement", "workflow", "manifest" in user-facing copy).

## Activation — engineer the first session BACKWARD from the aha moment

Onboarding is not a feature tour; it is the shortest path to the user's first real RESULT. Most conversion problems are value-realization problems, not pricing problems (+25% activation ≈ +34% MRR; aha in <5 min ≈ 40% higher 30-day retention). (Added 2026-10-25, estate-upgrade audit — `[[estate-upgrade-audit]]`.)

- **Define the activation event CONCRETELY, per persona, then build backward to it.** "First invoice sent / first report generated / first automation that runs" — not "completed the tour." Engineer the whole first session to reach it within 24h (ideally minutes). Instrument it: **activation rate** (% of signups who hit the aha in session 1–2) is THE onboarding metric; **TTV** = median signup→value-event; review drop-off by persona weekly.
- **Goal-based branching, not one path for all.** A 2–3 question signup survey (role / use-case) → branch the flow by intent (role/use-case flows lift activation 30–50%); separate admin vs end-user paths ("power users want access, new users want guidance").
- **Kill the blank start** (extends "empty states are launchpads"): pre-fill a template / sample workspace (Figma/Canva get you creating in ~10s), or land in the real product with ONE highlighted action ("Import your first contact") — never a blank dashboard that reads as broken.
- **A 3–5 item value-checklist tied to the activation event:** one action per item, ordered easiest-first for momentum, the FINAL item IS the activation event, and every step ends in REAL value (not busywork). Checklist-completers convert 2–3×.
- **Let them in first, verify later** — magic-link / social sign-in, skip non-essential fields, seed smart defaults from the signup survey (a ten-field form → two). Replace static product tours with behavior-triggered contextual tooltips (2026 shift).
- **AI pilot** (per `ai-permanence` / `[[ai-abundance-maximalism]]`): dynamic empty states + behavioral checklist reordering (e.g. suggest a starter workspace from company + industry) — the AI removes the first-run blank-page anxiety.

## For the generated sites (the product output)

- The delivered site must be embarrassingly easy for the OWNER to run AND for their VISITOR to use: obvious CTAs, click-to-call, one-tap directions, a contact form that just works, no config.
- Every owner-facing edit (change copy, swap a photo, publish) is one obvious action in the editor — no build knowledge required.

## Note placement (durable, cross-surface)

This mandate is mirrored so it can't be missed: this rule (universal), the project `apps/project-sites/CLAUDE.md` § Embarrassingly Easy, and the repo `README`. When any of the three drifts, re-sync the other two the same turn (`[[drift-detection]]`).

## Anti-patterns (embarrassingly HARD — fix on sight)

- A first-run flow that shows configuration before value.
- A form field the AI could have prefilled or eliminated.
- A setting with no sensible default.
- Copy that assumes the user knows our data model.
- More than one competing primary CTA on a screen.
- A "success" that dead-ends instead of offering the obvious next action.
- A feature TOUR instead of a path to the first real result; a blank dashboard on first login (no template / sample data / single highlighted action).
- Any surface where the honest answer to "would an owner need help here?" is yes.
