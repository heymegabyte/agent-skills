## Context

The deployment skill already checks response schema and deployed revision. Retirement needs a negative assertion for the old contract. Delivery claims need an observation from the specific system expected to receive the operation.

## Decisions

Extend the existing deployment skill so both procedures are discoverable through its existing trigger and projections. Verify the controlled delivery path using safe synthetic inputs, including any known cache variants, and limit evidence to sanitized response observations. Use the receiver's available receipt semantics for external delivery.

## Risks / Trade-offs

A retirement status can disclose prior existence or be cached by default. Select the status according to disclosure policy and explicitly prevent storage for incident-sensitive routes. Use read-only destination lookup or approved synthetic probes within the existing release scope.
