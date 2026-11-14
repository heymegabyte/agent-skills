/**
 * index-builder.ts — builds the skills-gateway index from the plugin directory.
 *
 * The gateway answers `search_skills` / `find_rule` / `load_skill` from a compact,
 * JSON-serialisable index. Three entry sources:
 *
 *   1. Skill files  — `NN-<slug>/SKILL.md` (and nested refs/docs).
 *   2. Rule files   — `rules/**.md`.
 *   3. Agent files  — `agents/**.md`.
 *
 * Every entry carries frontmatter (name, description, priority, paths, tags) plus
 * a body-free summary, so the index never embeds full skill prose. `load_skill`
 * reads the real file on demand.
 *
 * @module
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { createHash } from 'node:crypto';

export type EntryKind = 'skill' | 'rule' | 'agent' | 'command';

export interface IndexEntry {
  /** Stable slug: frontmatter name, else file basename. */
  name: string;
  /** Every other name this entry answers to (dir slug, frontmatter name, basename). */
  aliases: string[];
  kind: EntryKind;
  /** Plugin-root-relative posix path. */
  path: string;
  description: string;
  /** First sentence(s) of the body, trimmed to SUMMARY_CAP chars. */
  summary: string;
  /** Searchable haystack: description + tags + headings, lowercased. */
  terms: string;
  priority: number | null;
  /** Headings a `load_skill({sections})` call can address. */
  sections: string[];
  sizeBytes: number;
  modifiedMs: number;
}

export interface IndexFile {
  version: 1;
  builtAt: string;
  root: string;
  entries: IndexEntry[];
  digest: string;
}

export const INDEX_VERSION = 1;
export const INDEX_FILENAME = '.skills-gateway-index.json';
const SUMMARY_CAP = 600;
const SKIP_DIRS = new Set(['node_modules', '__pycache__', '.git', 'dist', '.pytest_cache']);

/** Bytes → rough token count at the repo's standard 4-bytes-per-token ratio. */
export function approxTokens(bytes: number): number {
  return Math.ceil(bytes / 4);
}

// ── Frontmatter ─────────────────────────────────────────────────────────────

export interface Frontmatter {
  [key: string]: string | string[] | number | null;
}

/**
 * Parse the YAML-ish frontmatter the repo actually uses. Scalars, inline arrays
 * (`[a, b]`, `"*"`), and block arrays (`- item`) are supported — no YAML dep.
 */
export function parseFrontmatter(text: string): Frontmatter {
  if (!text.startsWith('---')) return {};
  const end = text.indexOf('\n---', 3);
  if (end === -1) return {};
  const fm: Frontmatter = {};
  let key = '';
  for (const raw of text.slice(3, end).split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      key = kv[1];
      const val = kv[2].trim();
      if (val === '') {
        fm[key] = [];
      } else if (val.startsWith('[') && val.endsWith(']')) {
        fm[key] = splitList(val.slice(1, -1));
      } else if (/^-?\d+$/.test(val)) {
        fm[key] = Number(val);
      } else {
        fm[key] = unquote(val);
      }
      continue;
    }
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && key) {
      const arr = Array.isArray(fm[key]) ? (fm[key] as string[]) : [];
      arr.push(unquote(item[1]));
      fm[key] = arr;
    }
  }
  return fm;
}

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}

function splitList(s: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quote = '';
  for (const ch of s) {
    if (quote) {
      if (ch === quote) quote = '';
      cur += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur);
  return out.map(unquote).filter((v) => v.length > 0);
}

function stripFrontmatter(text: string): string {
  if (!text.startsWith('---')) return text;
  const end = text.indexOf('\n---', 3);
  return end === -1 ? text : text.slice(end + 4);
}

/** Remove fenced code so code samples never become search terms. */
function stripFences(text: string): string {
  return text.replace(/^```[\s\S]*?^```/gm, '');
}

function headings(body: string): string[] {
  const out: string[] = [];
  for (const line of body.split('\n')) {
    const m = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (m) out.push(m[2].trim());
  }
  return out;
}

function firstParagraph(body: string, cap = SUMMARY_CAP): string {
  const prose = stripFences(stripFrontmatter(body))
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && !l.startsWith('|') && !l.startsWith('---') && !l.startsWith('>'));
  const sentences: string[] = [];
  for (const line of prose) {
    sentences.push(line);
    if (sentences.join(' ').length >= cap || /\.$/.test(line)) break;
  }
  return sentences.join(' ').slice(0, cap).trim();
}

// ── Walk ────────────────────────────────────────────────────────────────────

function isIndexable(file: string): boolean {
  return file.endsWith('.md');
}

function walk(dir: string, root: string, accept: (rel: string) => boolean, out: string[]): void {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of names.sort()) {
    if (name.startsWith('.')) continue;
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      walk(full, root, accept, out);
    } else if (st.isFile() && isIndexable(name)) {
      if (accept(relative(root, full))) out.push(full);
    }
  }
}

/** Count indexable markdown files directly inside `dir` (non-recursive). */
function countMarkdown(dir: string): number {
  try {
    return readdirSync(dir).filter((n) => isIndexable(n) && !n.startsWith('.')).length;
  } catch {
    return 0;
  }
}

function buildEntry(file: string, root: string, kind: EntryKind): IndexEntry | null {
  let text: string;
  let st;
  try {
    text = readFileSync(file, 'utf-8');
    st = statSync(file);
  } catch {
    return null;
  }
  const fm = parseFrontmatter(text);
  const relPath = relative(root, file).split('\\').join('/');
  const body = stripFrontmatter(text);
  const fmName = typeof fm.name === 'string' && fm.name ? fm.name : '';
  const name = fmName || basename(file).replace(/\.md$/, '');
  const description = typeof fm.description === 'string' ? fm.description : firstParagraph(body, 300);
  const tags = Array.isArray(fm.tags) ? (fm.tags as string[]) : [];
  const priority = typeof fm.priority === 'number' ? fm.priority : null;
  const heads = headings(body);

  const firstSeg = relPath.split('/')[0];
  // Only a numbered skill directory is a meaningful alias; `rules`/`agents`/
  // `commands` are shared by every file and would tie all their scores.
  const dirSlug = /^\d\d-/.test(firstSeg) ? firstSeg : '';
  const fileSlug = basename(file).replace(/\.md$/, '');
  const aliases = [...new Set([fmName, fileSlug].filter((a): a is string => !!a && a !== name))];

  const terms = [
    name,
    description,
    ...tags,
    ...heads,
    typeof fm['when-to-use'] === 'string' ? fm['when-to-use'] : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    name,
    aliases,
    kind,
    path: relPath,
    description,
    summary: firstParagraph(body),
    terms,
    priority,
    sections: heads,
    sizeBytes: st.size,
    modifiedMs: Math.round(st.mtimeMs),
  };
}

/** Build the full index for a plugin root. Never embeds file bodies. */
export function buildIndex(root: string): IndexFile {
  return buildIndexDetailed(root).index;
}

export interface BuildResult {
  index: IndexFile;
  /** File path → entry kind for every indexed file. */
  files: Map<string, EntryKind>;
}

/** Build the index and report which files it covers. */
export function buildIndexDetailed(root: string): BuildResult {
  const files: Array<[string, EntryKind]> = [];

  // Skills: NN-<slug>/**.md
  for (const dir of readdirSync(root).sort()) {
    if (!/^\d\d-/.test(dir)) continue;
    if (SKIP_DIRS.has(dir)) continue;
    try {
      if (!statSync(join(root, dir)).isDirectory()) continue;
    } catch {
      continue;
    }
    const found: string[] = [];
    walk(join(root, dir), root, () => true, found);
    for (const f of found) files.push([f, 'skill']);
  }

  for (const [dir, kind] of [
    ['rules', 'rule'],
    ['agents', 'agent'],
    ['commands', 'command'],
  ] as const) {
    const found: string[] = [];
    walk(join(root, dir), root, () => true, found);
    for (const f of found) files.push([f, kind]);
  }

  const entries: IndexEntry[] = [];
  for (const [file, kind] of files) {
    const e = buildEntry(file, root, kind);
    if (e) entries.push(e);
  }

  entries.sort(compareEntries);

  const index: IndexFile = {
    version: INDEX_VERSION,
    builtAt: new Date().toISOString(),
    root,
    entries,
    digest: digestFor(entries),
  };
  const covered = new Map<string, EntryKind>();
  for (const [file, kind] of files) covered.set(relative(root, file).split('\\').join('/'), kind);
  return { index, files: covered };
}

/** Serialise the index exactly as it is written to disk. */
export function serialiseIndex(index: IndexFile): string {
  return JSON.stringify(index, null, 0);
}

/** Write the index cache, ignoring read-only mounts. Returns success. */
export function writeIndexCache(root: string, index: IndexFile): boolean {
  try {
    writeFileSync(join(root, INDEX_FILENAME), serialiseIndex(index));
    return true;
  } catch {
    return false;
  }
}

/** Token cost of the serialised index (~4 bytes/token). */
export function indexTokenCost(index: IndexFile): number {
  return approxTokens(Buffer.byteLength(serialiseIndex(index), 'utf-8'));
}

// ── Incremental re-index (file watcher) ─────────────────────────────────────

/** Canonical entry ordering — one definition so incremental and full agree. */
export function compareEntries(a: IndexEntry, b: IndexEntry): number {
  return a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind.localeCompare(b.kind);
}

/** Digest over entry identity + size + mtime; identical inputs give identical digests. */
export function digestFor(entries: IndexEntry[]): string {
  return createHash('sha256')
    .update(entries.map((e) => `${e.kind}:${e.name}:${e.sizeBytes}:${e.modifiedMs}`).join('\n'))
    .digest('hex')
    .slice(0, 16);
}

/**
 * Which index kind a plugin-root-relative path belongs to, or `null` when the
 * path is outside every indexed area (a caller must then fall back to a full
 * rebuild — e.g. a brand-new `NN-<slug>/` tree).
 */
export function kindForPath(relPath: string): EntryKind | null {
  const segments = relPath.split('\\').join('/').split('/');
  if (segments.length < 2) return null;
  const first = segments[0];
  if (/^\d\d-/.test(first)) return 'skill';
  if (first === 'rules') return 'rule';
  if (first === 'agents') return 'agent';
  if (first === 'commands') return 'command';
  return null;
}

export interface ReindexResult {
  index: IndexFile;
  /** `noop` when nothing indexable changed, `incremental` for a partial update. */
  mode: 'noop' | 'incremental' | 'full';
  /** Number of entries added, replaced, or removed. */
  touched: number;
}

/**
 * Fold a set of changed plugin-root-relative paths into an existing index.
 *
 * A `.md` path inside an indexed area rebuilds exactly one entry; a deleted
 * file drops its entry. Anything structural (a new directory, a non-markdown
 * path) triggers a full rebuild, because a watcher event cannot tell us which
 * files a directory rename added.
 */
export function reindexPaths(
  root: string,
  previous: IndexFile,
  changed: Iterable<string>,
): ReindexResult {
  const paths = [...new Set([...changed].map((p) => p.split('\\').join('/')))].filter(Boolean);
  if (paths.length === 0) return { index: previous, mode: 'noop', touched: 0 };

  const byPath = new Map(previous.entries.map((entry) => [entry.path, entry]));
  let touched = 0;

  for (const rel of paths) {
    const kind = kindForPath(rel);
    // Structural change (directory create/rename/delete) — only a full walk is correct.
    if (kind === null || !/\.md$/i.test(rel)) {
      return { index: buildIndex(root), mode: 'full', touched: paths.length };
    }
    const abs = join(root, ...rel.split('/'));
    let isFile = false;
    try {
      isFile = statSync(abs).isFile();
    } catch {
      isFile = false;
    }
    if (!isFile) {
      if (byPath.delete(rel)) touched++;
      continue;
    }
    const entry = buildEntry(abs, root, kind);
    if (!entry) {
      if (byPath.delete(rel)) touched++;
      continue;
    }
    const prior = byPath.get(rel);
    if (prior && prior.sizeBytes === entry.sizeBytes && prior.modifiedMs === entry.modifiedMs) continue;
    byPath.set(rel, entry);
    touched++;
  }

  if (touched === 0) return { index: previous, mode: 'noop', touched: 0 };
  const entries = [...byPath.values()].sort(compareEntries);
  return {
    index: {
      version: INDEX_VERSION,
      builtAt: new Date().toISOString(),
      root,
      entries,
      digest: digestFor(entries),
    },
    mode: 'incremental',
    touched,
  };
}
