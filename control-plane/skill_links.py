"""Idempotent canonical skill discovery; never replace owner overrides."""
import json,importlib.util
from pathlib import Path

def synchronize(root,home):
    spec=importlib.util.spec_from_file_location('skill_metadata',root/'control-plane/skills-doctor.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    sources=[]
    for file in sorted(root.glob('*/SKILL.md')):
        if file.parent.name in ('template','spec'):continue
        try:module.metadata(file)
        except ValueError:continue
        sources.append(file.parent)
    targets=[home/'.codex/skills',home/'.agents/skills',home/'.claude/skills',home/'.config/opencode/skills',home/'.openclaw/skills']
    router=home/'.claw-router/config.json'
    if router.exists():
        for account in json.loads(router.read_text()).get('accounts',[]):
            if account.get('provider')=='claude' and account.get('configDir'):
                targets.append(Path(account['configDir'])/'skills')
    added=0
    for target in targets:
        target.mkdir(parents=True,exist_ok=True)
        for source in sources:
            link=target/source.name
            if not link.exists() and not link.is_symlink():link.symlink_to(source);added+=1
        for name in ('spec','template'):
            link=target/name
            if link.is_symlink() and link.resolve()==(root/name).resolve():link.unlink()
    return {'skills':len(sources),'linksAdded':added,'ownerOverridesPreserved':True}
