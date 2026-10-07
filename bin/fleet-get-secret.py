#!/usr/bin/env python3
"""Fallback local secret broker: environment first, protected host file second."""
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
path = Path.home() / '.config/agent-fleet/secrets' / name
if not value and path.exists():
    info = path.stat()
    if info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) & 0o077:
        print('Secret file must be owned by the current user and mode 0600.', file=sys.stderr)
        sys.exit(3)
    value = path.read_text().strip()
if not value:
    sys.exit(1)
if not exists:
    sys.stdout.write(value)
