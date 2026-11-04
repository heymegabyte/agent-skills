---
name: ideal-architecture-loop
description: Context-aware whole-system improvement loop for perfect/build/audit requests spanning product, application, website, infrastructure, security, integrations, operations, and business outcomes.
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Ideal Architecture Loop

For broad “perfect/build/improve the whole thing” work, repeatedly inspect the important lenses below. Skip a lens only with a recorded reason; do not invent irrelevant infrastructure.

`intent → user journeys → product/business → UX/content/accessibility → application/domain → data/state → APIs/protocols → services/jobs → integrations/MCP → agents/models/prompts → identity/secrets/permissions → filesystem/runtime/network/firewall → supply chain/CI/deploy → resilience/recovery → observability/evals/cost → compliance/privacy → operations/support/growth`

For each applicable lens:

1. Establish current evidence from code, runtime, MCP context and authoritative web sources.
2. Generate multiple improvements, deduplicate them, score impact/confidence/effort/risk/reversibility.
3. Ship all safe low-hanging winners under `[[low-hanging-fruit]]`.
4. Classify every task through `[[openspec-operating-contract]]`; every durable mutation uses OpenSpec.
5. Delegate independent, context-light research and mechanical implementation to the cheapest capable agent; preserve frontier models for synthesis, security, architecture and adversarial review.
6. Verify the integrated system, then repeat only where new evidence produces new actionable work.

Converge after two consecutive passes find no new justified in-scope change above the configured value threshold. Infinite ideation is not convergence. Preserve an evidence ledger so the next run resumes rather than repeats.
