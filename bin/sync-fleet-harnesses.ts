#!/usr/bin/env -S node --experimental-strip-types
/**
 * Cross-Fleet Harness, Doctrine, SSH Mesh & Workstation Doctor Synchronizer (`sync-fleet-harnesses.ts`).
 *
 * Synchronizes `~/.config/agent-fleet/machine.json`, global doctrine files
 * (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`), `cua-driver` MCP configuration across
 * all 5 agent harnesses (`claude`, `codex`, `opencode`, `gemini`, `antigravity`),
 * LAN SSH mesh (`~/.ssh/authorized_keys` & `~/.ssh/config`), Cloudflare Zero Trust CA,
 * and `~/.local/bin/workstation-doctor` across `macOS`, `zen`, `omen`, `legion`, and `ubuntu`.
 */

import { spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

interface MachineDescriptor {
  readonly machineId: string;
  readonly profile: string;
  readonly skillsRepository: string;
  readonly preferredSetupAgent: string;
  readonly sshHostname: string;
  readonly sshAlias: string;
  readonly paperclipUrl: string;
  readonly machineRepository?: string;
  readonly machineCheckout?: string;
  readonly remoteAccess?: string;
  readonly warpState?: string;
}

interface FleetHostTarget {
  readonly key: string;
  readonly sshTarget: string | null;
  readonly user: string;
  readonly lanIp: string;
  readonly machine: MachineDescriptor;
}

interface RemoteConvergencePayload {
  readonly machine: MachineDescriptor;
  readonly ghToken: string;
  readonly publicKeys: readonly string[];
  readonly cloudflareCertPem: string;
  readonly cloudflareCaScriptBase64: string;
}

const HOME = homedir();

const FLEET_TARGETS: readonly FleetHostTarget[] = [
  {
    key: "local",
    sshTarget: null,
    user: "Apple",
    lanIp: "10.0.0.138",
    machine: {
      machineId: "macos-owner-primary",
      profile: "/Users/Apple/ai/repos/agent-skills/machines/macos-owner-primary.md",
      skillsRepository: "heymegabyte/agent-skills",
      preferredSetupAgent: "agy",
      sshHostname: "macbook-pro.megabyte.space",
      sshAlias: "macbook-pro.megabyte.space",
      paperclipUrl: "https://swarml.ink",
    },
  },
  {
    key: "zen.megabyte.space",
    sshTarget: "zen.megabyte.space",
    user: "ubuntu",
    lanIp: "10.0.0.162",
    machine: {
      machineId: "zen-linux-workstation",
      profile: "/home/ubuntu/ai/repos/agent-skills/machines/zen-linux-workstation.md",
      skillsRepository: "heymegabyte/agent-skills",
      preferredSetupAgent: "codex",
      machineRepository: "heymegabyte/zen.megabyte.space",
      machineCheckout: "/home/ubuntu/ai/repos/zen.megabyte.space",
      remoteAccess: "Owner-only Cloudflare Access tunnel + KasmVNC loopback :20 (127.0.0.1:6901/5920)",
      sshHostname: "zen.megabyte.space",
      sshAlias: "zen.megabyte.space",
      paperclipUrl: "https://swarml.ink",
    },
  },
  {
    key: "omen.megabyte.space",
    sshTarget: "omen.megabyte.space",
    user: "ubuntu",
    lanIp: "10.0.0.161",
    machine: {
      machineId: "omen-linux-workstation",
      profile: "/home/ubuntu/ai/repos/agent-skills/machines/omen-linux-workstation.md",
      skillsRepository: "heymegabyte/agent-skills",
      preferredSetupAgent: "codex",
      machineRepository: "heymegabyte/omen.megabyte.space",
      machineCheckout: "/home/ubuntu/ai/repos/omen.megabyte.space",
      remoteAccess: "Owner-only Cloudflare Access tunnel + KasmVNC loopback :20 (127.0.0.1:6901/5920)",
      sshHostname: "omen.megabyte.space",
      sshAlias: "omen.megabyte.space",
      paperclipUrl: "https://swarml.ink",
    },
  },
  {
    key: "legion.megabyte.space",
    sshTarget: "legion.megabyte.space",
    user: "ubuntu",
    lanIp: "10.0.0.143",
    machine: {
      machineId: "legion-linux-workstation",
      profile: "/home/ubuntu/ai/repos/agent-skills/machines/legion-linux-workstation.md",
      skillsRepository: "heymegabyte/agent-skills",
      preferredSetupAgent: "codex",
      machineRepository: "heymegabyte/legion.megabyte.space",
      machineCheckout: "/home/ubuntu/ai/repos/legion.megabyte.space",
      remoteAccess: "Owner-only Cloudflare Access tunnel + KasmVNC loopback :20 (127.0.0.1:8444/5920)",
      sshHostname: "legion.megabyte.space",
      sshAlias: "legion.megabyte.space",
      paperclipUrl: "https://swarml.ink",
    },
  },
  {
    key: "ubuntu.megabyte.space",
    sshTarget: "ubuntu.megabyte.space",
    user: "professormanhattan",
    lanIp: "10.0.0.156",
    machine: {
      machineId: "ubuntu-proxmox-primary",
      profile: "/home/professormanhattan/ai/repos/agent-skills/machines/ubuntu-proxmox-primary.md",
      skillsRepository: "heymegabyte/agent-skills",
      preferredSetupAgent: "codex",
      machineRepository: "ProfessorManhattan/ubuntu.megabyte.space",
      machineCheckout: "/home/professormanhattan/ai/repos/ubuntu.megabyte.space",
      remoteAccess: "Owner-only Cloudflare Access SSH; owner Mac WARP /32 SSH route; desktop VNC private",
      sshHostname: "ubuntu.megabyte.space",
      sshAlias: "ubuntu.megabyte.space",
      paperclipUrl: "https://swarml.ink",
      warpState: "/home/professormanhattan/.config/agent-fleet/warp.json",
    },
  },
];

function runSyncCommand(
  command: string,
  args: readonly string[],
  input?: string,
): { readonly status: number; readonly stdout: string; readonly stderr: string } {
  const res = spawnSync(command, args, {
    encoding: "utf8",
    input,
    timeout: 30_000,
    stdio: [input !== undefined ? "pipe" : "ignore", "pipe", "pipe"],
  });
  return {
    status: res.status ?? 1,
    stdout: typeof res.stdout === "string" ? res.stdout : "",
    stderr: typeof res.stderr === "string" ? res.stderr : "",
  };
}

function runAsyncCommand(
  command: string,
  args: readonly string[],
  input?: string,
): Promise<{ readonly status: number; readonly stdout: string; readonly stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: [input !== undefined ? "pipe" : "ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    if (input !== undefined && child.stdin) {
      child.stdin.write(input);
      child.stdin.end();
    }
    child.on("close", (code) => {
      resolve({ status: code ?? 1, stdout, stderr });
    });
    child.on("error", (err) => {
      resolve({ status: 1, stdout, stderr: err.message });
    });
  });
}

const REMOTE_KEY_SCRIPT = `
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");
const sshDir = path.join(os.homedir(), ".ssh");
fs.mkdirSync(sshDir, { recursive: true, mode: 0o700 });
fs.chmodSync(sshDir, 0o700);
const pub = path.join(sshDir, "id_ed25519.pub");
const priv = path.join(sshDir, "id_ed25519");
if (!fs.existsSync(pub)) {
  cp.execFileSync("ssh-keygen", ["-t", "ed25519", "-N", "", "-f", priv], { stdio: "ignore" });
}
process.stdout.write(fs.readFileSync(pub, "utf8").trim() + "\\n");
`;

const REMOTE_CONVERGE_SCRIPT = `
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const cp = require("node:child_process");

const rawInput = fs.readFileSync(0, "utf8");
const payload = JSON.parse(rawInput);
const home = os.homedir();

// A. ~/.config/agent-fleet/machine.json
const fleetDir = path.join(home, ".config", "agent-fleet");
fs.mkdirSync(fleetDir, { recursive: true, mode: 0o700 });
fs.writeFileSync(path.join(fleetDir, "machine.json"), JSON.stringify(payload.machine, null, 2) + "\\n");

// B. Global doctrine files
const agDir = path.join(home, ".agentskills");
const doctrinePairs = [
  [".claude/CLAUDE.md", "CLAUDE.md"],
  [".codex/AGENTS.md", "AGENTS.md"],
  [".gemini/GEMINI.md", "GEMINI.md"],
  [".config/opencode/AGENTS.md", "AGENTS.md"],
];
for (const [destRel, srcName] of doctrinePairs) {
  const srcPath = path.join(agDir, srcName);
  const destPath = path.join(home, destRel);
  if (fs.existsSync(srcPath)) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, fs.readFileSync(srcPath, "utf8"));
  }
}

// C. cua-driver MCP across Claude, Codex, OpenCode, Gemini CLI, and Antigravity
const cuaBin = path.join(home, ".local", "bin", "cua-driver");
function upsertStdioMcpJson(relPath, keyName) {
  const filePath = path.join(home, relPath);
  let data = {};
  if (fs.existsSync(filePath)) {
    try { data = JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { data = {}; }
  }
  if (!data[keyName] || typeof data[keyName] !== "object") data[keyName] = {};
  if (!data[keyName]["cua-driver"]) {
    data[keyName]["cua-driver"] = relPath === ".claude.json"
      ? { type: "stdio", command: cuaBin, args: ["mcp"], env: {} }
      : { command: cuaBin, args: ["mcp"] };
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\\n");
  }
}
upsertStdioMcpJson(".claude.json", "mcpServers");
upsertStdioMcpJson(".gemini/config/mcp_config.json", "mcpServers");
upsertStdioMcpJson(".gemini/antigravity/mcp_config.json", "mcpServers");
upsertStdioMcpJson(".gemini/settings.json", "mcpServers");

const codexToml = path.join(home, ".codex", "config.toml");
fs.mkdirSync(path.dirname(codexToml), { recursive: true });
const tomlTxt = fs.existsSync(codexToml) ? fs.readFileSync(codexToml, "utf8") : "";
if (!tomlTxt.includes("[mcp_servers.cua-driver]")) {
  const block = '\\n[mcp_servers.cua-driver]\\ncommand = "' + cuaBin + '"\\nargs = ["mcp"]\\nenabled = true\\n';
  fs.writeFileSync(codexToml, tomlTxt.trimEnd() + "\\n" + block);
}

const ocJsonc = path.join(home, ".config", "opencode", "opencode.jsonc");
if (fs.existsSync(ocJsonc)) {
  const rawTxt = fs.readFileSync(ocJsonc, "utf8");
  if (!rawTxt.includes('"cua-driver"')) {
    try {
      const stripped = rawTxt.split(/\\r?\\n/).filter((l) => !l.trim().startsWith("//")).join("\\n");
      const obj = JSON.parse(stripped);
      if (!obj.mcp || typeof obj.mcp !== "object") obj.mcp = {};
      obj.mcp["cua-driver"] = { type: "local", command: [cuaBin, "mcp"], enabled: true };
      fs.writeFileSync(ocJsonc, JSON.stringify(obj, null, 2) + "\\n");
    } catch {}
  }
}

// D. Git global identity
const curName = cp.spawnSync("git", ["config", "--global", "user.name"], { encoding: "utf8" }).stdout.trim();
const curEmail = cp.spawnSync("git", ["config", "--global", "user.email"], { encoding: "utf8" }).stdout.trim();
if (!curName) cp.spawnSync("git", ["config", "--global", "user.name", "Brian Zalewski"]);
if (!curEmail) cp.spawnSync("git", ["config", "--global", "user.email", "brian@megabyte.space"]);
cp.spawnSync("git", ["config", "--global", "init.defaultBranch", "main"]);

// E. GitHub CLI auth
const env = { ...process.env, PATH: path.join(home, ".local", "bin") + ":/opt/homebrew/bin:/usr/local/bin:" + (process.env.PATH || "") };
const ghStatus = cp.spawnSync("gh", ["auth", "status"], { env, encoding: "utf8" });
if (ghStatus.status !== 0 && payload.ghToken) {
  cp.spawnSync("gh", ["auth", "login", "--hostname", "github.com", "--git-protocol", "https", "--with-token"], {
    env,
    input: payload.ghToken + "\\n",
    encoding: "utf8",
  });
  cp.spawnSync("gh", ["auth", "setup-git"], { env, encoding: "utf8" });
}

// F. SSH Mesh (~/.ssh/authorized_keys + ~/.ssh/config)
const sshDir = path.join(home, ".ssh");
fs.mkdirSync(sshDir, { recursive: true, mode: 0o700 });
fs.chmodSync(sshDir, 0o700);
const akPath = path.join(sshDir, "authorized_keys");
const akLines = fs.existsSync(akPath) ? fs.readFileSync(akPath, "utf8").split(/\\r?\\n/).filter(Boolean) : [];
for (const pk of payload.publicKeys || []) {
  if (pk && !akLines.includes(pk)) akLines.push(pk);
}
fs.writeFileSync(akPath, akLines.join("\\n") + "\\n", { mode: 0o600 });
fs.chmodSync(akPath, 0o600);

const sshCfgPath = path.join(sshDir, "config");
const cfgTxt = fs.existsSync(sshCfgPath) ? fs.readFileSync(sshCfgPath, "utf8") : "";
const meshEntries = [
  ["zen.megabyte.space", "zen", "10.0.0.162", "ubuntu"],
  ["omen.megabyte.space", "omen", "10.0.0.161", "ubuntu"],
  ["legion.megabyte.space", "legion", "10.0.0.143", "ubuntu"],
  ["ubuntu.megabyte.space", "ubuntu", "10.0.0.156", "professormanhattan"],
  ["macbook-pro.megabyte.space", "macos", "10.0.0.138", "Apple"],
];
const addedBlocks = [];
for (const [fqdn, shortName, ip, usr] of meshEntries) {
  if (!cfgTxt.includes("Host " + fqdn)) {
    addedBlocks.push("Host " + fqdn + " " + shortName + "\\n  HostName " + ip + "\\n  User " + usr + "\\n  IdentityFile ~/.ssh/id_ed25519\\n  StrictHostKeyChecking accept-new\\n");
  }
}
if (addedBlocks.length > 0) {
  fs.writeFileSync(sshCfgPath, cfgTxt.trimEnd() + "\\n\\n# Fleet LAN SSH Mesh\\n" + addedBlocks.join("\\n") + "\\n", { mode: 0o600 });
  fs.chmodSync(sshCfgPath, 0o600);
}

// G. Cloudflare WARP Zero Trust CA
if (payload.cloudflareCertPem) {
  const caDir = path.join(home, ".config", "agent-fleet", "ca");
  fs.mkdirSync(caDir, { recursive: true });
  fs.writeFileSync(path.join(caDir, "cloudflare-warp-zt.pem"), payload.cloudflareCertPem + "\\n");
}
if (payload.cloudflareCaScriptBase64) {
  const scriptPath = path.join(home, ".local", "bin", "ensure-cloudflare-zt-ca.sh");
  fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  fs.writeFileSync(scriptPath, Buffer.from(payload.cloudflareCaScriptBase64, "base64"), { mode: 0o755 });
  fs.chmodSync(scriptPath, 0o755);
  cp.spawnSync(scriptPath, [], { env, encoding: "utf8" });
}

process.stdout.write("Converged " + os.hostname() + "\\n");
`;

async function main(): Promise<void> {
  const ghToken = runSyncCommand("gh", ["auth", "token"]).stdout.trim();
  const installDoctorRepo = join(HOME, "emdash", "repositories", "install.doctor");
  const cfCaScriptPath = join(installDoctorRepo, "home", "dot_local", "bin", "executable_ensure-cloudflare-zt-ca.sh");
  const cloudflareCaScriptBase64 = existsSync(cfCaScriptPath)
    ? readFileSync(cfCaScriptPath).toString("base64")
    : "";

  const cloudflareCertPem = runSyncCommand("ssh", [
    "ubuntu.megabyte.space",
    "cat /usr/local/share/ca-certificates/cloudflare-warp-zt.crt 2>/dev/null || cat /etc/ssl/certs/Cloudflare_CA.pem 2>/dev/null || true",
  ]).stdout.trim();

  const publicKeys: string[] = [];
  for (const target of FLEET_TARGETS) {
    const res =
      target.sshTarget === null
        ? runSyncCommand("node", ["-e", REMOTE_KEY_SCRIPT])
        : runSyncCommand("ssh", [
            target.sshTarget,
            `export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.local/share/mise/shims:$PATH"; node -e '${REMOTE_KEY_SCRIPT.replaceAll("'", "'\\''")}'`,
          ]);
    const key = res.stdout.trim();
    if (key) {
      publicKeys.push(key);
    }
  }
  process.stdout.write(`Collected ${publicKeys.length} SSH public keys across fleet\n`);

  await Promise.all(
    FLEET_TARGETS.map(async (target) => {
      if (target.sshTarget === null) {
        const localLink = join(HOME, "ai", "repos", "agent-skills");
        mkdirSync(dirname(localLink), { recursive: true });
        if (!existsSync(localLink)) {
          symlinkSync(join(HOME, ".agentskills"), localLink);
        }
        process.stdout.write("agentskills: local linked\n");
        return;
      }
      const prepScript = `
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
      `;
      await runAsyncCommand("ssh", [target.sshTarget, prepScript]);
      await runAsyncCommand("rsync", [
        "-az",
        "--delete",
        "--exclude=.git/objects/pack/*.tmp",
        `${join(HOME, ".agentskills")}/`,
        `${target.sshTarget}:~/ai/repos/agent-skills/`,
      ]);
      process.stdout.write(`agentskills: ${target.key} rsynced\n`);
    }),
  );

  const convergeResults = await Promise.all(
    FLEET_TARGETS.map(async (target) => {
      const payload: RemoteConvergencePayload = {
        machine: target.machine,
        ghToken,
        publicKeys,
        cloudflareCertPem,
        cloudflareCaScriptBase64,
      };
      const serialized = JSON.stringify(payload);
      const res =
        target.sshTarget === null
          ? await runAsyncCommand("node", ["-e", REMOTE_CONVERGE_SCRIPT], serialized)
          : await runAsyncCommand(
              "ssh",
              [
                target.sshTarget,
                `export PATH="/usr/local/bin:/opt/homebrew/bin:$HOME/.local/share/mise/shims:$PATH"; node -e '${REMOTE_CONVERGE_SCRIPT.replaceAll("'", "'\\''")}'`,
              ],
              serialized,
            );
      return `${target.key}: ${res.stdout.trim() || res.stderr.trim()}`;
    }),
  );

  for (const line of convergeResults) {
    process.stdout.write(`${line}\n`);
  }
}

void main();
