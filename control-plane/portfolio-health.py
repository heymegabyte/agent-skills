#!/usr/bin/env python3
"""Read-only, rebuildable fleet observer. GitHub/git remain authoritative."""
import argparse
import datetime as dt
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
AI = Path.home() / 'ai'
STATUSES = {'success', 'failure', 'cancelled', 'running', 'queued', 'timed_out', 'action_required', 'neutral', 'skipped', 'completed', 'in_progress', 'waiting'}


def command(argv):
    try:
        result = subprocess.run(argv, capture_output=True, text=True, timeout=20)
        return result.stdout.strip() if result.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def read_json(path):
    try:
        return json.loads(path.read_text())
    except (OSError, ValueError):
        return None


def timestamp(value):
    if not isinstance(value, str):
        return None
    try:
        return dt.datetime.fromisoformat(value.replace('Z', '+00:00')).astimezone(dt.timezone.utc)
    except ValueError:
        return None


def clean_run(raw, repository, github=False):
    if not isinstance(raw, dict) or (not github and raw.get('project') != repository):
        return None
    started = timestamp(raw.get('createdAt' if github else 'startedAt'))
    if started is None:
        return None
    status = raw.get('conclusion') or raw.get('status')
    if status not in STATUSES:
        return None
    run_id = str(raw.get('databaseId' if github else 'runId', ''))
    if not re.fullmatch(r'[A-Za-z0-9_.-]{1,200}', run_id):
        return None
    result = {'runId': run_id, 'status': status, 'startedAt': started.isoformat(), 'source': 'github' if github else 'local-receipt'}
    url = raw.get('url' if github else 'actionsUrl', '')
    if isinstance(url, str) and re.fullmatch(r'https://github\.com/' + re.escape(repository) + r'/actions/runs/\d+(?:/attempts/\d+)?', url):
        result['url'] = url
    return result


def run_history(repository, logdir, local_only=False):
    runs = []
    for path in logdir.glob('*/run.json'):
        if path.stat().st_size > 200000:
            continue
        item = clean_run(read_json(path), repository)
        if item:
            runs.append(item)
    if not local_only:
        output = command(['gh', 'run', 'list', '--repo', repository, '--workflow', 'run-the-loop.yml', '--limit', '10', '--json', 'databaseId,status,conclusion,createdAt,url'])
        try:
            observed = json.loads(output or 'null')
        except ValueError:
            observed = None
        if isinstance(observed, list):
            runs.extend(item for raw in observed if (item := clean_run(raw, repository, True)))
    # Prefer GitHub for runs present in both sources; local IDs encode GitHub ID/attempt.
    github_ids = {r['runId'] for r in runs if r['source'] == 'github'}
    runs = [r for r in runs if r['source'] == 'github' or not any(re.search(r'-' + re.escape(gid) + r'-[0-9]+$', r['runId']) for gid in github_ids)]
    return sorted(runs, key=lambda r: r['startedAt'], reverse=True)[:10]


def project_health(project, logdir, local_only=False):
    repository = project['repository']
    history = run_history(repository, logdir, local_only)
    streak = 0
    for run in history:
        if run['status'] in {'running', 'queued', 'in_progress', 'waiting'}:
            continue
        if run['status'] not in {'failure', 'timed_out'}:
            break
        streak += 1
    result = {'repository': repository, 'enabled': project.get('enabled') is True, 'recentRuns': history, 'failureStreak': streak,
              'lastSuccess': next((r['startedAt'] for r in history if r['status'] == 'success'), None),
              'scheduleObservation': 'not-observed', 'historyWindow': 'latest up to 10 observed runs; GitHub schedules are best-effort'}
    if history:
        result['lastRunAgeSeconds'] = max(0, int((dt.datetime.now(dt.timezone.utc) - timestamp(history[0]['startedAt'])).total_seconds()))
    # Project metadata is curated manifest data, not arbitrary run content.
    if project.get('kind') in {'website', 'saas', 'desktop', 'platform', 'catalog', 'service-business', 'website-generation', 'cloud-control', 'repository-catalog', 'native-desktop'}:
        result['kind'] = project['kind']
    if isinstance(project.get('profile'), str) and re.fullmatch(r'[A-Za-z0-9_./-]{1,200}', project['profile']) and '..' not in project['profile'].split('/'):
        result['profile'] = project['profile']
    if isinstance(project.get('surfaces'), list):
        result['surfaces'] = [surface for surface in project['surfaces'][:12] if isinstance(surface, str) and re.fullmatch(r'[A-Za-z0-9_./ -]{1,100}', surface)]
    if not local_only:
        output = command(['gh', 'api', f'repos/{repository}/actions/workflows/run-the-loop.yml', '--jq', '.state'])
        if output in {'active', 'disabled_manually', 'disabled_inactivity', 'disabled_fork'}:
            result['scheduleObservation'] = output
    return result


def collect(manifest_path=ROOT / 'control-plane/fleet.json', ai=AI, local_only=False):
    manifest = read_json(manifest_path) or {}
    revision = command(['git', '-C', str(manifest_path.parent.parent), 'rev-parse', 'HEAD'])
    result = {'schema': 1, 'derived': True, 'observedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
              'machine': manifest.get('machine') if re.fullmatch(r'[A-Za-z0-9_-]{1,80}', str(manifest.get('machine', ''))) else 'unknown',
              'skillRevision': revision if revision and re.fullmatch('[0-9a-f]{40}', revision) else None,
              'projects': [project_health(p, ai / 'logs', local_only) for p in manifest.get('projects', []) if isinstance(p, dict) and re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', str(p.get('repository', '')))],
              'runners': [], 'gateway': 'unknown', 'deepseekSecretAvailable': command(['get-secret', '--exists', 'DEEPSEEK_API_KEY']) is not None}
    for index in range(1, min(int(manifest.get('runnerInstances', 0)), 20) + 1):
        unit = f'agent-runner-{index:02d}.service'
        state = command(['systemctl', '--user', 'show', unit, '--property=ActiveState', '--value'])
        result['runners'].append({'service': unit, 'state': state if state in {'active', 'inactive', 'failed', 'activating', 'deactivating'} else 'unknown'})
    output = command(['openclaw', 'health', '--json'])
    try:
        health = json.loads(output or 'null')
        if isinstance(health, dict) and isinstance(health.get('ok'), bool):
            result['gateway'] = 'healthy' if health['ok'] else 'unhealthy'
    except ValueError:
        pass
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--local-only', action='store_true', help='Skip GitHub network requests; inspect local services/receipts only')
    parser.add_argument('--output', type=Path, help='Explicit optional derived report destination')
    args = parser.parse_args()
    rendered = json.dumps(collect(local_only=args.local_only), indent=2) + '\n'
    if args.output:
        args.output.write_text(rendered)
    else:
        print(rendered, end='')


if __name__ == '__main__':
    main()
