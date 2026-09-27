---
name: "predictive-completeness"
priority: 2
pack: "website-build"
triggers:
  - "build"
  - "create"
  - "app"
  - "site"
  - "website"
  - "feature"
  - "implement"
  - "generate"
  - "first time"
  - "gorgeous"
  - "complete"
  - "scope"
last_reviewed: 2026-09-27
superseded_by: null
---

# Predictive Completeness (Deliver the 80% from the 20% — first pass, not iterative)

The failure mode this kills: delivering the **literal, visible subset** of a prompt, then iterating
to the real scope through the user's re-prompts. **The prompt is a SEED, not a spec.** Infer the
full arc of what the user will want by the time they're satisfied, and build THAT — once. Every
re-prompt on the same surface is a **prediction miss** the first pass should have anticipated.
The same under-prediction that dribbles work across turns is why generated apps ship "functional
but plain" and need iteration — the cure is the same on both: enumerate the arc, build it pass-1.

## The mechanism — run BEFORE building anything non-trivial

- **Predict the 80% from the 20%.** From the seed, enumerate the COMPLETE eventual scope — every
  route/page, feature, state, surface, and production gate the user will inevitably want. For a
  build, write it to `_prediction.md`. Build to the prediction, not to the sentence.
- **Enumerate the space; never react to the visible subset.** "Make versions current" = the ENTIRE
  stack matrix web-verified at once, not the 6 tools you happened to grep. List the full set first,
  then act on all of it in one pass.
- **Run the "what else" loop UP FRONT, predictively.** It is the PRIMARY mechanism, not a post-hoc
  safety net. The post-build loop only mops up what prediction missed.
- **`concise` governs prose, never scope.** "Concise" / "quick" / "just" mean tight EXECUTION (no
  padding, no narration) — NEVER narrow scope. Deliver the whole arc, expressed tightly. Misreading
  this as "do less" is the single largest cause of under-delivery.
- **Gate DONE against the PREDICTION, not the literal ask.** `completeness-checker` verifies the
  built thing covers the predicted full scope + every gorgeous/prod dimension — not merely that the
  sentence was satisfied.

## Predictable extensions — the arc every naive first pass omits (build them unbidden)

- **Every state** — empty (→ first-action launchpad, per `[[embarrassingly-easy-to-use]]`), loading
  (contextual copy), error (RFC7807 + retry), success (+ obvious next action), offline, over-limit,
  unauthorized.
- **Every surface** — full page set (source sitemap 1:N), 6 breakpoints + mobile, WCAG 2.2 AA
  (`#wcag22`), SEO + per-route JSON-LD (`#jsonld`), i18n by demographics, PWA.
- **Gorgeous by default** (`[[gorgeous-by-default]]`) — cinematic motion, brand-locked, bento /
  asymmetry, refined fluid type. NEVER "functional but plain": pair every backend feature with a
  front end worth demoing to investors.
- **AI-native** — the generative / chat-as-UI / voice / multimodal surface AI makes possible.
  Never AI-optional; AI is foundational, never a toggle.
- **Production-ready** — feature flag, TDD-first tests, deploy + prod-verify (`[[verification-loop]]`),
  analytics, observability, undo on every mutation, keyboard shortcut for every action.
- **Extra mile** (`[[extra-mile]]`) — the thing a human dev would never build but that adds real
  value. If it's <2h and needs no design call, SHIP it, don't Rec it (`[[auto-integrate-recs]]`).

## The learning loop — so a miss is never repeated

- A re-prompt on the SAME surface = a prediction miss. Beyond doing the requested work: root-cause
  WHY the first pass didn't predict it, then add the missed item to this checklist (or the owning
  skill) THE SAME TURN, per `[[prompt-as-training-signal]]`. This checklist is the accumulated
  predictive model — it only grows, and each addition is a class of miss retired forever.

## Anti-patterns (all guarantee a re-prompt)

- Doing the literal ask and surfacing the rest as "Recommendations" or "next fire" — deferral is
  under-delivery.
- Scoping a turn to what you NOTICED, not what EXISTS.
- Reading "concise" / "just" / "quick" as license to narrow scope.
- Treating gorgeousness or completeness as a later polish pass instead of a pass-1 requirement.

## Cross-links

- `#predict` (kernel anchor) · `[[prompt-as-training-signal]]` (the learning loop) ·
  `[[website-build-doctrine]]` (Phase -0.5 scope-lock) · `[[extra-mile]]` · `[[auto-integrate-recs]]` ·
  `[[gorgeous-by-default]]` · `[[embarrassingly-easy-to-use]]` · `[[monitor-orchestration]]`.
