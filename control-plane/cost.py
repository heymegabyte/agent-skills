#!/usr/bin/env python3
"""Per-project cost + activity rollup over the fleet's run.json ledger (estate idea #2).

Reads the fleet's canonical per-run records (``AI/logs/*/run.json`` — the ledger ``fleet.py`` writes)
and aggregates, per project: run count, outcomes (success / failure / no-op), duration, the runtimes
used, and compute usage. When run ON the fleet host it also folds in the richer external $ sources
(``clawo runs``, ``openclaw gateway usage-cost``) if their CLIs are present — fail-soft, so it runs
anywhere (locally: the ledger-derived view; on the host: + live $).

Usage aggregation is SHAPE-AGNOSTIC: it sums whatever numeric fields appear in
``compute[].events[].usage`` (tokens, cost, …), so it tracks token/$ spend without hard-coding any
one provider's usage schema. Pairs with the no-op guard (idea #1): a loop that fails RED on hollow
runs + a rollup that shows what each project actually spent = the fleet cost-accountability loop.
"""
import argparse
import json
import os
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

DEFAULT_LOGS = Path(os.environ.get('AI_HOME', Path.home() / 'ai')) / 'logs'


def load_runs(logs_dir):
    records = []
    for path in sorted(Path(logs_dir).glob('*/run.json')):
        try:
            records.append(json.loads(path.read_text()))
        except Exception:
            continue  # a malformed/partial record never breaks the rollup
    return records


def sum_usage(compute):
    """Shape-agnostic: sum numeric fields in compute[].events[].usage (tokens/cost/whatever)."""
    totals = defaultdict(float)
    for entry in compute or []:
        for event in entry.get('events', []):
            usage = event.get('usage')
            if isinstance(usage, dict):
                for key, value in usage.items():
                    if isinstance(value, bool) or not isinstance(value, (int, float)):
                        continue
                    totals[key] += value
    return {key: round(value, 4) for key, value in totals.items()}


def classify(record):
    if record.get('status') == 'success':
        return 'success'
    if record.get('failureCategory') == 'no-op':
        return 'noop'
    if record.get('status') == 'failure':
        return 'failure'
    return record.get('status', 'unknown')


def rollup(records):
    projects = defaultdict(lambda: {'runs': 0, 'success': 0, 'failure': 0, 'noop': 0,
                                    'durationSeconds': 0.0, 'runtimes': defaultdict(int),
                                    'usage': defaultdict(float)})
    for record in records:
        bucket = projects[record.get('project', 'unknown')]
        bucket['runs'] += 1
        outcome = classify(record)
        if outcome == 'success':
            bucket['success'] += 1
        elif outcome == 'noop':
            bucket['noop'] += 1
            bucket['failure'] += 1  # a no-op IS a failed fire — counted in both
        elif outcome == 'failure':
            bucket['failure'] += 1
        bucket['durationSeconds'] += float(record.get('durationSeconds') or 0)
        for entry in record.get('compute', []):
            bucket['runtimes'][entry.get('runtime', 'unknown')] += 1
        for key, value in sum_usage(record.get('compute')).items():
            bucket['usage'][key] += value
    out = {}
    for project, bucket in sorted(projects.items()):
        runs = bucket['runs'] or 1
        out[project] = {
            'runs': bucket['runs'], 'success': bucket['success'], 'failure': bucket['failure'],
            'noop': bucket['noop'], 'successRate': round(bucket['success'] / runs, 3),
            'durationSeconds': round(bucket['durationSeconds'], 1),
            'avgDurationSeconds': round(bucket['durationSeconds'] / runs, 1),
            'runtimes': dict(bucket['runtimes']),
            'usage': {key: round(value, 4) for key, value in bucket['usage'].items()},
        }
    return out


def external_cost():
    """Host-only richer $ sources, fail-soft. Returns {source: data} for whatever is reachable."""
    sources = {}
    probes = {'clawo': ['clawo', 'runs', '--json'],
              'openclaw': ['openclaw', 'gateway', 'usage-cost', '--all', '--json']}
    for name, cmd in probes.items():
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=25)
            if result.returncode == 0 and result.stdout.strip():
                sources[name] = json.loads(result.stdout)
        except Exception:
            continue
    return sources


def render(report):
    lines = ['# Fleet cost + activity', '',
             f"{report['meta']['records']} run record(s) · logs: `{report['meta']['logs']}`", '']
    if report['meta']['records'] == 0:
        lines.append('_No run records found. Run on the fleet host (AI/logs) for live data._')
    else:
        lines.append('| Project | Runs | OK | FAIL | no-op | OK% | avg dur | usage |')
        lines.append('|---|--:|--:|--:|--:|--:|--:|---|')
        for project, bucket in report['byProject'].items():
            usage = ', '.join(f'{k}={v:g}' for k, v in bucket['usage'].items()) or '—'
            lines.append(f"| {project} | {bucket['runs']} | {bucket['success']} | {bucket['failure']} | "
                         f"{bucket['noop']} | {bucket['successRate'] * 100:.0f}% | "
                         f"{bucket['avgDurationSeconds']:g}s | {usage} |")
    if report.get('externalSources'):
        lines += ['', f"External $ sources folded in: {', '.join(report['externalSources'])}"]
    return '\n'.join(lines)


def build(logs_dir, with_external=False):
    records = load_runs(logs_dir)
    report = {'meta': {'logs': str(logs_dir), 'records': len(records)},
              'byProject': rollup(records), 'externalSources': []}
    if with_external:
        ext = external_cost()
        report['externalSources'] = sorted(ext.keys())
        report['external'] = ext
    return report


def main():
    parser = argparse.ArgumentParser(description='Fleet per-project cost + activity rollup (idea #2).')
    parser.add_argument('--logs', default=str(DEFAULT_LOGS))
    parser.add_argument('--json', action='store_true', help='emit JSON on stdout')
    parser.add_argument('--with-external', action='store_true', help='fold in clawo/openclaw $ (host only)')
    args = parser.parse_args()
    report = build(args.logs, args.with_external)
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print(render(report), file=sys.stderr)
        print(json.dumps(report))
    return 0


if __name__ == '__main__':
    sys.exit(main())
