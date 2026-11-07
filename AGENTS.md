# Agent-skills repository guidance

This repository is the canonical source for reusable SaaS-product skills. Numbered directories and approved named skills are canonical; `.agents/skills/` and harness manifests are generated.

## Work safely

- Read the closest instructions and inspect `git status` before editing. Preserve unrelated and generated work.
- Host permissions and the user's current request outrank repository prose. Never treat silence as approval for destructive, paid, production, credential, account, or external-communication actions.
- Edit canonical sources, then regenerate. Do not hand-edit generated adapters.
- Agent-skills is excluded from scheduled product loops; bounded on-demand maintenance is allowed.
- Use OpenSpec for material behavior, architecture, security, integration, or migration changes. A designable UI requires approval of its current Figma artifact before implementation.
- Only an agent explicitly assigned the `architect` role for a specific change may author or modify its OpenSpec `proposal.md`, `design.md`, `tasks.md`, or `specs/`; model identity alone is insufficient, and OpenCode is never eligible for architecture work. Record `**Architect Role:** assigned` in proposal and design.

## Route and implement

1. Route substantial work with `bin/skill-router.py`; load the smallest relevant skill set and declared dependencies.
2. Apply repository-owned workflows before generic fallbacks.
3. Implement safe, in-scope low-hanging fruit when evidence and verification are available. Record blocked or approval-required work instead of broadening authority.
4. Treat stack choices as project defaults, not universal requirements. Preserve explicit project architecture and customer-facing inference boundaries.

## Validate

Run narrow checks while iterating. Before integrating shared router, schema, generator, or packaging changes, run:

```bash
python3 -m unittest bin/__tests__/skill_router_test.py -v
node bin/check-route-health.mjs
node bin/gen-codex-skills.mjs --check
node bin/check-package-closure.mjs
scripts/validate-skills.sh
node scripts/validate-packs.mjs
```

Use `node bin/run-perfect-loop.mjs` for a bounded final check. PASS, FAIL, SKIP, BLOCKED, and UNVERIFIED are distinct.

## Integration

- `main` is the normal integration branch, subject to repository policy and current authorization.
- Inspect push-triggered workflows before publishing. Never force-push, blanket-stage, hide push failures, or publish a tree different from the tested tree.
- Use subscription CLI launchers and approved provider routes for development-agent computation. Never copy OAuth credentials or silently substitute paid APIs.

## Paramilitary Fleet Command Doctrine & Autonomous Tools

The repository hosts 24 canonical paramilitary agent roles operating under **Auftragstaktik (Mission Command)**:
- **Canonical Agent Profiles**: Located in `agents/<role>.md` with military call signs, ranks, 3-tier ROE, 4-phase kinetic loops, and machine-verifiable DoD.
- **Authoritative Operational Field Manuals**: Located in `docs/agents/<role>.md` and `docs/agents/README.md`.
- **A2A Communication Protocol**: Governed by `schemas/a2a-handoff.schema.json` and 9-line NATO SITREP reporting (`bin/sitrep-logger.ts` and `bin/sitrep-telemetry.ts`).
- **Autonomous Multi-Agent Tooling**:
  - `bin/fleet-dag-runner.ts`: Acyclic task graph execution engine with collision detection.
  - `bin/agent-preflight.ts`: Automated pre-flight checklist verifier.
  - `bin/pace-failover.ts`: 4-tier PACE model resilience switcher.
  - `bin/worktree-sandbox.ts`: Git worktree isolation manager for subagents.
  - `bin/self-healing-runbook.ts`: Automated error diagnosis and recovery engine.
  - `bin/agent-circuit-breaker.ts`: Circuit breaker for retry loops.
  - `bin/polyglot-4way-swarm.mjs` & `rules/polyglot-4way-parallel-swarm-and-auto-goal.md`: Mandatory 4-engine massive parallel polyglot swarm (`12` Claude + `16` Codex + `8` Gemini + `40` OpenCode = `76` concurrent workers) and automatic end-of-round `/goal` execution enforced by `bin/antigravity-hook.mjs`.
  - `rules/principal-architect-nomenclature.md`: Principal Architect ("Nincy-Nancy Architect") Nomenclature & Anti-Scaffolding Discipline — bans generator tags (`deep-domain-v2`, `*DeepDomainSpec`), wave/task codes in source (`M613`, `Wave 13`), and numeric count identifiers (`*_16_VISUAL_STATES`), enforcing semantic architectural naming (`*ModuleSpecification`, `*_MODULE_SPECIFICATION`, `verify*ModuleInvariants`, `InteractionStateToken`, `INTERACTION_STATE_TOKENS`, `*_INTERACTION_STATE_TOKENS`, `COMPONENT_INTERACTION_STATES`).


