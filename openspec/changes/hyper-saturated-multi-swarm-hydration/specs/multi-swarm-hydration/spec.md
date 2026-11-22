# Spec Delta: Hyper-Saturated Multi-Swarm Hydration

## ADDED Requirements

### Requirement: Automatic UserPromptSubmit Hyper-Saturation & Product Gap Audit

The prompt hydration system SHALL intercept every submitted prompt, audit the repository for missing or incomplete foundational surfaces (including Settings, Extensible Plugin Catalog, `@theme.tools` 28-library bindings, Cloudflare Worker/domain config, 100% unit coverage, and Cloudflare Browser Run E2E suites), and fold them into the hydrated execution brief.

#### Scenario: Missing Settings and Plugin Catalog are auto-detected on hydration

- **GIVEN** a project checkout without a completed Settings surface or plugin catalog
- **WHEN** a user submits a feature request through `bin/prompt-hydrator.ts`
- **THEN** `productAudit.missingOrIncompleteSurfaces` includes `Settings & Preferences` and `Extensible Plugin Catalog` routed to `throughput-opencode-deepseek` worker swarms.

### Requirement: Right-Sized Collaborative SCRUM Deliberation Quorum

The system SHALL convene a right-sized collaborative SCRUM deliberation meeting (`bin/scrum-deliberation-quorum.ts`) comprising only the specialist agents required for the prompt's active domains across `claude`, `codex`, and `gemini`, emitting consensus decisions, a dissent register, and a parallel OpenSpec task DAG (`task-graph.json`) with >=70% `opencode` (DeepSeek) offload.

#### Scenario: Right-sized SCRUM quorum excludes unrelated specialists

- **GIVEN** a feature prompt submitted to `conveneScrumQuorum`
- **WHEN** the quorum is assembled from the 28-agent roster
- **THEN** between 4 and 7 relevant specialists are selected across `claude`, `codex`, and `gemini`, at least 21 unrelated agents are excluded, and the resulting DAG offloads >=70% of tasks to `opencode-deepseek`.
