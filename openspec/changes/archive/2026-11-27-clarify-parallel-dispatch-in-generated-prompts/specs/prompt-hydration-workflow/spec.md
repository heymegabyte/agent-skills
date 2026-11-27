## ADDED Requirements

### Requirement: Generated dispatch instructions describe continuous scheduling

Generated dispatch instructions SHALL direct coordinators to route all suitable ready work through OpenCode with DeepSeek via LiteLLM and launch independent work concurrently when doing so improves verified turnaround at the required quality. Dispatch evidence SHALL remain distinct from planned allocation.

#### Scenario: A dependency clears and workers are available

- **WHEN** new independent authorized work becomes ready
- **THEN** the coordinator reassesses routing and fills available approved worker capacity with suitable ready work
- **AND** uses Codex, Gemini, or Claude where premium capability or independent review materially improves the result

#### Scenario: A generated brief has a candidate allocation

- **WHEN** a generated brief renders an OpenCode allocation estimate
- **THEN** it labels the share as planned and requires scheduler receipts for actual dispatch
