#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const APPLY = process.argv.includes("--apply");
const configPath = process.argv.find((x) => x.startsWith("--config="))?.slice(9)
  || "config/cloudflare-agent-fabric.json";
const cfg = JSON.parse(readFileSync(resolve(configPath), "utf8"));

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
if (!accountId || !token) {
  throw new Error("Need CLOUDFLARE_ACCOUNT_ID (or CF_ACCOUNT_ID) and CLOUDFLARE_API_TOKEN (or CF_API_TOKEN).");
}

const apiBase = `https://api.cloudflare.com/client/v4/accounts/${accountId}`;
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

async function cf(path, init={}) {
  const res = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) },
  });
  const text = await res.text();
  let body; try { body = text ? JSON.parse(text) : {}; } catch { body = { raw:text }; }
  if (!res.ok || body?.success === false) {
    throw new Error(`${init.method || "GET"} ${path} failed (${res.status}): ${JSON.stringify(body)}`);
  }
  return body?.result ?? body;
}

const changes = [];
const skipped = [];

function modelRef(spec, label) {
  const provider = process.env[spec.providerEnv];
  const model = process.env[spec.modelEnv];
  if (!provider || !model) {
    skipped.push(`${label}: missing ${spec.providerEnv}/${spec.modelEnv}`);
    return null;
  }
  return { provider, model };
}

function routeElements(intent, routeCfg) {
  const primary = modelRef(routeCfg.primary, `${intent}.primary`);
  if (!primary) return null;
  const fallback = modelRef(routeCfg.fallback, `${intent}.fallback`);
  const endId = `${intent}-end`;
  const primaryId = `${intent}-primary`;
  const fallbackId = `${intent}-fallback`;

  const elements = [
    { id: `${intent}-start`, type: "start", outputs: { next: { elementId: primaryId } } },
    {
      id: primaryId,
      type: "model",
      properties: {
        provider: primary.provider,
        model: primary.model,
        timeout: routeCfg.timeoutMs ?? 60000,
        retries: routeCfg.retries ?? 1
      },
      outputs: {
        success: { elementId: endId },
        ...(fallback ? { fallback: { elementId: fallbackId } } : {})
      }
    }
  ];
  if (fallback) {
    elements.push({
      id: fallbackId,
      type: "model",
      properties: {
        provider: fallback.provider,
        model: fallback.model,
        timeout: routeCfg.timeoutMs ?? 60000,
        retries: 0
      },
      outputs: { success: { elementId: endId } }
    });
  }
  elements.push({ id: endId, type: "end", outputs: {} });
  return elements;
}

async function reconcileRoutes() {
  for (const gateway of cfg.gateways || []) {
    const listing = await cf(`/ai-gateway/gateways/${encodeURIComponent(gateway.id)}/routes`);
    const routes = listing?.data || listing || [];
    for (const intent of gateway.routes || []) {
      const routeCfg = cfg.routeModels?.[intent];
      if (!routeCfg) { skipped.push(`${gateway.id}/${intent}: no route config`); continue; }
      const elements = routeElements(intent, routeCfg);
      if (!elements) continue;
      const name = intent;
      const existing = routes.find((r) => r.name === name);

      if (!existing) {
        if (!APPLY) {
          changes.push(`would create dynamic/${name} on ${gateway.id}`);
          continue;
        }
        const created = await cf(`/ai-gateway/gateways/${encodeURIComponent(gateway.id)}/routes`, {
          method: "POST",
          body: JSON.stringify({ name, elements })
        });
        changes.push(`created dynamic/${name} on ${gateway.id} (${created.id})`);
        continue;
      }

      if (!APPLY) {
        changes.push(`would version+deploy dynamic/${name} on ${gateway.id}`);
        continue;
      }

      const version = await cf(`/ai-gateway/gateways/${encodeURIComponent(gateway.id)}/routes/${existing.id}/versions`, {
        method: "POST",
        body: JSON.stringify({ elements })
      });
      const versionId = version.version_id || version.id;
      if (!versionId) throw new Error(`No version_id returned for ${gateway.id}/${name}`);
      await cf(`/ai-gateway/gateways/${encodeURIComponent(gateway.id)}/routes/${existing.id}/deployments`, {
        method: "POST",
        body: JSON.stringify({ version_id: versionId })
      });
      changes.push(`deployed new version of dynamic/${name} on ${gateway.id}`);
    }
  }
}

async function reconcileAiSearch() {
  const ns = cfg.aiSearch?.namespace || "default";
  const listing = await cf(`/ai-search/namespaces/${encodeURIComponent(ns)}/instances`);
  const instances = listing?.data || listing || [];
  for (const id of cfg.aiSearch?.instances || []) {
    if (instances.some((x) => x.id === id)) continue;
    if (!APPLY) {
      changes.push(`would create AI Search ${ns}/${id}`);
      continue;
    }
    await cf(`/ai-search/namespaces/${encodeURIComponent(ns)}/instances`, {
      method: "POST",
      body: JSON.stringify({
        id,
        custom_metadata: cfg.aiSearch.customMetadata || []
      })
    });
    changes.push(`created AI Search ${ns}/${id}`);
  }
}

async function reconcilePortal() {
  const portal = cfg.mcpPortal;
  if (!portal) return;
  const hostname = process.env[portal.hostnameEnv];
  if (!hostname) {
    skipped.push(`MCP Portal: ${portal.hostnameEnv} not set; not inventing a hostname`);
    return;
  }
  const id = process.env[portal.idEnv] || hostname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  const portals = await cf("/access/ai-controls/mcp/portals");
  const list = portals?.data || portals || [];
  if (list.some((p) => p.id === id || p.hostname === hostname)) return;

  if (!APPLY) {
    changes.push(`would create MCP Portal ${id} at ${hostname}`);
    return;
  }
  await cf("/access/ai-controls/mcp/portals", {
    method: "POST",
    body: JSON.stringify({
      id,
      name: portal.name || id,
      hostname,
      allow_code_mode: true,
      code_mode: portal.codeMode || "default_on",
      secure_web_gateway: portal.secureWebGateway !== false
    })
  });
  changes.push(`created MCP Portal ${id} at ${hostname}`);
  skipped.push(`DNS: API-created portal still needs a proxied CNAME ${hostname} → gateway.agents.cloudflare.com if Cloudflare did not create it elsewhere`);
}

await reconcileRoutes();
await reconcileAiSearch();
await reconcilePortal();

console.log(JSON.stringify({
  mode: APPLY ? "apply" : "dry-run",
  changes,
  skipped,
  notes: [
    "MCP upstream servers are not auto-created from unknown auth configs; run bin/audit-cloudflare-mcp-fleet.mjs and add only known-safe remote HTTP servers.",
    "Secrets Store reconciliation is separate because secret values must never be serialized into this manifest or output."
  ]
}, null, 2));
