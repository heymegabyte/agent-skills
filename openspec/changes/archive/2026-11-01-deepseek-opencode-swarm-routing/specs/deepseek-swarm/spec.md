# DeepSeek swarm routing

## ADDED Requirements

### Requirement: LiteLLM-first throughput rail

Eligible internal implementation, test, documentation, research breadth, migration, refactor, audit, and repetitive work MUST use OpenCode with `litellm/deepseek-*` models by default. Direct DeepSeek is a fallback, and paid OpenAI/Anthropic APIs MUST NOT be used for internal delegation.

#### Scenario: Routine work is routed

- **WHEN** a frontier harness identifies independent routine throughput work
- **THEN** it delegates the slice through OpenCode with a `litellm/deepseek-*` model

### Requirement: Cross-harness delegation

Gemini/Antigravity, Claude, and Codex MUST use the same canonical swarm launcher and provider policy. Each harness remains responsible for decomposition, disjoint ownership, synthesis, and verification.

#### Scenario: Any frontier harness delegates

- **WHEN** Gemini/Antigravity, Claude, or Codex creates an eligible task manifest
- **THEN** the same canonical swarm launcher executes it and returns a machine-readable report

### Requirement: Adaptive swarm capacity

The launcher MUST accept structured task manifests, execute independent tasks concurrently, cap concurrency at 200, reduce width to the number of tasks, expose a lower environment/CLI override, and produce a machine-readable completion report. A failed worker MUST be reported and MUST cause a non-zero process exit.

#### Scenario: Requested width exceeds capacity

- **WHEN** a manifest requests more than 200 workers or more workers than tasks
- **THEN** effective width is the lesser of 200 and task count

#### Scenario: A worker fails

- **WHEN** any worker exits unsuccessfully
- **THEN** its result is recorded and the parent swarm process exits non-zero

### Requirement: Safety boundary

Swarm tasks MUST be independently scoped. Shared-file writes, destructive operations, secrets, final integration, architecture, security, auth, and payment decisions remain serialized or frontier-reviewed.

#### Scenario: Work is not safely independent

- **WHEN** tasks share mutable files or require high-risk judgment
- **THEN** the frontier parent keeps them serialized or frontier-reviewed instead of swarm dispatching

### Requirement: Context hydration

Substantial agents MUST hydrate task-relevant context before execution from repository source, fully selected skills, Context7, scoped AI Search, and current primary evidence. One-million-token models target up to 900K useful tokens while reserving reasoning/output capacity. Catalog-description compression is not a task-context cap, and workers receive slice-specific context without unrelated padding.

#### Scenario: A substantial worker begins execution

- **WHEN** a worker has a one-million-token window and a non-trivial task
- **THEN** it retrieves the applicable repository, skill, Context7, and AI Search evidence up to the useful 900K target and records unavailable sources
