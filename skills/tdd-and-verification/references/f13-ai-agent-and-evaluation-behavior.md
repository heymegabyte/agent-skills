---
name: "F13 — AI, agent, and evaluation behavior"
familyId: "F13"
defaultLayer: "ai_evaluation"
defaultTier: "required_ci"
itemCount: 30
---

# F13: AI, agent, and evaluation behavior (F13.01–F13.30)

- **Default Verification Layer**: `ai_evaluation`
- **Default Execution Tier**: `required_ci`
- **Authorized Pilot Implementation**: `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F13.01` | **Deterministic agent state and tool schemas** | Validate all agent tool inputs/outputs with strict Zod schemas before model evaluation. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.02` | **Role-scoped tool permissions** | Enforce least-privilege tool boundaries (research vs draft vs publish) in authorizeEditorialAction. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.03` | **Retrieved-content prompt injection defense** | Strip adversarial instructions via sanitizeRetrievedPassage before synthesis or tool use. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.04` | **Tool selection with distractors** | Verify agents select existing shared components from BLOG_BLOCK_REGISTRY instead of inventing widgets. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.05` | **Receipt-verified completion claims** | Require verified ProviderOperation and QualityReport receipts before claiming completion. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.06` | **Mocked vs live provider separation** | Label fixture runs (isFixture: true) distinctly from live DataForSEO/AI captures. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.07` | **Multi-sample stochastic evaluation** | Track sample size, model version, and prompt version in skill evaluation runs. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.08` | **Golden reference scenarios** | Maintain FLAGSHIP_ARTICLE_BUNDLE and rejected counterexample fixtures in packages/blog. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.09` | **Held-out evaluation task separation** | Keep held-out evaluation scenarios in skill-eval-harness.ts separate from skill prompt examples. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.10` | **Judge calibration against deterministic oracles** | Use deterministic check functions for word count, citations, RBAC, and selector accuracy. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.11` | **Judge invariance to verbosity/formatting** | Score substantive editorial words and verified claims rather than superficial formatting. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.12` | **Retrieval relevance and missing-source handling** | Fail closed when claims lack inspected SourceVersion and EvidenceReference records. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.13` | **Citation entailment verification** | Verify every inline CitationNode resolves to a verified ClaimRecord and SourceRecord. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.14` | **Appropriate abstention on missing evidence** | Record unavailable data as null/disclosed rather than fabricating metrics or citations. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.15` | **Synthetic secret canary non-leakage** | Verify planted secret canaries never appear in sanitized logs, prompts, or outputs. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.16` | **Ambiguous and multilingual query resilience** | Preserve intent and safety boundaries across CJK, RTL, and punctuation-heavy inputs. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.17` | **Prompt/model change impact expansion** | Treat changes to skill files, prompts, or schemas as broadening impacted evaluation suites. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.18` | **Fallback model schema compliance** | Verify fallback AI theme and image generators satisfy the exact same output schema. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.19` | **Context compaction instruction preservation** | Preserve non-negotiable TDD and release-gate invariants across multi-stage workflows. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.20` | **Idempotent agent tool retries** | Prevent duplicate paid DataForSEO or slot-publish calls when agent steps retry. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.21` | **Parallel vs dependent tool ordering** | Run independent checks in parallel while keeping reservation -> research -> publish sequential. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.22` | **Token, turn, and micro-USD budget enforcement** | Halt or degrade gracefully when MicroUsdBudgetManager caps are reached. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.23` | **Malformed/interrupted structured output recovery** | Reject truncated or invalid JSON from LLM theme generation with clean 502 fallback. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.24` | **Multimodal authenticity verification** | Enforce VisualAuthenticityBadge and forbid AI rasters from masquerading as data charts or screenshots. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.25` | **Trace regression on tool order and cost** | Verify 9-stage EditorialWorkflowLedger trace order and recorded micro-USD spend. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.26` | **Explicit authorization gate for high-blast actions** | Require publisher/owner role and approved ReviewRecord before live publication. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.27` | **Lifecycle state reporting accuracy** | Distinguish idea, researched, drafted, reviewed, scheduled, and published states. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.28` | **Stale identifier detection** | Reject stale baseRevisionId or unknown sourceIds instead of inventing replacements. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.29` | **Balanced refusal vs task completion** | Allow local draft authoring without external credentials while blocking only unverified prod release. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
| `F13.30` | **Multi-turn steering and diff scoping** | Scope AI editor proposals to targetNodeId + baseRevisionId with individual accept/reject. | `ai_evaluation` | `required_ci` | `verified` | `packages/testing/src/skill-eval-harness.ts & apps/web/e2e/generate.spec.ts` |
