#!/usr/bin/env python3
"""Hidden-input import into protected local state; never git or shell history."""
import getpass
import os
from pathlib import Path
import re
import sys

if len(sys.argv) != 2 or not re.fullmatch('[A-Z][A-Z0-9_]*', sys.argv[1]):
    sys.exit('Usage: fleet-secret-import.py SECRET_NAME')
root = Path.home() / '.config/agent-fleet/secrets'
root.mkdir(parents=True, exist_ok=True, mode=0o700)
root.chmod(0o700)
path = root / sys.argv[1]
if path.exists():
    sys.exit('Secret already exists; refusing to overwrite. Remove explicitly to rotate.')
value = getpass.getpass('Secret value (hidden): ')
if not value:
    sys.exit('Empty secret was not saved.')
fd = os.open(path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
with os.fdopen(fd, 'w') as f:
    f.write(value)
print('Saved in protected local host state; no secret value was printed.')
