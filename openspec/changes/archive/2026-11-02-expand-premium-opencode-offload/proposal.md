# Proposal

## Why

Premium model services still have room to interpret OpenCode delegation as optional or limited to narrowly mechanical work. The estate needs an explicit capability-first offload rule: if OpenCode using LiteLLM-routed DeepSeek or local Ollama can perform a unit effectively, premium credits should not be consumed for that unit.

## What Changes

- Require Gemini, Claude, OpenAI/Codex, and every other premium AI model service used for internal work to evaluate OpenCode capability before spending premium credits.
- Default every effectively executable unit to OpenCode through the configured LiteLLM gateway, using DeepSeek and local Ollama routes available there.
- Require an explicit swarm assessment for every OpenCode delegation and parallel fan-out for genuinely independent units when it reduces wall-clock time safely.
- Preserve premium models for work that materially benefits from frontier judgment and keep the parent responsible for decomposition, isolation, synthesis, and verification.
- Preserve safety boundaries for shared writes, secrets, destructive work, and high-risk decisions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `deepseek-swarm`: Broaden provider coverage, add local Ollama as a LiteLLM-backed throughput route, and make capability-first offload plus swarm assessment mandatory.

## Impact

The canonical provider policy, model-routing and LiteLLM rules, parallel-agent guidance, cross-harness entry files, routing metadata, and validation tests are affected. Customer-facing product inference remains outside this internal-development policy.
