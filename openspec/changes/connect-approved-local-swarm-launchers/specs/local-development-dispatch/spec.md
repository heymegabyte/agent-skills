## ADDED Requirements

### Requirement: Approved local development dispatch

Local dispatch SHALL run explicitly queued development tasks through the canonical kernel and approved provider launchers, bound to an immutable source revision and isolated owned paths.

#### Scenario: Approved rail canary completes

- **WHEN** an approved rail with budget and isolation evidence runs a development canary
- **THEN** it preserves the isolated diff, executed acceptance results and independent review linked to the resolved base revision

#### Scenario: A different rail is unavailable

- **WHEN** a provider has no approved launcher, required credentials or budget evidence
- **THEN** its dispatch remains unavailable while independently validated rails can continue

#### Scenario: Launch produces incomplete evidence

- **WHEN** task execution yields no real diff, no executed acceptance, or no independent review
- **THEN** the run remains unverified and cannot be used to increase its concurrency limit

#### Scenario: Frozen work graph changed before dispatch

- **WHEN** the task graph no longer matches the frozen contract
- **THEN** the scheduler rejects it before creating worktrees or launching providers

#### Scenario: Ready work exceeds the verified concurrency limit

- **WHEN** a ready wave contains more tasks than the configured limit permits
- **THEN** the scheduler admits only up to that limit per wave

#### Scenario: The developer has two OpenCode config files

- **WHEN** the approved broker wrapper launches OpenCode in an account with both supported config formats
- **THEN** the wrapper leaves the account's config files intact and delegates discovery to OpenCode

#### Scenario: An initial failure is followed by an accepted retry

- **WHEN** a task attempt fails and a later attempt successfully integrates the same task
- **THEN** the completion gate uses the terminal result and preserves the failed attempt in the execution history

#### Scenario: Provider setup throws during a ready wave

- **WHEN** a provider preflight or worktree creation fails unexpectedly
- **THEN** the scheduler preserves that task's failure receipt and continues independent ready tasks

#### Scenario: A run was already cancelled

- **WHEN** the scheduler receives an already-aborted signal
- **THEN** it records cancellation without invoking a provider

#### Scenario: A headless child reads standard input

- **WHEN** the adapter launches a child with all task arguments supplied explicitly
- **THEN** the child receives end-of-file on standard input without waiting for input from the caller

#### Scenario: A subscription launcher needs the current account context

- **WHEN** a subscription CLI uses its existing local sign-in profile
- **THEN** the adapter passes the current account's identity and configuration lookup context without inheriting credential variables

#### Scenario: A local development task awaits independent review

- **WHEN** a local host enables the pre-integration review gate
- **THEN** the scheduler requires an owned diff, executed acceptance, and approval bound to the same source digest before invoking integration

#### Scenario: The project checkout has concurrent work

- **WHEN** local dispatch creates a worktree at the frozen full Git commit identity
- **THEN** the worker starts in a clean detached checkout of that commit and the source checkout retains its concurrent edits
