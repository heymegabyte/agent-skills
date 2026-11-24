#!/usr/bin/env -S node --experimental-strip-types
/**
 * paperclip-mcp — Universal Emdash + Paperclip On-Demand Skill, Rule & MCP Router CLI.
 *
 * Gives every Paperclip, OpenClaw, and Emdash agent instant CLI access to:
 *   1. Deterministic Task -> Skill + Rule + MCP Server Routing (`route`)
 *   2. MCP Server & Gateway Namespace Discovery (`route-mcp`)
 *   3. Full-Text Skill, Reference Doc, Rule, Agent & Command Search (`search-skills`)
 *   4. On-Demand Skill & Section Loading (`load-skill`)
 *   5. Authoritative Emdash Doctrine Rule Lookup (`find-rule`)
 *   6. Live Paperclip MCP Gateway Tool Listing (`list-tools [filter]`)
 *   7. Live Paperclip MCP Gateway Tool Execution (`call <tool> '<json>'`)
 */
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveSkillsRoot(): string {
  if (process.env.SKILLS_GATEWAY_ROOT && existsSync(process.env.SKILLS_GATEWAY_ROOT)) {
    return path.resolve(process.env.SKILLS_GATEWAY_ROOT);
  }
  const candidates = [
    path.resolve(__dirname, '..'),
    path.join(os.homedir(), 'ai/repos/agent-skills'),
    path.join(os.homedir(), '.agentskills'),
  ];
  for (const c of candidates) {
    if (existsSync(path.join(c, 'rules')) && existsSync(path.join(c, 'mcp-servers/skills-gateway-mcp'))) {
      return c;
    }
  }
  return candidates[0];
}

interface GatewayCredentials {
  url: string;
  token: string;
}

function resolveGatewayCredentials(): GatewayCredentials {
  const envUrl = process.env.PAPERCLIP_MCP_GATEWAY_URL?.trim();
  const envToken = process.env.PAPERCLIP_MCP_GATEWAY_TOKEN?.trim();
  if (envUrl && envToken) {
    return {
      url: envUrl.replace(/^https?:\/\/swarml\.ink/i, 'http://127.0.0.1:3100'),
      token: envToken.replace(/^Bearer\s+/i, ''),
    };
  }
  const fallbackFiles = [
    path.join(os.homedir(), '.openclaw/workspace/paperclip-mcp-servers.json'),
    path.join(os.homedir(), '.config/agent-fleet/paperclip-mcp-servers.json'),
  ];
  for (const f of fallbackFiles) {
    if (!existsSync(f)) continue;
    try {
      const parsed = JSON.parse(readFileSync(f, 'utf8')) as {
        mcpServers?: Record<string, { url?: string; headers?: Record<string, string> }>;
      };
      const entry = parsed.mcpServers?.['paperclip-assigned'] ?? Object.values(parsed.mcpServers ?? {})[0];
      if (entry?.url) {
        const rawAuth = entry.headers?.Authorization ?? entry.headers?.authorization ?? '';
        return {
          url: entry.url.replace(/^https?:\/\/swarml\.ink/i, 'http://127.0.0.1:3100'),
          token: rawAuth.replace(/^Bearer\s+/i, ''),
        };
      }
    } catch {
      // continue
    }
  }
  throw new Error(
    'Missing PAPERCLIP_MCP_GATEWAY_URL / PAPERCLIP_MCP_GATEWAY_TOKEN and no ~/.openclaw/workspace/paperclip-mcp-servers.json found.',
  );
}

async function callMcpGatewayRpc(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
  const { url, token } = resolveGatewayCredentials();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
    signal: AbortSignal.timeout(60_000),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`MCP Gateway HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  const parsed = JSON.parse(text) as { result?: unknown; error?: { code?: number; message?: string } };
  if (parsed.error) {
    throw new Error(`MCP Gateway RPC Error (${parsed.error.code ?? 'unknown'}): ${parsed.error.message ?? JSON.stringify(parsed.error)}`);
  }
  return parsed.result;
}

function parseFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  const eq = args.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  return undefined;
}

function stripFlags(args: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      if (!a.includes('=') && i + 1 < args.length && !args[i + 1].startsWith('--')) {
        i++;
      }
      continue;
    }
    out.push(a);
  }
  return out;
}

function printUsage(): void {
  process.stdout.write(
    [
      'paperclip-mcp — Universal Emdash & Paperclip On-Demand Skill, Rule & MCP Router CLI',
      '',
      'Usage:',
      '  paperclip-mcp route "<task prompt>" [--role <agent-role>] [--repo <repo-name>]',
      '  paperclip-mcp route-mcp "<capability or service query>"',
      '  paperclip-mcp search-skills "<query>" [--kind skill|rule|agent|command]',
      '  paperclip-mcp load-skill "<name>" [--section "<heading>"]',
      '  paperclip-mcp find-rule "<topic>"',
      '  paperclip-mcp list-tools [filter]',
      '  paperclip-mcp call <tool-name> [\'{"arg":"value"}\']',
      '',
    ].join('\n'),
  );
}

async function main(): Promise<void> {
  const [, , subcommand, ...rest] = process.argv;
  if (!subcommand || subcommand === '--help' || subcommand === '-h' || subcommand === 'help') {
    printUsage();
    return;
  }

  const root = resolveSkillsRoot();
  const distDir = path.join(root, 'mcp-servers/skills-gateway-mcp/mcp-server/dist');
  const indexMod = (await import(path.join(distDir, 'index.js'))) as {
    loadIndex: (r: string) => { entries: Array<{ name: string; aliases: string[]; kind: string; path: string; description: string; sections: string[] }> };
    extractSection: (md: string, title: string) => string | null;
    routeTask: (entries: unknown[], opts: { prompt: string; agent_role?: string; repo_name?: string }) => string;
    formatMcpServerRoutes: (query: string, limit?: number) => string;
    GatewayView: new (idx: unknown) => {
      index: { entries: Array<{ name: string; aliases: string[]; kind: string; path: string; description: string; sections: string[] }> };
      names: Map<string, Array<{ name: string; kind: string; path: string; sections: string[] }>>;
    };
  };
  const searchMod = (await import(path.join(distDir, 'search.js'))) as {
    searchEntries: (entries: unknown[], q: string, opts?: { kind?: string; limit?: number }) => unknown[];
    formatHits: (hits: unknown[], q: string) => string;
  };
  const formatMod = (await import(path.join(distDir, 'format.js'))) as {
    findRuleForMeasure: (r: string, entries: unknown[], topic: string, max?: number) => string;
  };

  switch (subcommand) {
    case 'route':
    case 'route-task': {
      const role = parseFlag(rest, '--role');
      const repo = parseFlag(rest, '--repo');
      const prompt = stripFlags(rest).join(' ').trim();
      if (!prompt) {
        throw new Error('Usage: paperclip-mcp route "<task prompt>" [--role <agent-role>]');
      }
      const index = indexMod.loadIndex(root);
      process.stdout.write(`${indexMod.routeTask(index.entries, { prompt, agent_role: role, repo_name: repo })}\n`);
      return;
    }

    case 'route-mcp':
    case 'route-mcp-servers': {
      const query = stripFlags(rest).join(' ').trim();
      if (!query) {
        throw new Error('Usage: paperclip-mcp route-mcp "<capability or service query>"');
      }
      process.stdout.write(`${indexMod.formatMcpServerRoutes(query, 8)}\n`);
      return;
    }

    case 'search':
    case 'search-skills': {
      const kind = parseFlag(rest, '--kind');
      const maxStr = parseFlag(rest, '--max');
      const limit = maxStr ? Number(maxStr) : 10;
      const query = stripFlags(rest).join(' ').trim();
      if (!query) {
        throw new Error('Usage: paperclip-mcp search-skills "<query>" [--kind skill|rule|agent|command]');
      }
      const index = indexMod.loadIndex(root);
      const hits = searchMod.searchEntries(index.entries, query, { kind, limit });
      if (hits.length === 0) {
        process.stdout.write(`No matches for "${query}". Try broader keywords.\n`);
        return;
      }
      process.stdout.write(`${hits.length} result(s) for "${query}":\n\n${searchMod.formatHits(hits, query)}\n`);
      return;
    }

    case 'load':
    case 'load-skill': {
      const section = parseFlag(rest, '--section');
      const requested = stripFlags(rest).join(' ').trim();
      if (!requested) {
        throw new Error('Usage: paperclip-mcp load-skill "<name>" [--section "<heading>"]');
      }
      const index = indexMod.loadIndex(root);
      const view = new indexMod.GatewayView(index);
      const candidates = view.names.get(requested) ?? view.names.get(requested.replace(/^\d\d-/, ''));
      if (!candidates || candidates.length === 0) {
        const near = searchMod.searchEntries(index.entries, requested, { limit: 5 }) as Array<{ entry: { name: string } }>;
        const hint = near.length ? ` Did you mean: ${near.map((h) => h.entry.name).join(', ')}?` : '';
        throw new Error(`No entry named "${requested}".${hint}`);
      }
      const entry = candidates[0];
      let content = readFileSync(path.join(root, entry.path), 'utf8').replace(/^---[\s\S]*?\n---\n*/, '');
      if (section) {
        const extracted = indexMod.extractSection(content, section);
        if (!extracted) {
          throw new Error(`Section "${section}" not found in ${entry.name}. Available: ${entry.sections.slice(0, 20).join(', ')}`);
        }
        content = extracted;
      }
      process.stdout.write(`# ${entry.name} (${entry.kind})\npath: ${entry.path}\n\n${content}\n`);
      return;
    }

    case 'rule':
    case 'find-rule': {
      const topic = stripFlags(rest).join(' ').trim();
      if (!topic) {
        throw new Error('Usage: paperclip-mcp find-rule "<topic>"');
      }
      const index = indexMod.loadIndex(root);
      process.stdout.write(`${formatMod.findRuleForMeasure(root, index.entries, topic, 4)}\n`);
      return;
    }

    case 'list-tools': {
      const filter = stripFlags(rest).join(' ').trim().toLowerCase();
      const result = (await callMcpGatewayRpc('tools/list', {})) as {
        tools?: Array<{ name: string; description?: string }>;
      };
      const allTools = result.tools ?? [];
      const matched = filter
        ? allTools.filter(
            (t) => t.name.toLowerCase().includes(filter) || (t.description ?? '').toLowerCase().includes(filter),
          )
        : allTools;
      process.stdout.write(`Matched ${matched.length} of ${allTools.length} live Paperclip MCP Gateway tools:\n\n`);
      for (const t of matched.slice(0, 120)) {
        const desc = (t.description ?? '').replace(/\s+/g, ' ').trim().slice(0, 140);
        process.stdout.write(`- ${t.name}${desc ? ` — ${desc}` : ''}\n`);
      }
      if (matched.length > 120) {
        process.stdout.write(`\n...and ${matched.length - 120} more. Pass a filter to narrow results.\n`);
      }
      return;
    }

    case 'call': {
      const toolName = rest[0]?.trim();
      const rawJson = rest.slice(1).join(' ').trim() || '{}';
      if (!toolName) {
        throw new Error('Usage: paperclip-mcp call <tool-name> [\'{"arg":"value"}\']');
      }
      const parsedArgs = JSON.parse(rawJson) as Record<string, unknown>;
      let result: unknown;
      try {
        result = await callMcpGatewayRpc('tools/call', {
          name: toolName,
          arguments: parsedArgs,
        });
      } catch (err) {
        if (toolName.includes(':') && toolName.split(':')[1]?.includes('_')) {
          const [ns, suffix] = toolName.split(':', 2);
          const hyphenated = `${ns}:${suffix.replaceAll('_', '-')}`;
          result = await callMcpGatewayRpc('tools/call', {
            name: hyphenated,
            arguments: parsedArgs,
          });
        } else {
          throw err;
        }
      }
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      return;
    }

    default:
      printUsage();
      throw new Error(`Unknown subcommand: ${subcommand}`);
  }
}

main().catch((err) => {
  process.stderr.write(`[paperclip-mcp] error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
