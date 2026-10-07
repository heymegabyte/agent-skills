#!/usr/bin/env python3
"""Register independent durable org runners; no registration secrets in output."""
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import tarfile
import urllib.request
import platform
from fleet import AI, HOME, command, gh, manifest

configuration = manifest()
identity = HOME / '.config/agent-fleet/machine.json'
if identity.exists():
    configuration['machine'] = json.loads(identity.read_text())['machineId']
if configuration['machine'] != 'ubuntu-proxmox-primary':
    configuration['runnerLabels'] = [l for l in configuration['runnerLabels'] if l not in ('ubuntu', 'proxmox-vm')]
if os.environ.get('FLEET_MACHINE_ID'):
    configuration['machine'] = os.environ['FLEET_MACHINE_ID']
if os.environ.get('FLEET_RUNNER_LABELS'):
    configuration['runnerLabels'] = os.environ['FLEET_RUNNER_LABELS'].split(',')
repository_ids = [gh('repos/' + p['repository'])['id'] for p in configuration['projects']]
org = 'heymegabyte'
groups = gh(f'orgs/{org}/actions/runner-groups')['runner_groups']
name = 'persistent-agent-fleet'
group = next((g for g in groups if g['name'] == name), None)
body = {'name': name, 'visibility': 'selected', 'selected_repository_ids': repository_ids,
        'allows_public_repositories': True}
if group:
    gh(f'orgs/{org}/actions/runner-groups/{group["id"]}', 'PATCH', {'visibility': 'selected', 'allows_public_repositories': True})
    gh(f'orgs/{org}/actions/runner-groups/{group["id"]}/repositories', 'PUT', {'selected_repository_ids': repository_ids})
else:
    group = gh(f'orgs/{org}/actions/runner-groups', 'POST', body)
release = gh('repos/actions/runner/releases/latest')
architecture = {'x86_64': 'x64', 'aarch64': 'arm64'}.get(platform.machine())
if not architecture:
    raise RuntimeError('Unsupported runner architecture')
asset = next(a for a in release['assets'] if a['name'].startswith(f'actions-runner-linux-{architecture}-') and a['name'].endswith('.tar.gz'))
cache = AI / 'tools' / asset['name']
cache.parent.mkdir(parents=True, exist_ok=True)
if not cache.exists():
    with urllib.request.urlopen(asset['browser_download_url']) as response:
        cache.write_bytes(response.read())
digest = 'sha256:' + hashlib.sha256(cache.read_bytes()).hexdigest()
if asset.get('digest'):
    if asset['digest'] != digest:
        raise RuntimeError('Runner archive digest does not match official release metadata')
else:
    raise RuntimeError('Official release did not provide a runner archive digest; verify archive before registration')
units = HOME / '.config/systemd/user'
units.mkdir(parents=True, exist_ok=True)
(units / 'agent-fleet.slice').write_text('[Unit]\nDescription=Persistent AI fleet resource budget\n\n[Slice]\nCPUWeight=50\nCPUQuota=600%\nMemoryHigh=8G\nMemoryMax=10G\n')
# Gateway-spawned native CLI work must share the budget with Actions jobs.
if (units / 'openclaw-gateway.service').exists():
    override = units / 'openclaw-gateway.service.d'
    override.mkdir(exist_ok=True)
    (override / 'fleet-resources.conf').write_text('[Service]\nSlice=agent-fleet.slice\nCPUWeight=50\nNice=5\n')
labels = ','.join(l for l in configuration['runnerLabels'] if l not in ('self-hosted', 'linux'))
environment = os.environ.copy()
environment['PATH'] = ':'.join([str(HOME / '.local/bin'), str(AI / 'tools/bin'), str(HOME / '.volta/bin'), '/usr/local/bin', '/usr/bin', '/bin'])
for number in range(1, configuration['runnerInstances'] + 1):
    directory = AI / 'runners' / f'worker-{number:02d}'
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    if not (directory / 'run.sh').exists():
        with tarfile.open(cache) as archive:
            archive.extractall(directory, filter='data')
    if not (directory / '.runner').exists():
        token = gh(f'orgs/{org}/actions/runners/registration-token', 'POST')['token']
        result = subprocess.run([str(directory / 'config.sh'), '--unattended', '--url', f'https://github.com/{org}',
                                 '--token', token, '--name', f'{configuration["machine"]}-{number:02d}',
                                 '--runnergroup', name, '--labels', labels, '--work', '_work'],
                                cwd=directory, env=environment, capture_output=True, text=True, timeout=180)
        if result.returncode:
            # config.sh normally redacts the token, but do not rely on it.
            raise RuntimeError('Runner registration failed: ' + result.stderr.replace(token, '[REDACTED]')[-1000:])
    unit_name = f'agent-runner-{number:02d}.service'
    (units / unit_name).write_text(f'''[Unit]
Description=Persistent GitHub Actions agent worker {number:02d}
After=network-online.target

[Service]
Type=simple
WorkingDirectory={directory}
ExecStart={directory}/run.sh
Environment="PATH={environment['PATH']}"
Environment="AI_MACHINE_ID={configuration['machine']}"
Restart=always
RestartSec=10
KillSignal=SIGINT
TimeoutStopSec=90
Slice=agent-fleet.slice
CPUWeight=75
MemoryHigh=4G
MemoryMax=6G
UMask=0077

[Install]
WantedBy=default.target
''')
    command(['systemctl', '--user', 'daemon-reload'])
    command(['systemctl', '--user', 'enable', '--now', unit_name])
    print(f'{unit_name}: configured, ' + command(['systemctl', '--user', 'is-active', unit_name]))
print(json.dumps({'runnerVersion': release['tag_name'], 'archiveDigest': digest, 'instances': configuration['runnerInstances'], 'runnerGroup': name}))
