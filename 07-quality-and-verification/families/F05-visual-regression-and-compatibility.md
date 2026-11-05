---
name: "F05-visual-regression-and-compatibility"
family: "F05"
title: "F05 — Visual regression and compatibility"
default_layer: "visual-regression"
default_tier: "required-ci"
recommendations_count: 30
updated: "2026-11-04"
---

# F05 — Visual regression and compatibility (30 Recommendations: F05.01–F05.30)

> **Summary**: Stable baseline environments, shared-theme consumer impact, state-specific appearance, breakpoint & container-query boundaries, font fallback/substitution, RTL/CJK/i18n layout, forced-colors, reduced-motion, and multi-engine coverage.
> **Default Layer**: `visual-regression` · **Default Execution Tier**: `required-ci` · **Primary Tools**: Playwright Screenshots, Chromatic / Storybook, Browser Run + WebKit/Firefox

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F05 Recommendation Catalog (F05.01–F05.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F05.01`** | Stable baseline environments | `P0` | `visual-regression` | `required-ci` | `verified` | Establish visual baselines with explicit browser, OS, fonts, theme, and rendering settings recorded in metadata. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.02`** | Shared-theme impact | `P0` | `visual-regression` | `required-ci` | `verified` | Select representative consuming stories and pages for theme.tools and ui.theme.tools changes across tokens and primitives. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.03`** | High-value visual assertions | `P0` | `visual-regression` | `required-ci` | `verified` | Capture critical layouts and reusable patterns where clipping, overlap, hierarchy, or misplaced controls cause harm. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.04`** | State-specific appearance | `P0` | `visual-regression` | `required-ci` | `verified` | Compare loading, empty, error, selected, expanded, and pending appearances by reusing F02 story setups. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.05`** | Breakpoint boundaries | `P0` | `visual-regression` | `required-ci` | `verified` | Inspect widths immediately around real responsive breakpoints, including narrow supported screens. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.06`** | Container-driven layout | `P0` | `visual-regression` | `required-ci` | `verified` | Test reusable widgets inside constrained and nested containers using container-query-aware assertions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.07`** | Font failure and substitution | `P0` | `visual-regression` | `required-ci` | `verified` | Exercise unavailable fonts, delayed loading, fallback glyphs, and supported font substitution for legibility. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.08`** | International text layout | `P0` | `visual-regression` | `required-ci` | `verified` | Render long translations, RTL text, mixed scripts, combining marks, and CJK content without truncation or overlap. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.09`** | Zoom and reflow | `P0` | `visual-regression` | `required-ci` | `verified` | Inspect supported zoom and text-resize conditions on critical pages for reflow, fixed overlays, and sticky controls. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.10`** | Forced colors | `P0` | `visual-regression` | `required-ci` | `verified` | Exercise system forced-color modes and inspect icons, borders, focus indicators, and selected states. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.11`** | Reduced motion | `P1` | `visual-regression` | `required-ci` | `verified` | Capture reduced-motion states and transition endpoints, ensuring feedback does not depend on animation completion. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.12`** | Theme transitions | `P1` | `visual-regression` | `required-ci` | `verified` | Compare light, dark, and system-driven themes including live preference changes across surfaces and assets. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.13`** | Extreme content shapes | `P1` | `visual-regression` | `required-ci` | `verified` | Use unusually long names, large totals, dense charts, empty labels, and maximal item counts to expose layout failures. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.14`** | Minimal screenshot masking | `P1` | `visual-regression` | `required-ci` | `verified` | Mask only genuinely nondeterministic regions and document why, preserving presence and dimension assertions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.15`** | Capture readiness | `P1` | `visual-regression` | `required-ci` | `verified` | Wait for intended fonts, images, layout, and application state before capture while controlling time and animation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.16`** | Reviewed baseline changes | `P1` | `visual-regression` | `required-ci` | `verified` | Review image diffs against intended design changes and record acceptance reasons before updating baselines. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.17`** | Real engine coverage | `P1` | `visual-regression` | `required-ci` | `verified` | Use separate supported runners for Firefox and WebKit obligations where Browser Run Chromium is insufficient. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.18`** | Actual mobile platforms | `P1` | `visual-regression` | `required-ci` | `planned` | Supplement emulation with representative real devices for virtual keyboards, safe areas, and mobile chrome. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05-visual-regression`)* |
| **`F05.19`** | Operating-system differences | `P1` | `visual-regression` | `required-ci` | `verified` | Test supported desktop platforms where native controls, fonts, shortcuts, or scrollbars matter. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.20`** | Pixel density and scaling | `P1` | `visual-regression` | `required-ci` | `verified` | Inspect relevant device-pixel ratios and OS scaling levels for blurry assets or clipped canvas content. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.21`** | CSS feature fallbacks | `P1` | `visual-regression` | `required-ci` | `verified` | Exercise environments lacking optional CSS capabilities, confirming fallbacks preserve layout and interaction. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.22`** | Print layout | `P1` | `visual-regression` | `required-ci` | `verified` | Inspect printed critical documents for page breaks, repeated headers, hidden navigation, and readable contrast. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.23`** | Export rendering | `P2` | `visual-regression` | `required-ci` | `verified` | Render generated PDFs or images and compare critical visual regions alongside content assertions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.24`** | Image and icon assets | `P2` | `visual-regression` | `required-ci` | `verified` | Verify responsive image selection, intrinsic sizing, aspect ratios, transparency, icon alignment, and fallbacks. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.25`** | Resource-policy failures | `P2` | `visual-regression` | `required-ci` | `verified` | Exercise blocked or failed styles, fonts, images, and embeds under CSP/network failures for usable critical controls. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.26`** | Layering conflicts | `P2` | `visual-regression` | `required-ci` | `verified` | Inspect dialogs, tooltips, dropdowns, sticky headers, and banners together for z-index/stacking-context bugs. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.27`** | Long-page scrolling | `P2` | `visual-regression` | `required-ci` | `verified` | Inspect long content with nested scroll regions and sticky elements for anchored navigation and scroll restoration. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.28`** | Interaction-state visibility | `P2` | `visual-regression` | `required-ci` | `verified` | Compare hover, focus, active, selected, invalid, and disabled appearances for critical controls. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.29`** | Embedded compatibility | `P2` | `visual-regression` | `required-ci` | `verified` | Test third-party embeds or application widgets inside actual host contexts for sizing, theme, and clipping. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
| **`F05.30`** | User browser adaptations | `P2` | `visual-regression` | `required-ci` | `verified` | Check autofill, password managers, browser translation, and reading settings on critical pages. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F05`)* |
