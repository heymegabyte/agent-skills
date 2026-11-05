#!/usr/bin/env node
/**
 * agent-preflight.ts
 * Automated Pre-Flight Checklist CLI for Autonomous Agent Missions.
 * Verifies runtime environment, tool availability, git state, and sector boundaries
 * before executing tactical operations.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

export interface PreflightReport {
  agent: string;
  passed: boolean;
  checks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
}

export function runAgentPreflight(agentName: string, workspaceDir: string = process.cwd()): PreflightReport {
  const checks: PreflightReport['checks'] = [];
  const agentFile = resolve(homedir(), '.agentskills', 'agents', `${agentName}.md`);

  // 1. Check Profile Existence
  const profileExists = existsSync(agentFile);
  checks.push({
    name: 'Canonical Agent Profile',
    passed: profileExists,
    details: profileExists ? `Found ${agentFile}` : `Missing profile ${agentFile}`
  });

  // 2. Check Node Runtime Version (>= 22 required, 24+ preferred)
  const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
  const nodeValid = nodeMajor >= 22;
  checks.push({
    name: 'Node.js LTS / Modern Runtime',
    passed: nodeValid,
    details: `Running Node.js v${process.version} (requires >= 22.0.0)`
  });

  // 3. Check Git Repository State
  let gitPassed = true;
  let gitDetails = '';
  try {
    const isGit = execSync('git rev-parse --is-inside-work-tree 2>/dev/null', { cwd: workspaceDir, encoding: 'utf8' }).trim() === 'true';
    if (isGit) {
      const status = execSync('git status --porcelain', { cwd: workspaceDir, encoding: 'utf8' }).trim();
      gitDetails = status.length === 0 ? 'Working tree clean' : `Working tree contains ${status.split('\n').length} uncommitted changes (worktree recommended)`;
    } else {
      gitDetails = 'Non-git workspace directory (standalone mode)';
    }
  } catch {
    gitDetails = 'Non-git workspace directory (standalone mode)';
  }
  checks.push({
    name: 'Git Workspace Health',
    passed: gitPassed,
    details: gitDetails
  });

  // 4. Verify ROE & Boundaries if profile exists
  if (profileExists) {
    const content = readFileSync(agentFile, 'utf8');
    const hasRoe = content.includes('Rules of Engagement');
    const hasPace = content.includes('PACE Communications Plan');
    const hasDod = content.includes('Definition of Done');

    checks.push({
      name: 'Auftragstaktik Doctrine Compliance',
      passed: hasRoe && hasPace && hasDod,
      details: hasRoe && hasPace && hasDod ? 'ROE, PACE, and DoD present' : 'Missing doctrinal sections in profile'
    });
  }

  const allPassed = checks.every(c => c.passed);
  return {
    agent: agentName,
    passed: allPassed,
    checks
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const targetAgent = process.argv[2] || 'fullstack-engineer';
  console.log(`Running Pre-Flight Inspection for Agent: [${targetAgent}]...`);
  const report = runAgentPreflight(targetAgent);

  console.log(`\nPRE-FLIGHT VERDICT: [${report.passed ? 'CLEARED FOR COMBAT' : 'PRE-FLIGHT FAILED'}]`);
  for (const c of report.checks) {
    const symbol = c.passed ? '✓' : '✗';
    console.log(`  ${symbol} ${c.name.padEnd(35)}: ${c.details}`);
  }
}
