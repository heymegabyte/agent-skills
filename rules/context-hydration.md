---
name: "context-hydration"
description: "Load the smallest complete relevant context before architecture and convert material outcomes into implementation-ready OpenSpec work."
last_reviewed: 2026-11-06
superseded_by: null
priority: 3
pack: "core"
triggers:
  - "load context"
  - "fully loaded context"
  - "before architecting"
  - "openspec microtasks"
  - "hydrate context"
paths:
  - "*"
---

# Context-Hydrated Architecture

“Fully loaded” means decision-complete, not repository-complete. Load the smallest relevant context set that can support the architecture with evidence.

## Required order for material work

1. Read host/user instructions and the closest repository instructions.
2. Resolve the OpenSpec root; reconcile existing specs and active changes.
3. Read approved designs and durable decisions that govern the surface.
4. Inspect current implementation, nearby tests, relevant configuration, and authoritative docs.
5. Load durable preferences and verified external facts only when they can change the decision.

Before material execution, produce the shared typed hydration artifact with `bin/prompt-hydrator.ts`. Preserve the original request verbatim in the protected structured artifact; use its redacted readable/explain forms for handoffs and remote diagnostics. A short complete-product request additionally loads `[[greenfield-saas-prompt-hydration]]`.

Treat discovery as distinct from loading. A filename, provider-availability flag, stale research receipt, dependency name, or generated recommendation is not evidence that its contents were understood. The hydrator's `decisionReadiness` gate begins fail-closed: material architecture cannot start while a required domain is `discovered-not-loaded` or `pending-research`. The architect closes each domain with fresh, decision-relevant evidence and records provenance, observation date or source revision, confidence, conflicts, and implications.

For material product and architecture decisions, cover instructions/authority, applicable OpenSpec and durable decisions, relevant source/tests/runtime/history, installed-version dependency documentation, users/market, competitors/substitutes, operations/Cloudflare, and shared-platform ownership. Read the installed library version from its manifest or lockfile and request that version from Context7. Confirm a verified served version or matching upstream tag before treating the result as exact. A successful query can serve a nearby version. Use official versioned documentation if the exact match cannot be established and record the fallback. Use current primary sources for market and competitor findings, distinguishing observed, documented, and inferred behavior.

Automatically turn the hydrated request into the strongest actionable execution prompt. Preserve the user's outcome and full scope; enrich it with authoritative repository state, governing constraints, acceptance evidence, dependencies, and best-supported inferred details. Resolve routine ambiguity through evidence and best judgment instead of returning it to the user. Never use prompt refinement to invent authority, bypass an approval gate, or replace the requested outcome with a smaller or easier one. Ask only when an unresolved choice is consequential, externally authoritative, or genuinely outcome-changing.

## Sufficiency gate

Architecture may begin only when the agent can state the desired outcome and explicit minimum; affected capabilities and surfaces; governing constraints and authority boundaries; observed current versus desired state; material assumptions, conflicts, risks, and dependencies; and acceptance evidence.

Stop loading when additional sources are duplicative and unlikely to change those items. Never use file count, token volume, or indiscriminate history loading as a proxy for understanding.

## Post-verification fixed point

After the explicit outcome passes, refresh the context receipt and generate the strongest remaining improvements in parallel. Deduplicate them against source, OpenSpec, shipped behavior, and prior rounds; rank confidence and net value after risk, cost, maintenance, and reuse. Implement every authorized, in-scope candidate with confidence at least `0.8` and positive net value, verify it, refresh context, and repeat. Stop after two consecutive refreshed rounds produce no new qualifying candidate, or at an authority, approval, credential, destructive, paid, external-communication, or material product-direction boundary. Recommendations do not create authority.

When those filters pass, immediately apply them in the same turn rather than returning a passive recommendation list.

For reusable work, route ownership before implementation: agent behavior to `agent-skills`; reusable UI/application/workflow capability to `theme.tools`; reusable host/tool configuration to `install.doctor`; consumer repositories retain product-specific composition, routes, bindings, and content. Extract reusable value even when the first implementation must remain local.

## OpenSpec handoff

For material work, map the outcome to cohesive capabilities and testable requirements; cover applicable edge states, compatibility, permissions, telemetry, rollout, rollback, and ownership; then decompose implementation into meaningful independently verifiable tasks with dependencies and acceptance evidence.

## Same-turn execution

Use [prompt hydration and parallel OpenSpec delivery](parallel-multi-swarm-orchestration.md) to synthesize separate briefs, admit evidence-backed product gaps, and queue independently owned changes. Apply the relevant verification and delivery gates for each change.

Cross-links: `[[parallel-multi-swarm-orchestration]]` · `[[intent-complete-delivery]]` · `[[openspec-operating-contract]]` · `[[working-backwards]]` · `[[agent-self-manages-context]]`.
