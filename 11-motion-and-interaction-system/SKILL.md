---
name: "motion-and-interaction-system"
description: "Meaning-first animation with 3-tier hierarchy. CSS scroll-driven (animation-timeline: scroll()), View Transitions API, @starting-style DOM-insert, container scroll-state queries, prefers-reduced-motion mandatory on all animations."
metadata:
  version: "2.1.0"
  updated: "2026-05-03"
  effort: "medium"
  model: "sonnet"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
submodules:
  - build-breaking-rules.md
priority: 3
pack: "design"
stage: beta
triggers:
  - "motion"
  - "animation"
  - "transition"
paths:
  - "org:website_build"
---

# 11 — Motion and Interaction System

Apply meaning-first CSS animations (scroll-driven, View Transitions, `@starting-style`) with mandatory `prefers-reduced-motion` on every animated surface.

## Motion serves one of three purposes

1. **Feedback** — confirm user action (button press, form submit, save)
2. **Continuity** — preserve spatial context across state changes (page transition, modal open)
3. **Delight** — express brand personality (hero parallax, signature reveal)

Anything else = AI slop; cut it.

## 3-Tier Hierarchy

- **Tier 1 — Functional** — feedback on every interaction (hover, focus, active, tap). Duration 100–200ms. Transform/opacity only.
- **Tier 2 — Choreographic** — page transitions, modal entrance, section reveal. Duration 300–500ms. View Transitions or `@starting-style`.
- **Tier 3 — Cinematic** — hero parallax, signature reveal, scroll-driven storytelling. Duration ≥600ms. Scroll-timeline.

Never stack 3 tiers on same surface. One cinematic per page.

## Mandatory `prefers-reduced-motion`

EVERY animation MUST honor `prefers-reduced-motion: reduce` — snap to final state, never hide content.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## View Transitions API

- Same-document SPA: `document.startViewTransition(() => updateDOM())`
- Cross-document MPA: `@view-transition { navigation: auto; }` in CSS
- Per-element: `view-transition-name: hero-image;` on persistent elements
- Chrome 126+, Safari 18+, Firefox 144 (Oct 2025)

```css
::view-transition-old(root), ::view-transition-new(root) {
  animation-duration: 0.3s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

## Scroll-Driven Animations

- `animation-timeline: scroll()` (root scroller) or `view()` (element-in-viewport)
- Off-main-thread on Chrome stable + Safari 26 (2025)
- Firefox unsupported — pair with `prefers-reduced-motion` AND `duration:1ms` fallback

```css
@keyframes fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.reveal { animation: fade-up linear; animation-timeline: view(); animation-range: entry 0% cover 30%; }
```

## `@starting-style` (DOM-insert animation)

Baseline 2026 — animates from explicit starting state to default state when element enters DOM.

```css
.toast { opacity: 1; transform: translateY(0); transition: opacity 0.3s, transform 0.3s; }
@starting-style { .toast { opacity: 0; transform: translateY(-10px); } }
```

## Container Scroll-State Queries (Baseline 2026)

`@container scroll-state(stuck: top)` — replaces JS scroll-listener-based sticky styling.

```css
.nav { container-type: scroll-state; }
@container scroll-state(stuck: top) { .nav { box-shadow: 0 4px 12px rgba(0,0,0,0.4); } }
```

## Micro-Interactions (Tier 1 patterns)

- **Button press** — `transform: scale(0.98)` on `:active`, 100ms
- **Hover** — `transform: translateY(-1px)` + color shift, 200ms
- **Focus-visible** — 3px brand-accent ring, 2px offset, 0ms (instant)
- **Tap** — haptic feedback via `navigator.vibrate(10)` if supported
- **Toggle** — animated check/cross morph via `<svg>` path interpolation
- **Loading** — pulse 1.2s ease-in-out infinite

## Stagger sequences (no JS needed)

```css
.list-item { animation: fade-up 0.4s ease-out backwards; }
/* OR use sibling-index() (Baseline 2026) */
.list-item { transition-delay: calc((sibling-index() - 1) * 80ms); }
```

## Performance constraints

- Animate `transform` + `opacity` ONLY on hot paths
- `will-change` sparingly (transform, opacity only when actually animated)
- Drop GPU layers after animation completes
- INP target ≤100ms per `_kernel/standards.md#cwv` — animations must not block input

## Interaction polish (every interactive element)

Per `10-experience-and-design-system` § 4-state distinction:

- Default → neutral
- Hover → underline-sweep + color shift + `translateY(-1px)`
- Focus-visible → 3px brand-accent ring 2px offset (distinct from hover)
- Active → `scale(0.98)` + immediate color confirm

Audit gate: Playwright cycles each interactive through 4 states → diff ≥3px pixel-difference or fail.

## Banned motion

- ❌ Uniform fade-in on every element (AI slop tell)
- ❌ Parallax on every section (one cinematic per page)
- ❌ Spinning loaders that don't progress
- ❌ Auto-playing video with sound
- ❌ Carousel auto-rotate (manual swipe only — accessibility)
- ❌ Scroll-jacking that breaks browser back button
- ❌ Animations that block input (INP >100ms)
- ❌ Easter eggs on critical conversion paths

## See submodules: view-transitions.md, scroll-driven.md, micro-interactions.md, reduced-motion.md, build-breaking-rules.md.

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Domain Swarm Directive**: Standardize `0.333s` (`cubic-bezier(0.22, 1, 0.36, 1)`) choreography and reduced-motion fallbacks in shared `@theme.tools/ui` primitives, offloading per-route transition wiring and INP (`<=100ms`) regression specs to parallel `opencode` (DeepSeek) workers.
- **Massive OpenCode (DeepSeek) Offload**: Whenever a task slice is throughput-safe (bounded implementation, plugin catalog shards, 100% unit test generation, Playwright E2E specs, migrations, or documentation), offload it to parallel **`opencode` swarms powered by DeepSeek** (`~/.agentskills/bin/opencode-deepseek.sh` via the LiteLLM 4-key pool `https://llm.megabyte.space/v1`) rather than consuming premium `claude`, `codex`, or `gemini` client quota.
- **Tri-Frontier Parallel Swarms & Right-Sized SCRUM Quorum**: When complex architectural synthesis, speculative critical-path racing, or adversarial verification is needed, run `claude`, `codex`, and `gemini` in parallel across isolated Git worktrees (`bin/multi-swarm-orchestrator.ts`) guided by a right-sized collaborative SCRUM meeting (`bin/scrum-deliberation-quorum.ts`) of only the required specialist agents. See `rules/parallel-multi-swarm-orchestration.md`.
- **End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**: At the end of every prompt round (running in parallel with final verification, deployment, and reporting), extract any possible meaning, preference, architectural lesson, reusable site code, or system configuration from the current agent window and store it concurrently into **`heymegabyte/agent-skills`** (for AI skills/rules/prompts — always updated under the **Minimum-Prompt Ecosystem Completeness Assumption**: assuming the skills *should have already been written* so that we write **as few prompts as possible** to finish **as complete a product or multi-repo ecosystem as possible** via massive parallel agent swarms), **`heymegabyte/theme.tools`** (for reusable site/app code across the 28 canonical `@theme.tools/*` libraries), and **`heymegabyte/install.doctor`** (for reusable system/host code).
