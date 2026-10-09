"""Read one secret over verified HTTPS; never persist access tokens or responses."""
import json,os,stat,shlex,subprocess
from pathlib import Path
from urllib.request import Request,build_opener,HTTPRedirectHandler
from urllib.parse import urlsplit,urlencode,quote
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):raise ValueError('Redirect refused')
def protected(path):
 info=path.lstat()
 if not stat.S_ISREG(info.st_mode) or info.st_uid!=os.getuid() or info.st_mode&0o077:raise ValueError('Private file requires owner-only permissions')
 return path.read_text()
def get(name):
 root=Path.home()/'.config/agent-fleet'; config=root/'infisical.json'
 if not config.exists():return None
 c=json.loads(protected(config));base=c['url'].rstrip('/');url=urlsplit(base)
 if url.scheme!='https' or not url.hostname or url.username or url.password or url.query or url.fragment or url.path not in ('','/'):raise ValueError('Infisical URL must be an HTTPS origin')
 credential_path=Path(c.get('credentialsFile',str(root/'infisical-credentials.json'))).expanduser()
 raw=protected(credential_path)
 if credential_path.suffix=='.env':
  fields={}
  for line in raw.splitlines():
   key,sep,value=line.removeprefix('export ').partition('=')
   if sep and key.strip() in ('INFISICAL_UNIVERSAL_AUTH_CLIENT_ID','INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET'):
    words=shlex.split(value,comments=True)
    if len(words)!=1:raise ValueError('Invalid identity field')
    fields[key.strip()]=words[0]
  credentials={'clientId':fields['INFISICAL_UNIVERSAL_AUTH_CLIENT_ID'],'clientSecret':fields['INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET']}
 else:credentials=json.loads(raw)
 if c.get('transport')=='cli':
  env=os.environ.copy()
  for key in ('INFISICAL_TOKEN','GITHUB_ENV','GITHUB_OUTPUT','GITHUB_STEP_SUMMARY','GITHUB_STATE'):
   env.pop(key,None)
  env.update({'INFISICAL_UNIVERSAL_AUTH_CLIENT_ID':credentials['clientId'],
              'INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET':credentials['clientSecret'],
              'DO_NOT_TRACK':'1'})
  common=['--domain',base,'--silent','--telemetry=false']
  login=subprocess.run(['infisical','login','--method=universal-auth','--plain']+common,env=env,capture_output=True,text=True,timeout=20)
  if login.returncode or not login.stdout.strip():raise ValueError('Infisical official CLI authentication failed')
  env['INFISICAL_TOKEN']=login.stdout.strip()
  result=subprocess.run(['infisical','secrets','get',name,'--plain','--projectId',c['projectId'],
                         '--env',c['environment'],'--path',c.get('secretPath','/')]+common,
                        env=env,capture_output=True,text=True,timeout=20)
  if result.returncode:raise ValueError('Infisical official CLI lookup failed')
  return result.stdout.rstrip('\n')
 opener=build_opener(NoRedirect)
 def request(path,body=None,token=None):
  headers={'Content-Type':'application/json'}
  if token:headers['Authorization']='Bearer '+token
  r=Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers=headers)
  with opener.open(r,timeout=20) as response:return json.load(response)
 token=request('/api/v1/auth/universal-auth/login',credentials)['accessToken']
 query=urlencode({'projectId':c['projectId'],'environment':c['environment'],'secretPath':c.get('secretPath','/'),'type':'shared'})
 return request('/api/v4/secrets/'+quote(name,safe='')+'?'+query,token=token)['secret']['secretValue']
