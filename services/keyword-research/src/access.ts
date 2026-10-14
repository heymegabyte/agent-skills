/**
 * Authentication middleware for the control plane.
 *
 * A protected route is reachable by EITHER of two identities:
 *
 *  1. A Cloudflare Access JWT in the `Cf-Access-Jwt-Assertion` header. The JWT
 *     is verified against the team's public keys and its `aud`/`iss` are checked
 *     against the configured `ACCESS_AUD` / team. Verification is INJECTED
 *     (`AccessJwtVerifier`) so local tests pass a fake verifier and never touch
 *     the network or real crypto; production wires the real JWKS verifier.
 *
 *  2. A service token — either the Access service-token header pair
 *     (`CF-Access-Client-Id` / `CF-Access-Client-Secret`) or a bearer token in
 *     `Authorization: Bearer <SERVICE_TOKEN>`. The bearer value is compared
 *     against the `SERVICE_TOKEN` var with a constant-time check.
 *
 * On success the middleware stashes a {@link TenantContext} on `c.var.tenant`;
 * every downstream handler scopes its D1 reads by that tenant id, so tenant
 * isolation is enforced from the very first line of request handling. An
 * unauthenticated protected route returns 401 (never 403 — we do not disclose
 * resource existence to an unauthenticated caller).
 */
import type { MiddlewareHandler } from 'hono';
import type { AppVariables, Env, TenantContext } from './env';

/** The claims we care about from a verified Access JWT. */
export interface AccessJwtClaims {
  /** The identity (email) the token was minted for. */
  email?: string;
  /** Subject — Access user id. */
  sub?: string;
  /** Audience tag(s) — must include the configured ACCESS_AUD. */
  aud?: string | string[];
  /** A custom claim we map to a tenant, when present. */
  tenant_id?: string;
}

/**
 * Verifies a raw Access JWT and returns its claims, or `null` if invalid. The
 * `expected` bundle lets the verifier enforce aud/team without the middleware
 * re-implementing the checks. Injected for tests.
 */
export type AccessJwtVerifier = (
  token: string,
  expected: { aud?: string; team?: string },
) => Promise<AccessJwtClaims | null>;

/** Options for {@link accessMiddleware}. */
export interface AccessOptions {
  /** The JWT verifier. REQUIRED — there is no insecure default. */
  verifyJwt: AccessJwtVerifier;
  /**
   * Resolve a tenant id from an authenticated principal. Defaults to the
   * token's `tenant_id` claim, else a deterministic id derived from the email
   * (so a team without custom claims still gets stable per-user isolation).
   */
  resolveTenantId?: (principal: ResolvedPrincipal) => string;
}

/** What the middleware learned about the caller before mapping to a tenant. */
export interface ResolvedPrincipal {
  via: TenantContext['via'];
  subject: string;
  claims?: AccessJwtClaims;
  /** The service-token client id, when authenticated by a token. */
  clientId?: string;
}

/** Constant-time string compare (avoids leaking length-prefix via early exit). */
export function timingSafeEqual(a: string, b: string): boolean {
  // Compare over the max length so the loop count never depends on where the
  // first mismatch is. A length difference still yields a mismatch byte.
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** Default tenant resolver: explicit claim → email → client id. */
function defaultResolveTenantId(p: ResolvedPrincipal): string {
  const claimTenant = p.claims?.tenant_id;
  if (claimTenant && claimTenant.trim() !== '') return claimTenant;
  if (p.subject && p.subject.trim() !== '') return `tenant:${p.subject}`;
  if (p.clientId) return `tenant:${p.clientId}`;
  return 'tenant:anonymous';
}

/**
 * Build the Access middleware. Unauthenticated → 401. Authenticated → sets
 * `c.var.tenant` and calls `next()`.
 */
export function accessMiddleware(
  opts: AccessOptions,
): MiddlewareHandler<{ Bindings: Env; Variables: AppVariables }> {
  const resolveTenantId = opts.resolveTenantId ?? defaultResolveTenantId;

  return async (c, next) => {
    const env = c.env;

    // --- 1. Service token: bearer against SERVICE_TOKEN var. ---
    const auth = c.req.header('Authorization');
    if (auth && auth.startsWith('Bearer ')) {
      const presented = auth.slice('Bearer '.length).trim();
      if (env.SERVICE_TOKEN && presented !== '' && timingSafeEqual(presented, env.SERVICE_TOKEN)) {
        const principal: ResolvedPrincipal = { via: 'service-token', subject: 'service-token', clientId: 'bearer' };
        c.set('tenant', { tenantId: resolveTenantId(principal), via: 'service-token', subject: 'service-token' });
        await next();
        return;
      }
      // A presented-but-wrong bearer is a hard 401 (don't fall through to JWT).
      return c.json({ error: 'unauthorized' }, 401);
    }

    // --- 2. Access service-token header pair. ---
    const clientId = c.req.header('CF-Access-Client-Id');
    const clientSecret = c.req.header('CF-Access-Client-Secret');
    if (clientId && clientSecret) {
      // In production these are verified by Access at the edge before the
      // request reaches the Worker; their presence (plus the Access JWT Access
      // injects alongside them) is the signal. We additionally accept the
      // configured SERVICE_TOKEN as the secret for a direct Worker-to-Worker
      // call that bypasses the Access edge.
      if (env.SERVICE_TOKEN && timingSafeEqual(clientSecret, env.SERVICE_TOKEN)) {
        const principal: ResolvedPrincipal = { via: 'service-token', subject: clientId, clientId };
        c.set('tenant', { tenantId: resolveTenantId(principal), via: 'service-token', subject: clientId });
        await next();
        return;
      }
      return c.json({ error: 'unauthorized' }, 401);
    }

    // --- 3. Cloudflare Access JWT. ---
    const assertion = c.req.header('Cf-Access-Jwt-Assertion');
    if (assertion) {
      const claims = await opts.verifyJwt(assertion, {
        ...(env.ACCESS_AUD ? { aud: env.ACCESS_AUD } : {}),
        ...(env.ACCESS_TEAM ? { team: env.ACCESS_TEAM } : {}),
      });
      if (claims) {
        const subject = claims.email ?? claims.sub ?? 'access-user';
        const principal: ResolvedPrincipal = { via: 'access-jwt', subject, claims };
        c.set('tenant', { tenantId: resolveTenantId(principal), via: 'access-jwt', subject });
        await next();
        return;
      }
      return c.json({ error: 'unauthorized' }, 401);
    }

    // --- No credentials at all. ---
    return c.json({ error: 'unauthorized' }, 401);
  };
}

/**
 * A real JWKS-backed Access verifier factory (production). Fetches the team's
 * public certs and verifies the RS256 signature + aud. Kept as a factory so the
 * Worker wires it, while tests inject a fake and this code path is never hit
 * offline. Implementation deferred to P7b alongside the live JWKS URL; the
 * signature is fixed here so the wiring is stable.
 */
export function createCloudflareAccessVerifier(_team: string): AccessJwtVerifier {
  return async (_token, _expected) => {
    // P7b: fetch https://<team>.cloudflareaccess.com/cdn-cgi/access/certs,
    // verify RS256 against the JWKS, check aud === expected.aud + exp/iat.
    // Never used in local tests (a fake verifier is injected instead).
    throw new Error('createCloudflareAccessVerifier: live JWKS verification wired at P7b');
  };
}
