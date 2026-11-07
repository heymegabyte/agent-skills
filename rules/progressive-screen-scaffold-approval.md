---
name: progressive-screen-scaffold-approval
description: The build process for multi-screen product UI — inventory → full reviewable prototype → optional or policy-required Figma review → progressive implementation with safe dependency seams. Use for apps, dashboards, multi-screen websites, prototypes, and screen-by-screen approval workflows.
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Progressive Screen Scaffold + Review

How to build a multi-screen product UI so you ship FAST per screen without baking in a mistake a later
screen's change forces you to rewrite. [[figma-design-approval-gate]] decides whether Figma is optional
or mandatory; this rule owns the scaffold → review → implement sequence and the interdependency safety
that lets programming start as soon as one screen is ready.

## The process

1. **Prompt → extract the full screen + component inventory FIRST.** Enumerate every screen, its states,
   and the shared components before design or code (predict the 80% arc — [[predictive-completeness]]).
2. **Resolve the review path.** If an applicable authority requires Figma, follow its exact approval gate.
   Otherwise use Figma only when requested or materially helpful, and select proportionate review evidence.
3. **Scaffold a gorgeous FULL prototype — INCLUDING extras + improvements.** The
   scaffold is a non-production, reviewable prototype of ALL screens (real layout, brand-locked, every
   state built, gorgeous per [[first-time-excellence]]) — the artifact the per-screen reviews run against.
   The improvements the brief implies land HERE for review, never as a later surprise.
4. **Per-screen readiness unlocks per-screen PRODUCTION programming.** Under an active approval gate, this
   means explicit approval. Otherwise it means the design direction is supported by the selected evidence.
5. **Interdependency-safe implementation (the load-bearing discipline).** Starting early must NOT bake in a
   mistake a later change forces you to unwind:
   - **Sequence by dependency:** implement independent/leaf screens first (marketing homepage, auth, a
     settings shell) that don't depend on an unapproved screen's data contract. Defer a screen whose
     contract an unapproved upstream screen still owns.
   - **Isolate behind stable seams:** each screen talks to the rest ONLY through typed contracts (Zod per
     [[zod-everywhere]]) + mock/fixture data + a feature flag ([[feature-flags]]) — so a later change to
     screen B can't force a rewrite of screen A. Shared components come from ONE kit (`@theme-tools/ui`),
     re-skinned, never re-forked per screen ([[inverted-abstraction-pyramid]]).
   - **Keep the just-approved screen cheap to revise too:** thin glue, data behind an adapter, no premature
     hard-coding of a layout or contract still in flux.
   - **An unstable contract stays MOCKED:** wire a screen to real APIs only once BOTH its own and its
     upstream's contracts are approved; until then it runs on fixtures behind the flag (dark-launch).
6. **Material visual deviation → repeat the applicable review.** Return to Figma only when its gate is active.

## Which screens may be built now vs gated

- A screen the user has explicitly and concretely directed ("make a gorgeous homepage that does X") has
  enough direction to build when no stricter approval policy applies. It is usually a leaf
  (marketing homepage, auth) → safe to program first.
- Under an active Figma or other human approval gate, unapproved screens stay gated. Otherwise, proceed
  with the prototype and visual evidence while preserving reversible seams.

## Why (the mistake this prevents)

- Programming a dependent screen against an UNAPPROVED upstream contract = a guaranteed rewrite when that
  upstream screen changes in review. The fix is ordering + seams, not slowing down: start immediately on
  what's stable, keep everything else swappable.
- A scaffold-first gorgeous prototype makes approvals concrete + per-screen — not a late, expensive, whole-app redo.

## When Figma is selected or required

Do not make the user manually recreate an artifact the agent can produce. Create or update the Figma
artifact from the prompt or reviewable prototype, then minimize the user's action to review and approval.

- **In an interactive session, guide or auto-drive Figma creation after the user selects it or policy requires it.**
- **Preferred when a gorgeous prototype already exists (our usual case):** mirror the LIVE build INTO
  Figma so the artifact EXACTLY matches what's deployed → approval = approval of what's shipped. Use a
  URL→Figma importer (e.g. **html.to.design**) on the live routes; drive it via Computer Use on the
  user's logged-in Chrome ([[chrome-computer-use-macos]]) so the user does nothing but click approve.
- **From-scratch / no build yet:** generate the design from the prompt with **Figma Make** (text→design)
  or the Figma plugin API, then present the link.
- **Hands-off / recurring:** when policy requires Figma and credentials/tooling are available, publish frames
  for one-click approval. When Figma is optional, never provision credentials or publish artifacts silently.
- **Deliver a single approval link** + a 1-line "what changed / what to look for," so approving is seconds.
- **Headless runtime:** generate Figma only when the governing workflow requires it and can satisfy the
  approval contract; otherwise record non-Figma visual evidence and continue within the autonomy tier.

## Cross-links

[[figma-design-approval-gate]] · [[chrome-computer-use-macos]] (auto-drive the import/approval) ·
[[predictive-completeness]] · [[first-time-excellence]] ·
[[feature-flags]] (dark-launch each screen) · [[zod-everywhere]] (contract seams) ·
[[inverted-abstraction-pyramid]] (shared-thin / feature-deep) · [[monitor-orchestration]] (fan screens
out once their contracts are stable) · [[public-front-door]] (the homepage is the apex, app behind /login).
