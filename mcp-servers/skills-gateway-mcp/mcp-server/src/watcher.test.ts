/**
 * Tests for incremental re-indexing: `reindexPaths` folding changed paths into
 * an existing index, the debounced `fs.watch` wrapper, and the live index view
 * the server serves from.
 *
 * The watcher tests are real: a temp tree, real `fs.watch`, real filesystem
 * events. They wait for the event instead of assuming it is instantaneous.
 *
 * @module
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import {
  buildIndex,
  digestFor,
  kindForPath,
  reindexPaths,
  type IndexFile,
} from './index-builder.js';
import { startIndexWatcher, watchablePath } from './watcher.js';
import { GatewayView } from './index.js';

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'skills-gateway-watch-'));
  for (const [rel, body] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body);
  }
  return root;
}

/** Poll until `predicate` is true or the deadline passes. */
async function waitFor(predicate: () => boolean, timeoutMs = 4_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

// ── Path classification ─────────────────────────────────────────────────────

test('kindForPath maps only numbered skills and the three fixed trees', () => {
  assert.equal(kindForPath('05-architecture-and-stack/SKILL.md'), 'skill');
  assert.equal(kindForPath('05-architecture-and-stack/references/x.md'), 'skill');
  assert.equal(kindForPath('rules/code-style.md'), 'rule');
  assert.equal(kindForPath('agents/architect.md'), 'agent');
  assert.equal(kindForPath('commands/deploy.md'), 'command');
  assert.equal(kindForPath('mcp-servers/x/README.md'), null);
  assert.equal(kindForPath('README.md'), null);
});

test('watchablePath drops noise and keeps directories and markdown', () => {
  assert.equal(watchablePath('rules/code-style.md'), 'rules/code-style.md');
  assert.equal(watchablePath('./rules/code-style.md'), 'rules/code-style.md');
  assert.equal(watchablePath('30-new-skill'), '30-new-skill');
  assert.equal(watchablePath('rules/node_modules/x.md'), null);
  assert.equal(watchablePath('rules/.hidden/x.md'), null);
  assert.equal(watchablePath('mcp-servers/skills-gateway-mcp/package-lock.json'), null);
  assert.equal(watchablePath(null), null);
});

// ── Incremental folding ─────────────────────────────────────────────────────

test('reindexPaths adds one new rule without disturbing the others', () => {
  const root = fixture({
    'rules/alpha.md': '---\nname: alpha\ndescription: first rule\n---\n# Alpha\n',
    'rules/beta.md': '---\nname: beta\ndescription: second rule\n---\n# Beta\n',
  });
  try {
    const before = buildIndex(root);
    assert.equal(before.entries.length, 2);
    writeFileSync(join(root, 'rules/gamma.md'), '---\nname: gamma\ndescription: third rule\n---\n# Gamma\n');
    const result = reindexPaths(root, before, ['rules/gamma.md']);
    assert.equal(result.mode, 'incremental');
    assert.equal(result.touched, 1);
    assert.equal(result.index.entries.length, 3);
    assert.ok(result.index.entries.some((e) => e.name === 'gamma' && e.kind === 'rule'));
    // Untouched entries keep their identity (same object, not a re-read).
    assert.equal(result.index.entries.find((e) => e.name === 'alpha'), before.entries.find((e) => e.name === 'alpha'));
    assert.notEqual(result.index.digest, before.digest);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reindexPaths replaces a modified entry', () => {
  const root = fixture({ 'rules/alpha.md': '---\nname: alpha\ndescription: old words\n---\n# Alpha\n' });
  try {
    const before = buildIndex(root);
    writeFileSync(join(root, 'rules/alpha.md'), '---\nname: alpha\ndescription: brand new words\n---\n# Alpha\n');
    const result = reindexPaths(root, before, ['rules/alpha.md']);
    assert.equal(result.mode, 'incremental');
    const entry = result.index.entries.find((e) => e.name === 'alpha');
    assert.ok(entry);
    assert.match(entry!.description, /brand new words/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reindexPaths drops an entry whose file was deleted', () => {
  const root = fixture({
    'rules/alpha.md': '---\nname: alpha\n---\n# Alpha\n',
    'rules/beta.md': '---\nname: beta\n---\n# Beta\n',
  });
  try {
    const before = buildIndex(root);
    unlinkSync(join(root, 'rules/beta.md'));
    const result = reindexPaths(root, before, ['rules/beta.md']);
    assert.equal(result.mode, 'incremental');
    assert.deepEqual(result.index.entries.map((e) => e.name), ['alpha']);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reindexPaths is a no-op for an unchanged mtime/size', () => {
  const root = fixture({ 'rules/alpha.md': '---\nname: alpha\n---\n# Alpha\n' });
  try {
    const before = buildIndex(root);
    const result = reindexPaths(root, before, ['rules/alpha.md']);
    assert.equal(result.mode, 'noop');
    assert.equal(result.index, before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reindexPaths falls back to a full rebuild for structural paths', () => {
  const root = fixture({ 'rules/alpha.md': '---\nname: alpha\n---\n# Alpha\n' });
  try {
    const before = buildIndex(root);
    mkdirSync(join(root, '30-new-tree'));
    writeFileSync(join(root, '30-new-tree/SKILL.md'), '---\nname: new-tree\ndescription: fresh\n---\n# New\n');
    const result = reindexPaths(root, before, ['30-new-tree']);
    assert.equal(result.mode, 'full');
    assert.ok(result.index.entries.some((e) => e.path === '30-new-tree/SKILL.md'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('digestFor is stable for a given entry list and tracks size', () => {
  const root = fixture({
    'rules/a.md': '---\nname: a\n---\n# A\n',
    'rules/b.md': '---\nname: b\n---\n# B\n',
  });
  try {
    const index = buildIndex(root);
    // Entries are always sorted before digesting, so the digest is reproducible.
    assert.equal(digestFor([...index.entries]), digestFor([...index.entries]));
    const bigger = index.entries.map((e) => (e.name === 'a' ? { ...e, sizeBytes: e.sizeBytes + 1 } : e));
    assert.notEqual(digestFor(bigger), digestFor(index.entries));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ── Live watcher ────────────────────────────────────────────────────────────

test('watcher re-indexes an added skill file and publishes it', async () => {
  const root = fixture({ 'rules/alpha.md': '---\nname: alpha\ndescription: first\n---\n# Alpha\n' });
  let index: IndexFile = buildIndex(root);
  const events: Array<{ digest: string; changed: string[] }> = [];
  const watcher = startIndexWatcher({
    root,
    index: () => index,
    onIndex: (next, info) => {
      index = next;
      events.push({ digest: next.digest, changed: info.changed });
    },
    debounceMs: 20,
    persistent: false,
  });
  try {
    mkdirSync(join(root, '06-build-and-slice-loop'), { recursive: true });
    writeFileSync(
      join(root, '06-build-and-slice-loop/SKILL.md'),
      '---\nname: build-and-slice-loop\ndescription: slice a feature into vertical increments\n---\n# Build\n',
    );

    await waitFor(() => watcher.pending().length > 0);
    watcher.flush();

    assert.ok(events.length >= 1, 'watcher never published an index');
    assert.ok(
      index.entries.some((e) => e.name === 'build-and-slice-loop' && e.kind === 'skill'),
      `missing new skill; have ${index.entries.map((e) => e.name).join(', ')}`,
    );
  } finally {
    watcher.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('watcher re-reads a modified file and drops a deleted one', async () => {
  const root = fixture({
    'rules/alpha.md': '---\nname: alpha\ndescription: original\n---\n# Alpha\n',
    'rules/beta.md': '---\nname: beta\ndescription: doomed\n---\n# Beta\n',
  });
  let index: IndexFile = buildIndex(root);
  const watcher = startIndexWatcher({
    root,
    index: () => index,
    onIndex: (next) => {
      index = next;
    },
    debounceMs: 20,
  });
  try {
    writeFileSync(join(root, 'rules/alpha.md'), '---\nname: alpha\ndescription: corrected words\n---\n# Alpha\n');
    await waitFor(() => watcher.pending().length > 0);
    watcher.flush();
    assert.match(index.entries.find((e) => e.name === 'alpha')!.description, /corrected words/);

    unlinkSync(join(root, 'rules/beta.md'));
    await waitFor(() => watcher.pending().length > 0);
    watcher.flush();
    assert.equal(index.entries.some((e) => e.name === 'beta'), false);
  } finally {
    watcher.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test('a closed watcher stops publishing and close is idempotent', async () => {
  const root = fixture({ 'rules/alpha.md': '---\nname: alpha\n---\n# Alpha\n' });
  let index: IndexFile = buildIndex(root);
  let published = 0;
  const watcher = startIndexWatcher({
    root,
    index: () => index,
    onIndex: (next) => {
      index = next;
      published++;
    },
    debounceMs: 20,
  });
  try {
    watcher.close();
    watcher.close();
    writeFileSync(join(root, 'rules/new.md'), '---\nname: new\n---\n# New\n');
    await new Promise((resolve) => setTimeout(resolve, 150));
    watcher.flush();
    assert.equal(published, 0);
    assert.equal(watcher.pending().length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ── Live view ───────────────────────────────────────────────────────────────

test('GatewayView picks up a swap without rebuilding the server', () => {
  const root = fixture({ 'rules/alpha.md': '---\nname: alpha\n---\n# Alpha\n' });
  try {
    let index = buildIndex(root);
    const view = new GatewayView(() => index);
    assert.equal(view.names.get('alpha')?.length, 1);

    writeFileSync(join(root, 'rules/beta.md'), '---\nname: beta\n---\n# Beta\n');
    index = reindexPaths(root, index, ['rules/beta.md']).index;

    assert.equal(view.index.entries.length, 2);
    assert.ok(view.names.get('beta'), 'new entry must be addressable by name');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
