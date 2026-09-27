---
last_reviewed: 2026-09-26
superseded_by: null
name: "buttons-accommodate-largest-text"
priority: 2
pack: "frontend"
paths: ["concern:*frontend*", "**/*.tsx", "**/*.component.ts", "**/*.html", "**/*.vue", "**/*.svelte"]
triggers:
  - "button"
  - "loading state"
  - "label toggle"
  - "refreshing"
  - "spinner"
  - "disabled button"
---

# Buttons Accommodate the Largest Text (No Resize on Label Change)

Any control whose label CHANGES between states MUST be sized for the **longest**
label it can ever show, so it never grows/shrinks when the text toggles. A button
that jumps from `Refresh` → `Refreshing…` (or `Save`→`Saving`, `Copy`→`Copied`,
`Loading…`, `Deploying…`) is a layout jitter bug + reads as broken. (Brian directive
2026-09-26.)

## The rule

- **Reserve the widest label's width up front.** Before shipping any button/pill/tab/
  chip/menu-item whose text swaps at runtime, list every label it can show and size
  the control (or its text span) to the LONGEST one.
- Applies to EVERY toggling control, not just Refresh: submit (`Save`/`Saving…`),
  async actions (`Deploy`/`Deploying…`), copy (`Copy`/`Copied!`), load-more, pagers,
  count-driven labels (`1 item`/`100 items`), i18n (translations are longer — German
  ~30% longer than English), and number/currency fields.
- **A `min-width` that isn't sized for the longest label is still a bug.** A floor
  between the short and long label (e.g. `min-width:110px` when `Refresh` needs 100 and
  `Refreshing` needs 120) still grows on the long state. Size it to the LONGEST.

## Techniques (prefer top-down)

- **Fixed-width centered text span** — wrap the toggling text: `min-w-[<N>ch]
  text-center inline-block`, where `<N>` = the longest label's character count
  (`ch` scales with font, self-documents the reserved width). Icon + span → button
  auto-sizes to the widest label, never resizes. This is the default fix.
- **`min-width` on the control** — sized to the longest label (in `ch`, not a magic px
  floor). Fine when the button is text-only.
- **Invisible-longest-label overlay** (bulletproof, no count) — stack the visible label
  and an invisible copy of the longest label in one CSS grid cell
  (`display:grid; > * { grid-area:1/1 }`; the reserve child `visibility:hidden`); the
  cell sizes to the widest. Use when labels are dynamic/unknowable at author time.
- **Never** rely on `white-space:nowrap` alone — it stops wrapping but the width still
  changes.

## Verify

- In a real browser, measure the control's `getBoundingClientRect().width` in BOTH
  (all) states — they MUST be equal. A screenshot of one state can't prove it.

## Reference incident (projectsites.dev, 2026-09-26)

The admin analytics refresh button (`analytics.component.ts .refresh-btn`) had
`min-width:110px` — a floor sized between `Refresh` (7ch) and `Refreshing` (10ch), so
it grew when loading. Fixed with `.refresh-btn span { min-width:10ch; text-align:center }`
(reserve the longest label). Same class fixed the same turn on the apps-instances logs,
domain-stack, site-data-browser, and domains refresh buttons (`min-w-[Nch]` on a
centered span). Cross-links: `[[gorgeous-by-default]]` · `[[embarrassingly-easy-to-use]]` ·
`[[text-contrast]]` · `[[code-style]]`.
