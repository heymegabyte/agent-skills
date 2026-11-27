# Design: Agent Ownership Checkpoint Hooks

## Mechanism (Claude Code, canonical plugin-hook wiring)
- agent-skills is an installed Claude Code plugin; plugin hooks are declared in `hooks/hooks.json`
  (declarative → idempotent: re-applying the manifest creates no duplicate handler). This is additive to,
  and does not touch, the user's `~/.claude/settings.json`.
- Two new hooks (both read-only, bounded, recursion-safe, launch no model, emit agent CONTEXT on stdout):
  - **SessionStart** → `hooks/openspec-ownership-session-start.sh`: surfaces the change-ownership invariant
    and, when the cwd is an OpenSpec repo, lists active changes (`openspec list`) + claimed changes
    (`bin/change-ownership.ts list`). Satisfies §6 "session start: load policy + inspect active work."
  - **PreCompact** → `hooks/openspec-ownership-precompact.sh`: reminds the agent to persist
    owner/progress/recommendations into OpenSpec before compaction. Satisfies §6 "before compaction/handoff."

## Scope boundary (intentional — per "hooks do not launch a model after every tool call")
- **before-dispatch** readiness/ownership/conflict is enforced by `bin/change-ownership.ts claim`
  (refuse-on-conflict, exit 3) — not a per-tool-call model hook.
- **before-completion** reconcile is left to the existing `agentskills-stop-gate.sh` (not modified here to
  avoid disturbing its behavior); a future change may extend it.
- **Other agents** (Codex / Gemini CLI / OpenCode) have different hook surfaces; this change implements
  Claude Code. Porting is a documented follow-up.

## Activation
- Plugin-hook changes take effect when Claude Code reloads the plugin (new session / restart). The config
  is complete + verified here (scripts run standalone, manifest is valid JSON with single entries); the
  only remaining step is a Claude Code restart to load the new SessionStart/PreCompact handlers.
