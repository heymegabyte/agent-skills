# Spec Delta

## MODIFIED Requirements

### Requirement: LiteLLM-first throughput rail

Every internal work unit that OpenCode can complete effectively MUST use OpenCode through the configured LiteLLM gateway by default, selecting an available DeepSeek or local Ollama route. Premium AI model credits and direct provider APIs MUST NOT be used for that unit unless evidence shows the gateway-backed routes are unsuitable or unavailable.

#### Scenario: OpenCode can perform the work effectively

- **WHEN** an internal work unit can meet its acceptance and verification criteria through OpenCode with a gateway-backed DeepSeek or local Ollama model
- **THEN** the premium harness delegates that unit to OpenCode instead of consuming premium model credits for its execution

#### Scenario: Routine work is routed

- **WHEN** a premium harness identifies routine work that OpenCode can complete effectively
- **THEN** it delegates the unit through OpenCode with a LiteLLM-backed DeepSeek or local Ollama model

#### Scenario: Gateway routes are unsuitable

- **WHEN** evidence shows that no configured DeepSeek or local Ollama route can meet the unit's quality, context, tool, latency, safety, or reliability requirements
- **THEN** the parent records the reason and may retain the unit on the least-cost capable premium service

### Requirement: Cross-harness delegation

Gemini, Claude, OpenAI/Codex, and every other premium AI model service used for internal work MUST apply the same capability-first offload policy and canonical swarm launcher. Each harness remains responsible for decomposition, disjoint ownership, synthesis, and verification.

#### Scenario: Any premium harness delegates

- **WHEN** a premium harness identifies one or more work units OpenCode can complete effectively
- **THEN** it delegates those units through the canonical OpenCode launcher and receives a machine-readable report

#### Scenario: Any frontier harness delegates

- **WHEN** Gemini/Antigravity, Claude, OpenAI/Codex, or another premium frontier harness creates an eligible task manifest
- **THEN** the same canonical swarm launcher executes it and returns a machine-readable report

### Requirement: Adaptive swarm capacity

Every OpenCode delegation MUST assess whether it contains multiple genuinely independent units. When safe fan-out reduces wall-clock time, the launcher MUST execute those units concurrently, cap concurrency at 200, reduce width to task count, honor a lower override, and return a machine-readable report; otherwise it MUST use a single worker and preserve the assessment rationale.

#### Scenario: Independent units are available

- **WHEN** two or more units have disjoint mutable ownership or are read-only and can run independently
- **THEN** the parent creates parallel tasks and the launcher uses the highest safe useful concurrency within configured limits

#### Scenario: Work is indivisible or unsafe to fan out

- **WHEN** an OpenCode task has no genuinely independent units or fan-out would create unsafe overlap
- **THEN** the parent uses one worker and preserves why swarm fan-out was not appropriate

#### Scenario: Requested width exceeds capacity

- **WHEN** a manifest requests more than 200 workers or more workers than tasks
- **THEN** effective width is the lesser of 200 and task count

#### Scenario: A worker fails

- **WHEN** any worker exits unsuccessfully
- **THEN** its result is recorded and the parent swarm process exits non-zero
