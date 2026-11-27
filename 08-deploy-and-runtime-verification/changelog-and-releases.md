---
name: "Changelog and Releases"
version: "1.1.0"
updated: "2026-04-23"
description: "Auto-generate changelog from conventional commits. Public /changelog page, GitHub Releases, semver rules, social announcement on minor+ releases."
---

# Changelog and Releases

## Conventional Commits

All commits should follow conventional commits format:

```
feat: add donation progress bar
fix: contact form validation on mobile
docs: update README with new features
perf: compress hero image to 150KB
chore: update dependencies
```

### Commit Types

- **`feat`** — New feature — shows in changelog as "New"
- **`fix`** — Bug fix — shows in changelog as "Fixed"
- **`perf`** — Performance improvement — shows in changelog as "Improved"
- **`docs`** — Documentation — NOT in changelog
- **`chore`** — Maintenance — NOT in changelog
- **`refactor`** — Code restructure — NOT in changelog
- **`test`** — Tests — NOT in changelog

## Auto-Generate Changelog

```bash
# Using git log (no dependencies)
git log --pretty=format:"%h %s (%an, %ar)" --since="30 days ago" | \
  grep -E "^[a-f0-9]+ (feat|fix|perf):" | \
  sed 's/feat:/✨/; s/fix:/🐛/; s/perf:/⚡/'
```

### Changelog Page (/changelog)

```typescript
app.get('/changelog', async (c) => {
  // Read from a changelog.json or D1 table
  const entries = await getChangelogEntries(c.env);
  return c.html(renderChangelog(entries));
});
```

## GitHub Releases

```bash
# Create a release after significant deploys
gh release create v1.2.0 --title "v1.2.0 — Donation Progress Bars" --notes "$(cat <<'EOF'
## What's New
- ✨ Real-time donation progress bar with Stripe webhooks
- ✨ Multi-language support (EN + ES)

## Fixed
- 🐛 Contact form validation on mobile Safari
- 🐛 OG image not showing on LinkedIn

## Improved
- ⚡ Hero image compressed from 400KB to 150KB
- ⚡ Lighthouse score: 72 → 91
EOF
)"
```

## Package Artifact Qualification

Generate the qualification receipt from the clean release revision. Compare the
revision, package versions, archive filenames, and archive digests before
attestation or upload. For a registry that accepts prebuilt tarballs, rehearse
the exact artifacts with the pinned package manager and explicit destination.
Treat a dry run as evidence of local archive acceptance and routing. After an
authorized publish, verify the registry archive digest and install the exact
version in a clean consumer before recording adoption.

For an installed release toolchain that includes the clean-checkout gate, run
`theme-verify-release-head <full-git-sha>` after build and verification and
immediately before deployment. It checks local `HEAD`, remote `origin/main`,
and Git-visible changes, including untracked files and dirty submodules.
Qualify ignored build outputs separately and verify the deployed revision and
response contracts with the project's production probes.

For a consumer using vendored npm archives, run the installed
`theme-verify-npm-archives` to match archive bytes to the lockfile's SHA-512
integrity. Use a qualified version with physical path validation when the
consumer requires self-contained releases. Keep the regular tarballs at their
declared paths under `vendor/theme-tools`. Record source qualification,
consumer installation, and live verification according to the evidence
actually obtained.

Before uploading to Nexus, check every qualified package version against the
hosted repository. For `theme.tools`, run `pnpm package:release:check-nexus`
against the qualified archives and receipt. If an existing version has the same
archive integrity, it can be skipped on a retry. If it has different or missing
integrity, resolve the collision with a version allowed by the project release
policy, then rebuild and requalify the affected dependency graph. A metadata
error needs a fresh successful check before publishing.

For a theme.tools registry outage rehearsal, use
`pnpm package:consumer --offline --bundle <directory> --receipt-sha256 <digest>`.
Use the receipt digest recorded separately during qualification. The
gate checks the receipt, package inventory, and exact archive digests
before installing from the local bundle and a warmed pnpm store.
Record the result as offline consumer evidence. Verify registry access
and publication separately.

## Semantic Versioning

- **Major** (1.0.0 → 2.0.0) — breaking changes, redesign
- **Minor** (1.0.0 → 1.1.0) — new features
- **Patch** (1.0.0 → 1.0.1) — bug fixes

For most Emdash projects: start at 1.0.0, bump minor for features, patch for fixes.

### Version Bump Rules

- Multiple `feat` commits since last release → bump **minor**
- Only `fix` / `perf` commits since last release → bump **patch**
- Any commit with `BREAKING CHANGE:` in body or `!` after type → bump **major**
- Pre-release tags — use `-beta.1`, `-rc.1` for staging / preview deploys

## MCP Tools Available

### GitHub MCP (`mcp__github-mcp__*`)

- **`list_releases`** — list existing releases to determine next version
- **`get_latest_release`** — get the latest release tag for version bumping
- **`get_release_by_tag`** — fetch a specific release's notes
- **`list_tags`** — list all tags to check version history
- **`get_tag`** — get details of a specific tag
- **`list_commits`** — fetch commits since last release for changelog generation
- **`get_commit`** — get details of a specific commit
- **`create_or_update_file`** — update `CHANGELOG.md` in the repo
- **`push_files`** — push changelog + version bump in one commit

## Automated Changelog Generation from Git Log

### Step-by-step workflow

1. **Get latest release tag** — `mcp__github-mcp__get_latest_release` → extract tag name
2. **List commits since that tag** — `mcp__github-mcp__list_commits` with `sha: main` and filter by date
3. **Parse conventional commits** — categorize into `feat` / `fix` / `perf` / `breaking`
4. **Determine version bump** — apply semver rules above
5. **Generate changelog entry** — format as markdown grouped by type
6. **Update CHANGELOG.md** — prepend new entry, push via `mcp__github-mcp__push_files`
7. **Create GitHub Release** — use `gh release create` with generated notes

```typescript
// Parsing conventional commits from git log
function parseCommits(commits: Array<{ message: string; sha: string; author: string }>) {
  const categories = { feat: [], fix: [], perf: [], breaking: [] };
  for (const c of commits) {
    const match = c.message.match(/^(feat|fix|perf|docs|chore|refactor|test)(!?):\s*(.+)/);
    if (!match) continue;
    const [, type, bang, description] = match;
    if (bang === '!' || c.message.includes('BREAKING CHANGE:')) {
      categories.breaking.push({ description, sha: c.sha.slice(0, 7) });
    }
    if (type in categories) {
      categories[type].push({ description, sha: c.sha.slice(0, 7) });
    }
  }
  return categories;
}
```

## Acceptance Criteria

1. Every `feat` / `fix` / `perf` commit appears in changelog — diff changelog against git log, zero missing entries
2. Version follows semver rules — parse version string, verify bump type matches commit types
3. GitHub Release exists for every minor+ version — `mcp__github-mcp__list_releases` count matches expected releases
4. Release notes match changelog entry — diff release body against `CHANGELOG.md` section, identical content
5. `/changelog` page renders correctly — Playwright screenshot shows formatted entries, no empty state
6. Changelog page has valid date ordering — entries sorted newest-first, no date inversions
7. Social announcement fires for minor+ releases — 09/social-automation triggered, post confirmed on at least 2 platforms
8. No `docs` / `chore` / `refactor` / `test` commits leak into changelog — parse changelog, only `feat` / `fix` / `perf` / `breaking` entries present
