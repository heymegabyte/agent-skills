## ADDED Requirements

### Requirement: Checkpoint hooks reinforce change ownership

The system SHALL provide bounded, idempotent, recursion-safe hooks that reinforce the change-ownership invariant at session start, before dispatch, at phase boundaries, before compaction/handoff, and before completion, using each agent's supported event names.

#### Scenario: Pre-compaction preserves ownership state

- **WHEN** a session approaches compaction or an explicit handoff
- **THEN** the hook persists the change owner, progress, decisions, and newly-discovered recommendations so they survive the context boundary

#### Scenario: Hook installation is idempotent

- **WHEN** the hook installer runs twice
- **THEN** no duplicate hook handler is registered
