# Claude live workflow routing

- Harness observed: Claude Code 2.1.197.
- Entry: configured global `UserPromptSubmit` command invokes the installed `prompt-hydration-hook.mjs`.
- Probe: a fresh, non-persistent print session with built-in tools disabled asked for the exact matching workflow rule and reason from hook-provided context.
- Result: the CLI returned subtype `success` and `rules/parallel-multi-swarm-orchestration — trigger-match`.
- Corroboration: invoking the installed hook with the same OpenSpec routing intent emitted the matching rule in `additionalContext`. The installed hook matched commit `508ae0e2`.
- Coverage: Claude instruction routing and delivery of hook context. Live orchestration, the other harnesses, and package release and consumer verification remain open.
