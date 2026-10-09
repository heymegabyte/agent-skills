# Validation record — 2026-10-09

- `python3 -m unittest discover -s control-plane/tests -v`: **36 passed** (including captured-plugin path regression; see test output for duration). Controlled providers and temporary real git remotes; no production mutations from tests.
- `node --check control-plane/openclaw-fleet/index.js` and `git diff --check`: passed.
- Live OpenClaw health: healthy after idle Gateway restart on installed OpenClaw 2026.9.8.
- Live Codex Gateway probe: read RUNTIME.md through native CLI tools and returned FLEET_CLI_OK.
- Live Claude Gateway probe: read RUNTIME.md through native CLI tools and returned FLEET_CLAUDE_OK.
- Live skills catalog for explicit `main` agent: openclaw-integration eligible; placeholder my-skill absent.
- Skills doctor: no metadata/link errors. Twenty-four shared top-level skills linked to every configured runtime and all three Claude profiles. Inventory also recognizes the repository's nested Emdash skill, which is not installed globally.
- Runner API: three persistent runners online and idle before configuration rollout. Bricklabor repository access added without replacing existing runner-group approvals.
- Existing protected Infisical runner identity integrated; known-secret existence lookup passed. DeepSeek key is absent from the configured folder: direct live DeepSeek verification remains blocked. Fake-provider tests validate its stdin/adapter contract only.

Workflow execution results are authoritative in GitHub Actions. Callers are propagated to the tested immutable implementation revision after this commit; subsequent documentation-only updates need not repin unchanged execution code. Private machine README contains operational recovery steps. No website deployment or Cloudflare provisioning occurred.

First live workflow verification:
- [megabyte.space / Claude](https://github.com/heymegabyte/megabyte.space/actions/runs/38002669136): success; submodule worktree retained without a false cleanup failure.
- [projectsites.dev / Codex](https://github.com/heymegabyte/projectsites.dev/actions/runs/38002666704): native execution exited zero, but completion validation rejected an unknown deployment URL represented as JSON null. Fixed by normalizing null deployment fields to empty unknown values, with a regression assertion. Invalid object/list types and unsafe URLs still fail. Compute evidence is now collected before validating the completion report.

Runner security audit: leaking bulk-export hooks removed from all three workers, idle runners restarted, runner-ops source repaired. Five new tests cover hook preservation/removal and private CLI broker transport. See incident-containment.json for bounded non-secret scan metadata. Provider credential rotation remains outstanding.

Packaged runtime discovery: OpenClaw captures plugin files outside the git checkout. Adapter revision can therefore be unknown even while code is correct; adapterSha256 now identifies the exact executing snapshot. The direct DeepSeek wrapper is resolved from the machine profile's canonical skills checkout, with a captured-plugin regression test. Source checkout HEAD alone is not proof of captured adapter identity.

## Completed rollout

| Verification | Result | Evidence |
| --- | --- | --- |
| projectsites.dev / Codex | Success | [Actions run](https://github.com/heymegabyte/projectsites.dev/actions/runs/38003657648) |
| megabyte.space / Claude | Success | [Actions run](https://github.com/heymegabyte/megabyte.space/actions/runs/38003663261) |
| bricklabor.com onboarding / Codex | Success | [Actions run](https://github.com/heymegabyte/bricklabor.com/actions/runs/38003666317) |
| runner-ops individual Infisical broker | Success | [Actions run](https://github.com/heymegabyte/runner-ops/actions/runs/38003668735) |

These were read-only verification turns. All three project artifacts were downloaded and checked: success, expected runtime, unchanged base/result commit, summaries present. Recovery packets measured 952–1953 bytes; this measures only packets, not total model context. All four completed verification logs had zero unmasked sensitive environment headers in the targeted scan. It is not a general proof that arbitrary future model output cannot leak secrets.

Final implementation pin: `1b470770b58a8dcafbb7a46b802e85bef914590d` in all five callers. All five workflows active; three runners online, no failed user units, Gateway healthy. The final captured-plugin live probe passed with native Codex tools and an adapter SHA256 matching the canonical source file. Thirty-six regression tests passed in 10.895 seconds. Subsequent documentation-only commits do not change the execution pin. See live-validation.json for structured observations.
