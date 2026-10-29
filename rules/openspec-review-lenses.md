---
last_reviewed: 2026-10-29
superseded_by: null
name: openspec-review-lenses
description: Spec-Kit's review practices (clarify · requirements-quality checklist · cross-artifact analyze · constitution-check) absorbed as LENSES folded into the existing OpenSpec/opsx workflow — not a competing .specify tree
pack: "thinking"
priority: 3
triggers:
  - "openspec"
  - "spec kit"
  - "clarify requirements"
  - "requirements checklist"
  - "analyze change"
  - "cross-artifact"
---

# OpenSpec Review Lenses (Spec-Kit practices, absorbed)

Spec-Kit's best review practices, absorbed INTO the OpenSpec/opsx workflow as review LENSES (§3.4) — NOT a competing `.specify` feature tree (§3.5). opsx remains the workflow (`new`/`propose`/`continue`/`apply`/`verify`/`sync`/`archive`); these lenses sharpen specific steps. Apply the lens, never a parallel toolchain. Absorbed from github/spec-kit per `rules/upstream-absorption-register.md`.

## Clarify (at `explore` / `propose`) — already native to opsx

- opsx `explore` ("clarify requirements") IS the clarify step. Resolve MATERIAL ambiguity before artifacts are finalized; for low-risk details, document the assumption + proceed (don't block on trivia).

## Requirements-quality checklist (at `propose` / `continue`) — GAP opsx didn't name

- Before artifacts are "done," check the proposal against 8 dimensions: **coverage** (every required behavior) · **clarity** (unambiguous + testable) · **observability** (how success is measured) · **edge cases** (empty / error / limit / concurrent) · **permissions** (authz + tenant boundary) · **errors** (failure modes + recovery) · **compatibility** (back-compat + migration) · **non-goals** (explicit out-of-scope).
- A dimension that doesn't apply gets a one-line "N/A + why," never silence.

## Cross-artifact analyze (BEFORE `apply`) — GAP: opsx `verify` is the POST-impl check

- Run a READ-ONLY consistency pass across the change's artifacts (proposal ↔ design/plan ↔ tasks ↔ dependencies ↔ planned verification) BEFORE implementing — against the EFFECTIVE intended behavior (delta applied to the baseline), not the delta alone (§4.1).
- Report requirement↔task↔test links, contradictions, orphan tasks, missing dependencies, and severity. Distinct from opsx `verify`, which checks the IMPLEMENTATION matches artifacts AFTER coding.

## Constitution-check (at `propose` + `apply`)

- Confirm the change complies with the effective policy / acceptance gates (`prompts/converge-agent-ecosystem.md` § Acceptance gates): evidence-backed completion, tenant isolation, secrets, main-first, honest blocked/failed states.
- Convergence findings are APPEND-ONLY — add missing in-scope work; NEVER rewrite the accepted spec to make a failing implementation pass, and never lower a gate to claim convergence (§2.3 / §3.4).

## Guard

- These are lenses ON opsx, not new artifacts. Do NOT install Spec-Kit's `/specify` / `/plan` / `/tasks` commands or a `.specify` tree beside OpenSpec (§3.5) — adapt the PRACTICE, keep ONE artifact model.

## Cross-links

- `prompts/converge-agent-ecosystem.md` (the acceptance gates the constitution-check enforces) · `rules/openspec-operating-contract.md` (the lifecycle these lenses sharpen) · `rules/upstream-absorption-register.md` (spec-kit = EVALUATE → absorbed here) · `.claude/commands/opsx/` (the workflow itself).
