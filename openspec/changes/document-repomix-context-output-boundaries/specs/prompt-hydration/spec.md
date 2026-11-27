## ADDED Requirements

### Requirement: Scoped local Repomix context

Repomix context handoffs SHALL use a local, scoped JSON pack from a trusted configuration with security scanning enabled and explicit verification of file keys.

#### Scenario: A handoff must omit unrelated filenames

- **WHEN** the selected repository context has filename privacy requirements
- **THEN** the pack disables tree and summary metadata and the producer checks the exact file keys before handing it off
