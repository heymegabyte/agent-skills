# authoritative-work-ledger Specification

## Purpose

Defines durable ownership, checkpoint, and integration evidence for resumable agent work.

## Requirements

### Requirement: Repository integration has one leased writer

The ledger SHALL grant at most one renewable integration-writer lease per repository and SHALL preserve waiting work without conflicting mutation.

#### Scenario: Lease holder disappears

- **WHEN** the writer misses its bounded heartbeat and recovery conditions pass
- **THEN** the lease becomes recoverable with an attributable transition and preserved partial work

### Requirement: Run checkpoints identify exact resumption

The ledger SHALL persist the frozen contract, task and dispatch identities, ownership, completed evidence, blockers, and next ready action at every durable transition.

#### Scenario: Fresh coordinator resumes an interrupted run

- **WHEN** it loads a valid checkpoint
- **THEN** it reuses completed receipts, restores safe leases, and dispatches only unfinished ready tasks

### Requirement: Integrated commits close traced work

The ledger SHALL associate each completed requirement and task with the exact tested integrated commit and remote reconciliation result.

#### Scenario: Local commit is absent from remote main

- **WHEN** remote verification cannot find the recorded commit
- **THEN** delivery remains incomplete even when local tests passed
