# Requirement Ledger — reference

The **Requirement Ledger** is the foundation of the Knowledge + Requirement Graph: a
per-project, append-friendly record of what the project must do, with forward edges to the
artifacts that prove each requirement (tests, golden-paths, routes, decisions). The CLI
`bin/req.mjs` is generic and lives in agent-skills; the **data is per-project**.

## Where the data lives

`.pcc/ledger/requirements.jsonl` in whatever project `req` is run against — created on the
first `req add`. JSONL (one JSON object per line), **not** SQLite: the ledger is small, so the
tool reads-all / mutates / rewrites. JSONL stays diff-friendly, append-friendly, and zero-dep
(Node built-ins only) — don't reach for a database when a flat file does the job.

## Record schema (one line each)

```json
{
  "id": "R-001",
  "title": "Users can sign in",
  "description": "",
  "priority": "must | should | could | wont",
  "status": "open | in-progress | blocked | closed",
  "acceptance": ["card is charged", "receipt emailed"],
  "tests": ["e2e/checkout.spec.ts"],
  "routes": ["/checkout"],
  "golden_paths": ["gp-checkout"],
  "decisions": ["ADR-0007"],
  "evidence": ["prod screenshot url", "log line"],
  "provenance": { "intent": "…", "source": "user prompt 2026-10-05" },
  "created": "2026-10-05T00:00:00.000Z",
  "updated": "2026-10-05T00:00:00.000Z"
}
```

- **IDs** are stable + monotonic: `R-001`, `R-002`, … Never reused, even after a requirement
  closes. `show`/`update`/`close` accept loose forms (`r-1`, `R1`) and normalize.
- **`acceptance[]`** — human-readable pass criteria (strings).
- **`tests[]` · `golden_paths[]` · `routes[]` · `decisions[]`** — the forward edges of the
  coverage graph. A requirement is *covered* when it has ≥1 test OR ≥1 golden-path.
- **`provenance`** — where the requirement came from (intent + source), for traceability.

## CLI surface

```bash
req add --title "…" --priority must [--description "…"] [--acceptance "…" …] [--source "…"] [--intent "…"]
req list [--status …] [--priority …] [--json]
req show R-NNN [--json]
req update R-NNN [--status …] [--title …] [--description …] \
                 [--link-test <path>] [--link-golden-path <id>] [--link-route <str>] \
                 [--link-decision <id>] [--add-acceptance "…"] [--add-evidence "…"]
req close R-NNN [--force]
req coverage [--json]
```

- Repeated flags accumulate (`--acceptance "a" --acceptance "b"` → two criteria). Link edges
  de-duplicate.
- Output is styled on a TTY and plain in pipes/CI (`NO_COLOR` honored). No `gum` dependency.

## The closure gate (`req coverage`)

`req coverage` is the gate a CI job or convergence loop runs. It prints counts + the id lists
for requirements with **no test**, **no golden-path**, **no acceptance criteria**, and
`must`-priority items still `open`. It exits:

- `0` — every `must` requirement is covered (has a test OR a golden-path).
- `2` — ≥1 `must` requirement has **neither** a test **nor** a golden-path. This is the hard
  fail a loop gates on: a critical requirement nothing proves.

`req close` enforces the same spirit per-record: it **refuses** to close a requirement with
zero acceptance criteria, or with zero tests **and** zero golden-paths, unless `--force`.

## How the coverage graph binds (the next increment plugs in here)

Each requirement owns its forward edges, so binding an artifact to a requirement is one
command — no central index to keep in step:

- A **test** binds with `req update R-NNN --link-test <path>`.
- A **golden-path** binds with `req update R-NNN --link-golden-path <id>` — this is the seam a
  Golden-Path Grower writes to: when it generates a long journey for a requirement, it records
  the path id on that requirement, and `req coverage` immediately counts the requirement as
  covered. The golden-path's own record (its steps/surfaces) lives in its own store; the ledger
  holds only the binding id, keeping the two layers decoupled.
- A **route** binds with `--link-route <str>`; a **decision/ADR** with `--link-decision <id>`.

## Example session

```bash
req add --title "Checkout works" --priority must --acceptance "card charged"   # → R-001
req update R-001 --link-test e2e/checkout.spec.ts --link-golden-path gp-checkout --status in-progress
req coverage                                                                    # GATE PASS
req close R-001                                                                  # acceptance + proof present
```
