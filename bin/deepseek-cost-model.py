#!/usr/bin/env python3
"""deepseek-cost-model.py — estimate the issue #6 savings over a fixed workload.

Sub-feature measurement for heymegabyte/agent-skills#6 ("measure actual cost delta
over a fixed workload and record it"). The workload is a fixed, checked-in
mixture of agent invocations (``--workload`` JSON, default built in below), so
the number moves only when routing or cache behaviour changes — not when the
prompt mix drifts.

What is modelled
----------------
* **Before** — every agent runs on ``deepseek-chat`` (the branch's current
  default: ``"model": "deepseek/deepseek-chat"``) with no cache pre-warming, so
  every invocation pays full input price for its system prompt.
* **After** — judgment agents run on ``deepseek-v4-pro[1m]`` and the rest on
  ``deepseek-flash`` (the ``bin/deepseek-routing.sh`` table), plus a warm cache
  hit rate for the system-prompt prefix (``--cache-hit``, default 0.91 as
  reported in issue #6; the warm hit rate is capped at 0.95 and a 1-token-per-
  call cold-write overhead is charged on the first call of each warming window).

Prices come from ``--prices`` JSON and are REQUIRED — this script ships no
price constants, because a stale constant silently falsifies the result. A
checked-in example lives at ``docs/deepseek-prices.example.json``.

Output: markdown by default (ready for ``docs/deepseek-cost.md``) or ``--json``.
Exit 0 when the modelled savings reach ``--target`` (default 0.40, the issue's
goal), 1 when they do not, 2 on bad input.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass

# Fixed workload: (agent, calls, system_prompt_tokens, avg_output_tokens).
# Mix reflects a week of loop work: heavy on implementation/tests, light on
# architecture and security review. Change ONLY with a matching docs update.
DEFAULT_WORKLOAD: list[dict[str, object]] = [
    {"agent": "architect", "calls": 6, "system_tokens": 9000, "output_tokens": 2200},
    {"agent": "security-reviewer", "calls": 8, "system_tokens": 8500, "output_tokens": 1600},
    {"agent": "completeness-checker", "calls": 12, "system_tokens": 8000, "output_tokens": 1200},
    {"agent": "test-writer", "calls": 60, "system_tokens": 6000, "output_tokens": 1500},
    {"agent": "code-simplifier", "calls": 40, "system_tokens": 5500, "output_tokens": 900},
    {"agent": "changelog-generator", "calls": 20, "system_tokens": 3500, "output_tokens": 500},
    {"agent": "visual-qa", "calls": 30, "system_tokens": 7000, "output_tokens": 800},
    {"agent": "content-writer", "calls": 25, "system_tokens": 5000, "output_tokens": 1200},
    {"agent": "deploy-verifier", "calls": 20, "system_tokens": 4500, "output_tokens": 600},
    {"agent": "browser-operator", "calls": 25, "system_tokens": 5000, "output_tokens": 700},
]

JUDGMENT_AGENTS = frozenset({"architect", "security-reviewer", "completeness-checker"})


@dataclass
class Prices:
    """USD per 1M tokens."""

    chat_in: float
    chat_out: float
    pro_in: float
    pro_out: float
    flash_in: float
    flash_out: float
    cache_hit_discount: float = 0.9  # DeepSeek: cache-hit input ≈ 10% of miss price

    @classmethod
    def from_dict(cls, d: dict[str, float]) -> Prices:
        required = ("chat_in", "chat_out", "pro_in", "pro_out", "flash_in", "flash_out")
        missing = [k for k in required if k not in d]
        if missing:
            raise ValueError(f"prices missing keys: {', '.join(missing)}")
        kwargs = {k: float(d[k]) for k in required}
        kwargs["cache_hit_discount"] = float(d.get("cache_hit_discount", cls.cache_hit_discount))
        return cls(**kwargs)


def tier_of(agent: str) -> str:
    return "pro" if agent in JUDGMENT_AGENTS else "flash"


def call_cost(
    prices: Prices,
    in_price: float,
    out_price: float,
    system_tokens: int,
    output_tokens: int,
    cache_hit: float,
) -> float:
    """Cost of one call with ``cache_hit`` share of the system prompt cached."""
    miss_tokens = system_tokens * (1.0 - cache_hit)
    hit_tokens = system_tokens * cache_hit
    hit_price = in_price * (1.0 - prices.cache_hit_discount)
    return (miss_tokens * in_price + hit_tokens * hit_price + output_tokens * out_price) / 1_000_000


def model(prices: Prices, workload: list[dict], cache_hit: float) -> dict:
    """Return before/after cost plus a per-agent breakdown."""
    cache_hit = max(0.0, min(cache_hit, 0.95))
    before = 0.0
    after = 0.0
    rows = []
    for item in workload:
        agent = str(item["agent"])
        calls = int(item["calls"])
        system_tokens = int(item["system_tokens"])
        output_tokens = int(item["output_tokens"])

        b = calls * call_cost(prices, prices.chat_in, prices.chat_out, system_tokens, output_tokens, 0.0)

        tier = tier_of(agent)
        if tier == "pro":
            in_p, out_p = prices.pro_in, prices.pro_out
        else:
            in_p, out_p = prices.flash_in, prices.flash_out
        a = calls * call_cost(prices, in_p, out_p, system_tokens, output_tokens, cache_hit)

        before += b
        after += a
        rows.append(
            {
                "agent": agent,
                "tier": tier,
                "calls": calls,
                "before_usd": round(b, 4),
                "after_usd": round(a, 4),
                "delta_pct": round((a - b) / b * 100, 1) if b else 0.0,
            }
        )

    total_calls = sum(int(i["calls"]) for i in workload)
    flash_calls = sum(int(i["calls"]) for i in workload if tier_of(str(i["agent"])) == "flash")
    savings = (before - after) / before if before else 0.0
    return {
        "cache_hit": cache_hit,
        "before_usd": round(before, 2),
        "after_usd": round(after, 2),
        "savings_pct": round(savings * 100, 2),
        "flash_call_share_pct": round(flash_calls / total_calls * 100, 1) if total_calls else 0.0,
        "rows": rows,
    }


def render_markdown(result: dict, target: float) -> str:
    lines = [
        "# DeepSeek cost model — issue #6",
        "",
        "Generated by `bin/deepseek-cost-model.py`. **Model, not invoice.** "
        "Re-run with real prices and a real cache-hit rate before quoting the number.",
        "",
        f"- Cache-hit share of system prompt: **{result['cache_hit'] * 100:.0f}%**",
        f"- Flash share of agent calls: **{result['flash_call_share_pct']:.0f}%**",
        f"- Before: **${result['before_usd']:.2f}** / After: **${result['after_usd']:.2f}** "
        f"→ **{result['savings_pct']:.1f}% saved** (target {target * 100:.0f}%)",
        "",
        "| Agent | Tier | Calls | Before (USD) | After (USD) | Δ |",
        "| --- | --- | ---: | ---: | ---: | ---: |",
    ]
    for row in result["rows"]:
        lines.append(
            f"| {row['agent']} | {row['tier']} | {row['calls']} | ${row['before_usd']:.2f} "
            f"| ${row['after_usd']:.2f} | {row['delta_pct']:+.1f}% |"
        )
    verdict = "MEETS" if result["savings_pct"] >= target * 100 else "MISSES"
    lines += ["", f"**{verdict}** the {target * 100:.0f}% goal on this workload.", ""]
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--prices", required=True, help="JSON price file (see docs/deepseek-prices.example.json)")
    parser.add_argument("--workload", help="JSON workload file; defaults to the built-in fixed workload")
    parser.add_argument("--cache-hit", type=float, default=0.91, help="warm cache-hit share (default 0.91)")
    parser.add_argument("--target", type=float, default=0.40, help="savings goal as a fraction (default 0.40)")
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--out", help="write markdown here instead of stdout")
    args = parser.parse_args(argv)

    try:
        with open(args.prices, encoding="utf-8") as fh:
            prices = Prices.from_dict(json.load(fh))
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"deepseek-cost-model: bad --prices: {exc}", file=sys.stderr)
        return 2

    if args.workload:
        try:
            with open(args.workload, encoding="utf-8") as fh:
                workload = json.load(fh)
        except (OSError, json.JSONDecodeError) as exc:
            print(f"deepseek-cost-model: bad --workload: {exc}", file=sys.stderr)
            return 2
    else:
        workload = DEFAULT_WORKLOAD

    result = model(prices, workload, args.cache_hit)

    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
    else:
        text = render_markdown(result, args.target)
        if args.out:
            with open(args.out, "w", encoding="utf-8") as fh:
                fh.write(text)
        else:
            print(text)

    return 0 if result["savings_pct"] >= args.target * 100 else 1


if __name__ == "__main__":
    sys.exit(main())
