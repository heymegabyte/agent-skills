# Selective Test Orchestration

## ADDED Requirements

### Requirement: Conservative selection

Selection MUST combine validated affected graph, changed tests/config/fixtures, explicit requirement and component mappings, supported runner dependencies, trustworthy history, critical sentinels, and risk obligations. Missing baselines, stale mappings, dynamic uncertainty, and graph errors MUST widen selection.

#### Scenario: Missing baseline

- **WHEN** no trustworthy baseline is available
- **THEN** selection widens to the relevant fallback suite and mandatory sentinels

### Requirement: Five-minute contract

The normal required CI path MUST target 300 seconds from acceptance through verdict, report queue/setup/execution separately, and block when required work is incomplete at deadline. Optimization MUST NOT drop validation required by the change.

#### Scenario: Deadline expires

- **WHEN** required work remains unfinished at 300 seconds
- **THEN** the verdict is incomplete and blocking

### Requirement: Browser Run

Remote Chromium MUST use authorized Cloudflare Browser Run sessions with bounded concurrency and launch rate, exact immutable preview identity, isolated browser and backend state, secret-safe origin scoping, cancellation cleanup, capability reporting, and fresh execution.

#### Scenario: Preview identity mismatch

- **WHEN** the remote preview artifact differs from the selected build
- **THEN** browser assertions do not run and the evidence blocks

### Requirement: One verdict

One gate MUST reconcile every selected task, test, shard, cache receipt, deeper prerequisite, and human obligation. Unexpected zero discovery or missing output MUST block.

#### Scenario: Complete selection

- **WHEN** every selected item has a fresh pass or provenance-valid deterministic cache receipt
- **THEN** the gate may pass
