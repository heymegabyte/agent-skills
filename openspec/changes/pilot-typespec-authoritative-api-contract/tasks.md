# Tasks

- [ ] Add a TypeSpec-as-authoritative-API-contract section to the owning rule (`rules/hono-api.md`): author in `.tsp`, emit OpenAPI 3.1, OpenAPI is generated-not-authored, codegen generators rejected, pilot-before-fleet.
- [ ] Select ONE pilot API surface and scaffold its single `.tsp` project + `tspconfig.yaml` emitting `@typespec/openapi3` at OpenAPI 3.1.
- [ ] Prove a reproducible emit (second compile byte-identical) and wire a committed-OpenAPI-vs-emitted drift check.
- [ ] Confirm no client/server generator emitter is configured; Hono + Zod remain the runtime validated against the emitted contract.
- [ ] Cross-link the owning-rule section; run markdownlint + the pack/reference-pointer gates on the touched files.
