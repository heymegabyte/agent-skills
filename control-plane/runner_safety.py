"""Audit runner hooks without reading or emitting secret values."""
import argparse
import json
from pathlib import Path
import shlex


def audit(ai, repair=False):
    findings = []
    for directory in sorted((ai / 'runners').glob('worker-*')):
        envfile = directory / '.env'
        if not envfile.is_file():
            continue
        lines = envfile.read_text().splitlines()
        keep = []
        for line in lines:
            key, separator, raw = line.partition('=')
            unsafe = False
            if separator and key in ('ACTIONS_RUNNER_HOOK_JOB_STARTED', 'ACTIONS_RUNNER_HOOK_JOB_COMPLETED'):
                try:
                    words = shlex.split(raw)
                    hook = Path(words[0]) if len(words) == 1 else None
                    text = hook.read_text() if hook and hook.is_file() else ''
                    unsafe = 'GITHUB_ENV' in text and 'infisical export' in text
                except (OSError, ValueError):
                    unsafe = False
                if unsafe:
                    findings.append({'runner': directory.name, 'environmentKey': key,
                                     'issue': 'bulk-secret-export-to-actions-environment',
                                     'removed': repair, 'restartRequired': repair})
            if not (unsafe and repair):
                keep.append(line)
        if repair and keep != lines:
            envfile.write_text('\n'.join(keep) + '\n')
            envfile.chmod(0o600)
    return {'ok': not findings or repair, 'findings': findings,
            'scope': 'Known bulk Infisical export hooks only; not a sandbox or exhaustive shell audit'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repair', action='store_true', help='Remove known leaking hook references; restart idle runners afterward')
    parser.add_argument('--ai', type=Path, default=Path.home() / 'ai')
    args = parser.parse_args()
    report = audit(args.ai, args.repair)
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report['ok'] else 1)
