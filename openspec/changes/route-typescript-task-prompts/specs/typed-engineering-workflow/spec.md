## ADDED Requirements

### Requirement: Select typed engineering prompts explicitly

The router SHALL select the quality skill by phrase for focused typed
engineering tasks and expose its TypeScript workflow reference.

#### Scenario: Route typed lint and navigation tasks

- **WHEN** a prompt requests a typed lint migration or semantic rename
- **THEN** the router selects the quality skill with a phrase-match reason
