---
last_reviewed: 2026-10-06
superseded_by: null
name: "ui-first-mock-data"
priority: 2
pack: "frontend"
triggers:
  - "ui first"
  - "mock data"
  - "test data"
  - "fixtures"
  - "build the ui"
paths:
  - "**/pages/**"
  - "**/components/**"
  - "**/*.component.ts"
---

# UI-First, Mock-Data-First Development

> Brian directive 2026-10-06. Invest MORE up-front in fully developing the UI — every surface,
> every state — backed by realistic MOCK/TEST DATA, BEFORE (or in parallel with) wiring real
> backends. A surface should look + feel complete + demoable on the FIRST pass, even when its
> backend is thin or absent. Then wire the real data behind the already-finished UI.
> Extends [[feedback_ui_first_radically_enhance_admin_recycle_editors]].

## Why
- The UI is where product value + taste are judged (first-5s "it" factor, deeper "wow"). A
  fully-built UI on mock data is immediately demoable, reviewable, testable — backend wiring
  becomes a provider SWAP, not a blocker.
- Mock data forces every STATE to exist first-pass (empty / loading / error / populated / edge),
  so the surface ships COMPLETE, not a happy-path skeleton.
- Decouples frontend progress from backend readiness — the UI never waits on an endpoint.

## Do
- **Build the FULL UI first, richly, with realistic mock/test data** — not lorem, not one row:
  believable names/amounts/dates/statuses, enough rows to exercise pagination / scroll / density.
- **Every state from mock data**: empty (a first-action launchpad), loading (skeleton, no FOUC),
  error (actionable + retry), populated (dense + gorgeous), edge (long strings, many/zero items).
- **A typed fixture/mock layer behind a SEAM** (a service/provider) the real backend later
  replaces — mock and real satisfy the SAME typed contract (Zod / interface), so swapping is a
  one-line provider change, never a rewrite. Prefer a `MOCK`/fixture MODE toggle over scattered
  inline data.
- **Demo-complete before wire-complete**: a reviewer navigates the whole surface and sees it look
  finished, on mock data, before the endpoint exists.
- **Fixture the single-entity read, not just the list.** A list surface (`GET /:resource`) fixtured
  alone leaves detail/sub pages firing `GET /:resource/:id` → unmatched passthrough → real 404. Add
  the `:id` fixture (reuse the list's canonical row) the same pass — one registry line heals every
  sibling detail route (detail / children / settings / …) at once.
- **Close-smoke sweeps CONSOLE 4xx, not just toasts.** Detail reads often run with `{silent:true}`
  (no toast on error), so a toast-only demo sweep reads green while the console logs a 404. A proper
  mock-out close walks every surface headless and asserts ZERO `/api/**` 4xx + ZERO console errors +
  the DEMO badge present — a silent passthrough 404 is the find a toast gate misses.
- Pairs with [[first-time-excellence]] + [[gorgeous-by-default]] + the embarrassingly-easy mandate:
  mock data is how you reach "would Linear/Stripe ship this unchanged?" before the API lands.

## Don't
- Don't ship a half-built UI "pending the backend," and don't leave a state unbuilt because
  "there's no data yet" — mock the data.
- Don't let mock data reach prod as if real: gate it behind the fixture provider / mode flag; the
  REAL provider is the prod default. A mocked surface is a visible demo OR swapped to real before
  prod — NEVER fake-real (honesty mandate; cf [[eval-mock-mode-discipline]]).
- Don't scatter hardcoded data through components — centralize fixtures behind the seam.

## projectsites.dev application
- The admin SPA sections + the `/create`→`/waiting` flow + generated-site previews each get a
  typed fixture layer + all states, fully UI-built independent of their Worker endpoints, then the
  real data swaps in at the `ApiService` boundary. Swap points already exist: `ApiService`, the SWR
  injector caches (e.g. `AppsInstancesCache`). Campaign tracked in
  `apps/project-sites/_UI_MOCKOUT_PLAN.md`.
