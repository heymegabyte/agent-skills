---
last_reviewed: 2026-11-11
superseded_by: null
name: "scale-honesty-100x"
priority: 2
pack: "backend"
triggers:
  - "scale"
  - "performance"
  - "load"
paths:
  - "*"
---

# Scale-Honesty — Name What Breaks at 100×

Before shipping anything that handles data, load, users, or spend, state the FIRST thing that breaks
at 100× current scale — and then decide, out loud, whether you care yet. This is not premature
optimization: it's naming the cliff so the decision to defer it is deliberate, not accidental. A
silent scale cliff is the defect; a documented, chosen one is fine.

Cross-links: `[[cost-per-request-accountability]]` · `[[error-budget]]` · `[[quality-metrics]]` · `[[state-is-the-enemy]]` · `[[hardware-aware-programming]]` · `[[production-observability-default-on]]`

## The rule

- **At ship, write one line: "At 100× this, the first thing that breaks is ___ (and I do / don't care
  yet because ___)."** Cover the relevant axis: rows, requests/sec, concurrent users, payload size,
  fan-out, token spend, storage.
- **Know the hard limits you're near.** Worker CPU/subrequest caps, D1 row/query limits, DO
  single-threaded throughput, KV write rate, list-without-pagination, unbounded in-memory growth,
  N+1 queries, an O(n²) loop on a list that grows.
- **Defer deliberately, not blindly.** "100× is 50 rows → fine" is a valid, honest answer. "I never
  checked" is not. The point is the DECISION exists and is recorded.
- **Pagination / streaming / bounded buffers are the default** for anything that returns a collection;
  "it's small now" is the trap that ships the unbounded version.

## Anti-patterns

- Shipping a list/query/loop with no idea where it falls over, then discovering it in production.
- An unbounded fetch/accumulate "because the dataset is small today."
- Confusing this with premature optimization — naming the cliff is cheap; the optimization is deferred.
- A cost/scale cliff invisible because nothing measures it (pair with `[[production-observability-default-on]]`).
