## ADDED Requirements

### Requirement: Shell validation checks the ownership verifier

The ownership verifier SHALL pass the hosted ShellCheck and shfmt checks.

#### Scenario: The verifier cannot enter the repository

- **WHEN** changing to the resolved repository root fails
- **THEN** the verifier exits unsuccessfully before running relative checks
