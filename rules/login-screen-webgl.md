# Login Screen — Simple Form + Gorgeous Minimal Abstract WebGL

**Origin:** Brian, 2026-10-28. Every login / auth screen must be **simple**, with a **beautiful, gorgeous, minimal abstract-art WebGL** effect — exemplar: the Stripe dashboard login (`https://dashboard.stripe.com/login`): a clean centered form over subtle animated abstract gradient art.

This is the FLOOR for every auth surface; it composes with `[[gorgeous-by-default]]`, `[[cinematic-hud-standard]]`, `[[nebula-waiting-experience]]`, and `[[public-front-door]]` (which owns `/login` placement).

## The standard (every sign-in / sign-up / magic-link / SSO landing / reset screen)

- **Simple form is the focal point.** ONE clean, centered card (email/password or SSO buttons), generous whitespace, one obvious primary action. No marketing clutter, no competing CTAs, no multi-column noise.
- **Minimal ABSTRACT WebGL art as the ambience — never literal or busy.** Flowing gradient mesh / soft ribbons / plasma bloom in the brand palette (black `#060610` + cyan `#00E5FF` + accents), slow and dreamy. It sits *behind/beside* the form and never fights it. Think Stripe-login restraint, not a screensaver.
- **The art enhances, the form stays legible.** Keep ≥4.5:1 contrast on fields/labels via a subtle card surface or scrim over the brightest regions (`[[text-contrast]]`). The WebGL must never reduce form usability.
- **Cinematic but cheap.** three.js/shader WebGL2 → reduced → static-frame fallback chain; lazy + tiny init so it never blocks first paint; `requestAnimationFrame`, GPU transforms, pause on `document.hidden`; smooth on ordinary mobile. LCP ≤2.0s / CLS ≤0.05 / INP ≤200ms still hold.
- **`prefers-reduced-motion` → a rich STATIC frame** (kill travel/flashing, keep the gorgeous gradient). Never signal state by motion alone.
- **Reuse the estate's WebGL primitive** (the `NebulaLoader`-style ambient shader) rather than hand-rolling a one-off; brand-lock the palette.

## Anti-patterns (fix on sight)

- A plain flat form on a blank/solid page (no art) — under-delivers the first impression.
- Busy, literal, or stock imagery; art so loud it hurts legibility; animation that makes sign-in feel slow.
- A giant logo/illustration instead of abstract motion; WebGL with no reduced-motion or no-WebGL fallback.
- Auth wall as the apex homepage (that's `[[public-front-door]]`) — this rule governs how the `/login` screen itself LOOKS, not where it sits.

Cross-links: `[[gorgeous-by-default]]` · `[[cinematic-hud-standard]]` · `[[nebula-waiting-experience]]` · `[[public-front-door]]` · `[[text-contrast]]` · `[[first-time-excellence]]` · `[[logo-contrast]]`.
