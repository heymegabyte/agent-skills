# openclaw-fleet-routing Specification

## Purpose

Select the configured model for Python OpenClaw throughput requests.

## Requirements

### Requirement: Python OpenCode throughput route selection

The Python fleet entrypoint SHALL preserve the named DeepSeek tier when sending OpenCode requests through the configured LiteLLM gateway.

#### Scenario: Gateway credential is available

- **GIVEN** a separately configured LiteLLM credential
- **WHEN** the Python entrypoint builds a DeepSeek Pro, Flash, or generic OpenCode command
- **THEN** explicit Flash selects the gateway Flash model and the other covered aliases select the gateway Pro model.

#### Scenario: Gateway credential is absent

- **GIVEN** no configured LiteLLM credential
- **WHEN** the Python entrypoint builds a covered command
- **THEN** it selects the existing direct DeepSeek fallback without copying a DeepSeek credential to the gateway field.
