## ADDED Requirements

### Requirement: Runtime compatibility of semantic renames

Semantic rename verification SHALL check affected runtime keys and existing export names alongside compilation.

#### Scenario: A ts-morph rename compiles

- **WHEN** a rewrite must preserve the existing public contract
- **THEN** the engineer reviews preservation edits and verifies runtime keys, exports and stored strings separately
