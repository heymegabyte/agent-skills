# Proposal: Propagate Concurrent End-of-Prompt Delivery Closure

> **Architect:** codex
> **Architect Role:** assigned

## Why

Existing convergence guidance runs shared-value extraction in parallel, but does not consistently preserve the integrity boundary between late reconciliation, the tested tree, the commit pushed to `main`, and the production artifact verified by smoke and E2E journeys.

## Scope

- Add a concise always-loaded production-delivery closure rule.
- Propagate the rule through generated skill and agent prompts and hydrated briefs.
- Require exact-final-tree revalidation after documentation, extraction, and generated-output reconciliation.
- Preserve fail-closed authority, review, recovery, credential, spending, provenance, and production-health gates.
- Normalize the three canonical skills that had not yet received the generator's existing multi-swarm section while propagating the new closure directive.
