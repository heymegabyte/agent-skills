import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { LangfuseSafeClient } from '../bin/lib/langfuse-safe.ts';
import {
  buildPaperclipIssuePayload,
  validateOpenSpecChange,
} from '../bin/openspec-paperclip-sync.ts';

describe('LangfuseSafeClient — Always-On with Graceful Timeout & Circuit Breaker', () => {
  it('delivers trace when Langfuse responds 200 within timeout', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lf-test-ok-'));
    const client = new LangfuseSafeClient({
      baseUrl: 'https://langfuse.example.com',
      publicKey: 'pk-lf-test',
      secretKey: 'sk-lf-test',
      timeoutMs: 500,
      spoolFilePath: path.join(tmpDir, 'traces.jsonl'),
      fetchImpl: async () => new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
    });

    const res = await client.traceSafe({
      id: 'trace-1',
      name: 'test-generation',
      model: 'deepseek-v4-pro',
    });

    assert.equal(res.delivered, true);
    assert.equal(res.spooled, false);
    assert.equal(res.circuitOpen, false);
    assert.equal(client.getCircuitState().totalDelivered, 1);
  });

  it('fails open, spools locally, and trips circuit breaker after 3 consecutive timeouts/failures', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lf-test-fail-'));
    const spoolFile = path.join(tmpDir, 'traces.jsonl');
    let networkCalls = 0;

    const client = new LangfuseSafeClient({
      baseUrl: 'https://langfuse.example.com',
      publicKey: 'pk-lf-test',
      secretKey: 'sk-lf-test',
      timeoutMs: 100,
      failureThreshold: 3,
      cooldownMs: 60_000,
      spoolFilePath: spoolFile,
      fetchImpl: async () => {
        networkCalls += 1;
        throw new Error('The operation was aborted due to timeout');
      },
    });

    const r1 = await client.traceSafe({ id: 't1', name: 'call-1' });
    const r2 = await client.traceSafe({ id: 't2', name: 'call-2' });
    const r3 = await client.traceSafe({ id: 't3', name: 'call-3' });
    assert.equal(r1.delivered, false);
    assert.equal(r2.delivered, false);
    assert.equal(r3.delivered, false);
    assert.equal(r3.circuitOpen, true);
    assert.equal(networkCalls, 3);

    // 4th call should short-circuit immediately without hitting fetchImpl
    const r4 = await client.traceSafe({ id: 't4', name: 'call-4' });
    assert.equal(r4.circuitOpen, true);
    assert.equal(r4.spooled, true);
    assert.equal(networkCalls, 3);

    const spooledLines = fs.readFileSync(spoolFile, 'utf8').trim().split('\n');
    assert.equal(spooledLines.length, 4);
  });

  it('falls back gracefully to local prompt text when Langfuse is unreachable', async () => {
    const client = new LangfuseSafeClient({
      baseUrl: 'https://langfuse.example.com',
      publicKey: 'pk-lf-test',
      secretKey: 'sk-lf-test',
      timeoutMs: 100,
      fetchImpl: async () => {
        throw new Error('ECONNREFUSED');
      },
    });

    const prompt = await client.getPromptWithFallback('architect-system', 'FALLBACK_SYSTEM_PROMPT');
    assert.equal(prompt, 'FALLBACK_SYSTEM_PROMPT');
  });
});

describe('OpenSpec Frontier Architect Validator & Paperclip Payload Builder', () => {
  it('accepts claude/codex/antigravity Architect specs and rejects opencode Architect specs', () => {
    const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-test-'));
    const validChangeDir = path.join(tmpRepo, 'openspec', 'changes', 'valid-change');
    fs.mkdirSync(validChangeDir, { recursive: true });
    fs.writeFileSync(
      path.join(validChangeDir, 'proposal.md'),
      '# Proposal: Converge UI Widgets\n\n> **Architect:** claude\n',
    );
    fs.writeFileSync(
      path.join(validChangeDir, 'design.md'),
      '# Design\n\n> **Architect:** claude\nDetails here.\n',
    );
    fs.writeFileSync(
      path.join(validChangeDir, 'tasks.md'),
      '# Tasks\n\n- [x] 1.1 Done task\n- [ ] 1.2 Remaining task\n',
    );

    const validRes = validateOpenSpecChange(tmpRepo, 'valid-change', 'theme.tools');
    assert.equal(validRes.valid, true);
    assert.equal(validRes.completedTasks, 1);
    assert.equal(validRes.totalTasks, 2);

    const payload = buildPaperclipIssuePayload(validRes);
    assert.ok(payload.title.includes('[openspec:theme.tools:valid-change]'));
    assert.equal(payload.status, 'todo');
    assert.ok(
      payload.description.includes(
        'https://github.com/heymegabyte/theme.tools/blob/main/openspec/changes/valid-change/proposal.md',
      ),
    );

    // Now test forbidden opencode architect
    const invalidChangeDir = path.join(tmpRepo, 'openspec', 'changes', 'opencode-change');
    fs.mkdirSync(invalidChangeDir, { recursive: true });
    fs.writeFileSync(
      path.join(invalidChangeDir, 'proposal.md'),
      '# Proposal: Bad Spec\n\n> **Architect:** opencode\n',
    );
    fs.writeFileSync(path.join(invalidChangeDir, 'design.md'), '# Design\n');
    fs.writeFileSync(path.join(invalidChangeDir, 'tasks.md'), '- [ ] 1.1 Task\n');

    const invalidRes = validateOpenSpecChange(tmpRepo, 'opencode-change', 'theme.tools');
    assert.equal(invalidRes.valid, false);
    assert.ok(invalidRes.errors.some((e) => e.includes('NEVER opencode')));
  });

  it('registers all 28 default @theme.tools libraries in platform-stack.json, theme-tools-canonical-components.md, and CONVENTIONS.md', () => {
    const repoRoot = path.resolve(import.meta.dirname, '..');
    const stackJson = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'reference', 'platform-stack.json'), 'utf8'),
    );
    const canonicalRule = fs.readFileSync(
      path.join(repoRoot, 'rules', 'theme-tools-canonical-components.md'),
      'utf8',
    );
    const conventionsMd = fs.readFileSync(path.join(repoRoot, 'CONVENTIONS.md'), 'utf8');

    const { coreWorkspace, absorbedSaasEngines, foundationalUtilities } =
      stackJson.defaultThemeToolsLibraries;
    assert.equal(coreWorkspace.length, 5);
    assert.equal(absorbedSaasEngines.length, 15);
    assert.equal(foundationalUtilities.length, 8);

    const all28 = [...coreWorkspace, ...absorbedSaasEngines, ...foundationalUtilities];
    assert.equal(all28.length, 28);

    for (const pkg of all28) {
      assert.ok(
        canonicalRule.includes(pkg),
        `Missing ${pkg} in rules/theme-tools-canonical-components.md`,
      );
      assert.ok(conventionsMd.includes(pkg), `Missing ${pkg} in CONVENTIONS.md`);
    }

    for (const forbiddenVendorPkg of [
      '@theme.tools/activepieces',
      '@theme.tools/nango',
      '@theme.tools/postiz',
    ]) {
      assert.equal(all28.includes(forbiddenVendorPkg), false);
      assert.equal(canonicalRule.includes(forbiddenVendorPkg), false);
      assert.equal(conventionsMd.includes(forbiddenVendorPkg), false);
    }
  });
});
