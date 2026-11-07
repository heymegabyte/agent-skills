# openspec-governance Specification

## Purpose

Establishes OpenSpec as the universal governance layer for classifying work, planning durable changes, and preserving auditable lifecycle evidence across agent harnesses.

## Requirements

### Requirement: Universal OpenSpec classification
Every task SHALL be classified against the resolved OpenSpec root before implementation begins.

#### Scenario: Durable repository change requested
- **WHEN** a task would add, edit, generate, move, or delete durable repository state
- **THEN** the agent records the work in an OpenSpec change before making the implementation edit

#### Scenario: Read-only task requested
- **WHEN** a task only answers, explains, reviews, diagnoses, or inspects without changing durable state
- **THEN** the agent records a no-change classification in its work receipt and does not create an unnecessary change

### Requirement: Broad durable-change coverage
OpenSpec planning SHALL cover code, tests, documentation, prompts, skills, configuration, migrations, generated harness files, and other durable repository artifacts.

#### Scenario: Apparently mechanical edit
- **WHEN** an edit is described as trivial, mechanical, documentation-only, formatting, or isolated configuration
- **THEN** the agent still creates or updates the applicable OpenSpec change before editing

### Requirement: Existing contract reconciliation
Before proposing a change, the agent MUST reconcile the request with existing specifications and in-flight changes at the resolved OpenSpec root.

#### Scenario: Requirement already exists
- **WHEN** an existing specification already covers the requested behavior
- **THEN** the agent updates or applies the matching capability rather than creating a near-duplicate capability

#### Scenario: Request conflicts with durable truth
- **WHEN** the request conflicts with an existing specification or pending change
- **THEN** the conflict is surfaced and resolved in OpenSpec artifacts before implementation

### Requirement: Lifecycle separation and evidence
Agents MUST preserve the configured OpenSpec lifecycle boundaries and MUST NOT treat planning artifacts as implementation, verification, deployment, or archive evidence.

#### Scenario: Proposal workflow completes
- **WHEN** proposal, specification, design, and task artifacts are ready
- **THEN** the agent continues into apply when the original request authorized the full outcome, without manufacturing a turn boundary or asking routine permission to proceed

#### Scenario: Change is implemented
- **WHEN** implementation work completes
- **THEN** verification, spec synchronization, and archival occur through their configured lifecycle steps with truthful evidence

### Requirement: Cross-harness consistency
Canonical instructions and generated variants SHALL communicate equivalent OpenSpec requirements to Claude, Codex, Gemini, OpenCode, and agentskills-compatible consumers.

#### Scenario: Policy distribution is validated
- **WHEN** the universal policy is changed or generated
- **THEN** validation confirms that supported harness entrypoints do not retain contradictory material-only or trivial-change bypass language

### Requirement: Emergency restoration capture
An emergency restoration MAY begin before complete planning only when delay would worsen an active incident, and it MUST be captured retrospectively in OpenSpec during the same work session.

#### Scenario: Active incident requires immediate restoration
- **WHEN** a production incident requires a reversible restoration before planning can safely finish
- **THEN** the agent limits work to restoration, records the exception, and completes the OpenSpec artifacts before ending the session

### Requirement: Unavailable OpenSpec handling
Agents MUST fail visibly when a durable change requires OpenSpec but the configured root or workflow is unavailable.

#### Scenario: Required root cannot be resolved
- **WHEN** a durable mutation is requested and the OpenSpec root cannot be resolved or initialized within existing authority
- **THEN** the agent reports the exact blocker and does not silently bypass governance

### Requirement: Autonomous completion through the lifecycle
An authorized outcome SHALL drive continuous execution through all applicable OpenSpec phases and safe adjacent work until completion or a genuine gate.

#### Scenario: Original request authorizes implementation
- **WHEN** the user requests a build, fix, integration, migration, or completed outcome
- **THEN** the agent may create planning artifacts and continue through apply, verify, sync, and archive in the same turn without requesting phase-by-phase permission

#### Scenario: Details are inferable and reversible
- **WHEN** an implementation detail is not explicitly specified but can be reasonably inferred from repository evidence, product goals, or established preferences and is reversible
- **THEN** the agent records the assumption and proceeds autonomously

#### Scenario: Adjacent work serves the outcome
- **WHEN** the agent discovers safe, reversible, verifiable work that materially improves the business, product, website, or application outcome
- **THEN** the agent incorporates it into the active OpenSpec change or a linked change and completes it without waiting for a separate request

#### Scenario: Genuine gate encountered
- **WHEN** work requires an approval-required action, new external authority or spend, an irreversible business choice, or a material ambiguity with divergent outcomes
- **THEN** the agent completes every decision-independent slice and pauses only the gated remainder with exact evidence

### Requirement: Conditional design artifact governance
OpenSpec SHALL record Figma approval only when an applicable design policy requires Figma, and SHALL otherwise record proportionate design evidence without inventing a Figma dependency.

#### Scenario: Figma gate applies
- **WHEN** the user, repository, active change, or governing policy requires Figma for the affected scope
- **THEN** proposal, design, acceptance, and verification evidence reference the approved Figma artifact and revision

#### Scenario: Figma gate does not apply
- **WHEN** no applicable authority requires Figma
- **THEN** OpenSpec records the selected non-Figma design and verification evidence and permits apply to proceed
