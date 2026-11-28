---
name: "production-delivery-closure"
description: "Concurrent end-of-prompt finishing work followed by exact-tree validation, normal main publication, approved production promotion, and live smoke/E2E proof."
last_reviewed: 2026-11-24
superseded_by: null
priority: 1
pack: "core"
triggers:
  - "commit"
  - "push"
  - "production"
  - "deploy"
  - "documentation"
  - "theme.tools"
paths:
  - "*"
---

# Production Delivery Closure

- **Atomic `Commit → Push → Publish (Live Deploy + CDN Purge) → Live Edge Verify` Mandate**: Every prompt touching a site, worker, or app MUST automatically build, commit, push to `origin/main`, **publish/deploy live (`pnpm deploy` / `npx wrangler deploy`)**, purge the Cloudflare CDN cache, and verify the live production domain (`https://<domain>/`, `/api/health`, `/og.png`, `/favicon.svg`, `/apple-touch-icon.png`) in the same turn. Never treat `git push` alone as completion without publishing live.
- **Hydration and OpenSpec delivery.** Follow [the parallel delivery workflow](parallel-multi-swarm-orchestration.md) for material engineering work.

Serialize the integrity boundary after those lanes reconcile:

1. Regenerate governed outputs from canonical sources.
2. Revalidate the exact final tree after all documentation, extraction, and generated-output changes.
3. Commit only that tested tree and push the commit normally to `main` through repository-approved integration controls.
4. Promote that exact immutable source/artifact through the approved production rail.
5. Run production smoke and critical E2E journeys, then inspect telemetry for regressions.

Never merge an untested tree, force-push, bypass review or branch protection, or mutate production when authority, credentials, spending permission, recovery, validation, provenance, or health gates are missing. Preserve the verified checkpoint and report the exact blocker. For repositories without a deployable production surface, finish at their repository-prescribed publication and consumer-verification boundary rather than inventing a deployment.
