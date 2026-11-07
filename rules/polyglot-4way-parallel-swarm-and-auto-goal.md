# Mandatory 4-Engine Massive Parallel Polyglot Swarm (`claude` + `codex` + `gemini` + `opencode`) & Automatic End-of-Round `/goal` Execution

**Priority:** P0 (Always-On Execution & Orchestration Rule)  
**Applies to:** All multi-file, multi-package, library absorption, upstream test suite retrofitting, UI catalog, and full-stack convergence tasks across `heymegabyte/agent-skills`, `heymegabyte/theme.tools`, `heymegabyte/install.doctor`, and consumer repositories.

---

## 1. Always-On Massive Parallel Swarm Mandate

1. **Never Execute Large Tasks Sequentially**:
   - Whenever a task touches `>= 3` files, `>= 2` packages, or involves library absorption / test retrofitting / catalog convergence, a **parallel 4-engine polyglot swarm MUST ALWAYS be launched immediately**.
   - Single-threaded or low-worker execution on large tasks is a policy violation.

2. **Minimum & Scaled Worker Allocations (`claude` + `codex` + `gemini` + `opencode`)**:
   - **Standard Multi-File Task (`3–9` files)**:
     - **Claude (`claude -p --dangerously-skip-permissions`)**: `6` parallel workers
     - **Codex (`codex exec --full-auto`)**: `8` parallel workers
     - **Gemini (`invoke_subagent` with `Model: "pro"` + `gemini` CLI)**: `4` parallel subagents/workers
     - **OpenCode (`node ~/.agentskills/bin/opencode-swarm.mjs`)**: `16` parallel workers
   - **Large / Repository-Wide / 40-Library Task (`>= 10` files or `>= 4` packages — `76+` concurrent workers total)**:
     - **Claude (`claude -p --dangerously-skip-permissions`)**: **`12` parallel workers** — assigned to deep domain state machines, architectural contracts, security/WebCrypto modules, and cross-library orchestration.
     - **Codex (`codex exec --full-auto`)**: **`16` parallel workers** — assigned to retrofitting original upstream repository test suites (`original-repo-tests-adapter.ts` + `original-upstream-repo.test.ts`), D1/DO SQLite migrations, and wire-protocol test vectors.
     - **Gemini (`invoke_subagent` with `Model: "pro"` + `gemini` CLI)**: **`8` parallel workers / subagents** — assigned to unified `@theme.tools/sdk` ergonomics, MCP `/manifests/libraries.json` parity, and 16-state UI micro-loops.
     - **OpenCode (`node ~/.agentskills/bin/opencode-swarm.mjs --max-workers 40`)**: **`40` parallel workers** — assigned to 1-worker-per-library horizontal expansion, subpath exports, and fixture validation across all 40 libraries.

---

## 2. Automatic End-of-Round `/goal` Execution (`polyglot-4way-swarm.mjs` + `antigravity-hook.mjs`)

1. **Automatic End-of-Round Goal Trigger**:
   - At the end of every round, the Stop Hook (`~/.agentskills/bin/antigravity-hook.mjs`) and `pnpm goal:auto-round` (`~/.agentskills/bin/polyglot-4way-swarm.mjs` + `scripts/auto-round-goal-polyglot-swarm.ts`) automatically execute the updated `/goal` against the workspace.
   - The round cannot terminate until `.agents/round-goal-ledger.json` records a verified 4-engine parallel swarm run (`claude` + `codex` + `gemini` + `opencode`) with:
     - Strictly the **40 Curated Libraries (`#01`–`#40`)** and their **`40+` (`97`) consolidated upstream git repositories** (with the 70 redundant/widget/niche repos and 28 non-CF-native entries excluded).
     - **100% of original upstream repository test suites** (`packages/*/test/original-upstream-repo.test.ts` — `40/40` suites, `291/291` retrofitted upstream test files, `4,284+` assertions) passing on pure Cloudflare-native primitives (Workers V8 Isolates, D1 SQLite, Durable Objects SQLite/Alarms, KV, R2, Queues, Workflows) with `requiresCloudflareContainers: false`.
     - **100% of package conformance & upstream compatibility suites** (`121/121` package test suites, `272/272` tests) and UI unit suites (`49/49` tests) passing.

---

## 3. Subagent Completion Protection (Never Kill Active Research Subagents)

1. **Never Call `manage_subagents` `kill` or `kill_all` on Active Research Subagents**:
   - Calling `kill_all` while background subagents are researching terminates in-flight research and discards their findings.
   - `~/.agentskills/bin/antigravity-hook.mjs` enforces this in two ways:
     - **Blocks `manage_subagents` (`kill` / `kill_all`)** in `pre-tool`.
     - **One-Shot `send_message` Completion Token**: When a subagent finishes its research and calls `send_message` to report back to the parent agent, `antigravity-hook.mjs` records a one-shot completion token so the subagent's subsequent `stop` event exits cleanly on pass 1 without getting trapped in the parent workspace's `git status` or 3-emission stop gate.
