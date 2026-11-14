---
last_reviewed: 2026-11-11
superseded_by: null
name: "one-canonical-seam"
priority: 2
pack: "core"
triggers:
  - "architecture"
  - "identity"
  - "single source"
paths:
  - "*"
---

# One Canonical Seam Per Concern

Each cross-cutting concern funnels through exactly ONE primitive: identity → one key, theme → one
token set, data → one store, time → one clock, config → one loader, auth → one session. A parallel
second path for the same concern is forbidden — it is the seam where drift, divergence, and
"works-here-breaks-there" bugs are born. One seam, enforced, beats two conveniences.

Cross-links: `[[state-is-the-enemy]]` · `[[subtraction-first]]` · `[[interconnectedness]]` · `[[verify-against-source-of-truth]]` · `[[drift-detection]]` · `[[inverted-abstraction-pyramid]]`

## The rule

- **Name the single primitive for each concern up front** and route every surface through it. The
  moment a concern has two implementations, they WILL diverge — pick one, migrate, delete the other.
- **No "quick second path."** A shortcut that bypasses the canonical seam (a direct store write, a
  hardcoded token, a per-component theme value) is drift to fix on sight, not a pragmatic exception.
- **The seam is the integration point for everything downstream.** Unifying identity/data/theme early
  is what later makes orgs, multi-device, white-label, and migrations cheap instead of impossible.
- **Derive, never duplicate, a value owned by the seam.** A count/time/token/url the seam owns is read
  from it, never transcribed into a second source (see `[[verify-against-source-of-truth]]`).

## Reference pattern (desktop.tools, 2026-11-10)

A stable per-account `userKey` is minted ONCE per Better Auth user in the `account_keys` table — one
key ⇄ one UserHub Durable Object across CLI, dashboard, and every device. That single identity seam
is what makes device-flow login, org accounts, and multi-machine fan-out tractable; two key systems
would have made them a migration nightmare.

## Anti-patterns

- Two stores / two token sets / two clocks / two auth paths for the same concern "because it was faster."
- Transcribing a seam-owned value into a second place (a hardcoded count beside the manifest that owns it).
- Shipping a thinner reimplementation while the richer canonical one is left orphaned (`[[interconnectedness]]`).
- Per-component theme values instead of the one token set; per-call identity instead of the one key.
