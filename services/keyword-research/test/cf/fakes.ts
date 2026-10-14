/**
 * Local Cloudflare-binding fakes for the control-plane tests.
 *
 * TEST APPROACH (documented per the P7a brief): the brief's first choice was
 * `@cloudflare/vitest-pool-workers` (miniflare). It is NOT used here because the
 * existing 194 tests are deeply Node-coupled (`node:fs`, `node:os`, `spawnSync`,
 * `mkdtemp`) and pool-workers runs specs inside `workerd`, where those APIs are
 * unavailable and `better-sqlite3` (a native addon) cannot load. Standing up a
 * second vitest project in `workerd` alongside the Node project risked the clean
 * 194 and pins a specific vitest version. So we take the brief's SANCTIONED
 * FALLBACK: plain Node vitest with a `better-sqlite3`-backed D1 shim plus
 * in-memory Queue/R2 fakes. A single `npx vitest run` discovers every `test/**`
 * spec (old + new) with zero config changes.
 *
 * The shim implements exactly the slice of the D1/R2/Queue surface the control
 * plane uses — `prepare/bind/run/first/all/batch`, `R2.put/get`, `Queue.send`,
 * and a `MessageBatch` with `ack()/retry()`. SQLite's numbered `?1,?2` params
 * match D1's binding style 1:1, so the production SQL runs unmodified.
 */
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type {
  D1Database,
  D1Result,
  R2Bucket,
  R2Object,
  R2ObjectBody,
  Queue,
  MessageBatch,
  Message,
} from '@cloudflare/workers-types';

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ------------------------------------------------------------------ */
/* D1 shim (better-sqlite3).                                           */
/* ------------------------------------------------------------------ */

type SqliteDb = InstanceType<typeof Database>;

/**
 * A prepared statement that mirrors the slice of D1PreparedStatement the
 * control plane uses (bind/first/run/all). Deliberately NOT `implements
 * D1PreparedStatement` — the real interface has overload-heavy `raw(...)` /
 * `put(...)` signatures that a shim can't satisfy without noise; the whole fake
 * is handed to handlers via a single `as unknown as D1Database` cast, which is
 * the sanctioned seam for a test double.
 */
class FakeD1PreparedStatement {
  constructor(
    private readonly db: SqliteDb,
    private readonly sql: string,
    private readonly params: unknown[] = [],
  ) {}

  bind(...values: unknown[]): FakeD1PreparedStatement {
    return new FakeD1PreparedStatement(this.db, this.sql, values);
  }

  async first<T = Record<string, unknown>>(colName?: string): Promise<T | null> {
    const stmt = this.db.prepare(this.sql);
    const row = stmt.get(this.normalizeParams()) as Record<string, unknown> | undefined;
    if (row === undefined) return null;
    if (colName) return (row[colName] ?? null) as T;
    return row as T;
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const stmt = this.db.prepare(this.sql);
    const info = stmt.run(this.normalizeParams());
    return {
      success: true,
      results: [] as T[],
      meta: {
        changes: info.changes,
        last_row_id: Number(info.lastInsertRowid),
        duration: 0,
        size_after: 0,
        rows_read: 0,
        rows_written: info.changes,
      },
    } as unknown as D1Result<T>;
  }

  async all<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    const stmt = this.db.prepare(this.sql);
    const rows = stmt.all(this.normalizeParams()) as T[];
    return {
      success: true,
      results: rows,
      meta: {
        changes: 0,
        last_row_id: 0,
        duration: 0,
        size_after: 0,
        rows_read: rows.length,
        rows_written: 0,
      },
    } as unknown as D1Result<T>;
  }

  /**
   * Our production SQL uses D1's numbered placeholders `?1, ?2, …`. better-
   * sqlite3 treats `?N` as NAMED parameters, which must be bound by an OBJECT
   * keyed by the number (NOT a positional array — an array spread raises "Too
   * many parameter values"). So we build `{ '1': v1, '2': v2, … }`. Values are
   * coerced for SQLite: `undefined`→`null`, booleans→0/1 (no bool type);
   * everything else (including a real numeric 0) passes through unchanged so the
   * null-vs-zero doctrine is preserved end-to-end.
   */
  private normalizeParams(): Record<string, unknown> {
    const bound: Record<string, unknown> = {};
    this.params.forEach((v, i) => {
      bound[String(i + 1)] = v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v;
    });
    return bound;
  }
}

/**
 * A better-sqlite3-backed D1Database double. Handed to handlers via `asD1()`
 * (an `as unknown as D1Database` cast) so the production code sees the real
 * type; the methods below cover exactly what the control plane calls.
 */
export class FakeD1Database {
  readonly sqlite: SqliteDb;

  constructor() {
    this.sqlite = new Database(':memory:');
    this.sqlite.pragma('journal_mode = WAL');
    this.sqlite.pragma('foreign_keys = ON');
  }

  prepare(query: string): FakeD1PreparedStatement {
    return new FakeD1PreparedStatement(this.sqlite, query);
  }

  async batch<T = unknown>(statements: FakeD1PreparedStatement[]): Promise<D1Result<T>[]> {
    // D1 batches run as an atomic transaction. better-sqlite3's transaction()
    // wraps synchronous work; our statements are async wrappers over sync calls,
    // so we execute them inside a manual BEGIN/COMMIT for atomicity.
    this.sqlite.exec('BEGIN');
    try {
      const out: D1Result<T>[] = [];
      for (const s of statements) {
        out.push((await s.run()) as D1Result<T>);
      }
      this.sqlite.exec('COMMIT');
      return out;
    } catch (e) {
      this.sqlite.exec('ROLLBACK');
      throw e;
    }
  }

  async exec(query: string): Promise<D1ExecResult> {
    this.sqlite.exec(query);
    return { count: 0, duration: 0 };
  }

  /** Apply the migration SQL from migrations/0001_init.sql. */
  applyMigrations(): void {
    const sql = readFileSync(join(__dirname, '..', '..', 'migrations', '0001_init.sql'), 'utf8');
    this.sqlite.exec(sql);
  }

  /** Cast helper so handlers can take the real D1Database type. */
  asD1(): D1Database {
    return this as unknown as D1Database;
  }
}

interface D1ExecResult {
  count: number;
  duration: number;
}

/* ------------------------------------------------------------------ */
/* R2 shim (in-memory).                                                */
/* ------------------------------------------------------------------ */

interface StoredObject {
  key: string;
  body: Uint8Array;
  contentType?: string;
}

/**
 * An in-memory R2Bucket double (put/get/head/delete subset). Handed to handlers
 * via `asR2()`; not `implements R2Bucket` because the real surface is far wider
 * than the control plane touches.
 */
export class FakeR2Bucket {
  readonly store = new Map<string, StoredObject>();

  async put(
    key: string,
    value: string | ArrayBuffer | ArrayBufferView | ReadableStream | null,
    options?: { httpMetadata?: { contentType?: string } | Headers },
  ): Promise<R2Object> {
    const body =
      typeof value === 'string'
        ? new TextEncoder().encode(value)
        : value instanceof ArrayBuffer
          ? new Uint8Array(value)
          : ArrayBuffer.isView(value)
            ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
            : new Uint8Array();
    const meta = options?.httpMetadata;
    const contentType =
      meta && !(meta instanceof Headers) ? meta.contentType : meta?.get('content-type') ?? undefined;
    const obj: StoredObject = {
      key,
      body,
      ...(contentType ? { contentType } : {}),
    };
    this.store.set(key, obj);
    return this.toR2Object(obj);
  }

  async get(key: string): Promise<R2ObjectBody | null> {
    const obj = this.store.get(key);
    if (!obj) return null;
    const self = this;
    const r2 = this.toR2Object(obj) as unknown as Record<string, unknown>;
    r2.body = new ReadableStream({
      start(controller) {
        controller.enqueue(obj.body);
        controller.close();
      },
    });
    r2.text = async () => new TextDecoder().decode(obj.body);
    r2.arrayBuffer = async () => obj.body.buffer.slice(0) as ArrayBuffer;
    void self;
    return r2 as unknown as R2ObjectBody;
  }

  async head(key: string): Promise<R2Object | null> {
    const obj = this.store.get(key);
    return obj ? this.toR2Object(obj) : null;
  }

  async delete(keys: string | string[]): Promise<void> {
    for (const k of Array.isArray(keys) ? keys : [keys]) this.store.delete(k);
  }

  private toR2Object(obj: StoredObject): R2Object {
    return {
      key: obj.key,
      size: obj.body.byteLength,
      httpMetadata: obj.contentType ? { contentType: obj.contentType } : {},
    } as unknown as R2Object;
  }

  asR2(): R2Bucket {
    return this as unknown as R2Bucket;
  }
}

/* ------------------------------------------------------------------ */
/* Queue shim (in-memory) + MessageBatch.                              */
/* ------------------------------------------------------------------ */

/** A captured send, so tests can inspect what was enqueued. */
export interface SentMessage<T> {
  body: T;
}

/** An in-memory Queue producer that records sends (handed over via asQueue()). */
export class FakeQueue<T> {
  readonly sent: SentMessage<T>[] = [];

  async send(message: T): Promise<void> {
    this.sent.push({ body: message });
  }

  async sendBatch(messages: Iterable<{ body: T }>): Promise<void> {
    for (const m of messages) this.sent.push({ body: m.body });
  }

  asQueue(): Queue<T> {
    return this as unknown as Queue<T>;
  }
}

/** A single fake message tracking ack/retry. */
export class FakeMessage<T> {
  acked = false;
  retried = false;
  constructor(
    readonly id: string,
    readonly body: T,
    readonly timestamp = new Date(),
    readonly attempts = 1,
  ) {}
  ack(): void {
    this.acked = true;
  }
  retry(): void {
    this.retried = true;
  }
}

/** Build a MessageBatch from a list of bodies (ids auto-assigned). */
export function makeBatch<T>(bodies: T[], queueName = 'keyword-research-jobs'): {
  batch: MessageBatch<T>;
  messages: FakeMessage<T>[];
} {
  const messages = bodies.map((b, i) => new FakeMessage(`msg-${i}`, b));
  const batch = {
    queue: queueName,
    messages: messages as unknown as Message<T>[],
    ackAll() {
      for (const m of messages) m.ack();
    },
    retryAll() {
      for (const m of messages) m.retry();
    },
  } as unknown as MessageBatch<T>;
  return { batch, messages };
}
