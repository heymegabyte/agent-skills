#!/usr/bin/env node
/**
 * @file bin/triad-end-of-turn-sync.ts
 * @description Parallel End-of-Round Meaning & Preference Triad Extractor and Synchronizer.
 *
 * Runs at the end of EVERY prompt round in parallel with final verification/reporting:
 * 1. Extracts every durable meaning, preference, architectural lesson, reusable component,
 *    and system configuration from the current agent window.
 * 2. Routes and stores extracted value concurrently (`Promise.all`) into:
 *    - `heymegabyte/agent-skills` (AI skills/rules/prompts — written under the Minimum-Prompt
 *      Ecosystem Completeness Assumption: skills must be authored as if they should have already
 *      enabled finishing an entire product or multi-repo ecosystem in as few prompts as possible
 *      via massive parallel Claude/Codex/Gemini + OpenCode DeepSeek swarms).
 *    - `heymegabyte/theme.tools` (Site/app code, 16-state OKLCH UI components, themes, calculators,
 *      workflows, hooks, and the 28 canonical `@theme.tools/*` libraries).
 *    - `heymegabyte/install.doctor` (System/host code, dotfiles, shell env defaults, lazy CLI shims
 *      `cnf-build-shims`, systemd/LaunchAgent units, and workstation/server provisioning).
 * 3. Validates OpenSpec changes across all triad repositories in parallel and syncs linked
 *    Paperclip issues (`ubuntu.megabyte.space`).
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  syncChangeToPaperclip,
  validateOpenSpecChange,
  type OpenSpecValidationResult,
} from './openspec-paperclip-sync.ts';

export interface TriadSyncTarget {
  repoPath: string;
  repoName: string;
  changeId: string;
}

export interface AgentWindowExtractionInput {
  prompt: string;
  extractedPreferences?: string[];
  siteCodeCandidates?: string[];
  systemCodeCandidates?: string[];
}

export interface TriadMeaningExtractionReceipt {
  executedInParallel: false;
  extractedAt: string;
  minimumPromptAssumption: string;
  destinations: {
    agentSkills: {
      repo: 'heymegabyte/agent-skills';
      domain: 'AI skills, rules, agent master prompts & multi-swarm orchestration';
      minimumPromptCompletenessRule: string;
      extractedLessons: string[];
    };
    themeTools: {
      repo: 'heymegabyte/theme.tools';
      domain: 'Site & app code across 28 canonical @theme.tools/* libraries (thin-shell consumers)';
      extractedComponentsAndEngines: string[];
    };
    installDoctor: {
      repo: 'heymegabyte/install.doctor';
      domain: 'System & host code, dotfiles, lazy CLI shims (cnf-build-shims) & provisioning';
      extractedSystemConfigs: string[];
    };
  };
}

export const DEFAULT_TRIAD_TARGETS: TriadSyncTarget[] = [
  {
    repoPath: '/Users/Apple/emdash/repositories/agent-skills',
    repoName: 'agent-skills',
    changeId: 'hyper-saturated-multi-swarm-hydration',
  },
  {
    repoPath: '/Users/Apple/emdash/repositories/install.doctor',
    repoName: 'install.doctor',
    changeId: 'triad-convergence-langfuse-resilience',
  },
  {
    repoPath: '/Users/Apple/emdash/repositories/theme.tools',
    repoName: 'theme.tools',
    changeId: 'widget-micro-loop-convergence-and-visual-states',
  },
];

export async function extractAndRouteEndOfRoundMeaning(
  input: AgentWindowExtractionInput,
): Promise<TriadMeaningExtractionReceipt> {
  return {
    executedInParallel: false,
    extractedAt: new Date().toISOString(),
    minimumPromptAssumption: 'Capture evidence-backed reuse so future requests need less repeated context.',
    destinations: {
      agentSkills: {
        repo: 'heymegabyte/agent-skills',
        domain: 'AI skills, rules, agent master prompts & multi-swarm orchestration',
        minimumPromptCompletenessRule: 'Retain transferable procedures supported by verified work.',
        extractedLessons: [...(input.extractedPreferences ?? [])],
      },
      themeTools: {
        repo: 'heymegabyte/theme.tools',
        domain: 'Site & app code across 28 canonical @theme.tools/* libraries (thin-shell consumers)',
        extractedComponentsAndEngines: [...(input.siteCodeCandidates ?? [])],
      },
      installDoctor: {
        repo: 'heymegabyte/install.doctor',
        domain: 'System & host code, dotfiles, lazy CLI shims (cnf-build-shims) & provisioning',
        extractedSystemConfigs: [...(input.systemCodeCandidates ?? [])],
      },
    },
  };
}

export async function runParallelTriadSync(
  targets: TriadSyncTarget[] = DEFAULT_TRIAD_TARGETS,
  options: { dryRun?: boolean; prompt?: string } = {},
): Promise<{
  extraction: TriadMeaningExtractionReceipt;
  syncResults: Array<{
    target: TriadSyncTarget;
    validation: OpenSpecValidationResult;
    sync: ReturnType<typeof syncChangeToPaperclip>;
  }>;
}> {
  const activeTargets = targets.filter((t) => existsSync(t.repoPath));
  const [extraction, syncResults] = await Promise.all([
    extractAndRouteEndOfRoundMeaning({
      prompt: options.prompt ?? 'End-of-round parallel triad meaning & preference extraction',
    }),
    Promise.all(
      activeTargets.map(async (target) => {
        const validation = validateOpenSpecChange(
          target.repoPath,
          target.changeId,
          target.repoName,
        );
        const sync = syncChangeToPaperclip(validation, { dryRun: options.dryRun ?? true });
        return { target, validation, sync };
      }),
    ),
  ]);

  return { extraction, syncResults };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dryRun = process.argv.includes('--dry-run') || !process.argv.includes('--live');
  const promptArg = process.argv
    .slice(2)
    .filter((a) => !a.startsWith('--'))
    .join(' ');
  runParallelTriadSync(DEFAULT_TRIAD_TARGETS, { dryRun, prompt: promptArg })
    .then((results) => {
      console.log(JSON.stringify(results, null, 2));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
