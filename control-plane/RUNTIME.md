# Fleet coding-turn contract

## Converged control-plane operations

Architecture review follows the role, fallback, and evidence-strength contract in `control-plane/CONFERENCE-REVIEW.md`. A simulated adapter proves mechanics only; a `live` claim requires an observed approved provider invocation receipt. Combined-role and sequential-single-agent modes remain explicitly non-independent, and protected-risk work blocks rather than degrading its authority or review gate.

The shared execution envelope, Paperclip reconciliation plan, exact-cent budget reservation, durable event inbox, OpenClaw wake, trace receipt, terminal outcome, and evaluation scorecard are exercised by `node --test tests/control-plane-canary.integration.test.ts`. Paperclip lifecycle and assignment remain authoritative. Disable authoritative writes and event dispatch to return to shadow mode; receipts remain immutable diagnostic evidence.

Run `node bin/paperclip-upgrade.ts --host-inventory ubuntu.megabyte.space` for read-only version and backup evidence. Upgrade promotion requires the guarded scratch-rehearsal receipt in `control-plane/PAPERCLIP-UPGRADE.md`; rollback retains both prior application and data references. Unknown live capabilities remain `UNVERIFIED`, never `PASS`.

GitHub owns scheduling and run history. Work in the provided isolated worktree; repository-local AGENTS.md, CLAUDE.md, requirements and loop command define the task. Main is normal. Commit verified work; the outer wrapper performs ordinary fast-forward publication. Never reset unrelated state or force-push.

Read only relevant skills/resources on demand. Website deployment, SEO and visual gates apply to website delivery, not machine setup, documentation or unrelated native applications. Machine preferences come from ~/.config/agent-fleet/machine.json; inspect the full machine profile only when the task needs host configuration.

OpenClaw delegates through official Codex/Claude CLIs and Claw Router; native CLI tools, auth and compaction remain available. OpenCode/DeepSeek uses DEEPSEEK_API_KEY directly through get-secret. Never use paid OpenAI/Anthropic API fallbacks or Cloudflare AI Gateway for local compute. Simple interactive work may use the native CLI directly without orchestration.

Use context.json as a bounded index of project surfaces, previous receipts and retained worktrees. Verify current files/commits; prior success is not publication evidence. Do not bulk-read ledgers, other projects' transcripts or credentials. If interrupted, preserve actual state for the next GitHub tick; there is no durable execution queue or blind retry.

Write the required JSON report with observed majorActions, tests (command/status/evidence), deployment (status/url), warnings and nextActions. Empty/unknown stays unknown. Do not export secrets to Actions command files; do not expose keys, raw CLI transcripts or command arguments in reports. Stop by the propagated deadline. The adapter also enforces this deadline on child processes.

## Scoped platform convergence

When working on a product or migration source listed in `reference/platform-stack.json`, or their shared infrastructure, read `rules/platform-shared-capabilities.md` from this checked-out shared revision, then the relevant modules and `prompts/platform-convergence.md`. Load `_packs/platform.yml` when the whole shared capability set is involved. These scoped user choices supersede conflicting older stack defaults.

Record the policy revision and capability status/evidence in the required report. Use the existing deadline and budgets; require a complete browser-verified theme.tools UI scaffold before feature depth, plus license/runtime checks, tenant-safe authorization and complete journey evidence. Prioritize the highest-value ready slice and checkpoint blockers. On skills changes, run `python3 scripts/check-platform-policy.py` plus existing validators. Update consumer pins only after compatibility checks and record acknowledgements; a canonical commit is not proof of host sync. Do not create a new schedule or silently replace the existing loop infrastructure.

## Run the evidence-gated pipeline from a host

Provide a trusted local JavaScript or TypeScript module exporting
`createPipelineAdapters(input)` and a JSON file containing the pipeline input.
The module supplies the approved model, research, architect assignment, OpenSpec
compiler, scheduler, and verification adapters. Configure reuse persistence and
improvement refresh in that module when the run calls for them.

```bash
bun bin/evidence-gated-orchestrator.ts \
  --adapters /absolute/path/to/host-adapters.ts \
  --input /absolute/path/to/pipeline-input.json
```

The command emits the run result as JSON after integration and verification.
Keep adapter diagnostics on stderr. Select the adapter module from trusted
local configuration. Its code runs with the host process's permissions.

A host that approves the local Codex CLI can use
`createLocalCodexDeliberation` from `bin/local-codex-deliberation.ts` for its
Codex provider rail. It uses an ephemeral, read-only session, supplies the
prompt on stdin, and returns a provider result only after observing a completed
turn and its session ID. Route other model families through their own approved
adapters.

Set `routeSliceSkills: createLocalSliceSkillRouter(skillsRoot)` in the host adapter
module to use the installed Python skill router. Choose the trusted skills
checkout explicitly. The adapter reads up to six trigger-matched documents
offline and supplies up to 8,000 characters per document to the synthesis call.

For automatic research, use `createLocalCodexResearch` from the same module
and add `approved:local-codex-live-search` to the input's approved research
rails. The adapter selects evidence from observed native web search events
and rejects model-selected URLs absent from those events.
