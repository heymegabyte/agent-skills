#!/usr/bin/env python3
"""Refresh shared git-backed skills; never discard owner edits or schedule loops."""
from fleet import ROOT, AI, HOME, command, atomic_json, now, index
from skill_links import synchronize

status = {'at': now(), 'status': 'unchanged'}
try:
    if command(['git', 'status', '--porcelain'], ROOT):
        status.update(status='deferred', reason='Owner edits present; synchronization preserves them')
    else:
        command(['git', 'fetch', 'origin'], ROOT, timeout=120)
        branch = command(['git', 'branch', '--show-current'], ROOT)
        command(['git', 'merge', '--ff-only', 'origin/' + branch], ROOT)
        status.update(status='synchronized', revision=command(['git', 'rev-parse', 'HEAD'], ROOT))
    status['skills'] = synchronize(ROOT, HOME)
    index()
except Exception as error:
    status.update(status='failure', reason=str(error))
atomic_json(AI / 'state/skills-sync.json', status)
print(status['status'])
