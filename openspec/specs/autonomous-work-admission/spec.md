# autonomous-work-admission Specification

## Purpose

Defines honest capability fallback and recursion-safe admission for authorized autonomous work.

## Requirements

### Requirement: Admission degrades capability honestly
The system SHALL admit safe work under available agent slots and approved providers by combining or sequencing responsibilities instead of requiring unavailable diversity.

#### Scenario: One provider is available
- **WHEN** the request is authorized and verifiable but only one approved provider can run
- **THEN** the system performs labeled sequential role passes, records the limitation, and continues without fabricating independent model evidence

### Requirement: Maintenance admission suppresses recursion
Maintenance work SHALL include trigger identity and recursion depth so equivalent end-of-round, policy-sync, or documentation jobs are admitted at most once per evidence revision.

#### Scenario: Maintenance changes the watched repository
- **WHEN** its own write produces another matching event
- **THEN** the admission layer records the event as already covered and does not start another equivalent job
