---
last_reviewed: 2026-06-29
superseded_by: null
name: "blast-radius-minimization"
priority: 2
pack: "core"
triggers:
  - "blast radius"
  - "canary"
  - "gradual rollout"
  - "progressive rollout"
  - "tenant isolation"
  - "schema migration"
  - "backward compatible"
  - "rollback"
  - "how many users"
  - "if this broke prod"
paths:
  - "src/worker/**"
  - "workers/**"
  - "drizzle/**"
  - "migrations/**"
  - "wrangler.toml"
  - "wrangler.jsonc"
---

# Blast Radius Minimization

Every change is scoped to the minimum surface that can possibly fail. 1% of users for 5 minutes
is a normal Tuesday; every user for 30 minutes is an incident — the difference is containment, not code quality.

## The "5-minute thought experiment"

Before merging any non-trivial commit, answer: **"If this commit broke prod right now, how
many users notice in the first 5 minutes?"**

| Answer | Verdict | Required containment |
|---|---|---|
| 0 (feature behind flag, off) | Ship immediately | Flag default=off |
| 1% or less (canary) | Ship with monitoring | `rollout_percent: 1` |
| Specific tenant(s) only | Ship with override | DO-per-tenant isolation |
| Everyone who touches the changed route | Hold — add containment first | Flag it or canary it |
| Everyone, all routes | Hard block | Architecture problem |

No answer of "everyone" ships without prior explicit approval from this rule.

## Feature-flag isolation (first line of defense)

Every non-trivial feature ships at `enabled=0, rollout_percent=0, stage='experimental'` per
`[[feature-flags]]`. Blast radius at launch = 0 users.

Rollout sequence — never skip tiers, never jump 0% → 100%:

```
experimental (0%)
  → beta (1%) — watch error budget for 24h
  → beta (10%) — watch for 48h
  → stable (50%) — watch for 24h
  → stable (100%) — promote after 1 week without P1
```

## Canary deployments via Workers gradual rollout

- Until Workers native canary is GA, simulate with a feature-flag-driven A/B split at the route level.
- Promote via the `/admin/feature-flags` rollout slider: 1% → 10% → 100%.
- Error budget (`[[error-budget]]`) gates each promotion step.

See `reference/blast-radius-minimization.md` for the route-split implementation.

## Multi-tenant isolation: DO-per-tenant

- Every tenant gets its own Durable Object — one tenant's corrupt state cannot affect others.
- Route all tenant requests through `idFromName(tenantId)` to guarantee isolation.
- Recovery for a single broken tenant: `wrangler do reset --id <id>` with no impact to others.

See `reference/blast-radius-minimization.md` for the full DO class and routing handler.

## Schema migrations: backward-additive only

Three-deploy rule — never combine a schema change and the code that depends on it:

```
Deploy 1: ADD new column (nullable, or with DEFAULT) — no code reads it yet.
  ↓ verify live for 1 hour
Deploy 2: Ship code that reads/writes the new column.
  ↓ verify live
Deploy 3 (optional cleanup): DROP old column AFTER 30 days of zero reads.
```

- D1 enforces no ROLLBACK inside migrations — the additive approach IS the rollback strategy.
- Use `[[drizzle-orm-and-migrations]]` migration-agent for multi-step migration orchestration.

See `reference/blast-radius-minimization.md` for the correct and incorrect SQL patterns.

## Destructive-capability fixes: independent adversarial review before merge

<!-- grow-ok: +34 lines captures the fire-773 asymmetric-data-loss incident (projectsites.dev editor) as a durable rule + reference incident — a new failure class, not restated content. -->

A fix for a COMPLETENESS bug can introduce a DESTRUCTIVE regression — the highest-blast-radius
failure (silent data loss, not a crash). The classic trap: the **delete-set source ≠ the
preserve-set source.** When a "commit all changes" / "sync" / "reconcile" fix computes what to
DELETE from one view of the data and what to KEEP from a DIFFERENT view, any item present in the
delete-view but absent from the preserve-view is silently destroyed.

- **Any fix that ADDS a delete / overwrite / rename / force-reconcile against a CANONICAL store**
  (git `main`, the production DB, the source-of-truth bucket) gets an INDEPENDENT adversarial review
  BEFORE merge — a reviewer who did NOT write the fix, tasked to FIND the data-loss scenario (per
  the `[[diversity-merge-gate]]` skill + the loop's §5 adversarial phase). The author's own tests
  pass on the happy path; the destructive edge needs a skeptic.
- **The two guards every delete-emitting fix needs:** (1) a **representability check** — only emit a
  delete for an item the preserve-source could actually have carried (a text-only snapshot must NEVER
  delete a binary it can't represent — preserve it via the base/unchanged set); (2) a **completeness
  floor** — refuse an implausibly-large deletion (empty/partial input must never wipe the store) with
  a typed error, never a silent mass-delete.
- **Verify the guard LIVE, non-destructively** — prove the floor REFUSES a mass-delete on real data
  (returns the typed reason, writes nothing), not just unit-locked.

### Reference incident (projectsites.dev editor, fire-773, 2026-10-25)

A fix made "Commit & Save" commit DELETIONS (the prior code never emitted a `removed` entry — dead
code — so a file deleted in the working tree was silently never committed: a completeness bug). But
it read the FULL base tree (incl. binaries) as the delete candidates while the client posted a
TEXT-ONLY snapshot as the preserve set — so ONE "Save" click would have `sha:null`-deleted every
binary asset (logo/favicon/og/fonts) from git `main`. The INDEPENDENT adversarial reviewer (not the
author) caught it and BLOCKED the deploy; the fix-forward added `isTextRepresentablePath` (binaries
preserved via `base_tree`) + an `unsafe_delete_ratio` floor, both live-proven (`{committed:false,
reason:'unsafe_delete_ratio'}` refused a 100% mass-delete on prod). Completeness-fix → destructive
regression → caught by the gate → guarded. This is WHY the adversarial gate exists.

## Rollback-first deployment culture

- Every deploy must have a rollback answer BEFORE it ships.
- For Workers: `wrangler rollback` or `wrangler rollback <version-id>`.
- For D1: Time Travel to a pre-migration snapshot.
- Automate the pre-deploy rollback check in CI.

See `reference/blast-radius-minimization.md` for the `pre-deploy-check.sh` script.

## Anti-patterns

- Deploying without a flag when the change touches a critical route (donation, auth, checkout).
- Jumping rollout from 0% to 100% in one step — no observation window.
- Running `DROP COLUMN` in the same migration that adds its replacement.
- Sharing mutable state across tenants in a DO (one corrupted state = everyone's state).
- "We'll rollback by reverting the commit" — code revert ≠ schema revert; test `wrangler rollback` before you need it.
- Skipping the 5-minute thought experiment because the change "feels small."
- Merging a fix that ADDS a delete/overwrite to a canonical store on the author's own green tests, with NO independent adversarial review for the asymmetric-data-loss class (delete-set source ≠ preserve-set source).

## Cross-links

- `[[autonomous-engineering]]` — approval tiers already classify change blast radius; this rule makes isolation a concrete engineering pattern
- `[[feature-flags]]` — the primary isolation mechanism; every non-trivial feature behind a flag at 0% rollout
- `[[no-staging-doctrine]]` — prod-only means blast radius is real; containment is doubly critical
- `[[cf-agents-do-pattern]]` — DO-per-tenant is the canonical multi-tenant isolation pattern
- `[[error-budget]]` — burn rate gates canary promotion; if budget burns fast at 1%, hold at 1%
- `[[drizzle-orm-and-migrations]]` — migration-agent enforces the two-deploy additive pattern
