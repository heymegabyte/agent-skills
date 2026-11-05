---
name: "Auth and Session Management"
description: "Better Auth Core 3 as the auth layer for all SaaS projects. Middleware patterns for Hono on CF Workers, webhook sync to D1, RBAC with org-scoped roles, protected route patterns, session token handling. Better Auth CLI (init/config/api), API Keys GA (machine auth), SCIM/Directory Sync (roadmap, not GA). Covers signup/login flows, user metadata sync, impersonation, and MFA enforcement."
updated: "2026-04-24"
---

# Auth and Session Management (Better Auth)

## Middleware Pattern (Hono + CF Workers)

```typescript
// src/middleware/auth.ts
import { betterAuthMiddleware, getAuth } from 'better-auth';

export const authMiddleware = () => {
  return async (c, next) => {
    const auth = getAuth(c.req.raw, { secretKey: c.env.BETTER_AUTH_SECRET });
    const { userId, orgId, orgRole, sessionClaims } = await auth;
    c.set('auth', { userId, orgId, orgRole, sessionClaims });
    await next();
  };
};

// Protected route helper
export const requireAuth = () => async (c, next) => {
  const { userId } = c.get('auth');
  if (!userId) return c.json({ error: 'Unauthorized' }, 401);
  await next();
};

export const requireRole = (role: string) => async (c, next) => {
  const { orgRole } = c.get('auth');
  if (orgRole !== role) return c.json({ error: 'Forbidden' }, 403);
  await next();
};
```

## Route Protection Layers

- **Public** — `/health`, `/api/webhooks/*`, marketing pages
- **Auth-only** — `/api/user/*`, `/api/projects/*` (any logged-in user)
- **Role-gated** — `/api/admin/*` (`org:admin`), `/api/billing/*` (`org:admin|org:billing`)
- **Owner-only** — `/api/projects/:id/*` (`resource.userId === auth.userId`)

## Webhook Sync (Better Auth → D1)

```typescript
// src/routes/webhooks/better-auth.ts — handles user.created, user.updated, user.deleted, org.*
webhooks.post('/better-auth', async (c) => {
  const payload = await c.req.json();
  const svix = new Webhook(c.env.BETTER_AUTH_SECRET);
  const evt = svix.verify(await c.req.text(), {
    'svix-id': c.req.header('svix-id')!,
    'svix-timestamp': c.req.header('svix-timestamp')!,
    'svix-signature': c.req.header('svix-signature')!,
  });

  switch (evt.type) {
    case 'user.created':
    case 'user.updated':
      await c.env.DB.prepare(
        `INSERT INTO users (id, email, name, avatar_url, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT (id) DO UPDATE SET email=?2, name=?3, avatar_url=?4, updated_at=?5`
      ).bind(evt.data.id, evt.data.email_addresses[0]?.email_address,
        `${evt.data.first_name} ${evt.data.last_name}`.trim(),
        evt.data.image_url, new Date().toISOString()).run();
      break;
    case 'user.deleted':
      await c.env.DB.prepare('UPDATE users SET deleted_at = ? WHERE id = ?')
        .bind(new Date().toISOString(), evt.data.id).run();
      break;
  }
  return c.json({ received: true });
});
```

## D1 Users Table (Drizzle)

```typescript
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),              // Better Auth user ID (user_xxx)
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  role: text('role').default('member'),     // App-level roles in D1, NOT Better Auth metadata
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
  deletedAt: text('deleted_at'),
});
```

## RBAC Pattern

- Roles stored in D1 (not Better Auth metadata) for query flexibility
- Better Auth org roles for org-scoped access
- Pattern — Better Auth JWT → extract userId → D1 lookup for app role → authorize

### Hierarchy

- **Org** — `org:admin` > `org:member` > `org:viewer`
- **App** — `superadmin` (Brian only) > `admin` > `member` > `viewer`

## Session Tokens on CF Workers

- Better Auth JWT verified per-request (no session store needed)
- Short-lived tokens (60s) auto-refresh
- For WebSocket/DO — verify JWT on connect, cache userId in DO state, re-verify on reconnect

## Frontend (Angular)

```typescript
// Better Auth Angular SDK: better-auth (or better-auth for headless)
// Route guard: inject BetterAuthService → check isSignedIn$ observable
// Protect routes: canActivate: [BetterAuthGuard]
// Get user: inject BetterAuthService → user$ observable
```

## Better Auth CLI (Apr 22, 2026)

- `better-auth init` — framework detect + scaffold (Angular/React/Next/Remix)
- `better-auth config` — auth settings from terminal
- `better-auth api` — direct BAPI access for scripting
- `better-auth deploy` — coming
- Install — `npm i -g better-auth` or `npx better-auth init`

## API Keys GA (Apr 17, 2026)

- Machine auth — users create delegated API keys for programmatic access
- Use for — CI/CD integration, external service auth, customer API access
- Verify — `better-auth.apiKeys.verify(apiKey)`
- Billing active — counts toward MAU

## SCIM / Directory Sync (Roadmap — NOT GA)

- On Better Auth's roadmap for enterprise orgs — auto user create/update/deactivate from IdP (Okta, Azure AD, OneLogin, Google Workspace)
- NOT yet generally available as of April 2026
- When GA — custom attribute mapping into `publicMetadata`, role assignment from IdP groups, no extra charge with enterprise connection
- For now — use Better Auth webhooks (`organizationMembership.created`/`deleted`) for JIT provisioning from IdP

## Better Auth Core 3 (Mar 3, 2026)

- Theme editor for custom auth UI
- Keyless mode (no `BETTER_AUTH_URL` needed in dev)
- Modern React compat improvements
- Upgrade path — `npx better-auth` runs codemods automatically

## Checklist

- [ ] `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL` in `wrangler.toml [vars]`
- [ ] `BETTER_AUTH_SECRET` for svix verification
- [ ] Webhook endpoint registered in Better Auth dashboard (`user.*`, `org.*`, `session.*`, `organizationMembership.*`)
- [ ] D1 users table with Better Auth ID as PK
- [ ] Middleware applied to all `/api/*` except `/api/webhooks/*` and `/health`
- [ ] Frontend route guards on protected pages
- [ ] MFA enforced for admin roles (Better Auth dashboard setting)
- [ ] SCIM directory connection configured for enterprise customers (when GA — currently roadmap)
- [ ] API Keys enabled for programmatic access use cases
- [ ] Test — expired JWT returns 401, wrong org returns 403, deleted user returns 401
