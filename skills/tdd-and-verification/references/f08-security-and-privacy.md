---
name: "F08 — Security and privacy"
familyId: "F08"
defaultLayer: "security"
defaultTier: "required_ci"
itemCount: 30
---

# F08: Security and privacy (F08.01–F08.30)

- **Default Verification Layer**: `security`
- **Default Execution Tier**: `required_ci`
- **Authorized Pilot Implementation**: `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F08.01` | **Role, operation, and tenant matrix** | Test all 6 roles (owner, publisher, editor, author, reviewer, viewer) and cross-tenant isolation. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.02` | **Direct server endpoint authorization** | Prove server permission checks reject unauthorized writes even if UI buttons are bypassed. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.03` | **Object identifier ownership** | Verify article, revision, and draft IDs enforce tenantId and siteId ownership. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.04` | **Cross-tenant cache and storage isolation** | Namespace offline drafts and cache keys by tenantId, siteId, userId, and articleId. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.05` | **In-flight session expiry and revocation** | Reject mutations immediately when sessions expire or memberships are revoked. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.06` | **Credential and token validation** | Reject expired, malformed, or wrong-site tokens without permissive fallbacks. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.07` | **OAuth state and PKCE verification** | Enforce S256 PKCE codeVerifier, single-use state, and strict redirectUri allowlists. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.08` | **CSRF and Origin protection** | Enforce Origin allowlist and constant-time double-submit CSRF token verification on state changes. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.09` | **Credentialed CORS policy** | Restrict cross-origin reads and mutations to explicitly allowed origins. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.10` | **Injection boundary protection** | Strip prompt-injection instructions and sanitize imported HTML/MDX at ingestion boundaries. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.11` | **SSRF outbound URL validation** | Block loopback, RFC1918 private IPs, link-local 169.254.169.254, and unsafe redirect hops. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.12` | **Upload magic-byte and SVG sanitization** | Verify PNG/JPEG/WebP/AVIF magic bytes and reject SVGs with <script>, foreignObject, or on* handlers. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.13` | **Security headers and CSP enforcement** | Stamp HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, and strict CSP. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.14` | **XSS sanitization on rich text** | Render only schema-validated Plate nodes and strip <script>, iframe, object, and javascript: URLs. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.15` | **Secret canary redaction** | Redact DataForSEO Basic Auth, magic-link tokens, and Browser Run tokens from all logs and artifacts. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.16` | **Dependency vulnerability and lockfile gate** | Verify lockfile supply-chain policies on install and build. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.17` | **Build provenance and script isolation** | Build deterministically from declared workspace packages and lockfiles. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.18` | **Service identity scope restrictions** | Scope publishing worker and provider adapters to least-privilege site operations. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.19` | **Rate limiting across clients** | Enforce per-email magic-link issuance rate limits and Browser Run launch rate limits. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.20` | **Forwarded header trust boundaries** | Derive canonical URLs from configured site origin rather than untrusted Host headers. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.21` | **Webhook signature and replay protection** | Verify exact payload digests, timestamps, and idempotency keys on callbacks. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.22` | **Transport security enforcement** | Enforce HTTPS-only canonical URLs, external fetches, and HSTS preload headers. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.23` | **Account enumeration prevention** | Return uniform non-enumerating responses on authentication and magic-link errors. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.24` | **Consent and tracking controls** | Respect consent state in analytics event collection before emitting behavioral telemetry. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.25` | **Privacy deletion and logout cleanup** | Wipe user-scoped localStorage offline drafts immediately on logout. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.26` | **Personal data export and redaction** | Exclude raw credentials and private user tokens from exported audit logs and snapshots. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.27` | **Code execution boundary isolation** | Use Zod v4 jitless mode (no eval/new Function) and quarantine unknown MDX components. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.28` | **Audit evidence for denied operations** | Record denied authorization attempts and rollbacks in the append-only hash-chained audit log. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.29` | **Data minimization and retention** | Store only permitted evidence excerpts and bounded diagnostic artifacts. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
| `F08.30` | **OWASP ASVS traceability** | Map auth, session, SSRF, upload, and CSP checks to OWASP ASVS controls. | `security` | `required_ci` | `verified` | `packages/blog/src/auth.ts, packages/blog/src/evidence.ts & apps/web/e2e/security-headers.spec.ts` |
