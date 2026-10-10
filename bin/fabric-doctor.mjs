#!/usr/bin/env node
// fabric-doctor.mjs — ONE coherent health surface for the agent tooling fabric
// (mise · Serena · Semgrep · OpenTofu · Infisical/Agent-Vault). Repo-agnostic:
// run it in any worktree via `mise run doctor`. Complements bin/doctor.mjs (which
// checks THIS plugin's self-maintenance: hooks, skills.db, crosslinks).
//
// Usage: node bin/fabric-doctor.mjs [--json] [--quiet] [--only=<section>]
//   sections: toolchain semantic security secrets infrastructure fleet
//
// SECURITY: never prints a secret VALUE. The secrets section reports only
// presence/reachability (binary up? identity configured? snapshot age exposed?).
// Set FABRIC_REQUIRED_SECRETS="A,B,C" to check existence of named keys (names only).
//
// Exit: 0 report (even with warns) · 1 a hard FAIL (required thing broken).

import { execSync } from 'node:child_process';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ARGV = process.argv.slice(2);
const JSON_OUT = ARGV.includes('--json');
const QUIET = ARGV.includes('--quiet');
const ONLY = (ARGV.find((a) => a.startsWith('--only=')) || '').split('=')[1] || '';
const CWD = process.cwd();

const results = [];
// status: pass | warn | skip | fail. Only `fail` affects exit code.
const ICON = { pass: '✅', warn: '🟡', skip: '⚪', fail: '❌' };
function add(section, name, status, detail) {
  results.push({ section, name, status, detail });
}

function sh(cmd, timeout = 8000) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}
const has = (bin) => sh(`command -v ${bin}`) !== null;
const ver = (bin, flag = '--version') => {
  const v = sh(`${bin} ${flag} 2>&1 | head -1`);
  return v || null;
};

const want = (s) => !ONLY || ONLY === s;

// ── toolchain (mise) ────────────────────────────────────────────────────────
if (want('toolchain')) {
  if (has('mise')) {
    add('toolchain', 'mise', 'pass', ver('mise'));
    const lock = resolve(CWD, 'mise.lock');
    const cfg = ['mise.toml', '.mise.toml', '.config/mise/config.toml'].find((f) => existsSync(resolve(CWD, f)));
    if (cfg) {
      add('toolchain', 'mise contract', 'pass', `${cfg} present`);
      add('toolchain', 'lockfile', existsSync(lock) ? 'pass' : 'fail',
        existsSync(lock) ? 'mise.lock committed' : 'mise.lock MISSING (run: mise lock)');
    } else {
      add('toolchain', 'mise contract', 'skip', 'no mise.toml in this repo (legacy — ok during rollout)');
    }
  } else {
    add('toolchain', 'mise', 'warn', 'not installed — curl https://mise.run | sh');
  }
}

// ── semantic (Serena) ────────────────────────────────────────────────────────
if (want('semantic')) {
  const serena = has('serena');
  add('semantic', 'serena', serena ? 'pass' : 'warn',
    serena ? ver('serena') || 'installed' : 'not installed — uv tool install -p 3.13 serena-agent');
  const dotSerena = resolve(CWD, '.serena');
  if (existsSync(resolve(dotSerena, 'project.yml'))) {
    const cache = resolve(dotSerena, 'cache');
    let fresh = 'no index';
    if (existsSync(cache)) {
      try {
        const files = readdirSync(cache, { recursive: true }).map((f) => resolve(cache, f.toString()));
        const newest = Math.max(0, ...files.filter((f) => { try { return statSync(f).isFile(); } catch { return false; } }).map((f) => statSync(f).mtimeMs));
        if (newest) fresh = `${Math.round((Date.now() - newest) / 86400000)}d old`;
      } catch { /* ignore */ }
    }
    add('semantic', 'index', 'pass', `project activated · index ${fresh}`);
  } else {
    add('semantic', 'index', 'skip', 'no .serena/project.yml (not indexed here)');
  }
}

// ── security (Semgrep) ────────────────────────────────────────────────────────
if (want('security')) {
  if (has('semgrep')) {
    add('security', 'semgrep', 'pass', ver('semgrep'));
    const custom = resolve(CWD, 'templates/lint-stack/semgrep-custom');
    const localRules = resolve(CWD, '.semgrep');
    const ruleDir = existsSync(custom) ? custom : existsSync(localRules) ? localRules : null;
    if (ruleDir) {
      // Check semgrep's exit code directly (grep -c throws on 0 matches).
      const ok = sh(`semgrep --validate --config "${ruleDir}" >/dev/null 2>&1; echo $?`) === '0';
      add('security', 'custom rules', ok ? 'pass' : 'fail', ok ? `valid (${ruleDir.replace(CWD + '/', '')})` : 'rule validation FAILED');
    } else {
      add('security', 'custom rules', 'skip', 'no custom rule dir here');
    }
  } else {
    add('security', 'semgrep', 'warn', 'not installed — mise install (pinned)');
  }
}

// ── secrets (Infisical / Agent Vault / get-secret) — NO VALUES ────────────────
if (want('secrets')) {
  add('secrets', 'get-secret', has('get-secret') ? 'pass' : 'warn',
    has('get-secret') ? 'resolver on PATH' : 'not on PATH (chezmoi/Infisical rail not installed here)');
  // Infisical CLI presence + machine-identity configured (NOT the value).
  const infPresent = has('infisical');
  const infAuth = process.env.INFISICAL_TOKEN ? 'identity configured' : 'no INFISICAL_TOKEN in env';
  add('secrets', 'infisical', infPresent ? 'pass' : 'skip', infPresent ? infAuth : 'CLI absent (fine on dev Macs using chezmoi)');
  // Agent Vault broker reachability via its advertised addr — never a credential.
  const addr = process.env.AGENT_VAULT_ADDR || '';
  if (addr) {
    const up = sh(`curl -s -o /dev/null -w '%{http_code}' --max-time 2 "http://${addr.replace(/^https?:\/\//, '')}/" 2>/dev/null`);
    add('secrets', 'agent-vault', up ? 'pass' : 'warn', up ? `broker reachable (${addr})` : `broker set (${addr}) but unreachable`);
    // Honest gap: Agent Vault exposes no last-good snapshot-age; say so.
    add('secrets', 'vault snapshot-age', 'skip', 'not exposed by Agent Vault (known gap — Infisical is a hard dependency)');
  } else {
    add('secrets', 'agent-vault', 'skip', 'AGENT_VAULT_ADDR unset (broker not active in this session)');
  }
  const req = (process.env.FABRIC_REQUIRED_SECRETS || '').split(',').map((s) => s.trim()).filter(Boolean);
  for (const key of req) {
    // existence check only — capture nothing, print only exists/missing
    const exists = has('get-secret') && sh(`get-secret ${key} >/dev/null 2>&1; echo $?`) === '0';
    add('secrets', `required:${key}`, exists ? 'pass' : 'fail', exists ? 'present' : 'MISSING');
  }
}

// ── infrastructure (OpenTofu) ─────────────────────────────────────────────────
if (want('infrastructure')) {
  if (has('tofu')) {
    add('infrastructure', 'opentofu', 'pass', ver('tofu'));
    const roots = (sh(`git ls-files '*.tf' 2>/dev/null | sed 's#/[^/]*$##' | sort -u | grep -v '\\.terraform'`) || '')
      .split('\n').filter(Boolean);
    const managed = roots.filter((r) => !r.includes('templates/'));
    add('infrastructure', 'roots', roots.length ? 'pass' : 'skip',
      roots.length ? `${roots.length} root(s), ${managed.length} managed` : 'none tracked yet (doctrine + templates only)');
    const lock = roots.find((r) => existsSync(resolve(CWD, r, '.terraform.lock.hcl')));
    if (roots.length) add('infrastructure', 'provider lock', lock ? 'pass' : 'warn', lock ? '.terraform.lock.hcl present' : 'no provider lock yet (run: tofu providers lock)');
  } else {
    add('infrastructure', 'opentofu', 'warn', 'not installed — mise install (pinned 1.13.1)');
  }
}

// ── fleet ─────────────────────────────────────────────────────────────────────
if (want('fleet')) {
  add('fleet', 'host', 'pass', `${sh('uname -s')} ${sh('uname -m')} · ${sh('hostname -s') || 'host'}`);
  const gitStatus = sh('git status --porcelain 2>/dev/null');
  add('fleet', 'git', gitStatus === '' ? 'pass' : 'warn',
    gitStatus === '' ? 'clean' : `${gitStatus.split('\n').length} uncommitted`);
}

// ── output ─────────────────────────────────────────────────────────────────────
const summary = { passed: 0, warn: 0, skip: 0, fail: 0, total: results.length };
for (const r of results) summary[r.status] = (summary[r.status] || 0) + 1;
summary.passed = results.filter((r) => r.status === 'pass').length;

if (JSON_OUT) {
  const meta = { timestamp: new Date().toISOString(), cwd: CWD, git_sha: sh('git rev-parse --short HEAD') || null, only: ONLY || null };
  process.stdout.write(JSON.stringify({ meta, results, summary }, null, 2) + '\n');
} else if (!QUIET) {
  let section = '';
  for (const r of results) {
    if (r.section !== section) { section = r.section; console.log(`\n  ${section.toUpperCase()}`); }
    console.log(`   ${ICON[r.status]} ${r.name} — ${r.detail}`);
  }
  console.log(`\n  ${'─'.repeat(52)}`);
  console.log(`  ${summary.passed} pass · ${summary.warn} warn · ${summary.skip} skip · ${summary.fail} fail`);
}

process.exit(summary.fail > 0 ? 1 : 0);
