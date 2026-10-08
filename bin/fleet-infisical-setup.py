#!/usr/bin/env python3
"""Interactive enrollment. Secrets enter via hidden TTY input only."""
import getpass,json,os
from pathlib import Path
from urllib.parse import urlsplit
os.umask(0o077)
r=Path.home()/'.config/agent-fleet';r.mkdir(parents=True,exist_ok=True)
if (r/'infisical-credentials.json').exists():raise SystemExit('Already enrolled; rotate credentials explicitly rather than overwriting.')
u=input('Infisical HTTPS origin [https://us.infisical.com]: ').strip() or 'https://us.infisical.com'
p=urlsplit(u)
if p.scheme!='https' or not p.hostname or p.username or p.password or p.query or p.fragment or p.path not in ('','/'):raise SystemExit('Use an HTTPS origin URL.')
c={'url':u.rstrip('/'),'projectId':input('Project ID: ').strip(),'environment':input('Environment slug [dev]: ').strip() or 'dev','secretPath':input('Secret folder [/]: ').strip() or '/'}
a={'clientId':input('Machine identity client ID: ').strip(),'clientSecret':getpass.getpass('Machine identity client secret (hidden): ')}
if not c['projectId'] or not a['clientId'] or not a['clientSecret']:raise SystemExit('Required values missing; nothing saved.')
for filename,data in [('infisical.json',c),('infisical-credentials.json',a)]:
 with (r/filename).open('x') as f:json.dump(data,f)
 (r/filename).chmod(0o600)
print('Provider enrolled. Verify without printing secrets: get-secret --exists DEEPSEEK_API_KEY')
