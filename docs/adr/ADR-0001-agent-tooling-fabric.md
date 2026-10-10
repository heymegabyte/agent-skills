# ADR-0001: Agent tooling fabric — mise · Semgrep · Serena · OpenTofu · Agent Vault

## Status

**Accepted** (Pass 1 landed; rollout + control-plane phases tracked in
`.claude/run-the-loop/CONVERGENCE-tooling-fabric.md`).

## Date

2026-10-10

## Context

Five infrastructure/tooling systems were to be integrated into the agent OS and the projects it
drives: **mise** (reproducible toolchain), **Semgrep** (invariants/security), **Serena** (semantic
code intel), **OpenTofu** (IaC), **Infisical Agent Vault** (credential brokering). Not greenfield —
the repo already had a mature self-improving Semgrep lint stack, a reconciled secret doctrine
(`rules/secrets-portable-resolution.md`), a `/run-the-loop` convergence system, and a fleet
architecture (persistent Ubuntu Proxmox VM, GitHub Actions scheduler, OpenClaw, Claw Router).

Constraints that shaped every decision:

- **One primary executor** (Ubuntu VM) + a repo-scoped execution lock — no distributed concurrency yet.
- **macOS (Apple Silicon) dev + Ubuntu x86_64 runner** — every tool must lock for both.
- **Hard provider policy** ([[agent-provider-policy]]): subscription CLIs for Claude/Codex; DeepSeek
  direct; local AI never through Cloudflare AI Gateway; OAuth never moved into a vault.
- **Reuse over rebuild** — do not create a second Semgrep system or a competing secret SSOT.

## Options Considered (per layer — decisive points only)

### mise — front door

- **A: mise owns tool versions + a canonical task graph wrapping existing scripts (CHOSEN).**
- B: keep bespoke npm scripts + ad-hoc installs. Rejected — no reproducibility, agents must memorize per-repo runners.
- C: Nix. Rejected — heavier, worse DX on macOS, overkill for a single-host fleet.

### Semgrep — extend, don't duplicate

- **A: keep CLI as the deterministic gate; ADD `semgrep mcp` (main binary) for interactive agent mode;
  grow the self-improving custom-rule set with fixtures (CHOSEN).**
- B: adopt `uvx semgrep-mcp`. Rejected — the standalone `semgrep-mcp` was **archived Oct 2025**.

### Serena — semantic layer

- **A: worktree-native MCP (`--project-from-cwd`), memory kept non-canonical (CHOSEN).**
- B: one fixed canonical checkout. Rejected — the fleet edits `~/ai/worktrees/<repo>/<run-id>`; a fixed
  project would index the wrong tree.

### OpenTofu — state backend (the hard one)

- **A: R2 via `s3` backend WITHOUT `use_lockfile`, mutual exclusion from the repo-scoped exec lock (CHOSEN).**
- B: R2 + native `use_lockfile`. **Rejected — OpenTofu #4405 (R2 lock self-collision → orphaned lock) was
  CLOSED 2026-09-09 "not planned"; the fix PR was rejected.** Not production-safe.
- C: local state on the one host. Viable fallback, but R2 gives durability + the multi-host on-ramp.

### Agent Vault — credential brokering

- **A: Infisical stays SSOT; Agent Vault brokers credential USE (placeholder→inject); `get-secret`
  preserved; OAuth/localhost/DeepSeek via passthrough (CHOSEN).**
- B: copy secrets into the agent env. Rejected — defeats the entire point.

## Decision

Compose them as a layered fabric, each with ONE responsibility, wired through mise:

```
/run-the-loop → mise (reproducible task graph)
                 ├── Serena   semantic code intel      (--project-from-cwd, worktree-native)
                 ├── Semgrep  invariants/security       (CLI gate + `semgrep mcp` interactive)
                 └── OpenTofu long-lived infrastructure (R2 state, no use_lockfile)
Claude/Codex/OpenClaw → privileged calls → Agent Vault (broker) → Infisical (secret SSOT)
```

- **mise** is the canonical command surface: `mise tasks` discovers the lifecycle; tasks WRAP proven
  scripts (`bin/lint-all.sh`, `scripts/validate-*`, `bin/semgrep-scan.sh`, …) — not rewrites. Tools are
  pinned and `mise.lock` is committed cross-platform; CI installs `MISE_LOCKED=1`. Secrets never in `mise.toml`.
- **Semgrep**: `bin/semgrep-scan.sh` gives `--full`/`--fast`(diff-aware)/`--test`. New invariant class
  `credential-and-fleet-hygiene.yml` (secrets→logs, secrets→`$GITHUB_OUTPUT`, hardcoded CF/broker tokens,
  interactive `infisical login`) WITH positive+negative fixtures. `semgrep mcp` registered for agents.
  Rule hierarchy: community baseline → fleet custom → project-local (extend, never fork).
- **Serena**: registered in `.mcp.json` + user-scope + Codex (`serena setup codex`); worktree-bound;
  `.serena/cache` gitignored; memory non-canonical (git/files stay truth).
- **OpenTofu**: owns durable CF topology (Wrangler owns Worker code); `templates/opentofu` CF module;
  `infra:*` tasks; state never committed; provider + tofu locked both platforms; adopt existing resources
  via non-destructive `import{}` blocks only; destroy/replace stays approval-required.
- **Agent Vault**: secret-free `control-plane/agent-vault.services.yaml` manifest; strict-deny is PHASED
  (enumerate upstreams first); GitHub OIDC machine identity binds `job_workflow_ref` (the canonical
  reusable workflow); `get-secret` + chezmoi + CF Secrets Store all preserved.

### Recursive simplification applied

- **A layer disappeared:** no new `TOOLCHAIN-MANIFEST.md` — `mise tasks` IS the capability surface the
  loop inspects.
- **Rejected complexity:** no fifth doctor script — `mise run doctor` composes `bin/fabric-doctor.mjs`.
  No `bin/fleet-infisical*.py` (brief ghosts) — extended the existing `bin/get-secret-infisical.sh`.
  `rules/fleet-secret-handling.md` is NOT created; `secrets-portable-resolution.md` already is the SSOT.

## Consequences

- **Positive:** one reproducible command surface; credential-leak classes become statically impossible;
  semantic navigation cuts bulk file reads; infra becomes declarative + recoverable; agents never hold raw
  secrets for brokered services; fresh-machine bootstrap is `curl mise.run | sh && mise run setup`.
- **Negative:** mise coexists with volta on node (documented; `.nvmrc` stays SSOT); Agent Vault same-host
  isolation is weaker than separate-host (documented, with a move-later design); R2-without-lockfile relies
  on the single-host exec lock (fine today, migration path defined).
- **Neutral:** existing lefthook/lint-history/CI keep working; `get-secret` interface unchanged.

## Migration Path

mise keystone (done) → Semgrep/Serena depth (done) → Agent Vault manifest + OIDC (manifest done; live
broker on the Ubuntu host pending) → OpenTofu live-resource adoption (templates done; import pending) →
`/run-the-loop` wiring → project rollout (projectsites.dev, megabyte.space, gitl.ink, deskl.ink,
bricklabor.com) → control-plane panels → adversarial review. State per phase in CONVERGENCE.md.

## Validation

- **Success signals:** `mise run ci` green locally == in CI; `security:rules:test` green; drift detected
  before it bites; zero secrets in history; faster loop fires (semantic queries replace bulk reads).
- **Failure signals:** mise/volta node war; Semgrep false-positive storm; Serena indexing the wrong
  worktree; an R2 orphaned lock; any secret in an artifact. Review date: 2027-01.

## References

- [[opentofu-infrastructure]] · [[agent-vault-brokering]] · [[secrets-portable-resolution]] ·
  [[agent-provider-policy]] · [[lint-doctrine]] · [[projectsites-cloudflare-first]]
- OpenTofu #4405 (R2 `use_lockfile`, closed "not planned"): github.com/opentofu/opentofu/issues/4405
- mise lockfile: mise.jdx.dev/dev-tools/mise-lock.html · Semgrep MCP: github.com/semgrep/mcp (archived) →
  `semgrep mcp` · Serena: github.com/oraios/serena · Agent Vault: github.com/Infisical/agent-vault
