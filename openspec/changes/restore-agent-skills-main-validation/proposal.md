# Proposal: Restore Agent-Skills Main Validation

> **Architect:** codex
> **Architect Role:** assigned

## Why

The live `main` revision has nine independent validator failures spanning pack ownership, formatting, agent routing, stated counts, cross-links, routing budgets, fingerprint vocabulary, and manifest recovery. These failures prevent safe publication of otherwise verified changes.

## Scope

- Repair canonical pack and rule metadata without suppressing validation.
- Restore agent fallback metadata and mechanically formatted JSON.
- Reconcile entry-document counts from tracked repository truth.
- Replace stale cross-links with live canonical concepts.
- Tier domain rules so only genuinely universal policy is always eligible.
- Emit the four shared-platform concern fingerprints from concrete dependency/content signals.
- Restore website-manifest recovery for the canonical theme-tools rule.
