---
last_reviewed: 2026-06-29
superseded_by: null
name: "uuid-version-discipline"
priority: 2
pack: "core"
triggers:
  - "uuid"
  - "ulid"
  - "id generation"
  - "record id"
  - "primary key"
  - "idempotency key"
paths:
  - "src/**"
  - "worker/**"
  - "template/utils/**"
---

# UUID Version Discipline

Pick the right ID format at schema design time — migrations are painful.

## Decision table

| Use case                            | Format    | Reason                                              |
|-------------------------------------|-----------|-----------------------------------------------------|
| D1 record primary key               | **UUIDv7** | Timestamp-ordered; hot-page inserts; sort = created |
| Analytics events table              | **UUIDv7** | Time-series; prefix correlation                     |
| Webhook event ID                    | **UUIDv7** | Idempotency dedupe is time-windowed                 |
| Session token                       | **UUIDv4** | Max entropy; no timing leak                         |
| Idempotency key (Stripe, SES)       | **UUIDv4** | Provider-agnostic; no info in value                 |
| File upload name in R2              | **UUIDv4** | Unpredictable; cache-busting                        |
| Feature flag override ID            | **UUIDv7** | Admin audit log is time-ordered                     |
| ULID                                | **Skip**   | 26-char base32 doesn't fit any gap in this stack    |

## UUIDv7 — default for D1 record IDs

- Format: `xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx` — first 48 bits Unix-ms timestamp (big-endian), rest random; monotonic within one ms via 12-bit counter
- SQLite/D1 stores as `TEXT(36)` — lexicographic sort = chronological sort
- Inserts cluster on the hot B-tree page: 10–30% fewer page splits vs. random UUIDv4

```ts
// template/utils/idempotency.ts — canonical impl, reference this, don't duplicate
import { uuidv7, uuidv4 } from "template/utils/idempotency";

const recordId  = uuidv7();   // D1 primary key
const sessionId = uuidv4();   // session token
```

## UUIDv4 — default for tokens and keys

- 122 bits of cryptographic randomness; no embedded timestamp — creation time cannot be inferred
- Use `crypto.randomUUID()` in Workers (native, no import)

```ts
const sessionToken     = crypto.randomUUID(); // Workers native
const idempotencyKey   = crypto.randomUUID();
const r2FileName       = `uploads/${crypto.randomUUID()}.jpg`;
```

## ULID — skip

- Timestamp-ordered like UUIDv7 but 26-char Crockford base32; zero stack libraries emit it and UUIDv7 closes the same gap natively. Evaluated and skipped — not a planned adoption.

## Code reference

`template/utils/idempotency.ts` contains:

- `uuidv7()` — native UUIDv7 via `crypto.getRandomValues` with ms timestamp prefix
- `uuidv4()` — thin wrapper around `crypto.randomUUID()` for explicit intent signaling
- `isUUIDv7(s)` — validation helper (checks version nibble = `7`)
- `isUUIDv4(s)` — validation helper (checks version nibble = `4`)

Never duplicate these implementations. Import from this canonical path.

## D1 schema convention

```sql
-- New tables: UUIDv7 primary keys
CREATE TABLE payments (
  id     TEXT PRIMARY KEY NOT NULL,  -- UUIDv7 inserted by Worker
  ...
  created_at INTEGER NOT NULL DEFAULT (unixepoch('now', 'subsec') * 1000)
);
-- id already encodes creation time — created_at is for human readability only
```

## Migration policy

- Existing UUIDv4 columns in D1: **do not rewrite** — migration cost > benefit; leave as-is
- New tables added after this rule (2026-06-18): UUIDv7 primary keys
- Mixed-version tables are acceptable during transition; document in schema comments

## Anti-patterns

- `Math.random().toString(36)` — not UUID, not collision-safe, not sortable
- `nanoid()` — fine for URL slugs but not for FK relationships (no version semantics)
- Using UUIDv4 for a time-series analytics table — random inserts scatter across B-tree pages
- Using UUIDv7 for a session token — timestamp in the token leaks creation time to clients

## See also

- `zod-everywhere` — validate UUIDs at API boundaries with `z.uuid()` (Zod 4: strict RFC-9562; `z.guid()` = permissive)
- `data-residency-by-default` — ID format must not encode user region/shard info
- `drift-detection` — mixed ID schemes in a single table = drift, fix in-turn
