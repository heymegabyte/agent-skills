# End-of-Prompt Delivery Specification

## ADDED Requirements

### Requirement: Concurrent finishing lanes preserve a serialized integrity boundary

The system SHALL permit documentation, tests, release preparation, and bounded shared-value extraction to run concurrently, then SHALL revalidate the exact reconciled final tree before committing or promoting it.

#### Scenario: Successful delivery closure

- **WHEN** all finishing lanes reconcile and all required gates pass
- **THEN** the exact tested tree is committed and normally pushed to `main`
- **AND** its immutable artifact is promoted through the approved production rail
- **AND** production smoke and critical E2E journeys verify that artifact when the repository owns a deployable production surface.

#### Scenario: Repository has no deployable production surface

- **WHEN** repository policy defines no production deployment target
- **THEN** delivery ends at the repository-prescribed publication and consumer-verification boundary
- **AND** the system does not invent or falsely claim a production deployment.

#### Scenario: A required gate is unavailable

- **WHEN** authority, credentials, spending permission, review, recovery, validation, provenance, or production health is missing
- **THEN** the affected mutation fails closed
- **AND** the verified checkpoint and exact blocker are recorded without fabricating completion.

### Requirement: Closure guidance is propagated idempotently

The canonical generator SHALL add one closure directive to each canonical skill and agent prompt, and repeated generation SHALL produce no further mutation.

#### Scenario: Repeated repository-only generation

- **WHEN** the enforcement generator runs twice against the same reconciled repository tree
- **THEN** every canonical skill and agent prompt contains exactly one closure directive
- **AND** the second run reports no changed files.
