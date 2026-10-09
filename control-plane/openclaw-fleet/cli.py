#!/usr/bin/env python3
"""Single-turn official CLI adapter: explicit policy transport and bounded lifetime.

No provider retries: a failed CLI may already have mutated the workspace.
"""
import argparse
import json
import math
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import tempfile
import time

MAX_EVENTS = 200
MAX_RECORD = 2 * 1024 * 1024
MAX_TEXT = 1024 * 1024


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--provider-model', default='codex', choices=['codex', 'claude', 'deepseek'])
    p.add_argument('--system-prompt-file', type=Path)
    a = p.parse_args()
    prompt = sys.stdin.read()
    env = os.environ.copy()
    home = Path.home()
    env['PATH'] = ':'.join([str(home / '.volta/bin'), str(home / '.local/bin'), str(home / 'ai/tools/bin'), env.get('PATH', '/usr/bin:/bin')])
    for key in ('OPENAI_API_KEY', 'CODEX_API_KEY', 'CODEX_ACCESS_TOKEN', 'OPENAI_BASE_URL',
                'ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_BASE_URL', 'CLAUDE_CODE_OAUTH_TOKEN',
                'GITHUB_ENV', 'GITHUB_PATH', 'GITHUB_OUTPUT', 'GITHUB_STEP_SUMMARY', 'GITHUB_STATE',
                'GITHUB_TOKEN', 'GH_TOKEN', 'ACTIONS_RUNTIME_TOKEN', 'ACTIONS_ID_TOKEN_REQUEST_TOKEN', 'GITHUB_ACTIONS'):
        env.pop(key, None)
    workspace = env.get('AI_RUN_WORKSPACE', os.getcwd())
    timeout = 3600.0
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
        if 'deadlineEpoch' in run:
            deadline = float(run['deadlineEpoch'])
            if not math.isfinite(deadline):
                raise ValueError('Run deadline must be finite')
            timeout = min(timeout, deadline - time.time())
    root = Path(__file__).resolve().parents[2]
    if a.provider_model == 'codex':
        command = ['cr', '--provider', 'codex', 'exec', '--json', '--skip-git-repo-check', '--dangerously-bypass-approvals-and-sandbox', '-']
    elif a.provider_model == 'claude':
        command = ['cr', '--provider', 'claude', '-p', '--output-format', 'stream-json', '--verbose', '--dangerously-skip-permissions']
        if a.system_prompt_file:
            command += ['--append-system-prompt-file', str(a.system_prompt_file.resolve())]
    else:
        command = [str(root / 'bin/opencode-deepseek.sh'), 'run', '--format', 'json', '-m', 'deepseek/deepseek-chat']
    if a.system_prompt_file and a.provider_model != 'claude':
        # Supplemental policy is task context; keep the CLI's native instructions intact.
        prompt = '<openclaw-policy>\n' + a.system_prompt_file.read_text() + '\n</openclaw-policy>\n' + prompt
    logdir = Path(env.get('AI_RUN_LOG_DIR', home / 'ai/logs/manual'))
    logdir.mkdir(parents=True, exist_ok=True, mode=0o700)
    trace = logdir / ('compute-' + str(time.time_ns()) + '.json')
    events, parts = [], []
    session = None
    failures = []
    child = None
    code = 1
    started = time.monotonic()

    def settle():
        if child is None:
            return
        # Also terminate lingering descendants after the direct child exits.
        try:
            os.killpg(child.pid, signal.SIGTERM)
        except ProcessLookupError:
            return
        try:
            child.wait(timeout=2)
        except subprocess.TimeoutExpired:
            pass
        try:
            os.killpg(child.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        child.wait()

    def interrupted(signum, frame):
        raise InterruptedError('CLI adapter interrupted')

    for signum in (signal.SIGTERM, signal.SIGINT):
        signal.signal(signum, interrupted)
    try:
        if timeout <= 0:
            raise TimeoutError('Run deadline already expired; CLI was not launched')
        with (logdir / ('cli-' + str(time.time_ns()) + '.stderr')).open('w') as errors, tempfile.TemporaryFile(mode='w+t') as output:
            child = subprocess.Popen(command, cwd=workspace, env=env, stdin=subprocess.PIPE,
                                     stdout=output, stderr=errors, text=True, start_new_session=True)
            try:
                child.communicate(input=prompt, timeout=timeout)
                code = child.returncode
            except subprocess.TimeoutExpired:
                failures.append('CLI exceeded run deadline')
                code = 124
            finally:
                settle()
            output.seek(0)
            while True:
                line = output.readline(MAX_RECORD + 1)
                if not line:
                    break
                if len(line) > MAX_RECORD:
                    failures.append('CLI event exceeds record limit')
                    break
                try:
                    item = json.loads(line)
                except ValueError:
                    continue
                if not isinstance(item, dict):
                    continue
                kind = item.get('type')
                if kind == 'thread.started':
                    session = item.get('thread_id')
                if kind == 'item.completed':
                    record = item.get('item', {})
                    if record.get('type') == 'agent_message':
                        parts.append(str(record.get('text', ''))[:MAX_TEXT])
                    if record.get('type') == 'command_execution' and len(events) < MAX_EVENTS:
                        # Command strings can contain runtime-fetched secrets; publish metadata only.
                        events.append({'command': '[native command; contents private]', 'exitCode': record.get('exit_code')})
                if kind in ('turn.completed', 'result', 'step_finish') and len(events) < MAX_EVENTS:
                    usage = item.get('usage', item.get('part', {}).get('tokens'))
                    if isinstance(usage, dict):
                        events.append({'usage': {k: v for k, v in usage.items() if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)}})
                if kind == 'result':
                    parts.append(str(item.get('result', ''))[:MAX_TEXT])
                    session = item.get('session_id', session)
                    if item.get('is_error'):
                        failures.append('CLI reported an error result')
                if kind in ('error', 'turn.failed'):
                    failures.append('CLI reported a failure event')
                if kind == 'text':
                    parts.append(str(item.get('part', {}).get('text', ''))[:MAX_TEXT])
                    session = item.get('sessionID', session)
                if sum(map(len, parts)) > MAX_TEXT:
                    failures.append('CLI reply exceeds text limit')
                    break
        if not any(part.strip() for part in parts):
            failures.append('CLI produced no final reply')
        if failures and code == 0:
            code = 1
    except (OSError, ValueError, TimeoutError, InterruptedError) as error:
        failures.append(type(error).__name__)
        code = 124 if isinstance(error, TimeoutError) else 1
    finally:
        settle()
        try:
            revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True, timeout=5).strip()
        except (OSError, subprocess.SubprocessError):
            revision = None
        trace.write_text(json.dumps({'adapterRevision': revision, 'inputCharacters': len(prompt),
                                    'runId': env.get('AI_RUN_ID'), 'runtime': a.provider_model,
                                    'router': a.provider_model != 'deepseek', 'session': session,
                                    'exitCode': code, 'durationSeconds': round(time.monotonic() - started, 3),
                                    'events': events, 'failures': failures,
                                    'systemPromptTransport': 'file' if a.system_prompt_file else 'none'}, indent=2) + '\n')
        trace.chmod(0o600)
    if code:
        print(f'{a.provider_model} exited {code}; private diagnostics: {logdir}', file=sys.stderr)
        return code
    print(json.dumps({'result': '\n'.join(parts), 'session_id': session}))
    return 0


if __name__ == '__main__':
    sys.exit(main())
