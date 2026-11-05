# API-contract governance delta

## ADDED Requirements

### Requirement: single authoritative API contract emits OpenAPI

A pilot API surface SHALL describe its routes, models, and errors in ONE authoritative TypeSpec contract, from which OpenAPI 3.1 is emitted. The emitted OpenAPI document is a generated artifact — it SHALL NOT be hand-authored or hand-edited, and the estate SHALL NOT adopt TypeSpec's client/server code generators for the pilot. Runtime stays Hono with Zod validation against the emitted contract.

#### Scenario: OpenAPI emitted from the authoritative contract

- **Given** the pilot surface defines its API in a single TypeSpec project
- **When** the contract is compiled with the `@typespec/openapi3` emitter
- **Then** an OpenAPI 3.1 document is produced as a generated build output rather than maintained by hand

#### Scenario: emitted contract is deterministic and drift-checked

- **Given** an OpenAPI document previously emitted from the contract is committed
- **When** the contract is re-compiled with no source change
- **Then** the freshly-emitted OpenAPI is byte-identical to the committed document, and a drift check fails the build if they differ

#### Scenario: codegen generators are rejected for the pilot

- **Given** the pilot TypeSpec configuration
- **When** its emitters are inspected
- **Then** no `@typespec/http-server-*` or client-code generator emitter is configured, because the OpenAPI document — not generated client/server code — is the deliverable
