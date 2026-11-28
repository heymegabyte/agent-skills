# Fleet coding-turn contract

## Converged control-plane operations

Architecture review follows the role, fallback, and evidence-strength contract in `control-plane/CONFERENCE-REVIEW.md`. A simulated adapter proves mechanics only; a `live` claim requires an observed approved provider invocation receipt. Combined-role and sequential-single-agent modes remain explicitly non-independent, and protected-risk work blocks rather than degrading its authority or review gate.

The shared execution envelope, Paperclip reconciliation plan, exact-cent budget reservation, durable event inbox, OpenClaw wake, trace receipt, terminal outcome, and evaluation scorecard are exercised by `node --test tests/control-plane-canary.integration.test.ts`. Paperclip lifecycle and assignment remain authoritative. Disable authoritative writes and event dispatch to return to shadow mode; receipts remain immutable diagnostic evidence.

Run `node bin/paperclip-upgrade.ts --host-inventory ubuntu.megabyte.space` for read-only version and backup evidence. Upgrade promotion requires the guarded scratch-rehearsal receipt in `control-plane/PAPERCLIP-UPGRADE.md`; rollback retains both prior application and data references. Unknown live capabilities remain `UNVERIFIED`, never `PASS`.

GitHub owns scheduling and run history. Work in the provided isolated worktree; repository-local AGENTS.md, CLAUDE.md, requirements and loop command define the task. Main is normal. Commit verified work; the outer wrapper performs ordinary fast-forward publication. Never reset unrelated state or force-push.

Read only relevant skills/resources on demand. Website deployment, SEO and visual gates apply to website delivery, not machine setup, documentation or unrelated native applications. Machine preferences come from ~/.config/agent-fleet/machine.json; inspect the full machine profile only when the task needs host configuration.

OpenClaw delegates through official Codex/Claude CLIs and Claw Router; native CLI tools, auth and compaction remain available. For bounded implementation, use the approved OpenCode DeepSeek launcher through LiteLLM by default. The direct DeepSeek route uses the separate DEEPSEEK_API_KEY via get-secret as a fallback. Follow `rules/agent-provider-policy.md` and record the route actually observed. Never use paid OpenAI/Anthropic API fallbacks or Cloudflare AI Gateway for local compute. Simple interactive work may use the native CLI directly without orchestration.

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

Use `createModelImprovementReview` from `bin/model-improvement-review.ts`
for a live discovery adapter. Supply a refresh snapshot with reviewed evidence
excerpts and an assessment callback that independently sets scope, scores, and
authority. The provider proposes evidence-backed work. The host and admission
evaluator decide which proposals enter supplemental OpenSpec execution.

### Review accepted implementation for reuse

In the trusted adapter module, set `reuseProposalRoots` to the approved
checkout roots for `theme.tools`, `install.doctor`, and `agent-skills`.
The built-in reviewer uses the configured Codex provider to review frozen
OpenSpec artifacts. To add accepted implementation, construct the scheduler
with `createApprovedProcessAdapter` and supply `approveReusePath(node, path)`
using the host's disclosure policy. Approve specific changed source paths
whose committed contents may be sent to the reviewer. Leave the option unset
if the run lacks that approval.

The process adapter reads regular text blobs from the accepted Git commit.
Its `sourceDigest` callback must report the full accepted commit ID, and
the worktree must contain that commit. For workers that only edit files, set
`snapshotGitBeforeAcceptance: true` on the approved process adapter. It seals
the owned Git changes before checks, checks the committed diff against its
base, and verifies that the commit stays clean and unchanged through
integration. Acceptance commands run on the clean snapshot. The reader skips
unapproved paths and limits the returned text to 32 KiB. For a scheduler that
uses another source representation, supply a trusted
`readAcceptedReuseEvidence` adapter that returns bounded excerpts bound to its
accepted source digest.

The coordinator asks for implementation reuse review before integration and
writes proposals from the successful attempt after integration. Inspect
`reuseExtractions` for the reviewer session, contract digest, destination,
proposal path, and commit-qualified citation. `refreshImprovements` receives
those findings in the same run. Proposal persistence preserves the candidate
for admission. Authority to implement and publish any destination change
comes from the host's OpenSpec admission policy.

Use `createModelOpenSpecPlanner` from `bin/model-openspec-planner.ts` in the
host compiler to request a JSON change plan from the assigned architect.
The host supplies the approved launcher for that assignment, reviews the
proposed paths and dependencies, assigns execution settings, and materializes
the Markdown before the coordinator freezes the contracts. Keep the planner's
session ID with the host compiler receipt.

Set `compileOpenSpec: createModelOpenSpecCompiler({ plan, approve, materialize })`
to assemble that planner into the host compiler. The approval callback reviews
all proposed ownership and dependencies and supplies the architect assignments,
execution leases, provider, and acceptance commands. The materializer receives
the complete approved Markdown batch and architect session ID. Persist the batch
through the host's repository write boundary and retain the session receipt.

A materializer that commits the OpenSpec batch may return the full Git commit
ID. The coordinator checks that it matches the current commit, descends from
the researched revision, and contains the exact compiled artifacts. Worker
contracts then use that revision so isolated worktrees contain the OpenSpec
files.

For a dedicated local Git checkout, pass `materializeLocalOpenSpec` from
`bin/local-openspec-materializer.ts` as the compiler's materializer. It
commits only new approved artifacts using an isolated index, records the
architect session in the commit, and fast-forwards the clean host checkout.

Set `verify: createModelDeliveryVerification({ provider, families, evidence })`
from `bin/model-delivery-verification.ts` to use independent model verdicts.
Supply the host-approved evidence from the integrated revision. Each reviewer
gets the same contract, acceptance exit codes, and approved evidence in a
separate session. The coordinator retains the model family, session ID, and
request and response digests. Configure two distinct families for independent
or protected-risk runs.

Use `createLocalClaudeDeliberation` from `bin/local-claude-deliberation.ts`
with the approved `bin/with-subscription-cli.sh` launcher for a second local
review family. The adapter disables tools and MCP, uses stdin, and requires a
successful Claude result with a session ID.

For local Git hosts, use `createLocalDeliveryEvidence({ checkout, approvePath })`
from `bin/local-delivery-evidence.ts` for the final review evidence callback.
It selects approved changed paths from each recorded integration commit
reachable from the host HEAD and cites them as `commit:path`.
