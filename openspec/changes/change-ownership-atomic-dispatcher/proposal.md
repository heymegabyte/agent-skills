# Proposal: Atomic Change-Ownership Dispatcher / Claim Lock

> **Architect:** claude (hydrated frontier context — non-OpenCode spec)
> **Status:** Proposed — not yet owned.

## Why / Problem

"One owner per change" needs an ATOMIC claim so two concurrent sessions cannot own the same change. A YAML
owner field or separate Git checkouts are NOT an atomic lock. The repo already has fleet dispatcher surfaces
(`bin/sync-paperclip-fleet.mjs`, Paperclip, `bin/openspec-paperclip-sync.ts`) that should provide/record the claim.

## Evidence / Assumptions

- Existing: Paperclip owns tasks/budgets/approvals; `openspec-paperclip-sync.ts` links OpenSpec ↔ Paperclip.
- Assumption: the claim can be recorded in a version-compatible sidecar (e.g. `openspec/changes/<id>/owner.json`)
  plus the existing dispatcher's atomic assignment; absent a real lock, serialize assignment.

## Proposed Improvement

Define an owner sidecar schema (owner instance/session id, state, dependencies, allowed write areas,
`claimed_at`, handoff log) + a small checker that reads/validates it; integrate claim/release/transfer with
the existing dispatcher (Paperclip) so duplicate ownership is prevented atomically; serialize conflicting
changes; implement explicit handoff (end prior ownership before the replacement proceeds).

## Expected Benefit

Enforceable single-ownership across concurrent sessions; safe handoff across compaction/resume.

## Scope / Priority / Dependencies

Scope: owner sidecar + checker + dispatcher integration + serialization + handoff. Priority: high.
Dependencies: `agent-change-ownership-policy`; coordinates with `agent-ownership-checkpoint-hooks` (reads owner state).

## Acceptance

Two agents cannot simultaneously claim the same change via the dispatcher; conflicting changes serialize;
handoff transfers the entire remaining change and ends prior ownership; the sidecar validates; ownership
survives compaction/resume.
