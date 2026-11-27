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
SCOPE = {
    'oneprompt.site', 'theme.tools', 'ui.theme.tools', 'desktop.management',
    'inbox.vision', 'pdf.kitchen', 'status.charity',
}
RULE_OWNERS = {
    'rules/platform-shared-capabilities.md': ('platform', '2026-10-31'),
    'rules/theme-tools-canonical-components.md': ('design', '2026-10-31'),
    'rules/total-convergence-and-openspec-handoff.md': ('core', '2026-11-04'),
    'rules/platform-agent-ui.md': ('platform', '2026-10-31'),
    'rules/platform-knowledge-integrations.md': ('platform', '2026-10-31'),
    'rules/platform-content-media.md': ('platform', '2026-10-31'),
}
RULES = list(RULE_OWNERS)
PACKS = {pack: f'_packs/{pack}.yml' for pack, _ in RULE_OWNERS.values()}
ENTRYPOINTS = ('AGENTS.md', 'control-plane/RUNTIME.md')


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
    if type(manifest.get('schemaVersion')) is not int or manifest['schemaVersion'] != 2:
        errors.append('Unsupported policy schemaVersion')
    scope = manifest.get('scope')
    if not isinstance(scope, list) or not all(isinstance(entry, str) for entry in scope) or (
        len(scope) != len(SCOPE) or set(scope) != SCOPE
    ):
        errors.append('Product scope drift')
    if manifest.get('migrationSources') != ['projectsites.dev']:
        errors.append('Migration source drift')
    if manifest.get('pack') != PACKS['platform']:
        errors.append('Platform pack path drift')
    if manifest.get('rules') != RULES:
        errors.append('Required policy modules drift')
    for key, value in EXPECTED.items():
        if manifest.get('choices', {}).get(key) != value:
            errors.append(f'Mandatory choice drift: {key}')
    memberships = {
        pack: re.findall(r'^\s*-\s+(rules/[\w-]+)\s*$', read(path), re.M)
        for pack, path in PACKS.items()
    }
    for path, (pack, review_date) in RULE_OWNERS.items():
        text = read(path)
        if not re.search(rf'^pack:\s*["\']?{pack}["\']?\s*$', text, re.M):
            errors.append(f'{path}: wrong or missing pack')
        member_count = memberships[pack].count(path[:-3])
        if member_count == 0:
            errors.append(f'{path}: absent from {pack} pack')
        elif member_count > 1:
            errors.append(f'{path}: duplicate in {pack} pack')
        if not re.search(rf'^last_reviewed:\s*["\']?{review_date}["\']?\s*$', text, re.M):
            errors.append(f'{path}: missing review provenance')
    for member in memberships['platform']:
        if member + '.md' not in RULE_OWNERS or RULE_OWNERS[member + '.md'][0] != 'platform':
            errors.append(f'{member}: unexpected platform pack member')
            read(member + '.md')
    referenced = ['reference/platform-stack.json']
    for key in ('prompt', 'research', 'upstream'):
        path = manifest.get(key)
        if not isinstance(path, str) or not path:
            errors.append(f'Missing {key} path')
        else:
            referenced.append(path)
            read(path)
    distribution = manifest.get('distributionFiles', [])
    if not isinstance(distribution, list) or not all(isinstance(path, str) for path in distribution):
        errors.append('Invalid distributionFiles')
        distribution = []
    for path in referenced:
        if path not in distribution:
            errors.append(f'Policy distributionFiles omits {path}')
    for path in ENTRYPOINTS:
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
    needed = [*RULES, *PACKS.values(), *ENTRYPOINTS, 'scripts/check-platform-policy.py',
              *dict.fromkeys(referenced + distribution)]
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
