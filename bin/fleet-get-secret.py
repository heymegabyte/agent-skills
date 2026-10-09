#!/usr/bin/env python3
"""Secret broker: environment, configured Infisical, protected local fallback."""
import os
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
