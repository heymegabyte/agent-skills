# Proposal

## Why

The internal LiteLLM gateway is operational but its runtime still depends on a mutable container tag, has no durable encryption salt, exposes the login surface without an identity-aware edge policy, does not advertise the estate's local Ollama capacity, and lacks gateway-specific alerting and drift controls. Agent policy now expects OpenCode to prefer LiteLLM-backed local Ollama and DeepSeek, so the runtime and project-awareness surfaces must make that promise true and continuously verifiable.

## What Changes

- Pin and verify the LiteLLM image by immutable digest, explicitly excluding the compromised 1.107.0 release.
- Establish a non-rotating `LITELLM_SALT_KEY` through the estate secret rail after proving no existing encrypted database credentials would be invalidated.
- Protect the administrative UI with Cloudflare Access while leaving OpenAI-compatible API routes available behind LiteLLM virtual-key authentication.
- Connect a real local Ollama deployment through private networking and publish capability-oriented local model aliases with DeepSeek fallbacks.
- Add request concurrency limits, scoped virtual-key policy, explicit fallback coverage, and accurate cost/accounting checks.
- Enable private Prometheus collection, LiteLLM-specific alerts, spend freshness checks, and corrected Grafana documentation.
- Define a versioned desired-state source, reconciliation checks, rollback evidence, and agent-skill/router guidance that makes every project aware of the gateway default while respecting explicit project exceptions.

## Capabilities

### New Capabilities

- `litellm-gateway`: Secure, observable, drift-controlled operation of the estate's internal LiteLLM/OpenCode gateway.

### Modified Capabilities

- `deepseek-swarm`: Require route discovery and readiness checks so delegation uses only gateway-advertised DeepSeek or local Ollama capacity.

## Impact

The canonical agent-skills repository, the live Coolify LiteLLM service, Cloudflare Access, the Grafana/Prometheus estate, OpenCode configuration, and the misleading ProjectSites reference configuration are affected. Existing callers retain their current virtual key and model aliases during migration. Customer-facing inference and the install.doctor `aid` product's explicit no-LiteLLM decision remain unchanged.
