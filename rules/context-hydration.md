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

Automatically turn the hydrated request into the strongest actionable execution prompt. Preserve the user's outcome and full scope; enrich it with authoritative repository state, governing constraints, acceptance evidence, dependencies, and best-supported inferred details. Resolve routine ambiguity through evidence and best judgment instead of returning it to the user. Never use prompt refinement to invent authority, bypass an approval gate, or replace the requested outcome with a smaller or easier one. Ask only when an unresolved choice is consequential, externally authoritative, or genuinely outcome-changing.

## Sufficiency gate

Architecture may begin only when the agent can state the desired outcome and explicit minimum; affected capabilities and surfaces; governing constraints and authority boundaries; observed current versus desired state; material assumptions, conflicts, risks, and dependencies; and acceptance evidence.

Stop loading when additional sources are duplicative and unlikely to change those items. Never use file count, token volume, or indiscriminate history loading as a proxy for understanding.

## OpenSpec handoff

For material work, map the outcome to cohesive capabilities and testable requirements; cover applicable edge states, compatibility, permissions, telemetry, rollout, rollback, and ownership; then decompose implementation into meaningful independently verifiable tasks with dependencies and acceptance evidence.

## Same-turn execution & multi-swarm parallelization

OpenSpec is an execution control, not a conversational delay. When the original request authorizes implementation and no approval-required action, material ambiguity, or genuine blocker remains:

1. Run the **Product & Architecture Gap Audit** (`auditProductGaps` in `bin/prompt-hydrator.ts`) so missing or stubbed surfaces (such as `"Settings"`, `"Billing"`, `"Notifications"`, `"Plugin Catalog"`, or `@theme.tools/*` bindings) are folded into the OpenSpec scope automatically.
2. Convene the **Right-Sized Collaborative SCRUM Deliberation Quorum** (`bin/scrum-deliberation-quorum.ts`) with *only* the specialist agents required by the active domain across `claude`, `codex`, and `gemini`.
3. Have the Frontier Architect (`claude` / `codex` / `gemini` — never `opencode`) author the OpenSpec artifacts (`proposal.md`, `design.md`, `tasks.md`, `specs/`, `task-graph.json`) and enrich repository docs/comments via web research.
4. Immediately apply and verify in the same turn using **massive parallel swarms** (`bin/multi-swarm-orchestrator.ts`), offloading 80%+ of throughput-safe implementation, full plugin catalogs, 100% unit tests, and parallel Cloudflare Browser Run (`@cloudflare/playwright`) E2E suites to `opencode` (DeepSeek) worktree swarms through production Cloudflare deployment on `main`.

Cross-links: `[[parallel-multi-swarm-orchestration]]` · `[[intent-complete-delivery]]` · `[[openspec-operating-contract]]` · `[[working-backwards]]` · `[[agent-self-manages-context]]`.
