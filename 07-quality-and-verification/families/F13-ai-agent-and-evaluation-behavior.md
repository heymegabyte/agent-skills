---
name: "F13-ai-agent-and-evaluation-behavior"
family: "F13"
title: "F13 — AI, agent, and evaluation behavior"
default_layer: "ai-eval"
default_tier: "required-ci"
recommendations_count: 30
updated: "2026-11-04"
---

# F13 — AI, agent, and evaluation behavior (30 Recommendations: F13.01–F13.30)

> **Summary**: Deterministic agent state/tool schemas, tool permission boundaries, indirect prompt-injection resistance, receipt-verified outcomes, mocked vs live provider separation, held-out golden datasets, calibrated judges, citation grounding, and token/time budgets.
> **Default Layer**: `ai-eval` · **Default Execution Tier**: `required-ci` · **Primary Tools**: Promptfoo, Langfuse Datasets & Traces, Deterministic Tool Boundary Harness

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F13 Recommendation Catalog (F13.01–F13.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F13.01`** | Deterministic agent state & tool schemas | `P0` | `ai-eval` | `required-ci` | `verified` | Test deterministic agent state transitions and tool argument schemas with fixed fixtures before live model evals. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.02`** | Tool permission boundary enforcement | `P0` | `ai-eval` | `required-ci` | `verified` | Exercise tool permission boundaries across roles and environments so retrieved content cannot grant capabilities. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.03`** | Indirect prompt injection resistance | `P0` | `ai-eval` | `required-ci` | `verified` | Place prompt injection attempts in retrieved documents, tool outputs, and quoted messages and assert user intent holds. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.04`** | Plausible distractor tool selection | `P0` | `ai-eval` | `required-ci` | `verified` | Evaluate tool selection on tasks with plausible distractors, including completing without tools when none are needed. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.05`** | Receipt-backed completion assertions | `P0` | `ai-eval` | `required-ci` | `verified` | Assert completed task outcomes against actual tool receipts and persisted state, rejecting unbacked success claims. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.06`** | Mocked orchestration vs live eval separation | `P0` | `ai-eval` | `required-ci` | `verified` | Separate deterministic mocked orchestration tests from live provider evaluations in reporting and gate logic. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.07`** | Multi-sample stochastic uncertainty reporting | `P0` | `ai-eval` | `required-ci` | `verified` | Repeat stochastic evaluations across justified samples and report variance, model ID, prompt revision, and temperature. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.08`** | Independently reviewed golden scenarios | `P0` | `ai-eval` | `required-ci` | `verified` | Build golden scenarios covering critical tasks, ambiguous instructions, partial info, and hard boundaries. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.09`** | Held-out evaluation set hygiene | `P0` | `ai-eval` | `required-ci` | `verified` | Keep held-out evaluation cases separate from prompt tuning examples and refresh deliberately on distribution shift. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.10`** | Human-calibrated model judges | `P0` | `ai-eval` | `required-ci` | `verified` | Calibrate model judges against human-reviewed examples and measurable outcomes before gating releases. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.11`** | Judge bias & position-order invariance | `P1` | `ai-eval` | `required-ci` | `verified` | Test judge sensitivity to answer order, verbosity, formatting, and self-promotional claims. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.12`** | Tenant-scoped retrieval recall & abstention | `P1` | `ai-eval` | `required-ci` | `verified` | Evaluate retrieval relevance, freshness, and tenant isolation including queries where the answer is absent. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.13`** | Citation grounding & anti-hallucination | `P1` | `ai-eval` | `required-ci` | `verified` | Check generated citations against retrieved evidence and specific claims, rejecting fabricated references. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.14`** | Calibrated abstention vs over-refusal | `P1` | `ai-eval` | `required-ci` | `verified` | Evaluate appropriate abstention and clarification on missing/conflicting evidence without refusing answerable tasks. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.15`** | Cross-turn secret & PII canary containment | `P1` | `ai-eval` | `required-ci` | `verified` | Use synthetic secret and PII canaries to test leakage across responses, traces, tool args, and memory. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.16`** | Multilingual & noisy-input intent stability | `P1` | `ai-eval` | `required-ci` | `verified` | Test multilingual, misspelled, and ambiguous task phrasings to ensure intent and auth boundaries survive. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.17`** | Prompt, model & gateway change impact expansion | `P1` | `ai-eval` | `required-ci` | `verified` | Expand impacted evaluations when models, prompts, retrieval, tool schemas, or AI Gateway routing change. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.18`** | Fallback model schema & safety parity | `P1` | `ai-eval` | `required-ci` | `verified` | Test fallback models and providers against required capabilities, structured output schemas, and safety boundaries. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.19`** | Context compaction & poisoned-memory resistance | `P1` | `ai-eval` | `required-ci` | `verified` | Exercise long-context truncation, compaction, and conflicting memory while preserving active instructions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.20`** | Idempotent tool retry across side effects | `P1` | `ai-eval` | `required-ci` | `verified` | Interrupt agent retries around tool side effects and verify idempotency or reconciliation for consequential actions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.21`** | DAG-ordered parallel tool execution | `P1` | `ai-eval` | `required-ci` | `verified` | Test parallel tool calls so independent reads overlap while dependent mutations and approvals stay ordered. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.22`** | Token, tool-call, turn & wall-clock budgets | `P1` | `ai-eval` | `required-ci` | `verified` | Enforce token, tool-call, turn, and elapsed-time budgets in tests with useful partial reporting on cancellation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.23`** | Interrupted stream & malformed JSON recovery | `P2` | `ai-eval` | `required-ci` | `verified` | Validate streaming and structured outputs against interrupted JSON, refusals, and recoverable schema violations. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.24`** | Adversarial multimodal input handling | `P2` | `ai-eval` | `required-ci` | `verified` | Exercise multimodal inputs with misleading labels, damaged files, and embedded hostile instructions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.25`** | Sanitized Langfuse trace regression | `P2` | `ai-eval` | `required-ci` | `verified` | Regress execution traces against expected tool order, permissions, costs, and outcomes using sanitized fixtures. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.26`** | Scoped human-in-the-loop approval resumption | `P2` | `ai-eval` | `required-ci` | `verified` | Test that consequential actions wait for explicit user authorization and resume without re-prompting within scope. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.27`** | Honest lifecycle state vocabulary | `P2` | `ai-eval` | `required-ci` | `verified` | Distinguish accepted, scheduled, running, committed, and failed outcomes so async receipts never claim completion. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.28`** | Stale ID & hallucinated-argument rejection | `P2` | `ai-eval` | `required-ci` | `verified` | Provide stale resource IDs and invalid arguments to verify refreshed evidence rather than fabricated IDs. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.29`** | False-refusal & task-utility tradeoff metrics | `P2` | `ai-eval` | `required-ci` | `verified` | Measure unnecessary refusal and overcautious behavior alongside unsafe completion. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
| **`F13.30`** | Multi-turn steering, correction & scope change | `P2` | `ai-eval` | `required-ci` | `verified` | Test multi-turn steering, corrections, cancellations, and scope changes while honoring latest instructions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F13`)* |
