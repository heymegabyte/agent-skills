#!/usr/bin/env python3
"""Provision and verify gemini, codex, claude, and opencode (LiteLLM + DeepSeek) across fleet hosts."""
import base64
import json
import os
import subprocess
import sys
from pathlib import Path

HOME = Path.home()
GET_SECRET = str(HOME / ".local/bin/get-secret")


def get_secret(name: str) -> str:
    r = subprocess.run([GET_SECRET, name], capture_output=True, text=True, check=True)
    val = r.stdout.strip()
    if not val:
        raise RuntimeError(f"Secret {name} is empty")
    return val


REMOTE_PROVISION = r"""
import sys, os, json, base64, subprocess
from pathlib import Path

data = json.loads(sys.stdin.read())
home = Path.home()

# 1. Ensure ~/.local/bin/get-secret and ~/.config/agent-fleet/secrets
local_bin = home / ".local/bin"
local_bin.mkdir(parents=True, exist_ok=True)
gs_path = local_bin / "get-secret"
if not gs_path.exists():
    gs_path.write_bytes(base64.b64decode(data["get_secret_b64"]))
    gs_path.chmod(0o700)

fleet_dir = home / ".config/agent-fleet"
secrets_dir = fleet_dir / "secrets"
secrets_dir.mkdir(parents=True, exist_ok=True)
fleet_dir.chmod(0o700)
secrets_dir.chmod(0o700)

for k, v in [("DEEPSEEK_API_KEY", data["deepseek_key"]), ("LITELLM_API_KEY", data["litellm_key"])]:
    sp = secrets_dir / k
    sp.write_text(v + "\n")
    sp.chmod(0o600)

overrides_path = fleet_dir / "local-secret-overrides.json"
existing_overrides = []
if overrides_path.exists():
    try:
        existing_overrides = json.loads(overrides_path.read_text())
    except Exception:
        existing_overrides = []
for k in ["DEEPSEEK_API_KEY", "LITELLM_API_KEY"]:
    if k not in existing_overrides:
        existing_overrides.append(k)
overrides_path.write_text(json.dumps(existing_overrides, indent=2) + "\n")
overrides_path.chmod(0o600)

# 2. Ensure ~/.agentskills/bin/opencode-deepseek.sh and opencode-deepseek-auth.sh
ag_bin = home / ".agentskills/bin"
ag_bin.mkdir(parents=True, exist_ok=True)
for name, b64_key in [("opencode-deepseek.sh", "opencode_deepseek_sh_b64"), ("opencode-deepseek-auth.sh", "opencode_deepseek_auth_sh_b64")]:
    p = ag_bin / name
    p.write_bytes(base64.b64decode(data[b64_key]))
    p.chmod(0o755)

# 3. Write ~/.config/opencode/opencode.json and ~/.config/opencode/opencode.jsonc
oc_dir = home / ".config/opencode"
oc_dir.mkdir(parents=True, exist_ok=True)
cua_bin = str(home / ".local/bin/cua-driver")

oc_json = {
    "$schema": "https://opencode.ai/config.json",
    "mcp": {
        "cua-driver": {
            "type": "local",
            "command": [cua_bin, "mcp"],
            "enabled": True
        }
    }
}
(oc_dir / "opencode.json").write_text(json.dumps(oc_json, indent=2) + "\n")

oc_jsonc = {
    "$schema": "https://opencode.ai/config.json",
    "model": "litellm/deepseek-v4-pro",
    "small_model": "litellm/deepseek-flash",
    "disabled_providers": ["openai", "anthropic"],
    "mcp": {
        "cua-driver": {
            "type": "local",
            "command": [cua_bin, "mcp"],
            "enabled": True
        }
    },
    "provider": {
        "litellm": {
            "npm": "@ai-sdk/openai-compatible",
            "name": "LiteLLM (llm.megabyte.space - DeepSeek 4-key rotation + fallback + Langfuse)",
            "options": {"baseURL": "https://llm.megabyte.space/v1"},
            "models": {
                "deepseek-v4-pro": {
                    "name": "DeepSeek V4 Pro (rotated)",
                    "reasoning": True,
                    "tool_call": True,
                    "temperature": True,
                    "limit": {"context": 1048576, "output": 393216},
                    "modalities": {"input": ["text"], "output": ["text"]},
                    "variants": {"high": {"reasoningEffort": "high"}, "max": {"reasoningEffort": "max"}}
                },
                "deepseek-flash": {
                    "name": "DeepSeek V4.1 Flash (rotated)",
                    "reasoning": True,
                    "tool_call": True,
                    "temperature": True,
                    "attachment": True,
                    "limit": {"context": 1048576, "output": 393216},
                    "modalities": {"input": ["text", "image"], "output": ["text"]},
                    "variants": {"low": {"reasoningEffort": "low"}, "high": {"reasoningEffort": "high"}}
                },
                "deepseek-chat": {"name": "DeepSeek Chat (rotated)", "tool_call": True, "temperature": True},
                "deepseek-reasoner": {"name": "DeepSeek Reasoner (rotated)", "reasoning": True, "tool_call": True}
            }
        },
        "deepseek": {
            "npm": "@ai-sdk/openai-compatible",
            "name": "DeepSeek (direct)",
            "options": {"baseURL": "https://api.deepseek.com"},
            "models": {
                "deepseek-v4-pro": {
                    "name": "DeepSeek V4 Pro",
                    "reasoning": True,
                    "tool_call": True,
                    "temperature": True,
                    "attachment": False,
                    "limit": {"context": 1048576, "output": 393216},
                    "modalities": {"input": ["text"], "output": ["text"]}
                },
                "deepseek-flash": {
                    "name": "DeepSeek V4.1 Flash",
                    "reasoning": True,
                    "tool_call": True,
                    "temperature": True,
                    "attachment": True,
                    "limit": {"context": 1048576, "output": 393216},
                    "modalities": {"input": ["text", "image"], "output": ["text"]}
                },
                "deepseek-chat": {
                    "name": "DeepSeek Chat (legacy -> V4.1 Flash)",
                    "tool_call": True,
                    "temperature": True,
                    "attachment": True,
                    "limit": {"context": 1048576, "output": 393216},
                    "modalities": {"input": ["text", "image"], "output": ["text"]}
                },
                "deepseek-reasoner": {
                    "name": "DeepSeek Reasoner (legacy -> V4.1 Flash)",
                    "reasoning": True,
                    "tool_call": True,
                    "temperature": True,
                    "attachment": False,
                    "limit": {"context": 1048576, "output": 393216},
                    "modalities": {"input": ["text"], "output": ["text"]}
                }
            }
        }
    }
}
(oc_dir / "opencode.jsonc").write_text(json.dumps(oc_jsonc, indent=2) + "\n")

# 4. Sync ~/.local/share/opencode/auth.json (0600)
oc_data = home / ".local/share/opencode"
oc_data.mkdir(parents=True, exist_ok=True)
oc_data.chmod(0o700)
auth_path = oc_data / "auth.json"
auth_obj = {}
if auth_path.exists():
    try:
        auth_obj = json.loads(auth_path.read_text())
    except Exception:
        auth_obj = {}
auth_obj["deepseek"] = {"type": "api", "key": data["deepseek_key"]}
auth_obj["litellm"] = {"type": "api", "key": data["litellm_key"]}
auth_path.write_text(json.dumps(auth_obj, indent=2) + "\n")
auth_path.chmod(0o600)

print(f"Synced OpenCode + LiteLLM + DeepSeek on {os.uname().nodename}")
"""


def main():
    targets = sys.argv[1:] or ["zen.megabyte.space", "omen.megabyte.space", "legion.megabyte.space", "ubuntu.megabyte.space"]
    payload = json.dumps({
        "deepseek_key": get_secret("DEEPSEEK_API_KEY"),
        "litellm_key": get_secret("LITELLM_API_KEY"),
        "opencode_deepseek_sh_b64": base64.b64encode((HOME / ".agentskills/bin/opencode-deepseek.sh").read_bytes()).decode(),
        "opencode_deepseek_auth_sh_b64": base64.b64encode((HOME / ".agentskills/bin/opencode-deepseek-auth.sh").read_bytes()).decode(),
        "get_secret_b64": base64.b64encode((HOME / ".local/bin/get-secret").read_bytes()).decode(),
    })
    for host in targets:
        r = subprocess.run(
            ["ssh", "-o", "ConnectTimeout=10", host, "python3 -c " + subprocess.list2cmdline([REMOTE_PROVISION])],
            input=payload,
            capture_output=True,
            text=True,
        )
        print(f"[{host}] rc={r.returncode}: {r.stdout.strip()} {r.stderr.strip()}")


if __name__ == "__main__":
    main()
