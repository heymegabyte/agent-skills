#!/usr/bin/env python3
"""Complete GitHub synchronization/registration after official local GitHub login."""
import json
import os
from pathlib import Path
import subprocess
import sys
from fleet import ROOT, AI, HOME, command, gh, manifest

os.environ['PATH'] = ':'.join([str(HOME / '.local/bin'), str(AI / 'tools/bin'), str(HOME / '.volta/bin'), os.environ.get('PATH', '')])
if subprocess.run(['gh', 'auth', 'status'], capture_output=True).returncode:
    subprocess.run(['gh', 'auth', 'login', '--hostname', 'github.com', '--git-protocol', 'https', '--web', '--scopes', 'repo,workflow,admin:org'], check=True)
command(['gh', 'auth', 'setup-git'])
if command(['git', 'status', '--porcelain'], ROOT):
    raise RuntimeError('Commit/review shared setup work first; finish-setup refuses to stage unrelated edits')
configuration = manifest()
# Resolve the remaining domain against every repository available to this OAuth login.
text = command(['gh', 'api', '--paginate', '--slurp', 'user/repos?per_page=100'], timeout=120)
repositories = [repo for page in json.loads(text) for repo in page]
for domain in list(configuration.get('unresolvedProjects', [])):
    matches = [r for r in repositories if r['name'].lower() == domain.lower() and not r['archived']]
    if len(matches) == 1:
        r = matches[0]
        configuration['projects'].append({'repository': r['full_name'], 'agent': domain.split('.')[0].replace('-', ''), 'enabled': True, 'url': 'https://' + domain})
        configuration['unresolvedProjects'].remove(domain)
        print('Resolved project: ' + r['full_name'])
if configuration != manifest():
    (ROOT / 'control-plane/fleet.json').write_text(json.dumps(configuration, indent=2) + '\n')
    command(['git', 'add', 'control-plane/fleet.json'], ROOT)
    command(['git', 'commit', '-m', 'feat(fleet): resolve authorized project repository identities'], ROOT)
for p in configuration['projects']:
    local = AI / 'repos' / p['repository'].split('/')[-1]
    if not local.exists():
        command(['gh', 'repo', 'clone', p['repository'], str(local)], timeout=300)
    remote = gh('repos/' + p['repository'])
    if remote['default_branch'] != 'main':
        raise RuntimeError(f'{p["repository"]} has default branch {remote["default_branch"]}; migrate deliberately before enabling scheduling')
app = AI / 'repos/agent.megabyte.space'
exists = subprocess.run(['gh', 'repo', 'view', 'heymegabyte/agent.megabyte.space'], capture_output=True).returncode == 0
if not exists:
    command(['gh', 'repo', 'create', 'heymegabyte/agent.megabyte.space', '--private', '--description', 'Persistent AI fleet control plane'], timeout=120)
if not app.exists():
    command(['gh', 'repo', 'clone', 'heymegabyte/agent.megabyte.space', str(app)], timeout=300)
if (app / '.git').exists() and not command(['git', 'remote'], app):
    command(['git', 'remote', 'add', 'origin', 'https://github.com/heymegabyte/agent.megabyte.space.git'], app)
for directory in [ROOT, app]:
    if command(['git', 'status', '--porcelain'], directory):
        raise RuntimeError(f'{directory}: commit/review local work before running finish-setup; refusing to stage unrelated files')
    branch = command(['git', 'branch', '--show-current'], directory)
    if branch == 'master':
        command(['git', 'branch', '-m', 'main'], directory)
    elif branch != 'main':
        raise RuntimeError('Finish setup requires a main checkout')
    command(['git', 'push', '-u', 'origin', 'main'], directory, timeout=180)
command(['gh', 'repo', 'edit', 'heymegabyte/agent-skills', '--default-branch', 'main'])
revision = command(['git', 'rev-parse', 'HEAD'], ROOT)
command(['python3', str(ROOT / 'control-plane/configure-host.py')])
command(['systemctl', '--user', 'daemon-reload'])
command(['systemctl', '--user', 'enable', '--now', 'agent-fleet-ui.service'])
command(['systemctl', '--user', 'enable', '--now', 'agent-skills-sync.timer'])
command(['systemctl', '--user', 'restart', 'openclaw-gateway.service'])
command(['python3', str(ROOT / 'control-plane/register-runners.py')], timeout=600)
command(['python3', str(ROOT / 'control-plane/update-callers.py'), revision, '--push'], timeout=600)
command(['python3', str(ROOT / 'control-plane/fleet.py'), 'index'])
print('Persistent runner registration and SHA-pinned project schedules are synchronized.')
if configuration.get('unresolvedProjects'):
    print('Still unresolved: ' + ', '.join(configuration['unresolvedProjects']))
