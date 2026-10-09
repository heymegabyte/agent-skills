import sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from runner_safety import audit
class RunnerSafetyTests(unittest.TestCase):
 def test_bulk_export_hook_is_reported_then_removed_without_touching_other_values(self):
  with tempfile.TemporaryDirectory() as temp:
   ai=Path(temp); runner=ai/'runners/worker-01';runner.mkdir(parents=True)
   hook=ai/'hook.sh';hook.write_text('infisical export >> "$GITHUB_ENV"\n')
   env=runner/'.env';original=f'LANG=en_US.UTF-8\nACTIONS_RUNNER_HOOK_JOB_STARTED={hook}\nOWNER_SETTING=keep\n';env.write_text(original)
   self.assertFalse(audit(ai)['ok']);self.assertEqual(env.read_text(),original)
   self.assertTrue(audit(ai,True)['ok']);self.assertEqual(env.read_text(),'LANG=en_US.UTF-8\nOWNER_SETTING=keep\n')
 def test_unrelated_hook_is_preserved(self):
  with tempfile.TemporaryDirectory() as temp:
   ai=Path(temp);runner=ai/'runners/worker-01';runner.mkdir(parents=True)
   hook=ai/'hook.sh';hook.write_text('echo health-check\n')
   env=runner/'.env';original=f'ACTIONS_RUNNER_HOOK_JOB_STARTED={hook}\n';env.write_text(original)
   self.assertTrue(audit(ai,True)['ok']);self.assertEqual(env.read_text(),original)
if __name__=='__main__':unittest.main()
