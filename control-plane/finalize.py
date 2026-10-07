#!/usr/bin/env python3
"""Failure/cancellation record when the loop could not finish its own finally block."""
import datetime as dt
import os
from pathlib import Path
from fleet import atomic_json, markdown, manifest, now

output = Path(os.environ['FLEET_OUTPUT'])
output.mkdir(parents=True, exist_ok=True)
if not (output / 'run.json').exists():
    start_file = output / 'started-at'
    started = start_file.read_text().strip() if start_file.exists() else now()
    repo = os.environ['FLEET_PROJECT']
    record = {'schema': 1, 'project': repo,
              'runId': f'{repo.replace("/", "--")}-{os.environ["GITHUB_RUN_ID"]}-{os.environ["GITHUB_RUN_ATTEMPT"]}',
              'machine': manifest()['machine'], 'runner': os.environ.get('RUNNER_NAME', 'unknown'),
              'objective': os.environ.get('FLEET_OBJECTIVE') or 'Execute one repository-owned /run-the-loop iteration',
              'startedAt': started, 'endedAt': now(),
              'status': 'failure', 'warnings': [], 'compute': [],
              'failures': ['Preflight, checkout or interrupted execution prevented a complete result. Inspect job logs and retained local worktrees.'],
              'nextActions': ['Continue from actual repository state on the next scheduled execution.'],
              'timeline': [{'at': now(), 'event': 'Fallback finalizer recorded incomplete execution'}]}
    record['durationSeconds'] = (dt.datetime.now(dt.timezone.utc) - dt.datetime.fromisoformat(started.replace('Z', '+00:00'))).total_seconds()
    atomic_json(output / 'run.json', record)
    summary = markdown(record)
    (output / 'summary.md').write_text(summary)
    with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as f:
        f.write(summary)
