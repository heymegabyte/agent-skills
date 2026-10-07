#!/usr/bin/env python3
"""Prepare verified official runner binaries without requiring registration OAuth."""
import hashlib
import json
import platform
import subprocess
import tarfile
import urllib.request
from fleet import AI, manifest, atomic_json

release = json.load(urllib.request.urlopen('https://api.github.com/repos/actions/runner/releases/latest'))
arch = {'x86_64': 'x64', 'aarch64': 'arm64'}.get(platform.machine())
if not arch:
    raise SystemExit('Unsupported runner architecture')
asset = next(a for a in release['assets'] if a['name'].startswith(f'actions-runner-linux-{arch}-') and a['name'].endswith('.tar.gz'))
cache = AI / 'tools' / asset['name']
cache.parent.mkdir(parents=True, exist_ok=True)
if not cache.exists():
    with urllib.request.urlopen(asset['browser_download_url']) as response:
        cache.write_bytes(response.read())
digest = 'sha256:' + hashlib.sha256(cache.read_bytes()).hexdigest()
if asset.get('digest') != digest:
    raise SystemExit('Official runner release checksum missing or mismatched')
for number in range(1, manifest()['runnerInstances'] + 1):
    directory = AI / 'runners' / f'worker-{number:02d}'
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    if not (directory / 'run.sh').exists():
        with tarfile.open(cache) as archive:
            archive.extractall(directory, filter='data')
    subprocess.run([str(directory / 'bin/Runner.Listener'), '--version'], cwd=directory, check=True)
atomic_json(AI / 'state/runner-preparation.json', {'version': release['tag_name'], 'digest': digest, 'instances': manifest()['runnerInstances'], 'status': 'binaries verified; registration pending'})
