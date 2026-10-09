#!/usr/bin/env python3
"""Idempotent, non-secret host configuration. Existing official logins stay put."""
import json
import os
from pathlib import Path
import secrets
import shutil
import platform
import re

home = Path.home()
root = Path(__file__).resolve().parents[1]
fleet = json.loads((root / 'control-plane/fleet.json').read_text())
identity_path = home / '.config/agent-fleet/machine.json'
identity_path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
identity = json.loads(identity_path.read_text()) if identity_path.exists() else {}
machine_id = os.environ.get('FLEET_MACHINE_ID', identity.get('machineId', 'linux-' + platform.node()))
if not re.fullmatch(r'[a-zA-Z0-9-]+', machine_id):
    raise SystemExit('Machine identity must contain only letters, numbers and hyphens')
profile = root / 'machines' / (machine_id + '.md')
if not profile.exists():
    profile.write_text(f'# {machine_id}\n\nPersistent Linux development host.\n\n'
                       'Codex is preferred for setup. Preserve official authentication. Main is normal. '
                       'GitHub owns schedules/history. OpenClaw orchestrates official CLI profiles; '
                       'OpenCode uses DeepSeek directly. Never route local compute through AI Gateway.\n\n'
                       f'Observed hostname: {platform.node()}; architecture: {platform.machine()}. '
                       'Proxmox hosting and primary-machine status are not assumed.\n')
identity.update({'machineId': machine_id, 'profile': str(profile),
                 'skillsRepository': 'heymegabyte/agent-skills', 'preferredSetupAgent': 'codex'})
identity_path.write_text(json.dumps(identity, indent=2) + '\n')
instructions = ('Read ~/.config/agent-fleet/machine.json and its profile first. Read '
                '~/ai/repos/agent-skills/control-plane/FLEET.md for runtime routing and persistent state. '
                'Preserve official authentication. Main is normal. GitHub owns schedules/history. '
                'Never route local CLI/DeepSeek compute through Cloudflare AI Gateway.\n')
for directory in [home / '.codex', home / '.claude']:
    directory.mkdir(exist_ok=True)
    target = directory / ('AGENTS.md' if directory.name == '.codex' else 'CLAUDE.md')
    if not target.exists():
        target.write_text(instructions)
router = home / '.claw-router/config.json'
if router.exists():
    c = json.loads(router.read_text())
    for i in range(1, 4):
        name = f'claude-{i}'
        directory = home / '.claw-router/accounts' / name
        directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        if not any(a['name'] == name for a in c['accounts']):
            c['accounts'].append({'name': name, 'provider': 'claude', 'kind': 'subscription',
                                 'configDir': str(directory), 'enabled': False, 'email': None,
                                 'plan': 'unknown', 'lastUsed': 0, 'usagePct': None})
    router.write_text(json.dumps(c, indent=2) + '\n')
    router.chmod(0o600)
workspace = home / 'ai/workspace'
workspace.mkdir(parents=True, exist_ok=True)
(workspace / 'AGENTS.md').write_text(
    'Read ~/.config/agent-fleet/machine.json, its profile and ~/ai/repos/agent-skills/control-plane/FLEET.md '
    'before system work. Codex is preferred for local setup. Use official subscription CLIs '
    'through cr; use OpenCode/DeepSeek directly for throughput. GitHub owns recurring '
    'scheduling. Never print secrets.\n')
state = home / '.openclaw'
state.mkdir(exist_ok=True, mode=0o700)
path = state / 'openclaw.json'
c = json.loads(path.read_text()) if path.exists() else {}
c.setdefault('gateway', {}).update({'mode': 'local', 'bind': 'loopback', 'port': 18789})
c['gateway'].setdefault('auth', {'mode': 'token', 'token': secrets.token_urlsafe(40)})
agents = c.setdefault('agents', {})
agents['ownership'] = 'explicit'
agents.setdefault('defaults', {}).update({
    'workspace': str(workspace), 'model': {'primary': 'fleet-cli/codex'},
    'models': {'fleet-cli/codex': {}, 'fleet-cli/claude': {}, 'fleet-cli/deepseek': {}},
    'timeoutSeconds': 3600, 'maxConcurrent': 6, 'systemAgent': {'agentId': 'main'}, 'heartbeat': {'every': '0m'}})
existing = agents.get('entries', {})
for legacy in agents.pop('list', []):
    entry = dict(legacy)
    identity = entry.pop('id')
    entry.pop('default', None)
    existing.setdefault(identity, entry)
existing.setdefault('main', {'workspace': str(workspace)})
for project in fleet['projects']:
    existing.setdefault(project['agent'], {
        'workspace': str(home / 'ai/repos' / project['repository'].split('/')[-1]),
        'model': {'primary': 'fleet-cli/codex'}})
agents['entries'] = existing
c.setdefault('tools', {}).update({'sessions': {'visibility': 'all'}, 'agentToAgent': {'enabled': True}})
load = c.setdefault('skills', {}).setdefault('load', {})
load['extraDirs'] = list(dict.fromkeys(load.get('extraDirs', []) + [str(root)]))
plugins = c.setdefault('plugins', {})
plugins['allow'] = list(set(plugins.get('allow', []) + ['fleet-cli']))
plugins.setdefault('load', {})['paths'] = list(set(plugins.get('load', {}).get('paths', []) + [str(root / 'control-plane/openclaw-fleet')]))
plugins.setdefault('entries', {})['fleet-cli'] = {'enabled': True}
if path.exists():
    shutil.copy2(path, state / 'openclaw.pre-fleet.json')
path.write_text(json.dumps(c, indent=2) + '\n')
path.chmod(0o600)
from skill_links import synchronize
synchronize(root, home)
commands = home / '.claude/commands'
commands.mkdir(parents=True, exist_ok=True)
for source in (root / 'commands').glob('*.md'):
    link = commands / source.name
    if not link.exists() and not link.is_symlink():
        link.symlink_to(source)
opencode = home / '.config/opencode/opencode.json'
opencode.parent.mkdir(parents=True, exist_ok=True)
settings = json.loads(opencode.read_text()) if opencode.exists() else {}
settings.update({'$schema': 'https://opencode.ai/config.json', 'model': 'deepseek/deepseek-chat', 'small_model': 'deepseek/deepseek-chat'})
settings.setdefault('provider', {})['deepseek'] = {
    'npm': '@ai-sdk/openai-compatible', 'name': 'DeepSeek Direct',
    'options': {'baseURL': 'https://api.deepseek.com/v1', 'apiKey': '{env:DEEPSEEK_API_KEY}'},
    'models': {'deepseek-chat': {'name': 'DeepSeek Chat'}, 'deepseek-reasoner': {'name': 'DeepSeek Reasoner'}}}
opencode.write_text(json.dumps(settings, indent=2) + '\n')
local_bin = home / '.local/bin'
local_bin.mkdir(parents=True, exist_ok=True)
for name, source in [('fleet-account-login', root / 'bin/fleet-account-login.sh'),
                     ('fleet-infisical-setup', root / 'bin/fleet-infisical-setup.py'),
                     ('fleet-secret-import', root / 'bin/fleet-secret-import.py')]:
    source.chmod(0o755)
    link = local_bin / name
    if not link.exists() and not link.is_symlink():
        link.symlink_to(source)
if not shutil.which('get-secret'):
    source = root / 'bin/fleet-get-secret.py'
    source.chmod(0o755)
    link = local_bin / 'get-secret'
    if not link.exists() and not link.is_symlink():
        link.symlink_to(source)
app = home / 'ai/repos/agent.megabyte.space'
units = home / '.config/systemd/user'
units.mkdir(parents=True, exist_ok=True)
if (app / 'server.py').exists():
    (app / 'open-ui.py').chmod(0o755)
    link = local_bin / 'fleet-ui-open'
    if not link.exists() and not link.is_symlink():
        link.symlink_to(app / 'open-ui.py')
    (units / 'agent-fleet-ui.service').write_text(f'''[Unit]
Description=Megabyte authenticated local fleet UI
After=network-online.target

[Service]
WorkingDirectory={app}
ExecStart=/usr/bin/python3 {app}/server.py
Environment="PATH={home}/.local/bin:{home}/ai/tools/bin:{home}/.volta/bin:/usr/local/bin:/usr/bin:/bin"
Restart=on-failure
RestartSec=5
UMask=0077

[Install]
WantedBy=default.target
''')
(units / 'agent-skills-sync.service').write_text(f'''[Unit]
Description=Synchronize canonical agent skills and derived search

[Service]
Type=oneshot
ExecStart=/usr/bin/python3 {root}/control-plane/sync-skills.py
Environment="PATH={home}/.local/bin:{home}/ai/tools/bin:{home}/.volta/bin:/usr/local/bin:/usr/bin:/bin"
UMask=0077
''')
(units / 'agent-skills-sync.timer').write_text('''[Unit]
Description=Periodic canonical skill synchronization (not project scheduling)

[Timer]
OnBootSec=3m
OnUnitActiveSec=15m
RandomizedDelaySec=45s
Persistent=true

[Install]
WantedBy=timers.target
''')
print('Configured persistent OpenClaw and shared skill links; existing account state and credentials preserved.')
