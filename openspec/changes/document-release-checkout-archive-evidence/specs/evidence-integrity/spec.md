## ADDED Requirements

### Requirement: Release tool evidence scope

The on-demand release reference SHALL describe executable checkout and archive admission checks and identify the evidence needed for release and production claims.

#### Scenario: A qualified tool is installed in a consumer

- **WHEN** a release operator loads the release reference
- **THEN** the reference links each gate to the candidate inputs it checks and requires an independent deployed revision and behavior probe.
