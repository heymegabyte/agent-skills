"""Read one secret over verified HTTPS; never persist access tokens or responses."""
import json,os,stat
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
 credentials=json.loads(protected(root/'infisical-credentials.json'))
 opener=build_opener(NoRedirect)
 def request(path,body=None,token=None):
  headers={'Content-Type':'application/json'}
  if token:headers['Authorization']='Bearer '+token
  r=Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers=headers)
  with opener.open(r,timeout=20) as response:return json.load(response)
 token=request('/api/v1/auth/universal-auth/login',credentials)['accessToken']
 query=urlencode({'projectId':c['projectId'],'environment':c['environment'],'secretPath':c.get('secretPath','/'),'type':'shared'})
 return request('/api/v4/secrets/'+quote(name,safe='')+'?'+query,token=token)['secret']['secretValue']
