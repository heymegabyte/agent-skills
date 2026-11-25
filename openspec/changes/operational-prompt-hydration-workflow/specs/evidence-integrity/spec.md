# Spec Delta

## ADDED Requirements

### Requirement: Evidence strength matches delivery claims

The system SHALL distinguish prose presence, generated output, simulated execution, runtime loading, local verification, package publication, consumer adoption, remote integration, and production behavior.

#### Scenario: Fake adapter integration test passes

- **WHEN** only a controlled simulator produced orchestration receipts
- **THEN** the system may verify mechanics but MUST NOT claim live provider, installed policy, package, consumer, remote, or production delivery

### Requirement: Policy receipts bind runtime instructions

Coordinator and worker policy receipts SHALL include the canonical policy identifier, version, digest, source revision, instruction surface, and launch provenance.

#### Scenario: Worker reports a different digest

- **WHEN** coordinator and worker policy receipts disagree
- **THEN** delegation validation fails and identifies the stale surface

### Requirement: Shared release evidence is dependency closed

Reusable capability evidence SHALL link source validation and commit to release workflow, published artifact identity, intended consumer resolution, lockfile state, consumer verification, and integrated consumer commit.

#### Scenario: Registry contains the version but consumer resolves an older one

- **WHEN** intended consumer dependency evidence does not match the released version
- **THEN** adoption remains incomplete and the stale dependency edge is reported
