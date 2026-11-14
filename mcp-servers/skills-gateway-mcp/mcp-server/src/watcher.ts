/**
 * watcher.ts — incremental re-indexing for the skills gateway.
 *
 * The gateway rebuilds its index at startup. Without a watcher, a skill edited
 * mid-session (or a skill added by `git pull`) stays invisible until the server
 * restarts. This module closes that gap with debounced `fs.watch` events folded
 * through {@link reindexPaths}: only the changed markdown file is re-read.
 *
 * Guarantees
 *  - Never throws into the server. Watch failures surface through `onError`.
 *  - Debounced, so a branch switch that rewrites 40 files costs one rebuild.
 *  - Falls back to non-recursive watches when the platform refuses recursive
 *    watching (Node < 19.1, some network mounts).
 *  - `close()` is idempotent; a closed watcher never calls `onIndex` again.
 *
 * @module
 */
import { readdirSync, watch, type FSWatcher } from 'node:fs';
import { join } from 'node:path';
import { reindexPaths, type IndexFile } from './index-builder.js';

/** Never indexed by the builder, so a change under these never needs a rebuild. */
const IGNORED_SEGMENTS = new Set(['node_modules', '.git', 'dist', '__pycache__', '.pytest_cache']);
/** Depth used when enumerating directories for the non-recursive fallback. */
const FALLBACK_DEPTH = 2;

export interface WatchEventInfo {
  mode: 'incremental' | 'full';
  changed: string[];
}

export interface WatchOptions {
  /** Plugin root — the same value passed to `buildIndex`. */
  root: string;
  /** Current index, read at flush time so the caller owns the state. */
  index: () => IndexFile;
  /** Called with the new index after a non-empty change set. */
  onIndex: (next: IndexFile, info: WatchEventInfo) => void;
  /** Quiet period before applying a burst of events. Default 200ms. */
  debounceMs?: number;
  /** Passed to `fs.watch`; default false so a watcher never holds the process open. */
  persistent?: boolean;
  onError?: (error: unknown) => void;
}

export interface IndexWatcher {
  /** Apply any pending changes now, synchronously. Returns true if an index was published. */
  flush: () => boolean;
  /** Currently queued relative paths (test/observability hook). */
  pending: () => string[];
  /** Stop watching. Idempotent. */
  close: () => void;
}

/** Filter one raw watch path down to a rebuild-relevant relative path. */
export function watchablePath(rawPath: string | null | undefined): string | null {
  if (!rawPath) return null;
  const rel = String(rawPath).split('\\').join('/').replace(/^\.\//, '');
  if (!rel) return null;
  const segments = rel.split('/');
  if (segments.some((s) => !s || s.startsWith('.') || IGNORED_SEGMENTS.has(s))) return null;
  // Markdown is the corpus. A dotless path is a directory event (new `NN-slug/`
  // tree) and must reach `reindexPaths` so it can trigger a full walk.
  if (!/\.md$/i.test(rel) && rel.includes('.')) return null;
  return rel;
}

/** Directories to watch when recursive watching is unavailable. */
function fallbackTargets(root: string): string[] {
  const out = new Set<string>([root]);
  const queue: Array<{ dir: string; rel: string; depth: number }> = [{ dir: root, rel: '', depth: 0 }];
  // eslint-disable-next-line no-constant-condition
  while (queue.length) {
    const next = queue.shift()!;
    if (next.depth >= FALLBACK_DEPTH) continue;
    let names: string[];
    try {
      names = readdirSync(next.dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (name.startsWith('.') || IGNORED_SEGMENTS.has(name)) continue;
      const rel = next.rel ? `${next.rel}/${name}` : name;
      const allowed = next.depth === 0 ? /^\d\d-/.test(name) || ['rules', 'agents', 'commands'].includes(name) : true;
      if (!allowed) continue;
      out.add(join(root, ...rel.split('/')));
      queue.push({ dir: join(root, ...rel.split('/')), rel, depth: next.depth + 1 });
    }
  }
  return [...out];
}

/**
 * Start watching a plugin root.
 *
 * The caller owns the index state: `index()` is read at flush time, and
 * `onIndex()` receives the replacement. That keeps this module free of any
 * ownership assumptions and makes it trivially testable.
 */
export function startIndexWatcher(options: WatchOptions): IndexWatcher {
  const debounceMs = options.debounceMs ?? 200;
  const persistent = options.persistent ?? false;
  const pendingPaths = new Set<string>();
  const watchers: FSWatcher[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const clearTimer = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const flush = (): boolean => {
    clearTimer();
    if (closed || pendingPaths.size === 0) return false;
    const changed = [...pendingPaths];
    pendingPaths.clear();
    try {
      const result = reindexPaths(options.root, options.index(), changed);
      if (result.mode === 'noop') return false;
      options.onIndex(result.index, { mode: result.mode, changed });
      return true;
    } catch (error) {
      options.onError?.(error);
      return false;
    }
  };

  const onEvent = (rawPath: string | null | undefined): void => {
    if (closed) return;
    const rel = watchablePath(rawPath);
    if (!rel) return;
    pendingPaths.add(rel);
    clearTimer();
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, debounceMs);
    // Never keep the event loop alive just for a pending debounce.
    (timer as unknown as { unref?: () => void }).unref?.();
  };

  const attach = (dir: string, recursive: boolean): boolean => {
    try {
      const watcher = watch(dir, { recursive, persistent }, (_event, filename) => onEvent(filename));
      watcher.on('error', (error) => options.onError?.(error));
      watchers.push(watcher);
      return true;
    } catch (error) {
      options.onError?.(error);
      return false;
    }
  };

  const recursive = attach(options.root, true);
  if (!recursive) {
    for (const dir of fallbackTargets(options.root)) {
      if (dir === options.root) continue;
      attach(dir, false);
    }
  }

  return {
    flush,
    pending: () => [...pendingPaths],
    close: () => {
      if (closed) return;
      closed = true;
      clearTimer();
      pendingPaths.clear();
      for (const watcher of watchers) {
        try {
          watcher.close();
        } catch {
          /* already closed */
        }
      }
      watchers.length = 0;
    },
  };
}
