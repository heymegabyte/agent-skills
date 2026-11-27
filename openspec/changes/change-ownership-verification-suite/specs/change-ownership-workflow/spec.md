## ADDED Requirements

### Requirement: The ownership workflow is runtime-verified

The system SHALL provide a verification harness that exercises each §7 behavior with disposable fixtures and existing validators, distinguishes static validation from runtime verification, and proves installer/sync idempotency.

#### Scenario: Idempotency is proven

- **WHEN** the installer/sync runs twice under the harness
- **THEN** the harness confirms no duplicate instructions, skills, or hook handlers were created

#### Scenario: Runtime-only check is unavailable

- **WHEN** a check requires an agent runtime the harness cannot drive
- **THEN** the harness reports that specific limitation rather than claiming a false pass
