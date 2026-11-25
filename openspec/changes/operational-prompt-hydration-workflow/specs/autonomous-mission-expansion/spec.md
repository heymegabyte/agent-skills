# Spec Delta

## MODIFIED Requirements

### Requirement: Scope expands moderately with accumulated evidence

After satisfying the requested outcome, agents SHALL rank and implement adjacent safe improvements when evidence shows clear value, bounded effort, compatibility, authority, and objective verification, then refresh evidence and repeat until convergence.

#### Scenario: Implementation exposes a reusable missing control

- **WHEN** adding the control is reversible, directly beneficial, and testable within the active change
- **THEN** the agent adds it or records it as governed follow-on work without requesting routine permission

#### Scenario: Two refreshed rounds yield no qualifying work

- **WHEN** consecutive improvement reviews find no new candidate meeting confidence, value, novelty, reversibility, authority, and verification thresholds
- **THEN** the agent records convergence and preserves the last verified state

### Requirement: Expansion is outcome-limited

Agents SHALL stop expanding when two refreshed rounds find no qualifying work, marginal value is weak, validation is unavailable, budgets or deadlines are threatened, or work would displace a higher-priority committed outcome.

#### Scenario: Additional improvement has speculative value

- **WHEN** evidence cannot support measurable benefit or a safe verification path
- **THEN** the agent leaves the speculative change unimplemented and preserves the completed verified outcome
