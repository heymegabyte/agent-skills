---
name: "F02-components-and-interactions"
family: "F02"
title: "F02 — Components and interactions"
default_layer: "component-story"
default_tier: "required-ci"
recommendations_count: 30
updated: "2026-11-04"
---

# F02 — Components and interactions (30 Recommendations: F02.01–F02.30)

> **Summary**: Critical component stories, independent resettable fixtures, meaningful state matrices, user-facing role/label play assertions, keyboard/pointer/overlay coordination, stale async cancellation, optimistic rollback, and Storybook addon-vitest coverage.
> **Default Layer**: `component-story` · **Default Execution Tier**: `required-ci` · **Primary Tools**: Storybook 10, @storybook/addon-vitest, Testing Library, MSW

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F02 Recommendation Catalog (F02.01–F02.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F02.01`** | Critical component stories | `P0` | `component-story` | `required-ci` | `verified` | Establish stories for components on critical journeys first, rendering real exported interfaces with required providers. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.02`** | Independent story fixtures | `P0` | `component-story` | `required-ci` | `verified` | Give each story a minimal explicit fixture and resettable dependencies so results never depend on execution order. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.03`** | Meaningful state matrices | `P0` | `component-story` | `required-ci` | `verified` | Cover loaded, loading, empty, error, disabled, and pending states where meaningful; assert available actions and recovery. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.04`** | User-facing interaction assertions | `P0` | `component-story` | `required-ci` | `verified` | Write story play functions using roles, labels, and visible outcomes rather than brittle private selectors. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.05`** | Form timing | `P0` | `component-story` | `required-ci` | `verified` | Exercise validation during editing, blur, and submission, verifying when messages appear and valid input survives. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.06`** | Keyboard behavior | `P0` | `component-story` | `required-ci` | `verified` | Test expected keyboard operations for menus, comboboxes, tabs, and composite controls; connect to F06 accessibility. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.07`** | Pointer interactions | `P0` | `component-story` | `required-ci` | `verified` | Exercise click, pointer cancellation, touch activation, and outside dismissal where supported. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.08`** | Controlled and uncontrolled state | `P0` | `component-story` | `required-ci` | `verified` | Verify supported controlled and uncontrolled modes, prop changes after mounting, and reset behavior. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.09`** | Stale asynchronous responses | `P0` | `component-story` | `required-ci` | `verified` | Resolve competing requests in reverse order and verify the component retains the newest valid result. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.10`** | Optimistic updates | `P0` | `component-story` | `required-ci` | `verified` | Test optimistic success, rollback, partial rejection, and retry with consistent pending indicators and accessible feedback. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.11`** | Overlay coordination | `P1` | `component-story` | `required-ci` | `verified` | Exercise nested dialogs, popovers, and menus through open, close, escape, and outside interaction with focus restoration. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.12`** | Unmount cleanup | `P1` | `component-story` | `required-ci` | `verified` | Unmount during requests, subscriptions, and timers; assert obsolete work stops and remounting does not duplicate handlers. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.13`** | Repeated activation | `P1` | `component-story` | `required-ci` | `verified` | Rapidly activate submission and destructive controls to verify pending-state behavior and a single logical action. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.14`** | Debounce and throttle | `P1` | `component-story` | `required-ci` | `verified` | Advance a controlled clock across debounce and throttle boundaries, checking final submitted value and cancellation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.15`** | Router synchronization | `P1` | `component-story` | `required-ci` | `verified` | Test component state against route parameters and query changes, including back/forward, invalid values, and defaults. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.16`** | Selection models | `P1` | `component-story` | `required-ci` | `verified` | Exercise single selection, range selection, select-all, filtering, and disabled items; reconcile counts and emitted records. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.17`** | Identity-dependent rendering | `P1` | `component-story` | `required-ci` | `verified` | Change tenant, actor, or entitlement providers after mounting and verify controls refresh appropriately. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.18`** | Shared UI contracts | `P1` | `component-story` | `required-ci` | `verified` | Exercise theme.tools public exports through representative consuming components and verify ui.theme.tools contracts. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.19`** | Theme behavior | `P1` | `component-story` | `required-ci` | `verified` | Switch supported theme and motion preferences during interaction, verifying control state and action availability survive. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.20`** | Composition contracts | `P1` | `component-story` | `required-ci` | `verified` | Test documented slots, children, refs, and wrapper composition while preserving focus management and event delivery. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.21`** | Event propagation | `P1` | `component-story` | `required-ci` | `verified` | Exercise nested clickable elements and delegated events, verifying prevented defaults and propagation boundaries. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.22`** | Reordering controls | `P1` | `component-story` | `required-ci` | `verified` | Test drag-and-drop transitions, cancellation, invalid targets, and keyboard alternatives by asserting final item order. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.23`** | Virtualized collections | `P2` | `component-story` | `required-ci` | `verified` | Scroll beyond initially rendered rows and verify selection, editing, focus, and identity remain attached to records. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.24`** | Responsive behavior | `P2` | `component-story` | `required-ci` | `verified` | Change viewport or container dimensions across layout transitions, checking overflow actions and preserved state. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.25`** | Localization updates | `P2` | `component-story` | `required-ci` | `verified` | Change locale after mounting and verify messages, formatting, validation text, and user values update together. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.26`** | Hydration correctness | `P2` | `component-story` | `required-ci` | `verified` | Test SSR hydration with real initial data and browser state, detecting lost input or divergent controls. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.27`** | Upload interfaces | `P2` | `component-story` | `required-ci` | `verified` | Exercise file selection, validation, progress, cancellation, and retry with controlled transport responses. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.28`** | Browser permission outcomes | `P2` | `component-story` | `required-ci` | `verified` | Test clipboard, media, notifications, or downloads against granted, denied, unavailable, and cancelled outcomes. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.29`** | Live update presentation | `P2` | `component-story` | `required-ci` | `verified` | Feed subscription components connection loss, recovery, duplicate updates, and out-of-order updates. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
| **`F02.30`** | Executable Storybook coverage | `P2` | `component-story` | `required-ci` | `verified` | Run stories and assertions through Storybook addon-vitest, mapping stories to source components for impacted selection. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F02`)* |
