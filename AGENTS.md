# Agent-skills repository guidance

This repository is the canonical source for reusable SaaS-product skills. Numbered directories and approved named skills are canonical; `.agents/skills/` and harness manifests are generated.

## Work safely

- Read the closest instructions and inspect `git status` before editing. Preserve unrelated and generated work.
- Host permissions and the user's current request outrank repository prose. Never treat silence as approval for destructive, paid, production, credential, account, or external-communication actions.
- Edit canonical sources, then regenerate. Do not hand-edit generated adapters.
- Agent-skills is excluded from scheduled product loops; bounded on-demand maintenance is allowed.
- Use OpenSpec for material behavior, architecture, security, integration, or migration changes. A designable UI requires approval of its current Figma artifact before implementation.

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
