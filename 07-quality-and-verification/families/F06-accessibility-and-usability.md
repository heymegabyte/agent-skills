---
name: "F06-accessibility-and-usability"
family: "F06"
title: "F06 — Accessibility and usability"
default_layer: "accessibility"
default_tier: "required-ci"
recommendations_count: 30
updated: "2026-11-04"
---

# F06 — Accessibility and usability (30 Recommendations: F06.01–F06.30)

> **Summary**: WCAG 2.2 AA target, enforced axe-core Storybook checks, keyboard-only completion, accessible control contracts (name/role/state/value), focus restoration, live-region announcements, APCA/WCAG contrast, target sizing, and human usability evaluation.
> **Default Layer**: `accessibility` · **Default Execution Tier**: `required-ci` · **Primary Tools**: @storybook/addon-a11y, axe-core, Playwright Keyboard, Human Screen-Reader Review

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F06 Recommendation Catalog (F06.01–F06.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F06.01`** | Explicit accessibility target | `P0` | `accessibility` | `required-ci` | `verified` | Establish WCAG 2.2 AA as the default target and map verification evidence to applicable criteria and user tasks. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.02`** | Enforced automated findings | `P0` | `accessibility` | `required-ci` | `verified` | Integrate automated axe-core checks with executable Storybook stories and fail required checks on actionable violations. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.03`** | Keyboard completion | `P0` | `accessibility` | `required-ci` | `verified` | Complete critical workflows using only the keyboard with logical traversal, escape behavior, and zero keyboard traps. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.04`** | Accessible control contracts | `P0` | `accessibility` | `required-ci` | `verified` | Verify exposed names, roles, states, and values for custom controls across interaction state changes. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.05`** | Form comprehension | `P0` | `accessibility` | `required-ci` | `verified` | Check labels, required-field indicators, instructions, grouping, and error associations beyond placeholder text. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.06`** | Focus transitions | `P0` | `accessibility` | `required-ci` | `verified` | Verify focus after route changes, dialog dismissal, validation failures, and content removal. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.07`** | Screen-reader verification | `P0` | `accessibility` | `human-evaluation` | `planned` | Manually exercise representative journeys with screen-reader and browser combinations and record findings. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06-accessibility-and-usability`)* |
| **`F06.08`** | Dynamic announcements | `P0` | `accessibility` | `required-ci` | `verified` | Check live-region announcements for errors, progress, completion, and async content without noisy duplication. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.09`** | Recoverable input errors | `P0` | `accessibility` | `required-ci` | `verified` | Verify error summaries navigate to affected fields, explain corrections, preserve data, and clear stale descriptions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.10`** | Target acquisition | `P0` | `accessibility` | `required-ci` | `verified` | Assess pointer target size (≥24×24 CSS px WCAG 2.2 AA), spacing, and precision demands on small screens. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.11`** | Non-color meaning | `P1` | `accessibility` | `required-ci` | `verified` | Verify charts, validation, selection, and status communicate meaning through text, shape, or pattern alongside color. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.12`** | Contrast evidence | `P1` | `accessibility` | `required-ci` | `verified` | Evaluate text and non-text contrast across states and themes using actual rendered foreground-background pairs. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.13`** | Responsive reading order | `P1` | `accessibility` | `required-ci` | `verified` | Verify semantic reading order, navigation order, and information continuity after resizing, zooming, or reflow. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.14`** | Motion and interruption | `P1` | `accessibility` | `required-ci` | `verified` | Assess animation, flashing, auto-updating content, and autoplay with pause controls and reduced-motion support. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.15`** | Accessible media | `P1` | `accessibility` | `required-ci` | `verified` | Test captions, transcripts, audio descriptions, and keyboard-operable media controls on representative content. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.16`** | Meaningful alternatives | `P1` | `accessibility` | `required-ci` | `verified` | Review image alternatives in context, distinguishing decorative assets from complex diagrams needing explanation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.17`** | Document structure | `P1` | `accessibility` | `required-ci` | `verified` | Verify headings, landmarks, lists, grouping, and reading sequence express the page's actual structure. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.18`** | Tables and grids | `P1` | `accessibility` | `required-ci` | `verified` | Check table headers, row-column relationships, captions, and assistive-tech grid navigation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.19`** | Time-limited tasks | `P1` | `accessibility` | `required-ci` | `verified` | Exercise timeouts and expiring tasks with warnings, extensions, saved progress, and recoverability. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.20`** | Accessible authentication | `P1` | `accessibility` | `required-ci` | `verified` | Verify authentication permits password managers and paste and provides accessible alternatives to cognitive puzzles. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.21`** | Gesture alternatives | `P1` | `accessibility` | `required-ci` | `verified` | Complete dragging, swiping, or multi-point tasks through simpler single-pointer and keyboard alternatives. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.22`** | Voice-control targeting | `P1` | `accessibility` | `required-ci` | `verified` | Check that visible labels align with accessible names and repeated labels remain distinguishable for voice control. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.23`** | Language handling | `P2` | `accessibility` | `required-ci` | `verified` | Verify page and passage `lang` attributes, localized labels, and `dir` attributes for assistive technology. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.24`** | Accessible exports | `P2` | `accessibility` | `required-ci` | `verified` | Assess PDFs, emails, and exported documents for semantic structure, reading order, link names, and alt text. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.25`** | Hover and focus content | `P2` | `accessibility` | `required-ci` | `verified` | Check tooltips and popovers for keyboard access, Escape dismissal, persistence, and pointer hover reachability. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.26`** | Availability semantics | `P2` | `accessibility` | `required-ci` | `verified` | Verify disabled, read-only, hidden, and unavailable controls expose accurate semantics and cannot be focus-trapped. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.27`** | Observed task success | `P2` | `accessibility` | `human-evaluation` | `planned` | Run focused usability sessions with representative users including accessibility adaptations. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06-accessibility-and-usability`)* |
| **`F06.28`** | Consequential-action understanding | `P2` | `accessibility` | `required-ci` | `verified` | Verify labels, summaries, confirmations, and recovery clearly communicate irreversible outcomes before commit. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.29`** | Perceived responsiveness | `P2` | `accessibility` | `required-ci` | `verified` | Evaluate whether loading and long-running operations provide accessible feedback, progress, and cancellation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06`)* |
| **`F06.30`** | First-use discoverability | `P2` | `accessibility` | `human-evaluation` | `planned` | Evaluate empty states and progressive disclosure so unfamiliar users can identify and complete the next valid action. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F06-accessibility-and-usability`)* |
