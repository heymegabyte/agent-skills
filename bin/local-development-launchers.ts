import { join } from 'node:path';
import type { ApprovedLauncher, ExecutionNode, ExecutionProvider } from './swarm-execution-kernel.ts';

type LocalProvider = Extract<ExecutionProvider, 'claude' | 'codex' | 'opencode-deepseek'>;

interface VerifiedLocalLauncher {
  readonly agentSkillsCheckout: string;
  readonly budgetReceipt: string;
  readonly enforcesWorktreeIsolation: boolean;
  readonly enforcesBoundedEgress: boolean;
}

function developmentPrompt(node: ExecutionNode): string {
  return [
    'Implement the explicitly assigned repository development task in the current worktree.',
    'Restrict edits to the owned paths below. Leave changes for independent review.',
    JSON.stringify({ task: node.title, ownedPaths: node.ownedPaths }),
  ].join('\n');
}

export function localDevelopmentLauncher(
  provider: LocalProvider,
  evidence: VerifiedLocalLauncher,
): ApprovedLauncher {
  const launcher = {
    approved: true,
    budgetReceipt: evidence.budgetReceipt,
    enforcesWorktreeIsolation: evidence.enforcesWorktreeIsolation,
    enforcesBoundedEgress: evidence.enforcesBoundedEgress,
  };
  const bin = join(evidence.agentSkillsCheckout, 'bin');
  if (provider === 'opencode-deepseek') {
    return {
      ...launcher,
      executable: join(bin, 'opencode-deepseek.sh'),
      fixedArgs: ['run', '--pure', '-m', 'litellm/deepseek-v4-pro'],
      taskArgs: (node, _correlationId, worktree) => ['--dir', worktree, '--', developmentPrompt(node)],
    };
  }
  return {
    ...launcher,
    executable: join(bin, 'with-subscription-cli.sh'),
    fixedArgs: [provider],
    taskArgs: (node, _correlationId, worktree) => provider === 'codex'
      ? ['exec', '--sandbox', 'workspace-write', '--cd', worktree, '--', developmentPrompt(node)]
      : ['--print', '--permission-mode', 'acceptEdits', '--strict-mcp-config', '--', developmentPrompt(node)],
  };
}
