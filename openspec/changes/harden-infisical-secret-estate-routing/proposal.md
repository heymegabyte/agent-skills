# Harden Infisical secret-estate routing

**Owner:** Codex `/root`

## Problem

Secret migrations can accidentally distribute administrative credentials to runtime hosts, confuse WARP enrollment with MCP authentication, or preserve stale provider-derived caches as secrets.

## Outcome

Add a reusable evidence-gated policy for exact-source validation, least-privilege Infisical placement, and retirement after destination retrieval.

## Acceptance

- Administrative credentials route to human-only projects with no runtime identity.
- WARP, MCP, and application Access credentials remain distinct.
- Derived provider caches are regenerated or retired when provider state disproves them.
- Source deletion requires exact validation and destination evidence or provider-confirmed invalidity.
