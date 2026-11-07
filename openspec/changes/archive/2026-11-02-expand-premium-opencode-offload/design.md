# Design

## Context

The estate already has a canonical OpenCode swarm launcher and a LiteLLM-first DeepSeek route, but the surrounding policy uses narrower terms such as routine, mechanical, or throughput work. The user-confirmed gateway also exposes local Ollama capacity. Existing files have unrelated in-progress changes, so implementation must preserve those edits and update only the provider-routing clauses.

## Goals / Non-Goals

**Goals:**

- Establish one authoritative capability-first decision rule for all premium model harnesses.
- Make swarm assessment mandatory while keeping actual fan-out conditional on safe independence.
- Keep the rule testable across provider policy, harness entrypoints, and routing metadata.

**Non-Goals:**

- Do not force weak local models onto work they cannot complete effectively.
- Do not move frontier synthesis, security, architecture, auth, payment, destructive operations, or final integration into an unsupervised swarm.
- Do not change customer-facing product inference or gateway infrastructure.

## Decisions

### Use effectiveness, not task labels, as the offload boundary

The parent evaluates whether OpenCode can satisfy acceptance and verification criteria. This is broader and less gameable than a fixed list of "mechanical" tasks while preserving quality. The rejected alternative is provider routing based solely on task category, which leaves capable work on premium models.

### Treat LiteLLM as the single normal gateway

OpenCode selects configured DeepSeek or local Ollama routes through LiteLLM. Direct provider access remains break-glass only. This centralizes cost controls, routing, and local-capacity use.

### Require a swarm decision for every delegation

The parent must partition work into genuinely independent units when possible, then use the highest safe useful concurrency. A single worker remains correct for indivisible or overlapping work, but the reason is retained in the work evidence. Blind maximum fan-out is rejected because shared writes and duplicated work can reduce throughput.

### Keep premium parents accountable for outcomes

Offload moves execution cost, not responsibility. Premium parents own task contracts, isolation, fold, adversarial review where warranted, and end-to-end verification.

## Risks / Trade-offs

- [Over-delegation lowers quality] → Require explicit acceptance criteria, evidence-based suitability, parent verification, and a documented exception when premium execution is necessary.
- [Parallel workers collide] → Fan out only read-only or disjoint mutable units; serialize hot-file and high-risk work.
- [Local Ollama availability varies] → Select only routes advertised by the configured LiteLLM gateway and fail over within the gateway before premium escalation.
- [Duplicated doctrine drifts] → Keep `rules/agent-provider-policy.md` as the SSOT and make harness entrypoints reference or summarize its exact decision rule.

## Migration Plan

1. Add regression assertions for provider coverage, capability-first wording, LiteLLM-backed DeepSeek/Ollama routing, and mandatory swarm assessment.
2. Update the SSOT provider policy and the smallest set of linked routing and harness-entry documents needed for reliable activation.
3. Run policy, swarm, portable-skill, and OpenSpec validation.
4. Sync the delta into the main capability spec and archive the completed change. Roll back by reverting the policy clauses; no persistent runtime data changes are involved.
