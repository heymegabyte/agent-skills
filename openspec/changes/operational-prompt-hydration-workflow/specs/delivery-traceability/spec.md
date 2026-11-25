# Spec Delta

## Purpose

Keeps every hydrated requirement connected to owned execution, code, verification, integration, release, and consumer evidence while preserving exact resumable state.

## ADDED Requirements

### Requirement: Trace records span the delivery chain

The system SHALL link each requirement to tasks, owners, affected paths, code changes, verification receipts, integrated commit SHA, remote state, and applicable package or production evidence.

#### Scenario: Checkbox is complete without integrated evidence

- **WHEN** a task is marked done but no tested integrated commit contains its code and verification
- **THEN** the requirement remains incomplete and the missing trace edge is reported

### Requirement: Dispatch is idempotent and collision safe

Task execution SHALL use stable dispatch identities, non-overlapping ownership, one integration writer lease per repository, and duplicate suppression across retries and resumes.

#### Scenario: Competing writers claim a repository

- **WHEN** two runs attempt integration concurrently
- **THEN** exactly one obtains the lease and the other preserves work in a recoverable waiting state

### Requirement: Maintenance cannot recursively launch itself

Documentation, learning, installation, and end-of-round maintenance hooks SHALL carry recursion guards and SHALL NOT create duplicate runs for the same triggering evidence.

#### Scenario: Policy sync triggers repository hooks

- **WHEN** generated instruction updates activate normal maintenance detection
- **THEN** the original run records the projection without recursively starting another equivalent run

### Requirement: Interruption resumes the next exact action

Durable run state SHALL record frozen contracts, completed tasks, leases, partial outputs, blockers, and the next ready action so a fresh coordinator resumes without repeating completed work.

#### Scenario: Process stops during a dependency wave

- **WHEN** execution resumes after interruption
- **THEN** completed receipts remain valid, duplicate dispatch is suppressed, and only ready unfinished work is launched

### Requirement: Shared capabilities reach intended consumers

Reusable changes SHALL trace `theme.tools` validation, source commit, package release, published-version verification, intended consumer and lockfile updates, consumer verification, and consumer commits.

#### Scenario: Shared component source is committed but unpublished

- **WHEN** no verified package version and consumer update exists
- **THEN** the shared-capability requirement remains blocked with the exact pending release edge

### Requirement: Git integration proves remote delivery

Task-related changes SHALL be reconciled onto current main, validated as the exact tree committed, pushed normally, and verified in remote main and applicable CI without force-push or blanket staging.

#### Scenario: Remote main advances before push

- **WHEN** integration discovers new remote commits
- **THEN** it reconciles them, reruns invalidated checks, and pushes only the updated tested commit
