## ADDED Requirements

### Requirement: Change-ownership invariant reaches every agent surface

The system SHALL embed the plan-decompose-early + one-owner-per-change invariant in the always-loaded canonical instruction files (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`) and distribute them to each agent's installed location via the existing sync mapping, with the detailed procedure held in a reusable rule.

#### Scenario: Fresh agent session loads the invariant

- **WHEN** any of Claude Code, Codex, OpenCode, or Gemini CLI starts a fresh session
- **THEN** its installed instruction file contains the change-ownership invariant and points to `rules/openspec-change-ownership.md`

#### Scenario: Canonical edit re-distributes without clobbering

- **WHEN** the canonical repo-root instruction file is edited and the sync copy runs again
- **THEN** each installed copy is overwritten to match the canonical source with no duplicate blocks and no loss of unrelated instructions

### Requirement: One owner executes a change end-to-end

An active OpenSpec change SHALL have exactly one owning agent instance that performs every subtask of that change; parallelism is expressed across separate changes, not within one.

#### Scenario: Multi-outcome request is decomposed before implementation

- **WHEN** a request contains multiple independently-verifiable outcomes
- **THEN** it is mapped into separate coherent OpenSpec changes before substantial implementation, each sized for a single owner

#### Scenario: Review finds an issue

- **WHEN** an independent reviewer reports a finding on an owned change
- **THEN** the owning agent performs the fix rather than reassigning a subtask of that change to another implementation agent
