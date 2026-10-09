"""Real adapter process tests; fake official CLI, isolated HOME, no network/auth."""
import json
import os
import shutil
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest

ADAPTER = Path(__file__).resolve().parents[1] / 'openclaw-fleet/cli.py'


class AdapterIntegration(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.home = Path(self.temp.name)
        self.bin = self.home / '.local/bin'
        self.bin.mkdir(parents=True)
        self.workspace = self.home / 'ai/worktrees/test/run'
        self.workspace.mkdir(parents=True)
        self.logs = self.home / 'ai/logs/test'
        self.logs.mkdir(parents=True)
        self.capture = self.home / 'capture.json'
        self.policy = self.home / 'policy.md'
        self.policy.write_text('Follow the selected shared skills.')
        (self.bin / 'cr').write_text('''#!/usr/bin/env python3
import json,os,pathlib,subprocess,sys,time
pathlib.Path(os.environ['CAPTURE']).write_text(json.dumps({'args':sys.argv[1:],'input':sys.stdin.read(),'env':dict(os.environ)}))
mode=os.environ.get('FAKE_MODE','ok')
if mode=='sleep':
 subprocess.Popen([sys.executable,'-c',"import time,pathlib;time.sleep(2);pathlib.Path("+repr(os.environ['MARKER'])+").write_text('orphan')"])
 time.sleep(10)
if mode=='empty': raise SystemExit(0)
if mode=='claude_error': print(json.dumps({'type':'result','is_error':True,'result':'Stopped'}));raise SystemExit(0)
if mode=='fail': print(json.dumps({'type':'turn.failed','error':{'message':'failure'}}));raise SystemExit(0)
print(json.dumps({'type':'thread.started','thread_id':'fake-thread'}))
print(json.dumps({'type':'item.completed','item':{'type':'command_execution','command':'secret=hidden','exit_code':0}}))
print(json.dumps({'type':'item.completed','item':{'type':'agent_message','text':'OK'}}))
print(json.dumps({'type':'turn.completed','usage':{'input_tokens':12,'output_tokens':1,'bad':'hidden'}}))
''')
        (self.bin / 'cr').chmod(0o755)
        self.env = dict(os.environ, HOME=str(self.home), PATH=str(self.bin) + ':' + os.environ['PATH'],
                        CAPTURE=str(self.capture), MARKER=str(self.home / 'orphan'))

    def tearDown(self):
        self.temp.cleanup()

    def invoke(self, provider='codex', deadline=None, policy=True):
        context = {'runId':'test','workspace':str(self.workspace),'logdir':str(self.logs)}
        if deadline is not None:
            context['deadlineEpoch'] = deadline
        args = [sys.executable,str(ADAPTER),'--provider-model',provider]
        if policy:
            args += ['--system-prompt-file',str(self.policy)]
        return subprocess.run(args,input='<fleet-run>'+json.dumps(context)+'</fleet-run>\nDo the task.',
                              env=self.env,text=True,capture_output=True,timeout=8)

    def trace(self):
        return json.loads(next(self.logs.glob('compute-*.json')).read_text())

    def test_policy_transport_and_credential_control_file_isolation(self):
        forbidden = ['GITHUB_ENV','GITHUB_PATH','GITHUB_OUTPUT','GITHUB_STEP_SUMMARY','GITHUB_STATE',
                     'GITHUB_TOKEN','GH_TOKEN','ACTIONS_RUNTIME_TOKEN','GITHUB_ACTIONS','OPENAI_API_KEY','ANTHROPIC_API_KEY']
        for name in forbidden:
            self.env[name] = str(self.home / 'do-not-write')
        result = self.invoke()
        self.assertEqual(result.returncode,0,result.stderr)
        captured = json.loads(self.capture.read_text())
        self.assertIn('Follow the selected shared skills.',captured['input'])
        self.assertIn('Do the task.',captured['input'])
        self.assertTrue(all(name not in captured['env'] for name in forbidden))
        self.assertEqual(captured['env']['AI_RUN_ID'],'test')
        self.assertFalse((self.home / 'do-not-write').exists())
        trace = self.trace()
        self.assertEqual(trace['events'][-1]['usage'],{'input_tokens':12,'output_tokens':1})
        self.assertNotIn('secret=hidden',json.dumps(trace))

    def test_claude_preserves_native_system_prompt_and_appends_file(self):
        result = self.invoke('claude')
        self.assertEqual(result.returncode,0,result.stderr)
        captured = json.loads(self.capture.read_text())
        self.assertIn('--append-system-prompt-file',captured['args'])
        self.assertNotIn('--system-prompt',captured['args'])
        self.assertNotIn('Follow the selected shared skills.',captured['input'])

    def test_deepseek_prompt_and_policy_use_stdin(self):
        root = self.home / 'isolated-source'
        adapter = root / 'control-plane/openclaw-fleet/cli.py'
        adapter.parent.mkdir(parents=True)
        shutil.copyfile(ADAPTER, adapter)
        (root / 'bin').mkdir()
        (root / 'bin/opencode-deepseek.sh').symlink_to(self.bin / 'cr')
        self.env['AI_RUN_LOG_DIR'] = str(self.logs)
        result = subprocess.run([sys.executable,str(adapter),'--provider-model','deepseek',
                                 '--system-prompt-file',str(self.policy)],input='Direct throughput task',
                                env=self.env,cwd=self.workspace,text=True,capture_output=True,timeout=8)
        self.assertEqual(result.returncode,0,result.stderr)
        captured = json.loads(self.capture.read_text())
        self.assertIn('Follow the selected shared skills.',captured['input'])
        self.assertIn('Direct throughput task',captured['input'])
        self.assertNotIn('Direct throughput task',captured['args'])
        self.assertFalse(self.trace()['router'])

    def test_error_event_or_missing_reply_fails_even_on_exit_zero(self):
        for mode in ['claude_error','fail','empty']:
            with self.subTest(mode=mode):
                self.env['FAKE_MODE'] = mode
                result = self.invoke()
                self.assertNotEqual(result.returncode,0)
                self.assertNotIn('"result"',result.stdout)

    def test_deadline_kills_entire_child_process_group(self):
        self.env['FAKE_MODE'] = 'sleep'
        result = self.invoke(deadline=time.time()+.5)
        self.assertEqual(result.returncode,124,result.stderr)
        time.sleep(2.2)
        self.assertFalse((self.home / 'orphan').exists())
        self.assertIn('CLI exceeded run deadline',self.trace()['failures'])

    def test_expired_deadline_does_not_launch(self):
        result = self.invoke(deadline=time.time()-10)
        self.assertEqual(result.returncode,124)
        self.assertFalse(self.capture.exists())

    def test_manual_turn_without_fleet_context_or_system_prompt(self):
        self.env['AI_RUN_LOG_DIR'] = str(self.logs)
        result = subprocess.run([sys.executable,str(ADAPTER)],input='Manual task',env=self.env,
                                cwd=self.workspace,text=True,capture_output=True,timeout=8)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertEqual(json.loads(result.stdout)['result'],'OK')


if __name__ == '__main__':
    unittest.main()
