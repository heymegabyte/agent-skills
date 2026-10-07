#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve, join } from "node:path";

const home = homedir();
const cwd = process.cwd();
const configPaths = [
  resolve(cwd, ".mcp.json"),
  resolve(cwd, ".github/mcp.json"),
  resolve(cwd, ".vscode/mcp.json"),
  join(home, ".claude/settings.json"),
  join(home, ".config/opencode/opencode.json"),
  join(home, ".copilot/mcp-config.json"),
];

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

function collect(value, source, out = []) {
  if (!value || typeof value !== "object") return out;
  for (const [key, child] of Object.entries(value)) {
    if ((key === "mcpServers" || key === "servers") && child && typeof child === "object" && !Array.isArray(child)) {
      out.push({ source, servers: child });
    }
    if (child && typeof child === "object") collect(child, source, out);
  }
  return out;
}

function urlOf(cfg) {
  for (const key of ["url", "serverUrl", "server_url", "endpoint"]) {
    if (typeof cfg?.[key] === "string" && /^https?:\/\//i.test(cfg[key])) return cfg[key];
  }
  if (Array.isArray(cfg?.args)) return cfg.args.find((x) => typeof x === "string" && /^https?:\/\//i.test(x)) || null;
  return null;
}

function classify(name, cfg, source) {
  const url = urlOf(cfg);
  const command = typeof cfg?.command === "string" ? cfg.command : null;
  let host = "";
  try { host = url ? new URL(url).hostname : ""; } catch {}
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(host);

  if (host === "mcp.cloudflare.com") return { source, name, url, disposition: "direct-cloudflare-api", reason: "Keep direct; avoid nested Code Mode." };
  if (url && !local) return { source, name, url, disposition: "portal-candidate", reason: "Remote HTTP MCP can benefit from Portal/Access/logging/allowlists/Code Mode." };
  if (url && local) return { source, name, url, disposition: "local-only", reason: "Localhost cannot join a Cloudflare portal unless deliberately re-hosted." };
  if (command) return { source, name, command, disposition: "stdio-local", reason: "Keep local unless deliberately exposed as authenticated Streamable HTTP." };
  return { source, name, disposition: "inspect", reason: "Transport could not be inferred safely." };
}

const maps = [];
for (const path of configPaths) {
  if (!existsSync(path)) continue;
  try { maps.push(...collect(JSON.parse(strip(readFileSync(path, "utf8"))), path)); }
  catch (error) { maps.push({ source: path, parseError: error.message, servers: {} }); }
}

const servers = maps.flatMap((m) => Object.entries(m.servers || {}).map(([n,c]) => classify(n,c,m.source)));
console.log(JSON.stringify({
  generatedAt: new Date().toISOString(),
  scanned: configPaths.filter(existsSync),
  summary: {
    total: servers.length,
    portalCandidates: servers.filter(x => x.disposition === "portal-candidate").length,
    directCloudflareApi: servers.filter(x => x.disposition === "direct-cloudflare-api").length,
    localOnly: servers.filter(x => ["local-only","stdio-local"].includes(x.disposition)).length,
  },
  servers
}, null, 2));
