#!/usr/bin/env python3
"""effort-escalator.py — pick a reasoning effort level from the task text.

Implements sub-feature 3 of heymegabyte/agent-skills#6 (effort escalator).
Pure classifier: keyword scoring over the prompt/issue text, mapped to one of
low | medium | high | max. Deterministic, offline, no API calls.

Used by:
  - ``bin/opencode-deepseek.sh`` (OpenCode rail) via ``bin/deepseek-routing.sh hook``
    to set ``opencode run --variant``.
  - Any harness with a ``PreToolUse`` / prompt-submit hook: feed the hook payload
    JSON on stdin (``{"prompt": "..."}`` or ``{"tool_input": {...}}``) and read the
    chosen level from stdout or the JSON envelope.

Policy (issue #6, reconciled with rules/model-routing.md § Effort parameter):
  max     architecture, refactor, security, auth/payment, debug/root-cause,
          migration, multi-file change, incident
  low     rename, format/lint, typo, changelog, docs-only, comment, bump version
  medium  everything else
  high    a task that mentions none of the max/low keywords but is clearly a
          feature build (implement/add/feature/build) — kept one notch below
          ``max`` so routine implementation does not pay frontier effort.

The classifier is monotone in evidence: a single ``low`` keyword never demotes a
prompt that also carries a ``max`` keyword. Word-boundary matching is used so
``reformat`` does not fire on ``format``.

CLI::

    effort-escalator.py classify "refactor the auth middleware"
    effort-escalator.py classify --json "..."
    echo '{"prompt":"rename a variable"}' | effort-escalator.py hook
    effort-escalator.py levels          # list accepted levels

Exit codes: 0 always for classify/hook (the hook must never block a tool call);
2 for usage errors.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field

LEVELS = ("low", "medium", "high", "max")
DEFAULT_LEVEL = "medium"

# Order matters only for documentation; scoring is additive per tier.
KEYWORDS: dict[str, tuple[str, ...]] = {
    "max": (
        "architect",
        "architecture",
        "refactor",
        "security",
        "vulnerability",
        "cve",
        "exploit",
        "threat model",
        "auth",
        "authentication",
        "authorization",
        "oauth",
        "payment",
        "billing",
        "stripe",
        "debug",
        "root cause",
        "race condition",
        "deadlock",
        "concurrency",
        "migration",
        "schema change",
        "data loss",
        "incident",
        "outage",
        "regression",
        "multi-file",
        "cross-cutting",
        "prove",
        "correctness",
    ),
    "low": (
        "rename",
        "renaming",
        "format",
        "formatting",
        "reformat",
        "lint",
        "linting",
        "typo",
        "typos",
        "whitespace",
        "changelog",
        "release notes",
        "comment",
        "comments",
        "docstring",
        "docs only",
        "bump version",
        "version bump",
        "sort imports",
        "dead code",
        "move file",
    ),
    "high": (
        "implement",
        "add feature",
        "feature",
        "integrate",
        "write tests",
        "test suite",
        "component",
    ),
}

# Weight per tier. A single max keyword outweighs any number of low keywords.
WEIGHTS = {"max": 3, "high": 1, "low": -1}

# Promotion thresholds on the summed score.
MAX_SCORE = 3  # one max keyword is enough
HIGH_SCORE = 1
MEDIUM_SCORE = 0


def _compile(pattern: str) -> re.Pattern[str]:
    return re.compile(r"(?<![\w-])" + re.escape(pattern) + r"(?![\w-])", re.IGNORECASE)


_COMPILED = {tier: [(kw, _compile(kw)) for kw in kws] for tier, kws in KEYWORDS.items()}


@dataclass
class Decision:
    level: str
    score: int
    matches: dict[str, list[str]] = field(default_factory=dict)
    text_length: int = 0

    def as_dict(self) -> dict[str, object]:
        return {
            "level": self.level,
            "score": self.score,
            "matches": self.matches,
            "text_length": self.text_length,
        }


def classify(text: str) -> Decision:
    """Return the effort level for ``text`` plus the evidence that produced it."""
    text = text or ""
    matches: dict[str, list[str]] = {}
    score = 0
    for tier, kws in _COMPILED.items():
        hits = [kw for kw, rx in kws if rx.search(text)]
        if hits:
            matches[tier] = hits
            score += WEIGHTS[tier] * len(hits)

    if score >= MAX_SCORE:
        level = "max"
    elif score >= HIGH_SCORE:
        level = "high"
    elif score == MEDIUM_SCORE:
        level = "medium"
    else:
        level = "low"

    # Long prompts with no low-tier evidence are multi-step implementation work.
    if level == "medium" and len(text) > 1200:
        level = "high"

    return Decision(level=level, score=score, matches=matches, text_length=len(text))


def _text_from_hook_payload(payload: dict) -> str:
    """Extract the task text from a Claude-style hook payload (best effort)."""
    for key in ("prompt", "user_prompt", "message", "task"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value
    tool_input = payload.get("tool_input")
    if isinstance(tool_input, dict):
        for key in ("prompt", "description", "command", "task"):
            value = tool_input.get(key)
            if isinstance(value, str) and value.strip():
                return value
    return json.dumps(payload, sort_keys=True) if payload else ""


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Classify task text into an effort level.")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_classify = sub.add_parser("classify", help="classify the given text")
    p_classify.add_argument("text", nargs="+")
    p_classify.add_argument("--json", action="store_true", help="emit a JSON envelope")

    p_hook = sub.add_parser("hook", help="read a hook payload JSON from stdin")
    p_hook.add_argument("--json", action="store_true", help="emit a JSON envelope")

    sub.add_parser("levels", help="list accepted effort levels")

    args = parser.parse_args(argv)

    if args.cmd == "levels":
        print("\n".join(LEVELS))
        return 0

    if args.cmd == "classify":
        text = " ".join(args.text)
    else:
        raw = sys.stdin.read()
        try:
            payload = json.loads(raw) if raw.strip() else {}
        except json.JSONDecodeError:
            payload = {"prompt": raw}
        text = _text_from_hook_payload(payload) if isinstance(payload, dict) else raw

    decision = classify(text)
    if getattr(args, "json", False):
        print(json.dumps(decision.as_dict(), sort_keys=True))
    else:
        print(decision.level)
    return 0


if __name__ == "__main__":
    sys.exit(main())
