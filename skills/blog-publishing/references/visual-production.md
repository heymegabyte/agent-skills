# Visual Production & Shared Component Catalog (`E01–E30`, `F01–F30`)

Implementation modules: `@theme-tools/blog/visuals` (`packages/blog/src/visuals.ts`) and `@theme-tools/blog/components` (`packages/blog/src/components.tsx`).
Storybook workshop: `apps/ui/stories/BlogComponents.stories.tsx`.

## 1. Visual Density & Placement Policy

- Plan approximately **12 substantive visual placements** per 2,000–3,000+ word article.
- Prefer **12 equally useful visuals** over 8 when budget, accessibility, and Core Web Vitals (`CLS <= 0.05`) are preserved.
- Typically combine **8–12 approved custom illustrations/diagrams** with deterministic `FiniteChart`, `ComparisonTable`, `CalculatorBlock`, and authentic UI captures.
- Never count a crop, decorative divider, or duplicate image as an additional visual (`validateVisualPipelineAndCharts` rejects duplicates via `perceptualHash` and `promptHash`).

## 2. All 30 Visual Applications (`VISUAL_APPLICATION_CATALOG`, `E01–E30`)

| Code | Name | Default Production Mode | Component / Block |
| --- | --- | --- | --- |
| `E01` | Hero Concept Illustration | `hybrid` | `FigureFrame` |
| `E02` | Section Anchor Graphic | `aiIllustration` | `FigureFrame` |
| `E03` | System Architecture Diagram | `diagrammaticSvg` | `FigureFrame` |
| `E04` | Authentic Product Screenshot | `authenticCapture` | `FigureFrame` |
| `E05` | Annotated UI Walkthrough | `authenticCapture` | `FigureFrame` |
| `E06` | Before / After Visual Comparison | `hybrid` | `FigureFrame` |
| `E07` | Multi-Step Process Flow | `diagrammaticSvg` | `SequenceSteps` |
| `E08` | Decision Tree Diagram | `diagrammaticSvg` | `FigureFrame` |
| `E09` | Taxonomy & Hierarchy Map | `diagrammaticSvg` | `FigureFrame` |
| `E10` | Timeline / Evolution Strip | `diagrammaticSvg` | `SequenceSteps` |
| `E11` | Anatomical Breakdown | `hybrid` | `FigureFrame` |
| `E12` | Conceptual Metaphor Panel | `aiIllustration` | `FigureFrame` |
| `E13` | Quantitative Bar / Column Chart | `dataVisualization` | `FiniteChart` |
| `E14` | Multi-Series Trend Line Chart | `dataVisualization` | `FiniteChart` |
| `E15` | Distribution / Range Plot | `dataVisualization` | `FiniteChart` |
| `E16` | Proportional Breakdown Chart | `dataVisualization` | `FiniteChart` |
| `E17` | Trade-Off Matrix | `dataVisualization` | `ComparisonTable` |
| `E18` | Benchmark Scorecard | `dataVisualization` | `ComparisonTable` |
| `E19` | Structured Feature Comparison Table | `dataVisualization` | `ComparisonTable` |
| `E20` | Interactive Formula / Calculator | `interactiveComponent` | `CalculatorBlock` |
| `E21` | Live Token / Theme Contrast Swatch | `interactiveComponent` | `FigureFrame` |
| `E22` | Code-to-Output Split View | `authenticCapture` | `FigureFrame` |
| `E23` | Terminal / CLI Execution Capture | `authenticCapture` | `FigureFrame` |
| `E24` | Failure Mode / Anti-Pattern Visual | `hybrid` | `FigureFrame` |
| `E25` | Security Boundary / Threat Model | `diagrammaticSvg` | `FigureFrame` |
| `E26` | Cost / Latency Scaling Curve | `dataVisualization` | `FiniteChart` |
| `E27` | Checklist / Audit Readiness Card | `interactiveComponent` | `EditorialCallout` |
| `E28` | Progressive Deep-Dive Drawer | `interactiveComponent` | `ProgressiveDisclosure` |
| `E29` | Key Takeaway Summary Card | `hybrid` | `EditorialCallout` |
| `E30` | Social / OpenGraph Share Card | `hybrid` | Metadata `ogImageUrl` |

## 3. Chart & Visual Integrity Rules

- **Non-Color Encoding (`E13`, `F04`)**: `FiniteChart` pairs every series with an SVG pattern (`solid`, `diagonal-hatch`, `dots`, `crosshatch`) and renders a collapsible `<table>` companion for screen readers.
- **Explicit Dimensions**: Every `VisualAsset` specifies integer `width` and `height` (`aspect-ratio`) so `CLS` stays zero.
- **No Fake Screenshots (`E04`)**: Never use an AI image model to fabricate a product screenshot or dense small-text table; use `authenticCapture` or deterministic SVG/HTML components.
