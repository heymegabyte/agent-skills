## ADDED Requirements

### Requirement: Vendored package identity guidance

The release reference SHALL describe how a qualified strict npm archive verifier compares embedded identity with the lockfile and how to interpret a mismatch.

#### Scenario: The lockfile declares an npm alias

- **WHEN** release verification checks a vendored archive referenced through an npm alias
- **THEN** the operator uses the lockfile target package name and selected version as the package identity
