#!/usr/bin/env node
/**
 * worktree-sandbox.ts
 * Ephemeral Git Worktree Isolation Manager.
 * Provisions isolated worktrees for subagents to enforce strictly disjoint battle spaces,
 * preventing branch contamination and file lock contention.
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const WORKTREE_BASE = resolve(homedir(), '.agentskills-worktrees');
mkdirSync(WORKTREE_BASE, { recursive: true });

export interface WorktreeInfo {
  id: string;
  agent: string;
  branch: string;
  path: string;
}

export function createAgentWorktree(repoPath: string, agentName: string, missionId: string): WorktreeInfo {
  const branch = `agent/${agentName}/${missionId}`;
  const worktreePath = resolve(WORKTREE_BASE, `${agentName}-${missionId}`);

  try {
    // If worktree already exists, return info
    if (existsSync(worktreePath)) {
      return { id: missionId, agent: agentName, branch, path: worktreePath };
    }

    // Create branch from HEAD and checkout into worktree
    execSync(`git worktree add -b "${branch}" "${worktreePath}" HEAD`, {
      cwd: repoPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return { id: missionId, agent: agentName, branch, path: worktreePath };
  } catch (err) {
    throw new Error(`Failed to create worktree for ${agentName}: ${(err as Error).message}`);
  }
}

export function removeAgentWorktree(repoPath: string, worktreePath: string, branchName?: string): boolean {
  try {
    execSync(`git worktree remove --force "${worktreePath}"`, {
      cwd: repoPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (branchName) {
      execSync(`git branch -D "${branchName}"`, {
        cwd: repoPath,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    }
    return true;
  } catch (err) {
    console.error(`Failed to remove worktree ${worktreePath}:`, err);
    return false;
  }
}

export function listWorktrees(repoPath: string): string[] {
  try {
    const out = execSync('git worktree list', { cwd: repoPath, encoding: 'utf8' });
    return out.trim().split('\n');
  } catch {
    return [];
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- Worktree Sandbox Manager Test ---');
  const repo = resolve(homedir(), '.agentskills');
  const existing = listWorktrees(repo);
  console.log(`Active Worktrees in repository (${existing.length}):`);
  existing.forEach(w => console.log(`  ${w}`));
}
