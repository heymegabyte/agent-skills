# Design

## Context

`llm.megabyte.space` is a single Coolify-hosted LiteLLM Proxy backed by PostgreSQL and Redis. It rotates four DeepSeek credentials and exposes scoped OpenAI-compatible routes used by OpenCode. A real ROCm Ollama container already runs on the same host but is not connected to LiteLLM. The gateway image is currently selected through `main-stable`; the UI login page is publicly reachable; metrics are not scraped by the central Prometheus deployment; and runtime configuration exists only as a host bind mount.

The repository has extensive unrelated in-progress edits. This change therefore adds narrowly scoped artifacts and patches existing policy in place without reformatting or regenerating unrelated surfaces.

## Goals / Non-Goals

**Goals:**

- Make the runtime supply chain immutable and rollback-safe.
- Keep administrative identity enforcement separate from virtual-key API authentication.
- Use local inference first when it can satisfy task acceptance criteria, then rotate through DeepSeek, then retain premium escalation for frontier judgment.
- Bound load at callers, virtual keys, and deployments rather than allowing unbounded fan-out to overwhelm local or remote providers.
- Make runtime state observable and mechanically comparable with desired state.
- Ensure Claude, Gemini, Codex/OpenAI, OpenCode, and generic project entrypoints activate the same rule.

**Non-Goals:**

- Do not route customer-facing application inference through this internal gateway.
- Do not replace ProjectSites' production Cloudflare AI Gateway path.
- Do not force local models onto tasks they cannot complete effectively.
- Do not rotate or remove existing provider, master, or caller credentials.
- Do not claim multi-replica high availability until migration ownership, rate-limit fail-closed behavior, and Coolify rollout behavior are proven.

## Decisions

### Store declarative desired state beside the canonical operating policy

The agent-skills repository owns a sanitized, schema-validated LiteLLM desired-state template plus reconciliation tooling. Secret values remain environment references resolved by `get-secret`; the live rendered file remains on the Coolify host. This keeps operational knowledge and agent behavior synchronized without committing credentials.

### Pin an immutable, verified release

The service uses an exact `litellm-database` digest whose version and signature/provenance are verified before deployment. Mutable tags are recorded only as discovery inputs. Release 1.107.0 is explicitly denied because LiteLLM reported it as compromised.

### Protect administration at the edge, preserve API compatibility

Cloudflare Access covers `/ui/*`. `/v1/*` remains reachable to non-browser clients and relies on scoped LiteLLM virtual keys. Administrative API routes remain master-key protected and are tested with unprivileged credentials. This avoids breaking OpenCode while removing anonymous access to the login surface.

### Connect Ollama privately and expose capability aliases

LiteLLM reaches Ollama over a host-private or shared Docker network, never a new public ingress. Only models actually present and smoke-tested are advertised. Stable capability aliases allow callers to request local code/general work without binding policy to a transient Ollama tag; DeepSeek routes remain fallbacks.

### Layer backpressure and safe degradation

Virtual keys receive finite RPM, TPM, budget, and parallel-request limits. Local deployments receive lower concurrency than remote pools. Retry policy avoids retrying authentication and policy failures, and every advertised throughput alias has an explicit fallback. Limits are introduced below current observed peaks and verified with the existing OpenCode client.

### Treat observability and drift as release gates

Prometheus uses a dedicated least-privilege credential delivered through the secret rail. Alerts cover readiness, deployment cooldown/unhealthy state, error ratio, saturation, fallback growth, and spend-log freshness. Reconciliation compares sanitized live configuration, image digest, model inventory, Access policy, and scrape health to desired state.

## Risks / Trade-offs

- [A new salt makes stored ciphertext unreadable] → Count and inspect credential-bearing DB records first; set the salt only if no existing salt-encrypted material exists, otherwise recover the original value.
- [Access blocks OpenCode] → Scope Access only to UI paths and test API responses both with and without virtual keys before and after rollout.
- [Local model overloads the ROCm host] → Select from already installed models, cap concurrency, verify memory headroom, and retain DeepSeek fallbacks.
- [A version pin misses security fixes] → Add a scheduled update audit that proposes a newly verified digest rather than following mutable tags automatically.
- [Desired-state publication leaks secrets] → Commit environment-variable names and hashes only; prohibit rendered configuration and secret values from reports.
- [Shared dirty worktrees cause collateral changes] → Patch only owned lines/files and report every touched repository separately.

## Migration Plan

1. Capture sanitized pre-change evidence and restorable backups of the live config and service definition.
2. Add desired-state schema/tests and make them fail on the current mutable image, missing local route, and missing awareness contract.
3. Inspect Ollama inventory/networking and DB credential state; stage the immutable image and secret references without restarting callers.
4. Apply gateway configuration and limits, redeploy once, then verify readiness, model inventory, local completion, DeepSeek completion, OpenCode completion, spend logging, and rollback metadata.
5. Add Cloudflare Access for `/ui/*`; verify UI enforcement and unchanged `/v1` behavior.
6. Add private metrics collection and alerts; verify Prometheus targets and rule evaluation.
7. Update agent skills, router metadata, harness entrypoints, and ProjectSites naming; run cross-harness awareness tests.
8. Reconcile live state to desired state and archive the OpenSpec change. On any failed release gate, restore the captured config/image and redeploy.
