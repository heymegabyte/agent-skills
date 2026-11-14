#!/usr/bin/env python3
"""Create a Cloudflare Worker VERSION PREVIEW for an agent's change (estate idea #4).

Reframed for the main-only fleet (agents fast-forward main — no PR branches): instead of per-branch
preview envs, use Worker **version previews**. ``wrangler versions upload`` uploads a new version
WITHOUT changing the active production deployment and — when ``preview_urls`` is enabled — mints a
Version Preview URL (``<version-prefix>-<worker>.<subdomain>.workers.dev``) plus, with
``--preview-alias``, a stable alias URL. This gives the fleet a prod-like URL to REVIEW an agent's
change before ``wrangler versions deploy`` promotes it to production.

This helper runs the upload, parses the version id + preview URLs from wrangler's output, and emits
JSON for the run record so a reviewer (or the approval-inbox, idea #7) can open the preview. Fail-soft.
Pairs with the no-op guard (#1) + cost rollup (#2): every change is previewable before it ships.
Verified live on megabyte-os-mcp-server (fire-17): alias URL served the worker 200 while prod was
untouched.
"""
import argparse
import json
import re
import subprocess
import sys

VERSION_ID = re.compile(r'Worker Version ID:\s*(\S+)')
PREVIEW_URL = re.compile(r'Version Preview URL:\s*(\S+)')
ALIAS_URL = re.compile(r'Version Preview Alias URL:\s*(\S+)')


def parse_stdout(text):
    """Extract the version id + preview URLs from `wrangler versions upload` output (stdout/stderr)."""
    def first(rx):
        match = rx.search(text or '')
        return match.group(1) if match else None
    return {'versionId': first(VERSION_ID), 'previewUrl': first(PREVIEW_URL), 'aliasUrl': first(ALIAS_URL)}


def upload_preview(worker_dir, alias=None, wrangler='wrangler'):
    """Upload a preview version (no prod change) and return {versionId, previewUrl, aliasUrl, reviewUrl, ok}."""
    cmd = ['npx', '--no-install', wrangler, 'versions', 'upload']
    if alias:
        cmd += ['--preview-alias', alias]
    try:
        result = subprocess.run(cmd, cwd=worker_dir, capture_output=True, text=True, timeout=300)
    except Exception as error:
        return {'worker_dir': str(worker_dir), 'ok': False, 'error': str(error)}
    parsed = parse_stdout((result.stdout or '') + '\n' + (result.stderr or ''))
    return {
        'worker_dir': str(worker_dir), 'exitCode': result.returncode, **parsed,
        'reviewUrl': parsed['aliasUrl'] or parsed['previewUrl'],
        'ok': result.returncode == 0 and bool(parsed['versionId']),
        'stderrTail': (result.stderr or '').strip().splitlines()[-3:] if result.returncode else [],
    }


def main():
    parser = argparse.ArgumentParser(description='Worker version-preview URL for pre-promote review (idea #4).')
    parser.add_argument('--dir', required=True, help='worker directory containing wrangler.jsonc')
    parser.add_argument('--alias', help='stable preview alias (e.g. the run id or branch name)')
    args = parser.parse_args()
    report = upload_preview(args.dir, args.alias)
    print(json.dumps(report, indent=2))
    return 0 if report.get('ok') else 1


if __name__ == '__main__':
    sys.exit(main())
