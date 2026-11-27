## ADDED Requirements

### Requirement: Verified context provider version

Installed-version dependency documentation SHALL be identified by an exact served version or a matching upstream tag.

#### Scenario: A provider serves unverified version material

- **WHEN** a successful Context7 response cannot establish the installed version
- **THEN** hydration uses official versioned documentation and records the fallback
