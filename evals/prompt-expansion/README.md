# §28 — Prompt-Expansion Benchmark

Promptfoo suite that scores the Megabyte agent's **prompt expansion**: given a
thin, one-line build request, does the agent expand the *seed* into the full
80% arc **before** building — per `predictive-completeness`,
`first-time-excellence`, and `competitor-research`?

This grades **generation quality**, not plumbing — the eval-vs-E2E split in
`rules/evals.md` (Promptfoo is the chosen tool there). It complements AI-vision
QA (which scores rendered UI) by scoring the *thinking* that precedes code.

## What it measures

Seven benchmark requests (`cases/*.yaml`), each expanded by the provider under
test and judged against **eleven quality dimensions** (shared `defaultTest` in
`promptfooconfig.yaml`) plus request-specific assertions:

| # | Dimension (metric)                 | A strong expansion… |
|---|------------------------------------|---------------------|
| 1 | `understands_intent`               | restates the JOB, not the literal words |
| 2 | `researches_competitors`           | names real comparable products |
| 3 | `uses_evidence`                    | grounds claims in specifics, not vibes |
| 4 | `architecture_alternatives`        | weighs >1 approach, then picks one |
| 5 | `feature_inventory`                | full arc incl. empty/loading/error/edge states |
| 6 | `major_screens`                    | names the screens/routes |
| 7 | `golden_paths`                     | ≥2 end-to-end user journeys |
| 8 | `reusable_components`              | shared primitives, not one-off pages |
| 9 | `coherent_reqs`                    | discrete, testable OpenSpec-style reqs |
| 10| `actionable_tasks`                 | sequenced, pick-up-able tasks |
| 11| `decide_and_proceed`               | states assumptions; no redundant clarifying questions |

The seven requests: **Build an amazing CMS** · **Build a modern CRM** · **Build
a complete booking system** · **Build a beautiful analytics dashboard** ·
**Improve this empty-looking screen** · **Create an SEO blog article about our
product** · **Add a complicated integration**. The last three deliberately probe
`decide_and_proceed` and *no-fabrication* under an under-specified brief.

## Provider policy (hard — `rules/agent-provider-policy.md`)

- Runs on the **one allowed internal API: DeepSeek** (OpenAI-compatible
  endpoint). The LLM-rubric **judge** runs on the same DeepSeek rail, so no
  second provider key is needed.
- **NEVER** `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` for this internal eval. The
  subscription CLIs (`claude` / `codex` via
  `~/.agentskills/bin/with-subscription-cli.sh`) are the frontier judgment rail
  for interactive work but cannot be a promptfoo provider, so the benchmark
  grades on DeepSeek by design.
- The key is resolved at runtime from `get-secret` and injected into **this
  process only** — never hardcoded in the YAML, never committed, never printed.

## Run

```sh
# From this directory. Inject the DeepSeek key into THIS shell only.
export DEEPSEEK_API_KEY="$(get-secret DEEPSEEK_API_KEY)"

# Full benchmark (7 cases × 11 shared + per-case assertions):
npx -y promptfoo@0.124.1 eval -c promptfooconfig.yaml

# One case while iterating (regex on the case `description`):
npx -y promptfoo@0.124.1 eval -c promptfooconfig.yaml --filter-pattern crm

# Smoke (first case only, no judge spend beyond one row):
npx -y promptfoo@0.124.1 eval -c promptfooconfig.yaml -n 1

# Browse the scored results in the local UI:
npx -y promptfoo@0.124.1 view
```

> `npx promptfoo eval` is the canonical command; `@0.124.1` pins the version the
> suite was authored against. Drop the pin to float to latest.

## CI gate (regression tracking per `rules/evals.md`)

Append every run to NDJSON so composite-score regressions show as a trend, and
fail CI past a threshold:

```sh
export DEEPSEEK_API_KEY="$(get-secret DEEPSEEK_API_KEY)"
npx -y promptfoo@0.124.1 eval -c promptfooconfig.yaml \
  -o "results/$(date -u +%Y%m%dT%H%M%SZ).json" \
  --no-share
# promptfoo exits non-zero if any test fails its assertions → gates the build.
```

Results are git-ignored artifacts; keep history by committing the NDJSON/JSON
snapshots per-commit if you want the trend in-repo.

## Validate (no API calls, no key)

```sh
# YAML parses:
yq eval '.' promptfooconfig.yaml >/dev/null && echo OK
for f in expansion-prompt.yaml cases/*.yaml; do yq eval '.' "$f" >/dev/null || echo "BAD: $f"; done

# promptfoo's own config validator (resolves file:// refs + schema):
npx -y promptfoo@0.124.1 validate -c promptfooconfig.yaml
```

## Layout

```
prompt-expansion/
├── promptfooconfig.yaml      # providers + prompt + 11 shared rubric assertions + test glob
├── expansion-prompt.yaml     # the chat prompt UNDER TEST (system + {{request}})
├── cases/                    # one file per benchmark request
│   ├── 01-cms.yaml
│   ├── 02-crm.yaml
│   ├── 03-booking.yaml
│   ├── 04-analytics-dashboard.yaml
│   ├── 05-improve-empty-screen.yaml
│   ├── 06-seo-blog-article.yaml
│   └── 07-complicated-integration.yaml
└── README.md
```

## Add a benchmark request

1. Drop `cases/NN-slug.yaml` with `description`, `vars.request`,
   `vars.org_type`, and any request-specific `assert` entries. The glob picks it
   up automatically — it inherits all eleven shared dimensions.
2. Keep request-specific rubrics focused on what makes THIS domain's expansion
   good (its defining capabilities + how it should handle any under-specification).

## Tuning the bar

- The **prompt under test** lives in `expansion-prompt.yaml`. It encodes the
  expansion contract WITHOUT quoting the rubric wording — so the benchmark
  measures real expansion ability, not rubric-parroting. Re-tune there to raise
  the floor.
- Rubric wording lives in `defaultTest.assert` (shared) and each case (specific).
  Judges drift (`rules/evals.md` § LLM-as-judge discipline) — recalibrate wording
  against periodic human spot-checks.
