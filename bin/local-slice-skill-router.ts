import { execFile } from 'node:child_process';
import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';

import type { RoutedSliceSkill } from './evidence-gated-orchestrator.ts';

const run = promisify(execFile);

export function createLocalSliceSkillRouter(skillsRoot: string) {
  return async ({ checkout, prompt, topic }: { checkout: string; prompt: string; topic: string }): Promise<RoutedSliceSkill[]> => {
    const root = await realpath(skillsRoot);
    const { stdout } = await run('python3', [
      resolve(root, 'bin/skill-router.py'), 'route', `${topic}\n${prompt}`, '--cwd', checkout, '--offline',
    ], { timeout: 15_000, maxBuffer: 1_000_000, env: { ...process.env, AGENT_SKILLS_ROOT: root } });
    const result = JSON.parse(stdout) as { selected: Array<{ id: string; reason: string }> };
    const matches = result.selected.filter(({ reason }) => reason === 'trigger-match').slice(0, 6);

    return Promise.all(matches.map(async ({ id }) => {
      if (!/^(?:rules\/)?[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(id)) throw new Error(`Invalid routed skill ID: ${id}`);
      const file = await realpath(resolve(root, id.startsWith('rules/') ? `${id}.md` : `${id}/SKILL.md`));
      const withinRoot = relative(root, file);
      if (isAbsolute(withinRoot) || withinRoot === '..' || withinRoot.startsWith(`..${sep}`)) {
        throw new Error(`Routed skill escapes the approved root: ${id}`);
      }
      const guidance = (await readFile(file, 'utf8')).slice(0, 8_000);
      return { id, guidance };
    }));
  };
}
