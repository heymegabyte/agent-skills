#!/usr/bin/env python3
"""Validate the scoped policy's wiring and distribution; not product conformance."""
from __future__ import annotations
import argparse
import fnmatch
import json
from pathlib import Path
import re
import sys

EXPECTED = {
    'builder': 'Bolt.diy', 'agentRuntime': 'Cloudflare Agents',
    'agentUI': 'AG-UI', 'generativeUI': 'json-render', 'interactiveTools': 'MCP Apps',
    'authentication': 'Better Auth', 'knowledge': 'Cloudflare AI Search',
    'richContent': 'PlateJS', 'graphs': 'React Flow', 'video': 'Remotion',
    'secrets': 'Infisical', 'credentialBroker': 'Infisical Agent Vault',
}
SCOPE = {'oneprompt.site', 'theme.tools', 'ui.theme.tools', 'desktop.management', 'inbox.vision', 'pdf.kitchen'}
RULES = ['rules/platform-' + name + '.md' for name in
         ('shared-capabilities', 'agent-ui', 'knowledge-integrations', 'content-media')]


def validate(root: Path) -> list[str]:
    errors: list[str] = []
    def read(path: str) -> str:
        target = (root / path).resolve()
        if not target.is_relative_to(root.resolve()):
            errors.append(f'Path escapes repository: {path}')
            return ''
        try:
            return target.read_text(encoding='utf-8')
        except (OSError, UnicodeError) as exc:
            errors.append(f'{path}: {exc}')
            return ''
    def data(path: str) -> dict:
        try:
            result = json.loads(read(path))
            if not isinstance(result, dict):
                raise ValueError('expected object')
            return result
        except (ValueError, TypeError) as exc:
            errors.append(f'{path}: invalid JSON object ({exc})')
            return {}
    manifest = data('reference/platform-stack.json')
    if manifest.get('schemaVersion') != 1:
        errors.append('Unsupported policy schemaVersion')
    if set(manifest.get('scope', [])) != SCOPE:
        errors.append('Product scope drift')
    if manifest.get('rules') != RULES:
        errors.append('Required policy modules drift')
    for key, value in EXPECTED.items():
        if manifest.get('choices', {}).get(key) != value:
            errors.append(f'Mandatory choice drift: {key}')
    pack = read('_packs/platform.yml')
    members = set(re.findall(r'^\s*-\s+(rules/[\w-]+)\s*$', pack, re.M))
    for path in RULES:
        text = read(path)
        if not re.search(r'^pack:\s*["\']?platform["\']?\s*$', text, re.M):
            errors.append(f'{path}: wrong or missing pack')
        if path[:-3] not in members:
            errors.append(f'{path}: absent from platform pack')
        if '2026-10-31' not in text:
            errors.append(f'{path}: missing review provenance')
    for member in members:
        read(member + '.md')
    for key in ('prompt', 'research', 'upstream'):
        path = manifest.get(key)
        if not isinstance(path, str) or not path:
            errors.append(f'Missing {key} path')
        else:
            read(path)
    for path in ('AGENTS.md', 'control-plane/RUNTIME.md'):
        if 'rules/platform-shared-capabilities.md' not in read(path):
            errors.append(f'{path}: missing scoped policy entrypoint')
    upstream = data('reference/remotion-upstream.json')
    for key in ('commit', 'routerBlob'):
        if not re.fullmatch(r'[0-9a-f]{40}', str(upstream.get(key, ''))):
            errors.append(f'Remotion {key} must be a full immutable SHA')
    if upstream.get('vendored') is not False or upstream.get('integrationMode') != 'reference-and-original-synthesis':
        errors.append('Upstream reuse mode requires explicit review')
    package = data('package.json')
    include = package.get('files', [])
    needed = RULES + ['_packs/platform.yml', 'scripts/check-platform-policy.py'] + manifest.get('distributionFiles', [])
    for path in needed:
        read(path)
        if not any(fnmatch.fnmatchcase(path, pattern) for pattern in include if isinstance(pattern, str)):
            errors.append(f'Distribution excludes {path}')
    if 'check:platform-policy' not in package.get('scripts', {}):
        errors.append('Missing package check:platform-policy command')
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        errors = validate(args.root)
    except (TypeError, AttributeError) as exc:
        errors = [f'Malformed policy field: {exc}']
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1
    print('Platform policy wiring and distribution checks passed; product/runtime conformance not evaluated.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
