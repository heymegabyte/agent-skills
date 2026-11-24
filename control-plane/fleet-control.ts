#!/usr/bin/env -S node --experimental-strip-types
/**
 * control-plane/fleet-control.ts
 *
 * Native TypeScript unified control-plane CLI for Paperclip (swarml.ink) +
 * OpenClaw (openclaw.swarml.ink) + Claw Router (cr) + agent-skills.
 * Replaces legacy Nov 12 Python helper scripts with zero-dependency Node 24 TypeScript.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildCloudflareFreeTierSecurityManifest,
  CANONICAL_28_THEME_TOOLS_LIBRARIES,
  evaluateVoiceKitCreditRunway,
  generateCloudflareFirstPartyTelemetryWorkerSource,
  runPromptfooSyntheticFleetEval,
} from "../bin/lib/sovereign-8-pillar-agent-telemetry.ts";

const cmd = process.argv[2] ?? "status";
const home = os.homedir();
const skillsRoot = fs.existsSync("/home/professormanhattan/ai/repos/agent-skills")
  ? "/home/professormanhattan/ai/repos/agent-skills"
  : path.join(home, ".agentskills");

if (cmd === "status" || cmd === "health") {
  const runner = path.join(skillsRoot, "mcp-servers", "paperclip-mcp-stdio-runner.mjs");
  const req = [
    JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "fleet-control", version: "1.0.0" } },
    }),
    JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "paperclip_fleet_status", arguments: {} },
    }),
  ].join("\n") + "\n";
  const out = execFileSync(process.execPath, [runner, "paperclip-control-plane-mcp"], {
    input: req,
    encoding: "utf8",
  });
  process.stdout.write(out);
} else if (cmd === "wiki-sync") {
  const runner = path.join(skillsRoot, "mcp-servers", "paperclip-mcp-stdio-runner.mjs");
  const req = [
    JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "fleet-control", version: "1.0.0" } },
    }),
    JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "paperclip_memory_wiki_sync", arguments: {} },
    }),
  ].join("\n") + "\n";
  const out = execFileSync(process.execPath, [runner, "paperclip-control-plane-mcp"], {
    input: req,
    encoding: "utf8",
  });
  process.stdout.write(out);
} else if (cmd === "converge") {
  const loopPath = path.join(skillsRoot, "bin", "serene-convergence-loop.ts");
  const out = execFileSync(process.execPath, ["--experimental-strip-types", loopPath], {
    encoding: "utf8",
  });
  process.stdout.write(out);
} else if (cmd === "sync") {
  const syncPath = path.join(skillsRoot, "bin", "fleet-cr-sync.ts");
  const out = execFileSync(process.execPath, ["--experimental-strip-types", syncPath], {
    encoding: "utf8",
  });
  process.stdout.write(out);
} else if (cmd === "telemetry-status") {
  const lfSpool = path.join(home, ".agentskills", "logs", "langfuse-spool.jsonl");
  const pillarSpool = path.join(home, ".agentskills", "logs", "telemetry-8pillar-spool.jsonl");
  const countLines = (f: string) =>
    fs.existsSync(f) ? fs.readFileSync(f, "utf8").trim().split("\n").filter(Boolean).length : 0;
  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        pillars: 8,
        langfuseTimeoutMs: 2500,
        circuitBreakerStrikes: 3,
        langfuseSpooledTraces: countLines(lfSpool),
        eightPillarSpooledEvents: countLines(pillarSpool),
        themeToolsCanonicalPackages: 28,
        libraries: CANONICAL_28_THEME_TOOLS_LIBRARIES,
        promptfooEval: runPromptfooSyntheticFleetEval(),
      },
      null,
      2,
    ) + "\n",
  );
} else if (cmd === "promptfoo-eval") {
  const report = runPromptfooSyntheticFleetEval();
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  if (!report.passed) process.exit(1);
} else if (cmd === "cloudflare-telemetry-worker") {
  process.stdout.write(generateCloudflareFirstPartyTelemetryWorkerSource());
} else if (cmd === "cloudflare-harden") {
  const hardenerPath = path.join(skillsRoot, "bin", "cloudflare-free-tier-hardener.ts");
  const out = execFileSync(process.execPath, ["--experimental-strip-types", hardenerPath, ...process.argv.slice(3)], {
    encoding: "utf8",
  });
  process.stdout.write(out);
} else if (cmd === "voicekit-status") {
  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        voicekit: evaluateVoiceKitCreditRunway(),
        cloudflareFreeTier: buildCloudflareFreeTierSecurityManifest(),
      },
      null,
      2,
    ) + "\n",
  );
} else {
  process.stdout.write(
    JSON.stringify({
      usage:
        "fleet-control.ts <status|wiki-sync|converge|sync|telemetry-status|promptfoo-eval|cloudflare-telemetry-worker|cloudflare-harden|voicekit-status>",
      skillsRoot,
    }) + "\n",
  );
}
