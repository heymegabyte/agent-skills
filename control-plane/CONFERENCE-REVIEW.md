# Architecture conference review contract

This document owns the operator-facing semantics for the Codex-led architecture conference. The implementation lives in `bin/evidence-gated-deliberation.ts` and `bin/evidence-gated-orchestrator.ts`; do not duplicate its scheduling algorithm in prose.

## Role contracts

| Responsibility | Contract | Required receipt content |
| --- | --- | --- |
| Codex lead resolution | Freeze the question, preserve material dissent, compare evidence, and record the resolved position without inventing consensus. | Decisions, retained/rejected/deferred alternatives, disagreements, evidence, unresolved assumptions, and resolution digest. |
| Product/completeness | Challenge user journeys, roles, states, omissions, acceptance behavior, and whether the outcome is complete rather than merely implemented. | Independent or procedurally separated review provenance, gaps, alternatives, and revision. |
| Architecture/verification | Challenge contracts, boundaries, failure modes, migration, security, operations, rollback, and whether proposed evidence can prove the behavior. | Independent or procedurally separated review provenance, risks, evidence, alternatives, and revision. |

The responsibilities always exist. Provider count does not manufacture independence. OpenCode/DeepSeek may support bounded implementation or research, but it does not become the assigned OpenSpec architect through fallback.

## Execution and evidence labels

| Label | Meaning | Claim allowed |
| --- | --- | --- |
| `independent-three-family` | Claude, Codex, and Gemini receive peer-output-free inputs through approved provider calls. | Independent model-family review, when invocation receipts are present. |
| `two-agent` | Two distinct agents/providers cover all three responsibilities; the Codex lead may own one reviewer responsibility too. | Two-agent independence only for the distinct invocations; never three-family independence. |
| `combined-role` | Multiple passes or slots use one provider family and one identity may own several responsibilities. | Procedural role coverage, not independent model evidence. |
| `sequential-single-agent` | One approved provider slot performs labeled passes in sequence. | Sequential self-review with honest limitation, not independent review. |
| `simulated` | Deterministic adapters or fixtures exercise scheduling, schemas, blockers, and receipts. | Mechanics verified; no live-provider or installed-policy claim. |
| `live` | Approved wrappers actually invoke identified providers/models and return attributable receipts. | Live review only for the exact invocation, policy digest, source revision, and timestamp observed. |

Instruction presence, a launcher command, or a model name is neither simulated execution nor live execution. A controlled fixture can prove that fallback is honest; it cannot prove authentication, quota, provider response, installation, or production behavior.

## When parallel review is beneficial

Run independent reviews in parallel when the product and architecture questions do not depend on one another's draft, the decision is material, current provider capacity exists, and isolation reduces anchoring without creating file or authority collisions. Typical cases include new product journeys, architecture boundaries, auth/security/payment changes, migrations, shared-package contracts, and consequential release decisions.

Use combined or sequential review for narrow, reversible, low-risk work when capacity is limited and objective verification can compensate. Do not spend parallel-review overhead on a mechanical correction whose behavior is already frozen and directly testable. Never use fallback to bypass an authority, security, payment, destructive-operation, or external-communication gate.

## Examples

Low-risk single-provider fixture:

```json
{
  "mode": "sequential-single-agent",
  "independent": false,
  "limitation": "Only one approved provider slot is available; responsibilities run sequentially and are not independent evidence."
}
```

High-risk blocked fallback:

```json
{
  "decision": "block",
  "blockers": [
    "authority scope is missing: payments",
    "high-risk work requires independent verification from two provider families"
  ]
}
```

Verify the examples and doctrine markers with:

```bash
node --experimental-strip-types --test tests/conference-policy-docs.test.ts
```

Run behavior checks separately with the focused conference and risk-gate tests. Passing docs tests proves documentation consistency only.
