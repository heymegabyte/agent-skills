# Skill Routing Kernel

This file records verified routing behavior. Proposed experiments belong in a research ledger or ADR, not in executable guidance.

## Implemented

- Canonical source discovery: numbered `*/SKILL.md` entries plus `rules/*.md`.
- Safe YAML frontmatter parsing with duplicate-key and list-type validation.
- Deterministic phrase triggers with `{identifier}` matching one non-space token.
- Project fingerprint, explicit path/scope filters, pack expansion, tool hints, and optional semantic retrieval.
- Mandatory priority-1 reservation before optional selections. An impossible budget returns `status: unsatisfied-budget` and lists the missing required IDs.
- SQLite index records metadata, body, and full embedding-input identity. Missing, corrupt, wrong-model, or wrong-dimension vectors are rebuilt.
- Complete successful metadata scans reconcile changed and deleted sources transactionally.
- Session cache identity hashes canonical project and explicit session IDs; callers without a session ID do not consume session state.
- Generated portable skills use `.agents/skills/<name>/SKILL.md` and contain portable metadata rather than internal source frontmatter.

Implementation: `bin/skill-router.py`. Offline checks: `bin/__tests__/skill_router_test.py` and `bin/check-route-health.mjs`.

## Optional and degraded behavior

- Semantic retrieval is optional. Without credentials, network, or a valid index, deterministic trigger/path/pack/tool routing remains usable.
- Token estimates use a documented character heuristic unless a runtime-specific tokenizer measurement is recorded. Estimates are not claims about actual host context loading.
- Runtime discovery beyond structural portable-layout validation remains `UNVERIFIED` until exercised in an installed isolated runtime.

## Proposed experiments—not active policy

- Hosted vector databases, rerankers, prompt compression, remote skill stubs, or additional routing frameworks require held-out evaluation showing meaningful improvement over the local deterministic baseline.
- Embeddings are retrieval features, never lossless instruction storage. Source text must remain canonical and reconstructable without vectors.
- Unsupported host configuration keys must not appear here as executable settings.

## Acceptance contract

Routing changes must preserve required policy, improve or maintain held-out relevance, remain functional offline, explain selections and exclusions, avoid cross-project/session leakage, and pass generation twice without drift.
