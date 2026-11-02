"""Tests for bin/deepseek-cost-model.py — issue #6 workload measurement."""

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "bin/deepseek-cost-model.py"
PRICES = ROOT / "docs/deepseek-prices.example.json"


def _load():
    spec = importlib.util.spec_from_file_location("deepseek_cost_model", SCRIPT)
    loaded = importlib.util.module_from_spec(spec)
    sys.modules["deepseek_cost_model"] = loaded
    assert spec.loader is not None
    spec.loader.exec_module(loaded)
    return loaded


mod = _load()


def _prices():
    return mod.Prices.from_dict(json.loads(PRICES.read_text()))


def test_default_workload_meets_goal():
    result = mod.model(_prices(), mod.DEFAULT_WORKLOAD, 0.91)
    assert result["savings_pct"] >= 40.0


def test_routing_only_baseline():
    """Routing alone saves; the cache hook closes the rest to the 40% goal.

    Pinned so a routing regression shows up as a smaller baseline rather than
    hiding behind the cache term.
    """
    result = mod.model(_prices(), mod.DEFAULT_WORKLOAD, 0.0)
    assert result["savings_pct"] >= 30.0
    assert result["savings_pct"] < 40.0


def test_judgment_agents_stay_pro():
    assert mod.tier_of("architect") == "pro"
    assert mod.tier_of("security-reviewer") == "pro"
    assert mod.tier_of("completeness-checker") == "pro"
    assert mod.tier_of("visual-qa") == "flash"


def test_cache_never_increases_cost():
    prices = _prices()
    workload = [{"agent": "test-writer", "calls": 10, "system_tokens": 20000, "output_tokens": 1000}]
    cold = mod.model(prices, workload, 0.0)["after_usd"]
    warm = mod.model(prices, workload, 0.91)["after_usd"]
    assert warm < cold


def test_cache_hit_is_clamped():
    result = mod.model(_prices(), mod.DEFAULT_WORKLOAD, 5.0)
    assert result["cache_hit"] == 0.95


def test_missing_price_keys_rejected():
    with pytest.raises(ValueError):
        mod.Prices.from_dict({"chat_in": 1})


def test_cli_requires_prices():
    out = subprocess.run([sys.executable, str(SCRIPT)], capture_output=True, text=True)
    assert out.returncode == 2


def test_cli_json_and_exit_code():
    out = subprocess.run(
        [sys.executable, str(SCRIPT), "--prices", str(PRICES), "--json", "--target", "0.99"],
        capture_output=True,
        text=True,
    )
    assert out.returncode == 1  # unreachable target → MISSES
    payload = json.loads(out.stdout)
    assert {"before_usd", "after_usd", "savings_pct", "rows"} <= payload.keys()
