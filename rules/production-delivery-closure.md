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

For every implementation turn, run proportional tests, documentation/comment reconciliation, release preparation, and bounded extraction reviews for `theme.tools`, `install.doctor`, `agent-skills`, and materially touched repositories concurrently where dependencies permit.

Serialize the integrity boundary after those lanes reconcile:

1. Regenerate governed outputs from canonical sources.
2. Revalidate the exact final tree after all documentation, extraction, and generated-output changes.
3. Commit only that tested tree and push the commit normally to `main` through repository-approved integration controls.
4. Promote that exact immutable source/artifact through the approved production rail.
5. Run production smoke and critical E2E journeys, then inspect telemetry for regressions.

Never merge an untested tree, force-push, bypass review or branch protection, or mutate production when authority, credentials, spending permission, recovery, validation, provenance, or health gates are missing. Preserve the verified checkpoint and report the exact blocker. For repositories without a deployable production surface, finish at their repository-prescribed publication and consumer-verification boundary rather than inventing a deployment.
