## ADDED Requirements

### Requirement: Generated harness artifacts reflect canonical sources

Checked-in Codex mirrors and harness policy metadata SHALL reflect the current canonical sources produced by their generators.

#### Scenario: A canonical skill or policy changes

- **WHEN** the Codex skill and harness manifest generators run from the canonical checkout
- **THEN** the generated skill mirrors match their canonical skills and manifest metadata identifies the current policy version and content digest
