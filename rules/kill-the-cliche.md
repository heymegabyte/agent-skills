---
last_reviewed: 2026-11-11
superseded_by: null
name: "kill-the-cliche"
priority: 2
pack: "design"
triggers:
  - "design"
  - "landing page"
  - "hero"
  - "placeholder"
paths:
  - "*"
---

# Kill the Cliché — Never Ship the Generic Default

The stock default is the enemy. Every tired, un-chosen element — the placeholder, the un-themed
component, the first-result-from-the-library — is the TELL that taste was skipped. Shipping the
cliché is how a build reads as generic AI slop instead of something a discerning user screenshots.
Replace or subvert every default; the only acceptable cliché is one used knowingly, for irony or reason.

Cross-links: `[[gorgeous-by-default]]` · `[[first-time-excellence]]` · `[[cinematic-hud-standard]]` · `[[logo-generation]]` · `[[copy-writing]]` · `[[image-quality]]`

## The clichés to kill on sight

- **Type:** stock Inter/Roboto alone with no display face; no fluid scale; no `text-wrap: balance`.
- **Color/depth:** the generic purple gradient blob; a flat single-shadow card; banding with no noise
  overlay; three-or-more competing accent hues.
- **Loading:** a bare spinner or a skeleton wall instead of a branded / nebula waiting moment (`[[nebula-waiting-experience]]`).
- **Chrome:** the un-themed default shadcn/library look straight from the docs; a raw unstyled iframe;
  a default map embed; the three-dots chat bubble; a generic globe/swoosh logo.
- **Content:** lorem ipsum; placeholder avatars; "Lorem"/"Your text here"; stock-photo hero with no treatment.
- **Copy:** vague aspirational headlines ("Empower your workflow"); feature lists with no voice.
- **Motion:** easing-less linear transitions; animation-for-its-own-sake with no state meaning.

## The rule

- **Start from the catalog, then make it OURS.** Compose from `@theme.tools`
  (`[[theme-tools-canonical-components]]`) — but a catalog component shipped with its default theme,
  default copy, and default spacing is still a cliché. Theme it, voice it, compose it.
- **One knowing exception.** A cliché is allowed ONLY when deliberately chosen (ironic, referential, or
  genuinely the right call) and you can say why. The default-because-I-didn't-decide is the defect.
- **The taste gate catches it:** "would a top studio ship this unchanged?" A default anything → no.

## Anti-patterns

- Placeholder / lorem / default-avatar / stock-hero shipped as if final.
- An un-themed library component rendered straight from its docs example.
- A bare spinner, generic purple blob, or three-dots bubble where a branded treatment belongs.
- A vague aspirational headline that could belong to any product.
