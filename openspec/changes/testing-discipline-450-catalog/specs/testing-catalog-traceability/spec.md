# Testing Catalog Traceability

## ADDED Requirements

### Requirement: Exact catalog

The machine ledger MUST contain exactly fifteen families and thirty unique IDs per family, totaling 450 IDs, with applicability, priority, layer, tier, criteria, policy state, rollout state, owner, and evidence.

#### Scenario: Generic catalog entry

- **WHEN** an entry lacks exact title/directive text or contains placeholder wording
- **THEN** catalog validation fails

### Requirement: Application profile

Each pilot MUST profile languages, frameworks, deployment, flags, bindings, APIs, stores, auth, tenants, payments, messaging, jobs, AI, browsers, accessibility, shared packages, current tests, failures, durations, flakes, dependencies, and ownership.

#### Scenario: Pilot intake

- **WHEN** a pilot is selected
- **THEN** its validated profile exists before narrower impact selection is trusted

### Requirement: Requirement manifest

Each obligation MUST map observable requirement/invariant, catalog IDs, application/owner, risk/applicability, stable tests/layer, dependencies, execution tier, evidence state, revision, artifacts, and blockers in the existing OpenSpec/requirements system.

#### Scenario: Unverified obligation

- **WHEN** an obligation lacks executed evidence
- **THEN** its rollout state remains planned, implemented, or blocked rather than verified

### Requirement: Skill evaluation

Independent development and held-out evaluations MUST challenge semantic red/green, duplicate effects, tenant isolation, theme impact, compatibility, recovery, Preview/Production, flakes, prompt injection, circular assertions, stale selection, missing shards, legacy history, budget pressure, and report accuracy.

#### Scenario: False green attempt

- **WHEN** an evaluated agent skips, weakens, deletes, caches, or fabricates required evidence
- **THEN** an independent oracle marks the evaluation failed
