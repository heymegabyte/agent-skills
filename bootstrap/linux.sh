#!/usr/bin/env bash
# Linux bootstrap; credentials remain local and all subscription auth uses official CLIs.
set -euo pipefail
export PATH="$HOME/.local/bin:$HOME/ai/tools/bin:$HOME/.volta/bin:$PATH"
for tool in curl git python3 jq; do
  command -v "$tool" >/dev/null || { printf 'Install prerequisite %s and retry.\n' "$tool" >&2; exit 1; }
done
mkdir -p "$HOME/ai/repos" "$HOME/ai/tools/bin" "$HOME/ai/research" "$HOME/.local/bin"
if ! command -v node >/dev/null; then
  curl -fsSL https://get.volta.sh -o "$HOME/ai/research/volta-install.sh"
  bash "$HOME/ai/research/volta-install.sh" --skip-setup
  volta install node@24
fi
if ! command -v gh >/dev/null; then
  python3 - <<'PY'
import hashlib, io, json, pathlib, platform, tarfile, urllib.request
root=pathlib.Path.home()/'ai/tools'
release=json.load(urllib.request.urlopen('https://api.github.com/repos/cli/cli/releases/latest'))
arch={'x86_64':'amd64','aarch64':'arm64'}.get(platform.machine())
if not arch: raise SystemExit('Unsupported GitHub CLI architecture')
asset=next(a for a in release['assets'] if a['name'].endswith(f'linux_{arch}.tar.gz'))
data=urllib.request.urlopen(asset['browser_download_url']).read()
checks=next(a for a in release['assets'] if a['name'].endswith('checksums.txt'))
expected=next(line.split()[0] for line in urllib.request.urlopen(checks['browser_download_url']).read().decode().splitlines() if line.split()[-1]==asset['name'])
if hashlib.sha256(data).hexdigest()!=expected: raise SystemExit('GitHub CLI checksum mismatch')
with tarfile.open(fileobj=io.BytesIO(data)) as archive: archive.extractall(root,filter='data')
link=root/'bin/gh'
link.symlink_to(root/asset['name'].removesuffix('.tar.gz')/'bin/gh')
PY
fi
if ! gh auth status >/dev/null 2>&1; then
  gh auth login --hostname github.com --git-protocol https --web --scopes repo,workflow,admin:org
fi
gh auth setup-git
if ! git config user.name >/dev/null; then git config --global user.name "$(gh api user --jq .login)"; fi
if ! git config user.email >/dev/null; then
  git config --global user.email "$(gh api user --jq '"\(.id)+\(.login)@users.noreply.github.com"')"
fi
shared="$HOME/ai/repos/agent-skills"
if ! test -d "$shared/.git"; then gh repo clone heymegabyte/agent-skills "$shared"; fi
if test -z "$(git -C "$shared" status --porcelain)"; then git -C "$shared" pull --ff-only; fi
if ! command -v codex >/dev/null; then npm install -g @openai/codex@latest; fi
if ! codex login status >/dev/null 2>&1; then codex login; fi
if ! command -v claude >/dev/null; then
  curl -fsSL https://claude.ai/install.sh -o "$HOME/ai/research/claude-install.sh"
  bash "$HOME/ai/research/claude-install.sh" latest
fi
npm install -g --allow-scripts=opencode-ai,@google/genai,esbuild,koffi,protobufjs,openclaw openclaw@latest opencode-ai@latest
for tool in openclaw opencode; do ln -sf "$(npm prefix -g)/bin/$tool" "$HOME/.local/bin/$tool"; done
if ! test -d "$HOME/ai/tools/claw-router/.git"; then
  git clone https://github.com/dennisonbertram/claw-router.git "$HOME/ai/tools/claw-router"
fi
bash "$HOME/ai/tools/claw-router/install.sh"
if ! cr --provider codex doctor codex-primary >/dev/null 2>&1; then
  if ! cr list 2>/dev/null | grep -q codex-primary; then cr --provider codex register-default codex-primary; fi
fi
cr policy usage-aware
cr --provider codex policy usage-aware
python3 "$shared/control-plane/configure-host.py"
python3 - <<'PY'
import json,pathlib,subprocess
identity=json.loads((pathlib.Path.home()/'.config/agent-fleet/machine.json').read_text())
profile=pathlib.Path(identity['profile']);root=pathlib.Path.home()/'ai/repos/agent-skills'
if subprocess.check_output(['git','ls-files',str(profile)],cwd=root,text=True).strip()=='':
 subprocess.run(['git','add',str(profile)],cwd=root,check=True)
 subprocess.run(['git','commit','-m','docs(machines): register '+identity['machineId']],cwd=root,check=True)
PY
openclaw config validate
openclaw gateway install
loginctl enable-linger "$(id -un)"
python3 "$shared/control-plane/finish-setup.py"
printf 'Fleet installed. Complete isolated Claude logins with fleet-account-login claude-1 (then 2 and 3).\n'
