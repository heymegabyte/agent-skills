# Tasks

## 1. Contracts and safety evidence

- [x] 1.1 Add failing desired-state and cross-harness awareness tests for immutable image selection, compromised-version denial, secret references, local Ollama discovery, scoped keys, observability, and explicit project exceptions.
- [x] 1.2 Capture sanitized live inventory, database credential counts, current image digest, Ollama capacity, and rollback material without exposing secrets.

## 2. Gateway runtime

- [x] 2.1 Verify and pin a safe LiteLLM image digest; preserve the previous digest as rollback metadata.
- [x] 2.2 Establish `LITELLM_SALT_KEY` through the portable secret rail only after the database compatibility gate passes.
- [x] 2.3 Connect and smoke-test an installed Ollama model over private networking; publish bounded capability aliases and DeepSeek fallbacks.
- [x] 2.4 Apply scoped virtual-key constraints, complete fallback coverage, duplicate-setting cleanup, backpressure, cost validation, and health settings.
- [x] 2.5 Redeploy and verify readiness, cache, model inventory, local inference, DeepSeek inference, OpenCode inference, spend logging, and rollback viability.

## 3. Edge access and observability

- [x] 3.1 Create an idempotent Cloudflare Access application/policy for `/ui/*` and prove `/v1/*` remains virtual-key authenticated.
- [x] 3.2 Provision a least-privilege metrics credential, enable the Prometheus scrape, and add LiteLLM availability/error/saturation/fallback/spend-freshness alerts.
- [x] 3.3 Correct stale Grafana annotations and verify targets, rules, and representative dashboard queries.

## 4. Desired state and project awareness

- [x] 4.1 Add a sanitized versioned gateway desired state, schema, reconciliation command, update audit, and operator runbook to agent-skills.
- [x] 4.2 Update the LiteLLM rule/reference, provider policy, router/packs, and Claude/Gemini/Codex/OpenAI/generic entrypoints so projects activate the same capability-first OpenCode policy.
- [x] 4.3 Correct the ProjectSites Workers AI route that is mislabeled as Ollama and preserve its explicit production routing boundary.

## 5. Integrated verification

- [x] 5.1 Run agent-skills policy, portable-skill, OpenCode swarm, desired-state, secret-hygiene, and strict OpenSpec validation suites.
- [x] 5.2 Run Grafana/Prometheus configuration and rule tests plus ProjectSites targeted tests.
- [x] 5.3 Reconcile production to desired state, sync capability specs, archive the change, and record any independently blocked follow-up with evidence.

## Workflow follow-up

- Commit or publish only when separately authorized by each repository's workflow.
