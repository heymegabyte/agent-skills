"""Tests for bin/deepseek-cost-model.py — issue #6 workload measurement."""

import importlib.util
import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "bin/deepseek-cost-model.py"
PRICES = ROOT / "docs/deepseek-prices.json"


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


def _flat_prices():
    """Real rates with the Pro output multiplier neutralised.

    Isolates the rate lever from the reasoning-token lever.
    """
    return mod.Prices(**{**_prices().__dict__, "pro_output_multiplier": 1.0})


def test_routing_only_saves_nothing_at_flat_rates():
    """At the gateway's current rates, pro and flash bill identically.

    Tier routing is a latency and output-volume lever, not a rate lever. This
    test pins that truth so nobody re-derives a routing percentage from a
    fictional price spread (the earlier docs claimed 34.5% this way).
    """
    prices = _flat_prices()
    assert prices.pro_in == prices.flash_in
    assert prices.pro_out == prices.flash_out
    result = mod.model(prices, mod.DEFAULT_WORKLOAD, 0.0)
    assert result["savings_pct"] == pytest.approx(0.0, abs=0.05)


def test_all_savings_come_from_cache():
    """Flat output rates: the 40% goal is carried entirely by prompt caching."""
    prices = _flat_prices()
    cold = mod.model(prices, mod.DEFAULT_WORKLOAD, 0.0)["savings_pct"]
    warm = mod.model(prices, mod.DEFAULT_WORKLOAD, 0.91)["savings_pct"]
    assert cold == pytest.approx(0.0, abs=0.05)
    assert warm >= 60.0


def test_measured_reasoning_multiplier_still_meets_goal():
    """With measured Pro reasoning output, savings shrink but still clear 40%.

    The measured multiplier (7.1x) is a lower bound: Pro was truncated at
    max_tokens and still billed every token. If it grows, the headline saving
    goes with it, which is why the doc publishes the range.
    """
    prices = _prices()
    assert prices.pro_output_multiplier == pytest.approx(7.1)
    warm = mod.model(prices, mod.DEFAULT_WORKLOAD, 0.916)
    assert warm["savings_pct"] >= 40.0
    assert warm["savings_pct"] < mod.model(_flat_prices(), mod.DEFAULT_WORKLOAD, 0.916)["savings_pct"]


def test_pro_output_multiplier_raises_pro_cost():
    """A reasoner that bills extra reasoning tokens must show up as higher cost."""
    base = _prices()
    costs = {}
    for multiplier in (1.0, 2.0):
        prices = mod.Prices(**{**base.__dict__, "pro_output_multiplier": multiplier})
        costs[multiplier] = mod.model(prices, mod.DEFAULT_WORKLOAD, 0.91)["after_usd"]
    assert costs[2.0] > costs[1.0]


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
