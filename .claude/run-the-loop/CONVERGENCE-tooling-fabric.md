# CONVERGENCE — Agent Tooling Fabric (mise · Semgrep · Serena · OpenTofu · Agent Vault)

Resumable record for the five-tool integration program. Design: `docs/adr/ADR-0001-agent-tooling-fabric.md`.
Separate from the Growth-OS `CONVERGENCE.md` in this dir (different program). `heymegabyte/agent-skills`
is NOT a scheduled product loop — this tracks THIS integration only.

## Status

- **Converged?** No — Pass 1 (foundation) complete + verified on darwin-arm64. Phases H–L remain.
- **Stage:** A/B done (research + implement foundation); C (adversarial review) pending.
- **Branch:** `master` — changes committed locally, **push GATED** (see Blockers).

## What Pass 1 delivered (verified)

| Area | Deliverable | Evidence |
|---|---|---|
| mise | `mise.toml` (8 tools pinned) + 21-task canonical vocabulary wrapping existing scripts | `mise tasks` lists 21; dep-graph no cycles |
| mise | cross-platform `mise.lock` (linux-x64 + macos-arm64 + more; checksums + attestations) | `mise lock --platform …`; 8 tool roots |
| mise | locked install (CI parity) | `MISE_LOCKED=1 mise install` → 8/8 repo tools from lock |
| Semgrep | `bin/semgrep-scan.sh` (`--full`/`--fast` diff-aware/`--test`) | shellcheck clean |
| Semgrep | `credential-and-fleet-hygiene.yml` invariant class + fixtures | `semgrep --test` → 5/5 pass |
| Semgrep | `semgrep mcp` registered (archived semgrep-mcp NOT used) | `.mcp.json` |
| Serena | `bin/serena-helper.sh` (worktree-aware index/doctor) + `.mcp.json` + gitignore | shellcheck clean; `semantic:doctor` runs |
| OpenTofu | `templates/opentofu` CF v5 module + `.tftest.hcl` + README | `tofu validate` Success; `tofu test` 1/0 |
| OpenTofu | cross-platform `.terraform.lock.hcl` (linux_amd64 + darwin_arm64, GPG-signed) | `tofu providers lock` |
| Agent Vault | secret-free `control-plane/agent-vault.services.yaml` + `rules/agent-vault-brokering.md` | no values; passthrough for OAuth/DeepSeek |
| Doctor | `bin/fabric-doctor.mjs` (toolchain/semantic/security/secrets/infra/fleet, `--json`) | `mise run doctor` → 8 pass 0 fail |
| Docs | ADR-0001; `rules/opentofu-infrastructure.md`; `.gitignore` state/cache hardening | — |

## Remaining convergence gaps (next passes)

- **H — /run-the-loop wiring:** Orient detects mise/`.serena`/tofu roots/`.semgrep`/Agent-Vault; Security
  role runs `security:semgrep:fast`; Verify runs `loop:verify`; report emits a compact fabric line.
- **GitHub Actions:** reusable mise workflow (`jdx/mise-action@…2d8d4ca`, SHA-pinned) + Infisical OIDC
  (`permissions: id-token: write`, bind `job_workflow_ref`). Resolve tags→SHAs before commit.
- **I — project rollout:** projectsites.dev, megabyte.space (CF-heavy → OpenTofu import candidates),
  gitl.ink, deskl.ink, bricklabor.com. Per-project `mise.toml` wrapping real scripts; Serena activation;
  global semgrep baseline sync; Agent Vault capability scoping. Inspect each independently — no blind paste.
- **F (live) — Agent Vault broker + Infisical OIDC on the Ubuntu host:** author-here/execute-there.
  Enumerate real upstreams BEFORE `unmatched_host_policy=deny`. Codex is the setup agent on that box.
- **G (live) — OpenTofu adoption:** inventory live CF resources → `import{}` blocks → prove no-op plan.
  NEVER mass-import; NEVER auto-destroy.
- **J — control-plane:** real (non-mocked) fabric panels on agent.megabyte.space.
- **K/L — adversarial review + converge:** fresh Claude/Codex pass (security/duplication/worktree
  concurrency/cross-platform); fix; repeat until two clean passes.

## Blockers / caveats (honest)

- **Dirty working tree:** 100+ pre-existing uncommitted files from the active Growth-OS program (its
  `CONVERGENCE.md` says "awaiting review"). My commits are SURGICAL — only fabric files, never `-A`.
- **Push GATED:** canonical-fleet blast radius + unreviewed Growth-OS work in the tree → push only on
  explicit owner direction.
- **Unreachable host:** this session is the macOS dev machine; the Ubuntu runner (systemd, runner
  service, live Agent Vault daemon) isn't reachable here — those steps are authored, executed there.
- **Agent Vault staleness:** no last-good snapshot-age surface exists upstream — reported as a known gap.

## Next-session bootstrap

1. `eval "$(mise activate bash)"` · `mise run doctor` to confirm fabric state.
2. Resume at Phase H (run-the-loop wiring) then the GitHub OIDC workflow.
3. Live phases (F/G) drive from the Ubuntu host (Codex); this record is the handoff.
