# Restore scoped platform policy validation

**Architect Role:** assigned

**Architect:** codex

The validator still expects the initial scope and schema, while the canonical manifest uses reviewed version 2. An old hosted instruction generator also removed the scoped AGENTS route. Restore the entrypoint, validate current policy, and exercise the same strict checks in hosted validation.
