# OpenSpec governance delta

## ADDED Requirements

### Requirement: explicit architect-role assignment

Only an agent explicitly assigned the architect role for a specific change may author or modify that change's `proposal.md`, `design.md`, `tasks.md`, or capability specifications. Model, provider, or harness identity alone MUST NOT grant this authority.

#### Scenario: assigned frontier architect

- **Given** an orchestrator explicitly assigned an approved frontier agent the architect role
- **When** proposal and design contain matching architect identity and `Architect Role: assigned` metadata
- **Then** the authorship gate accepts the change

#### Scenario: model label without assignment

- **Given** proposal and design name an approved frontier model
- **When** either artifact lacks the explicit role-assignment metadata
- **Then** the authorship gate rejects the change

#### Scenario: OpenCode claims assignment

- **Given** OpenCode or DeepSeek is named as architect
- **When** role metadata claims assignment
- **Then** the authorship gate rejects the change because OpenCode is never eligible for architecture work

#### Scenario: conflicting architect identity between artifacts

- **Given** proposal and design each carry `Architect Role: assigned`
- **When** the named architect identity in the proposal differs from the design
- **Then** the authorship gate rejects the change because a single change has exactly one attesting architect
