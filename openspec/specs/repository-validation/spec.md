# repository-validation Specification

## Purpose

Defines the local validation contract for canonical agent-skills sources, generated artifacts, and launcher changes.

## Requirements

### Requirement: Local validation for canonical dispatch changes

The agent-skills local validation suite SHALL pass on the canonical sources and their generated companions before canonical launcher changes are committed.

#### Scenario: Published base has drifted from its previous validation receipt

- **WHEN** a pristine checkout fails an existing local validation gate
- **THEN** the relevant source and generated companions are reconciled and the existing gate is executed without bypass
