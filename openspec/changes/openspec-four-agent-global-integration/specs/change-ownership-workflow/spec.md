## ADDED Requirements

### Requirement: OpenSpec is globally integrated for the four agents

The system SHALL make the OpenSpec workflow available and ownership-aware for Claude Code, Codex, Gemini CLI, and OpenCode, encode the one-owner philosophy in project bootstrap and schema guidance, and preserve project-specific configuration.

#### Scenario: New project bootstrap carries the invariant

- **WHEN** a new project is initialized for the four tools
- **THEN** its OpenSpec templates include the change-ownership invariant and `openspec validate` passes on a fresh fixture

#### Scenario: Global integration re-run is non-duplicating

- **WHEN** the global OpenSpec integration runs again
- **THEN** instruction blocks are updated in place without duplication
