#!/usr/bin/env python3
"""Generate obvious per-project schedules with matching immutable workflow/code pins."""
import argparse
from pathlib import Path
import re
import subprocess
from fleet import manifest, AI

p = argparse.ArgumentParser()
p.add_argument('revision')
p.add_argument('--push', action='store_true')
a = p.parse_args()
if not re.fullmatch('[0-9a-f]{40}', a.revision):
    p.error('revision must be an immutable 40-character git commit SHA')
for project in manifest()['projects']:
    repository = project['repository']
    local = AI / 'repos' / repository.split('/')[-1]
    if not local.exists():
        print(f'{repository}: unavailable checkout; skipped')
        continue
    path = local / '.github/workflows/run-the-loop.yml'
    path.parent.mkdir(parents=True, exist_ok=True)
    content = f'''name: Run the Loop

on:
  schedule:
    - cron: '2,17,32,47 * * * *'
  workflow_dispatch:
    inputs:
      objective:
        description: Optional focus for this one loop
        type: string
        default: ''

permissions:
  contents: write
  actions: read

jobs:
  loop:
    uses: heymegabyte/agent-skills/.github/workflows/run-the-loop.yml@{a.revision}
    with:
      project: {repository}
      shared-revision: {a.revision}
      runner-labels: '["self-hosted","linux","ubuntu","persistent","proxmox-vm","agent","codex"]'
      objective: ${{{{ inputs.objective || '' }}}}
'''
    if not a.push and path.exists() and path.read_text() == content:
        print(f'{repository}: already pinned')
        continue
    if a.push:
        staged = subprocess.check_output(['git', 'diff', '--cached', '--name-only'], cwd=local, text=True).splitlines()
        if any(name != '.github/workflows/run-the-loop.yml' for name in staged):
            raise RuntimeError(f'{repository}: unrelated staged work; refusing to include it in the caller commit')
        branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=local, text=True).strip()
        if branch != 'main':
            raise RuntimeError(f'{repository}: caller update requires main checkout')
        subprocess.run(['git', 'pull', '--ff-only', 'origin', 'main'], cwd=local, check=True)
    path.write_text(content)
    if a.push:
        subprocess.run(['git', 'add', '.github/workflows/run-the-loop.yml'], cwd=local, check=True)
        if subprocess.check_output(['git', 'diff', '--cached', '--name-only'], cwd=local, text=True).strip():
            subprocess.run(['git', 'commit', '-m', f'ci(fleet): pin persistent loop to {a.revision[:12]}'], cwd=local, check=True)
        subprocess.run(['git', 'push', 'origin', 'main'], cwd=local, check=True)
    print(f'{repository}: {a.revision}')
