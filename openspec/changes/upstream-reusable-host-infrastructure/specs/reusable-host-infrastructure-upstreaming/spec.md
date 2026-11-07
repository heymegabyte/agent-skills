# Spec Delta

## Purpose

Ensures proven fleet-host infrastructure becomes reproducible estate-wide behavior rather than remaining an undocumented or host-local exception.

## ADDED Requirements

### Requirement: Same-turn upstreaming
Agents SHALL incorporate every reusable live-host infrastructure change into Install Doctor in the same turn, including implementation, gating, tests, documentation, and recovery evidence.

#### Scenario: Reusable host service is added
- **WHEN** an agent installs or changes infrastructure that another estate host could use
- **THEN** Install Doctor receives the generalized implementation before the task is complete

### Requirement: Host-specific boundary
Agents SHALL keep hostnames, secrets, tunnel identities, device identifiers, hardware tuning, and role-specific workloads in the host repository.

#### Scenario: Generalizing a host integration
- **WHEN** the host implementation contains machine-bound values
- **THEN** those values are parameterized or excluded from Install Doctor

### Requirement: Capable desktop proxy baseline
Install Doctor SHALL reconcile native live-GNOME KasmVNC on non-container Linux GNOME desktops with at least 16 GiB RAM unless explicitly opted out.

#### Scenario: Eligible desktop
- **WHEN** host eligibility is measured during provisioning
- **THEN** neutral loopback-only desktop services are reconciled without launching unrelated applications
