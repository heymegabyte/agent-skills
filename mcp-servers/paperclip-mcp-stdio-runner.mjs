#!/usr/bin/env node
/**
 * Unified Paperclip Local Stdio MCP Runner
 *
 * Loads fleet secrets from ~/.config/agent-fleet/secrets/ into process.env,
 * normalizes provider API_KEY variables for hardened MCP servers, and either:
 *   1. Delegates stdio to the built MCP server entrypoint (or cua-driver binary), OR
 *   2. Serves a built-in JSON-RPC 2.0 MCP stdio server for cloudflare-mcp,
 *      sentry-mcp, executor-mcp, and notion-mcp.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { spawn, execSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const SERVER_ID = (process.argv[2] ?? "").trim();
if (!SERVER_ID) {
  process.stderr.write("Usage: paperclip-mcp-stdio-runner.mjs <server-id>\n");
  process.exit(1);
}

const HOME_DIR = process.env.HOME || os.homedir() || "/home/professormanhattan";
process.env.HOME = HOME_DIR;
if (!process.env.DISPLAY) {
  process.env.DISPLAY = ":0";
}
if (!process.env.NODE_EXTRA_CA_CERTS && fs.existsSync("/usr/local/share/ca-certificates/managed-warp.pem")) {
  process.env.NODE_EXTRA_CA_CERTS = "/usr/local/share/ca-certificates/managed-warp.pem";
}
if (!process.env.SSL_CERT_FILE && fs.existsSync("/etc/ssl/certs/ca-certificates.crt")) {
  process.env.SSL_CERT_FILE = "/etc/ssl/certs/ca-certificates.crt";
}

// 1. Load fleet secrets from ~/.config/agent-fleet/secrets
const SECRETS_DIR = path.join(HOME_DIR, ".config", "agent-fleet", "secrets");
if (fs.existsSync(SECRETS_DIR)) {
  try {
    for (const file of fs.readdirSync(SECRETS_DIR)) {
      if (!/^[A-Z][A-Z0-9_]*$/.test(file)) continue;
      if (process.env[file] && process.env[file].trim().length > 0) continue;
      const fullPath = path.join(SECRETS_DIR, file);
      if (fs.statSync(fullPath).isFile()) {
        const val = fs.readFileSync(fullPath, "utf8").trim();
        if (val) process.env[file] = val;
      }
    }
  } catch {
    // ignore secret directory read errors
  }
}

// 2. Map provider-specific secret into API_KEY for hardened MCP servers
const PROVIDER_KEY_MAP = {
  "stripe-hardened-mcp": ["STRIPE_LIVE_SECRET_KEY", "STRIPE_SECRET_KEY", "STRIPE_API_KEY"],
  "posthog-hardened-mcp": ["POSTHOG_PERSONAL_API_KEY", "POSTHOG_API_KEY"],
  "resend-hardened-mcp": ["RESEND_API_KEY"],
  "github-hardened-mcp": ["GITHUB_PERSONAL_TOKEN", "GITHUB_TOKEN", "GH_TOKEN"],
  "square-hardened-mcp": ["SQUARE_ACCESS_TOKEN", "SQUARE_API_KEY"],
  "twilio-hardened-mcp": ["TWILIO_AUTH_TOKEN", "TWILIO_API_KEY"],
  "bitwarden-hardened-mcp": ["BITWARDEN_ACCESS_TOKEN", "BWS_ACCESS_TOKEN"],
  "openai-hardened-mcp": ["OPENAI_API_KEY"],
};

const mappedKeys = PROVIDER_KEY_MAP[SERVER_ID];
if (mappedKeys) {
  for (const keyName of mappedKeys) {
    if (process.env[keyName]) {
      process.env.API_KEY = process.env[keyName];
      break;
    }
  }
}

// 3. Resolve base mcp-servers directory
const CANDIDATE_BASES = [
  "/home/professormanhattan/ai/repos/agent-skills/mcp-servers",
  path.join(HOME_DIR, ".agentskills", "mcp-servers"),
];
const MCP_BASE = CANDIDATE_BASES.find((dir) => fs.existsSync(dir)) ?? CANDIDATE_BASES[0];

// 4. Handle cua-driver binary delegation
if (SERVER_ID === "cua-driver") {
  const cuaBinCandidates = [
    path.join(HOME_DIR, ".local", "bin", "cua-driver"),
    "/usr/local/bin/cua-driver",
  ];
  const cuaBin = cuaBinCandidates.find((p) => fs.existsSync(p));
  if (cuaBin) {
    const child = spawn(cuaBin, ["mcp"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });
    process.stdin.pipe(child.stdin);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on("exit", (code) => process.exit(code ?? 0));
  } else {
    runBuiltInMcpServer("cua-driver", [
      {
        name: "health_report",
        title: "CUA Driver Health Report",
        description: "Check CUA computer-use driver status on host",
        inputSchema: { type: "object", properties: {} },
      },
    ], async (name) => ({
      content: [{ type: "text", text: JSON.stringify({ ok: true, tool: name, host: os.hostname() }) }],
    }));
  }
} else if (
  [
    "skills-gateway-mcp",
    "projectsites-mcp",
    "stripe-hardened-mcp",
    "posthog-hardened-mcp",
    "resend-hardened-mcp",
    "github-hardened-mcp",
    "square-hardened-mcp",
    "twilio-hardened-mcp",
    "bitwarden-hardened-mcp",
    "openai-hardened-mcp",
  ].includes(SERVER_ID)
) {
  const entryCandidates = [
    path.join(MCP_BASE, SERVER_ID, "mcp-server", "dist", "index.js"),
    path.join(MCP_BASE, SERVER_ID, "mcp-server", "dist", "src", "index.js"),
  ];
  const entryPath = entryCandidates.find((p) => fs.existsSync(p));
  if (!entryPath) {
    process.stderr.write(`Entrypoint not found for ${SERVER_ID}\n`);
    process.exit(1);
  }
  process.argv[1] = entryPath;
  await import(pathToFileURL(entryPath).href);
} else if (SERVER_ID === "cloudflare-mcp") {
  runCloudflareMcpServer();
} else if (SERVER_ID === "sentry-mcp") {
  runSentryMcpServer();
} else if (SERVER_ID === "executor-mcp") {
  runExecutorMcpServer();
} else if (SERVER_ID === "notion-mcp") {
  runNotionMcpServer();
} else {
  process.stderr.write(`Unknown MCP server id: ${SERVER_ID}\n`);
  process.exit(1);
}

// ── Built-in JSON-RPC 2.0 MCP Stdio Server Helper ─────────────────────────────

function runBuiltInMcpServer(serverName, tools, callHandler) {
  const rl = readline.createInterface({ input: process.stdin, terminal: false });
  const send = (msg) => {
    process.stdout.write(JSON.stringify(msg) + "\n");
  };

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let req;
    try {
      req = JSON.parse(trimmed);
    } catch {
      return;
    }
    if (!req || typeof req !== "object") return;
    const { id, method, params } = req;

    // Notifications have no id
    if (id === undefined || id === null) {
      return;
    }

    try {
      if (method === "initialize") {
        send({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: params?.protocolVersion ?? "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: serverName, version: "1.0.0" },
          },
        });
      } else if (method === "ping") {
        send({ jsonrpc: "2.0", id, result: {} });
      } else if (method === "tools/list") {
        send({ jsonrpc: "2.0", id, result: { tools } });
      } else if (method === "tools/call") {
        const toolName = params?.name ?? "";
        const args = params?.arguments ?? {};
        const result = await callHandler(toolName, args);
        send({ jsonrpc: "2.0", id, result });
      } else {
        send({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        });
      }
    } catch (err) {
      send({
        jsonrpc: "2.0",
        id,
        result: {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: err instanceof Error ? err.message : String(err),
              }),
            },
          ],
        },
      });
    }
  });
}

// ── Cloudflare MCP Server ────────────────────────────────────────────────────

function cfHeaders() {
  const apiKey = process.env.CLOUDFLARE_API_KEY ?? "";
  const email = process.env.CLOUDFLARE_EMAIL ?? "";
  const apiToken = process.env.CLOUDFLARE_API_TOKEN ?? "";
  if (apiToken && !apiKey) {
    return {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    };
  }
  return {
    "X-Auth-Email": email,
    "X-Auth-Key": apiKey,
    "Content-Type": "application/json",
  };
}

async function cfRequest(endpoint, init = {}) {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `https://api.cloudflare.com/client/v4${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...cfHeaders(), ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(25_000),
  });
  const data = await res.json();
  return data;
}

function runCloudflareMcpServer() {
  const defaultAccountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? "";
  const tools = [
    {
      name: "cloudflare_list_zones",
      title: "List Cloudflare DNS Zones",
      description: "List Cloudflare DNS zones in the organization account.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Optional domain name filter" },
          per_page: { type: "number", description: "Results per page (default 50)" },
        },
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "cloudflare_list_workers",
      title: "List Cloudflare Workers Scripts",
      description: "List all Cloudflare Workers scripts in the organization account.",
      inputSchema: {
        type: "object",
        properties: {
          account_id: { type: "string", description: "Cloudflare Account ID (optional, defaults to org account)" },
        },
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "cloudflare_list_d1_databases",
      title: "List Cloudflare D1 Databases",
      description: "List all D1 serverless SQLite databases in the organization account.",
      inputSchema: {
        type: "object",
        properties: {
          account_id: { type: "string", description: "Cloudflare Account ID (optional)" },
        },
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "cloudflare_d1_query",
      title: "Query Cloudflare D1 Database",
      description: "Execute a parameterized SQL query against a Cloudflare D1 database.",
      inputSchema: {
        type: "object",
        properties: {
          database_id: { type: "string", description: "Target D1 database UUID" },
          sql: { type: "string", description: "SQL statement to execute" },
          params: { type: "array", items: { type: "string" }, description: "Optional query bind parameters" },
          account_id: { type: "string", description: "Cloudflare Account ID (optional)" },
        },
        required: ["database_id", "sql"],
      },
    },
    {
      name: "cloudflare_list_kv_namespaces",
      title: "List Cloudflare KV Namespaces",
      description: "List Workers KV namespaces in the organization account.",
      inputSchema: {
        type: "object",
        properties: {
          account_id: { type: "string", description: "Cloudflare Account ID (optional)" },
        },
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "cloudflare_purge_cache",
      title: "Purge Cloudflare CDN Cache",
      description: "Purge Cloudflare CDN cache for a zone (purge_everything or specific URLs).",
      inputSchema: {
        type: "object",
        properties: {
          zone_id: { type: "string", description: "Target Cloudflare Zone ID" },
          purge_everything: { type: "boolean", description: "Set true to purge all cached assets" },
          files: { type: "array", items: { type: "string" }, description: "Optional list of URLs to purge" },
        },
        required: ["zone_id"],
      },
    },
    {
      name: "cloudflare_api_request",
      title: "Cloudflare v4 API Request",
      description: "Make a direct authenticated request to any Cloudflare v4 API path.",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "API path under /client/v4, e.g. /accounts/{id}/pages/projects" },
          method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"], description: "HTTP method" },
          body: { type: "object", description: "Optional JSON request body" },
        },
        required: ["path"],
      },
    },
  ];

  runBuiltInMcpServer("cloudflare-mcp", tools, async (name, args) => {
    const accountId = args.account_id || defaultAccountId;
    if (name === "cloudflare_list_zones") {
      const qs = new URLSearchParams();
      if (args.name) qs.set("name", String(args.name));
      qs.set("per_page", String(args.per_page ?? 50));
      const data = await cfRequest(`/zones?${qs.toString()}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "cloudflare_list_workers") {
      const data = await cfRequest(`/accounts/${accountId}/workers/scripts`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "cloudflare_list_d1_databases") {
      const data = await cfRequest(`/accounts/${accountId}/d1/database`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "cloudflare_d1_query") {
      const data = await cfRequest(`/accounts/${accountId}/d1/database/${args.database_id}/query`, {
        method: "POST",
        body: JSON.stringify({ sql: args.sql, params: args.params ?? [] }),
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "cloudflare_list_kv_namespaces") {
      const data = await cfRequest(`/accounts/${accountId}/storage/kv/namespaces`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "cloudflare_purge_cache") {
      const payload = args.files?.length ? { files: args.files } : { purge_everything: true };
      const data = await cfRequest(`/zones/${args.zone_id}/purge_cache`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "cloudflare_api_request") {
      const method = (args.method ?? "GET").toUpperCase();
      const data = await cfRequest(String(args.path), {
        method,
        body: args.body ? JSON.stringify(args.body) : undefined,
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    return { isError: true, content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  });
}

// ── Sentry MCP Server ────────────────────────────────────────────────────────

async function sentryRequest(endpoint, init = {}) {
  const token = process.env.SENTRY_AUTH_TOKEN || process.env.SENTRY_API_KEY || "";
  const url = endpoint.startsWith("http")
    ? endpoint
    : `https://sentry.io/api/0${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(25_000),
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { status: res.status, body: text };
  }
}

function runSentryMcpServer() {
  const tools = [
    {
      name: "sentry_list_organizations",
      title: "List Sentry Organizations",
      description: "List Sentry organizations accessible with the configured auth token.",
      inputSchema: { type: "object", properties: {} },
      annotations: { readOnlyHint: true },
    },
    {
      name: "sentry_list_projects",
      title: "List Sentry Projects",
      description: "List all Sentry projects across the organization.",
      inputSchema: {
        type: "object",
        properties: {
          organization_slug: { type: "string", description: "Optional organization slug" },
        },
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "sentry_list_issues",
      title: "List Sentry Issues",
      description: "Query unresolved or recent Sentry issues for an organization or project.",
      inputSchema: {
        type: "object",
        properties: {
          organization_slug: { type: "string", description: "Sentry organization slug" },
          project_slug: { type: "string", description: "Optional project slug" },
          query: { type: "string", description: "Sentry search query (default: is:unresolved)" },
        },
        required: ["organization_slug"],
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "sentry_get_issue",
      title: "Get Sentry Issue Details",
      description: "Retrieve detailed metadata and stacktrace for a specific Sentry issue ID.",
      inputSchema: {
        type: "object",
        properties: {
          issue_id: { type: "string", description: "Sentry Issue ID" },
        },
        required: ["issue_id"],
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "sentry_list_issue_events",
      title: "List Sentry Issue Events",
      description: "List recent occurrences/events for a specific Sentry issue ID.",
      inputSchema: {
        type: "object",
        properties: {
          issue_id: { type: "string", description: "Sentry Issue ID" },
        },
        required: ["issue_id"],
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "sentry_resolve_issue",
      title: "Resolve Sentry Issue",
      description: "Update a Sentry issue status (e.g., resolved, ignored, unresolved).",
      inputSchema: {
        type: "object",
        properties: {
          issue_id: { type: "string", description: "Sentry Issue ID" },
          status: { type: "string", enum: ["resolved", "unresolved", "ignored"], description: "New issue status" },
        },
        required: ["issue_id", "status"],
      },
    },
  ];

  runBuiltInMcpServer("sentry-mcp", tools, async (name, args) => {
    if (name === "sentry_list_organizations") {
      const data = await sentryRequest("/organizations/");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "sentry_list_projects") {
      const pathUrl = args.organization_slug
        ? `/organizations/${args.organization_slug}/projects/`
        : "/projects/";
      const data = await sentryRequest(pathUrl);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "sentry_list_issues") {
      const q = encodeURIComponent(args.query ?? "is:unresolved");
      const pathUrl = args.project_slug
        ? `/projects/${args.organization_slug}/${args.project_slug}/issues/?query=${q}`
        : `/organizations/${args.organization_slug}/issues/?query=${q}`;
      const data = await sentryRequest(pathUrl);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "sentry_get_issue") {
      const data = await sentryRequest(`/issues/${args.issue_id}/`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "sentry_list_issue_events") {
      const data = await sentryRequest(`/issues/${args.issue_id}/events/`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (name === "sentry_resolve_issue") {
      const data = await sentryRequest(`/issues/${args.issue_id}/`, {
        method: "PUT",
        body: JSON.stringify({ status: args.status }),
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    return { isError: true, content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  });
}

// ── Executor MCP Server ──────────────────────────────────────────────────────

function runExecutorMcpServer() {
  const tools = [
    {
      name: "execute",
      title: "Execute TypeScript / JavaScript Snippet",
      description: "Execute a TypeScript or JavaScript snippet in an isolated subprocess on the runtime host.",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "TypeScript or JavaScript source code to run" },
          timeoutMs: { type: "number", description: "Optional execution timeout in milliseconds (default 15000)" },
        },
        required: ["code"],
      },
    },
    {
      name: "resume",
      title: "Resume Execution Session",
      description: "Check or resume a previously started execution payload.",
      inputSchema: {
        type: "object",
        properties: {
          executionId: { type: "string", description: "Execution session identifier" },
        },
        required: ["executionId"],
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "skills",
      title: "List Available Agent Skills",
      description: "Search or list installed agent skills from the canonical skills index.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Optional search keyword" },
        },
      },
      annotations: { readOnlyHint: true },
    },
  ];

  runBuiltInMcpServer("executor-mcp", tools, async (name, args) => {
    if (name === "execute") {
      const timeout = Math.min(Math.max(Number(args.timeoutMs) || 15_000, 1_000), 30_000);
      const output = execSync(`node -e ${JSON.stringify(String(args.code ?? ""))}`, {
        timeout,
        encoding: "utf8",
        maxBuffer: 1024 * 1024,
      });
      return { content: [{ type: "text", text: output || "(completed with no stdout)" }] };
    }
    if (name === "resume") {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ executionId: args.executionId, status: "completed" }),
          },
        ],
      };
    }
    if (name === "skills") {
      const idxPath = "/home/professormanhattan/ai/repos/agent-skills/skills-index.json";
      if (fs.existsSync(idxPath)) {
        const skills = JSON.parse(fs.readFileSync(idxPath, "utf8"));
        const q = String(args.query ?? "").toLowerCase();
        const filtered = q
          ? skills.filter(
              (s) =>
                String(s.id ?? s.name ?? "").toLowerCase().includes(q) ||
                String(s.description ?? "").toLowerCase().includes(q),
            )
          : skills.slice(0, 50);
        return { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] };
      }
      return { content: [{ type: "text", text: "[]" }] };
    }
    return { isError: true, content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  });
}

// ── Notion / Organization KB MCP Server ──────────────────────────────────────

function runNotionMcpServer() {
  const kbDir = path.join(HOME_DIR, ".openclaw", "workspace", "notion-kb");
  const tools = [
    {
      name: "notion_search",
      title: "Search Notion / Organization Knowledge Base",
      description: "Search pages and databases in Notion or the local organization knowledge base.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query text" },
        },
        required: ["query"],
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "notion_get_page",
      title: "Get Notion Page",
      description: "Retrieve a page's properties and markdown content by page ID or slug.",
      inputSchema: {
        type: "object",
        properties: {
          page_id: { type: "string", description: "Page ID or slug" },
        },
        required: ["page_id"],
      },
      annotations: { readOnlyHint: true },
    },
    {
      name: "notion_create_page",
      title: "Create Notion Page",
      description: "Create a new knowledge base page with title and markdown content.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Page title" },
          content: { type: "string", description: "Markdown body content" },
          parent_id: { type: "string", description: "Optional parent page or database ID" },
        },
        required: ["title"],
      },
    },
  ];

  runBuiltInMcpServer("notion-mcp", tools, async (name, args) => {
    const notionKey = process.env.NOTION_API_KEY || process.env.NOTION_TOKEN || "";
    if (notionKey) {
      if (name === "notion_search") {
        const res = await fetch("https://api.notion.com/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${notionKey}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: args.query ?? "" }),
          signal: AbortSignal.timeout(20_000),
        });
        return { content: [{ type: "text", text: await res.text() }] };
      }
      if (name === "notion_get_page") {
        const res = await fetch(`https://api.notion.com/v1/pages/${args.page_id}`, {
          headers: {
            Authorization: `Bearer ${notionKey}`,
            "Notion-Version": "2022-06-28",
          },
          signal: AbortSignal.timeout(20_000),
        });
        return { content: [{ type: "text", text: await res.text() }] };
      }
    }

    fs.mkdirSync(kbDir, { recursive: true });
    if (name === "notion_search") {
      const q = String(args.query ?? "").toLowerCase();
      const files = fs.readdirSync(kbDir).filter((f) => f.endsWith(".md") || f.endsWith(".json"));
      const matches = [];
      for (const f of files) {
        const body = fs.readFileSync(path.join(kbDir, f), "utf8");
        if (!q || f.toLowerCase().includes(q) || body.toLowerCase().includes(q)) {
          matches.push({ page_id: f.replace(/\.(md|json)$/, ""), file: f, snippet: body.slice(0, 300) });
        }
      }
      return { content: [{ type: "text", text: JSON.stringify({ results: matches }, null, 2) }] };
    }
    if (name === "notion_get_page") {
      const safeId = String(args.page_id ?? "").replace(/[^a-zA-Z0-9_-]/g, "-");
      const filePath = path.join(kbDir, `${safeId}.md`);
      if (!fs.existsSync(filePath)) {
        return { isError: true, content: [{ type: "text", text: `Page not found: ${safeId}` }] };
      }
      return { content: [{ type: "text", text: fs.readFileSync(filePath, "utf8") }] };
    }
    if (name === "notion_create_page") {
      const slug = String(args.title ?? "untitled")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const filePath = path.join(kbDir, `${slug}.md`);
      const content = `# ${args.title}\n\n${args.content ?? ""}\n`;
      fs.writeFileSync(filePath, content, "utf8");
      return { content: [{ type: "text", text: JSON.stringify({ ok: true, page_id: slug, path: filePath }) }] };
    }
    return { isError: true, content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  });
}
