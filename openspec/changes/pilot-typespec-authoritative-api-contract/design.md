# Design: TypeSpec → OpenAPI authoritative-contract pilot

> **Architect:** claude
> **Architect Role:** assigned

## Decision

One `.tsp` project is the authoritative contract for the pilot API surface. OpenAPI is a GENERATED output of that contract, never a hand-maintained sibling.

1. **Author once in TypeSpec.** The pilot surface's routes, models, and errors live in a single `.tsp` project.
2. **Emit OpenAPI 3.1, don't author it.** `tsp compile . --emit=@typespec/openapi3` (or `tspconfig.yaml` `emit: ["@typespec/openapi3"]`, `openapi-versions: [3.1.0]`) produces the OpenAPI document into a build-output dir. The emitted file carries a generated-artifact banner and is treated like any other build output (regenerated, never edited).
3. **Reject the codegen generators.** `@typespec/http-server-js` / `http-server-csharp` / client emitters stay UNused. The runtime remains Hono (`rules/hono-api.md`) with Zod at the boundary; the emitted OpenAPI is what request/response shapes are validated against, keeping the three prior sources collapsed into one.
4. **Pilot before fleet.** Exactly one API surface adopts this; a reproducible emit (same input → same OpenAPI) plus a drift check (committed OpenAPI == freshly-emitted) is the acceptance evidence before any second surface.

## Grounding

Verified live 2026-11-04 via Context7 `/microsoft/typespec`: the `@typespec/openapi3` emitter outputs OpenAPI 3.0/3.1 (`tsp compile . --emit=@typespec/openapi3`); server/client generation are SEPARATE opt-in emitters, so "emit OpenAPI only" is the default, codegen-free path.

## Rollout and rollback

Doctrine + a scoped pilot. No estate-wide migration, no runtime rewrite, no deploy. Rollback is a normal file revert of the `.tsp` project, the owning-rule section, and the emitted document; it modifies no product or operational data (`[[one-way-two-way-doors]]` — a reversible two-way door).

## Verification

- The pilot `.tsp` compiles and emits an OpenAPI 3.1 document with the `@typespec/openapi3` emitter.
- Re-emitting is deterministic: a second `tsp compile` produces a byte-identical OpenAPI document (drift guard: committed == emitted).
- No client/server generator emitter appears in the pilot config.
- `rules/hono-api.md` cross-links the new TypeSpec-source-of-truth section; the owning rule is markdownlint-clean and pack-coherent.
