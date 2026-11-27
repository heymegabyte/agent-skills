## ADDED Requirements

### Requirement: Hosted validation accepts the ownership serializer's format

The JSON formatting check SHALL validate generated ownership records in the existing serializer's format.

#### Scenario: An ownership record is generated

- **WHEN** the ownership CLI claims or transfers a change and writes its record
- **THEN** the generated record passes the hosted JSON formatter without an additional rewrite
