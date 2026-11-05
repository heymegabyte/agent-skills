# Blog Publishing Traceability

## ADDED Requirements

### Requirement: Exact catalog

The ledger MUST contain exactly twelve categories and thirty unique complete IDs per category, totaling 360 exact authorized directives from A01 through L30.

#### Scenario: Placeholder or missing directive

- **WHEN** catalog validation finds missing, generic, duplicate, or malformed directive content
- **THEN** validation fails

### Requirement: Source provenance

The skill MUST preserve the prompt's S01–S54 source map and teach agents to verify current installed versions and primary documentation before implementation.

#### Scenario: Commercial upstream

- **WHEN** an optional upstream requires a commercial license
- **THEN** the skill records the authorization requirement and does not install or claim it automatically

### Requirement: Independent evaluations

Development and held-out cases MUST challenge duplicate topics, fabricated metrics, unsupported citations, wrong units, misleading visuals, lost edits, permission escalation, duplicate publishing, and false completion reports.

#### Scenario: False publication claim

- **WHEN** an evaluated agent lacks a public receipt or immutable publish result
- **THEN** the independent oracle rejects a claim that an article was published
