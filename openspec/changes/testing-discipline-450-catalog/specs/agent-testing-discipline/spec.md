# Agent Testing Discipline

## ADDED Requirements

### Requirement: Genuine TDD

Agents MUST state observable behavior and consequential failure, establish baseline, choose the cheapest convincing layer, observe a semantic RED, implement the smallest coherent change, establish GREEN, refactor under green, inspect for weakened checks, and report immutable evidence. Refactors and legacy characterization MUST report their honest non-red history.

#### Scenario: New behavior

- **WHEN** an agent implements new observable behavior
- **THEN** evidence includes a requirement-derived semantic failure before the implementation and a fresh pass after it

### Requirement: Progressive catalog

The core skill MUST remain 100–200 lines and route to fifteen lazy family guides containing exactly F01.01 through F15.30. Guidance MUST distinguish policy implementation from application rollout and require explicit applicability rationale.

#### Scenario: Catalog validation

- **WHEN** the catalog validator runs
- **THEN** it reports exactly 15 families, 30 recommendations per family, and 450 unique complete IDs

### Requirement: Shared UI

Application UI MUST use canonical theme.tools assets/themes and ui.theme.tools web components. Missing reusable capabilities MUST be added canonically. Storybook MUST include executable component, page, and full-site stories with representative states and consumer contracts.

#### Scenario: Shared theme impact

- **WHEN** a shared token or component changes
- **THEN** selection includes component, page/full-site story, visual, and authorized consumer evidence

### Requirement: Truthful evidence

Required skipped, missing, cancelled, timed-out, undiscovered, infrastructure-blocked, or artifact-lost checks MUST NOT pass. Fresh and cached evidence MUST be distinguished and tied to revision, environment, shard, attempt, toolchain, and artifact identity.

#### Scenario: Missing shard

- **WHEN** a selected shard has no valid result
- **THEN** the authoritative verdict blocks deployment
