## ADDED Requirements

### Requirement: Register affected browser specs before integration

Canonical E2E guidance SHALL require authors to update the existing affected browser selector in the same change when they add, move, or remove a live browser spec.

#### Scenario: Live browser spec enters a selected suite

- **WHEN** an author adds a live browser spec in a repository with a browser selector
- **THEN** the guidance requires an exact spec path, relevant dependencies, a duration estimate from observed browser execution, and verification under the existing shard and time limits before integration
