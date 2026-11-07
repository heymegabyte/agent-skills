---
name: infisical-secret-delivery
description: Integrate, audit, migrate, or verify Infisical secret delivery for applications, services, CI, agents, and fleet hosts. Use when work involves machine identities, workload identity, get-secret, environment-variable injection, local/offline secrets, secret rotation, least-privilege authorization, or cross-repository secret policy.
---

# Infisical secret delivery

Treat Infisical as the preferred operational secret authority. Keep `get-secret KEY` as the portable single-secret interface and use a workload wrapper for process launch.

## Workflow

1. Inventory the workload, runtime, authoritative environment variables, startup phase, network availability, and existing secret consumers. Never read or print values.
2. Create a versioned manifest containing only secret names and references: workload id, project, environment, fixed path, auth method, injected key allowlist, optional renames, rotation owner, and offline exceptions.
3. Allocate one machine/workload identity per independently revocable workload. Prefer platform-native or OIDC auth; use Universal Auth only where federation is unavailable.
4. Grant only the required project/environment/path/actions. Remember grants are additive: identify and remove broader inherited grants before claiming least privilege.
5. Inject only the manifest allowlist at process launch. Do not export a project, recursively fetch a parent path, accept caller-selected scope, write `.env`, place values in arguments, or inherit unrelated secret-shaped environment variables.
6. Bind project, environment, and path in trusted configuration. Treat caller overrides as errors in production.
7. Fail closed when Infisical is configured but unavailable or denies access. Never fall back to controller credentials or a broader local store.
8. Permit local material only for declared machine-scoped pre-network, offline, or disaster-recovery dependencies. Protect it at rest; define expiry, rotation, revocation, and deletion; prove it cannot resolve undeclared names.
9. Test one permitted read and denied cross-workload, cross-environment, parent-path, administrative, recovery-root, and caller-supplied-scope access. Test expiry, renewal, rotation, and revocation without exposing values.
10. Emit metadata-only audit events: identity, workload, secret name/reference, action, outcome, and bounded reason. Never log values or credential material.

For current capability constraints and source links, read [references/infisical.md](references/infisical.md).

## Runtime rules

- Prefer native service credential mechanisms where available (`systemd` credentials, orchestrator secret mounts, platform secret bindings); otherwise use a tightly scoped child-process environment.
- Never make every repository inherit the same environment. “Minimum environment” means an explicit per-workload allowlist.
- Keep bootstrap credentials separate from application secrets. Use short-lived access tokens and renew before expiry.
- Do not assume Infisical Agent is a general offline cache. An offline exception requires a separate encrypted design and an explicit threat model.
- Preserve old recovery keys until all retained recovery points are expired, migrated, or restore-tested.
- Do not mutate live identities, grants, or secrets without verified target ids, subscription capability, rollback/revocation steps, and authorization.

## Completion evidence

Record the manifest, identity/grant ids (not credentials), permitted/denied test outcomes, rotation and revocation results, secret-scan result, process/log leak checks, and each offline exception. Generated configuration or a running process alone is not verification.
