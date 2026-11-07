#!/usr/bin/env bun
/**
 * @file ssh-ca-client.ts
 * @brief Client utility to request ephemeral OpenSSH certificates from the fleet CA.
 *
 * Connects to ubuntu.megabyte.space via unattended SSH, submits the local public key,
 * and writes the short-lived signed certificate to ~/.ssh/<key>-cert.pub.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface SshCaSignOptions {
  keyPath?: string;
  principals?: string[];
  validity?: string;
}

export function requestEphemeralCert(options: SshCaSignOptions = {}): string {
  const home = homedir();
  const defaultKey = existsSync(join(home, '.ssh', 'id_ed25519.pub'))
    ? join(home, '.ssh', 'id_ed25519.pub')
    : join(home, '.ssh', 'ssh-5c-nano-laptop.pub');

  const pubKeyPath = options.keyPath || defaultKey;
  if (!existsSync(pubKeyPath)) {
    throw new Error(`Public key file not found: ${pubKeyPath}`);
  }

  const pubKeyContent = readFileSync(pubKeyPath, 'utf8').trim();
  const principals = (options.principals || ['professormanhattan', 'ubuntu', 'root', 'Apple']).join(',');
  const validity = options.validity || '+8h';

  console.log(`[SSH-CA] Requesting ephemeral cert for: ${pubKeyPath}`);
  console.log(`[SSH-CA] Principals: ${principals} | Validity: ${validity}`);

  const remoteCmd = `sudo /usr/local/bin/sign-ssh-cert - "${principals}" "${validity}"`;

  const certOutput = execSync(
    `ssh -o BatchMode=yes -o IdentityAgent=none -i ~/.ssh/id_rsa professormanhattan@ubuntu.megabyte.space '${remoteCmd}'`,
    {
      input: pubKeyContent + '\n',
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    }
  ).trim();

  // Strip sudo prompts if any
  const certLines = certOutput.split('\n').filter((l) => l.startsWith('ssh-') || l.startsWith('sk-'));
  const cert = certLines[certLines.length - 1];

  if (!cert || !cert.includes('-cert-v01@openssh.com')) {
    throw new Error(`Failed to receive valid certificate from CA: ${certOutput}`);
  }

  const certDest = pubKeyPath.replace(/\.pub$/, '-cert.pub');
  writeFileSync(certDest, cert + '\n', { mode: 0o644 });
  console.log(`[SSH-CA] Successfully wrote ephemeral certificate to: ${certDest}`);
  return certDest;
}

if (import.meta.main) {
  try {
    const certPath = requestEphemeralCert();
    console.log(`[SSH-CA] Ready for certificate-authenticated SSH: ${certPath}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[SSH-CA] Error: ${message}`);
    process.exit(1);
  }
}
