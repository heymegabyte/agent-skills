#!/usr/bin/env python3
"""Read-only file-backed skill inventory; never reads OAuth or contacts a service.

Sources checked 2026-10-09:
https://docs.openclaw.ai/tools/skills (workspace > project .agents > personal
.agents > managed > workshop > bundled > extraDirs/plugin; same-name wins).
https://agentskills.io/specification (required name/description; descriptions
1..1024 characters; progressive disclosure loads bodies only on activation).

This inventories known host roots, NOT OpenClaw's live eligibility/snapshot,
plugins, bundled catalog or configured allowlists. Canonical extra directories
are recommendations, not proof of Gateway loading. Folder/name mismatches are
portability warnings: OpenClaw permits grouped organization by metadata name.
The dependency-free metadata reader supports ordinary single-line YAML strings
and literal/folded block scalars for required fields, not general YAML.
"""
import argparse
import json
import math
import re
from pathlib import Path

IGNORED = {'.git', 'node_modules', '__pycache__', '.venv', '.cache'}


def metadata(path):
    lines = path.read_text(encoding='utf-8').splitlines()
    if not lines or lines[0].strip() != '---':
        raise ValueError('missing YAML frontmatter')
    try:
        end = lines.index('---', 1)
    except ValueError:
        raise ValueError('unterminated YAML frontmatter') from None
    fields = {}
    for i, line in enumerate(lines[1:end], 1):
        m = re.match(r'^(name|description):\s*(.*?)\s*$', line)
        if not m:
            continue
        key, value = m.groups()
        if key in fields:
            raise ValueError('duplicate required field: ' + key)
        if value in ('|', '>', '|-', '>-', '|+', '>+'):
            block = []
            for following in lines[i + 1:end]:
                if following and not following[0].isspace():
                    break
                block.append(following.strip())
            value = ('\n' if value.startswith('|') else ' ').join(block).strip()
        elif value.startswith('"'):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise ValueError('unsupported quoted scalar: ' + key) from None
        elif value.startswith("'") and value.endswith("'"):
            value = value[1:-1].replace("''", "'")
        else:
            value = value.split(' #', 1)[0].strip()
            if value.startswith(('[', '{', '&', '*', '!')) or value in ('null', '~', 'true', 'false'):
                raise ValueError('required field must be a string: ' + key)
        fields[key] = value
    name, description = fields.get('name', ''), fields.get('description', '')
    if not isinstance(name, str) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', name) or len(name) > 64:
        raise ValueError('name must be a nonempty lowercase kebab-case string, at most 64 characters')
    if not isinstance(description, str) or not 1 <= len(description) <= 1024:
        raise ValueError('description must contain 1..1024 characters')
    return name, description


def scan(root, source, canonical, issues):
    entries = []
    def walk(directory, depth, ancestors):
        if directory.is_symlink() and not directory.exists():
            issues.append({'severity': 'error', 'code': 'dangling-link', 'path': str(directory), 'source': source})
            return
        if not directory.is_dir():
            return
        resolved = directory.resolve()
        if resolved in ancestors:
            issues.append({'severity': 'error', 'code': 'symlink-cycle', 'path': str(directory), 'source': source})
            return
        skill = directory / 'SKILL.md'
        if skill.is_symlink() and not skill.exists():
            issues.append({'severity': 'error', 'code': 'dangling-link', 'path': str(skill), 'source': source})
            return
        if skill.is_file():
            try:
                name, description = metadata(skill)
                entry = {'name': name, 'description': description, 'path': str(skill),
                         'resolvedPath': str(skill.resolve()), 'source': source,
                         'canonical': skill.resolve().is_relative_to(canonical.resolve()),
                         'descriptionBytes': len(description.encode('utf-8'))}
                entries.append(entry)
                if name != directory.name:
                    issues.append({'severity': 'warning', 'code': 'portable-directory-name-mismatch', 'path': str(skill), 'name': name})
            except (ValueError, OSError, UnicodeError) as exc:
                issues.append({'severity': 'error', 'code': 'invalid-metadata', 'path': str(skill), 'detail': str(exc)})
            return
        if depth >= 6:
            return
        try:
            children = sorted(directory.iterdir())
        except OSError as exc:
            issues.append({'severity': 'error', 'code': 'unreadable-root', 'path': str(directory), 'detail': str(exc)})
            return
        for child in children:
            if child.name not in IGNORED:
                walk(child, depth + 1, ancestors | {resolved})
    walk(root, 0, set())
    return entries


def precedence(layers):
    """Layers highest first; inventory same-name overrides without loading bodies."""
    winners, overrides = {}, []
    for entries in layers:
        for entry in entries:
            name = entry['name']
            if name in winners:
                overrides.append({'name': name, 'winner': winners[name]['path'], 'shadowed': entry['path']})
            else:
                winners[name] = entry
    return list(winners.values()), overrides


def diagnose(root, home):
    issues = []
    canonical = scan(root, 'canonical', root, issues)
    if not canonical:
        issues.append({'severity': 'error', 'code': 'empty-canonical-source', 'path': str(root)})
    roots = {'codex': home / '.codex/skills', 'claude-default': home / '.claude/skills',
             'opencode': home / '.config/opencode/skills', 'openclaw-managed': home / '.openclaw/skills',
             'personal-agents': home / '.agents/skills'}
    registry = home / '.claw-router/config.json'
    if registry.exists():
        try:
            data = json.loads(registry.read_text())
            for account in data.get('accounts', []):
                # Only safe account identity/path fields are inspected or emitted.
                if account.get('provider') == 'claude' and isinstance(account.get('configDir'), str):
                    name = account.get('name')
                    if isinstance(name, str):
                        profile = Path(account['configDir'].replace('~/', str(home) + '/', 1))
                        roots['claude-profile:' + name] = profile / 'skills'
        except (OSError, ValueError, TypeError, AttributeError):
            issues.append({'severity': 'error', 'code': 'invalid-router-registry'})
    runtimes = {}
    for label, path in roots.items():
        entries = scan(path, label, root, issues)
        winning, collisions = precedence([entries])
        runtimes[label] = {'root': str(path), 'exists': path.exists(), 'skills': winning,
                           'sameRootCollisions': collisions, 'canonicalCount': sum(e['canonical'] for e in winning)}
        if label.startswith(('codex', 'claude', 'opencode')) and not entries:
            issues.append({'severity': 'warning', 'code': 'no-runtime-skills', 'runtime': label, 'path': str(path)})
    openclaw, overrides = precedence([runtimes['personal-agents']['skills'], runtimes['openclaw-managed']['skills'], canonical])
    total_bytes = sum(e['descriptionBytes'] for e in canonical)
    return {'schemaVersion': 1, 'ok': not any(i['severity'] == 'error' for i in issues),
            'canonical': {'repository': 'heymegabyte/agent-skills', 'root': str(root.resolve()), 'skills': canonical},
            'runtimes': runtimes, 'openclawKnownGlobalPrecedence': {'skills': openclaw, 'overrides': overrides,
                'scope': 'personal-agents > managed > proposed canonical extraDirs; live configuration, workspace, bundled and plugin roots not inspected'},
            'descriptionBudget': {'skillCount': len(canonical), 'utf8Bytes': total_bytes,
                'approxTokens': math.ceil(total_bytes / 4), 'estimateMethod': 'UTF-8 bytes / 4; not a tokenizer or measured prompt usage'},
            'issues': issues}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument('--home', type=Path, default=Path.home())
    args = parser.parse_args()
    result = diagnose(args.root, args.home)
    print(json.dumps(result, indent=2))
    return 0 if result['ok'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
