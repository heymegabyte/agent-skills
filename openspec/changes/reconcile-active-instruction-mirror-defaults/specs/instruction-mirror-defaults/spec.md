## ADDED Requirements

### Requirement: Preserve the active stack and counts across mirror generation

The mirror generator SHALL preserve the current canonical stack summary and verified documentation counts when run against an up-to-date checkout.

#### Scenario: Run the generator on aligned instructions

- **WHEN** an operator checks or regenerates the mirrors
- **THEN** the command reports no drift in the published instruction files
