# ADR-0002: Tooling-fabric current-sources verification + corrections

## Status

**Accepted** (verification pass, 2026-10-10). Supplements — does not supersede — ADR-0001.
Re-verifies the five-tool fabric against current (2026) primary sources before the remote/rollout
phases, and corrects assumptions that drifted. Tracker: `.claude/run-the-loop/CONVERGENCE-tooling-fabric.md`.

## Date

2026-10-10

## Context

ADR-0001 landed Pass 1 (foundation) months prior. Before the gated/remote phases (Agent Vault daemon,
OpenTofu import, GitHub OIDC, project rollout) act on Pass-1 assumptions, this pass re-checks each tool's
official current docs. Two findings are safety-material (OpenTofu R2 locking; Agent Vault identity/claims).
Local re-verification this session: `mise tasks ls` → all 21 tasks load; `bin/semgrep-scan.sh --test` →
5/5 custom-rule fixtures pass; all fabric scripts present.

## Findings + corrections (each with source)

### OpenTofu — R2 native locking is NOT safe (correction, safety-material)
- **Issue #4405 is CLOSED "not planned"; fix PR #4437 closed unmerged.** S3/R2 native `use_lockfile`
  can 412 against the lock it just created and leave an orphaned `.tflock`. Maintainers deferred it to
  the aws-sdk/R2 layer. → **Do NOT make Cloudflare R2 `use_lockfile` the canonical state backend.**
  Validates the local-on-primary lean (Ask `opentofu-state-backend-locking`). `pg` backend uses Postgres
  advisory locks (auto-released) but has **no `force-unlock`** — note if chosen for multi-machine.
  https://github.com/opentofu/opentofu/issues/4405 · https://github.com/opentofu/opentofu/pull/4437
- State/plan **encryption GA since 1.7** (`aes_gcm`; `pbkdf2` ≥16-char passphrase or a KMS key provider;
  `fallback` block = one-way rotation). **Key loss ⇒ unrecoverable state.** Enable only with an
  Infisical-sourced key + a *tested* recovery procedure. https://opentofu.org/docs/language/state/encryption/
- `tofu test` plan-only via `command = plan`; `validate -lint=all`; `init -backend=false`;
  `providers lock -platform=linux_amd64 -platform=darwin_arm64` (matches our `.terraform.lock.hcl`).
- **Cloudflare provider current stable = `cloudflare/cloudflare` v5.27.0** (env auth `CLOUDFLARE_API_TOKEN`).
  Pin this in `templates/opentofu`. https://github.com/cloudflare/terraform-provider-cloudflare/releases

### Infisical / Agent Vault — identity + claims corrections
- **"Agent Vault" ≠ "Infisical Agent."** Agent Vault = the **Preview/MIT HTTP credential proxy** (strips
  agent-supplied dummy creds like `__anthropic_api_key__`, injects the real secret server-side);
  `unmatched_host_policy=deny` (strict-deny/403) and passthrough-default are confirmed, and it can be
  **backed by Infisical** as the credential store. The *Infisical Agent* is a separate secret-rendering
  daemon. Our `agent-vault.services.yaml` + `rules/agent-vault-brokering.md` target Agent Vault correctly.
  https://github.com/Infisical/agent-vault
- **No documented outage/last-good snapshot-age behavior** and **no documented same-host-vs-separate-host
  isolation model** for Agent Vault upstream. → Doctrine must (a) report staleness as a **known gap**, not
  promise a snapshot-age surface that doesn't exist upstream; (b) **not claim same-host hardening equals
  separate-host isolation** (honest residual-risk note already required by Ask `agentvault-host-model`).
  It is **Preview ("API subject to change")** — pin/verify before fleet reliance.
- GitHub OIDC: `permissions: id-token: write` required. **`job_workflow_ref` is bound via the generic
  Claims map** (Infisical has no dedicated field) — or customize GitHub's `sub` with
  `include_claim_keys`. Informs Ask `github-oidc-trust-binding` implementation.
  https://infisical.com/docs/documentation/platform/identities/oidc-auth/github
- Infisical **OpenTofu provider exists** (`Infisical/infisical` v0.19.37; `value_wo`/ephemeral keep
  secrets out of state) — use for infra credential refs, never commit values.

### Semgrep / Serena / mise — confirmations (no change needed)
- Semgrep: standalone `semgrep/mcp` **archived Oct 2025**; `semgrep mcp` (main binary, `-t
  stdio|streamable-http`) is correct — our `.mcp.json` already uses it. CE `--baseline-commit` (our
  `--fast`) + `semgrep --test` fixtures (our 5/5) confirmed. Latest 1.179.x; our 1.180 pin is fine.
  https://github.com/semgrep/mcp
- Serena: repo **still `oraios/serena`**; `start-mcp-server --context claude-code|codex --project-from-cwd`
  is the current worktree-aware invocation (matches `bin/serena-helper.sh`). `.serena/cache/` gitignored;
  memory disabled/scoped via `base_modes: no-memories` or `read_only_memory_patterns` → **supports the
  "local-hints-only, non-authoritative" answer** to Ask `serena-memory-policy`.
  https://oraios.github.io/serena/02-usage/030_clients.html
- mise: current v2026.10.7; `jdx/mise-action@v5` (SHA-pinnable) + `version:` input is the Phase-H CI
  pattern; pin mise ≥2026.10.7 if using `_.file` env (parsing-regression fix). Our pins stand.
  https://github.com/jdx/mise-action

## Decisions (reversible; apply in later passes)

1. R2 native `use_lockfile` stays OUT of the canonical state path; local-on-primary now, pg/other for
   multi-machine (pending the Ask answer).
2. Clarify in `rules/agent-vault-brokering.md`: Agent Vault = Preview proxy, distinct from Infisical
   Agent; remove any implied outage-snapshot-age guarantee; keep `unmatched_host_policy` phased.
3. Phase-H CI uses `jdx/mise-action@v5` SHA-pinned + explicit `version:`; OIDC trust via the Claims-map
   `job_workflow_ref`.
4. Pin Cloudflare provider `v5.27.0` in `templates/opentofu`.
