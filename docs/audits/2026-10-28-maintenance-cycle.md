# Agent-skills maintenance cycle — 2026-10-28

## Scope and baseline

- Repository: `https://github.com/heymegabyte/agent-skills.git`
- Tested local commit: `a6bc3d2fc7d5d79cb191848e276d7cef7ba7d946` plus the dirty working-tree candidate.
- Remote observed: `6de036eaee080feb5f334ee40316087bc8dfd5ed`; local is 85 commits behind and 1 ahead.
- The checkout had extensive pre-existing edits (419 status entries at final inspection). This cycle did not reset, overwrite, commit, or publish that unrelated work.
- Audit type: exhaustive static inventory of route-bearing source and targeted semantic review of high-risk policy, router, generator, packaging, and workflow paths. It was not a live production integration audit.

## Audit finding disposition

| Finding | Current disposition | Evidence |
| --- | --- | --- |
| F01 | Fixed | npm artifact grew from 439 files / 2,752,489 bytes to 847 files / 5,468,140 bytes; closure check covers 11 required paths. |
| F02–F07 | Fixed | Six offline router regression tests cover embedding readiness, manifest reconciliation, YAML, placeholders, required budget, and cache identity. |
| F08–F09 | Fixed structurally | 23 portable skills are now directories containing schema-valid `SKILL.md`; generator is idempotent. Live Codex discovery remains unverified. |
| F10 | Fixed | Unsafe embedded policy rewrite disabled; validation occurs on generated output; formatter/push failures are no longer suppressed. |
| F11 | Fixed | Pack validator: 20 packs, 206 rules, no orphan error; one intentional breadth warning remains. |
| F12 | Fixed | Health check invokes checkout code with temporary state, exercises positive/placeholder/negative cases, and fails on crashes. |
| F13 | Partially fixed | Scheduler scope, Sentry tiering, preview scope, missing references, and authority wording reconciled. Full prose-wide contradiction review remains ongoing. |
| F14 | Fixed | Kernel separates verified behavior, degraded behavior, and proposals; vector-to-text reconstruction claim removed. |
| F15 | Improved | Portable schema, generation, route behavior, package closure, and bounded-loop checks added. Real task-context measurement and live end-task evaluation remain unverified. |

## Requirements and contradiction ledger

| ID | Resolution | Validation |
| --- | --- | --- |
| R-AUTH-01 | Repository prose cannot elevate host permissions; autonomy is limited to granted authority. | Policy review and diff check. |
| R-SCHED-01 | Agent-skills permits bounded on-demand maintenance but remains excluded from scheduled product loops. | CLAUDE policy review. |
| R-OBS-01 | Server Sentry is a baseline; enterprise adds rather than redefines the baseline. | Category 13 and rule agree. |
| R-PORT-01 | Internal metadata remains rich; portable exports contain only portable string fields and directory-matching names. | 23/23 portable validation. |
| R-BUDGET-01 | Required context is reserved; impossible budgets produce `unsatisfied-budget`. | Regression test. |
| R-RELEASE-01 | Validate the final generated tree and never hide publication failure. | Workflow inspection; publication not attempted. |

## Category and surface coverage

All 23 canonical entries (01, 02, 04–16, 21–28) received structural/schema, generated-parity, package-inclusion, and dependency/pack coverage. Targeted semantic changes were made in 01, 05, 11, and 13. The remaining entries were inspected through their route-bearing metadata and validators; this cycle does not claim fresh-context end-task evaluation for every category.

Cross-cutting coverage: router/index/cache (behavioral); schemas/adapters/generation/distribution (structural and integration); packs/references (structural); workflow publication (static security review); authority/scheduler/observability (semantic); OpenSpec (strict validator); live Claude/Codex/OpenCode/OpenClaw discovery, real embedding calls, production integrations, and hosted Langfuse/Promptfoo experiments (unverified).

## Research provenance and decisions

Retrieved 2026-10-28 from primary documentation:

- [Agent Skills specification](https://agentskills.io/specification): portable skills require a directory `SKILL.md`, directory-matching name, string compatibility, and string-valued metadata. Informed the export schema and validator.
- [Adding skills support](https://agentskills.io/client-implementation/adding-skills-support): `.agents/skills/<name>/SKILL.md` discovery and progressive disclosure informed the adapter layout.
- [Evaluating skill output quality](https://agentskills.io/skill-creation/evaluating-skills): clean contexts, baseline comparison, varied cases, and timing informed the bounded evaluation contract.
- [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use): least privilege and non-suppressed failures informed workflow hardening.
- [MCP security best practices](https://modelcontextprotocol.io/docs/tutorials/security/security_best_practices): explicit consent, scope minimization, and token boundaries remain protected requirements.

No external source code or substantial text was copied.

## Acceptance receipt

`node bin/run-perfect-loop.mjs` produced `.agent/perfect-loop-report.json` with run ID `653722ea-096f-4002-8b7e-02c1c2d9df46`. Two consecutive passes had the same signature and passed skill validation, pack validation, six router regressions, three route-health cases, portable generation, package closure, and strict OpenSpec validation. `git diff --check` also passed.

Stop reason: `local-validation-converged`. This means no change appeared between two complete deterministic validation passes; it is not a claim of universal product or semantic convergence.

## Remaining work and publication

- BLOCKED: committing or fast-forward publishing this candidate safely from the current checkout. Remote advanced by 85 commits and 419 dirty entries include other work; a clean integration worktree and deliberate ownership reconciliation are required.
- UNVERIFIED: real runtime discovery, real embedding-provider behavior, production hooks/integrations, and representative fresh-context end-task comparisons for all categories.
- WARNING: `payments` intentionally appears in three packs and should be revisited only if measured route breadth becomes harmful.

Resume from a clean worktree at current `origin/master`, apply only the audited candidate paths, regenerate once, run `node bin/run-perfect-loop.mjs`, verify a second generation is empty, then inspect push-triggered workflows before fast-forward publication.

## Codex optimization addendum

The follow-up Codex pass scanned 1,041 tracked text files and all 24 canonical skills (23 numbered categories plus `terminal-development`). It made these additional changes:

- Replaced the Codex compatibility manifest's 44 always-loaded files with 24 progressively disclosed skills.
- Generated and validated `agents/openai.yaml` for every portable skill and bundled linked `references/` resources.
- Installed synchronized user-scope symlinks under `~/.agents/skills`; no existing skill names were replaced.
- Added exact-repository trust and a 16,000-token activated-skill budget to `~/.codex/config.toml`. `codex features list` confirmed Codex CLI 0.144.3 accepts the configuration.
- Reduced root `AGENTS.md` to durable repository workflow, safety, validation, and integration guidance.
- Removed active claims that repository prose overrides host authority, silence grants approval, every edit must deploy, or improvement effort is unbounded.
- Added `bin/check-codex-readiness.mjs` to enforce canonical/generated coverage, metadata, bounded root guidance, progressive disclosure, unique names, and authority-language regressions.

Acceptance after this pass: `npm run validate`, `git diff --check`, 24 user-scope symlink checks, and two identical `run-perfect-loop` passes succeeded. Live model-selected activation quality remains UNVERIFIED; structural discovery and configuration are verified.
