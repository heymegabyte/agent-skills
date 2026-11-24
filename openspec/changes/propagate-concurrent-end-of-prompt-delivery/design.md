# Design: Concurrent End-of-Prompt Delivery Closure

> **Architect:** codex
> **Architect Role:** assigned

## Decision

Finishing lanes may run concurrently until they converge on the candidate tree. The release integrity boundary is then serialized: regenerate, revalidate the exact final tree, commit that tree, normally push the same commit to `main`, promote the same immutable artifact, and verify production. Missing authority or evidence blocks the affected mutation rather than being converted into a pass.

## Propagation

The canonical rule is always loaded by the core pack and harness manifest. The enforcement generator adds one marker-bounded directive to every canonical skill and agent prompt, and the prompt hydrator includes the same contract in generated briefs. The generator must be idempotent.
