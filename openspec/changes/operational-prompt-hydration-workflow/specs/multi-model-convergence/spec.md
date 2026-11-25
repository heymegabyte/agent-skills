# Spec Delta

## MODIFIED Requirements

### Requirement: Frontier models converge independently

Architecture, security, and ambiguous product decisions SHALL use a Codex-led conference with product/completeness and architecture/verification responsibilities, obtaining independent Gemini, Codex, and Claude judgments when available and using honest combined or sequential fallback otherwise.

#### Scenario: Reviewers disagree materially

- **WHEN** independent recommendations conflict on a high-impact decision
- **THEN** an AI critic compares evidence and the designated architect or CEO records the resolved rationale

#### Scenario: Fewer than three families are available

- **WHEN** approved model or slot capacity cannot provide the preferred independent families
- **THEN** the lead combines or sequences the missing responsibilities, records actual provenance, and continues if risk and verification remain acceptable

### Requirement: Parallel work is collision-safe

Mass parallel execution SHALL use declared ownership, dependency graphs, isolated worktrees or non-overlapping edit roots, budgets, deadlines, idempotent dispatch, and one leased integration authority per repository.

#### Scenario: Two units claim the same file surface

- **WHEN** ownership detection finds overlapping writes
- **THEN** the scheduler serializes or reassigns the units before mutation

#### Scenario: Duplicate delivery repeats a ready task

- **WHEN** a retry or resumed coordinator presents the same dispatch identity
- **THEN** the scheduler returns the existing execution state instead of launching duplicate work
