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
  a11yAuditor: 'f75dd55c-e2c0-491f-981b-85e3947f5960',
  sre: '4ac23ce6-e37f-473d-834e-48b6bf824f3f',
  swarmDispatcher: '60c08948-5f59-4ffe-bde3-19dc26074404',
} as const;

export const CANONICAL_PROJECT_MAP: Record<string, PaperclipProjectMapping> = {
  'agent-skills': {
    projectId: '78ac0baa-b2fd-4f0d-9e25-845192da5d50',
    githubRepo: 'heymegabyte/agent-skills',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.architect,
  },
  'aidl.ink': {
    projectId: '841720fe-9c58-48d4-be52-5fe13c2e244a',
    githubRepo: 'heymegabyte/aidl.ink',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'apply.help': {
    projectId: 'f63a2308-6e29-4b4d-83c3-ac091852552c',
    githubRepo: 'heymegabyte/apply.help',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'bricklabor.com': {
    projectId: '84de4701-e828-4a14-a600-9e711e175f12',
    githubRepo: 'heymegabyte/bricklabor.com',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'browse.computer': {
    projectId: '79275e21-9611-4687-891c-828a8686de80',
    githubRepo: 'heymegabyte/browse.computer',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'browse.tools': {
    projectId: '3a8a8231-a8b4-4b68-9063-4a08c752abf7',
    githubRepo: 'heymegabyte/browse.tools',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'bz.rocks': {
    projectId: 'df4c3302-1690-4951-9ab1-3b8f64cbfbf4',
    githubRepo: 'heymegabyte/bz.rocks',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'claimyour.site': {
    projectId: '00d942b5-e854-4231-b429-e4abcb437358',
    githubRepo: 'heymegabyte/claimyour.site',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'cloudflare-os': {
    projectId: 'fb0c0d74-7cf0-4be1-b85d-b7f3377ee873',
    githubRepo: 'heymegabyte/cloudflare-os',
    defaultBranch: 'megabyte-os',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'coolify-host-config': {
    projectId: '06cac3a3-07bf-4dbf-bed3-983cea443afd',
    githubRepo: 'heymegabyte/coolify-host-config',
    defaultBranch: 'master',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'coolify.megabyte.space': {
    projectId: '748ffb9c-d8fb-4143-afe7-80c5a1e2e716',
    githubRepo: 'heymegabyte/coolify.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'crawl.cheap': {
    projectId: '222219b5-8aef-4e30-b8c4-8f68a07c88b8',
    githubRepo: 'heymegabyte/crawl.cheap',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'deskl.ink': {
    projectId: '9c02cb98-c85c-4422-9971-4d8365154ea7',
    githubRepo: 'heymegabyte/deskl.ink',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'desktop.management': {
    projectId: '58ad9525-d817-4b1f-8b3b-978ad96a01b6',
    githubRepo: 'heymegabyte/desktop.management',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'desktop.tools': {
    projectId: '10d31e5d-4386-4fc9-baf5-cd01356b36e8',
    githubRepo: 'heymegabyte/desktop.tools',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'draftl.ink': {
    projectId: 'd9a251a1-f2f2-4d7a-b552-0af9a60e2d07',
    githubRepo: 'heymegabyte/draftl.ink',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'fundl.ink': {
    projectId: '6c03c9a9-2240-45a3-b203-ae749f1b3f59',
    githubRepo: 'heymegabyte/fundl.ink',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'ghost.claims': {
    projectId: '53515a67-7fda-4677-9cec-c7cee26e8dbe',
    githubRepo: 'heymegabyte/ghost.claims',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'gitl.ink': {
    projectId: 'f3bed131-4368-4fe2-a2f5-2ba23c9f7d78',
    githubRepo: 'heymegabyte/gitl.ink',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'grafana.megabyte.space': {
    projectId: '4f71e260-2d37-4ab2-8455-831b129ee4d1',
    githubRepo: 'heymegabyte/grafana.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'health.megabyte.space': {
    projectId: 'c8ba0763-5360-4da8-8fa0-dfdc0425af75',
    githubRepo: 'heymegabyte/health.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'homebrew-tap': {
    projectId: 'f8b723c1-900d-4ae8-9e5c-72e206056c2c',
    githubRepo: 'heymegabyte/homebrew-tap',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'inboxl.ink': {
    projectId: '004b5758-56b5-4954-a494-9a1671a9f148',
    githubRepo: 'heymegabyte/inboxl.ink',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'inbox.vision': {
    projectId: '6da99bad-8ec4-437d-8eb4-bc9681372aa6',
    githubRepo: 'heymegabyte/inbox.vision',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'indie-music-toolkit': {
    projectId: '0915b236-3eb3-46c7-94d5-6f7657c0e97d',
    githubRepo: 'heymegabyte/indie-music-toolkit',
    defaultBranch: 'master',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'install.doctor': {
    projectId: 'd97b0204-ca63-4117-b469-2fe0f2470d18',
    githubRepo: 'heymegabyte/install.doctor',
    defaultBranch: 'master',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'issuel.ink': {
    projectId: '0bf6ec92-0581-492c-9a10-cc2d35ad20a2',
    githubRepo: 'heymegabyte/issuel.ink',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'legion.megabyte.space': {
    projectId: 'd87802d3-48b3-442a-998c-720951c119db',
    githubRepo: 'heymegabyte/legion.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'linkbl.ink': {
    projectId: 'ca634f2a-f745-41d1-9f6b-b868d9b50e10',
    githubRepo: 'heymegabyte/linkbl.ink',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'lonemountainglobal.com': {
    projectId: 'a871c370-37ff-4400-a5f2-cb306228c881',
    githubRepo: 'heymegabyte/lonemountainglobal.com',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'megabyte.space': {
    projectId: '42db4e14-103e-458a-bc67-0fdb100bf2bb',
    githubRepo: 'heymegabyte/megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'michael.megabyte.space': {
    projectId: '5dcfc425-cedd-4cde-8f15-22932787d6f2',
    githubRepo: 'heymegabyte/michael.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'mission.megabyte.space': {
    projectId: '0ea2c70f-2075-49bd-82b6-9bc13dc1f106',
    githubRepo: 'heymegabyte/mission.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'musicblobs.com': {
    projectId: '508563c5-7a7f-4bc9-adff-76ea50c0e819',
    githubRepo: 'heymegabyte/musicblobs.com',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'njsk.org': {
    projectId: 'dbcb34ca-1859-4e86-937b-d18f51125ff8',
    githubRepo: 'heymegabyte/njsk.org',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'omen.megabyte.space': {
    projectId: '8684ed28-427b-46e2-a93a-dda84d1df397',
    githubRepo: 'heymegabyte/omen.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'oneprompt.site': {
    projectId: '0f201683-57c7-481d-bd76-f8ba2a5f1217',
    githubRepo: 'heymegabyte/oneprompt.site',
    defaultBranch: 'master',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'pdf.kitchen': {
    projectId: '6614b0b0-eb38-489a-8afa-f9d5cca9dde4',
    githubRepo: 'heymegabyte/pdf.kitchen',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'projectsites.dev': {
    projectId: 'a4fef1e2-928e-4fb7-8386-a0700f017e29',
    githubRepo: 'heymegabyte/projectsites.dev',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'proxmox.megabyte.space': {
    projectId: '74cd0675-8f2b-4498-a180-2db650e3f92f',
    githubRepo: 'heymegabyte/proxmox.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'pulse.megabyte.space': {
    projectId: 'c268c1fc-ee59-47ad-b48e-cfedb0c51df4',
    githubRepo: 'heymegabyte/pulse.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'skillsl.ink': {
    projectId: 'ffed712e-f13f-4208-83a6-e8d4cebc118a',
    githubRepo: 'heymegabyte/skillsl.ink',
    defaultBranch: 'backup-pre-reformat-20260517',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.architect,
  },
  'soupl.ink': {
    projectId: 'e180a9bd-81f8-45e2-b28d-899825f1d119',
    githubRepo: 'heymegabyte/soupl.ink',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'status.megabyte.space': {
    projectId: '0bf39274-4830-4b26-99b4-69fcf810ad7f',
    githubRepo: 'heymegabyte/status.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'swarml.ink': {
    projectId: 'd41a3978-110c-4526-bbe4-8660d7c539f7',
    githubRepo: 'heymegabyte/swarml.ink',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.ceo,
  },
  'template.projectsites.dev': {
    projectId: '2bbb463d-f267-4850-aaf3-f740f4549d5d',
    githubRepo: 'heymegabyte/template.projectsites.dev',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'thebestsites.com': {
    projectId: '7f8a6248-d42e-4ef1-8989-4d35f9db7dc5',
    githubRepo: 'heymegabyte/thebestsites.com',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'theme.tools': {
    projectId: '298e1246-6c20-4c47-be16-19a1722d4fd2',
    githubRepo: 'heymegabyte/theme.tools',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.architect,
  },
  'tomy.house': {
    projectId: '14c02ee0-d0b8-4c37-91de-93e8b1ae0642',
    githubRepo: 'heymegabyte/tomy.house',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'ubuntu.megabyte.space': {
    projectId: '029cff3f-2ceb-4795-b55d-5bd8d0b6cf29',
    githubRepo: 'ProfessorManhattan/ubuntu.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
  },
  'videoblobs.com': {
    projectId: 'b1b8faa9-3b83-403d-b82a-67240e2510dc',
    githubRepo: 'heymegabyte/videoblobs.com',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.fullStackEngineer,
  },
  'zen.megabyte.space': {
    projectId: '3059aed5-f730-422e-917e-ce21e2868f08',
    githubRepo: 'heymegabyte/zen.megabyte.space',
    defaultBranch: 'main',
    defaultAssigneeAgentId: PAPERCLIP_SPECIALIST_AGENTS.devSecOps,
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
  const rawBaseName = repoNameOverride ?? path.basename(path.resolve(repoPath));
  const repoName =
    rawBaseName === 'heymegabyte-agent-skills' || rawBaseName === '.agentskills'
      ? 'agent-skills'
      : rawBaseName;
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
 * Formats the Paperclip issue title, governance fields, and markdown body with OpenSpec deep links.
 */
export function buildPaperclipIssuePayload(result: OpenSpecValidationResult): {
  marker: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  assigneeAgentId: string;
  reviewPolicy: 'not_creator';
  reviewerAgentIds: readonly string[];
  approverAgentIds: readonly string[];
  watchdogAgentId: string;
} {
  const marker = `[openspec:${result.repoName}:${result.changeId}]`;
  const cleanHeading = result.title.replace(/^Proposal:\s*/i, '').trim();
  const title = `${marker} ${cleanHeading}`;
  const status: 'todo' | 'done' =
    result.totalTasks > 0 && result.completedTasks === result.totalTasks
      ? 'done'
      : 'todo';
  const assigneeAgentId = resolveSpecialistAssigneeAgentId(result);
  const reviewerAgentIds = [
    PAPERCLIP_SPECIALIST_AGENTS.qaVerification,
    PAPERCLIP_SPECIALIST_AGENTS.appSec,
    PAPERCLIP_SPECIALIST_AGENTS.a11yAuditor,
  ].filter((id) => id !== assigneeAgentId);
  const approverAgentIds = [
    PAPERCLIP_SPECIALIST_AGENTS.architect,
    PAPERCLIP_SPECIALIST_AGENTS.releaseManager,
    PAPERCLIP_SPECIALIST_AGENTS.ceo,
  ].filter((id) => id !== assigneeAgentId);
  const watchdogAgentId =
    assigneeAgentId === PAPERCLIP_SPECIALIST_AGENTS.sre
      ? PAPERCLIP_SPECIALIST_AGENTS.swarmDispatcher
      : PAPERCLIP_SPECIALIST_AGENTS.sre;

  const description = [
    `## OpenSpec Convergence Task — \`${result.repoName}\``,
    '',
    `- **Change ID:** \`${result.changeId}\``,
    `- **Frontier Architect:** \`${result.architect}\` (verified non-OpenCode spec authorship)`,
    `- **Assigned Specialist Agent:** \`${assigneeAgentId}\``,
    `- **Reviewers (\`review_policy = not_creator\`):** \`${reviewerAgentIds.join('`, `')}\``,
    `- **Approvers:** \`${approverAgentIds.join('`, `')}\``,
    `- **Watchdog:** \`${watchdogAgentId}\``,
    `- **Task Progress:** **${result.completedTasks} / ${result.totalTasks}** tasks completed`,
    `- **OpenSpec Directory:** [${result.repoName}/openspec/changes/${result.changeId}](${result.deepLinks.folderUrl})`,
    `- **Proposal:** [proposal.md](${result.deepLinks.proposalUrl})`,
    `- **Architecture Design:** [design.md](${result.deepLinks.designUrl})`,
    `- **Implementation Tasks:** [tasks.md](${result.deepLinks.tasksUrl})`,
    '',
    '### Convergence, Sub-Tasks, Governance Fields & Trunk-Based Production Deployment Contract',
    '1. Every UI widget and sub-feature must converge through the Micro Loop (`CREATE → RENDER → EXPERIENCE → CRITIQUE → MODIFY → COMPARE`) across all 16 visual states and `0.333s` OKLCH transitions.',
    '2. Langfuse observability must remain enabled with graceful timeout fallback (`LANGFUSE_TIMEOUT_MS=2500`).',
    '3. Reconcile reusable patterns in parallel across `agent-skills`, `install.doctor`, and `theme.tools`.',
    '4. **Sub-Tasks (`parent_id`) & Graph Relations (`Parent`, `Blocking`, `Blocked by`):** Decompose multi-part or cross-specialist deliverables into child sub-tasks (`parentId`) whenever appropriate, and wire prerequisite dependencies via `blockedByIssueIds` (`issue_relations` `type = blocks`) so downstream tasks auto-wake on completion.',
    '5. **Reviewers, Approvers, Monitor & Watchdog:** Maintain populated **Reviewers** (`QA-Verification`, `AppSec`, `A11y-Auditor`), **Approvers** (`Architect`, `Release-Manager`, `CEO`), **Monitor** (`monitor_next_check_at`, `monitor_notes`, `monitor_scheduled_by = assignee` while `in_progress`/`in_review`), and **Watchdog** (`issue_watchdogs` active `SRE`/`Swarm-Dispatcher`).',
    '6. **Decisions (`/MEG/decisions`) — Clarifying Questions, Recommendations & Scope Expansions Only:** Use Paperclip Decisions (`issue_thread_interactions` `kind = ask_user_questions`) strictly to ask the user genuine questions to clarify instructions or provide high-leverage recommendations and scope expansions (with a `(Recommended)` option). Never create non-question status blurbs or bureaucratic handoffs in Decisions.',
    '7. **Autonomous Trunk-Based Execution (`main`) & Production Rollout:** Always work toward `main` (`shared_workspace`), create AND **merge** the PR into `main` (`gh pr create` + `gh pr merge --merge --delete-branch`), deploy to production (Cloudflare Workers / Nexus registry / Coolify / systemd + CDN cache purge), respond on-thread to all messages, and post empirical verification on this Paperclip issue.',
  ].join('\n');

  return {
    marker,
    title,
    description,
    status,
    assigneeAgentId,
    reviewPolicy: 'not_creator',
    reviewerAgentIds,
    approverAgentIds,
    watchdogAgentId,
  };
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
