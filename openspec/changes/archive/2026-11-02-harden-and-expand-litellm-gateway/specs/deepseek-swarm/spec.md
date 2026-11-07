# deepseek-swarm Specification Delta

## MODIFIED Requirements

### Requirement: LiteLLM-first throughput rail

Every internal work unit that OpenCode can complete effectively MUST use OpenCode through the configured LiteLLM gateway by default. Before delegation, the parent MUST discover currently advertised routes and verify gateway readiness. It MUST prefer an installed, smoke-tested local Ollama capability route when that route can meet acceptance criteria, otherwise select a gateway-backed DeepSeek route. Premium credits and direct provider APIs remain evidence-based exceptions.

#### Scenario: A parent prepares delegation

- **WHEN** OpenCode can complete an internal work unit effectively
- **THEN** the parent confirms readiness, discovers live route IDs, chooses effective local capacity before DeepSeek, and records any premium escalation reason

#### Scenario: An assumed route is absent

- **WHEN** a configured or documented route is not advertised by the gateway
- **THEN** the parent does not send work to it and selects another healthy advertised route or retains the unit with a recorded exception

#### Scenario: OpenCode can perform the work effectively

- **WHEN** an internal work unit can meet its acceptance and verification criteria through OpenCode with a gateway-backed DeepSeek or local Ollama model
- **THEN** the premium harness delegates that unit to OpenCode instead of consuming premium model credits for its execution

#### Scenario: Routine work is routed

- **WHEN** a premium harness identifies routine work that OpenCode can complete effectively
- **THEN** it delegates the unit through OpenCode with a LiteLLM-backed DeepSeek or local Ollama model

#### Scenario: Gateway routes are unsuitable

- **WHEN** evidence shows that no configured DeepSeek or local Ollama route can meet the unit's quality, context, tool, latency, safety, or reliability requirements
- **THEN** the parent records the reason and may retain the unit on the least-cost capable premium service
