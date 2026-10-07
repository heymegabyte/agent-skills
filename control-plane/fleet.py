#!/usr/bin/env python3
"""Persistent fleet operations. GitHub/git/files are canonical, indexes are derived."""
import argparse
import datetime as dt
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import signal
import sqlite3
import subprocess
import sys
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]
HOME = Path.home()
AI = Path(os.environ.get('AI_HOME', HOME / 'ai'))
CONFIG = ROOT / 'control-plane/fleet.json'


def manifest():
    return json.loads(CONFIG.read_text())


def project(repository):
    matches = [p for p in manifest()['projects'] if p['repository'] == repository]
    if len(matches) != 1 or repository == 'heymegabyte/agent-skills':
        raise ValueError('Repository is not in the approved project fleet')
    return matches[0]


def command(args, cwd=None, timeout=60, check=True, env=None):
    result = subprocess.run(args, cwd=cwd, env=env, text=True, capture_output=True, timeout=timeout)
    if check and result.returncode:
        raise RuntimeError(f'{args[0]} exited {result.returncode}: {scrub(result.stderr[:1200])}')
    return result.stdout.strip()


def gh(path, method='GET', body=None):
    args = ['gh', 'api', path, '--method', method]
    if body is not None:
        result = subprocess.run(args + ['--input', '-'], input=json.dumps(body),
                                capture_output=True, text=True, timeout=60)
        if result.returncode:
            raise RuntimeError(f'GitHub {method} {path} failed: {scrub(result.stderr[:1000])}')
        return json.loads(result.stdout) if result.stdout.strip() else None
    text = command(args)
    return json.loads(text) if text else None


def scrub(value):
    text = str(value)
    for name, secret in os.environ.items():
        if re.search(r'(TOKEN|SECRET|PASSWORD|API_KEY)$', name) and len(secret) > 5:
            text = text.replace(secret, '[REDACTED]')
    text = re.sub(r'\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|sk-[A-Za-z0-9_-]{15,})\b', '[REDACTED]', text)
    text = re.sub(r'(?i)(authorization\s*[:=]\s*(?:bearer\s+)?)[^\s"\']+', r'\1[REDACTED]', text)
    return text


def safe_json(value):
    return json.loads(scrub(json.dumps(value)))


def now():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds')


def atomic_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    temp = path.with_suffix('.tmp.' + str(os.getpid()))
    temp.write_text(json.dumps(safe_json(data), indent=2) + '\n')
    temp.replace(path)


def markdown(report):
    def esc(value):
        return scrub(value).replace('|', '\\|').replace('\n', ' ').replace('<', '&lt;')
    repo = report['project']
    status = report['status']
    badge = {'success': '🟢', 'failure': '🔴', 'running': '🔵', 'skipped': '⏸️'}.get(status, '⚪')
    lines = [f'# {badge} {repo} · Run the Loop', '',
             f'> **{esc(report["objective"])}**', '',
             '| Run | Machine | Result | Duration |', '| --- | --- | --- | --- |',
             f'| `{esc(report["runId"])}` | `{esc(report["machine"])}` / {esc(report["runner"])} | **{status}** | {report.get("durationSeconds", 0):.1f}s |', '',
             '## Execution', '', '| Started | Finished | Base → Result |', '| --- | --- | --- |',
             f'| {report["startedAt"]} | {report.get("endedAt", "In progress")} | `{report.get("baseCommit", "unavailable")[:12]}` → `{report.get("resultCommit", "unavailable")[:12]}` |', '',
             '## Work delivered', '']
    actions = report.get('majorActions', [])
    lines.extend([f'- {esc(a)}' for a in actions] or ['- No completed actions reported.'])
    lines += ['', '<details><summary>Files and components affected</summary>', '']
    lines.extend([f'- `{esc(f)}`' for f in report.get('files', [])] or ['No committed file changes.'])
    lines += ['', '</details>', '', '## AI compute', '',
              '| Orchestrator | Subscription route | Throughput route |', '| --- | --- | --- |',
              '| OpenClaw (persistent Gateway) | Claw Router → official Codex; Claude profiles available after login | OpenCode → DeepSeek directly when a key is available |', '',
              '| Observed runtime | Exit | Usage / commands |', '| --- | --- | --- |']
    for compute in report.get('compute', []):
        events = compute.get('events', [])
        usage = [e['usage'] for e in events if 'usage' in e]
        lines.append(f'| {esc(compute.get("runtime", "unknown"))} | {compute.get("exitCode", "unknown")} | {esc(json.dumps(usage))}; {sum("command" in e for e in events)} commands |')
    if not report.get('compute'):
        lines.append('| No runtime observed | — | No claims made |')
    lines += ['', '## Verification & deployment', '', '| Check / target | Result | Evidence |', '| --- | --- | --- |']
    for test in report.get('tests', []):
        lines.append(f'| {esc(test.get("command", "reported check"))} | {esc(test.get("status", "unknown"))} | {esc(test.get("evidence", "Agent-reported; inspect execution details"))} |')
    if not report.get('tests'):
        lines.append('| Tests | Not reported | No passing-test claim |')
    deployment = report.get('deployment', {})
    lines.append(f'| Deployment | {esc(deployment.get("status", "not reported"))} | {esc(deployment.get("url", "No verified deployment URL"))} |')
    for heading, key in [('Warnings', 'warnings'), ('Failures', 'failures'), ('Next recommended actions', 'nextActions')]:
        lines += ['', f'## {heading}', '']
        lines.extend([f'- {esc(w)}' for w in report.get(key, [])] or ['None recorded.'])
    lines += ['', '## Timeline', '', '| UTC | Event |', '| --- | --- |']
    lines.extend(f'| {e["at"]} | {esc(e["event"])} |' for e in report.get('timeline', []))
    lines += ['', '## Links', '', f'- [Project](https://github.com/{repo})',
              f'- [Actions history](https://github.com/{repo}/actions/workflows/run-the-loop.yml)']
    if report.get('actionsUrl'):
        lines.append(f'- [This run]({report["actionsUrl"]})')
    if report.get('resultCommit'):
        lines.append(f'- [Result commit](https://github.com/{repo}/commit/{report["resultCommit"]})')
    lines += ['', '<details><summary>Structured execution details</summary>', '', '```json',
              scrub(json.dumps({k: report.get(k) for k in ['runId', 'runtimeExitCode', 'compute']}, indent=2)),
              '```', '', '</details>', '']
    return '\n'.join(lines)


def run(repository, output=None, message=None, timeout=3600):
    p = project(repository)
    if not p['enabled']:
        raise ValueError('Project is disabled in canonical fleet manifest')
    run_id = f'{repository.replace("/", "--")}-{os.environ.get("GITHUB_RUN_ID", "local-" + str(time.time_ns()))}-{os.environ.get("GITHUB_RUN_ATTEMPT", "1")}'
    logdir = AI / 'logs' / run_id
    logdir.mkdir(parents=True, mode=0o700)
    output = Path(output or logdir)
    output.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    identity_path = HOME / '.config/agent-fleet/machine.json'
    identity = json.loads(identity_path.read_text()) if identity_path.exists() else {}
    report = {'schema': 1, 'runId': run_id, 'project': repository, 'machine': os.environ.get('AI_MACHINE_ID', identity.get('machineId', manifest()['machine'])),
              'runner': os.environ.get('RUNNER_NAME', 'local'), 'wrapperPid': os.getpid(), 'startedAt': now(), 'status': 'running',
              'objective': message or 'Execute one repository-owned /run-the-loop iteration',
              'sharedWorkflowRevision': os.environ.get('FLEET_REVISION'),
              'majorActions': [], 'tests': [], 'files': [], 'compute': [], 'warnings': [], 'failures': [], 'nextActions': [], 'timeline': []}
    if os.environ.get('GITHUB_RUN_ID'):
        report['actionsUrl'] = f'https://github.com/{repository}/actions/runs/{os.environ["GITHUB_RUN_ID"]}'
    def event(text):
        report['timeline'].append({'at': now(), 'event': text})
        atomic_json(logdir / 'run.json', report)
    work = AI / 'worktrees' / repository.split('/')[-1] / run_id
    repo = AI / 'repos' / repository.split('/')[-1]
    lockdir = AI / 'state/locks'
    lockdir.mkdir(parents=True, exist_ok=True)
    child = None
    try:
        event('Admitted by GitHub; waiting for repository mutation lease')
        with (lockdir / (repository.replace('/', '--') + '.lock')).open('w') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            event('Repository lease acquired; other repositories remain concurrent')
            if not repo.exists():
                command(['gh', 'repo', 'clone', repository, str(repo)], timeout=300)
            command(['git', 'fetch', 'origin', 'main'], repo, timeout=120)
            base = command(['git', 'rev-parse', 'origin/main'], repo)
            report['baseCommit'] = base
            work.parent.mkdir(parents=True, exist_ok=True)
            command(['git', 'worktree', 'add', '--detach', str(work), base], repo)
            event('Isolated worktree created from current main')
            result_file = logdir / 'agent-report.json'
            env = os.environ.copy()
            env.update({'AI_RUN_ID': run_id, 'AI_RUN_WORKSPACE': str(work), 'AI_RUN_LOG_DIR': str(logdir),
                        'AI_FLEET_REPORT': str(result_file), 'AI_MACHINE_ID': manifest()['machine']})
            context = json.dumps({'runId': run_id, 'workspace': str(work), 'logdir': str(logdir)})
            prompt = f'''<fleet-run>{context}</fleet-run>
Global run ID: {run_id}. Work ONLY in {work}. This is an isolated worktree based on main.
Read {ROOT}/control-plane/FLEET.md and the machine profile. GitHub is the scheduler and ledger.
Inspect git state, prior GitHub Actions history, existing task/context files, tests and commits before deciding work.
Execute exactly one /run-the-loop iteration. If .claude/commands/run-the-loop.md exists, follow it; otherwise read {ROOT}/commands/run-the-loop.md.
Follow repo-local requirements. Main is normal: commit verified changes; leave publication to the outer runner, which fast-forwards main. Do not force-push, reset unrelated state or publish the fleet control website.
Use cr for official Claude/Codex subscription compute; use {ROOT}/bin/opencode-deepseek.sh for direct DeepSeek throughput when its key is available. Never use local Cloudflare AI Gateway or paid OpenAI/Anthropic API fallbacks. No Browser Harness.
Do not change scheduler/runner credentials. Report missing credentials honestly and do other useful work. Your native CLI has repository tools; do not assume a text backend forbids using them.
Write a non-secret JSON report to {result_file} with majorActions (string array), tests (objects: command,status,evidence), deployment (status,url), warnings, nextActions. Report only observed evidence. Never store keys or OAuth secrets.
{('Additional objective: ' + message) if message else ''}'''
            (logdir / 'prompt.md').write_text(prompt)
            event('Invoking OpenClaw → Claw Router → official Codex')
            with (logdir / 'openclaw.stdout').open('w') as out, (logdir / 'openclaw.stderr').open('w') as err:
                child = subprocess.Popen(['openclaw', 'agent', '--agent', p['agent'], '--session-key', f'agent:{p["agent"]}:{run_id}', '--session-id', str(uuid.uuid5(uuid.NAMESPACE_URL, run_id)),
                                          '--message-file', str(logdir / 'prompt.md'), '--json', '--timeout', str(timeout)],
                                         cwd=work, env=env, stdout=out, stderr=err, start_new_session=True)
                try:
                    code = child.wait(timeout=timeout + 60)
                except subprocess.TimeoutExpired:
                    os.killpg(child.pid, signal.SIGTERM)
                    try:
                        child.wait(timeout=15)
                    except subprocess.TimeoutExpired:
                        os.killpg(child.pid, signal.SIGKILL)
                        child.wait()
                    raise RuntimeError('Agent exceeded turn deadline; retained worktree for next-state recovery')
            report['runtimeExitCode'] = code
            event(f'OpenClaw turn finished with exit {code}')
            if result_file.exists():
                agent_report = json.loads(result_file.read_text())
                for key in ['majorActions', 'tests', 'deployment', 'warnings', 'nextActions']:
                    if key in agent_report:
                        report[key] = safe_json(agent_report[key])
            else:
                report['warnings'].append('Agent did not produce the required structured completion report.')
            for trace in logdir.glob('compute-*.json'):
                report['compute'].append(safe_json(json.loads(trace.read_text())))
            report['resultCommit'] = command(['git', 'rev-parse', 'HEAD'], work)
            report['files'] = command(['git', 'diff', '--name-only', base, 'HEAD'], work).splitlines()
            dirty = command(['git', 'status', '--porcelain'], work)
            if code:
                raise RuntimeError(f'OpenClaw failed with exit {code}; private diagnostics retained in {logdir}')
            if not result_file.exists():
                raise RuntimeError('Missing agent completion evidence; execution is incomplete')
            if dirty:
                raise RuntimeError('Agent left uncommitted changes; retained worktree, no automatic git add/reset')
            if report['resultCommit'] != base:
                command(['git', 'push', 'origin', 'HEAD:main'], work, timeout=180)
                event('Verified agent commits published to main using a normal fast-forward push')
            command(['git', 'worktree', 'remove', str(work)], repo)
            report['status'] = 'success'
            event('Worktree cleaned; repository state remains canonical')
    except Exception as error:
        report['status'] = 'failure'
        report['failures'].append(scrub(error))
        report['nextActions'].append('Inspect actual git/worktree state and this run before continuing; no queued execution state is required.')
        event('Run failed; retained evidence and any unfinished worktree')
    finally:
        report['endedAt'] = now()
        report['durationSeconds'] = round(time.monotonic() - started, 2)
        atomic_json(logdir / 'run.json', report)
        atomic_json(output / 'run.json', report)
        summary = markdown(report)
        (output / 'summary.md').write_text(summary)
        (logdir / 'summary.md').write_text(summary)
        if os.environ.get('GITHUB_STEP_SUMMARY'):
            with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as f:
                f.write(summary)
    print(json.dumps({'runId': run_id, 'status': report['status'], 'report': str(output / 'run.json')}))
    return 0 if report['status'] == 'success' else 1


def index():
    database = AI / 'state/search.sqlite'
    database.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(database) as db:
        db.execute('CREATE VIRTUAL TABLE IF NOT EXISTS documents USING fts5(path UNINDEXED, content)')
        db.execute('DELETE FROM documents')
        sources = list(ROOT.rglob('*.md')) + list((AI / 'logs').glob('*/summary.md'))
        for repo in manifest()['projects']:
            directory = AI / 'repos' / repo['repository'].split('/')[-1]
            sources += [p for pattern in ['AGENTS.md', 'CLAUDE.md', 'docs/**/*.md', '.claude/run-the-loop/*.md'] for p in directory.glob(pattern)]
        for source in sources:
            if '.git' in source.parts or 'node_modules' in source.parts or source.stat().st_size > 300000:
                continue
            db.execute('INSERT INTO documents VALUES (?,?)', (str(source), scrub(source.read_text(errors='replace'))))
        print(json.dumps({'indexed': db.execute('SELECT count(*) FROM documents').fetchone()[0], 'database': str(database), 'canonical': False}))


def search(query):
    # Phrase tokens are escaped; users cannot inject arbitrary MATCH syntax.
    term = ' AND '.join('"' + word.replace('"', '""') + '"' for word in query.split())
    if not term:
        return []
    with sqlite3.connect(AI / 'state/search.sqlite') as db:
        return [{'path': p, 'excerpt': s} for p, s in db.execute(
            'SELECT path, snippet(documents,1,"",""," … ",32) FROM documents WHERE documents MATCH ? ORDER BY rank LIMIT 20', (term,))]


def main():
    p = argparse.ArgumentParser()
    commands = p.add_subparsers(dest='action', required=True)
    r = commands.add_parser('run')
    r.add_argument('--repository', required=True)
    r.add_argument('--output')
    r.add_argument('--message')
    r.add_argument('--timeout', type=int, default=3600)
    commands.add_parser('index')
    s = commands.add_parser('search')
    s.add_argument('query')
    a = p.parse_args()
    if a.action == 'run':
        sys.exit(run(a.repository, a.output, a.message, a.timeout))
    if a.action == 'index':
        index()
    if a.action == 'search':
        print(json.dumps(search(a.query), indent=2))


if __name__ == '__main__':
    main()
