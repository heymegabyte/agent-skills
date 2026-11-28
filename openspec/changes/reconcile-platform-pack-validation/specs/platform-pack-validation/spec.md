## ADDED Requirements

### Requirement: Validate the reviewed platform pack membership

The validator SHALL recognize the reviewed parallel-delivery rule as a platform pack member and require its declared provenance.

#### Scenario: The platform pack includes the reviewed rule

- **WHEN** the published manifest and pack are checked
- **THEN** the approved rule is validated for membership, review date and distribution
- **AND** unregistered additions are still rejected
