---
last_reviewed: 2026-06-29
superseded_by: null
name: "main-only-branch"
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# Main-Only Branch

`main` (or `master`) is committed to always. Always. Period. No long-lived dev branches, no release branches, no `develop` branch, no feature branches that live longer than a single agent session. Worktrees handle isolation when parallel work needs it. The commit IS the unit of progress; `main` IS the source of truth.

Pairs with `ai-seniority` § auto-merge — agent diffs that clear the gates land on `main` directly. No PR queue, no merge ceremony.

## The doctrine

- **`main` is the only long-lived branch.** Commits go straight to `main` once they pass the gates per `verification-loop` + `ai-seniority` auto-merge contract.
- **No dev branches.** No `develop`, no `staging`, no `release/v1.2`. No mobile-team-cuts-a-release-branch ceremony per `no-staging-doctrine`.
- **Worktrees > branches for parallel work.** When multiple agents need isolation, spawn worktrees per `full-autonomy` § sub-agent isolation (`isolation: "worktree"` on Agent calls). Worktrees give independent working copies without the merge-ceremony cost of long-lived branches.
- **Conventional commits IS the PR description.** `feat(scope): summary` + 1-3 body lines explaining the why. The changelog-generator agent + auto-generated GitHub Releases handle the rest. No multi-paragraph PR descriptions.
- **Commit + push the same turn.** EVERY repo under `~/emdash/repositories/*` plus the side repos (agentskills, saas-starter, plugins, tools, template repo) auto-commit + push to main per `brian-preferences` § Git policy. Pushing is autonomous infrastructure, never a human-gated step — never emit "NEEDS BRIAN" for a `git push`. Only the legacy `~/emdash-projects/*` tree stays frontend/PR-managed.

## Merge every round + clean up worktrees (ENFORCED — added 2026-09-27)

- **Default to working ON `main` directly.** For most work, edit + commit straight to `main`. Reach for a worktree ONLY when parallel agents genuinely need isolated working copies at the same instant — not as the default for every task.
- **Integrate to `main` at the END OF EVERY PROMPT ROUND.** Never let a branch (feature or `worktree-agent-*`) carry work across rounds — merge it to `main` the same round it's built + verified. A non-`main` branch that survives into the next prompt is a stranding risk.
- **Delete the worktree AND its branch the moment its work lands** (`git worktree remove <path>` + `git branch -D <b>`). Cleanup is NOT automatic (see incident) — do it explicitly, every fire.
- **Catch stranding early:** run `git rev-list --left-right --count origin/main...HEAD` each round; if `behind` grows or you're on the same non-`main` branch two rounds running, STOP and integrate to `main` now.
- Cross-links: `feature-stranded-on-long-lived-branch-never-reaches-prod` · `data-platform-arc-stranded-on-feat-never-merged-to-main` · `worktree-pool-reaper-kills-tmp-worktrees-commit-early`.

## Worktree pattern (parallel work without branches)

- Agent A working on `libs/features/donations_engine/` + Agent B working on `libs/features/voice_agent/` = two worktrees, both branched from `main`, both auto-merge to `main` when their gates pass.
- Conflict resolution: rebase the later worktree onto the merged-first one. No merge commits, linear history.
- Worktree cleanup is NOT automatic — do it EXPLICITLY. When an agent's work lands, immediately `git worktree remove` its path + `git branch -D` its branch; when it produces no changes, remove the empty worktree too. Never leave `worktree-agent-*` refs lying around.

## What this kills

- ❌ "Let's open a PR and tag the team for review" — there's no team. The gates ARE the review per `ai-seniority`.
- ❌ `git flow init` and the `develop` → `release/*` → `main` ceremony.
- ❌ "Feature branch for the dashboard rewrite" living three weeks. Worktree it, ship in passes per `06-build-and-slice-loop`.
- ❌ Squash-merge ceremony — conventional commits + linear history.
- ❌ Rebase wars — worktrees prevent the conflict surface that triggers them.
- ❌ Multi-paragraph PR descriptions explaining WHAT changed — the commits explain WHAT, the CHANGELOG explains WHY for downstream consumers.

## What this preserves

- **`autonomous-engineering` approval gates** still apply — destructive/customer-impacting changes still pause for Brian even when going straight to `main`.
- **`verification-loop` deploy + prod-E2E mandate** still fires post-merge to `main`. Auto-deploy after auto-merge per `no-staging-doctrine`.
- **GitHub Releases + CHANGELOG** still get generated — by the changelog-generator agent on every release tag, not by hand.

## Reference incident (2026-09-27 — the data-platform arc)

A multi-round fan-out arc (Editor Database+Resources, fires 1-8) was run entirely on the long-lived `feat/apps-deploy-panel` branch with ~95 `worktree-agent-*` isolated agents. Result: (1) `feat` diverged from `main` and went **29-ahead / 61-behind**, never merged — Brian asked "how come there's no new code?" because it was all stranded off `main`; (2) ~95 worktree branches piled up (the "automatic cleanup" never happened); (3) `-X theirs` cherry-picks between the branches resurrected deleted code + slipped build breaks past `tsc`. Fix required a full `feat→main` merge + a 95-branch cleanup. Lesson baked into the ENFORCED section above: work on `main`, merge every round, delete worktrees + branches explicitly, watch divergence. See `data-platform-arc-stranded-on-feat-never-merged-to-main` + `cherry-pick-landing-hazards-x-theirs-and-tsc-not-build`.

<!-- grow-ok --> <!-- 2026-09-27 ENFORCED merge-every-round section + data-platform reference incident justify the +12 lines -->
