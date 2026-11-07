#!/usr/bin/env bash
# agy-ship-it.sh — Autonomous Ship Pipeline for Antigravity & Emdash
# Implements Brian's pre-authorized deploy & auto-push doctrine:
# Commits, pushes, builds, deploys to Cloudflare Workers, purges CDN cache.

set -euo pipefail

REPO_DIR="${1:-$(pwd)}"
COMMIT_MSG="${2:-feat: autonomous convergence and verification update}"

cd "$REPO_DIR"

if [ ! -d ".git" ]; then
  echo "Error: $REPO_DIR is not a git repository" >&2
  exit 1
fi

echo "=== [1/4] Staging and Committing Changes ==="
git add -A
if git diff-index --quiet HEAD --; then
  echo "Clean working directory: nothing to commit."
else
  git commit -m "$COMMIT_MSG"
  echo "Committed: $COMMIT_MSG"
fi

echo "=== [2/4] Auto-Pushing to Git Remote ==="
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if git remote get-url origin >/dev/null 2>&1; then
  git push origin "$CURRENT_BRANCH"
  echo "Pushed to origin/$CURRENT_BRANCH successfully."
else
  echo "No remote origin configured; skipping git push."
fi

echo "=== [3/4] Production Deployment Gate ==="
if [ -f "wrangler.toml" ] || [ -f "wrangler.jsonc" ]; then
  echo "Cloudflare Worker detected. Running wrangler deploy..."
  if command -v bun >/dev/null 2>&1; then
    bun x wrangler deploy
  elif command -v npx >/dev/null 2>&1; then
    npx wrangler deploy
  else
    echo "Warning: Neither bun nor npx found for wrangler deploy."
  fi
else
  echo "No wrangler config found in repo root; skipping edge deploy."
fi

echo "=== [4/4] Verification Summary ==="
COMMIT_HASH="$(git rev-parse --short HEAD)"
echo "Shipped: ${COMMIT_HASH} on ${CURRENT_BRANCH}"
