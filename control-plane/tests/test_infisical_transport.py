import importlib.util,json,os,tempfile,unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('infisical_provider',Path(__file__).resolve().parents[2]/'bin/fleet-infisical.py')
provider=importlib.util.module_from_spec(spec);spec.loader.exec_module(provider)
class InfisicalTransportTests(unittest.TestCase):
 def invoke(self,secret='value',login_code=0):
  with tempfile.TemporaryDirectory() as temp:
   home=Path(temp);root=home/'.config/agent-fleet';root.mkdir(parents=True)
   creds=home/'identity.env';creds.write_text('INFISICAL_UNIVERSAL_AUTH_CLIENT_ID="identity"\nINFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET="private-secret"\n');creds.chmod(0o600)
   config=root/'infisical.json';config.write_text(json.dumps({'url':'https://eu.infisical.com','projectId':'project','environment':'prod','credentialsFile':str(creds),'transport':'cli'}));config.chmod(0o600)
   responses=[SimpleNamespace(returncode=login_code,stdout='private-access-token'),SimpleNamespace(returncode=0,stdout=secret)]
   with patch.object(provider.Path,'home',return_value=home),patch.object(provider.subprocess,'run',side_effect=responses) as call,patch.dict(os.environ,{'GITHUB_ENV':'private-command-file'}):
    value=provider.get('DEEPSEEK_API_KEY')
    for args,kwargs in call.call_args_list:
     self.assertNotIn('private-secret',args[0]);self.assertNotIn('private-access-token',args[0]);self.assertNotIn('GITHUB_ENV',kwargs['env'])
    self.assertEqual(call.call_args_list[-1].kwargs['env']['INFISICAL_TOKEN'],'private-access-token')
    return value
 def test_existing_identity_is_consumed_privately(self):self.assertEqual(self.invoke(),'value')
 def test_missing_secret_is_empty_not_provider_unconfigured(self):self.assertEqual(self.invoke(''),'')
 def test_auth_failure_is_closed(self):
  with self.assertRaises(ValueError):self.invoke(login_code=1)
if __name__=='__main__':unittest.main()
