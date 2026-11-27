## ADDED Requirements

### Requirement: Atomic claim prevents duplicate change ownership

The system SHALL record a change owner as a specific agent instance in a version-compatible sidecar and enforce an atomic claim via the existing dispatcher so two sessions cannot simultaneously own the same change; absent an atomic lock, assignment SHALL be serialized.

#### Scenario: Concurrent double-claim is rejected

- **WHEN** two agent instances attempt to claim the same change concurrently
- **THEN** exactly one succeeds and the other is refused or queued

#### Scenario: Owner becomes unavailable

- **WHEN** an owner becomes unavailable mid-change
- **THEN** the entire remaining change is transferred to a replacement and the prior ownership is ended before the replacement proceeds
