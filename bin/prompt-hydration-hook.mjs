#!/usr/bin/env node
/**
 * Unified UserPromptSubmit hook adapter:
 * 1. Runs the portable Hyper-Saturated Prompt Hydrator (bin/prompt-hydrator.ts)
 *    including Product & Architecture Gap Audit (Settings, Plugin Catalogs, @theme.tools),
 *    Context only. It never claims that research, deliberation, OpenSpec compilation, or execution ran.
 * 2. Runs the Skill Router (bin/skill-router.py) to attach top-matched skills.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateMaintenanceAdmission } from './maintenance-recursion.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let input = {};
try {
  input = JSON.parse(await new Promise((resolve) => {
    let value = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { value += chunk; });
    process.stdin.on('end', () => resolve(value || '{}'));
  }));
} catch {
  process.stderr.write('Prompt hydration rejected invalid hook JSON.\n');
  process.exit(1);
}

const prompt = typeof input.prompt === 'string'
  ? input.prompt
  : (typeof input.user_prompt === 'string' ? input.user_prompt : '');
const cwd = typeof input.cwd === 'string' ? input.cwd : process.cwd();
if (!prompt.trim()) {
  process.stderr.write('Prompt hydration requires a non-empty prompt.\n');
  process.exit(1);
}

const maintenance = input.maintenance && typeof input.maintenance === 'object' ? input.maintenance : null;
const admission = evaluateMaintenanceAdmission(maintenance ?? {}, process.env.MAINTENANCE_TRIGGER_IDENTITY || '');
if (!admission.admitted && admission.reason === 'equivalent-trigger-covered') {
  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `Prompt Hydration suppressed an equivalent recursive maintenance invocation for trigger ${admission.triggerId} at evidence revision ${admission.evidenceRevision}. Claude is the native-hook surface; no engineering execution was performed.`,
    },
  })}\n`);
  process.exit(0);
}
if (!admission.admitted && admission.reason === 'recursion-depth-exceeded') {
  process.stderr.write('Prompt hydration rejected excessive maintenance recursion depth.\n');
  process.exit(1);
}

try {
  const shouldCascade = /\b(clone|build|create|make|launch|feature|implement|add|expand|upgrade|saturate|architect|security|auth|payment|billing|migration|integration|deploy)\b/i.test(prompt)
    || (/\b(fix|bug|focused|narrow|prototype)\b/i.test(prompt) && /\b(architecture|security|auth|payment|billing|migration|integration|tenant|provider|deploy)\b/i.test(prompt));
  const hydratedContext = execFileSync(process.execPath, [
    '--experimental-strip-types',
    join(root, 'bin', 'prompt-hydrator.ts'),
    '--prompt-stdin',
    '--checkout', cwd,
    '--format', 'brief',
    ...(shouldCascade ? ['--cascade'] : []),
  ], {
    encoding: 'utf8',
    timeout: 12_000,
    maxBuffer: 2_000_000,
    input: prompt,
    env: { ...process.env, NODE_NO_WARNINGS: '1', PROMPT_HYDRATION_ACTIVE: '1' },
  });

  let routerSection = '';
  const routerScript = existsSync(join(root, 'bin', 'skill-router.py'))
    ? join(root, 'bin', 'skill-router.py')
    : join(process.env.HOME || '', '.claude', 'bin', 'skill-router.py');
  if (existsSync(routerScript)) {
    try {
      const routerRaw = execFileSync('python3', [routerScript, 'route', prompt, '--cwd', cwd, '--pass', 'initial', '--offline'], {
        encoding: 'utf8',
        timeout: 5_000,
        maxBuffer: 1_000_000,
      });
      const parsed = JSON.parse(routerRaw);
      const routed = Array.isArray(parsed.selected) ? parsed.selected : [];
      const selected = [
        ...routed.filter(({ reason }) => reason === 'trigger-match'),
        ...routed.filter(({ reason }) => reason !== 'trigger-match'),
      ].slice(0, 15);
      if (selected.length > 0) {
        routerSection = `\n## Skill router — top matches for this prompt\n(Token use: ${Number(parsed.total_tokens || 0).toLocaleString()} / ${Number(parsed.budget || 0).toLocaleString()} budget)\n\n${selected.map((entry) => `- \`${entry.id}\` — ${entry.reason}`).join('\n')}\n`;
      }
    } catch (routerError) {
      const message = routerError instanceof Error ? routerError.message.slice(0, 240) : 'unknown router failure';
      throw new Error(`Skill routing failed closed: ${message}`);
    }
  }

  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `${hydratedContext}${routerSection}\n## Hydration entry support\nClaude UserPromptSubmit is the native prompt hook. Codex, Gemini, OpenCode, Paperclip, OpenClaw, coordinator, and worker entrypoints use bin/prompt-hydration-entry.mjs as an explicit wrapper and must not claim native interception.\n\n## Mandatory execution contract\nLoad rules/evidence-gated-autonomous-orchestration.md and invoke the governed composition root in bin/evidence-gated-orchestrator.ts through host-configured approved adapters. This hook hydrated and routed context only; it did not perform research, conference, OpenSpec compilation, swarm execution, integration, or verification. A planning manifest or compiled command is not execution evidence.\n`,
    },
  })}\n`);
} catch (error) {
  const reason = error instanceof Error ? error.message.slice(0, 240) : 'unknown failure';
  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `Prompt hydration failed closed (${reason}). Do not begin material execution until rules/evidence-gated-autonomous-orchestration.md can be loaded and the hydration receipt is produced.`,
    },
  })}\n`);
  process.exitCode = 1;
}
