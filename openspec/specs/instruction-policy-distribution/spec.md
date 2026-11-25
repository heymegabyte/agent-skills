# instruction-policy-distribution Specification

## Purpose

Distributes one versioned operating policy through supported instruction and launch surfaces and proves that coordinators and workers actually loaded the same policy.

## Requirements

### Requirement: One canonical compact policy owns shared semantics

The system SHALL maintain one concise canonical policy with a stable identifier, version, and digest while routing detailed procedure to focused skills and references.

#### Scenario: Shared policy changes

- **WHEN** maintainers revise common operating semantics
- **THEN** they edit the canonical policy and regenerate managed consumers rather than manually reconciling copies

### Requirement: Supported instruction surfaces are generated safely

Repository, global, plugin, harness, coordinator, and worker instruction files SHALL receive managed policy blocks without overwriting unrelated user-controlled instructions.

#### Scenario: Publish workflow regenerates instructions

- **WHEN** a release or fleet sync projects the policy
- **THEN** generated outputs retain the canonical block and unrelated instructions byte-for-byte outside managed boundaries

### Requirement: Installation uses an explicit verified source

Fleet synchronization SHALL identify the source checkout and revision explicitly and SHALL fail when an ambiguous or divergent installed symlink would propagate stale policy.

#### Scenario: Installed plugin differs from selected source

- **WHEN** the active plugin resolves to another dirty or divergent checkout
- **THEN** installation stops with source, revision, and drift evidence instead of copying from the ambiguous tree

### Requirement: Runtime loading is proven by receipts

Every supported coordinator and worker path SHALL report the same policy identifier and digest plus **Prompt Hydration** as its first engineering stage through an approved launch or controlled fixture.

#### Scenario: Fresh coordinator launches a worker

- **WHEN** a newly started coordinator delegates a bounded task
- **THEN** both processes return matching policy receipts and the worker demonstrates relevant skill invocation

#### Scenario: Harness exposes no prompt hook

- **WHEN** a supported harness cannot intercept prompt submission
- **THEN** its approved wrapper or explicit entry command performs hydration and emits an honest receipt without claiming a native hook

### Requirement: Drift and destructive generation fail CI

CI and the bounded final loop SHALL detect stale managed blocks, missing installed targets, publish-time policy loss, and coordinator-worker digest mismatches.

#### Scenario: A generated file is edited by hand

- **WHEN** its managed policy block no longer matches the canonical digest
- **THEN** validation fails with the canonical source and regeneration command
