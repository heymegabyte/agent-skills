## Tasks

- [x] Replay exact and fallback lookups using the installed Context7 fixture.
- [x] Verify canonical routing, generated discovery, and the packaged rule.

## Verification

The installed Context7 replay returned a verified exact response for TypeScript 5.9.3 and an unverified fallback for the unavailable version. The pinned compiler reproduced TS5109. Router tests, deterministic routing, route health, generated Codex and harness checks, skill and package validation, and strict OpenSpec passed. The rule extracted from the npm archive matched its canonical source byte for byte.
