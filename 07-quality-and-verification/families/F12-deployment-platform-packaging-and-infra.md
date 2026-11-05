---
name: "F12-deployment-platform-packaging-and-infra"
family: "F12"
title: "F12 — Deployment, platform, packaging, and infrastructure"
default_layer: "contract"
default_tier: "required-ci"
recommendations_count: 30
updated: "2026-11-04"
---

# F12 — Deployment, platform, packaging, and infrastructure (30 Recommendations: F12.01–F12.30)

> **Summary**: Clean-checkout builds, workerd vs deployed parity, startup env schema validation, Preview vs Production binding isolation, artifact-to-commit provenance, published package tarball consumer checks, CLI quoting/exit-code safety, and HTTP cache partitioning.
> **Default Layer**: `contract` · **Default Execution Tier**: `required-ci` · **Primary Tools**: Wrangler, Package Consumer Smoke, Artifact Identity Gate, Bash Quoting Verifier

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F12 Recommendation Catalog (F12.01–F12.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F12.01`** | Clean-checkout hermetic build | `P0` | `contract` | `required-ci` | `verified` | Build from a clean checkout with declared lockfile and toolchain, proving artifacts never depend on undeclared local state. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.02`** | Workerd runtime & deployed parity | `P0` | `contract` | `required-ci` | `verified` | Run Worker integration tests in workerd and focused deployed checks for capabilities local emulation cannot prove. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.03`** | Startup environment schema validation | `P0` | `contract` | `required-ci` | `verified` | Validate environment configuration schemas and required bindings at startup with actionable failure diagnostics. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.04`** | Preview vs Production binding isolation | `P0` | `contract` | `required-ci` | `verified` | Verify test and preview deployments bind only to isolated D1, R2, KV, DO, Queue, and Workflow resources. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.05`** | Missing & rotated secret safe failure | `P0` | `contract` | `required-ci` | `verified` | Test missing and rotated secrets through bindings, verifying clear errors without leaking credentials in logs. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.06`** | Immutable artifact-to-commit provenance | `P0` | `contract` | `required-ci` | `verified` | Associate the deployed artifact with the tested commit, lockfile, config, and build identity. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.07`** | Preview write vs Production read-only policy | `P0` | `contract` | `required-ci` | `verified` | Exercise explicit environment policies such as Preview editing and Production read-only enforcement. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.08`** | Direct API Production write-block probes | `P0` | `contract` | `required-ci` | `verified` | Attempt prohibited writes against isolated Production-mode resources through direct APIs, jobs, and alternate entrypoints. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.09`** | Release-candidate bounded smoke journey | `P0` | `contract` | `required-ci` | `verified` | Run a bounded smoke journey against the exact release candidate revision verifying routing, auth, and bindings. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.10`** | Coexisting rollout schema compatibility | `P0` | `contract` | `required-ci` | `verified` | Test migration compatibility across coexisting rollout versions (old code + new schema and new code + old schema). *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.11`** | Rollback eligibility verification | `P1` | `contract` | `required-ci` | `verified` | Validate rollback eligibility against current schema, stored data, and service contracts before approving rollback. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.12`** | Feature flag transition hygiene | `P1` | `contract` | `required-ci` | `verified` | Test supported feature flag combinations and transitions so disabled features never leave broken state. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.13`** | Deployed routing, redirects & 404s | `P1` | `contract` | `required-ci` | `verified` | Check routing precedence, redirects, trailing slashes, unknown routes, error pages, and query parameter preservation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.14`** | SSR & client hydration parity | `P1` | `contract` | `required-ci` | `verified` | Test server-rendered content and client hydration together to catch state mismatches and browser console errors. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.15`** | Deployed proxy streaming & disconnect | `P1` | `contract` | `required-ci` | `verified` | Exercise deployed streaming responses, disconnects, and cancellation through the actual CDN/proxy path. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.16`** | Scheduled cron handler idempotency | `P1` | `contract` | `required-ci` | `verified` | Test scheduled handlers through controlled invocation and fake time across duplicate and delayed triggers. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.17`** | Built package tarball consumer smoke | `P1` | `contract` | `required-ci` | `verified` | Verify published package exports, `.d.ts` declarations, and module formats by installing into a consumer fixture. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.18`** | Hostile CLI path & quoting safety | `P1` | `contract` | `required-ci` | `verified` | Test Bash and CLI paths containing spaces, Unicode, leading dashes, and metacharacters against command injection. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.19`** | CLI exit code, stdio & signal contract | `P1` | `contract` | `required-ci` | `verified` | Check CLI exit codes, stdout/stderr separation, and SIGINT/SIGTERM handling for automation reliability. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.20`** | Lifecycle install, upgrade & uninstall | `P1` | `contract` | `required-ci` | `verified` | Exercise installation, upgrade, and removal procedures in disposable environments for data preservation and cleanup. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.21`** | Cross-OS packaging matrix | `P1` | `contract` | `required-ci` | `verified` | Run CLI and packaging checks on explicitly supported operating systems when platform-sensitive code changes. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.22`** | Least-privilege process & filesystem perms | `P1` | `contract` | `required-ci` | `verified` | Verify container or deployment process permissions, working directories, writable paths, and restricted identities. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.23`** | Clean-cache CI script independence | `P2` | `contract` | `required-ci` | `verified` | Test CI scripts with clean caches and declared dependencies so jobs never pass due to leftover artifacts. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.24`** | Local emulator vs Cloudflare edge delta log | `P2` | `contract` | `required-ci` | `verified` | Compare local and deployed behavior for platform-sensitive features and document known runtime deltas. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.25`** | Tenant-partitioned HTTP caching headers | `P2` | `contract` | `required-ci` | `verified` | Validate HTTP caching, Vary headers, content encoding, and conditional responses so tenant data never cross-caches. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.26`** | Service binding caller authorization | `P2` | `contract` | `required-ci` | `verified` | Test service binding and infrastructure permissions against unauthorized callers and verify identity propagation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.27`** | Live domain, TLS & redirect verification | `P2` | `contract` | `required-ci` | `verified` | Check configured domains, TLS certificates, and redirect destinations on release-critical endpoints. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.28`** | Infrastructure-as-code drift detection | `P2` | `contract` | `required-ci` | `verified` | Compare declared wrangler/infra config with actual test deployment resources to catch permission or binding drift. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.29`** | Worker CPU, memory & payload boundary probes | `P2` | `contract` | `required-ci` | `verified` | Exercise supported runtime size, duration, and memory boundaries with bounded fixtures for predictable errors. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
| **`F12.30`** | Source map & release label resolution | `P2` | `contract` | `required-ci` | `verified` | Verify source maps, release labels, and diagnostic artifacts match the deployed revision for stacktrace resolution. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F12`)* |
