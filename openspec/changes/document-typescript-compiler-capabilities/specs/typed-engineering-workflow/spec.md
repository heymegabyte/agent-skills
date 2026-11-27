## ADDED Requirements

### Requirement: Attribute compiler capability evidence

Typed engineering guidance SHALL distinguish the compiler used for build
diagnostics from the compiler API selected for semantic navigation.

#### Scenario: Verify a mixed compiler consumer

- **WHEN** a consumer uses native compilation and a separate language service
- **THEN** the workflow records each backend and verifies its claimed capability
