import importlib.util,json,os,subprocess,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from run_context import validate_report,child_environment,packet
from skill_links import synchronize
class ContractTests(unittest.TestCase):
 def test_bad_report_cannot_break_finalizer(self):
  for d in ({'tests':'pass'},{'deployment':[]},{'majorActions':[{}]},{'tests':[{'status':[]}]}):
   with self.assertRaises(ValueError):validate_report(d)
  self.assertEqual(validate_report({})['tests'],[])
  with self.assertRaises(ValueError):validate_report({'deployment':{'url':'javascript:alert(1)'}})
 def test_actions_control_files_are_not_native_capabilities(self):
  self.assertEqual(child_environment({'GITHUB_ENV':'secretpath','GITHUB_TOKEN':'s','AI_RUN_ID':'run','PATH':'bin'}),{'AI_RUN_ID':'run','PATH':'bin'})
 def test_receipts_are_project_scoped_and_malformed_tolerated(self):
  with tempfile.TemporaryDirectory() as t:
   ai=Path(t)
   for folder,data in [('owner--repo-1',{'project':'owner/repo','status':'failure'}),('owner--repo-2',{'project':'other/repo','status':'success'})]:
    p=ai/'logs'/folder;p.mkdir(parents=True);(p/'run.json').write_text(json.dumps(data))
   d=packet(ai,{'repository':'owner/repo'},ai,ai/'work','a'*40)
   self.assertEqual(len(d['priorRuns']),1);self.assertNotIn('other/repo',json.dumps(d))
 def test_new_skills_linked_and_owner_overrides_preserved(self):
  with tempfile.TemporaryDirectory() as t:
   base=Path(t);root=base/'source';root.mkdir();(root/'control-plane').mkdir()
   source=Path(__file__).resolve().parents[1]/'skills-doctor.py'
   (root/'control-plane/skills-doctor.py').write_text(source.read_text())
   skill=root/'new-skill';skill.mkdir();(skill/'SKILL.md').write_text('---\nname: new-skill\ndescription: A valid test skill.\n---\n')
   home=base/'home';owned=home/'.claude/skills/new-skill';owned.mkdir(parents=True);(owned/'owner.txt').write_text('keep')
   r=synchronize(root,home);self.assertEqual(r['skills'],1)
   self.assertTrue((home/'.codex/skills/new-skill').is_symlink());self.assertTrue((owned/'owner.txt').exists())
 def test_workflow_shell_blocks_are_parseable(self):
  import yaml
  root=Path(__file__).resolve().parents[2]
  document=yaml.safe_load((root/'.github/workflows/run-the-loop.yml').read_text())
  for job in document['jobs'].values():
   for step in job['steps']:
    if 'run' in step:subprocess.run(['bash','-n'],input=step['run'],text=True,check=True)
if __name__=='__main__':unittest.main()
