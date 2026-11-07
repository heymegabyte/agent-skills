# Design

## Context

The existing rule covers dotfiles and common system templates but does not explicitly enumerate all infrastructure classes or require implementations, tests, and recovery evidence to move upstream.

## Goals / Non-Goals

**Goals:** make Install Doctor the reusable implementation layer; keep host identity and secrets local; prevent service-name branding leakage.

**Non-Goals:** make Install Doctor own Cloudflare hostname identity, machine credentials, hardware tuning, or role-specific applications.

## Decisions

- Apply a broad reusable-infrastructure test covering services, packages, units, security, observability, backups, desktop proxies, browsers, and recovery helpers.
- Require implementation plus regression tests, not documentation alone.
- Use neutral runtime service names; the provisioner brand is not a service namespace.

## Risks / Trade-offs

- [Over-generalization] → preserve a precise host-delta boundary and capability gates.
- [Unsafe automatic installation] → require eligibility, idempotency, opt-out, least privilege, and loopback listener verification.
