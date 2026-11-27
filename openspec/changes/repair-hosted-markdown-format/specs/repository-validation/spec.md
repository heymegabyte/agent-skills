## ADDED Requirements

### Requirement: Hosted Markdown formatting preserves canonical instructions

The hosted Markdown validator SHALL accept the repository's tracked Markdown using its configured rules. Formatting repairs SHALL preserve canonical policy wording.

#### Scenario: Repair formatting violations in tracked instructions

- **WHEN** existing Markdown is repaired to satisfy hosted formatting checks
- **THEN** the hosted lint command passes and affected generated mirrors match the canonical source
