#!/usr/bin/env python3
"""
capture-prompt — deterministic, NON-BLOCKING prompt ingestion (AGENTSKILLS §6).

UserPromptSubmit hook. Appends each incoming user prompt VERBATIM — plus an ISO-8601
UTC timestamp, the cwd, and the session id when present — as ONE NDJSON line to the
durable inbox at ~/.agentskills/.agent/prompt-inbox.ndjson.

Contract (deliberately minimal — this must add no latency):
  - reads the hook payload JSON on stdin ({"prompt": "...", "cwd": "...", ...});
  - NO network calls, NO subprocesses, NO loop launch — a single O_APPEND write (<~50ms);
  - FAIL-SOFT: any error is swallowed and we exit 0, so a bad write NEVER blocks the
    user's prompt. (A read-only capture must never be able to break the session.)

The inbox is drained + reconciled against OpenSpec by the NEXT `/run-the-loop`, not here.
See rules/prompt-ingestion.md. Install note lives in that rule (NOT wired into settings.json).
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone

INBOX = os.path.join(
    os.path.expanduser("~"), ".agentskills", ".agent", "prompt-inbox.ndjson"
)


def main() -> int:
    try:
        raw = sys.stdin.read()
    except Exception:
        return 0  # no stdin (e.g. manual run w/o input) — nothing to capture
    if not raw.strip():
        return 0

    # Parse the UserPromptSubmit payload; tolerate a bare-string prompt too.
    try:
        payload = json.loads(raw)
    except Exception:
        payload = {"prompt": raw}
    if not isinstance(payload, dict):
        payload = {"prompt": str(payload)}

    prompt = payload.get("prompt") or payload.get("user_prompt") or ""
    if not isinstance(prompt, str) or not prompt.strip():
        return 0  # nothing meaningful to ingest

    record = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "cwd": payload.get("cwd") or os.getcwd(),
        "session_id": payload.get("session_id") or payload.get("transcript_path") or None,
        "prompt": prompt,  # VERBATIM — never truncated/transformed
    }

    try:
        os.makedirs(os.path.dirname(INBOX), exist_ok=True)
        line = json.dumps(record, ensure_ascii=False) + "\n"
        # O_APPEND => atomic single-line append even under concurrent sessions.
        fd = os.open(INBOX, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
        try:
            os.write(fd, line.encode("utf-8"))
        finally:
            os.close(fd)
    except Exception:
        pass  # durable-inbox write is best-effort; never block the prompt

    return 0  # ALWAYS pass through — this hook adds context, never gates


if __name__ == "__main__":
    sys.exit(main())
