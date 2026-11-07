# Spec Delta

## Purpose

Makes reusable improvements flow automatically into their canonical shared repositories during every prompt rather than waiting for a separate user request.

## ADDED Requirements

### Requirement: Every-turn parallel decision
Agents SHALL ask during every prompt whether the work reveals a reusable system, theme, or web-component improvement and SHALL execute applicable upstream integration in parallel with the primary task.

#### Scenario: Reusable improvement exists
- **WHEN** current evidence reveals a safe, relevant improvement to a canonical shared repository
- **THEN** the agent opens or updates OpenSpec, implements it, updates documentation, and verifies it in the same turn

#### Scenario: No reusable improvement exists
- **WHEN** no evidence-backed reusable change is applicable
- **THEN** the agent records no upstream mutation and continues the primary task without inventing churn

### Requirement: Canonical ownership routing
Agents SHALL route reusable system configuration to Install Doctor and reusable themes, design tokens, theme tooling, and web components to theme.tools or ui.theme.tools.

#### Scenario: Mixed project change
- **WHEN** a product task changes both host configuration and a reusable visual component
- **THEN** each reusable part is reconciled into its canonical repository while product-specific composition remains local

### Requirement: Governed integration
Every upstream mutation SHALL use that repository's OpenSpec workflow and update applicable documentation and regression tests.

#### Scenario: Compatible active change
- **WHEN** a compatible OpenSpec change already exists
- **THEN** the agent updates it instead of creating a duplicate capability
