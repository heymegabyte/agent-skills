# Fleet secret estate

## ADDED Requirements

### Requirement: Evidence-gated migration

Every encrypted source SHALL retain a store-qualified identity and SHALL be deleted only after exact provider validation plus destination retrieval, or provider-confirmed invalidity with no consumer or destination.

#### Scenario: Administrative credential

- **WHEN** a valid credential has account-wide administrative authority and no runtime consumer
- **THEN** it is preserved in a human-only Infisical project with no machine identity
- **AND** it is excluded from host, MCP, CI, and application profiles

#### Scenario: Provider-derived cache

- **WHEN** an encrypted metadata cache differs from authoritative provider state and has no consumer
- **THEN** it is retired rather than migrated as a secret

#### Scenario: WARP enrollment

- **WHEN** a host uses a service token to enroll WARP
- **THEN** that token remains distinct from MCP and application Access credentials
- **AND** healthy WARP connectivity does not prove MCP authorization
