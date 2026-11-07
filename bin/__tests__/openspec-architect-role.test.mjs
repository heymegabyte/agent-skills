#!/usr/bin/env node

import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateOpenSpecChange } from '../openspec-paperclip-sync.ts';

const root = mkdtempSync(join(tmpdir(), 'openspec-role-gate-'));

const createChange = ({
  id,
  proposalArchitect = 'codex',
  proposalRole,
  designArchitect = proposalArchitect,
  designRole = proposalRole,
}) => {
  const directory = join(root, 'openspec', 'changes', id);
  mkdirSync(directory, { recursive: true });
  const roleLine = (role) => (role === undefined ? '' : `> **Architect Role:** ${role}\n`);
  writeFileSync(
    join(directory, 'proposal.md'),
    `# ${id}\n\n> **Architect:** ${proposalArchitect}\n${roleLine(proposalRole)}\n## Why\nTest.\n`,
  );
  writeFileSync(
    join(directory, 'design.md'),
    `# Design\n\n> **Architect:** ${designArchitect}\n${roleLine(designRole)}\n## Decisions\nTest.\n`,
  );
  writeFileSync(join(directory, 'tasks.md'), '# Tasks\n\n- [ ] Test role enforcement.\n');
  return validateOpenSpecChange(root, id, 'agent-skills');
};

try {
  const valid = createChange({ id: 'valid', proposalRole: 'assigned' });
  assert.equal(valid.valid, true, valid.errors.join('; '));
  assert.equal(valid.architectRole, 'assigned');

  const brandOnly = createChange({ id: 'brand-only' });
  assert.equal(brandOnly.valid, false);
  assert.match(brandOnly.errors.join('\n'), /explicit architect-role assignment/i);

  const openCode = createChange({
    id: 'opencode',
    proposalArchitect: 'opencode',
    proposalRole: 'assigned',
  });
  assert.equal(openCode.valid, false);
  assert.match(openCode.errors.join('\n'), /NEVER opencode/i);

  const inconsistent = createChange({
    id: 'inconsistent',
    proposalRole: 'assigned',
    designRole: 'worker',
  });
  assert.equal(inconsistent.valid, false);
  assert.match(inconsistent.errors.join('\n'), /design\.md.*architect role/i);

  const conflictingArchitects = createChange({
    id: 'conflicting-architects',
    proposalRole: 'assigned',
    designArchitect: 'claude',
  });
  assert.equal(conflictingArchitects.valid, false);
  assert.match(conflictingArchitects.errors.join('\n'), /same architect identity/i);

  console.log('✓ OpenSpec authorship requires an explicit architect-role assignment');
} finally {
  rmSync(root, { recursive: true, force: true });
}
