# Proposal: OpenSpec Global Integration for the Four Agents

> **Architect:** claude (hydrated frontier context — non-OpenCode spec)
> **Status:** Proposed — not yet owned.

## Why / Problem

OpenSpec v1.15.0 is installed and initialized in the agent-skills repo, but global integration/instruction
generation for Codex, Gemini, and OpenCode is not confirmed to run via `openspec update`, and
bootstrapping/schema guidance for new projects does not yet encode the one-owner philosophy.

## Evidence / Assumptions

- `openspec` CLI (v1.15.0): `init` / `update` / `change` / `archive` / `spec` / `config` / `schema` / `store`.
  `openspec update` updates instruction files; `openspec init --tools claude,codex,gemini,opencode,agents`
  initializes for all four harnesses.
- Assumption: project-local OpenSpec stays in each project; global config applies to the four agents.

## Proposed Improvement

Run/verify `openspec update` for the four agents; make `openspec init --tools claude,codex,gemini,opencode,agents`
the bootstrap default; fold the ownership philosophy into project OpenSpec templates + applicable schema
guidance (proposal/spec/design/tasks). Keep project ideas/changes in each project's OpenSpec location.

## Expected Benefit

Consistent OpenSpec availability + ownership-aware templates across all four agents and new projects.

## Scope / Priority / Dependencies

Scope: global OpenSpec integration + bootstrap templates (not project-specific changes). Priority: medium.
Dependencies: `agent-change-ownership-policy` (the philosophy it templatizes).

## Acceptance

Each agent exposes the OpenSpec workflow; `openspec validate` passes on a fresh fixture project initialized
with the four tools; new-project bootstrap includes the ownership invariant; re-run adds no duplicate
instruction blocks.
