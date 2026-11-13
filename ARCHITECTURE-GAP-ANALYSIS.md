# Architecture Gap Analysis — Seven Capability Areas

**Repo:** `heymegabyte/agent-skills` · **Branch:** `claude/task-4qf3y8` · **Date:** 2026-10-28
**Scope:** Read-only audit of the committed tree. No account, billing, org, credential, or external-service mutations were performed.
**Assurance:** Findings produced by a primary audit and independently re-checked by a second auditor given only the raw capability list (not the conclusions). Both passes are recorded below. **These findings are presented for review and are not self-approved — final sign-off is the owner's.**

---

## Verdict table

| # | Capability | Status | Both passes agree? |
|---|------------|--------|--------------------|
| 1 | Paperclip | **ABSENT** — zero references | ✅ |
| 2 | OpenClaw / claw-router / dennisonbertram | **DESIGN/INTENT ONLY** — documented target chain; not installed or wired | ✅ |
| 3 | Claude cloud-session dispatch | **DESIGN/INTENT ONLY** — credit tracked, routing doctrine + real control-plane; **no launcher** | ✅ |
| 4 | browse-first automation | **ABSENT AS DESCRIBED** — committed hierarchy is API-first (browser = rung 3); browser-tool routing exists | ✅ (refined) |
| 5 | Cua Driver single-writer desktop control | **ABSENT** — single-writer exists only for loop *fires*, never the desktop | ✅ |
| 6 | Bitwarden / Infisical brokering | **IMPLEMENTED, but two separate rails** — no single unified broker | ✅ |
| 7 | run-the-loop integration | **IMPLEMENTED + mature standalone** — does not itself integrate 2/3/5/6 | ✅ |

---

## Evidence by area

### 1 — Paperclip · ABSENT
Case-insensitive search of the whole tree (incl. hidden files) and `git grep -niE 'paper.?clip|clippy'` → **0 matches**. No component, service, skill, agent, rule, or doc by that name. The repo has no notion of "Paperclip."

### 2 — OpenClaw / claw-router · DESIGN/INTENT ONLY
Named only in prose directives; no runnable code or config:
- `machines/ubuntu-proxmox-primary.md:11` — *"Target orchestration: GitHub Actions → … /run-the-loop → OpenClaw → dennisonbertram/claw-router → official Claude Code / official Codex."* (stated as a target)
- `machines/ubuntu-proxmox-primary.md:72` — *"Intended Claw Router: https://github.com/dennisonbertram/claw-router"*; `:32` inventory: *"OpenClaw … Not found on the inspected PATH"*; `:39` *"Do not confuse requested capabilities with installed capabilities."*
- `bootstrap/ubuntu-agent-fleet-codex.md:38,211` — a setup directive to *install/configure* OpenClaw + `claw-router (cr)` elsewhere.
- `bin/claude-pool.sh:5-6` — real (270-line LRU seat-pool with failover) but self-described as *"the missing primitive under an OpenClaw-style swarm"* — adjacent, not OpenClaw/claw-router.
**Gap:** no installer, config, router registration, adapter, or runtime glue is committed.

### 3 — Claude cloud-session dispatch · DESIGN/INTENT ONLY (real enabling infra, no launcher)
- Routing doctrine: `rules/account-entitlements.md:33` (credit inventory + *"Launch: `claude --cloud`, claude.ai/code, desktop 'Cloud', or mobile Code tab"*), `:36-40` strategy; `agents/resource-broker.md:13,24,31`; `agents/cost-estimator.md`; `rules/model-routing.md`; `rules/opus-quota-fallback.md`.
- Enabling control plane (real code): `control-plane/ccctl.mjs` (~23 KB deterministic deploy "brain") and `control-plane/README.md` describe what a cloud session *runs*.
- `control-plane/capability-matrix.md:28` rates Run-the-loop on "Claude Code Web" as **`configured-unverified`**.
**Gap:** launching a cloud session is an explicit human/UI action. No committed script invokes `claude --cloud` or the claude.ai/code API — the "route burst work to cloud sessions" doctrine (and the `resource-broker` role that depends on it) has **no executable dispatch path**. *(Time-sensitive context only: `account-entitlements.md` records the cloud-session credit expiring 2026-11-04 — noted, not acted on; claiming/account mutations are out of scope.)*

### 4 — browse-first automation · ABSENT AS DESCRIBED (doctrine is API-first)
- `run-the-loop/_shared/BROWSER-OPERATING-LAYER.md:28-34` — the accepted **Browser action hierarchy**: *"1. Official API / MCP — if a vendor API or connected MCP can do it, no browser is opened; 2. Structured site tools; 3. DOM/CDP/Playwright; 4. Vision."* Browser is **rung 3, below API**. The file is marked *"Design doc; no code yet"* / *"DESIGN ACCEPTED"* (`:5-7`).
- `rules/browser-automation-routing.md` — a real, active rule, but it routes *among browser tools* (default CF Browser Run + Stagehand) for tasks already decided to be browser tasks; it is not "browser before API."
**Gap:** a "browse-first" default (browser as the first rung) does not exist and is contradicted by committed doctrine. The org-wide Browser Operating Layer (Profile Vault, autonomy enforcement, admin observability — §4-8) is design-only; only loop-side browser-tool routing is live.

### 5 — Cua Driver single-writer desktop control · ABSENT
- Computer-use is present as **safety doctrine only**: `rules/computer-use-safety.md`, `agents/computer-use-operator.md`, `07-quality-and-verification/computer-use-automation.md`. No `cua` / `trycua` / "Cua Driver" match anywhere.
- Single-writer concurrency exists **only for loop fires**: `scripts/loop-fire-lock.mjs` + `.fire-lease.json` (`run-the-loop/_shared/GENOME.md:145-147`, `RUNNER-AND-CRITICS.md:37,93`). `rules/website-page-and-site-gates.md:57` uses "single-writer" for *sitemap URLs* — unrelated.
- Notably, `rules/computer-use-safety.md:52-82` documents the exact contention a desktop single-writer would solve (Emdash/Claude Desktop intercepting keystrokes; focus races) but mitigates with a **manual osascript force-focus**, not an arbiter.
**Gap:** no exclusive-writer / lease arbiter for desktop/computer-use control.

### 6 — Bitwarden / Infisical brokering · IMPLEMENTED, two separate rails
- **Infisical** = a backend of the universal `get-secret KEY` interface. Working resolver `bin/get-secret-infisical.sh` (env → Infisical; machine-identity/OIDC auth). Policy `rules/secrets-portable-resolution.md:17-32` sets precedence *process env → chezmoi/CF → Infisical*. **Bitwarden is not in this chain.**
- **Bitwarden** = a separate vault/MCP + OAuth-token-cache rail, real code: `mcp-servers/bitwarden-hardened-mcp/` (1215-line canonical server, supersedes base per `mcp-servers/_registry.json`), `mcp-servers/bitwarden-mcp/` (1152 lines, 28 vault/org tools), `template/utils/bitwarden-token-cache.ts` (376 lines). Framed as internal M2M vault in `rules/oauth2-provider-discipline.md:32,43,65`.
**Gap:** a unified *interface* (`get-secret`) exists with Infisical as one backend, but Bitwarden sits outside it as a distinct rail (vault management + OAuth cache). No single broker spans both; the two-layer split is functional but under-documented and the hardened Bitwarden MCP's **audit-log + rate-limiter are scaffolds, not wired**.

### 7 — run-the-loop integration · IMPLEMENTED + mature, but self-contained
- Real subsystem: `commands/run-the-loop.md` (226-line convergence loop — precedence contract, 15 roles + Long-Trail TDD owner, convergence/adversarial-review/verify/ship/reconcile), `run-the-loop/manifest.json`, `bin/sync-run-the-loop.mjs` (force-sync of `_shared/`), fire-lease mutex. Rated `verified` locally in `control-plane/capability-matrix.md:28`.
- A scoped search of the entire `run-the-loop/` tree for `openclaw|claw-router|cloud session|--cloud|bitwarden|infisical|single-writer|cua` → **no matches**. It references `get-secret` and CF Browser Run; it folds in `BROWSER-OPERATING-LAYER.md` *as a design doc*.
**Gap:** the chain that *wraps* run-the-loop (OpenClaw → claw-router → Claude/Codex; cloud-session fan-out) lives only in `machines/`+`bootstrap/` directives. run-the-loop is invoked *by* that intended stack but implements/calls none of it.

---

## Cross-cutting finding

The repo encodes a **layered orchestration intent** — `GitHub Actions → self-hosted runner → /run-the-loop → OpenClaw → claw-router → official CLIs`, with cloud-session fan-out as the burst valve. The only executable glue that exists today is: **run-the-loop** (mature), **`claude-pool.sh`** (seat pooling), **`with-subscription-cli.sh`**, **`opencode-deepseek.sh`**, and the **`control-plane/ccctl.mjs`** brain. The upper layers (OpenClaw, claw-router, cloud-session dispatch) and a desktop single-writer are **un-built**; **Paperclip** is unknown to the repo entirely. The system is honest about this — `machines/ubuntu-proxmox-primary.md:39` explicitly warns not to confuse requested with installed capabilities.

---

## Implementation recommendations (ranked; for owner approval — not self-approved)

1. **Resolve "Paperclip" nomenclature before any build.** Zero footprint means it is either an un-captured planned component or a renamed concept. Capture its intended role in `control-plane/capability-matrix.md` / `machines/` first; do not build blind.
2. **Make cloud-session dispatch executable (highest leverage, time-sensitive doctrine).** Add a small, host-gated dispatcher (e.g. `bin/dispatch-cloud-session`) that takes a spec-file brief and launches `claude --cloud` / claude.ai/code, so the `resource-broker` role and the burst-routing doctrine have a real path instead of a human click. Keep it read-only w.r.t. accounts.
3. **Add a desktop single-writer lease (Cua Driver).** Reuse the proven fire-lease shape (`scripts/loop-fire-lock.mjs`) as a desktop/computer-use arbiter: one writer holds the desktop token, others block. This directly retires the focus-contention incident class already documented in `computer-use-safety.md`.
4. **Ship OpenClaw/claw-router as idempotent installer + health-check.** Promote `bootstrap/ubuntu-agent-fleet-codex.md` into a `bin/` installer (host-capable session only); register claw-router with the three isolated Claude profiles; wire `claude-pool.sh` as the seat selector beneath it; add a `configured-unverified` capability-matrix row until proven end-to-end.
5. **Decide the browser doctrine, then execute slice 1.** Either rename/keep the accepted API-first hierarchy (and drop "browse-first" language), or deliberately invert it with rationale. Regardless, build Profile Vault (`BROWSER-OPERATING-LAYER.md` §8 slice 1, behind the `browser_profile_vault` flag) to move the org layer from design to runtime.
6. **Clarify and harden secret brokering.** Either fold Bitwarden into the `get-secret` precedence chain (one interface over vault + Infisical + chezmoi + CF) or formally document the two-layer split in `secrets-portable-resolution.md` so it is unambiguous; and wire the hardened Bitwarden MCP's audit-log + rate-limiter scaffolds before granting write tools.
7. **Make run-the-loop's place in the chain legible.** Add an "invocation context" section mapping where OpenClaw/claw-router/cloud dispatch sit relative to a fire, and have the existing `resource-broker` role actually consult the new cloud-session dispatcher (rec. 2). Keep run-the-loop host-agnostic.

---

*Audit method: primary first-hand read of keystone files (machines/bootstrap orchestration, browser routing + operating layer, computer-use safety, secret rails, run-the-loop system) plus targeted absence greps; independently cross-checked by a second auditor working from the capability list alone. Discrepancies reconciled: items 3 (control-plane enabling infra) and 4 (API-first contradiction) were sharpened by the second pass.*
