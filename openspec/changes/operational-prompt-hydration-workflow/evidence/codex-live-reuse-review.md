# Live Codex reuse review

- Runtime source: `119cce7a`.
- Provider: local Codex CLI in an ephemeral read-only session. Both probes required a `thread.started` identity and a `turn.completed` event.
- Current workflow probe: `rules/parallel-multi-swarm-orchestration.md` (SHA-256 `003eb7a5553b95ef5c25fca0e3895f30d548659287a3acfa7f0a78111c981f3e`). The reviewer returned an empty proposal list.
- Controlled positive probe: an OpenSpec design described two applications with identical dialog keyboard and focus behavior, both already using the shared UI package. The live reviewer cited the supplied design path, selected `theme.tools`, and the runtime wrote and read back the proposal in an isolated directory.
- Evidence scope: live review, provider identity, destination selection, and proposal persistence. Production host wiring, actual destination repository integration, and supplemental dispatch remain separate verification items.

## Accepted implementation evidence

At `14ad6151`, a controlled coordinator run read `src/app.ts` from a real Git commit using `readCommittedReuseEvidence`. The file described two applications duplicating a UI focus helper while both already used the shared UI package. An ephemeral read-only Codex session (`01a22155-67e1-7250-9f58-bd5248496a46`) reviewed the excerpt, selected `theme.tools`, and cited `631faada658ecb1d08b117ea62e6b1c987b8b4f3:src/app.ts`. The production proposal writer wrote a proposal under the temporary destination, and the probe read back the exact citation. The observed proposal path was `openspec/changes/reuse-share-the-scroll-preserving-focus-helper-in-them-31413f8ba96d/proposal.md`.

The Git reader, reviewer session, and proposal writer were live. The coordinator fixture simulated the worker, acceptance, and integration receipts. This verifies the evidence and proposal path for one committed fixture. Production host activation and a live multi-worker run remain open.

## Live review during independent worker acceptance

At `6add8ea0`, two independent OpenCode/LiteLLM workers edited distinct files in real detached Git worktrees. The host ran `git diff --check` and committed the accepted changes in each worktree. A live Codex reviewer read the first worker's committed excerpt, cited `4b874ddb3db626b51944c3c382a52071dfa2b164:src/app.ts`, and proposed extracting the focus helper to `theme.tools`. The proposal writer persisted the finding under a disposable destination root.

The fixture held the second worker's acceptance until the review request began. The second change passed acceptance and integrated while the reviewer was still running. Both scheduler receipts reported `integrated`, and the disposable repository finished clean at `8760e1f7c401a73f0c3cd4ef4c4f8af8fa009888`. The worker processes were live. Planning and final verification used controlled adapters. This establishes overlap with the second worker's acceptance, not with its model inference. Production activation and admission of an extracted finding into supplemental execution remain open.

An earlier attempt surfaced a separate ownership issue: OpenCode modified the copied OpenSpec checklist alongside its assigned source file. The scheduler refused integration. The successful fixture explicitly instructed workers to leave the checklist alone. A follow-up tracks enforcing the frozen owned paths in the edit tool.

The isolated OpenCode profile now derives edit rules from frozen owned paths. A disposable Git fixture deliberately provided a permissive project configuration. The isolated launcher allowed the exact owned README write, and OpenCode emitted a denied write event for the unowned checklist. The checklist remained byte-for-byte unchanged. Scheduler-level changed-file verification also remains active.

## Live host-managed acceptance snapshot

At `e1ed703e`, the approved process adapter launched a real OpenCode/LiteLLM Flash worker in a disposable Git worktree. The worker edited only `src/app.ts`. With `snapshotGitBeforeAcceptance` enabled, the adapter committed the edit before running `git show --check --oneline HEAD`, which exited zero. The host supplied no custom source-digest or commit logic. A live Codex reviewer session (`01a221db-9249-7f52-bc1e-a1cfdd34f353`) cited `c5d34136a91464eeb45bda2e17f25440eef27964:src/app.ts` and generated a reuse proposal for the isolated `theme.tools` destination. The same commit fast-forwarded the disposable repository and the final checkout was clean. Planning and final verification used controlled fixture adapters.
