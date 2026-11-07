# Spec Delta

## ADDED Requirements

### Requirement: Conditional design artifact governance
OpenSpec SHALL record Figma approval only when an applicable design policy requires Figma, and SHALL otherwise record proportionate design evidence without inventing a Figma dependency.

#### Scenario: Figma gate applies
- **WHEN** the user, repository, active change, or governing policy requires Figma for the affected scope
- **THEN** proposal, design, acceptance, and verification evidence reference the approved Figma artifact and revision

#### Scenario: Figma gate does not apply
- **WHEN** no applicable authority requires Figma
- **THEN** OpenSpec records the selected non-Figma design and verification evidence and permits apply to proceed

