## ADDED Requirements

### Requirement: Offline package handoffs identify both evidence digests

The canonical release reference SHALL identify the qualification receipt used to build a private bundle and the bundle manifest digest used to verify it.

#### Scenario: A qualified archive is already held by a consumer

- **WHEN** the candidate name and version match a vendored or hosted archive
- **THEN** the release workflow SHALL compare both archive digests before reusing the version
