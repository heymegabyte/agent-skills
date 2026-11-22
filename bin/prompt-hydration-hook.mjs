#!/usr/bin/env node
/**
 * Unified UserPromptSubmit hook adapter:
 * 1. Runs the portable Hyper-Saturated Prompt Hydrator (bin/prompt-hydrator.ts)
 *    including Product & Architecture Gap Audit (Settings, Plugin Catalogs, @theme.tools),
 *    Right-Sized SCRUM Deliberation Quorum, OpenSpec DAG, and Multi-Swarm Plan.
 * 2. Runs the Skill Router (bin/skill-router.py) to attach top-matched skills.
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  process.exit(0);
}

const prompt = typeof input.prompt === 'string'
  ? input.prompt
  : (typeof input.user_prompt === 'string' ? input.user_prompt : '');
const cwd = typeof input.cwd === 'string' ? input.cwd : process.cwd();
if (!prompt.trim()) process.exit(0);

try {
  const shouldCascade = /\b(clone|build|create|make|launch|feature|implement|add|expand|upgrade|saturate)\b/i.test(prompt)
    && !/\b(fix|bug|focused|narrow|prototype)\b/i.test(prompt);
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
    env: { ...process.env, NODE_NO_WARNINGS: '1' },
  });

  let routerSection = '';
  const routerScript = existsSync(join(root, 'bin', 'skill-router.py'))
    ? join(root, 'bin', 'skill-router.py')
    : join(process.env.HOME || '', '.claude', 'bin', 'skill-router.py');
  if (existsSync(routerScript)) {
    try {
      const routerRaw = execFileSync('python3', [routerScript, 'route', prompt, '--cwd', cwd], {
        encoding: 'utf8',
        timeout: 5_000,
        maxBuffer: 1_000_000,
      });
      const parsed = JSON.parse(routerRaw);
      const selected = Array.isArray(parsed.selected) ? parsed.selected.slice(0, 15) : [];
      if (selected.length > 0) {
        routerSection = `\n## Skill router — top matches for this prompt\n(Token use: ${Number(parsed.total_tokens || 0).toLocaleString()} / ${Number(parsed.budget || 0).toLocaleString()} budget)\n\n${selected.map((entry) => `- \`${entry.id}\` — ${entry.reason}`).join('\n')}\n`;
      }
    } catch {
      // Non-fatal if python router is unavailable
    }
  }

  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `${hydratedContext}${routerSection}`,
    },
  })}\n`);
} catch (error) {
  const reason = error instanceof Error ? error.message.slice(0, 240) : 'unknown failure';
  process.stdout.write(`${JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: `Prompt hydration unavailable (${reason}). Fall back to rules/context-hydration.md and rules/parallel-multi-swarm-orchestration.md before material execution.`,
    },
  })}\n`);
}

