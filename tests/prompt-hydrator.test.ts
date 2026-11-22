import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  buildGreenfieldCascade,
  formatHydratedBrief,
  formatHydrationExplanation,
  hydratePrompt,
  writeOpenSpecFixture,
} from '../bin/prompt-hydrator.ts';

function fixtureCheckout(): string {
  const root = mkdtempSync(join(tmpdir(), 'prompt-hydrator-'));
  mkdirSync(join(root, 'openspec', 'changes', 'active-change'), { recursive: true });
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'AGENTS.md'), '# Fixture instructions\nHydrate before execution.\n');
  writeFileSync(join(root, 'CLAUDE.md'), '# Claude fixture\n');
  writeFileSync(join(root, 'openspec', 'config.yaml'), 'schema: spec-driven\n');
  writeFileSync(join(root, 'openspec', 'changes', 'active-change', 'proposal.md'), '# Active\n');
  writeFileSync(join(root, 'src', 'app.ts'), 'export const app = true;\n');
  writeFileSync(join(root, 'package.json'), JSON.stringify({ dependencies: { hono: '4.13.0' } }));
  return root;
}

test('hydrates live context before execution and preserves evidence safely', async () => {
  const checkout = fixtureCheckout();
  const prompt = 'clone Notion with token ghp_abcdefghijklmnopqrstuvwxyz123456';
  const first = await hydratePrompt({ prompt, checkout, now: '2026-11-15T00:00:00.000Z' });
  const second = await hydratePrompt({ prompt, checkout, now: '2026-11-15T00:00:00.000Z' });

  assert.equal(first.originalRequest, prompt);
  assert.equal(first.route, 'greenfield-saas');
  assert.ok(first.context.instructions.some((entry) => entry.path === 'AGENTS.md'));
  assert.deepEqual(first.context.activeOpenSpecChanges, ['active-change']);
  assert.equal(first.context.dependencies.hono, '4.13.0');
  assert.deepEqual(first.evidence.map((entry) => entry.id), second.evidence.map((entry) => entry.id));
  assert.match(first.diagnosticRequest, /\[REDACTED:github-token\]/);
  assert.doesNotMatch(formatHydrationExplanation(first), /ghp_abcdefghijklmnopqrstuvwxyz123456/);
  assert.match(formatHydratedBrief(first), /Original request \(verbatim\)/);
  assert.match(formatHydrationExplanation(first), /Omissions and fallbacks/);
});

test('clone Notion recursively expands into traceable research and OpenSpec', async () => {
  const hydrated = await hydratePrompt({
    prompt: 'clone Notion',
    checkout: fixtureCheckout(),
    now: '2026-11-15T00:00:00.000Z',
  });
  const cascade = buildGreenfieldCascade(hydrated);
  const labels = cascade.workflows.map((workflow) => workflow.name.toLowerCase());

  for (const expected of [
    'edit a page',
    'share a page',
    'use a database view',
    'change sign-in email',
    'revoke an invitation',
    'move a page',
    'restore a page from trash',
  ]) assert.ok(labels.includes(expected), `missing ${expected}`);

  assert.ok(cascade.researchPrompts.length >= 200);
  assert.ok(cascade.scenarios.length >= 200);
  assert.ok(cascade.researchPrompts.some((prompt) => prompt.parentPromptId));
  assert.ok(cascade.traceability.every((trace) => trace.goalId && trace.testId && trace.verificationId));
  assert.ok(cascade.gapReview.queued.length >= 1);
  assert.ok(cascade.gapReview.queued.some((gap) => /export/i.test(gap.workflow)));
  assert.ok(hydrated.researchFindings.some((finding) => finding.provenance === 'https://www.notion.com/help/account-settings' && finding.status === 'verified'));
  assert.ok(hydrated.researchFindings.some((finding) => /invitation-revocation/.test(finding.provenance) && finding.status === 'unverified'));

  const output = join(mkdtempSync(join(tmpdir(), 'notion-openspec-')), 'clone-notion');
  writeOpenSpecFixture(cascade, output);
  assert.match(readFileSync(join(output, 'proposal.md'), 'utf8'), /Architect Role:\*\* assigned/);
  assert.match(readFileSync(join(output, 'design.md'), 'utf8'), /Requirement-to-test trace/);
  assert.match(readFileSync(join(output, 'specs', 'notion-clone', 'spec.md'), 'utf8'), /### Requirement:/);
  assert.match(readFileSync(join(output, 'tasks.md'), 'utf8'), /browser/i);
});

test('narrow bug fixes do not trigger greenfield fan-out', async () => {
  const hydrated = await hydratePrompt({
    prompt: 'Fix the mega menu title changing on hover',
    checkout: fixtureCheckout(),
    now: '2026-11-15T00:00:00.000Z',
  });
  assert.equal(hydrated.route, 'focused-change');
  assert.equal(hydrated.inferredRequirements.length, 0);
});

test('Claude UserPromptSubmit adapter hydrates before execution', () => {
  const result = spawnSync(process.execPath, ['bin/prompt-hydration-hook.mjs'], {
    cwd: join(import.meta.dirname, '..'),
    input: JSON.stringify({ prompt: 'clone Notion', cwd: fixtureCheckout() }),
    encoding: 'utf8',
    timeout: 15_000,
  });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout) as { hookSpecificOutput: { hookEventName: string; additionalContext: string } };
  assert.equal(output.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(output.hookSpecificOutput.additionalContext, /Route: \*\*greenfield-saas\*\*/);
  assert.match(output.hookSpecificOutput.additionalContext, /966 research prompts/);
  assert.match(output.hookSpecificOutput.additionalContext, /Product & Architecture Gap Audit/);
  assert.match(output.hookSpecificOutput.additionalContext, /Settings & Preferences/);
  assert.match(output.hookSpecificOutput.additionalContext, /Right-Sized Collaborative SCRUM Deliberation Quorum/);
  assert.match(output.hookSpecificOutput.additionalContext, /OpenCode \(DeepSeek\) Offload/);
});

test('product gap audit, SCRUM deliberation quorum, and 15-strategy multi-swarm plan work end-to-end', async () => {
  const hydrated = await hydratePrompt({
    prompt: 'Add AI workflow builder with extensible plugin catalog and settings',
    checkout: fixtureCheckout(),
    now: '2026-11-21T00:00:00.000Z',
  });
  assert.equal(hydrated.executionMode, 'hyper-saturated-swarm');
  assert.ok(hydrated.productAudit.missingOrIncompleteSurfaces.some((s) => s.surface === 'Settings & Preferences'));
  assert.ok(hydrated.productAudit.missingOrIncompleteSurfaces.some((s) => s.surface === 'Extensible Plugin Catalog'));
  assert.ok(hydrated.productAudit.categoricalAspects.length >= 5);
  assert.ok(hydrated.scrumQuorum.selectedAgents.length >= 4 && hydrated.scrumQuorum.selectedAgents.length <= 7);
  assert.ok(hydrated.scrumQuorum.excludedAgentCount >= 21);
  assert.equal(hydrated.swarmExecutionPlan.top15ActiveStrategies.length, 15);
  assert.ok(hydrated.swarmExecutionPlan.opencodeDeepseekOffload.targetOffloadRatio >= 0.7);
  assert.equal(hydrated.swarmExecutionPlan.finishLineContract.unitTestCoverageTarget, '100%');
  assert.equal(hydrated.swarmExecutionPlan.finishLineContract.e2eRunner, 'cloudflare-browser-run-parallel');
  assert.equal(hydrated.swarmExecutionPlan.finishLineContract.gitBranch, 'main');
});
