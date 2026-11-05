---
last_reviewed: 2026-06-29
superseded_by: null
name: "shadcn-design-system"
priority: 2
pack: "frontend"
triggers:
  - "shadcn"
  - "radix"
  - "react ui"
  - "react component"
  - "stack:react-vite"
  - "design system react"
paths:
  - "stack:react-vite"
---

# shadcn/ui Design System

shadcn/ui (Radix primitives) is THE design-system foundation for every React surface — the React-path counterpart to `[[angular]]` (Angular). OSS, owns-the-code (components copied in via CLI, not a black-box dependency), Tailwind v4-composed. No MUI / Chakra / Ant / Mantine / other kits. Per `[[frontend-stack]]` + `[[stack-selector]]`.
Cross-links: `[[frontend-stack]]` `[[cinematic-ui-patterns]]` `[[gorgeous-by-default]]` `[[10-experience-and-design-system]]` `[[text-contrast]]`

## Standing rule

- Every React surface (marketing, dashboard, generated site) composes UI from shadcn/ui — NEVER hand-rolled buttons/inputs/dialogs or a competing kit.
- **Owns-the-code**: `npx shadcn@latest add <component>` copies source into `src/components/ui/` — edit it, version it, never `npm i` a black-box component lib.
- Radix primitives under the hood → a11y is complete by default (focus trap, ARIA, roving tabindex, keyboard) — never re-solve it.
- Tailwind v4 + CSS-var tokens compose every component; the `cn()` helper (`clsx` + `tailwind-merge`) merges classes without specificity wars.

## Setup

- `npx shadcn@latest init` → writes `components.json` (style, base color, CSS-var theming ON, `cn` alias).
- Components land in `src/components/ui/<name>.tsx`; import from `@/components/ui/*`.
- Theming: dark-first CSS vars in `globals.css` per `[[10-experience-and-design-system]]` — `--background`/`--foreground`/`--primary`/`--ring` etc.; `data-theme` + `prefers-color-scheme` toggle with `localStorage` persistence.
- Icons: `lucide-react` (the shadcn default) — never a second icon kit.

## Which components, which surface

- **Marketing/site**: `button`, `card`, `accordion` (FAQ), `dialog`/`sheet`, `tabs`, `carousel`, `badge`, `tooltip`, `navigation-menu`, `sonner` (toast).
- **Dashboard/admin**: add `table` (+ TanStack Table), `data-table`, `form` (react-hook-form + Zod resolver), `select`, `command` (⌘K palette), `dropdown-menu`, `popover`, `calendar`, `chart` (Recharts wrapper).
- **Forms**: shadcn `form` + `react-hook-form` + `@hookform/resolvers/zod` — Zod schema is the single source of truth per `[[zod-everywhere]]`.

## Composes with

- **Motion**: the React cinematic components per `[[cinematic-ui-patterns]]` (`<RollingCounter>`, `<Reveal>`) wrap shadcn primitives — every stat/section still animates.
- **Router**: TanStack Router; `command` palette wired to route actions (the mandated ⌘K per `[[always]]`).
- **Contrast**: shadcn tokens must clear `[[text-contrast]]` AA — verify the generated palette, don't trust defaults.

## Native web-platform primitives (compose before adding libs)

Per `[[web-platform-capabilities]]` (the 30-capability super-boost catalog), prefer native primitives over JS libraries when they fit:

- **#2 Popover API + #15 CSS Anchor Positioning** → `tooltip` / `dropdown-menu` / `popover` / `hover-card` can drop Floating-UI; **#16 Invoker Commands** (`command`/`commandfor`) trigger them with zero handler JS.
- **#3 native `<dialog>`** backs `dialog`/`sheet` (auto-inert + `::backdrop`); **#6 style queries** drive variant theming from `--` tokens; **#18 `field-sizing`** auto-grows `textarea`.
- Radix/shadcn still own focus-trap + ARIA where the native primitive doesn't — layer them, and keep every enhancement `@supports`-guarded.

## Generative UI — the AI assembles from THIS catalog (data, NOT code)

When an AI-native surface's next output is unpredictable (an agent result, an adaptive dashboard, a chat answer that needs a widget), let the model ASSEMBLE the interface from the shadcn catalog — the third AI-native-UX pillar alongside the agentic-UX pattern set (`[[first-time-excellence]]` §C) + MCP Apps (`[[ai-abundance-maximalism]]`). (Added 2026-10-25, estate-upgrade audit — `[[estate-upgrade-audit]]`.)

- **The one safety law — data, not code.** The model returns a STRUCTURED JSON spec (component + props + position), NEVER executable HTML/CSS/JS. Validate every spec against a CLOSED shadcn component allowlist + a **Zod schema** before rendering — schema-constrained generation defeats hallucinated components, with zero XSS / CSS-bleed; keep authorization OUTSIDE the model and treat its output as untrusted input (`[[zod-everywhere]]` + `[[ai-agent-security]]`).
- **The catalog IS the guardrail.** shadcn's owns-the-code `src/components/ui/*` is already perfect: register the renderable subset + their Zod prop schemas; the AI arranges/combines them freely but CANNOT escape the set (creativity within approved bounds — "safe like data, expressive like code").
- **Climb the ladder; start low:** **Static** (AI picks a prebuilt component, props streamed in — the default; fidelity guaranteed by construction) → **Declarative** (AI emits a JSON component-tree the renderer walks from the catalog — the pragmatic WINNER for adaptive dashboards / secondary flows / the long tail) → **Fully-generated** raw HTML (build-time OR a sandboxed iframe ONLY — that sandboxed case is what MCP Apps covers). More model freedom = more guardrail investment.
- **Stack (React+Vite):** prefer catalog-selection/declarative. AI SDK UI (`useChat`) for production — **AI SDK RSC `streamUI` is EXPERIMENTAL (Vercel's own guidance: prototypes only)**; Tambo / assistant-ui (Radix headless, Vite, no RSC) for a typed component registry; A2UI / AG-UI (declarative JSONL/SSE, adopted by Google/LangChain/MS) when streaming agent→UI across clients. **Stream = filter to COMPLETE elements** (mid-stream nodes lack type/props).
- **Roll out on ONE high-context surface first** (a dashboard, an agent output, onboarding), prove it, then expand — never make the whole product adaptive in one push.

## Anti-patterns (build-fail)

- Installing `@shadcn/ui` as a runtime dep (it is NOT a package — it is a CLI that copies code).
- **Generative UI that emits raw HTML/CSS/JS to render at RUNTIME** (XSS + layout fragility) — return a Zod-validated JSON spec against the closed shadcn catalog instead; raw generation is build-time or sandboxed-iframe (MCP App) only.
- Mixing a second component kit (MUI/Chakra) into the same app.
- Editing nothing — shipping raw shadcn defaults with no brand-token theming (same "raw default widget" trap as the booking embed).
- Hand-rolling a Dialog/Combobox/Select instead of the Radix-backed shadcn one (re-introduces a11y bugs Radix already solved).

## See

- `[[angular]]` — the Angular-stack counterpart (when Angular is chosen)
- `[[frontend-stack]]` — React 19 + Vite + TanStack + Tailwind v4 defaults
- `[[website-build-manifest]]` — where this slots into the one-prompt site gates
