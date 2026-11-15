#!/usr/bin/env node
/**
 * @module index
 * @description Project Sites MCP server — stdio entry point.
 *
 * Exposes the 34-tool manifest in `tools.ts` over the Model Context Protocol so
 * Claude Code (or any MCP client) can take a one-line prompt to a live
 * edge-native site:
 *
 *   create_site → cf_provision_d1/kv/r2 → deploy_site → add_domain → get_site_health
 *
 * Contract notes
 *  - Every failure is returned as `isError: true` with a machine-readable
 *    `{ code, message }` text body. The server never crashes on a bad call and
 *    never returns fabricated success.
 *  - Input is validated against each tool's Zod schema before the handler runs,
 *    so a malformed argument is a `INVALID_INPUT` envelope with the issue list,
 *    not a 500 from the API.
 *  - `PROJECT_SITES_API_KEY` is checked lazily by `http.request`, so `tools/list`
 *    works without credentials (useful for schema introspection and CI).
 *
 * @see ../README.md — install, env vars, and the provisioning flow.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ApiError, defaultRuntime, type Runtime } from './http.js';
import { listToolsPayload, TOOLS_BY_NAME, TOOL_DEFINITIONS } from './tools.js';

/**
 * Server name/version reported during `initialize`.
 *
 * The version is duplicated from `package.json` because the build copies only
 * `src` + `test` into `dist`, so a JSON import from the package root would fall
 * outside `rootDir`. `test/server-info.test.ts` pins the two together — a
 * version bump that misses this constant fails the suite.
 */
export const SERVER_INFO = { name: 'projectsites-mcp', version: '2.1.0' } as const;

/** Shape of one MCP tool result. */
type ToolResult = { content: Array<{ type: 'text'; text: string }>; isError?: boolean };

/** Wrap a value as a successful text result. */
const ok = (value: unknown): ToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
});

/** Wrap an error as an `isError` result. */
const fail = (code: string, message: string, detail?: unknown): ToolResult => ({
  content: [{ type: 'text', text: JSON.stringify({ code, message, detail }, null, 2) }],
  isError: true,
});

/**
 * Build a configured MCP server. Exported so tests can drive it without stdio.
 *
 * @param rt Injectable runtime (fake fetch in tests, real in production).
 */
export function createServer(rt: Runtime = defaultRuntime()): Server {
  const server = new Server(SERVER_INFO, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: listToolsPayload() }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = TOOLS_BY_NAME.get(req.params.name);
    if (!tool) {
      return fail('UNKNOWN_TOOL', `No such tool "${req.params.name}". Call tools/list for the manifest.`);
    }

    const parsed = tool.inputSchema.safeParse(req.params.arguments ?? {});
    if (!parsed.success) {
      return fail('INVALID_INPUT', `Invalid arguments for ${tool.name}.`, parsed.error.issues);
    }

    try {
      return ok(await tool.handler(rt, parsed.data as never));
    } catch (error) {
      if (error instanceof ApiError) return fail(error.code, error.message, error.detail);
      return fail('INTERNAL', (error as Error).message ?? String(error));
    }
  });

  return server;
}

/** Boot the stdio server. */
async function main(): Promise<void> {
  const server = createServer();
  await server.connect(new StdioServerTransport());
  // stderr only — stdout is the MCP channel and must stay byte-clean.
  process.stderr.write(
    `projectsites-mcp ${SERVER_INFO.version} ready — ${TOOL_DEFINITIONS.length} tools on stdio\n`,
  );
}

// Only auto-start when executed directly, so importing this module in tests is inert.
const invokedDirectly = process.argv[1]?.includes('index.js') || process.argv[1]?.includes('index.ts');
if (invokedDirectly) {
  main().catch((error: unknown) => {
    process.stderr.write(`projectsites-mcp failed to start: ${(error as Error).message}\n`);
    process.exit(1);
  });
}
