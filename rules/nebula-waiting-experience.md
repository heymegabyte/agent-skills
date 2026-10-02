# Nebula Waiting Experience — Cinematic Loading Everywhere

Every waiting / loading / generating / deploying / AI-thinking / navigating / long-running
state is an opportunity for **maximum atmospheric beauty, minimum interface** — a small,
elegant, HBO-level cinematic WebGL moment, never a generic SaaS spinner. The wait is a window
into a living purple/cyan/hot-pink universe while the app quietly finishes. (Brian directive
2026-10-01 — "boost to the max, HBO-level, cinematic, haunting, vivid, catchy… everywhere.")

Cross-links: `[[gorgeous-by-default]]` · `[[ttfr-north-star]]` · `[[quality-metrics]]` ·
`[[embarrassingly-easy-to-use]]` · `[[logo-contrast]]` (brand palette).

## The standard (every loading surface)

- **The nebula IS the experience; the UI merely explains.** Foreground = ONE tiny spinner + ONE
  short rotating 2–5 word status (+ one hairline progress bar when real progress is known). No
  giant modal/card/logo/spinner, no multi-paragraph loading copy, no chrome.
- **Visual direction:** deep near-black space; volumetric purple/cyan/hot-pink nebula; glowing
  particles/stars/plasma wisps + bloom; organic heart-like energy knots that EMERGE from the
  sim (never literal emoji); alive, dreamy, futuristic, premium, slightly surreal. Cosmic
  romance + ambient sci-fi OS.
- **HBO-grade means:** ACES filmic tone-map, subtle film grain, chromatic edge-bleed, domain-
  warped multi-octave fbm, a breathing hot-pink "love-explosion" core, parallax twinkling stars,
  a completion burst that dissolves INTO the resulting interface.
- **Catchy dynamic messages** rotate on REAL operation state (Creating/Generating/Deploying/
  Connecting/Optimizing/… + whimsical "Building your universe…", "Igniting the nebula…") with
  crossfade/blur-morph transitions — never abrupt swaps. Prefer true app state over fake whimsy.

## Reach-for-it triggers (apply EVERYWHERE, not one screen)

Editor boot · site generation / build stream · deploy · AI thinking/streaming · route
navigation · data fetch > ~400ms · publish · long workflows. Extract ONE shared primitive
(`NebulaLoader` / `<NebulaWaiting progress message burst/>`) and adopt it on each — never
hand-roll a one-off spinner. Reference impl: projectsites `app/components/chat/NebulaLoader.tsx`
(zero-dep raw WebGL) + `EditorLoadingVisual.tsx` (tiny foreground) + `ps-nebula-*` SCSS.

## Non-negotiables

- **Instant + cheap:** lazy GL init, tiny initial JS, adaptive particle/octave count, dynamic
  resolution scaling, `requestAnimationFrame`, GPU transforms, no per-frame React/Angular change
  detection, PAUSE render on `document.hidden`. Smooth on ordinary mobile. WebGPU enhancement
  only where supported, never required. Graceful Canvas/CSS fallback when no WebGL.
- **`prefers-reduced-motion`:** preserve the gorgeous nebula as a rich STATIC frame — kill travel,
  camera motion, flashing, shader animation. Never communicate state by animation alone; keep the
  message AA-legible over the brightest nebula regions.
- **Subtle reactivity only:** pointer attraction, progress→luminosity, completion pulse. Nothing
  that makes waiting feel SLOWER or distracts.

## The iteration doctrine (every loading surface is boosted relentlessly)

Each revision asks, and the answer pushes further every time — without tethering: smaller
spinner? · shorter text? · remove another UI piece? · richer nebula without busier? · more
magical transition into the finished screen? · GPU effect replacing interface clutter? ·
unmistakably THIS product, not a generic loader? Target final AI-vision ≥9/10, render-inspected
in a real browser (CF Browser Run), never DOM-only.

## Anti-patterns

- A conventional/oversized spinner, skeleton wall, or multi-line "loading…" explanation.
- A giant modal/card/logo as the loading screen.
- A one-off per-screen loader instead of the shared nebula primitive.
- Animation-only state signalling; motion that ignores `prefers-reduced-motion`.
- Shipping a loader without a real-browser screenshot pass.
