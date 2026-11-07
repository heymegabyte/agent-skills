#!/usr/bin/env node
/**
 * lint-commits.ts
 * Conventional Commits Linter.
 * Enforces standard semantic version commit messages across agent branches
 * (feat, fix, docs, refactor, test, chore, perf).
 */

export const CONVENTIONAL_TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];

export function validateCommitMessage(message: string): { valid: boolean; type?: string; scope?: string; description?: string; error?: string } {
  const firstLine = message.trim().split('\n')[0];
  const regex = /^([a-z]+)(?:\(([a-z0-9-_]+)\))?(!)?:\s+(.+)$/;
  const match = firstLine.match(regex);

  if (!match) {
    return {
      valid: false,
      error: `Invalid commit format: "${firstLine}". Expected "<type>(<scope>): <description>"`
    };
  }

  const type = match[1];
  const scope = match[2];
  const description = match[4];

  if (!CONVENTIONAL_TYPES.includes(type)) {
    return {
      valid: false,
      error: `Unknown commit type: "${type}". Expected one of: ${CONVENTIONAL_TYPES.join(', ')}`
    };
  }

  return {
    valid: true,
    type,
    scope,
    description
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- Conventional Commit Linter Test ---');
  console.log('Valid:', validateCommitMessage('feat(fleet): implement RigorBench trajectory discipline'));
  console.log('Invalid:', validateCommitMessage('fixed the bug in api'));
}
