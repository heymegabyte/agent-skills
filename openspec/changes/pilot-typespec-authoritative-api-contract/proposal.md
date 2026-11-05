# Pilot TypeSpec as the single authoritative API contract (emit OpenAPI)

> **Architect:** claude
> **Architect Role:** assigned

## Why

Estate APIs today describe their shape in hand-written OpenAPI, in Hono route code, and in Zod schemas at the boundary — three partial sources that drift. REVISION 2 §21 calls for ONE authoritative contract that emits OpenAPI, so the generated artifact is always consistent with the source of truth instead of being maintained by hand.

## What changes

- Establish TypeSpec (`@typespec/openapi3`, verified 2026-11-04 via Context7 `/microsoft/typespec`) as the single authoritative API-contract language for a PILOT surface.
- Emit OpenAPI 3.1 from that one contract (`tsp compile . --emit=@typespec/openapi3`); the emitted document is generated-not-authored and must never be hand-edited.
- Do NOT adopt the preview client/server code generators (`@typespec/http-server-js`, `http-server-csharp`, client emitters) — the OpenAPI document is the deliverable; Hono + Zod stay the runtime, validated against the emitted contract.
- Scope to ONE pilot API surface, verified by a reproducible emit; generalize to more surfaces only after the pilot's acceptance evidence holds.

## Impact

- Doctrine + a scoped pilot only; no estate-wide rewrite. The owning rule gains a TypeSpec-as-source-of-truth section cross-linked from `rules/hono-api.md`.
- Out of scope: migrating existing OpenAPI docs, adopting TypeSpec codegen for clients/servers, any production deploy. Rollback is a file revert — no product or operational data is touched.
