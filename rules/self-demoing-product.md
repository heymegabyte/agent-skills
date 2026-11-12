---
last_reviewed: 2026-11-11
superseded_by: null
name: "self-demoing-product"
priority: 2
pack: "design"
triggers:
  - "onboarding"
  - "empty state"
  - "first run"
  - "demo"
paths:
  - "*"
---

# The Self-Demoing Product — Teach By Doing, Not By Telling

Every product ships a self-playing demo that drives the REAL product — not a video, not a
screenshot tour, not a docs page. First-run shows the thing working on live (sample or seeded) data so
a new user sees value before they've configured anything. The empty state is the demo's launchpad; the
product teaches itself by running itself.

Cross-links: `[[embarrassingly-easy-to-use]]` · `[[first-time-excellence]]` · `[[extra-mile]]` · `[[nebula-waiting-experience]]` · `[[ttfr-north-star]]` · `[[gorgeous-by-default]]`

## The rule

- **The demo runs the real product.** A scripted drive of the actual UI/flow against sample data — so
  there's zero gap between the demo and the thing, and the demo can't rot into a lie.
- **Value before configuration.** First-run renders a populated, working surface (seeded/sample data)
  the user can touch immediately — never a blank "connect your account to begin" wall.
- **Empty states are launchpads, not dead ends.** Every empty state offers the ONE action that creates
  the first real result, and ideally a "see it with sample data" path that plays the demo.
- **Dismissible + resumable.** The self-demo is skippable by anyone who knows what they want, and
  re-launchable later from a help/`⌘K` entry. It never blocks the real first action.
- **A tour step that can't be performed is cut.** Don't narrate a capability the product doesn't do;
  the demo only ever shows real, working behavior.

## Anti-patterns

- A first-run flow that shows configuration/setup before any value.
- A separate marketing VIDEO standing in for a product that can't demo itself.
- An empty state that says "no data yet" with no action and no sample-data path.
- A scripted tour that points at buttons without actually performing the flow (rots silently).
