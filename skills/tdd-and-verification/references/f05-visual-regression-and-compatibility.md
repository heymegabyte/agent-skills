---
name: "F05 — Visual regression and compatibility"
familyId: "F05"
defaultLayer: "visual_regression"
defaultTier: "conditional_release"
itemCount: 30
---

# F05: Visual regression and compatibility (F05.01–F05.30)

- **Default Verification Layer**: `visual_regression`
- **Default Execution Tier**: `conditional_release`
- **Authorized Pilot Implementation**: `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F05.01` | **Stable baseline environments** | Establish visual baselines with explicit browser version, OS, fonts, theme, and viewport metadata. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.02` | **Shared-theme impact** | Select consuming stories in ui.theme.tools and pages in apps/web whenever theme tokens change. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.03` | **High-value visual assertions** | Capture critical layouts where clipping, overlap, or broken contrast would harm readers. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.04` | **State-specific appearance** | Compare loading, empty, error, selected, and editing appearances reusing F02 stories. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.05` | **Breakpoint boundaries** | Inspect all 6 standard widths (375, 390, 768, 1024, 1280, 1920) for overflow or hidden controls. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.06` | **Container-driven layout** | Test shared blog and UI widgets inside constrained split-column and card containers. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.07` | **Font failure and substitution** | Verify legibility and layout stability when web fonts are delayed or substituted. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.08` | **International text layout** | Render long unbroken token paths, RTL Arabic, and CJK scripts without clipping or overflow. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.09` | **Zoom and reflow** | Verify 200% zoom and narrow reflow preserve access to all primary content and controls. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.10` | **Forced colors** | Verify borders, focus rings, and chart patterns remain distinguishable under forced-colors modes. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.11` | **Reduced motion** | Verify prefers-reduced-motion disables smooth-scroll and transitions while keeping instant navigation. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.12` | **Theme transitions** | Compare light (paper) and dark (midnight-cyan) themes proving distinct OKLCH token resolution. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.13` | **Extreme content shapes** | Test 120-char token identifiers, null table cells, and dense citations in AdversarialEdgeCaseFixtures. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.14` | **Minimal screenshot masking** | Mask only genuinely nondeterministic regions while asserting their presence and dimensions. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.15` | **Capture readiness** | Await font readiness, image naturalWidth > 0, and settled animations before visual capture. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.16` | **Reviewed baseline changes** | Require explicit design/behavior rationale before updating visual baselines. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.17` | **Real engine coverage** | Pair Cloudflare Browser Run Chromium with targeted Firefox and WebKit checks where required. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.18` | **Actual mobile platforms** | Account for mobile viewport chrome, touch target sizing, and safe-area insets. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.19` | **Operating-system differences** | Account for platform font rendering and scrollbar differences without masking layout bugs. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.20` | **Pixel density and scaling** | Verify crisp SVG charts, responsive srcset images, and aspect-ratio boxes across DPR scaling. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.21` | **CSS feature fallbacks** | Verify sRGB fallback hex values accompany wide-gamut OKLCH tokens for legacy engines. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.22` | **Print layout** | Verify @media print hides authoring chrome and preserves article prose, charts, and bibliography. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.23` | **Export rendering** | Verify exported CSS, Tailwind v4, shadcn, and JSON token bundles match previewed themes. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.24` | **Image and icon assets** | Verify intrinsic width/height, non-zero naturalWidth, and accessible SVG icon labels. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.25` | **Resource-policy failures** | Verify strict CSP blocks unauthorized scripts while allowing all legitimate styles and assets. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.26` | **Layering conflicts** | Verify sticky headers, citation popovers, and dialogs maintain non-overlapping z-index stacking. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.27` | **Long-page scrolling** | Verify 2,500+ word reference articles maintain smooth TOC and citation fragment navigation. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.28` | **Interaction-state visibility** | Verify visible focus-visible outlines and hover/active states across all interactive controls. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.29` | **Embedded compatibility** | Verify Storybook iframe stories and embedded calculators size and theme cleanly. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
| `F05.30` | **User browser adaptations** | Verify compatibility with password managers, autofill, and reader/translation modes. | `visual_regression` | `conditional_release` | `verified` | `apps/ui/e2e/storybook-render.spec.ts & apps/web/e2e/theme-page.spec.ts` |
