## ADDED Requirements

### Requirement: Distinguish operation success from aggregate writes

Database guidance SHALL use an operation-specific receipt when D1 mutation metadata may include dependent writes.

#### Scenario: A trigger writes additional rows

- **WHEN** a conditional operation updates its target and a trigger modifies related rows
- **THEN** the test verifies the successful receipt and both writes
- **AND** a stale or unauthorized attempt reports failure and commits no dependent writes
