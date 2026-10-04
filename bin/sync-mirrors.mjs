#!/usr/bin/env node
/**
 * sync-mirrors.mjs — single source of truth for content DUPLICATED across the
 * ~30 per-assistant mirror configs (.cursor / .windsurf / AGENTS.md / GEMINI.md /
 * .goose/recipes / .clinerules / .github/copilot-instructions / … ) plus any
 * doctrine file that inlines the same line.
 *
 * WHY: those mirrors are hand-maintained duplicates, so they DRIFT — the
 * Spartan-only ruling required editing 39 files by hand. This makes the shared
 * bits ONE-edit: change a `canonical` value below, run sync, every target updates.
 *
 * FOSS prior art (per `leverage-FOSS`): lunetics/agent_sync (13 tools),
 * PanisHandsome/ai-rules-sync (zero-dep + git hook). Neither covers this repo's
 * full niche target set AND both overwrite dirs wholesale — so we sync in-repo,
 * borrowing their pattern (managed block + pre-commit --check). If the target set
 * is ever trimmed to a FOSS-covered subset, adopt one of those instead.
 *
 * V1 syncs the one-line STACK signature (the proven drift point). It is
 * format-agnostic (matches the line in md / yaml / mdc / workflow-echo) and
 * preserves each file's prefix/indent + tool-specific content. Extend `MANAGED`
 * with more entries as more shared blocks are identified. (When syncing multi-line
 * blocks later, add the Windsurf 6K-char / Codex 32KiB per-file guards.)
 *
 * Usage:
 *   node bin/sync-mirrors.mjs           # rewrite drifted targets, print report
 *   node bin/sync-mirrors.mjs --check   # exit 1 if any target has drifted (CI/lefthook)
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const SKIP_DIRS = new Set(['.git', 'node_modules', '__pycache__', '.ruff_cache', 'skills', 'archives']);
const SKIP_EXT = /\.(png|jpe?g|gif|ico|woff2?|ttf|otf|pdf|zip|lock|webp|svg)$/i;

// ── CANONICAL managed values — EDIT HERE ONCE; sync propagates everywhere ──
const MANAGED = [
  {
    name: 'stack-line',
    // Matches the stack summary in ANY format/spacing (from "CF Workers" to "Sentry").
    // Two-stack doctrine (CONVENTIONS.md § Stack): React 19+Vite sites / Angular 22+Spartan
    // apps — never Angular-only. Payments trio: Square accept / Stripe Billing / Connect.
    pattern: /CF Workers.*?PostHog\s*\|\s*Sentry/g,
    canonical:
      'CF Workers + Hono | React 19 + Vite + shadcn/ui (sites) / Angular 22 + Spartan UI (apps) | D1/Neon | Drizzle v1 | Clerk | Square + Stripe Billing/Connect | Inngest | Amazon SES | Bun | Playwright v1.59+ | PostHog | Sentry',
  },
  {
    name: 'counts-line',
    // The "N categories, N reference docs, N agents." claim in the thin platform
    // stubs (CODEX.md / GEMINI.md / AMP.md / QODO.MD / replit.md). Keep in step
    // with bin/check-doc-counts.sh derived actuals (gate 14 asserts these files).
    pattern: /\d+ categories, \d+ reference docs, \d+ agents\./g,
    canonical: '23 categories, 149 reference docs, 28 agents.',
  },
  {
    name: 'desc-category-count',
    // The "N-category product-building OS" phrase in mirror frontmatter descriptions
    // (.cursor .mdc / .windsurf / .augment / .goose recipe / publish.yml heredocs).
    pattern: /\d+-category product-building OS/g,
    canonical: '23-category product-building OS',
  },
  {
    name: 'desc-stack',
    // The compact stack descriptor inside those same frontmatter descriptions.
    // Alternation matches both the legacy Angular/Stripe-only form and the canonical.
    pattern:
      /CF Workers\+Hono, (?:Angular|React 19\+Vite \/ Angular 22\+Spartan), D1, Drizzle, Clerk, (?:Stripe|Square\/Stripe)\./g,
    canonical: 'CF Workers+Hono, React 19+Vite / Angular 22+Spartan, D1, Drizzle, Clerk, Square/Stripe.',
  },
  {
    name: 'lint-line',
    // The lint/hooks guardrail bullet in every mirror's Rules block. EXACT literal
    // (no open-ended [^\n]*) so it can never swallow this file's own quotes; the
    // \+ escapes also keep the pattern's source text from matching itself. Does not
    // match _kernel/standards.md ("ESLint 10"). To change the doctrine text, update
    // pattern (add alternation for the old form) AND canonical together.
    pattern: /- Lint: oxlint \+ ESLint \+ Prettier \(never Biome\); lefthook, not husky/g,
    canonical: '- Lint: oxlint + ESLint + Prettier (never Biome); lefthook, not husky',
  },
];

const drifted = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    // 'skills' is only the ROOT submodule checkout — nested dirs named skills
    // (.devin/skills, .agents/skills) are real mirror targets. Unanchored name
    // matching already bit us twice (.gitignore 'skills/', this SKIP set).
    if (SKIP_DIRS.has(name) && (name !== 'skills' || dir === ROOT)) continue;
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) { walk(p); continue; }
    if (SKIP_EXT.test(name)) continue;
    let content;
    try { content = readFileSync(p, 'utf8'); } catch { continue; }
    let out = content;
    for (const m of MANAGED) {
      if (!m.pattern.test(out)) continue;
      m.pattern.lastIndex = 0;
      out = out.replace(m.pattern, m.canonical);
    }
    if (out !== content) {
      drifted.push(relative(ROOT, p));
      if (!CHECK) writeFileSync(p, out);
    }
  }
}
walk(ROOT);

if (CHECK) {
  if (drifted.length) {
    console.error(`✗ sync-mirrors: ${drifted.length} target(s) drifted from canonical — run \`node bin/sync-mirrors.mjs\`:`);
    drifted.forEach((f) => console.error('  ' + f));
    process.exit(1);
  }
  console.log('✓ sync-mirrors: all mirror targets in sync with canonical.');
} else {
  console.log(drifted.length ? `sync-mirrors: updated ${drifted.length} target(s):` : 'sync-mirrors: all targets already in sync.');
  drifted.forEach((f) => console.log('  ' + f));
}
