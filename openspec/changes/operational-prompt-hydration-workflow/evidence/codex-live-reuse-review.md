# Live Codex reuse review

- Runtime source: `119cce7a`.
- Provider: local Codex CLI in an ephemeral read-only session. Both probes required a `thread.started` identity and a `turn.completed` event.
- Current workflow probe: `rules/parallel-multi-swarm-orchestration.md` (SHA-256 `003eb7a5553b95ef5c25fca0e3895f30d548659287a3acfa7f0a78111c981f3e`). The reviewer returned an empty proposal list.
- Controlled positive probe: an OpenSpec design described two applications with identical dialog keyboard and focus behavior, both already using the shared UI package. The live reviewer cited the supplied design path, selected `theme.tools`, and the runtime wrote and read back the proposal in an isolated directory.
- Evidence scope: live review, provider identity, destination selection, and proposal persistence. Production host wiring, actual destination repository integration, and supplemental dispatch remain separate verification items.

## Accepted implementation evidence

At `14ad6151`, a controlled coordinator run read `src/app.ts` from a real Git commit using `readCommittedReuseEvidence`. The file described two applications duplicating a UI focus helper while both already used the shared UI package. An ephemeral read-only Codex session (`01a22155-67e1-7250-9f58-bd5248496a46`) reviewed the excerpt, selected `theme.tools`, and cited `631faada658ecb1d08b117ea62e6b1c987b8b4f3:src/app.ts`. The production proposal writer wrote a proposal under the temporary destination, and the probe read back the exact citation. The observed proposal path was `openspec/changes/reuse-share-the-scroll-preserving-focus-helper-in-them-31413f8ba96d/proposal.md`.

The Git reader, reviewer session, and proposal writer were live. The coordinator fixture simulated the worker, acceptance, and integration receipts. This verifies the evidence and proposal path for one committed fixture. Production host activation and a live multi-worker run remain open.
