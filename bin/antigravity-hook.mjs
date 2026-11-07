#!/usr/bin/env node
/**
 * antigravity-hook.mjs
 *
 * Antigravity lifecycle hook runner enforcing:
 * - Zero-Prompt Mandate (auto-allow safe dev commands, force-ask dangerous ones)
 * - Language Preference Guardrail (TS/Bash first, no Python for system glue)
 * - Autonomous Verification & Multi-Emission Stop Gate (requires 3 consecutive clean stop emissions)
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync, statSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const eventType = process.argv[2] || 'pre-tool';
const REQUIRED_STOP_EMISSIONS = Number(process.env.ANTIGRAVITY_REQUIRED_STOP_EMISSIONS || 3);
const EMISSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Read stdin payload
let input = '';
try {
  input = readFileSync(0, 'utf8').trim();
} catch (e) {
  input = '{}';
}

let payload = {};
try {
  payload = input ? JSON.parse(input) : {};
} catch (e) {
  payload = {};
}

const workspacePath = (payload.workspacePaths && payload.workspacePaths[0]) || process.cwd();
function resolveGitDir(ws) {
  const dotGit = `${ws}/.git`;
  try {
    if (existsSync(dotGit)) {
      const st = statSync(dotGit);
      if (st.isDirectory()) {
        return dotGit;
      }
      const content = readFileSync(dotGit, 'utf8').trim();
      const m = content.match(/^gitdir:\s*(.+)$/m);
      if (m && m[1] && existsSync(m[1].trim())) {
        return m[1].trim();
      }
    }
  } catch (_) {}
  return '/tmp';
}
const gitDir = resolveGitDir(workspacePath);
const emissionStateFile = `${gitDir}/.antigravity_stop_emissions.json`;
const advanceSeedPermitFile = `${gitDir}/.openspec_advance_seed_allow_stop`;
const codeTouchedTrackerFile = `${gitDir}/.openspec_code_touched_since_tasks.json`;
const subagentMessageTokenFile = `${gitDir}/.antigravity_subagent_send_message_token.json`;

function resetEmissionCounter() {
  try {
    if (existsSync(emissionStateFile)) {
      unlinkSync(emissionStateFile);
    }
  } catch (_) {}
}

function recordToolExecution() {
  try {
    let state = { count: 0, toolCallsSinceLastStop: 0, updatedAt: Date.now() };
    if (existsSync(emissionStateFile)) {
      const parsed = JSON.parse(readFileSync(emissionStateFile, 'utf8'));
      if (parsed && typeof parsed === 'object') {
        state = {
          count: typeof parsed.count === 'number' ? parsed.count : 0,
          toolCallsSinceLastStop: (typeof parsed.toolCallsSinceLastStop === 'number' ? parsed.toolCallsSinceLastStop : 0) + 1,
          updatedAt: Date.now()
        };
      }
    } else {
      state.toolCallsSinceLastStop = 1;
    }
    writeFileSync(emissionStateFile, JSON.stringify(state), 'utf8');
  } catch (_) {}
}

function countUncheckedOpenSpecTasks(ws) {
  let unchecked = 0;
  try {
    const changesDir = `${ws}/openspec/changes`;
    if (existsSync(changesDir)) {
      for (const entry of readdirSync(changesDir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          const tasksFile = `${changesDir}/${entry.name}/tasks.md`;
          if (existsSync(tasksFile)) {
            const text = readFileSync(tasksFile, 'utf8');
            const matches = text.match(/^\s*-\s*\[\s\]\s+/gm);
            if (matches) unchecked += matches.length;
          }
        }
      }
    }
  } catch (_) {}
  return unchecked;
}

const REQUIRED_40_LIBRARY_DIRS = [
  'themes', 'ui', 'blog', 'catalog', 'testing',
  'workflows', 'integrations', 'social', 'scheduling', 'signing',
  'forms', 'links', 'keys', 'notifications', 'crm',
  'inbox', 'billing', 'status', 'kb', 'dataplane',
  'telemetry', 'auth', 'flags', 'agent-ui', 'seo-geo',
  'media-video', 'crawl-research', 'i18n-a11y',
  'webhooks', 'tables', 'search-index', 'permissions', 'collab',
  'uploads', 'commerce', 'agent-memory', 'cdp', 'audit',
  'ai-gateway', 'rules-engine',
  'sdk'
];

function countTsFilesRecursive(dir) {
  let count = 0;
  try {
    if (!existsSync(dir)) return 0;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
        count += countTsFilesRecursive(full);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        count++;
      }
    }
  } catch (_) {}
  return count;
}

function isThemeToolsWorkspace(ws) {
  try {
    const pkgJson = `${ws}/package.json`;
    if (existsSync(pkgJson)) {
      const data = JSON.parse(readFileSync(pkgJson, 'utf8'));
      if (data && (data.name === 'theme-tools' || data.name === '@theme.tools/monorepo')) {
        return true;
      }
    }
    if (existsSync(`${ws}/packages/shared-utils`) && existsSync(`${ws}/packages/themes`)) {
      return true;
    }
  } catch (_) {}
  return false;
}

function check40LibraryMultiFileDepthGate(ws) {
  if (!isThemeToolsWorkspace(ws)) return { ok: true };
  const pkgRoot = `${ws}/packages`;
  if (!existsSync(pkgRoot)) return { ok: true };
  const missingDirs = [];
  const shallowPackages = [];
  const missingUpstreamTrees = [];
  let totalTsFiles = 0;

  for (const dirName of REQUIRED_40_LIBRARY_DIRS) {
    const dirPath = `${pkgRoot}/${dirName}`;
    if (!existsSync(dirPath)) {
      missingDirs.push(`packages/${dirName}`);
      continue;
    }
    const tsCount = countTsFilesRecursive(dirPath);
    totalTsFiles += tsCount;
    const minFiles = dirName === 'sdk' ? 18 : 32;
    if (tsCount < minFiles) {
      shallowPackages.push(`packages/${dirName} (${tsCount}/${minFiles} .ts files)`);
    }
    if (dirName !== 'sdk') {
      const upstreamIndex = `${dirPath}/src/upstream/index.ts`;
      const upstreamTest = `${dirPath}/test/upstream-compat.test.ts`;
      const domainAlgos = `${dirPath}/src/upstream/domain-algorithms.ts`;
      const origAdapter = `${dirPath}/src/upstream/original-repo-tests-adapter.ts`;
      const origTest = `${dirPath}/test/original-upstream-repo.test.ts`;
      if (
        !existsSync(upstreamIndex) ||
        !existsSync(upstreamTest) ||
        !existsSync(domainAlgos) ||
        !existsSync(origAdapter) ||
        !existsSync(origTest)
      ) {
        missingUpstreamTrees.push(`packages/${dirName}/src/upstream (missing domain-algorithms, original-repo-tests-adapter, or test)`);
      }
    }
  }

  const explorerPage = `${ws}/apps/web/src/components/LibrariesExplorerPage.tsx`;
  const hasExplorerPage = existsSync(explorerPage);

  return {
    ok:
      missingDirs.length === 0 &&
      shallowPackages.length === 0 &&
      missingUpstreamTrees.length === 0 &&
      hasExplorerPage &&
      totalTsFiles >= 1300,
    missingDirs,
    shallowPackages,
    missingUpstreamTrees,
    totalTsFiles,
    hasExplorerPage,
  };
}

// ── 1. PRE-TOOL-USE ──────────────────────────────────────────────────────────
if (eventType === 'pre-tool') {
  const toolCall = payload.toolCall || {};
  const toolName = String(toolCall.name || '').replace(/^.*:/, '');
  const args = toolCall.args || {};

  // Reset consecutive stop emission counter whenever code is edited or written
  if (toolName === 'edit_file' || toolName === 'write_file') {
    resetEmissionCounter();
    const targetPath = String(args.Path || '');

    // Anti-Shortcut Guard for existing openspec/changes/*/tasks.md files
    if (targetPath.includes('/openspec/changes/') && targetPath.endsWith('/tasks.md') && existsSync(targetPath)) {
      try {
        const beforeText = readFileSync(targetPath, 'utf8');
        let afterText = beforeText;
        if (toolName === 'write_file' && typeof args.Content === 'string') {
          afterText = args.Content;
        } else if (toolName === 'edit_file' && typeof args.Target === 'string' && typeof args.Replacement === 'string') {
          afterText = beforeText.split(args.Target).join(args.Replacement);
        }
        const beforeUnchecked = (beforeText.match(/^\s*-\s*\[\s\]\s+/gm) || []).length;
        const beforeChecked = (beforeText.match(/^\s*-\s*\[[xX]\]\s+/gm) || []).length;
        const afterUnchecked = (afterText.match(/^\s*-\s*\[\s\]\s+/gm) || []).length;
        const afterChecked = (afterText.match(/^\s*-\s*\[[xX]\]\s+/gm) || []).length;

        const newlyCheckedCount = afterChecked - beforeChecked;
        const totalBefore = beforeUnchecked + beforeChecked;
        const totalAfter = afterUnchecked + afterChecked;

        if (totalAfter < totalBefore) {
          console.log(JSON.stringify({
            decision: 'block',
            reason: `OpenSpec Anti-Shortcut Guard: Task count in ${targetPath} decreased from ${totalBefore} to ${totalAfter}. Never delete OpenSpec tasks; implement them and mark them - [x].`
          }));
          process.exit(0);
        }

        if (newlyCheckedCount > 6) {
          console.log(JSON.stringify({
            decision: 'block',
            reason: `OpenSpec Anti-Shortcut Guard: Attempted to check off ${newlyCheckedCount} tasks at once in ${targetPath} (maximum 6 per phase). Implement and test one phase (<= 6 tasks) in packages/* or apps/* before checking off its tasks.`
          }));
          process.exit(0);
        }

        if (newlyCheckedCount > 0) {
          let codeFilesEdited = 0;
          if (existsSync(codeTouchedTrackerFile)) {
            try {
              const tracker = JSON.parse(readFileSync(codeTouchedTrackerFile, 'utf8'));
              codeFilesEdited = typeof tracker.codeFilesEdited === 'number' ? tracker.codeFilesEdited : 0;
            } catch (_) {}
          }
          if (codeFilesEdited < 1) {
            console.log(JSON.stringify({
              decision: 'block',
              reason: `OpenSpec Anti-Shortcut Guard: Cannot check off tasks in ${targetPath} without first editing at least 1 implementation or test file in packages/* or apps/*.`
            }));
            process.exit(0);
          }
          try {
            writeFileSync(codeTouchedTrackerFile, JSON.stringify({ codeFilesEdited: 0, updatedAt: Date.now() }), 'utf8');
          } catch (_) {}
        }
      } catch (_) {}
    } else if (targetPath && !targetPath.includes('/openspec/')) {
      try {
        let prev = 0;
        if (existsSync(codeTouchedTrackerFile)) {
          const tracker = JSON.parse(readFileSync(codeTouchedTrackerFile, 'utf8'));
          prev = typeof tracker.codeFilesEdited === 'number' ? tracker.codeFilesEdited : 0;
        }
        writeFileSync(codeTouchedTrackerFile, JSON.stringify({ codeFilesEdited: prev + 1, updatedAt: Date.now() }), 'utf8');
      } catch (_) {}
    }
  } else {
    recordToolExecution();
  }

  // Subagent Protection Guard: Never kill running background research subagents
  if (toolName === 'manage_subagents' && (args.Action === 'kill_all' || args.Action === 'kill')) {
    console.log(JSON.stringify({
      decision: 'block',
      reason: 'Subagent Protection Guard: Never call manage_subagents kill/kill_all while background subagents are researching. Let all subagents finish their work and report via send_message naturally.'
    }));
    process.exit(0);
  }

  // Record one-shot subagent completion token when a subagent calls send_message to report back
  if (toolName === 'send_message') {
    try {
      let pendingCount = 0;
      if (existsSync(subagentMessageTokenFile)) {
        const parsed = JSON.parse(readFileSync(subagentMessageTokenFile, 'utf8'));
        if (parsed && typeof parsed.count === 'number' && (Date.now() - (parsed.updatedAt || 0)) < 60000) {
          pendingCount = parsed.count;
        }
      }
      writeFileSync(
        subagentMessageTokenFile,
        JSON.stringify({ count: pendingCount + 1, updatedAt: Date.now() }),
        'utf8'
      );
    } catch (_) {}
  }

  // Check destructive command patterns per rules/autonomous-engineering.md
  if (toolName === 'run_command' && args.CommandLine) {
    const cmd = args.CommandLine;

    const dangerousPatterns = [
      /\bdrop\s+(database|table|schema)\b/i,
      /\btruncate\s+(table)?\s*["'`]?\w+["'`]?\s*;/i,
      /\brm\s+-(rf?|fr?)\s+(\/|~|\$HOME)(\s|$)/i,
      /\bgit\s+push\s+.*--force.*(main|master)/i,
      /\bstripe\s+(customers|charges|subscriptions)\s+delete\b/i,
      /\bwrangler\s+d1\s+execute\s+.*--command\s+.*drop\s+table/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(cmd)) {
        console.log(JSON.stringify({
          decision: 'force_ask',
          reason: `High-blast-radius command detected: requires explicit authorization per autonomous-engineering doctrine.`
        }));
        process.exit(0);
      }
    }

    // Auto-allow all safe engineering commands (git, npm, bun, wrangler, pnpm, cargo, etc.)
    console.log(JSON.stringify({
      decision: 'allow'
    }));
    process.exit(0);
  }

  // File operations: auto-allow safe edits within workspace
  if (toolName === 'edit_file' || toolName === 'write_file' || toolName === 'read_file') {
    console.log(JSON.stringify({
      decision: 'allow'
    }));
    process.exit(0);
  }

  // Default passthrough
  console.log(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

// ── 2. STOP (MULTI-EMISSION AUTONOMOUS LOOP GUARD) ───────────────────────────
if (eventType === 'stop') {
  const terminationReason = payload.terminationReason || '';

  // Allow subagents that just delivered their report via send_message to exit cleanly on first stop
  if (existsSync(subagentMessageTokenFile)) {
    try {
      const token = JSON.parse(readFileSync(subagentMessageTokenFile, 'utf8'));
      if (token && typeof token.count === 'number' && token.count > 0 && (Date.now() - (token.updatedAt || 0)) < 45000) {
        const remaining = token.count - 1;
        if (remaining > 0) {
          writeFileSync(subagentMessageTokenFile, JSON.stringify({ count: remaining, updatedAt: token.updatedAt }), 'utf8');
        } else {
          unlinkSync(subagentMessageTokenFile);
        }
        console.log(JSON.stringify({ decision: 'stop' }));
        process.exit(0);
      }
    } catch (_) {}
  }

  // Only inspect normal turn completion (NO_TOOL_CALL)
  if (terminationReason === 'NO_TOOL_CALL') {
    try {
      if (existsSync(`${workspacePath}/.git`)) {
        const status = execSync('git status --porcelain', {
          cwd: workspacePath,
          encoding: 'utf8',
          timeout: 5000,
          stdio: ['pipe', 'pipe', 'ignore']
        }).trim();

        // Check if there are modified or untracked source files (ignoring transient .claude/.worktree-pool)
        const dirtyLines = status
          .split('\n')
          .map(l => l.trim())
          .filter(l => l && !l.includes('.claude/.worktree-pool'));

        if (dirtyLines.length > 0) {
          resetEmissionCounter();
          console.log(JSON.stringify({
            decision: 'continue',
            reason: `Autonomous loop guard: ${dirtyLines.length} modified/untracked file(s) remain uncommitted. Complete the verification loop (test, commit, push) before finishing.`
          }));
          process.exit(0);
        }

        // Enforce 40-Library Multi-File Depth Gate + Unified @theme.tools/sdk + LibrariesExplorerPage.tsx
        const depthGate = check40LibraryMultiFileDepthGate(workspacePath);
        if (!depthGate.ok) {
          resetEmissionCounter();
          const reasons = [];
          if (depthGate.missingDirs.length > 0) {
            reasons.push(`Missing workspace packages (${depthGate.missingDirs.length}): ${depthGate.missingDirs.slice(0, 6).join(', ')}`);
          }
          if (depthGate.shallowPackages.length > 0) {
            reasons.push(`Shallow packages requiring >=32 modular .ts files (${depthGate.shallowPackages.length}): ${depthGate.shallowPackages.slice(0, 6).join(', ')}`);
          }
          if (depthGate.missingUpstreamTrees && depthGate.missingUpstreamTrees.length > 0) {
            reasons.push(`Missing src/upstream/index.ts or test/upstream-compat.test.ts (${depthGate.missingUpstreamTrees.length}): ${depthGate.missingUpstreamTrees.slice(0, 6).join(', ')}`);
          }
          if (!depthGate.hasExplorerPage) {
            reasons.push('Missing apps/web/src/components/LibrariesExplorerPage.tsx (library-side counterpart to ui.theme.tools)');
          }
          console.log(JSON.stringify({
            decision: 'continue',
            reason: `Autonomous 40-Library Multi-File Depth Gate Failed (${depthGate.totalTsFiles}/1300 total .ts files in packages/*): ${reasons.join(' | ')}. Launch parallel claude + codex + gemini + opencode swarms to absorb all upstream git-repo files into packages/*/src/upstream/* and do not stop until all 1300+ .ts files and upstream test suites pass.`
          }));
          process.exit(0);
        }

        // Enforce Automatic End-of-Round Goal & 4-Engine Parallel Swarm Ledger (.agents/round-goal-ledger.json)
        if (existsSync(`${workspacePath}/packages/sdk/src/library-catalog-110.ts`)) {
          const roundLedgerFile = `${workspacePath}/.agents/round-goal-ledger.json`;
          let ledgerValid = false;
          if (existsSync(roundLedgerFile)) {
            try {
              const ledger = JSON.parse(readFileSync(roundLedgerFile, 'utf8'));
              ledgerValid =
                ledger &&
                ledger.verificationSummary &&
                ledger.verificationSummary.allShardsPassed === true &&
                ledger.verificationSummary.originalUpstreamRepoTestSuites === 40 &&
                ledger.swarmAllocation &&
                ledger.swarmAllocation.totalParallelWorkers >= 76;
            } catch (_) {
              ledgerValid = false;
            }
          }
          if (!ledgerValid) {
            resetEmissionCounter();
            console.log(JSON.stringify({
              decision: 'continue',
              reason: `Autonomous End-of-Round Goal Guard: Run 'pnpm goal:auto-round' (76-worker 4-engine parallel swarm: 12 claude + 16 codex + 8 gemini + 40 opencode) to verify all 40 libraries' original upstream repo test suites and update .agents/round-goal-ledger.json before finishing the round.`
            }));
            process.exit(0);
          }

          const masterworkLedgerFile = `${workspacePath}/.agents/next-50-masterwork-ledger.json`;
          let masterworkValid = false;
          if (existsSync(masterworkLedgerFile)) {
            try {
              const mw = JSON.parse(readFileSync(masterworkLedgerFile, 'utf8'));
              masterworkValid =
                mw &&
                mw.completedMasterworkTasks === 50 &&
                mw.remainingMasterworkTasks === 0 &&
                mw.librariesWithDomainAlgorithms === 40;
            } catch (_) {
              masterworkValid = false;
            }
          }
          if (!masterworkValid) {
            resetEmissionCounter();
            console.log(JSON.stringify({
              decision: 'continue',
              reason: `Autonomous Next-50 Masterwork Guard: Execute 'node --experimental-strip-types scripts/execute-next-50-masterwork.ts' to verify all 50 Fine-Arts & Deep Domain Masterwork tasks (M01-M50) and .agents/next-50-masterwork-ledger.json.`
            }));
            process.exit(0);
          }
        }

        // Check if any OpenSpec change package still has unchecked `- [ ]` tasks
        const uncheckedTasks = countUncheckedOpenSpecTasks(workspacePath);
        const allowAdvanceSeedStop = existsSync(advanceSeedPermitFile);
        if (uncheckedTasks > 0 && !allowAdvanceSeedStop) {
          resetEmissionCounter();
          console.log(JSON.stringify({
            decision: 'continue',
            reason: `Autonomous OpenSpec Backlog Guard: ${uncheckedTasks} unchecked task(s) (- [ ]) remain in openspec/changes/*/tasks.md. Implement and test the next phase (<= 6 tasks) in packages/* or apps/*, check off only those completed tasks, commit, and continue until 0 unchecked tasks remain.`
          }));
          process.exit(0);
        }

        // Clean working tree -> check Multi-Emission Stop Counter (requires N emissions with real verification tool calls in between)
        let currentCount = 0;
        let toolCallsSinceLastStop = 1;
        if (existsSync(emissionStateFile)) {
          try {
            const raw = JSON.parse(readFileSync(emissionStateFile, 'utf8'));
            if (raw && typeof raw.count === 'number' && (Date.now() - (raw.updatedAt || 0)) < EMISSION_TTL_MS) {
              currentCount = raw.count;
              toolCallsSinceLastStop = typeof raw.toolCallsSinceLastStop === 'number' ? raw.toolCallsSinceLastStop : 0;
            }
          } catch (_) {
            currentCount = 0;
          }
        }

        if (currentCount > 0 && toolCallsSinceLastStop < 1) {
          console.log(JSON.stringify({
            decision: 'continue',
            reason: `Autonomous Multi-Emission Stop Gate (Emission ${currentCount}/${REQUIRED_STOP_EMISSIONS} held): Empty consecutive text turns do not advance the stop counter. Execute a real verification command (e.g., unit/conformance/golden-path tests or live endpoint check) before emitting the next stop.`
          }));
          process.exit(0);
        }

        const nextCount = currentCount + 1;
        if (nextCount < REQUIRED_STOP_EMISSIONS) {
          try {
            writeFileSync(
              emissionStateFile,
              JSON.stringify({ count: nextCount, toolCallsSinceLastStop: 0, updatedAt: Date.now() }),
              'utf8'
            );
          } catch (_) {}

          console.log(JSON.stringify({
            decision: 'continue',
            reason: `Autonomous Multi-Emission Stop Gate (Emission ${nextCount}/${REQUIRED_STOP_EMISSIONS}): Single-emission stop is disabled. Execute at least one verification tool call (parallel Golden Paths, 28 package conformance suites, or live edge check) before emitting stop ${nextCount + 1}/${REQUIRED_STOP_EMISSIONS}.`
          }));
          process.exit(0);
        }

        // Reached REQUIRED_STOP_EMISSIONS -> clean up state file (and consume one-time advance-seed permit if present) and allow stop
        resetEmissionCounter();
        try {
          if (existsSync(advanceSeedPermitFile)) {
            unlinkSync(advanceSeedPermitFile);
          }
        } catch (_) {}
      }
    } catch (err) {
      // Fail-soft: never crash the agent loop
    }
  }

  // Allow stop
  console.log(JSON.stringify({ decision: 'stop' }));
  process.exit(0);
}

// ── 3. PRE-INVOCATION ────────────────────────────────────────────────────────
if (eventType === 'pre-invocation') {
  console.log(JSON.stringify({}));
  process.exit(0);
}

// Fallback
console.log(JSON.stringify({}));
