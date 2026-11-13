#!/usr/bin/env node
/**
 * @file bin/openspec-paperclip-sync.ts
 * @description Validates OpenSpec changes across the canonical triad (`agent-skills`, `install.doctor`,
 * `theme.tools`) and any other repository, enforces the Frontier Architect rule (`claude`, `codex`,
 * or `antigravity` ONLY — never `opencode`), and creates or updates the linked Paperclip issue with
 * direct GitHub deep links to the OpenSpec files.
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface OpenSpecValidationResult {
  repoName: string;
  repoPath: string;
  changeId: string;
  changeDir: string;
  valid: boolean;
  architect: string;
  errors: string[];
  title: string;
  completedTasks: number;
  totalTasks: number;
  deepLinks: {
    folderUrl: string;
    proposalUrl: string;
    designUrl: string;
    tasksUrl: string;
  };
}

export interface PaperclipProjectMapping {
  projectId: string;
  githubRepo: string;
  defaultBranch: string;
  defaultAssigneeAgentId?: string;
  goalId?: string;
}

export const PAPERCLIP_COMPANY_ID = '72408921-0094-4ffb-b4f4-f24db9026191';

export const PAPERCLIP_SPECIALIST_AGENTS = {
  ceo: '48b44790-8e8a-44ca-8989-e871d41b51e5',
  architect: 'a6e94825-1999-4b5f-ad32-a94d5354db0d',
  releaseManager: 'ef69998f-9aae-4118-a28e-dae33194ba31',
  fullStackEngineer: 'f31cfcda-a979-436e-8652-ce159f2ce50f',
  devSecOps: '9d8e9630-d9a2-4b05-97cf-c85a3b6b81ad',
  finOps: '9e11de6b-c27d-4159-86dd-487be0c51e1c',
  appSec: '59f8d581-168e-4013-92a2-53f6288d3bcd',
  qaVerification: 'f299bd09-55b8-46b2-bcf0-0cd832a20591',
  swarmDispatcher: '60c08948-5f59-4ffe-bde3-19dc26074404',
} as const;

export const CANONICAL_PROJECT_MAP: Record<string, PaperclipProjectMapping> = {
  'agent-skills': {
    projectId: '78ac0baa-b2fd-4f0d-9e25-845192da5d50',
    githubRepo: 'heymegabyte/agent-skills',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.architect,
  },
  'install.doctor': {
    projectId: 'd97b0204-ca63-4117-b469-2fe0f2470d18',
    githubRepo: 'heymegabyte/install.doctor',
    defaultBranch: 'master',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'theme.tools': {
    projectId: '298e1246-6c20-4c47-be16-19a1722d4fd2',
    githubRepo: 'heymegabyte/theme.tools',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.architect,
  },
  'swarml.ink': {
    projectId: 'd41a3978-110c-4526-bbe4-8660d7c539f7',
    githubRepo: 'heymegabyte/swarml.ink',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.ceo,
  },
  'ubuntu.megabyte.space': {
    projectId: '029cff3f-2ceb-4795-b55d-5bd8d0b6cf29',
    githubRepo: 'heymegabyte/ubuntu.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'proxmox.megabyte.space': {
    projectId: '74cd0675-8f2b-4498-a180-2db650e3f92f',
    githubRepo: 'heymegabyte/proxmox.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'grafana.megabyte.space': {
    projectId: '4f71e260-2d37-4ab2-8455-831b129ee4d1',
    githubRepo: 'heymegabyte/grafana.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'omen.megabyte.space': {
    projectId: '8684ed28-427b-46e2-a93a-dda84d1df397',
    githubRepo: 'heymegabyte/omen.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'zen.megabyte.space': {
    projectId: '3059aed5-f730-422e-917e-ce21e2868f08',
    githubRepo: 'heymegabyte/zen.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'legion.megabyte.space': {
    projectId: 'd87802d3-48b3-442a-998c-720951c119db',
    githubRepo: 'heymegabyte/legion.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'coolify.megabyte.space': {
    projectId: '748ffb9c-d8fb-4143-afe7-80c5a1e2e716',
    githubRepo: 'heymegabyte/coolify.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'megabyte.space': {
    projectId: '42db4e14-103e-458a-bc67-0fdb100bf2bb',
    githubRepo: 'heymegabyte/megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'projectsites.dev': {
    projectId: 'a4fef1e2-928e-4fb7-8386-a0700f017e29',
    githubRepo: 'heymegabyte/projectsites.dev',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'template.projectsites.dev': {
    projectId: '2bbb463d-f267-4850-aaf3-f740f4549d5d',
    githubRepo: 'heymegabyte/template.projectsites.dev',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'gitl.ink': {
    projectId: 'f3bed131-4368-4fe2-a2f5-2ba23c9f7d78',
    githubRepo: 'heymegabyte/gitl.ink',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'deskl.ink': {
    projectId: '9c02cb98-c85c-4422-9971-4d8365154ea7',
    githubRepo: 'heymegabyte/deskl.ink',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'bricklabor.com': {
    projectId: '84de4701-e828-4a14-a600-9e711e175f12',
    githubRepo: 'heymegabyte/bricklabor.com',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
};

export function resolveSpecialistAssigneeAgentId(result: OpenSpecValidationResult): string {
  const haystack = `${result.changeId} ${result.title}`.toLowerCase();
  if (/(publish|registry|nexus|release|changeset|semver)/.test(haystack)) {
    return PAPERCLIP_SPECIALIST_AGENTS.releaseManager;
  }
  if (/(finops|quota|billing|wallet|spend|cost|runway)/.test(haystack)) {
    return PAPERCLIP_SPECIALIST_AGENTS.finOps;
  }
  if (/(security|cve|secret|trivy|semgrep|authz)/.test(haystack)) {
    return PAPERCLIP_SPECIALIST_AGENTS.appSec;
  }
  if (/(proxmox|coolify|systemd|workstation|ubuntu|omen|zen|legion|grafana)/.test(haystack)) {
    return PAPERCLIP_SPECIALIST_AGENTS.devSecOps;
  }
  if (/(widget|oklch|16-state|micro-loop|storybook|spartan|shadcn|ui)/.test(haystack)) {
    return PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer;
  }
  return (
    CANONICAL_PROJECT_MAP[result.repoName]?.defaultAssigneeAgentId ??
    PAPERCLIP_SPECIALIST_AGENTS.architect
  );
}

const ALLOWED_FRONTIER_ARCHITECTS = new Set([
  'claude',
  'claude-code',
  'codex',
  'antigravity',
  'gemini',
]);

const FORBIDDEN_ARCHITECTS = new Set(['opencode', 'deepseek', 'deepseek-chat', 'deepseek-v4']);

/**
 * Validates a single `openspec/changes/<change-id>` directory and enforces the
 * Frontier Architect rule (never `opencode`).
 */
export function validateOpenSpecChange(
  repoPath: string,
  changeId: string,
  repoNameOverride?: string,
): OpenSpecValidationResult {
  const repoName = repoNameOverride ?? path.basename(path.resolve(repoPath));
  const mapping = CANONICAL_PROJECT_MAP[repoName] ?? {
    projectId: '',
    githubRepo: `heymegabyte/${repoName}`,
    defaultBranch: 'main',
  };
  const changeDir = path.join(repoPath, 'openspec', 'changes', changeId);
  const errors: string[] = [];

  const proposalPath = path.join(changeDir, 'proposal.md');
  const designPath = path.join(changeDir, 'design.md');
  const tasksPath = path.join(changeDir, 'tasks.md');

  for (const [label, filePath] of [
    ['proposal.md', proposalPath],
    ['design.md', designPath],
    ['tasks.md', tasksPath],
  ] as const) {
    if (!fs.existsSync(filePath)) {
      errors.push(`Missing required OpenSpec artifact: ${label}`);
    }
  }

  let title = `${repoName}: ${changeId}`;
  let architect = 'claude';
  let completedTasks = 0;
  let totalTasks = 0;

  if (fs.existsSync(proposalPath)) {
    const proposalText = fs.readFileSync(proposalPath, 'utf8');
    const headingMatch = proposalText.match(/^#\s+(.+)$/m);
    if (headingMatch?.[1]) {
      title = headingMatch[1].trim();
    }
    const archMatch = proposalText.match(/\*\*Architect:\*\*\s*([^\n\r]+)/i);
    if (archMatch?.[1]) {
      architect = archMatch[1].trim().toLowerCase();
    }
  }

  if (fs.existsSync(designPath)) {
    const designText = fs.readFileSync(designPath, 'utf8');
    const archMatch = designText.match(/\*\*Architect:\*\*\s*([^\n\r]+)/i);
    if (archMatch?.[1]) {
      architect = archMatch[1].trim().toLowerCase();
    }
  }

  // Enforce Frontier Architect Gate: NEVER allow opencode to author OpenSpec details
  const normalizedArchitectTokens = architect
    .split(/[\s,/|]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (normalizedArchitectTokens.some((token) => FORBIDDEN_ARCHITECTS.has(token))) {
    errors.push(
      `Forbidden OpenSpec Architect "${architect}": OpenSpec details MUST be authored by claude (with full hydrated context), codex, or antigravity — NEVER opencode.`,
    );
  } else if (
    normalizedArchitectTokens.length > 0 &&
    !normalizedArchitectTokens.some((token) => ALLOWED_FRONTIER_ARCHITECTS.has(token))
  ) {
    errors.push(
      `Unrecognized OpenSpec Architect "${architect}": must be one of claude, codex, or antigravity.`,
    );
  }

  if (fs.existsSync(tasksPath)) {
    const tasksText = fs.readFileSync(tasksPath, 'utf8');
    const checked = tasksText.match(/^\s*-\s*\[[xX]\]\s+/gm) ?? [];
    const unchecked = tasksText.match(/^\s*-\s*\[\s\]\s+/gm) ?? [];
    completedTasks = checked.length;
    totalTasks = checked.length + unchecked.length;
    if (totalTasks === 0) {
      errors.push('tasks.md must contain at least one actionable task checkbox (- [ ] or - [x])');
    }
  }

  const baseBlobUrl = `https://github.com/${mapping.githubRepo}/blob/${mapping.defaultBranch}/openspec/changes/${changeId}`;
  const baseTreeUrl = `https://github.com/${mapping.githubRepo}/tree/${mapping.defaultBranch}/openspec/changes/${changeId}`;

  return {
    repoName,
    repoPath,
    changeId,
    changeDir,
    valid: errors.length === 0,
    architect,
    errors,
    title,
    completedTasks,
    totalTasks,
    deepLinks: {
      folderUrl: baseTreeUrl,
      proposalUrl: `${baseBlobUrl}/proposal.md`,
      designUrl: `${baseBlobUrl}/design.md`,
      tasksUrl: `${baseBlobUrl}/tasks.md`,
    },
  };
}

/**
 * Formats the Paperclip issue title and markdown body with OpenSpec deep links.
 */
export function buildPaperclipIssuePayload(result: OpenSpecValidationResult): {
  marker: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  assigneeAgentId: string;
} {
  const marker = `[openspec:${result.repoName}:${result.changeId}]`;
  const cleanHeading = result.title.replace(/^Proposal:\s*/i, '').trim();
  const title = `${marker} ${cleanHeading}`;
  const status: 'todo' | 'done' =
    result.totalTasks > 0 && result.completedTasks === result.totalTasks
      ? 'done'
      : 'todo';
  const assigneeAgentId = resolveSpecialistAssigneeAgentId(result);

  const description = [
    `## OpenSpec Convergence Task — \`${result.repoName}\``,
    '',
    `- **Change ID:** \`${result.changeId}\``,
    `- **Frontier Architect:** \`${result.architect}\` (verified non-OpenCode spec authorship)`,
    `- **Assigned Specialist Agent:** \`${assigneeAgentId}\``,
    `- **Task Progress:** **${result.completedTasks} / ${result.totalTasks}** tasks completed`,
    `- **OpenSpec Directory:** [${result.repoName}/openspec/changes/${result.changeId}](${result.deepLinks.folderUrl})`,
    `- **Proposal:** [proposal.md](${result.deepLinks.proposalUrl})`,
    `- **Architecture Design:** [design.md](${result.deepLinks.designUrl})`,
    `- **Implementation Tasks:** [tasks.md](${result.deepLinks.tasksUrl})`,
    '',
    '### Convergence & Trunk-Based Production Deployment Contract',
    '1. Every UI widget and sub-feature must converge through the Micro Loop (`CREATE → RENDER → EXPERIENCE → CRITIQUE → MODIFY → COMPARE`) across all 16 visual states and `0.333s` OKLCH transitions.',
    '2. Langfuse observability must remain enabled with graceful timeout fallback (`LANGFUSE_TIMEOUT_MS=2500`).',
    '3. Reconcile reusable patterns in parallel across `agent-skills`, `install.doctor`, and `theme.tools`.',
    '4. **Autonomous Trunk-Based Execution (`main`) & Production Rollout:** Always work toward `main` (`shared_workspace`), create AND **merge** the PR into `main` (`gh pr create` + `gh pr merge --merge --delete-branch`), deploy to production (Cloudflare Workers / Nexus registry / Coolify / systemd + CDN cache purge), respond on-thread to all messages, and post empirical verification on this Paperclip issue.',
  ].join('\n');

  return { marker, title, description, status, assigneeAgentId };
}

export interface ExistingPaperclipIssueItem {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly status?: string;
  readonly createdAt?: string;
}

/**
 * Deterministically deduplicates existing Paperclip issues matching `marker` (`[openspec:<repo>:<changeId>]`),
 * selecting the earliest canonical issue and preserving any human-authored notes appended below
 * `<!-- HUMAN_NOTES_START -->`.
 */
export function deduplicatePaperclipIssuesByMarker(
  items: readonly ExistingPaperclipIssueItem[],
  marker: string,
  generatedDescription: string,
): {
  readonly canonicalIssue: ExistingPaperclipIssueItem | null;
  readonly duplicateIssueIds: readonly string[];
  readonly mergedDescription: string;
} {
  const matches = items.filter(
    (item) => typeof item.title === 'string' && item.title.includes(marker) && typeof item.id === 'string',
  );
  if (matches.length === 0) {
    return {
      canonicalIssue: null,
      duplicateIssueIds: [],
      mergedDescription: generatedDescription,
    };
  }
  const sorted = [...matches].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    if (aTime !== bTime) return aTime - bTime;
    return a.id.localeCompare(b.id);
  });
  const canonical = sorted[0]!;
  const duplicateIssueIds = sorted.slice(1).map((d) => d.id);

  let mergedDescription = generatedDescription;
  if (typeof canonical.description === 'string') {
    const humanMarker = '<!-- HUMAN_NOTES_START -->';
    const idx = canonical.description.indexOf(humanMarker);
    if (idx !== -1) {
      const preservedHumanNotes = canonical.description.slice(idx).trim();
      mergedDescription = `${generatedDescription}\n\n${preservedHumanNotes}`;
    }
  }

  return {
    canonicalIssue: canonical,
    duplicateIssueIds,
    mergedDescription,
  };
}
export function syncChangeToPaperclip(
  result: OpenSpecValidationResult,
  options: { dryRun?: boolean; paperclipHost?: string } = {},
): { synced: boolean; issueId?: string; action: 'created' | 'updated' | 'dry-run' | 'failed'; output?: string } {
  if (!result.valid) {
    return {
      synced: false,
      action: 'failed',
      output: `Validation failed: ${result.errors.join('; ')}`,
    };
  }

  const mapping = CANONICAL_PROJECT_MAP[result.repoName];
  if (!mapping?.projectId) {
    return {
      synced: false,
      action: 'failed',
      output: `No Paperclip project mapping found for repository "${result.repoName}"`,
    };
  }

  const payload = buildPaperclipIssuePayload(result);
  if (options.dryRun) {
    return {
      synced: true,
      action: 'dry-run',
      output: JSON.stringify({ projectId: mapping.projectId, ...payload }, null, 2),
    };
  }

  const host = options.paperclipHost ?? process.env.PAPERCLIP_SSH_HOST ?? 'ubuntu.megabyte.space';
  const titleB64 = Buffer.from(payload.title, 'utf8').toString('base64');
  const descB64 = Buffer.from(payload.description, 'utf8').toString('base64');
  const markerB64 = Buffer.from(payload.marker, 'utf8').toString('base64');

  const remoteScript = `
export PATH="$HOME/.local/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:/usr/local/bin:$PATH"
(
  flock -x -w 20 200 || exit 1
  TITLE=$(printf '%s' '${titleB64}' | base64 -d)
  DESC=$(printf '%s' '${descB64}' | base64 -d)
  MARKER=$(printf '%s' '${markerB64}' | base64 -d)
  EXISTING_ID=$(paperclipai issue list --company-id '${PAPERCLIP_COMPANY_ID}' --project-id '${mapping.projectId}' --json 2>/dev/null | node -e '
    const fs = require("fs");
    const marker = process.argv[1];
    try {
      const data = JSON.parse(fs.readFileSync(0, "utf8"));
      const items = Array.isArray(data) ? data : (data.issues || data.items || []);
      const found = items.find(i => typeof i.title === "string" && i.title.includes(marker));
      if (found && found.id) process.stdout.write(found.id);
    } catch {}
  ' "$MARKER")

  if [ -n "$EXISTING_ID" ]; then
    paperclipai issue update "$EXISTING_ID" --title "$TITLE" --description "$DESC" --status '${payload.status}' --priority high --assignee-agent-id '${payload.assigneeAgentId}' --json
  else
    paperclipai issue create --company-id '${PAPERCLIP_COMPANY_ID}' --project-id '${mapping.projectId}' --title "$TITLE" --description "$DESC" --status '${payload.status}' --priority high --assignee-agent-id '${payload.assigneeAgentId}' --json
  fi
) 200>/tmp/paperclip-openspec-sync.lock
`;

  try {
    const stdout = execFileSync('ssh', ['-o', 'ConnectTimeout=8', host, remoteScript], {
      encoding: 'utf8',
      timeout: 25_000,
    });
    const idMatch = stdout.match(/"id"\s*:\s*"([^"]+)"/);
    return {
      synced: true,
      issueId: idMatch?.[1],
      action: stdout.includes('"updatedAt"') ? 'created' : 'updated',
      output: stdout.trim(),
    };
  } catch (err) {
    return {
      synced: false,
      action: 'failed',
      output: err instanceof Error ? err.message : String(err),
    };
  }
}

const isDirectExecution = (() => {
  if (!process.argv[1]) return false;
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url));
  } catch {
    return import.meta.url === `file://${process.argv[1]}`;
  }
})();

if (isDirectExecution) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const repoArgIdx = args.indexOf('--repo');
  const changeArgIdx = args.indexOf('--change');

  if (repoArgIdx !== -1 && changeArgIdx !== -1) {
    const repoPath = args[repoArgIdx + 1]!;
    const changeId = args[changeArgIdx + 1]!;
    const validation = validateOpenSpecChange(repoPath, changeId);
    if (!validation.valid) {
      console.error(JSON.stringify({ valid: false, errors: validation.errors }, null, 2));
      process.exit(1);
    }
    const syncRes = syncChangeToPaperclip(validation, { dryRun });
    console.log(JSON.stringify({ validation, sync: syncRes }, null, 2));
    process.exit(syncRes.synced ? 0 : 1);
  }
}
