---
name: "F02 — Components and interactions"
familyId: "F02"
defaultLayer: "component_storybook"
defaultTier: "required_ci"
itemCount: 30
---

# F02: Components and interactions (F02.01–F02.30)

- **Default Verification Layer**: `component_storybook`
- **Default Execution Tier**: `required_ci`
- **Authorized Pilot Implementation**: `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F02.01` | **Critical component stories** | Establish stories for components on critical existing journeys first with real exported interfaces and providers. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.02` | **Independent story fixtures** | Give each story a minimal explicit fixture and resettable dependencies isolated from execution order. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.03` | **Meaningful state matrices** | Cover loaded, loading, empty, error, disabled, and pending states with recovery assertions. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.04` | **User-facing interaction assertions** | Write story play functions using roles, labels, and visible outcomes rather than private selectors. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.05` | **Form timing** | Exercise validation during editing, blur, and submission, verifying message timing and preserved user input. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.06` | **Keyboard behavior** | Test expected keyboard operations for menus, comboboxes, tabs, and composite controls. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.07` | **Pointer interactions** | Exercise click, pointer cancellation, touch activation, and outside dismissal. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.08` | **Controlled and uncontrolled state** | Verify supported controlled and uncontrolled modes, prop updates after mount, and reset behavior. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.09` | **Stale asynchronous responses** | Resolve competing requests in reverse order and verify the component retains the newest valid result. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.10` | **Optimistic updates** | Test optimistic success, rollback, partial rejection, and retry with consistent pending indicators. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.11` | **Overlay coordination** | Exercise nested dialogs, popovers, and menus through open, close, escape, and focus restoration. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.12` | **Unmount cleanup** | Unmount during requests, subscriptions, and timers so obsolete work stops affecting the interface. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.13` | **Repeated activation** | Rapidly activate submission and destructive controls to verify pending state and single logical action. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.14` | **Debounce and throttle** | Advance a controlled clock across debounce and throttle boundaries to check final submitted values. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.15` | **Router synchronization** | Test component state against route parameters, query changes, back/forward navigation, and defaults. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.16` | **Selection models** | Exercise single selection, range selection, select-all, filtering, and disabled items. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.17` | **Identity-dependent rendering** | Change tenant, actor, or entitlement providers after mounting and verify controls refresh appropriately. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.18` | **Shared UI contracts** | Exercise theme.tools public exports through representative consuming components and ui.theme.tools stories. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.19` | **Theme behavior** | Switch supported light/dark themes and motion preferences during interaction without losing state. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.20` | **Composition contracts** | Test documented slots, children, refs, and wrapper composition preserving focus and event delivery. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.21` | **Event propagation** | Exercise nested clickable elements and delegated events for intended propagation boundaries. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.22` | **Reordering controls** | Test drag-and-drop transitions, cancellation, invalid targets, and keyboard reordering alternatives. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.23` | **Virtualized collections** | Scroll beyond initially rendered rows and verify selection, focus, and identity survive DOM recycling. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.24` | **Responsive behavior** | Change viewport or container dimensions across layout transitions while preserving interaction state. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.25` | **Localization updates** | Change locale after mounting and verify messages, formatting, and fallback translations update together. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.26` | **Hydration correctness** | Test server-rendered HTML hydration with real initial data without lost input or divergent controls. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.27` | **Upload interfaces** | Exercise file selection, validation, progress, cancellation, and retry with accessible status. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.28` | **Browser permission outcomes** | Test clipboard, media, or notification components against granted, denied, and unavailable outcomes. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.29` | **Live update presentation** | Feed subscription components connection loss, recovery, duplicate, and out-of-order updates. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
| `F02.30` | **Executable Storybook coverage** | Run stories and assertions through Storybook test runner / addon-vitest mapped to source packages. | `component_storybook` | `required_ci` | `verified` | `apps/ui/stories/BlogComponents.stories.tsx & apps/ui/e2e/storybook-render.spec.ts` |
