"""Integration tests use real git remotes/worktrees and a controlled agent process."""
import contextlib
import io
import json
import multiprocessing
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import fleet


def invoke(repo, queue, ai, path):
    fleet.AI = Path(ai)
    os.environ['PATH'] = path
    with contextlib.redirect_stdout(io.StringIO()):
        queue.put(fleet.run(repo, timeout=15))


class FleetIntegration(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.old_ai = fleet.AI
        fleet.AI = self.root / 'ai'
        self.old_path = os.environ['PATH']
        self.bin = self.root / 'bin'
        self.bin.mkdir()
        executable = self.bin / 'openclaw'
        executable.write_text('''#!/usr/bin/env python3
import json,os,pathlib,subprocess,time
p=pathlib.Path(os.environ['AI_RUN_WORKSPACE']);log=pathlib.Path(os.environ['AI_RUN_LOG_DIR'])
start=time.time()
(p/'agent-change.txt').write_text(os.environ['AI_RUN_ID'])
if os.environ.get('FLEET_TEST_FAIL'):
 raise SystemExit(17)
time.sleep(.7)
subprocess.run(['git','add','agent-change.txt'],cwd=p,check=True,stdout=subprocess.DEVNULL)
subprocess.run(['git','-c','user.name=FleetTest','-c','user.email=test@example.invalid','commit','-m','test: verified slice'],cwd=p,check=True,stdout=subprocess.DEVNULL)
if os.environ.get('FLEET_TEST_ORPHAN'):
 subprocess.run(['git','checkout','--orphan','unrelated'],cwd=p,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 subprocess.run(['git','-c','user.name=FleetTest','-c','user.email=test@example.invalid','commit','-m','test: unrelated history'],cwd=p,check=True,stdout=subprocess.DEVNULL)
pathlib.Path(os.environ['AI_FLEET_REPORT']).write_text(json.dumps({'majorActions':['Committed a controlled test slice'],'tests':([{'command':'controlled failing check','status':'failed'}] if os.environ.get('FLEET_TEST_BAD_CHECK') else []),'warnings':[],'nextActions':[]}))
(log/'test-agent-interval.json').write_text(json.dumps([start,time.time()]))
''')
        executable.chmod(0o755)
        os.environ['PATH'] = str(self.bin) + ':' + self.old_path
        self.projects = [p['repository'] for p in fleet.manifest()['projects'][:2]]
        for repository in self.projects:
            local = fleet.AI / 'repos' / repository.split('/')[-1]
            bare = self.root / (repository.split('/')[-1] + '.git')
            subprocess.run(['git', 'init', '--bare', '-b', 'main', str(bare)], capture_output=True, check=True)
            subprocess.run(['git', 'clone', str(bare), str(local)], capture_output=True, check=True)
            (local / 'README.md').write_text('Controlled test repository\n')
            subprocess.run(['git', 'add', 'README.md'], cwd=local, check=True)
            subprocess.run(['git', '-c', 'user.name=FleetTest', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'test: seed'], cwd=local, capture_output=True, check=True)
            subprocess.run(['git', 'push', 'origin', 'main'], cwd=local, capture_output=True, check=True)

    def tearDown(self):
        fleet.AI = self.old_ai
        os.environ['PATH'] = self.old_path
        for key in ('FLEET_TEST_FAIL','FLEET_TEST_BAD_CHECK','FLEET_TEST_ORPHAN'):
            os.environ.pop(key, None)
        self.temp.cleanup()

    def test_publication_does_not_touch_dirty_canonical_checkout(self):
        local = fleet.AI / 'repos' / self.projects[0].split('/')[-1]
        (local / 'owner-work.txt').write_text('Unrelated uncommitted owner work')
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(fleet.run(self.projects[0], timeout=15), 0)
        self.assertEqual((local / 'owner-work.txt').read_text(), 'Unrelated uncommitted owner work')
        records = list((fleet.AI / 'logs').glob('*/run.json'))
        record = json.loads(records[0].read_text())
        self.assertNotEqual(record['baseCommit'], record['resultCommit'])
        self.assertEqual(record['files'], ['agent-change.txt'])
        self.assertEqual(record['status'], 'success')
        self.assertFalse(list((fleet.AI / 'worktrees' / local.name).iterdir()))

    def test_failed_agent_preserves_work_and_writes_failure_receipt(self):
        os.environ['FLEET_TEST_FAIL'] = '1'
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(fleet.run(self.projects[0], timeout=15), 1)
        work = next((fleet.AI / 'worktrees' / self.projects[0].split('/')[-1]).iterdir())
        self.assertTrue((work / 'agent-change.txt').exists())
        receipt = json.loads(next((fleet.AI / 'logs').glob('*/run.json')).read_text())
        self.assertEqual(receipt['status'], 'failure')
        self.assertTrue(receipt['failures'])
        summary = next((fleet.AI / 'logs').glob('*/summary.md')).read_text()
        self.assertIn('No passing-test claim', summary)

    def parallel(self, repositories):
        queue = multiprocessing.Queue()
        children = [multiprocessing.Process(target=invoke, args=(r, queue, str(fleet.AI), os.environ['PATH'])) for r in repositories]
        for child in children:
            child.start()
        for child in children:
            child.join(20)
            self.assertFalse(child.is_alive())
            self.assertEqual(child.exitcode, 0)
        self.assertEqual([queue.get(timeout=2) for _ in children], [0, 0])
        return sorted(json.loads(p.read_text()) for p in (fleet.AI / 'logs').glob('*/test-agent-interval.json'))

    def test_same_repository_mutations_are_serialized(self):
        first, second = self.parallel([self.projects[0], self.projects[0]])
        self.assertGreaterEqual(second[0], first[1])

    def test_different_repositories_execute_concurrently(self):
        first, second = self.parallel(self.projects)
        self.assertLess(second[0], first[1])

    def test_clean_submodule_worktree_is_retained_without_false_failure(self):
        local = fleet.AI / 'repos' / self.projects[0].split('/')[-1]
        (local / '.gitmodules').write_text('# Controlled submodule fixture\n')
        subprocess.run(['git','add','.gitmodules'],cwd=local,check=True)
        subprocess.run(['git','-c','user.name=FleetTest','-c','user.email=test@example.invalid','commit','-m','test: submodule metadata'],cwd=local,capture_output=True,check=True)
        subprocess.run(['git','push','origin','main'],cwd=local,capture_output=True,check=True)
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(fleet.run(self.projects[0],timeout=15),0)
        record=json.loads(next((fleet.AI/'logs').glob('*/run.json')).read_text())
        self.assertTrue(any('submodule' in w for w in record['warnings']))

    def test_reported_failed_check_prevents_publication(self):
        os.environ['FLEET_TEST_BAD_CHECK'] = '1'
        local = fleet.AI / 'repos' / self.projects[0].split('/')[-1]
        before = fleet.command(['git','ls-remote','origin','refs/heads/main'],local)
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(fleet.run(self.projects[0],timeout=15),1)
        self.assertEqual(before,fleet.command(['git','ls-remote','origin','refs/heads/main'],local))

    def test_non_descendant_result_prevents_publication(self):
        os.environ['FLEET_TEST_ORPHAN'] = '1'
        with contextlib.redirect_stdout(io.StringIO()):
            self.assertEqual(fleet.run(self.projects[0],timeout=15),1)
        record=json.loads(next((fleet.AI/'logs').glob('*/run.json')).read_text())
        self.assertEqual(record['failureCategory'],'commit-lineage')

    def test_secret_redaction_and_repository_allowlist(self):
        self.assertEqual(fleet.scrub('ghp_' + 'A' * 40), '[REDACTED]')
        with self.assertRaises(ValueError):
            fleet.project('heymegabyte/agent-skills')
        with self.assertRaises(ValueError):
            fleet.project('unapproved/repository')


if __name__ == '__main__':
    unittest.main()
