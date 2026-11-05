# Enforce explicit OpenSpec architect-role assignment

> **Architect:** codex
> **Architect Role:** assigned

## Why

Provider identity is not authorization. Existing governance accepted an allowed model label and even defaulted missing metadata to Claude, allowing an unassigned worker to pass the OpenSpec authorship gate.

## What changes

- Require an orchestrator-assigned architect role for OpenSpec architecture authorship.
- Require matching architect and role metadata in proposal and design.
- Keep OpenCode categorically ineligible for OpenSpec architecture.
- Test valid assignment, brand-only metadata, OpenCode, conflicting roles, and conflicting identities.

## Impact

Existing changes without explicit role metadata fail the Paperclip synchronization validator until an assigned architect reviews and attests them.
