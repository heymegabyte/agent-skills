---
name: "flaky-test-elimination"
version: "3.0.0"
updated: "2026-11-05"
description: "Statistical flaky test stressing (N>=10 iterations with timing jitter) and autonomous git bisect regression localization (bin/flaky-test-stressor.ts, bin/git-bisect-agent.ts)."
triggers:
  - "flaky-test"
  - "stress-test"
  - "git-bisect"
  - "intermittent-failure"
---

# Statistical Flaky Test Stressing & Git Bisect

This skill prevents agents from falling into the "passed once, so it's fixed" trap when diagnosing intermittent CI failures.

## 1. Operating Doctrine

- **Volume Testing**: Never trust a single green test run for a reported flaky test. Execute $N \ge 10$ runs with microsecond jitter via [`bin/flaky-test-stressor.ts`](file:///Users/Apple/.agentskills/bin/flaky-test-stressor.ts).
- **Regression Localization**: When a previously passing test starts failing across commit history, run headless binary search via [`bin/git-bisect-agent.ts`](file:///Users/Apple/.agentskills/bin/git-bisect-agent.ts) to isolate the breaking commit.
