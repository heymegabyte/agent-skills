# Proposal

## Problem

Large repository packs improve child-agent analysis but returning the pack, transcript, or free-form report poisons the parent context. The existing Repomix wrapper safely creates packs but does not execute DeepSeek analysis or enforce a stable return contract.

## Change

- Add a versioned JSON Schema for compact repository-analysis summaries.
- Add a compiler that creates/reuses a guarded Repomix pack, attaches it to OpenCode/DeepSeek, extracts the model's JSON from OpenCode events, validates and size-limits it, and atomically returns only structured JSON.
- Require additive backwards-compatible schema evolution within major version 1; breaking changes require a new major schema and explicit consumer negotiation.
- Wire the compiler into context-hydration and parent/worker doctrines.

## Rollback

Parents may bypass the compiler and use the existing `repomix-pack.sh` directly. No repository data or persistent migration is involved.
