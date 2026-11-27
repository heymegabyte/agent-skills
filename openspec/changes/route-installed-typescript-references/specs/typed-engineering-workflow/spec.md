## ADDED Requirements

### Requirement: Route the installed TypeScript references command

The canonical router SHALL explicitly select the Quality and Verification skill for the installed TypeScript references command. Supported skill metadata SHALL advertise the TypeScript workflow while retaining its progressive reference.

#### Scenario: A request names the references command

- **WHEN** a request names the installed references command
- **THEN** the router SHALL report a direct trigger match for the Quality and Verification skill
- **AND** similarly named commands SHALL remain outside that explicit route
