#!/usr/bin/env python3
"""Secret broker: environment, configured Infisical, protected local fallback."""
import os
import json
from pathlib import Path
import re
import stat
import sys

args = sys.argv[1:]
exists = bool(args and args[0] in ('-e', '--exists'))
if exists:
    args.pop(0)
if len(args) != 1 or not re.fullmatch('[A-Z][A-Z0-9_]*', args[0]):
    sys.exit(2)
name = args[0]
value = os.environ.get(name)
root = Path.home() / '.config/agent-fleet'
def local_secret(path):
    info = path.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) & 0o077:
        raise ValueError('Local secret/config requires owner-only regular file')
    return path.read_text().strip()
# Explicit owner-selected local sources are distinct from provider-error fallback.
# Infisical failures for every other name continue to fail closed.
overrides = root / 'local-secret-overrides.json'
if not value and overrides.exists():
    try:
        names = json.loads(local_secret(overrides))
        if not isinstance(names, list) or any(not isinstance(n, str) or not re.fullmatch('[A-Z][A-Z0-9_]*', n) for n in names):
            raise ValueError('Invalid local source list')
        if name in names:
            value = local_secret(root / 'secrets' / name)
            if not value:
                raise ValueError('Explicit local secret is empty')
    except Exception:
        print('Explicit local secret lookup failed; inspect protected configuration.', file=sys.stderr)
        sys.exit(3)
if not value:
    try:
        from importlib.util import spec_from_file_location, module_from_spec
        spec = spec_from_file_location('fleet_infisical', Path(__file__).resolve().with_name('fleet-infisical.py'))
        provider = module_from_spec(spec); spec.loader.exec_module(provider)
        value = provider.get(name)
    except Exception:
        print('Infisical lookup failed; check identity access and provider configuration.', file=sys.stderr)
        sys.exit(3)
path = Path.home() / '.config/agent-fleet/secrets' / name
if value is None and path.exists():
    info = path.stat()
    if info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) & 0o077:
        print('Secret file must be owned by the current user and mode 0600.', file=sys.stderr)
        sys.exit(3)
    value = path.read_text().strip()
if not value:
    sys.exit(1)
if not exists:
    sys.stdout.write(value)
