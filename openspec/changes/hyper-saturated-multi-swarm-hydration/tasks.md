# Tasks

- [x] Implement `auditProductGaps`, `scrumQuorum`, and `swarmExecutionPlan` in `bin/prompt-hydrator.ts` and `schemas/hydrated-prompt.schema.json`.
- [x] Implement `bin/scrum-deliberation-quorum.ts` for right-sized SCRUM meetings and OpenSpec DAG generation.
- [x] Implement `bin/multi-swarm-orchestrator.ts` codifying the Top 15 Claude/Codex/Gemini/OpenCode swarm strategies.
- [x] Author `rules/parallel-multi-swarm-orchestration.md` and enforce multi-swarm + OpenCode (DeepSeek) offload across all `SKILL.md` files via `bin/enforce-multi-swarm-across-skills.ts`.
- [x] Wire `bin/prompt-hydration-hook.mjs` into `~/.claude/settings.json` and `settings.json` and verify all unit tests pass.

## DeepSeek-first dispatch and prompt distribution

- [x] Require concurrent dispatch of dependency-ready work when it shortens delivery at the required quality. Record real constraints on dispatch and premium routing.
- [x] Carry the directive through maintained harness projections, skills, agent definitions and locally launched development prompts. Validate generated outputs and scheduler behavior.
