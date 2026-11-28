import { createHash, randomUUID } from 'node:crypto';
import { linkSync, lstatSync, mkdirSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ReuseProposal } from './evidence-gated-orchestrator.ts';

export function createReuseProposalWriter(roots: Record<ReuseProposal['destination'], string>) {
  const repositories = new Map(Object.entries(roots).map(([destination, directory]) => [destination, realpathSync(directory)]));
  return async (proposal: ReuseProposal): Promise<string> => {
    const root = repositories.get(proposal.destination);
    if (!root) throw new Error('Reuse proposal has no configured destination');
    const title = proposal.title.replace(/\s+/g, ' ').trim();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48).replace(/^-|-$/g, '') || 'proposal';
    const text = [
      `# ${title}`,
      `## Why\n\n${proposal.problem}`,
      `## What Changes\n\n${proposal.scope}`,
      `## Benefit\n\n${proposal.benefit}`,
      `## Priority\n\n${proposal.priority}`,
      `## Dependencies\n\n${proposal.dependencies.map((dependency) => `- ${dependency}`).join('\n') || 'None identified.'}`,
      `## Acceptance\n\n${proposal.acceptance}`,
      `## Evidence\n\n${proposal.evidence.map((path) => `- ${path}`).join('\n')}`,
    ].join('\n\n') + '\n';
    const fingerprint = createHash('sha256').update(text).digest('hex').slice(0, 12);
    const changeId = `reuse-${slug}-${fingerprint}`;
    let directory = root;
    for (const segment of ['openspec', 'changes', changeId]) {
      directory = join(directory, segment);
      try {
        mkdirSync(directory);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      }
      if (!lstatSync(directory).isDirectory()) throw new Error(`Reuse proposal directory is unsafe: ${directory}`);
    }
    const destination = join(directory, 'proposal.md');
    const scratch = join(directory, `.proposal-${randomUUID()}`);
    writeFileSync(scratch, text, { flag: 'wx' });
    try {
      try {
        linkSync(scratch, destination);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        if (!lstatSync(destination).isFile() || readFileSync(destination, 'utf8') !== text) {
          throw new Error(`Reuse proposal already exists with different contents: ${destination}`);
        }
      }
    } finally {
      unlinkSync(scratch);
    }
    return `openspec/changes/${changeId}/proposal.md`;
  };
}
