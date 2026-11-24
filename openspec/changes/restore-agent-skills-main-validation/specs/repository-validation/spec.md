# Repository Validation Specification

## ADDED Requirements

### Requirement: Main validation is internally consistent

The repository SHALL pass its unmodified validation suite with pack ownership, generated artifacts, routing metadata, documentation counts, and cross-links derived from canonical repository truth.

#### Scenario: Full validation

- **WHEN** `npm run lint` executes on the reconciled tree
- **THEN** every validator passes without suppression, threshold inflation, or bypass.

### Requirement: Always-load routing remains within budget

Only genuinely universal policy SHALL be priority-one or match-all eligible; domain guidance SHALL load from triggers, packs, or concrete project fingerprints.

#### Scenario: Domain-specific shared-platform repository

- **WHEN** dependencies or canonical project markers identify shared platform capabilities
- **THEN** the router emits the applicable concern fingerprints
- **AND** loads the scoped domain rules without making them universal to unrelated prompts.
