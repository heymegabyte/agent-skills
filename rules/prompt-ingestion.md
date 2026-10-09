---
last_reviewed: 2026-10-08
superseded_by: null
name: "prompt-ingestion"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Prompt Ingestion (deterministic capture → deferred reconciliation)

AGENTSKILLS §6. Every user prompt is a training gradient ([[prompt-as-training-signal]]). To
guarantee none is lost between sessions, capture is split from reconciliation: a non-blocking
hook durably records each prompt the instant it arrives; the expensive AI extraction + OpenSpec
reconciliation runs LATER, during the next loop fire. Capture is deterministic (hooks > rules);
interpretation is reasoned ([[run-the-loop]]).

## The capture hook (deterministic, non-blocking)

- `hooks/capture-prompt.py` — a `UserPromptSubmit` hook. Reads the hook payload JSON on stdin,
  appends ONE NDJSON line to the inbox `~/.agentskills/.agent/prompt-inbox.ndjson`, exits 0.
- Line schema: `{ts, cwd, session_id, prompt}` — `ts` ISO-8601 UTC, `prompt` VERBATIM (never
  truncated/transformed so reconciliation sees exactly what the user wrote).
- Hard constraints: **NO** network calls, **NO** subprocesses, **NO** loop launch; a single
  `O_APPEND` write (atomic across concurrent sessions), target <~50ms added latency.
- **Fail-soft**: any error is swallowed → exit 0. A read-only capture must NEVER gate a prompt.
- The hook only writes; it never reads/drains the inbox. Draining is the loop's job (below).

## Deferred reconciliation (next `/run-the-loop`)

The next loop fire drains the inbox, then clears/rotates it (so prompts are processed once):

1. Read every NDJSON line since the last drain.
2. For each: extract the JOB + EXPLICIT asks AND IMPLIED requirements (predict the 80% arc —
   [[predictive-completeness]]).
3. Reconcile against OpenSpec (`openspec/specs/` + `openspec/changes/`, `openspec/config.yaml`):
   new/changed requirement → propose or update a change ([[openspec-propose]] /
   [[openspec-update-change]]); already-covered → no-op; conflict → surface for decision.
4. Route each durable lesson to the SMALLEST correct destination per [[routing-matrix]]
   (corrections→memory · "always/never"→rules · design→skill 10 · requirement→SPEC+test · 3×→skill).

## Requirement-precedence order (when two sources disagree)

Highest wins. Mirrors the estate conflict-resolution chain (CLAUDE.md § Conflict Resolution):

1. An explicit user prompt / direct instruction (the freshest, most specific signal).
2. A merged OpenSpec spec (`openspec/specs/`) — the ratified requirement of record.
3. A project rule (`project/.claude/`) or project `CLAUDE.md` — path-scoped, specific > general.
4. A global rule (`~/.agentskills/rules/`, `~/.claude/`) — universal doctrine.
5. A skill or prompt-library default — the broadest fallback.

A pending (un-merged) OpenSpec change ranks BELOW a merged spec but is the staging ground where a
new prompt's requirements land before ratification. `***TEXT***` in a prompt = high-priority
propagate (CLAUDE.md), handled at rank 1.

## Install (NOT wired here — ship the hook + this doc only)

Register in `~/.claude/settings.json` under `hooks.UserPromptSubmit` (deliberately left to the
operator so live settings aren't mutated by a build):

```jsonc
{ "matcher": "", "hooks": [ { "type": "command",
  "command": "python3 ~/.agentskills/hooks/capture-prompt.py" } ] }
```

Smoke: `echo '{"prompt":"hi","cwd":"/tmp"}' | python3 ~/.agentskills/hooks/capture-prompt.py`
then `tail -1 ~/.agentskills/.agent/prompt-inbox.ndjson` — exactly one valid NDJSON line, no network.
