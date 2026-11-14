---
name: "F06 — Accessibility and usability"
familyId: "F06"
defaultLayer: "accessibility"
defaultTier: "required_ci"
itemCount: 30
---

# F06: Accessibility and usability (F06.01–F06.30)

- **Default Verification Layer**: `accessibility`
- **Default Execution Tier**: `required_ci`
- **Authorized Pilot Implementation**: `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F06.01` | **Explicit accessibility target** | Enforce WCAG 2.2 AA across all public reader and authenticated authoring surfaces. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.02` | **Enforced automated findings** | Run axe-core (@axe-core/playwright and @storybook/addon-a11y) with zero actionable violations. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.03` | **Keyboard completion** | Verify complete keyboard tab traversal to primary CTAs, citations, and editor controls. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.04` | **Accessible control contracts** | Verify accessible names, roles, and states on buttons, citation links, and disclosures. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.05` | **Form comprehension** | Associate every input and calculator control with explicit visible labels and units. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.06` | **Focus transitions** | Preserve and restore focus across citation jumps, back-links, and editor mode toggles. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.07` | **Screen-reader verification** | Provide semantic landmarks (<header>, <nav>, <main>, <article>, <aside>, <footer>) and ARIA labels. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.08` | **Dynamic announcements** | Use aria-live='polite' for theme preview captions, autosave status, and calculator outputs. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.09` | **Recoverable input errors** | Provide clear inline validation diagnostics that preserve user input during recovery. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.10` | **Target acquisition** | Enforce generous touch targets (min-h-12 on primary actions like + New article). | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.11` | **Non-color meaning** | Pair every FiniteChart series with SVG pattern encodings (solid, hatch, dots, crosshatch) + data table. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.12` | **Contrast evidence** | Verify WCAG 2.2 AA 4.5:1 body text and 3:1 UI contrast across all 15 OKLCH themes. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.13` | **Responsive reading order** | Preserve logical DOM reading order across mobile single-column and desktop split-column layouts. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.14` | **Motion and interruption** | Honor prefers-reduced-motion: reduce across scroll behavior and surface transitions. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.15` | **Accessible media** | Require descriptive alt text, captions, and provenance badges on every FigureFrame. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.16` | **Meaningful alternatives** | Pair every quantitative chart with a collapsible semantic <table> companion. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.17` | **Document structure** | Enforce exactly one H1 and sequential H2 -> H3 hierarchy with zero skipped heading levels. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.18` | **Tables and grids** | Use semantic <table>, <caption>, <th scope='col'>, and <th scope='row'> on ComparisonTable. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.19` | **Time-limited tasks** | Preserve offline drafts locally when sessions or magic links expire. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.20` | **Accessible authentication** | Provide accessible Google, GitHub, and Magic-Link sign-in controls without cognitive puzzles. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.21` | **Gesture alternatives** | Provide click and keyboard alternatives for all reordering and interactive controls. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.22` | **Voice-control targeting** | Align visible button text with accessible names (e.g. '+ New article'). | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.23` | **Language handling** | Declare valid lang attributes and preserve bidirectional/CJK text rendering. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.24` | **Accessible exports** | Ensure exported token snippets and printed articles retain semantic structure and contrast. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.25` | **Hover and focus content** | Ensure citation references work via keyboard focus and click as well as hover. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.26` | **Availability semantics** | Expose disabled and read-only states clearly (including non-member viewer notices). | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.27` | **Observed task success** | Support human usability review tiers for complex authoring workflows. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.28` | **Consequential-action understanding** | Clearly label Draft vs Scheduled vs Published actions and rollback consequences. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.29` | **Perceived responsiveness** | Render immediate loading indicators for lazy-loaded Plate editor chunks and AI theme generation. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
| `F06.30` | **First-use discoverability** | Provide clear empty/initial states and seed prompts for theme and article creation. | `accessibility` | `required_ci` | `verified` | `apps/web/e2e/a11y.spec.ts & packages/blog/src/components.tsx` |
