# Cinematic HUD Standard — the "it factor" floor for every app

**Origin:** Brian, 2026-10-06. "Adobe/HBO dual-partnership level… the most stunning example of how to quickly fill a full-screen HUD and immerse the user… justify the hundreds of billions invested in AI." A thin/bad prompt must STILL yield this. First render = "it" factor (first 5s); the deeper you go = "wow" factor. Beat the incumbent the app replaces — ship something a discerning user screenshots and shares.

## The bar (benchmarked to Linear · Vercel · Stripe, 2026)

- **Dark-FIRST, true dark-grey base — never pure black.** A very dark cool grey (Linear's signature); OKLCH-tuned. Elevation comes from subtle LIGHTNESS shifts, not borders or heavy shadows. One saturated accent only (project brand — gitl.ink = cyan `#00E5FF`).
- **Precision type.** Display = Inter Display / Geist (massive kinetic hero weights, `clamp()` fluid). Technical labels = JetBrains Mono, used as document-style markers (`FIG 1.2`, `SYS·01`) — Linear's signature detail. `text-wrap: balance/pretty`.
- **Cinematic depth = ambient light.** WebGL/shader gradient background (Stripe/Vercel gold standard; three.js WebGPU→WebGL2→reduced→static fallback chain) + mouse-tracking ambient spotlight + soft multi-layer glows that breathe. Grain/noise overlay to kill banding. NOT decorative orbs — light must carry meaning/depth. "Not another purple orb."
- **Full-screen HUD immersion.** The first viewport fills with a living, information-dense experience — a real in-product demo as the hero (Linear), not a static marketing splash. Fixed sidebar (≈256px) + command bar (⌘K) + progressive disclosure (summary up top, detail one click deep). Dense rows (≈36px, minimal chrome) for scale.
- **Motion as state.** View Transitions between states, scroll-driven reveals, `@starting-style`, spring micro-interactions, cursor-triggered affordances. Reduced-motion stays beautiful, not "everything off."
- **Structure.** Bento/asymmetric grids. Skeleton screens shaped like the content — never spinners. Heavy whitespace discipline.
- **Gates (unchanged, enforced):** Lighthouse a11y ≥95 / perf ≥90, axe 0 (WCAG 2.2 AA), LCP ≤2.0s, CLS ≤0.05, INP ≤200ms. Cinematic AND accessible — no trade.

## Reflexes

- Every editable value → [[inline-editing]] (seamless, dialog-free). Reversible actions use undo-toasts, never confirmation modals.
- "Clone X but better" → clone the information architecture, then out-design it on every axis (density, motion, clarity, speed). The incumbent being ugly/cluttered is the opening.
- Ship it test: does the first screen wow with zero interaction? Is every state built (empty/loading/error/edge)? Would Linear/Stripe/Vercel ship this unchanged? Any "no" → not done. Sits beneath [[first-time-excellence]].
