---
name: "product-completeness"
priority: 2
pack: "testing"
triggers:
  - "complete"
  - "completeness"
  - "done"
  - "shipped"
  - "feature complete"
  - "coverage"
  - "golden path"
last_reviewed: 2026-10-08
superseded_by: null
paths:
  - "*"
---

# Product Completeness

**A feature is complete only when requirement + implementation + tests + observed behavior AGREE.**

Four signals, one verdict. Any one missing or disagreeing ⇒ NOT complete — regardless of how
polished the other three look. This is the measurable floor beneath `predictive-completeness`
(build the full arc) and `verification-loop` (prove it on PROD).

## The four signals

1. **Requirement** — a written spec exists for it (OpenSpec `### Requirement:` / `#### Scenario:`,
   or an equivalent acceptance statement). No requirement ⇒ scope is a guess, not a feature.
2. **Implementation** — a real code surface ships it (component/route/page/handler), not a stub.
3. **Tests** — a golden-path / E2E spec with ≥1 real assertion exercises it. An empty `.spec.ts` is
   a gap, not coverage.
4. **Observed behavior** — a RECORDED run says it passed. Presence of a spec is NOT a pass; absence
   of a run report ⇒ behavior is **UNKNOWN**, never assumed green.

Disagreement examples that all read "not complete": a requirement with no matching surface; a
surface with no test; a test that is a stub; a recorded run with failures; an integration declared
in the spec but never wired.

## Honesty over optimism

- Distinguish **unmeasurable** (no spec / no run report → `0` or `unknown`) from **0% done**. Never
  paper over a missing signal with an inferred one.
- `required = 0` is "nothing specified," not "fully done." Report it as such.
- Do not fabricate a passing count from the mere existence of test files — only a recorded run
  report yields `passing`.

## Tool

`bin/product-completeness.mjs <projectDir>` scans ACTUAL on-disk evidence (OpenSpec `openspec/`
specs + changes, impl globs, golden-path/test specs, recorded run reports, declared-vs-wired
integrations) and emits a JSON report: required-vs-implemented features, required-vs-completed
screens, golden paths defined/implemented/passing, integration completeness, and outstanding gaps
— with honest `0`/`null`/`unknown` where it cannot measure.

- `--compact` single-line JSON · `--ci` exits 1 on a genuine measurable gap (open task, failing
  run, required-but-unimplemented feature/screen, stub spec), never on "unmeasurable."
- Pair with `verification-loop` (prod-E2E) and `drift-detection` (features without flags/tests) —
  this rule scores the artifacts; those two close the loop.
