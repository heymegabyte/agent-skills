"""Bounded local context and report contracts; git/files/GitHub remain canonical."""
import json,re,time
from pathlib import Path

CONTROL_ENV = {'GITHUB_ENV','GITHUB_PATH','GITHUB_OUTPUT','GITHUB_STEP_SUMMARY','GITHUB_STATE',
               'GITHUB_TOKEN','GH_TOKEN','ACTIONS_RUNTIME_TOKEN','ACTIONS_ID_TOKEN_REQUEST_TOKEN'}

def child_environment(env):
    return {k:v for k,v in env.items() if k not in CONTROL_ENV}

def validate_report(data):
    if not isinstance(data,dict):raise ValueError('Completion report must be an object')
    result={}
    for key in ('majorActions','warnings','nextActions'):
        items=data.get(key,[])
        if not isinstance(items,list) or len(items)>100 or any(not isinstance(x,str) or len(x)>4000 for x in items):
            raise ValueError('Invalid completion report field: '+key)
        result[key]=items
    tests=data.get('tests',[])
    if not isinstance(tests,list) or len(tests)>100:raise ValueError('Invalid tests list')
    result['tests']=[]
    for test in tests:
        if not isinstance(test,dict) or any(not isinstance(test.get(k,''),str) for k in ('command','status','evidence')):raise ValueError('Invalid test evidence')
        result['tests'].append({k:test.get(k,'')[:4000] for k in ('command','status','evidence')})
    deployment=data.get('deployment',{})
    if not isinstance(deployment,dict) or any(deployment.get(k) is not None and not isinstance(deployment.get(k),str) for k in ('status','url')):raise ValueError('Invalid deployment evidence')
    url=deployment.get('url') or ''
    if url and not re.match(r'^https?://[^\s<>]+$',url):raise ValueError('Invalid deployment URL')
    result['deployment']={k:(deployment.get(k) or '')[:4000] for k in ('status','url')}
    return result

def recent_receipts(ai,repository,limit=3):
    rows=[]
    for p in sorted((ai/'logs').glob(repository.replace('/','--')+'-*/run.json'),key=lambda p:p.stat().st_mtime,reverse=True):
        if p.stat().st_size>200000:continue
        try:d=json.loads(p.read_text())
        except (ValueError,OSError):continue
        if d.get('project')!=repository:continue
        rows.append({k:(d[k][:500] if isinstance(d.get(k),str) else None) for k in ('runId','status','resultCommit','failureCategory','endedAt','actionsUrl')})
        if len(rows)>=limit:break
    return rows

def packet(ai,project,root,work,base):
    repository=project['repository']; previous=recent_receipts(ai,repository)
    retained=[]
    folder=ai/'worktrees'/repository.split('/')[-1]
    if folder.exists():
        for p in sorted(folder.iterdir(),key=lambda p:p.stat().st_mtime,reverse=True):
            if p==work or not p.is_dir():continue
            retained.append(str(p))
            if len(retained)==4:break
    return {'repository':repository,'baseCommit':base,'kind':project.get('kind','repository'),
            'surfaces':[str(x)[:300] for x in project.get('surfaces',[])[:8]],'verificationHints':[str(x)[:500] for x in project.get('verificationHints',[])[:6]],
            'skillsPolicy':str(root/'control-plane/RUNTIME.md'),
            'priorRuns':previous,'retainedWorktrees':retained,'authority':'Hints only. Verify current files/git state before acting.',
            'memoryPolicy':'Read repo-local AGENTS.md/CLAUDE.md and the smallest relevant skill; do not read whole ledgers or other project transcripts.'}

def category(error):
    t=str(error).lower()
    if 'lease' in t:return 'lease-timeout'
    if 'deadline' in t or 'timeout' in t:return 'timeout'
    if 'completion' in t or 'evidence' in t:return 'completion-evidence'
    if 'uncommitted' in t:return 'uncommitted-work'
    if 'ancestor' in t or 'lineage' in t:return 'commit-lineage'
    if 'push' in t or 'non-fast-forward' in t:return 'publication-conflict'
    if 'credential' in t or 'authentication' in t:return 'authentication'
    return 'execution'
