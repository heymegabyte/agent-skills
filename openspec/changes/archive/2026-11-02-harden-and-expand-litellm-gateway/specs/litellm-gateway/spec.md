# litellm-gateway Specification

## Purpose

Define the secure, observable, cost-aware, and drift-controlled operating contract for the estate's internal LiteLLM gateway and its OpenCode DeepSeek/local-Ollama execution rail.

## ADDED Requirements

### Requirement: Immutable verified runtime

The gateway MUST run an explicitly approved LiteLLM release by immutable image digest, MUST retain a known-good rollback digest, and MUST reject known-compromised releases including 1.107.0.

#### Scenario: A gateway release is deployed

- **WHEN** an operator or automation changes the LiteLLM image
- **THEN** it verifies release identity and provenance, records the immutable digest and rollback digest, and refuses a denylisted version

### Requirement: Durable secret custody

Gateway secrets MUST resolve through the estate secret rail, MUST NOT appear in committed desired state or logs, and the database encryption salt MUST be established once and never rotated without a tested data migration.

#### Scenario: A missing salt is remediated

- **WHEN** runtime inventory finds no `LITELLM_SALT_KEY`
- **THEN** automation first proves that existing encrypted database credentials will remain readable, stores a generated value through the secret rail, and injects only its resolved value into the service

### Requirement: Split administrative and inference access

The browser administrative UI MUST require Cloudflare Access identity, while OpenAI-compatible inference routes MUST remain reachable behind scoped LiteLLM virtual-key authentication. Caller keys MUST NOT authorize administrative key-management operations.

#### Scenario: An anonymous browser opens the UI

- **WHEN** it requests `/ui/*` without an Access session
- **THEN** Cloudflare challenges or denies it before LiteLLM serves the login page

#### Scenario: OpenCode calls inference

- **WHEN** it calls `/v1/chat/completions` with an authorized scoped virtual key
- **THEN** Access does not intercept the API call and LiteLLM enforces the key's model, budget, rate, and concurrency policy

### Requirement: Local-first capability routing

The gateway MUST advertise only installed and smoke-tested local Ollama models over private connectivity, SHOULD expose stable capability-oriented local aliases, and MUST provide an explicit DeepSeek fallback for each local throughput alias. Callers MUST discover live routes rather than assume model tags.

#### Scenario: Local capacity is effective

- **WHEN** a work unit can meet its acceptance criteria with an advertised local route
- **THEN** OpenCode uses that route before consuming DeepSeek or premium capacity

#### Scenario: Local capacity fails or is unsuitable

- **WHEN** the local route is unavailable, saturated, or cannot meet acceptance criteria
- **THEN** LiteLLM falls back to an approved DeepSeek route and records the fallback in telemetry

### Requirement: Layered load and cost controls

Every non-admin caller key MUST have finite model scope, budget, RPM, TPM, and parallel-request limits. Deployments MUST have concurrency appropriate to their capacity, and spend logs MUST use validated model pricing rather than silently reporting zero cost.

#### Scenario: A swarm exceeds safe concurrency

- **WHEN** concurrent requests reach a configured caller or deployment limit
- **THEN** the gateway applies backpressure or routes to a healthy fallback without exhausting the local host or provider pool

### Requirement: Private observability and actionable alerts

Prometheus MUST scrape authenticated LiteLLM metrics without exposing the credential in configuration source. Alerting MUST cover readiness, unhealthy/cooling deployments, error ratio, saturation, fallback growth, and stale spend data.

#### Scenario: Gateway health degrades

- **WHEN** a health, failure, cooldown, saturation, fallback, or spend-freshness threshold is breached
- **THEN** Grafana evaluates a named alert with enough labels and runbook context to identify the affected route

### Requirement: Desired-state reconciliation

A sanitized, schema-validated desired state MUST define image policy, route topology, limits, access, and observability. Reconciliation MUST compare it with live state without printing secrets and MUST fail on material drift.

#### Scenario: Runtime drifts from policy

- **WHEN** a mutable image, missing route, weakened key limit, absent Access policy, or failed metrics target is observed
- **THEN** reconciliation exits non-zero and reports the non-secret field that differs

### Requirement: Cross-project awareness with explicit exceptions

Claude, Gemini, OpenAI/Codex, OpenCode, and generic agent entrypoints MUST route applicable internal work through the canonical LiteLLM/OpenCode policy. A repository MAY declare a narrower product-specific exception, and global propagation MUST preserve that explicit decision.

#### Scenario: A project starts agent work

- **WHEN** its harness loads the canonical agent skills
- **THEN** it learns the local-Ollama-then-DeepSeek gateway policy, swarm assessment requirement, route-discovery command, and premium escalation boundary

#### Scenario: A product forbids LiteLLM

- **WHEN** repository guidance explicitly selects another inference gateway for that product surface
- **THEN** agents preserve the product exception while still using LiteLLM/OpenCode for eligible internal development work
