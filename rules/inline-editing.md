# Inline Editing (seamless, dialog-free) — priority rule

**Origin:** Brian, 2026-10-06 (gitl.ink). Standing requirement for EVERY editable value in EVERY app. Destructive-feeling actions that GitHub gates behind modals (rename repo, edit description, change visibility label, etc.) must instead be **inline, zero-friction, zero-layout-shift** edits.

## The invariant: the input is INVISIBLE until focused

Read state and edit state must be **pixel-identical in layout**. The user clicks edit and the *same text* becomes editable in place — no jump, no resize, no reflow, no modal.

- The `<input>`/`[contenteditable]` inherits the EXACT same `font`, `font-size`, `font-weight`, `letter-spacing`, `line-height`, `color`, `padding`, `margin`, `height`, and `background` as the static text it replaces.
- `background: transparent` (or the surrounding surface color) · `border: 0` · `outline: 0` · `box-shadow: none` in BOTH states. The field blends into the UI — it never looks like a "form field."
- Width matches the text: size the input to its content (`field-sizing: content` where supported, else a hidden-mirror-span or `size`/ch width synced to the value). No full-width inputs that reflow the row.
- Measure the static element's box (`getBoundingClientRect`) and reproduce it exactly — this is the gate: screenshot read vs edit state, they must be indistinguishable except for the caret + subtle focus affordance.

## The controls: edit → (check, X), same footprint

- Static state: value + a single **edit (pencil) icon** button adjacent to it (reveal on row hover/focus; always reachable by keyboard).
- Click edit → text becomes the focused, text-selected input AND the pencil is replaced **in place** by two buttons: **✓ confirm** and **✗ cancel**, each the SAME size as the pencil was (the control cluster must not change width → no row reflow).
- Focus moves to the input, full value selected (so typing replaces, or the user clicks to position caret).
- A subtle focus affordance is allowed (e.g. a 1px cyan underline or a faint tinted background on the input only) — but it must NOT change the box dimensions (use `inset box-shadow`/`background`, never `border`/`outline` that adds layout).

## Interaction contract

- **Confirm:** ✓ click, or `Enter`. Optimistic update + inline spinner on ✓; revert + inline error toast on failure (never a blocking dialog).
- **Cancel:** ✗ click, `Escape`, or blur-away (configurable; default: blur cancels unless dirty+valid). Restores the exact previous value.
- **Validation:** inline, non-blocking. Invalid → ✓ disabled + a terse reason on hover/`aria-describedby`; the field stays open.
- **No confirmation modals** for reversible edits. For truly destructive/irreversible actions, prefer inline "type-to-confirm" or an undo-toast over a modal.
- **A11y:** the edit trigger is a real `<button aria-label="Edit {field}">`; the input gets an accessible name; ✓/✗ are buttons with labels; announce success/failure via a live region. Full keyboard path: Tab to pencil → Enter → type → Enter/Esc.
- **Undo:** every committed inline edit emits an undo affordance (toast or ⌘Z) — reversibility replaces the confirmation dialog.

## Reuse

Build ONE `<InlineEdit>` primitive (text, textarea, select, number variants) and use it everywhere — table cells, detail panels, titles, tags. It owns: measure→swap→focus-select→commit/cancel→optimistic+undo. Never hand-roll per field. Ship with a Playwright spec asserting zero layout shift (compare `getBoundingClientRect` read vs edit) + the full keyboard path.
