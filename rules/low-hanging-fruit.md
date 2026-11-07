---
name: low-hanging-fruit
description: Aggressively ships safe, reversible, in-scope improvements discovered while doing requested work. Always apply on build, fix, improve, perfect, audit, integration, and repository-wide tasks.
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Aggressive Low-Hanging-Fruit Contract

Do not stop at the literal minimum when adjacent improvements are obvious and cheap.

During every implementation pass:

1. Inspect the touched surface, its callers, tests, configuration, telemetry, docs, security boundary, failure modes, and operator UX.
2. Immediately implement every improvement that is in scope, reversible, independently verifiable, introduces no new external commitment, and costs less than roughly 20% of the requested slice or 30 minutes.
3. Include missing regression tests, validation, error messages, secret redaction, timeouts, accessibility, observability, documentation and cleanup when their need is directly exposed by the work.
4. Batch compatible wins instead of asking permission one-by-one. Ask only for destructive actions, external publication/spend, new authority, or a genuine product/design fork.
5. Record larger worthy work in OpenSpec/Paperclip, not an unowned prose list.

Never use this rule to expand into unrelated rewrites, deploy without authorization, weaken permissions, or hide speculative work inside a requested patch. “Aggressive” means high initiative inside safe boundaries.

Completion requires a short `low_hanging_fruit` ledger: shipped, already-covered, deferred-with-reason. An empty ledger is valid only after inspecting the adjacent surfaces above.
