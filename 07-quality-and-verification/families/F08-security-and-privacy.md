---
name: "F08-security-and-privacy"
family: "F08"
title: "F08 — Security and privacy"
default_layer: "security"
default_tier: "required-ci"
recommendations_count: 30
updated: "2026-11-04"
---

# F08 — Security and privacy (30 Recommendations: F08.01–F08.30)

> **Summary**: Role/tenant authorization matrices, direct API bypass probes, IDOR/cross-tenant cache/R2 checks, JWT/OAuth/PKCE/CSRF/CORS validation, SQLi/XSS/SSRF/upload traversal defenses, secret canary scanning, privacy deletion/export, and OWASP ASVS mapping.
> **Default Layer**: `security` · **Default Execution Tier**: `required-ci` · **Primary Tools**: Vitest Security Probes, Semgrep, Secret Canary Scanner, OWASP ASVS Matrix

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F08 Recommendation Catalog (F08.01–F08.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F08.01`** | Authorization matrix | `P0` | `security` | `required-ci` | `verified` | Test role, operation, and tenant authorization matrix on critical workflows including least-privileged and suspended accounts. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.02`** | Direct endpoint bypass | `P0` | `security` | `required-ci` | `verified` | Call protected server endpoints directly with forbidden operations to prove server-side enforcement beyond UI hiding. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.03`** | Object-level ownership (IDOR) | `P0` | `security` | `required-ci` | `verified` | Test object identifiers across read, list, search, bulk update, and export endpoints for ownership enforcement. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.04`** | Indirect cross-tenant paths | `P0` | `security` | `required-ci` | `verified` | Attempt cross-tenant access through cache keys, R2 object names, signed links, and background jobs. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.05`** | In-flight revocation | `P0` | `security` | `required-ci` | `verified` | Exercise session expiry, logout, revocation, password changes, and suspension while requests are in flight. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.06`** | Token validation strictness | `P0` | `security` | `required-ci` | `verified` | Reject credentials with invalid signatures, issuers, audiences, scopes, or validity windows without permissive fallbacks. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.07`** | OAuth & PKCE integrity | `P0` | `security` | `required-ci` | `verified` | Test OAuth state binding, PKCE verification, allowed redirects, and single-use auth codes against replay and substitution. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.08`** | CSRF resistance | `P0` | `security` | `required-ci` | `verified` | Prove browser-initiated state changes resist CSRF under actual cookie/auth design across alternate methods and content types. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.09`** | Credentialed CORS policy | `P0` | `security` | `required-ci` | `verified` | Test credentialed CORS against explicit origin policy, malformed origins, and preflight handling. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.10`** | Injection boundaries | `P0` | `security` | `required-ci` | `verified` | Challenge untrusted query boundaries with SQL, command, and template injection inputs while preserving valid behavior. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.11`** | SSRF & outbound URL guards | `P1` | `security` | `required-ci` | `verified` | Test outbound URL validation against private IPs, metadata endpoints, redirect chains, alternate encodings, and DNS rebinding. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.12`** | Upload security limits | `P1` | `security` | `required-ci` | `verified` | Exercise upload size limits, MIME sniffing vs declared type, path traversal, decompression bombs, and safe storage keys. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.13`** | Security headers & CSP | `P1` | `security` | `required-ci` | `verified` | Verify CSP, framing restrictions, HSTS, and cookie attributes (HttpOnly, Secure, SameSite) on HTML and error responses. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.14`** | XSS sanitization | `P1` | `security` | `required-ci` | `verified` | Render hostile rich text, filenames, URLs, and Markdown through real sanitization paths against stored and reflected XSS. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.15`** | Secret canary scanning | `P1` | `security` | `required-ci` | `verified` | Scan logs, traces, fixtures, screenshots, and downloadable artifacts for planted secret canaries. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.16`** | Dependency vulnerability gate | `P1` | `security` | `required-ci` | `verified` | Check dependency vulnerabilities using the resolved graph and preserve findings rather than masking scanner outages. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.17`** | Supply-chain build provenance | `P1` | `security` | `required-ci` | `verified` | Test dependency installation and build provenance rules for untrusted lifecycle scripts and lockfile tampering. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.18`** | API key scope & rotation | `P1` | `security` | `required-ci` | `verified` | Exercise API key scope restrictions, rotation overlap, revocation, and tenant binding against privilege escalation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.19`** | Distributed rate limiting | `P1` | `security` | `required-ci` | `verified` | Test rate limits across concurrent clients and instances, including key collisions, recovery windows, and tenant isolation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.20`** | Trusted proxy header spoofing | `P1` | `security` | `required-ci` | `verified` | Test X-Forwarded-For/Host/Proto and client identity handling against spoofed headers at proxy boundaries. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.21`** | Webhook signature & replay guard | `P1` | `security` | `required-ci` | `verified` | Validate webhook signatures against raw request bytes and freshness windows; test replay and body mutation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.22`** | Encryption & TLS verification | `P1` | `security` | `required-ci` | `verified` | Verify encryption and transport requirements to detect insecure fallbacks, wrong keys, or plaintext persistence. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.23`** | Account enumeration resistance | `P2` | `security` | `required-ci` | `verified` | Compare auth and recovery responses for timing/message enumeration and sensitive error leakage. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.24`** | Consent withdrawal enforcement | `P2` | `security` | `required-ci` | `verified` | Test consent withdrawal and tracking preferences across storage, server events, and background exports. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.25`** | Privacy deletion completeness | `P2` | `security` | `required-ci` | `verified` | Exercise privacy deletion across primary records, search indexes, object storage, and downstream jobs. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.26`** | Personal data export isolation | `P2` | `security` | `required-ci` | `verified` | Test personal data export permissions, ownership, redaction, and expiring download links across multiple tenants. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.27`** | Sandbox execution canaries | `P2` | `security` | `required-ci` | `verified` | Probe generated code execution boundaries using harmless filesystem and network canaries. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.28`** | Denied-operation audit trails | `P2` | `security` | `required-ci` | `verified` | Assert denied sensitive operations produce useful audit records without leaking protected payloads. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.29`** | Data minimization & retention | `P2` | `security` | `required-ci` | `verified` | Test data minimization and retention rules against newly added fields, stale records, and incomplete deletion batches. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
| **`F08.30`** | OWASP ASVS traceability | `P2` | `security` | `required-ci` | `verified` | Map applicable OWASP ASVS requirements to concrete positive and negative test cases with documented exclusions. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F08`)* |
