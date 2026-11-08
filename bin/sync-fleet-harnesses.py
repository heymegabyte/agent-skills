#!/usr/bin/env python3
import base64
import json
import os
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HOME = Path.home()

# 0. Fix local macos opencode.jsonc cua-driver MCP + machine.json + global rules + CF ZT CA
local_oc_jsonc = HOME / ".config/opencode/opencode.jsonc"
if local_oc_jsonc.exists():
    try:
        oc_data = json.loads(local_oc_jsonc.read_text())
        oc_data.setdefault("mcp", {})["cua-driver"] = {
            "type": "local",
            "command": [str(HOME / ".local/bin/cua-driver"), "mcp"],
            "enabled": True,
        }
        local_oc_jsonc.write_text(json.dumps(oc_data, indent=2) + "\n")
    except Exception:
        pass

# Read gh token from local macOS
gh_token = subprocess.run(["gh", "auth", "token"], capture_output=True, text=True, check=True).stdout.strip()

# Read Cloudflare ZT CA and ensure-cloudflare-zt-ca.sh from install.doctor
id_repo = HOME / "emdash/repositories/install.doctor"
cf_ca_script_path = id_repo / "home/dot_local/bin/executable_ensure-cloudflare-zt-ca.sh"
cf_ca_b64 = base64.b64encode(cf_ca_script_path.read_bytes()).decode() if cf_ca_script_path.exists() else ""

# Also grab the Cloudflare WARP CA cert from ubuntu.megabyte.space
cf_cert_pem = subprocess.run(
    ["ssh", "ubuntu.megabyte.space", "cat /usr/local/share/ca-certificates/cloudflare-warp-zt.crt 2>/dev/null || cat /etc/ssl/certs/Cloudflare_CA.pem 2>/dev/null || true"],
    capture_output=True, text=True
).stdout.strip()

HOSTS = {
    "local": {
        "ssh": None,
        "user": "Apple",
        "ip": "10.0.0.138",
        "machine": {
            "machineId": "macos-owner-primary",
            "profile": "/Users/Apple/ai/repos/agent-skills/machines/macos-owner-primary.md",
            "skillsRepository": "heymegabyte/agent-skills",
            "preferredSetupAgent": "agy",
            "sshHostname": "macbook-pro.megabyte.space",
            "sshAlias": "macbook-pro.megabyte.space",
            "paperclipUrl": "https://swarml.ink",
        },
    },
    "zen.megabyte.space": {
        "ssh": "zen.megabyte.space",
        "user": "ubuntu",
        "ip": "10.0.0.162",
        "machine": {
            "machineId": "zen-linux-workstation",
            "profile": "/home/ubuntu/ai/repos/agent-skills/machines/zen-linux-workstation.md",
            "skillsRepository": "heymegabyte/agent-skills",
            "preferredSetupAgent": "codex",
            "machineRepository": "heymegabyte/zen.megabyte.space",
            "machineCheckout": "/home/ubuntu/ai/repos/zen.megabyte.space",
            "remoteAccess": "Owner-only Cloudflare Access tunnel + KasmVNC loopback :20 (127.0.0.1:6901/5920)",
            "sshHostname": "zen.megabyte.space",
            "sshAlias": "zen.megabyte.space",
            "paperclipUrl": "https://swarml.ink",
        },
    },
    "omen.megabyte.space": {
        "ssh": "omen.megabyte.space",
        "user": "ubuntu",
        "ip": "10.0.0.161",
        "machine": {
            "machineId": "omen-linux-workstation",
            "profile": "/home/ubuntu/ai/repos/agent-skills/machines/omen-linux-workstation.md",
            "skillsRepository": "heymegabyte/agent-skills",
            "preferredSetupAgent": "codex",
            "machineRepository": "heymegabyte/omen.megabyte.space",
            "machineCheckout": "/home/ubuntu/ai/repos/omen.megabyte.space",
            "remoteAccess": "Owner-only Cloudflare Access tunnel + KasmVNC loopback :20 (127.0.0.1:6901/5920)",
            "sshHostname": "omen.megabyte.space",
            "sshAlias": "omen.megabyte.space",
            "paperclipUrl": "https://swarml.ink",
        },
    },
    "legion.megabyte.space": {
        "ssh": "legion.megabyte.space",
        "user": "ubuntu",
        "ip": "10.0.0.143",
        "machine": {
            "machineId": "legion-linux-workstation",
            "profile": "/home/ubuntu/ai/repos/agent-skills/machines/legion-linux-workstation.md",
            "skillsRepository": "heymegabyte/agent-skills",
            "preferredSetupAgent": "codex",
            "machineRepository": "heymegabyte/legion.megabyte.space",
            "machineCheckout": "/home/ubuntu/ai/repos/legion.megabyte.space",
            "remoteAccess": "Owner-only Cloudflare Access tunnel + KasmVNC loopback :20 (127.0.0.1:8444/5920)",
            "sshHostname": "legion.megabyte.space",
            "sshAlias": "legion.megabyte.space",
            "paperclipUrl": "https://swarml.ink",
        },
    },
    "ubuntu.megabyte.space": {
        "ssh": "ubuntu.megabyte.space",
        "user": "professormanhattan",
        "ip": "10.0.0.156",
        "machine": {
            "machineId": "ubuntu-proxmox-primary",
            "profile": "/home/professormanhattan/ai/repos/agent-skills/machines/ubuntu-proxmox-primary.md",
            "skillsRepository": "heymegabyte/agent-skills",
            "preferredSetupAgent": "codex",
            "machineRepository": "ProfessorManhattan/ubuntu.megabyte.space",
            "machineCheckout": "/home/professormanhattan/ai/repos/ubuntu.megabyte.space",
            "remoteAccess": "Owner-only Cloudflare Access SSH; owner Mac WARP /32 SSH route; desktop VNC private",
            "sshHostname": "ubuntu.megabyte.space",
            "paperclipUrl": "https://swarml.ink",
            "sshAlias": "ubuntu.megabyte.space",
            "warpState": "/home/professormanhattan/.config/agent-fleet/warp.json",
        },
    },
}

# 1. Collect/generate SSH public keys across all 5 hosts
pubkeys = []
KEY_SCRIPT = """
from pathlib import Path
import subprocess
ssh_dir = Path.home() / ".ssh"
ssh_dir.mkdir(parents=True, exist_ok=True)
ssh_dir.chmod(0o700)
pub = ssh_dir / "id_ed25519.pub"
priv = ssh_dir / "id_ed25519"
if not pub.exists():
    subprocess.run(["ssh-keygen", "-t", "ed25519", "-N", "", "-f", str(priv)], check=True, stdout=subprocess.DEVNULL)
print(pub.read_text().strip())
"""
for h, cfg in HOSTS.items():
    if cfg["ssh"] is None:
        r = subprocess.run(["python3", "-c", KEY_SCRIPT], capture_output=True, text=True, check=True)
    else:
        r = subprocess.run(["ssh", cfg["ssh"], "python3 -c " + subprocess.list2cmdline([KEY_SCRIPT])], capture_output=True, text=True, check=True)
    k = r.stdout.strip()
    if k:
        pubkeys.append(k)
print("Collected", len(pubkeys), "SSH public keys across fleet")

# 2. Rsync ~/.agentskills/ to all 4 remote Linux hosts in parallel
def sync_agentskills(host):
    if host == "local":
        ag_repo = HOME / "ai/repos/agent-skills"
        ag_repo.parent.mkdir(parents=True, exist_ok=True)
        if not ag_repo.exists():
            ag_repo.symlink_to(HOME / ".agentskills")
        return "local linked"
    # Ensure ~/.agentskills is a real directory or points to ~/ai/repos/agent-skills, then rsync
    prep = """
    mkdir -p "$HOME/ai/repos/agent-skills"
    if [ -L "$HOME/.agentskills" ]; then
      rm -f "$HOME/.agentskills"
    elif [ -d "$HOME/.agentskills" ] && [ ! -d "$HOME/.agentskills/.git" ]; then
      cp -rn "$HOME/.agentskills/." "$HOME/ai/repos/agent-skills/" 2>/dev/null || true
      rm -rf "$HOME/.agentskills"
    elif [ -d "$HOME/.agentskills/.git" ] && [ ! -L "$HOME/ai/repos/agent-skills" ]; then
      rm -rf "$HOME/ai/repos/agent-skills"
      mv "$HOME/.agentskills" "$HOME/ai/repos/agent-skills"
    fi
    ln -sfn "$HOME/ai/repos/agent-skills" "$HOME/.agentskills"
    """
    subprocess.run(["ssh", host, prep], check=True)
    subprocess.run([
        "rsync", "-az", "--delete",
        "--exclude=.git/objects/pack/*.tmp",
        str(HOME / ".agentskills") + "/",
        f"{host}:~/ai/repos/agent-skills/"
    ], check=True)
    return f"{host} rsynced"

with ThreadPoolExecutor(max_workers=5) as ex:
    for res in ex.map(sync_agentskills, HOSTS.keys()):
        print("agentskills:", res)

# 3. Apply per-host convergence (machine.json, global rules, cua-driver MCP in all 4 harnesses, git config, gh auth, SSH mesh, CF ZT CA)
REMOTE_CONVERGE = r"""
import base64, json, os, subprocess, sys
from pathlib import Path

payload = json.loads(sys.stdin.read())
home = Path.home()

# A. ~/.config/agent-fleet/machine.json
fleet_dir = home / ".config/agent-fleet"
fleet_dir.mkdir(parents=True, exist_ok=True)
(fleet_dir / "machine.json").write_text(json.dumps(payload["machine"], indent=2) + "\n")

# B. Global doctrine files (~/.claude/CLAUDE.md, ~/.codex/AGENTS.md, ~/.gemini/GEMINI.md, ~/.config/opencode/AGENTS.md)
ag = home / ".agentskills"
for dest_rel, src_name in [
    (".claude/CLAUDE.md", "CLAUDE.md"),
    (".codex/AGENTS.md", "AGENTS.md"),
    (".gemini/GEMINI.md", "GEMINI.md"),
    (".config/opencode/AGENTS.md", "AGENTS.md"),
]:
    dest = home / dest_rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    src = ag / src_name
    if src.exists():
        dest.write_text(src.read_text())

# C. cua-driver MCP in claude (~/.claude.json), codex (~/.codex/config.toml), opencode (~/.config/opencode/opencode.jsonc)
cua_bin = str(home / ".local/bin/cua-driver")
claude_json = home / ".claude.json"
cdata = {}
if claude_json.exists():
    try:
        cdata = json.loads(claude_json.read_text())
    except Exception:
        cdata = {}
cdata.setdefault("mcpServers", {})["cua-driver"] = {
    "type": "stdio",
    "command": cua_bin,
    "args": ["mcp"],
    "env": {}
}
claude_json.write_text(json.dumps(cdata, indent=2) + "\n")

codex_toml = home / ".codex/config.toml"
codex_toml.parent.mkdir(parents=True, exist_ok=True)
toml_txt = codex_toml.read_text() if codex_toml.exists() else ""
if "[mcp_servers.cua-driver]" not in toml_txt:
    block = f'\n[mcp_servers.cua-driver]\ncommand = "{cua_bin}"\nargs = ["mcp"]\nenabled = true\n'
    codex_toml.write_text(toml_txt.rstrip() + "\n" + block)

oc_jsonc = home / ".config/opencode/opencode.jsonc"
if oc_jsonc.exists():
    raw_txt = oc_jsonc.read_text()
    if '"cua-driver"' not in raw_txt:
        # Insert mcp block or parse if clean JSON
        try:
            lines = [l for l in raw_txt.splitlines() if not l.strip().startswith("//")]
            obj = json.loads("\n".join(lines))
            obj.setdefault("mcp", {})["cua-driver"] = {
                "type": "local",
                "command": [cua_bin, "mcp"],
                "enabled": True
            }
            oc_jsonc.write_text(json.dumps(obj, indent=2) + "\n")
        except Exception:
            pass

# D. Git global identity
name = subprocess.run(["git", "config", "--global", "user.name"], capture_output=True, text=True).stdout.strip()
email = subprocess.run(["git", "config", "--global", "user.email"], capture_output=True, text=True).stdout.strip()
if not name:
    subprocess.run(["git", "config", "--global", "user.name", "Brian Zalewski"], check=False)
if not email:
    subprocess.run(["git", "config", "--global", "user.email", "brian@megabyte.space"], check=False)
subprocess.run(["git", "config", "--global", "init.defaultBranch", "main"], check=False)

# E. GitHub CLI (gh) auth
env = os.environ.copy()
env["PATH"] = f"{home / '.local/bin'}:/opt/homebrew/bin:/usr/local/bin:" + env.get("PATH", "")
st = subprocess.run(["gh", "auth", "status"], env=env, capture_output=True, text=True)
if st.returncode != 0 and payload.get("gh_token"):
    subprocess.run(["gh", "auth", "login", "--hostname", "github.com", "--git-protocol", "https", "--with-token"], input=payload["gh_token"] + "\n", env=env, capture_output=True, text=True)
    subprocess.run(["gh", "auth", "setup-git"], env=env, capture_output=True, text=True)

# F. SSH Mesh (~/.ssh/authorized_keys + ~/.ssh/config)
ssh_dir = home / ".ssh"
ssh_dir.mkdir(parents=True, exist_ok=True)
ssh_dir.chmod(0o700)
ak = ssh_dir / "authorized_keys"
ak_lines = ak.read_text().splitlines() if ak.exists() else []
for pk in payload.get("pubkeys", []):
    if pk not in ak_lines:
        ak_lines.append(pk)
ak.write_text("\n".join([l for l in ak_lines if l.strip()]) + "\n")
ak.chmod(0o600)

ssh_cfg = ssh_dir / "config"
cfg_txt = ssh_cfg.read_text() if ssh_cfg.exists() else ""
mesh_entries = [
    ("zen.megabyte.space", "zen", "10.0.0.162", "ubuntu"),
    ("omen.megabyte.space", "omen", "10.0.0.161", "ubuntu"),
    ("legion.megabyte.space", "legion", "10.0.0.143", "ubuntu"),
    ("ubuntu.megabyte.space", "ubuntu", "10.0.0.156", "professormanhattan"),
    ("macbook-pro.megabyte.space", "macos", "10.0.0.138", "Apple"),
]
added = []
for fqdn, short, ip, usr in mesh_entries:
    if f"Host {fqdn}" not in cfg_txt:
        added.append(f"Host {fqdn} {short}\n  HostName {ip}\n  User {usr}\n  IdentityFile ~/.ssh/id_ed25519\n  StrictHostKeyChecking accept-new\n")
if added:
    ssh_cfg.write_text(cfg_txt.rstrip() + "\n\n# Fleet LAN SSH Mesh\n" + "\n".join(added) + "\n")
    ssh_cfg.chmod(0o600)

# G. Cloudflare WARP Zero Trust CA script & PEM
if payload.get("cf_cert_pem"):
    ca_dir = home / ".config/agent-fleet/ca"
    ca_dir.mkdir(parents=True, exist_ok=True)
    (ca_dir / "cloudflare-warp-zt.pem").write_text(payload["cf_cert_pem"] + "\n")
if payload.get("cf_ca_b64"):
    script_p = home / ".local/bin/ensure-cloudflare-zt-ca.sh"
    script_p.parent.mkdir(parents=True, exist_ok=True)
    script_p.write_bytes(base64.b64decode(payload["cf_ca_b64"]))
    script_p.chmod(0o755)
    subprocess.run([str(script_p)], env=env, capture_output=True, text=True)

print(f"Converged {os.uname().nodename}")
"""

def converge_host(item):
    h, cfg = item
    payload = json.dumps({
        "machine": cfg["machine"],
        "gh_token": gh_token,
        "pubkeys": pubkeys,
        "cf_cert_pem": cf_cert_pem,
        "cf_ca_b64": cf_ca_b64,
    })
    if cfg["ssh"] is None:
        r = subprocess.run(["python3", "-c", REMOTE_CONVERGE], input=payload, capture_output=True, text=True, check=True)
    else:
        r = subprocess.run(["ssh", cfg["ssh"], "python3 -c " + subprocess.list2cmdline([REMOTE_CONVERGE])], input=payload, capture_output=True, text=True, check=True)
    return f"{h}: {r.stdout.strip()}"

with ThreadPoolExecutor(max_workers=5) as ex:
    for res in ex.map(converge_host, HOSTS.items()):
        print(res)
