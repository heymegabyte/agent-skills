# Design: explicit OpenSpec architect-role assignment

> **Architect:** codex
> **Architect Role:** assigned

## Decision

Treat OpenSpec architecture authorization as two independent gates:

1. The orchestrator explicitly assigns the architect role for the change.
2. The assigned architect operates through an approved frontier harness and is never OpenCode.

Both `proposal.md` and `design.md` must contain matching `Architect` identities and the exact `Architect Role: assigned` attestation. Missing metadata never receives a default identity. The validator fails closed before Paperclip synchronization.

## Rollout and rollback

The change is local governance and validation only. Rollback is a normal file revert; it does not modify product or operational data.

## Verification

Focused tests construct temporary changes covering the accepted and rejected metadata combinations without network or external side effects.
