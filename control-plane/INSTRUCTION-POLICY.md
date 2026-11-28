# Instruction policy operations

This runbook operates the canonical [`operational-prompt-hydration`](../policies/operational-prompt-hydration.md) policy through supported, user-controlled customization surfaces. It does **not** modify, replace, or claim authority over provider-controlled system or developer instructions.

## Supported layers

| Layer | Examples | Delivery | Evidence |
|---|---|---|---|
| Canonical source | `policies/operational-prompt-hydration.md` | Maintainer edit | Policy ID, version, core digest, source digest |
| Repository instructions | `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `GEMINI.md` | Managed block | Generator check bound to an exact Git revision |
| Harness instructions | Cursor, Windsurf, Copilot, OpenCode and related repository files | Managed block | Same digest across the enumerated targets |
| Generated manifests | Codex, OpenCode, Kimi plugin/config JSON | Owning manifest generator | Generated policy metadata matches the canonical source digest |
| Installed plugin/global files | Tool-supported user configuration | Explicit-source installer, where supported | Installed target, source revision, policy digest and timestamp |
| Coordinator and worker | Approved subscription or brokered launch wrappers | Launch receipt | Actual provider/model, role, surface, source revision and policy digest |
| Paperclip and OpenClaw | Agent profile or explicit wrapper | Profile/wrapper receipt | Never label wrapper behavior as a native prompt hook |

Only Claude currently has a repository-observed native prompt-submission hook. Codex, Gemini, OpenCode, Paperclip and OpenClaw require their documented file, profile, plugin or wrapper path unless a later capability probe proves otherwise. Instruction-file presence is not runtime-loading proof.

The machine-readable target inventory is [`config/instruction-targets.json`](../config/instruction-targets.json). Its authority boundary is `user-controlled-customization-only`.

## Check and project repository targets

Run these commands from any directory inside the selected checkout. They neither read nor print credentials.

```bash
POLICY_REPO=$(git rev-parse --show-toplevel)
POLICY_REVISION=$(git -C "$POLICY_REPO" rev-parse HEAD)

node --experimental-strip-types "$POLICY_REPO/bin/gen-harness-manifests.mjs" \
  --check-publish-instructions \
  --source-root "$POLICY_REPO" \
  --expected-revision "$POLICY_REVISION"

node --experimental-strip-types "$POLICY_REPO/bin/gen-harness-manifests.mjs" \
  --publish-instructions \
  --source-root "$POLICY_REPO" \
  --expected-revision "$POLICY_REVISION"

node "$POLICY_REPO/bin/gen-harness-manifests.mjs"
```

The projection command changes only the exact `<!-- EMDASH:POLICY:BEGIN ... -->` through `<!-- EMDASH:POLICY:END -->` region. Content before and after those delimiters belongs to the target owner and remains byte-for-byte unchanged. Duplicate, unmatched or foreign-digest blocks fail closed; do not repair them by deleting unrelated content.

The final command regenerates generator-owned JSON manifests. Do not hand-edit those adapters.

## Explicit-source fleet preflight

Fleet synchronization never discovers its source through `~/.agentskills`. Select the checkout, revision and installed link explicitly and run the non-mutating preflight first:

```bash
POLICY_REPO=$(git rev-parse --show-toplevel)
POLICY_REVISION=$(git -C "$POLICY_REPO" rev-parse HEAD)
POLICY_INSTALLED_LINK=${POLICY_INSTALLED_LINK:-"$POLICY_REPO/.verification/absent-installed-link"}

node --experimental-strip-types "$POLICY_REPO/bin/sync-fleet-harnesses.ts" \
  --check-source \
  --source-root "$POLICY_REPO" \
  --expected-revision "$POLICY_REVISION" \
  --installed-link "$POLICY_INSTALLED_LINK" \
  --json
```

For an actual installed link, set `POLICY_INSTALLED_LINK` to its exact path before running the command. The deliberately absent repository-local default makes the example safe and read-only. A full fleet sync requires the same explicit arguments without `--check-source`; it performs external mutations and is outside a routine documentation check.

## Update from remote main

Do not update a dirty checkout in place. The following sequence fails before the fast-forward when tracked or untracked work exists:

```bash
POLICY_REPO=$(git rev-parse --show-toplevel)
git -C "$POLICY_REPO" fetch origin main
test -z "$(git -C "$POLICY_REPO" status --porcelain=v1)"
git -C "$POLICY_REPO" merge --ff-only origin/main
POLICY_REVISION=$(git -C "$POLICY_REPO" rev-parse HEAD)
node --experimental-strip-types "$POLICY_REPO/bin/gen-harness-manifests.mjs" \
  --check-publish-instructions \
  --source-root "$POLICY_REPO" \
  --expected-revision "$POLICY_REVISION"
```

If the checkout is dirty, preserve it and create a clean worktree rather than stashing, resetting or deleting work.

## Roll back to a verified revision

Rollback is revision selection plus regeneration, not wholesale file replacement. Set `PRIOR_REVISION` to a previously verified remote commit:

```bash
POLICY_REPO=$(git rev-parse --show-toplevel)
PRIOR_REVISION=${PRIOR_REVISION:?set PRIOR_REVISION to a verified 40-character Git SHA}
ROLLBACK_ROOT=$(mktemp -d "${TMPDIR:-/tmp}/agent-skills-policy-rollback.XXXXXX")
git -C "$POLICY_REPO" worktree add --detach "$ROLLBACK_ROOT/source" "$PRIOR_REVISION"
node --experimental-strip-types "$ROLLBACK_ROOT/source/bin/gen-harness-manifests.mjs" \
  --publish-instructions \
  --source-root "$ROLLBACK_ROOT/source" \
  --expected-revision "$PRIOR_REVISION"
node --experimental-strip-types "$ROLLBACK_ROOT/source/bin/gen-harness-manifests.mjs" \
  --check-publish-instructions \
  --source-root "$ROLLBACK_ROOT/source" \
  --expected-revision "$PRIOR_REVISION"
```

This produces a verified prior bundle in an isolated worktree. Promotion to installed/global targets still requires the supported explicit-source installation path and a receipt. Preserve the worktree until the rollback evidence is reviewed.

## Troubleshooting source selection

| Classification | Meaning | Safe response |
|---|---|---|
| `explicit-source-required` | Source root or revision was omitted | Supply both from the selected checkout |
| `source-revision-mismatch` | HEAD differs from the requested revision | Re-resolve the intended immutable revision; do not guess |
| `dirty-selected-source` | The selected checkout contains unclassified work | Preserve it and use a clean worktree |
| `divergent-selected-source` | HEAD differs from the checkout's `origin/main` | Fetch and reconcile normally; never force-push or silently install it |
| `ambiguous-installed-source` | The installed link is not a symlink or resolves elsewhere | Identify its owner and select the intended checkout explicitly |
| `duplicate-managed-block` | More than one owned block exists | Stop and reconcile ownership; do not delete surrounding instructions |
| `malformed-managed-block` | A delimiter is missing or reversed | Repair only the owned delimiter region after review |
| `foreign-managed-digest` | The block belongs to another canonical digest | Select the correct source or perform an explicit migration |

Validation and controlled fixtures prove generation mechanics. They do not prove that a provider loaded the policy, that a coordinator delegated with it, or that Paperclip/OpenClaw exposes a native hook. Those stronger claims require the runtime receipts described above.

For a known version upgrade, pass `--previous-canonical /absolute/path/to/prior-policy.md`
to the projection command. Use the canonical file from the verified prior
revision. The projector checks the prior digest, policy identity, and entire
installed block before replacing it.
