## ADDED Requirements

### Requirement: Focused package recovery routes to release evidence guidance

The agent skill router SHALL recognize focused registry outage and offline package recovery requests and load the existing recovery workflow.

#### Scenario: The user asks to rebuild dependencies during an outage

- **WHEN** the request identifies a registry outage or offline package recovery
- **THEN** routing selects the deployment skill and its package release reference
