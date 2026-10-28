"""Tests for bin/effort-escalator.py — issue #6 sub-feature 3."""

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "bin/effort-escalator.py"


def _load():
    spec = importlib.util.spec_from_file_location("effort_escalator", SCRIPT)
    loaded = importlib.util.module_from_spec(spec)
    sys.modules["effort_escalator"] = loaded
    assert spec.loader is not None
    spec.loader.exec_module(loaded)
    return loaded


mod = _load()


@pytest.mark.parametrize(
    ("text", "level"),
    [
        ("refactor the auth middleware", "max"),
        ("security review of billing code", "max"),
        ("debug a race condition in the queue", "max"),
        ("rename a variable", "low"),
        ("fix typos and reformat the file", "low"),
        ("update the changelog", "low"),
        ("implement the new export button", "high"),
        ("a feature request for dark mode", "high"),
        ("write me a poem about migrations of geese", "medium"),
        ("", "medium"),
    ],
)
def test_classify(text, level):
    assert mod.classify(text).level == level


def test_max_beats_low():
    decision = mod.classify("rename the file, then refactor the auth layer and add typos lint")
    assert decision.level == "max"
    assert "refactor" in decision.matches["max"]
    assert "rename" in decision.matches["low"]


def test_word_boundaries():
    assert "format" not in mod.classify("reformat the output carefully").matches.get("low", [])
    assert mod.classify("reformat the output carefully").level == "low"


def test_long_neutral_prompt_is_high():
    assert mod.classify("x " * 800).level == "high"


def test_classify_cli_json():
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "classify", "--json", "auth refactor"],
        capture_output=True,
        text=True,
        check=True,
    )
    payload = json.loads(out.stdout)
    assert payload["level"] == "max"
    assert payload["score"] >= 3


def test_hook_reads_prompt_from_stdin():
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "hook"],
        input=json.dumps({"prompt": "rename the constant"}),
        capture_output=True,
        text=True,
        check=True,
    )
    assert out.stdout.strip() == "low"


def test_hook_reads_tool_input():
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "hook"],
        input=json.dumps({"tool_input": {"command": "refactor the payment flow"}}),
        capture_output=True,
        text=True,
        check=True,
    )
    assert out.stdout.strip() == "max"


def test_levels_cli():
    out = subprocess.run([sys.executable, str(SCRIPT), "levels"], capture_output=True, text=True, check=True)
    assert out.stdout.split() == list(mod.LEVELS)
