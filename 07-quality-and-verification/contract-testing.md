---
name: "Contract Testing"
version: "2.0.0"
updated: "2026-04-23"
description: "Zod schema validation against live Hono API endpoints. Runtime type checking for API responses. No mocks — hit real API, validate real response. Drizzle v1 schema-to-Zod pattern. Vitest integration."
---

# Contract Testing

## Core Pattern

- Zod = source of truth (see 05/api-design)
- Contract tests verify live endpoints conform at runtime
- No mocks — hit the real API, validate the real response

```
Define Zod schema → fetch live endpoint → z.parse(response) → fail on mismatch
```

## TypeScript Contract Changes

1. Record the project root, effective tsconfig, compiler version and semantic backend. Confirm the backend includes the changed files and the current revision. Refresh stale indexes before relying on references.
2. Resolve the declaration, signature, references and rename locations with the TypeScript language service, a compatible Serena backend, or a TypeScript-aware migration. Use ripgrep for text and ast-grep for syntax. Check package exports, conditional entry points, tests and consumers independently. An unsupported reference query provides no absence evidence.
3. Decide which public exports, object keys, serialized fields, persisted data and string references must keep their names. Use compiler-assisted renames for symbols and explicit migrations for wire or storage changes.
4. Add compile-only assertions to the actual typecheck input. For Hono RPC, infer the client from the constructed app and check required request fields and status-specific responses. Prove the assertion reacts to drift with a failing fixture, then verify the restored candidate.
5. Pair compile checks with relevant runtime validation. Test malformed external inputs and preserved authorization behavior. Include clean packed-consumer checks when changing published exports or declarations.

When the installed shared testing package exposes `theme-ts-references`, run
`pnpm exec theme-ts-references <tsconfig> <file> <line> <column>` for references.
Recent qualified builds include the SHA-256 of the compiler-decoded UTF-8
text for each file in the report. Compare those digests before reusing a
saved report and rerun the query when a fingerprint is absent or changed.

Add `--rename-locations` to preview a rename. Match the preview's source
digests before applying edits and keep the compiler's prefix and suffix text
so shorthand properties and aliases retain their intended names. Typecheck
the edited projects and verify affected package exports.

[TypeScript language service](https://github.com/microsoft/TypeScript/wiki/Using-the-Language-Service-API) · [Hono RPC](https://hono.dev/docs/guides/rpc)

## Drizzle v1 Schema-to-Zod (Auto-Derive Contracts)

Drizzle v1 (`drizzle-zod`) generates Zod schemas directly from table definitions — contracts stay in sync with DB schema automatically:

```typescript
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  role: text('role', { enum: ['user', 'admin'] }).notNull().default('user'),
});

// Auto-derived from table — updates when schema changes
export const UserSelectSchema = createSelectSchema(users);
export const UserInsertSchema = createInsertSchema(users);
export type User = typeof UserSelectSchema._type;

// API response wraps table row — extend rather than duplicate
export const UserResponseSchema = UserSelectSchema.omit({ createdAt: true }).extend({
  createdAt: z.string().datetime(), // JSON serialized timestamp
});
export const UserListSchema = paginatedContract(UserResponseSchema);
```

## Shared Schema Pattern

```
src/shared/schemas.ts     ← Drizzle tables + drizzle-zod derived schemas
  ├── used by Hono route  ← @hono/zod-validator (insert schema)
  ├── used by Angular     ← z.infer<typeof Schema> for types
  └── used by contracts   ← select schema for runtime validation
```

## Contract Runner

```typescript
// tests/contracts/contract-runner.ts
const BASE_URL = process.env.PROD_URL ?? 'http://localhost:8787';

export async function runContractTest(tc: {
  name: string; method: 'GET'|'POST'|'PUT'|'DELETE'|'PATCH';
  path: string; body?: unknown; headers?: Record<string, string>;
  expectedStatus: number; schema: z.ZodType;
}): Promise<{ passed: boolean; errors?: z.ZodError }> {
  const res = await fetch(`${BASE_URL}${tc.path}`, {
    method: tc.method,
    headers: { 'Content-Type': 'application/json', ...tc.headers },
    body: tc.body ? JSON.stringify(tc.body) : undefined,
  });
  if (res.status !== tc.expectedStatus) return { passed: false };
  const result = tc.schema.safeParse(await res.json());
  return result.success ? { passed: true } : { passed: false, errors: result.error };
}
```

## Standard Contracts (every project)

```typescript
export const HealthContract = z.object({ status: z.enum(['ok','degraded','down']), version: z.string(), timestamp: z.string().datetime() });
export const ErrorContract = z.object({ error: z.string(), code: z.string().optional(), details: z.unknown().optional() });
export function paginatedContract<T extends z.ZodType>(item: T) {
  return z.object({ data: z.array(item), total: z.number().int().nonneg(), page: z.number().int().positive(), pageSize: z.number().int().positive(), hasMore: z.boolean() });
}
```

## Vitest Suite

```typescript
describe('API Contracts', () => {
  it('GET /health', async () => expect((await runContractTest({ name:'health', method:'GET', path:'/health', expectedStatus:200, schema:HealthContract })).passed).toBe(true));
  it('GET /api/nonexistent returns 404 envelope', async () => expect((await runContractTest({ name:'404', method:'GET', path:'/api/nonexistent-xyz', expectedStatus:404, schema:ErrorContract })).passed).toBe(true));
});
```

## When to Run

- **Post-deploy** — always (verify live API)
- **PR checks** — against staging URL
- **Nightly** — production
- **Never pre-deploy** (schemas may not match yet)
- **Never mock API responses** (defeats the purpose)

## Anti-Patterns

### Never

- Mock responses
- Skip error envelope validation
- Test against localhost in CI
- Hardcode test data that changes

### Always

- Test success + error paths
- Validate pagination contracts
- Run against real deployed URL
- Derive Drizzle contracts from table schemas
