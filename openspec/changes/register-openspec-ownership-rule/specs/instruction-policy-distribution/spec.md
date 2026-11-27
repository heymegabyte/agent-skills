## ADDED Requirements

### Requirement: Route the OpenSpec ownership rule from its declared pack

The OpenSpec ownership rule SHALL be registered in the core pack named in its canonical metadata.

#### Scenario: Validate the pack inventory

- **WHEN** the pack cross-link validator runs
- **THEN** the ownership rule is reachable from core and does not appear as an orphan
