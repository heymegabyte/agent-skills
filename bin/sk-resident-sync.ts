#!/usr/bin/env bun
/**
 * @file sk-resident-sync.ts
 * @brief Auto-discovers and registers resident FIDO2 keys from plugged-in YubiKey tokens.
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface ResidentKeyResult {
  discovered: string[];
  addedToAgent: string[];
}

export function syncResidentKeys(): ResidentKeyResult {
  const home = homedir();
  const residentDir = join(home, '.ssh', 'resident_keys');
  if (!existsSync(residentDir)) {
    mkdirSync(residentDir, { recursive: true, mode: 0o700 });
  }

  const result: ResidentKeyResult = { discovered: [], addedToAgent: [] };

  console.log('[Resident-Sync] Checking for resident FIDO2 keys on plugged-in hardware tokens...');
  try {
    // Attempt download of resident keys with a timeout to avoid blocking in unattended mode
    execSync(`timeout 1 /opt/homebrew/bin/ssh-keygen -K -f "${residentDir}/" 2>/dev/null || true`, {
      encoding: 'utf8',
      stdio: 'ignore'
    });

    const files = readdirSync(residentDir).filter((f) => !f.endsWith('.pub'));
    result.discovered = files.map((f) => join(residentDir, f));

    // Register into agent if agent socket exists
    const agentSock = process.env.SSH_AUTH_SOCK || join(home, '.ssh', 'agent.sock');
    if (existsSync(agentSock)) {
      for (const keyPath of result.discovered) {
        try {
          execSync(`/opt/homebrew/bin/ssh-add "${keyPath}" 2>/dev/null`, {
            env: { ...process.env, SSH_AUTH_SOCK: agentSock },
            stdio: 'pipe'
          });
          result.addedToAgent.push(keyPath);
        } catch {
          // Key may require user verification PIN
        }
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[Resident-Sync] Notice: ${msg}`);
  }

  console.log(`[Resident-Sync] Discovered: ${result.discovered.length} | Loaded into agent: ${result.addedToAgent.length}`);
  return result;
}

if (import.meta.main) {
  syncResidentKeys();
}
