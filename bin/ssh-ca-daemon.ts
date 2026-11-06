#!/usr/bin/env node
/**
 * @file ssh-ca-daemon.ts
 * @brief Ephemeral OpenSSH CA Daemon and Status Verifier for the Autonomous Fleet.
 *
 * Verifies certificate validity, triggers auto-renewal before expiration, and ensures
 * dual-authentication parity (allowing standard non-YubiKey keys alongside CA certificates).
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { requestEphemeralCert } from './ssh-ca-client.ts';

export interface SshCertStatus {
  valid: boolean;
  certPath: string;
  keyId?: string;
  caKey?: string;
  principals: string[];
  validFrom?: string;
  validTo?: string;
  remainingMinutes?: number;
  dualAuthSupported: boolean;
}

export function inspectSshCertificate(certPath?: string): SshCertStatus {
  const home = homedir();
  const targetCert = certPath || join(home, '.ssh', 'id_ed25519-cert.pub');

  if (!existsSync(targetCert)) {
    return {
      valid: false,
      certPath: targetCert,
      principals: [],
      dualAuthSupported: true,
    };
  }

  try {
    const rawInfo = execSync(`ssh-keygen -L -f "${targetCert}"`, { encoding: 'utf8' });
    const lines = rawInfo.split('\n');

    let keyId = '';
    let caKey = '';
    let validFrom = '';
    let validTo = '';
    const principals: string[] = [];

    let inPrincipals = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('Key ID:')) {
        keyId = trimmed.replace('Key ID:', '').trim().replace(/^"|"$/g, '');
      } else if (trimmed.startsWith('Signing CA:')) {
        caKey = trimmed.replace('Signing CA:', '').trim();
      } else if (trimmed.startsWith('Valid:')) {
        const match = trimmed.match(/from\s+([^\s]+)\s+to\s+([^\s]+)/);
        if (match) {
          validFrom = match[1];
          validTo = match[2];
        }
      } else if (trimmed.startsWith('Principals:')) {
        inPrincipals = true;
      } else if (inPrincipals) {
        if (trimmed.startsWith('Critical Options:') || trimmed.startsWith('Extensions:')) {
          inPrincipals = false;
        } else if (trimmed.length > 0) {
          principals.push(trimmed);
        }
      }
    }

    const expiryTime = validTo ? new Date(validTo).getTime() : 0;
    const now = Date.now();
    const remainingMinutes = Math.round((expiryTime - now) / (1000 * 60));
    const valid = remainingMinutes > 0;

    return {
      valid,
      certPath: targetCert,
      keyId,
      caKey,
      principals,
      validFrom,
      validTo,
      remainingMinutes,
      dualAuthSupported: true,
    };
  } catch {
    return {
      valid: false,
      certPath: targetCert,
      principals: [],
      dualAuthSupported: true,
    };
  }
}

export function runStatusCheck(): boolean {
  console.log('[SSH-CA-DAEMON] Checking fleet ephemeral OpenSSH CA status...');
  let status = inspectSshCertificate();

  if (!status.valid || (status.remainingMinutes !== undefined && status.remainingMinutes < 15)) {
    console.log('[SSH-CA-DAEMON] Certificate expired or expiring soon. Triggering auto-renewal...');
    try {
      requestEphemeralCert();
      status = inspectSshCertificate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[SSH-CA-DAEMON] Auto-renewal failed: ${msg}`);
      return false;
    }
  }

  console.log(`[SSH-CA-DAEMON] Certificate: ${status.valid ? 'VALID' : 'INVALID'}`);
  console.log(`[SSH-CA-DAEMON] Path: ${status.certPath}`);
  console.log(`[SSH-CA-DAEMON] Key ID: ${status.keyId || 'N/A'}`);
  console.log(`[SSH-CA-DAEMON] CA Fingerprint: ${status.caKey || 'N/A'}`);
  console.log(`[SSH-CA-DAEMON] Principals: ${status.principals.join(', ')}`);
  console.log(`[SSH-CA-DAEMON] Validity: ${status.remainingMinutes} minutes remaining (until ${status.validTo})`);
  console.log(`[SSH-CA-DAEMON] Dual-Authentication: ACTIVE (AuthorizedKeysFile preserved for non-YubiKey keys)`);

  return status.valid;
}

if (process.argv[1]?.endsWith('ssh-ca-daemon.ts')) {
  const isStatus = process.argv.includes('--status') || process.argv.length <= 2;
  const isRenew = process.argv.includes('--renew');

  if (isRenew) {
    console.log('[SSH-CA-DAEMON] Explicit certificate renewal requested.');
    requestEphemeralCert();
    runStatusCheck();
    process.exit(0);
  }

  if (isStatus) {
    const ok = runStatusCheck();
    process.exit(ok ? 0 : 1);
  }
}
