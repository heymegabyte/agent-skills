#!/usr/bin/env python3
"""OpenClaw CLI backend. The official CLIs retain authentication and tools."""
import argparse
import json
import os
import re
from pathlib import Path
import subprocess
import sys
import time

p = argparse.ArgumentParser()
p.add_argument('--provider-model', default='codex', choices=['codex', 'claude', 'deepseek'])
a = p.parse_args()
prompt = sys.stdin.read()
env = os.environ.copy()
home = Path.home()
env['PATH'] = ':'.join([str(home / '.volta/bin'), str(home / '.local/bin'), str(home / 'ai/tools/bin'), env.get('PATH', '/usr/bin:/bin')])
for key in ('OPENAI_API_KEY', 'CODEX_API_KEY', 'CODEX_ACCESS_TOKEN', 'OPENAI_BASE_URL',
            'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'CLAUDE_CODE_OAUTH_TOKEN'):
    env.pop(key, None)
workspace = env.get('AI_RUN_WORKSPACE', os.getcwd())
# Gateway requests carry non-secret correlation context in the user message;
# client process environment does not cross the Gateway process boundary.
context = re.search(r'<fleet-run>([^\n]+)</fleet-run>', prompt)
if context:
    run = json.loads(context.group(1))
    candidate = Path(run['workspace']).resolve()
    logs = Path(run['logdir']).resolve()
    candidate.relative_to(home / 'ai/worktrees')
    logs.relative_to(home / 'ai/logs')
    workspace = str(candidate)
    env.update({'AI_RUN_ID': run['runId'], 'AI_RUN_WORKSPACE': workspace,
                'AI_RUN_LOG_DIR': str(logs), 'AI_FLEET_REPORT': str(logs / 'agent-report.json')})
root = Path(__file__).resolve().parents[2]
if a.provider_model == 'codex':
    command = ['cr', '--provider', 'codex', 'exec', '--json', '--skip-git-repo-check', '--dangerously-bypass-approvals-and-sandbox', '-']
elif a.provider_model == 'claude':
    command = ['cr', '--provider', 'claude', '-p', '--output-format', 'stream-json', '--verbose', '--dangerously-skip-permissions']
else:
    command = [str(root / 'bin/opencode-deepseek.sh'), 'run', '--format', 'json', '-m', 'deepseek/deepseek-chat', prompt]
logdir = Path(env.get('AI_RUN_LOG_DIR', Path.home() / 'ai/logs/manual'))
logdir.mkdir(parents=True, exist_ok=True, mode=0o700)
trace = logdir / ('compute-' + str(time.time_ns()) + '.json')
events = []
parts = []
session = None
with (logdir / ('cli-' + str(time.time_ns()) + '.stderr')).open('w') as errors:
    child = subprocess.Popen(command, cwd=workspace, env=env, stdin=subprocess.PIPE,
                             stdout=subprocess.PIPE, stderr=errors, text=True)
    child.stdin.write(prompt if a.provider_model != 'deepseek' else '')
    child.stdin.close()
    for line in child.stdout:
        try:
            item = json.loads(line)
        except ValueError:
            continue
        kind = item.get('type')
        if kind == 'thread.started':
            session = item.get('thread_id')
        if kind == 'item.completed':
            record = item.get('item', {})
            if record.get('type') == 'agent_message':
                parts.append(record.get('text', ''))
            if record.get('type') == 'command_execution':
                events.append({'command': record.get('command'), 'exitCode': record.get('exit_code')})
        if kind == 'turn.completed':
            events.append({'usage': item.get('usage')})
        if kind == 'result':
            parts.append(item.get('result', ''))
            session = item.get('session_id', session)
        if kind == 'text':
            parts.append(item.get('part', {}).get('text', ''))
    code = child.wait()
trace.write_text(json.dumps({'runId': env.get('AI_RUN_ID'), 'runtime': a.provider_model,
                            'router': a.provider_model != 'deepseek', 'session': session,
                            'exitCode': code, 'events': events}, indent=2) + '\n')
if code:
    print(f'{a.provider_model} exited {code}; private diagnostics: {logdir}', file=sys.stderr)
    sys.exit(code)
print(json.dumps({'result': '\n'.join(parts), 'session_id': session}))
