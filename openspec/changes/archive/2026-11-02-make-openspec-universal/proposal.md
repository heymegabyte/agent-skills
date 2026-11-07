# Proposal

## Why

OpenSpec is currently mandatory only for selected “material” changes, which lets agents bypass requirement reconciliation for documentation, configuration, prompt, and apparently mechanical work that can still alter durable behavior. The user has explicitly directed that OpenSpec be used across the board, so every task needs a deterministic OpenSpec classification before implementation.

## What Changes

- Make OpenSpec the universal intake and change-governance layer for all repository work.
- Require agents to inspect the resolved OpenSpec root and reconcile the request with existing specs and in-flight changes before editing.
- Require a proposal/change for any task that changes durable repository state, including documentation, prompts, configuration, generated agent entrypoints, and mechanical migrations.
- Allow read-only questions and diagnostics to proceed without a change, but require an explicit no-change classification in the work receipt.
- Retain an emergency restoration path only when delay would worsen an active incident; require retrospective OpenSpec capture in the same work session.
- Propagate the policy through canonical agent entrypoints, router metadata, generated harness variants, and validation checks so Claude, Codex, Gemini, OpenCode, and agentskills consumers behave consistently.
- Add regression validation that rejects old “material changes only” language and verifies universal OpenSpec routing.
- Make autonomous completion the default: once the user authorizes an outcome, agents continue through propose, apply, verify, sync, archive, and adjacent high-value work without asking for routine continuation.
- Treat reasonable assumptions as implementation inputs, recording them in OpenSpec; pause only for approval-required actions, genuine blockers, or material ambiguity that cannot be safely reversed.

## Capabilities

### New Capabilities

- `openspec-governance`: Universal task classification, durable-change planning, lifecycle enforcement, emergency capture, and cross-harness policy consistency.

### Modified Capabilities

None.

## Impact

- Affects `rules/openspec-operating-contract.md`, top-level harness instructions, routing metadata, generated agent configurations, and policy validators.
- Changes the default workflow for all future repository mutations by requiring planning artifacts before implementation.
- Does not itself change product runtime behavior or bypass existing Figma, security, deployment, or approval gates.
