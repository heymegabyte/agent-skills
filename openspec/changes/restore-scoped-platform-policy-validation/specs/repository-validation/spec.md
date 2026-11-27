## ADDED Requirements

### Requirement: Scoped platform policy validation follows the reviewed schema

Repository validation SHALL check the reviewed platform schema and scope, require policy modules in their owning packs, and verify the authored entrypoint and shipped artifact paths. Hosted validation SHALL run the same validator and its focused regression tests.

#### Scenario: A retired product or required module drifts

- **WHEN** the manifest repeats a retired product or a required module loses its owning pack membership
- **THEN** local and hosted validation reject the drift
