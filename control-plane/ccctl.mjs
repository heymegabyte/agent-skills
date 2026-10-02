#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// ccctl — Claude Control-Plane CLI (deterministic brain for /ship)
// ─────────────────────────────────────────────────────────────────────────────
// Zero-dependency Node ESM. Turns intent + a domain/cwd into an executable plan so
// the AI orchestrates deterministic tools instead of re-deriving infra every time.
//
//   ccctl resolve [domain|repoPath]      → deployment target (repo, worker, urls, dns…)
//   ccctl classify "<intent>" --files a,b → FAST | NORMAL | HIGH-risk lane + test plan
//   ccctl plan [domain] "<intent>" --files a,b → resolve + classify + cache (one blob)
//   ccctl invalidation-plan --files a,b   → fastest-correct cache strategy
//   ccctl verify <url> [--status 200] [--asset /favicon.svg] [--contains "..."]
//   ccctl doctor                          → self-check + auth/tool availability
//
// Output: JSON envelope on stdout ({ ok, meta, ... }); human notes on stderr.
// Machine-parse with: ccctl resolve njsk.org | jq .target
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve as pathResolve, basename } from 'node:path';

const VERSION = '1.0.0';
const HERE = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(HERE, 'sites.jsonc');

// Realistic Chrome UA + companion headers so prod fetches never trip a WAF
// (mirrors rules/fetch-defaults.md — keep in sync on Chrome-major bumps).
const REAL_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';
const REAL_HEADERS = {
  'User-Agent': REAL_UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-User': '?1',
  'Sec-Fetch-Dest': 'document',
  'Upgrade-Insecure-Requests': '1',
};

// ── tiny utils ───────────────────────────────────────────────────────────────
const log = (...a) => console.error(...a);
const expandHome = (p) => (p && p.startsWith('~') ? join(homedir(), p.slice(1)) : p);
const isDomain = (s) => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9-]+)+$/i.test(s) && !s.includes('/');

/** Strip // and /* *​/ comments from JSONC without corrupting strings (URLs!). */
function stripJsonComments(text) {
  let out = '';
  let inStr = false, esc = false, inLine = false, inBlock = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (inLine) { if (c === '\n') { inLine = false; out += c; } continue; }
    if (inBlock) { if (c === '*' && n === '/') { inBlock = false; i++; } continue; }
    if (inStr) { out += c; if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === '/' && n === '/') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (c === ',') {
      // Drop trailing commas (JSON.parse rejects them; linters/JSON5 add them):
      // skip a comma whose next significant char (past whitespace/comments) is } or ].
      let j = i + 1;
      while (j < text.length) {
        const d = text[j];
        if (d === ' ' || d === '\t' || d === '\n' || d === '\r') { j++; continue; }
        if (d === '/' && text[j + 1] === '/') { while (j < text.length && text[j] !== '\n') j++; continue; }
        if (d === '/' && text[j + 1] === '*') { j += 2; while (j < text.length && !(text[j] === '*' && text[j + 1] === '/')) j++; j += 2; continue; }
        break;
      }
      if (text[j] === '}' || text[j] === ']') continue;
      out += c; continue;
    }
    out += c;
  }
  return out;
}

function readJsonc(path) {
  try { return JSON.parse(stripJsonComments(readFileSync(path, 'utf8'))); }
  catch (e) { log(`ccctl: failed to parse ${path}: ${e.message}`); return null; }
}
function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

// ── registry ──────────────────────────────────────────────────────────────────
function loadRegistry() {
  // The registry is OPTIONAL — on Claude Code web / a vendored repo copy it's absent
  // and the manifest (.claude/site.json) + inference carry resolution. Silent if missing.
  const reg = (existsSync(REGISTRY_PATH) ? readJsonc(REGISTRY_PATH) : null) || { sites: [], defaults: {} };
  reg.sites = reg.sites || [];
  reg.defaults = reg.defaults || {};
  return reg;
}
function registryRowFor(reg, { domain, repo }) {
  return reg.sites.find((s) => {
    if (domain && (s.domain === domain || (s.aliases || []).includes(domain))) return true;
    if (repo && expandHome(s.repo) === repo) return true;
    return false;
  }) || null;
}
function repoRoots(reg) {
  const env = process.env.CCCTL_REPO_ROOTS;
  const roots = env ? env.split(':') : (reg.defaults.repoRoots || ['~/emdash/repositories']);
  return roots.map(expandHome).filter(existsSync);
}

// ── wrangler.toml (minimal, no toml dep) ───────────────────────────────────────
function parseWrangler(repoDir) {
  const p = join(repoDir, 'wrangler.toml');
  if (!existsSync(p)) return null;
  const t = readFileSync(p, 'utf8');
  const name = (t.match(/^\s*name\s*=\s*"([^"]+)"/m) || [])[1] || null;
  const main = (t.match(/^\s*main\s*=\s*"([^"]+)"/m) || [])[1] || null;
  const workersDev = /^\s*workers_dev\s*=\s*true/m.test(t);
  const routes = [...t.matchAll(/pattern\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
  return { name, main, workersDev, routes };
}

// ── framework / package manager / scripts inference ────────────────────────────
function detectPackageManager(repoDir) {
  if (existsSync(join(repoDir, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(repoDir, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(repoDir, 'bun.lockb')) || existsSync(join(repoDir, 'bun.lock'))) return 'bun';
  return 'npm';
}
function detectFramework(pkg, repoDir) {
  const d = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  if (d['@angular/core']) return 'angular';
  if (d.next) return 'next';
  if (d.astro) return 'astro';
  if (d['@sveltejs/kit']) return 'sveltekit';
  if (d.vite && (d.react || d['react-dom'])) return 'react-vite';
  if (d.vite) return 'vite';
  if (existsSync(join(repoDir, 'wrangler.toml'))) return 'worker';
  return 'unknown';
}
function inferScripts(pkg, pm, hasWrangler) {
  const s = pkg?.scripts || {};
  const run = pm === 'npm' ? 'npm run' : pm === 'pnpm' ? 'pnpm' : pm === 'yarn' ? 'yarn' : 'bun run';
  const has = (k) => typeof s[k] === 'string';
  return {
    buildCmd: has('build') ? `${run} build` : null,
    checkCmd: has('check') ? `${run} check` : has('lint') ? `${run} lint` : has('typecheck') ? `${run} typecheck` : null,
    testCmd: has('test') ? `${run} test` : null,
    deployCmd: has('deploy') ? `${run} deploy` : hasWrangler ? 'npx wrangler deploy' : null,
    deployNoBuild: has('deploy:nobuild') ? `${run} deploy:nobuild` : hasWrangler ? 'npx wrangler deploy' : null,
  };
}

// ── repo discovery ─────────────────────────────────────────────────────────────
function findRepoRoot(startDir) {
  let dir = pathResolve(startDir);
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'package.json')) || existsSync(join(dir, 'wrangler.toml')) || existsSync(join(dir, '.git'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return pathResolve(startDir);
}
/** Discover a repo for a domain by scanning roots for manifest/wrangler matches. */
function discoverRepoForDomain(reg, domain) {
  for (const root of repoRoots(reg)) {
    let entries = [];
    try { entries = readdirSync(root); } catch { continue; }
    for (const name of entries) {
      const repoDir = join(root, name);
      try { if (!statSync(repoDir).isDirectory()) continue; } catch { continue; }
      const mani = readJson(join(repoDir, '.claude', 'site.json'));
      if (mani && (mani.domain === domain || (mani.aliases || []).includes(domain))) return { repoDir, via: 'manifest-scan' };
      const wr = parseWrangler(repoDir);
      if (wr && wr.routes.some((r) => r === domain || r.replace(/^www\./, '') === domain.replace(/^www\./, ''))) return { repoDir, via: 'wrangler-scan' };
    }
  }
  return null;
}

// ── load full facts for a repo ─────────────────────────────────────────────────
function loadRepoFacts(repoDir) {
  const pkg = readJson(join(repoDir, 'package.json'));
  const wr = parseWrangler(repoDir);
  const pm = detectPackageManager(repoDir);
  const framework = detectFramework(pkg, repoDir);
  const scripts = inferScripts(pkg, pm, !!wr);
  const manifest = readJson(join(repoDir, '.claude', 'site.json'));
  return { repoDir, pkg, wr, pm, framework, scripts, manifest };
}

function deriveVerifyUrl(t) {
  if (t.dnsStatus === 'active' && t.prodUrl) return t.prodUrl;
  return t.liveUrl || t.prodUrl || null;
}

/** Merge (inference < registry < manifest) into a single target. */
function buildTarget(reg, { repoDir, domain }) {
  const facts = loadRepoFacts(repoDir);
  const row = registryRowFor(reg, { domain, repo: repoDir }) || {};
  const mani = facts.manifest || {};
  const source = [];
  if (facts.wr || facts.pkg) source.push('inference');
  if (Object.keys(row).length) source.push('registry');
  if (facts.manifest) source.push('manifest');

  const worker = mani.worker || row.worker || facts.wr?.name || null;
  const sub = reg.defaults.workersDevSubdomain || 'workers';
  const liveUrl =
    mani.liveUrl || row.liveUrl || (worker && facts.wr?.workersDev ? `https://${worker}.${sub}.workers.dev` : null);
  const resolvedDomain = domain || mani.domain || row.domain || (facts.wr?.routes?.[0]) || null;
  const prodUrl = mani.prodUrl || row.prodUrl || (resolvedDomain ? `https://${resolvedDomain.replace(/^www\./, '')}` : null);

  const target = {
    domain: resolvedDomain,
    aliases: mani.aliases || row.aliases || facts.wr?.routes?.filter((r) => r !== resolvedDomain) || [],
    repo: repoDir,
    worker,
    prodUrl,
    liveUrl,
    dnsStatus: mani.dnsStatus || row.dnsStatus || (facts.wr?.routes?.length ? 'unknown' : 'workers-dev-only'),
    framework: mani.framework || row.framework || facts.framework,
    packageManager: mani.packageManager || row.packageManager || facts.pm,
    buildCmd: mani.buildCmd || row.buildCmd || facts.scripts.buildCmd,
    checkCmd: mani.checkCmd || row.checkCmd || facts.scripts.checkCmd,
    testCmd: mani.testCmd || row.testCmd || facts.scripts.testCmd,
    deployCmd: mani.deployCmd || row.deployCmd || facts.scripts.deployCmd,
    deployNoBuildCmd: mani.deployNoBuildCmd || facts.scripts.deployNoBuild,
    healthPath: mani.healthPath || row.healthPath || '/api/health',
    deployProvider: mani.deployProvider || row.deployProvider || reg.defaults.deployProvider || 'cloudflare',
    notes: mani.notes || row.notes || null,
    source,
  };
  target.verifyUrl = deriveVerifyUrl(target);
  return target;
}

function resolveTarget(query) {
  const reg = loadRegistry();
  if (!query) {
    const repoDir = findRepoRoot(process.cwd());
    return buildTarget(reg, { repoDir, domain: null });
  }
  if (isDomain(query)) {
    const row = registryRowFor(reg, { domain: query });
    if (row?.repo && existsSync(expandHome(row.repo))) return buildTarget(reg, { repoDir: expandHome(row.repo), domain: query });
    const found = discoverRepoForDomain(reg, query);
    if (found) return buildTarget(reg, { repoDir: found.repoDir, domain: query });
    return { domain: query, repo: null, source: ['unresolved'], error: `No repo found for ${query}. Add it via /claude-bootstrap or sites.jsonc.` };
  }
  // treat as a path
  const repoDir = findRepoRoot(expandHome(query));
  return buildTarget(reg, { repoDir, domain: null });
}

// ── risk classifier ────────────────────────────────────────────────────────────
const HIGH_INTENT = /\b(auth|login|logout|signin|sign-in|session|password|oauth|token|secret|payment|donat|billing|checkout|charge|refund|invoice|subscription|migration|migrate|schema|drop\s+table|alter\s+table|cron|webhook|security|csp|permission|role|encrypt|delete|wipe|purge|rotate|dns|cutover)\b/i;
const HIGH_PATH = /(worker\/(auth|admin|ops|flows|emails|chat)|migrations?\/|\/login|\/account|\/admin|wrangler\.toml|\.sql$|secrets?|feature-flags?)/i;
const FAST_INTENT = /\b(favicon|icon|logo|colou?r|css|style|styling|spacing|margin|padding|font|typograph|copy|wording|text|label|headline|title|hero|gradient|shadow|image|photo|og[- ]?image|alt text|border|rounded)\b/i;
const FAST_PATH = /(src\/(pages|components)\/|src\/index\.css$|public\/|\.css$|\.svg$|\.png$|\.jpe?g$|\.webp$|\.ico$|\.avif$)/i;
const RISKY_TOUCH = /(worker\/|migrations?\/|\.sql$|wrangler\.toml|package\.json|\.env)/i;

function classifyRisk(intent = '', files = []) {
  const reasons = [];
  const hiFiles = files.filter((f) => HIGH_PATH.test(f));
  const riskyFiles = files.filter((f) => RISKY_TOUCH.test(f));
  const fastFiles = files.filter((f) => FAST_PATH.test(f));
  const highIntent = HIGH_INTENT.test(intent);
  const fastIntent = FAST_INTENT.test(intent);

  let lane = 'normal';
  if (highIntent || hiFiles.length) {
    lane = 'high';
    if (highIntent) reasons.push(`intent matches high-risk domain (auth/payment/schema/security)`);
    if (hiFiles.length) reasons.push(`touches sensitive paths: ${hiFiles.join(', ')}`);
  } else if (fastIntent && files.every((f) => FAST_PATH.test(f)) && riskyFiles.length === 0) {
    lane = 'fast';
    reasons.push('presentational change: static/style/asset only, no worker/schema/config');
    if (fastFiles.length) reasons.push(`files: ${fastFiles.join(', ')}`);
  } else if (fastIntent && files.length === 0) {
    lane = 'fast';
    reasons.push('presentational intent, no files known yet (recon will confirm)');
  } else {
    reasons.push('default lane: behavior change without high-risk signals');
    if (riskyFiles.length) reasons.push(`note: touches ${riskyFiles.join(', ')} — escalate to high if auth/schema logic`);
  }

  const plans = {
    fast: {
      tests: 'targeted only: tsc on changed area + directly-related unit test (skip full suite)',
      build: 'required if asset/bundle changes; skip for content-only if provider serves it',
      breakpoints: [1280, 390],
      browser: 'single warm session — screenshot + assert changed element',
      e2e: false,
      preserveRollback: false,
      guardProdData: false,
    },
    normal: {
      tests: 'unit for changed modules + targeted E2E on changed routes',
      build: 'required',
      breakpoints: [1920, 1280, 768, 390],
      browser: 'before/after screenshots on changed routes',
      e2e: 'changed routes',
      preserveRollback: true,
      guardProdData: false,
    },
    high: {
      tests: 'FULL check + worker-runtime tests + failing-test-first regression for the change',
      build: 'required',
      breakpoints: [1920, 1280, 1024, 768, 390, 375],
      browser: 'full before/after + console-error + a11y smoke; verify NO prod-data mutation',
      e2e: 'full suite + new regression spec',
      preserveRollback: true,
      guardProdData: true,
    },
  };
  return { lane, reasons, verify: plans[lane] };
}

// ── cache invalidation planner ──────────────────────────────────────────────────
function invalidationPlan(files = []) {
  const isAsset = (f) => /(public\/|favicon|\.svg$|\.png$|\.ico$|\.jpe?g$|\.webp$|\.avif$|site\.webmanifest|manifest\.json)/i.test(f);
  const isSW = (f) => /(^|\/)(sw|service-worker)\.js$/i.test(f);
  const isHtmlRoute = (f) => /(src\/(pages|app)\/|index\.html$|\.tsx$|\.jsx$)/i.test(f);
  const isHashed = (f) => /(assets\/|\/dist\/assets)/i.test(f) && /\.[a-f0-9]{8,}\./i.test(f);

  const steps = [];
  const hasAsset = files.some(isAsset);
  const hasSW = files.some(isSW);
  const hasRoute = files.some(isHtmlRoute);

  if (files.length === 0 || files.every(isHashed)) {
    steps.push({ strategy: 'none', why: 'content-hashed assets change filename on build — new URL, no purge needed' });
  }
  if (hasAsset) {
    steps.push({
      strategy: 'versioned-asset + specific-url purge',
      why: 'browsers cache favicons/static assets aggressively; version the reference (?v=hash) AND purge the exact URL(s)',
      urls: files.filter(isAsset).map((f) => '/' + f.replace(/^.*public\//, '').replace(/^\.?\//, '')),
    });
  }
  if (hasSW) {
    steps.push({ strategy: 'bump service-worker CACHE_VERSION', why: 'stale SW serves old assets offline; bump invalidates every SW cache atomically', file: 'public/sw.js' });
  }
  if (hasRoute) {
    steps.push({ strategy: 'purge changed route URLs (or SPA shell)', why: 'HTML/SSR shell may be edge-cached; purge affected paths only', note: 'SPA index shell short TTL — usually revalidates fast' });
  }
  steps.push({ rule: 'NEVER purge-everything for a scoped change; prefer hashed > versioned > cache-tag > url > prefix > hostname > purge-all (last resort)' });
  return { files, steps };
}

// ── HTTP verify (fast lane, deterministic) ──────────────────────────────────────
async function verify(url, { status = 200, asset, contains } = {}) {
  const checks = [];
  let ok = true;
  try {
    const res = await fetch(url, { headers: REAL_HEADERS, redirect: 'follow' });
    const body = await res.text();
    const statusOk = res.status === status;
    checks.push({ name: 'status', expected: status, got: res.status, pass: statusOk });
    ok = ok && statusOk;

    const csp = res.headers.get('content-security-policy');
    checks.push({ name: 'security-headers', hsts: !!res.headers.get('strict-transport-security'), csp: !!csp, pass: true });

    if (contains) {
      const found = body.includes(contains);
      checks.push({ name: 'body-contains', needle: contains, pass: found });
      ok = ok && found;
    }
    if (asset) {
      const assetUrl = new URL(asset, url).href;
      const ar = await fetch(assetUrl, { headers: REAL_HEADERS, redirect: 'follow' });
      const aok = ar.status === 200;
      checks.push({ name: 'asset', url: assetUrl, got: ar.status, contentType: ar.headers.get('content-type'), pass: aok });
      ok = ok && aok;
    }
  } catch (e) {
    ok = false;
    checks.push({ name: 'fetch', error: e.message, pass: false });
  }
  return { ok, url, checks };
}

// ── doctor ──────────────────────────────────────────────────────────────────────
function doctor() {
  const reg = loadRegistry();
  return {
    ccctlVersion: VERSION,
    registryPath: REGISTRY_PATH,
    registrySites: reg.sites.map((s) => s.domain),
    repoRoots: repoRoots(reg),
    node: process.version,
    hasFetch: typeof fetch === 'function',
    env: {
      CLOUDFLARE_API_KEY: !!process.env.CLOUDFLARE_API_KEY,
      CLOUDFLARE_EMAIL: !!process.env.CLOUDFLARE_EMAIL,
      CLOUDFLARE_API_TOKEN: !!process.env.CLOUDFLARE_API_TOKEN,
    },
    note: 'ProjectSites MCP / Cloudflare MCP live in the /ship skill layer, not this CLI.',
  };
}

// ── arg parsing + dispatch ───────────────────────────────────────────────────────
function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      flags[key] = val;
    } else positional.push(a);
  }
  return { positional, flags };
}
const envelope = (cmd, extra) => ({ ok: extra.error ? false : true, meta: { cmd, cwd: process.cwd(), generated_at: new Date().toISOString(), version: VERSION }, ...extra });
const out = (obj) => process.stdout.write(JSON.stringify(obj, null, 2) + '\n');

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { positional, flags } = parseArgs(rest);
  const files = flags.files ? String(flags.files).split(',').map((s) => s.trim()).filter(Boolean) : [];

  switch (cmd) {
    case 'resolve': {
      const target = resolveTarget(positional[0]);
      out(envelope('resolve', { target, error: target.error }));
      break;
    }
    case 'classify': {
      out(envelope('classify', { intent: positional[0] || '', files, ...classifyRisk(positional[0] || '', files) }));
      break;
    }
    case 'plan': {
      // plan [domain] "<intent>" — if only one positional and it's not a domain, it's the intent.
      let domain = null, intent = positional[0] || '';
      if (positional.length >= 2) { domain = positional[0]; intent = positional.slice(1).join(' '); }
      else if (positional[0] && isDomain(positional[0])) { domain = positional[0]; intent = ''; }
      const target = resolveTarget(domain);
      const risk = classifyRisk(intent, files);
      const cache = invalidationPlan(files);
      out(envelope('plan', { intent, target, risk, cache, error: target.error }));
      break;
    }
    case 'invalidation-plan':
      out(envelope('invalidation-plan', invalidationPlan(files)));
      break;
    case 'verify': {
      const url = positional[0];
      if (!url) { out(envelope('verify', { error: 'usage: ccctl verify <url> [--status N] [--asset /p] [--contains "s"]' })); process.exitCode = 2; break; }
      const r = await verify(url, { status: flags.status ? Number(flags.status) : 200, asset: flags.asset || undefined, contains: flags.contains || undefined });
      out(envelope('verify', r));
      if (!r.ok) process.exitCode = 1;
      break;
    }
    case 'doctor':
      out(envelope('doctor', doctor()));
      break;
    default:
      out(envelope('help', {
        usage: [
          'ccctl resolve [domain|repoPath]',
          'ccctl classify "<intent>" --files a,b',
          'ccctl plan [domain] "<intent>" --files a,b',
          'ccctl invalidation-plan --files a,b',
          'ccctl verify <url> [--status 200] [--asset /favicon.svg] [--contains "text"]',
          'ccctl doctor',
        ],
      }));
      if (cmd && cmd !== 'help') process.exitCode = 2;
  }
}
main().catch((e) => { log('ccctl fatal:', e.stack || e.message); process.exit(1); });
