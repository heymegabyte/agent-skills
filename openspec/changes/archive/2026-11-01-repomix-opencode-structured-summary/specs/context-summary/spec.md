# Context summary delta

## ADDED Requirements

### Requirement: Repomix child analysis

Parents MUST be able to delegate repository-wide reading to OpenCode/DeepSeek using a guarded Repomix pack without ingesting that pack themselves.

#### Scenario: Parent requests deep repository analysis

- **WHEN** a parent invokes the context-summary compiler for an owned repository
- **THEN** Repomix supplies the child context and only the validated summary returns to the parent

### Requirement: Versioned structured return

The compiler MUST return a JSON object conforming to the published v1 schema and reject malformed or incompatible-major output.

#### Scenario: Child returns incompatible output

- **WHEN** output is missing required fields or declares a non-v1 schema version
- **THEN** the compiler fails without writing the summary artifact

### Requirement: Task-scoped oversized repository handling

Repositories larger than the context budget MUST be narrowed with explicit Repomix include globs covering the task dependency closure, never silently truncated.

#### Scenario: Full repository exceeds 900K tokens

- **WHEN** the guarded pack rejects an oversized repository
- **THEN** the caller supplies implementation, caller, test, schema, configuration, and governing-document globs for the task

### Requirement: Backwards-compatible evolution

Version 1 consumers MUST tolerate additive fields while required fields retain their meaning. Breaking changes require a new major schema.

#### Scenario: Producer adds optional evidence

- **WHEN** a newer v1 producer adds an optional field
- **THEN** an older v1 consumer can continue reading the required contract
