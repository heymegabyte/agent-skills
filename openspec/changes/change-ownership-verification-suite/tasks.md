# Tasks: Change-Ownership Verification Suite

> Owner: claude-session-fire4 (this session). One owner performed every task below.

## 1. Build harness
- [x] 1.1 `bin/verify-change-ownership.sh` runs the §7 checks (invariant-reach, canonical rule, cross-links, atomic-claim test, `openspec validate --strict`, hook-manifest, proposal content, proposed/complete coexistence), classifying each STATIC / RUNTIME / LIMITED.
- [x] 1.2 Installer/sync idempotency check — re-copy canonical == source; installed == canonical; `hooks.json` one-handler-per-event (no duplicate instructions/skills/hook handlers).

## 2. Verify + report
- [x] 2.1 Harness green for all STATIC + RUNTIME checks; the 3 runtime-only checks (live Codex/Gemini/OpenCode session load, live multi-agent decomposition, cross-host distribution) are reported as LIMITED with the exact limitation — not faked.
