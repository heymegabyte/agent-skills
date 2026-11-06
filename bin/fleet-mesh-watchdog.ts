#!/usr/bin/env node
/**
 * @file fleet-mesh-watchdog.ts
 * @brief Zero-Trust WireGuard, LAN Mesh, and Hardware PAM/CA Health Monitor.
 *
 * Continuously monitors SSH latency, pam_ssh_agent_auth configuration,
 * and OpenSSH CA deployment across the local mesh network.
 */

import { execSync } from 'node:child_process';

export interface HostHealth {
  host: string;
  ip: string;
  status: 'ONLINE' | 'OFFLINE';
  caConfigured: boolean;
  pamSudoConfigured: boolean;
  latencyMs: number;
}

export function checkFleetHealth(): HostHealth[] {
  const targets = [
    { host: 'ubuntu', ip: '10.0.0.156' },
    { host: 'legion', ip: '10.0.0.143' },
    { host: 'omen', ip: '10.0.0.161' },
    { host: 'zen', ip: '10.0.0.162' }
  ];

  const results: HostHealth[] = [];

  for (const target of targets) {
    const start = Date.now();
    try {
      let script = '';
      if (target.host === 'ubuntu') {
        script = `
          grep -q pam_ssh_agent_auth /etc/pam.d/sudo && echo "PAM:OK" || echo "PAM:NO"
          test -f /etc/ssh/ca.pub && echo "CA:OK" || echo "CA:NO"
        `;
      } else {
        script = `
          ssh -o BatchMode=yes -o ConnectTimeout=3 ubuntu@${target.host} << 'REMOTE_EOF'
            grep -q pam_ssh_agent_auth /etc/pam.d/sudo && echo "PAM:OK" || echo "PAM:NO"
            test -f /etc/ssh/ca.pub && echo "CA:OK" || echo "CA:NO"
REMOTE_EOF
        `;
      }

      const output = execSync(
        `ssh -o BatchMode=yes -o IdentityAgent=none -i ~/.ssh/id_rsa professormanhattan@ubuntu.megabyte.space 'bash -s'`,
        {
          input: script,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore'],
          timeout: 8000
        }
      ).trim();

      const isOnline = output.includes('PAM:OK') || output.includes('CA:OK');
      const latencyMs = Date.now() - start;

      results.push({
        host: target.host,
        ip: target.ip,
        status: isOnline ? 'ONLINE' : 'OFFLINE',
        caConfigured: output.includes('CA:OK'),
        pamSudoConfigured: output.includes('PAM:OK'),
        latencyMs
      });
    } catch {
      results.push({
        host: target.host,
        ip: target.ip,
        status: 'OFFLINE',
        caConfigured: false,
        pamSudoConfigured: false,
        latencyMs: Date.now() - start
      });
    }
  }

  return results;
}

if (process.argv[1]?.endsWith('fleet-mesh-watchdog.ts') || import.meta.main) {
  console.log('[Mesh-Watchdog] Auditing fleet LAN mesh status via ubuntu jump host...\n');
  const health = checkFleetHealth();
  console.log('┌──────────┬──────────────┬─────────┬──────────────┬────────────┬─────────────┐');
  console.log('│ Host     │ IP Address   │ Status  │ Ephemeral CA │ Touch Sudo │ Latency     │');
  console.log('├──────────┼──────────────┼─────────┼──────────────┼────────────┼─────────────┤');
  for (const h of health) {
    const statusStr = h.status === 'ONLINE' ? '\x1b[32mONLINE \x1b[0m' : '\x1b[31mOFFLINE\x1b[0m';
    const caStr = h.caConfigured ? '\x1b[32mACTIVE \x1b[0m' : '\x1b[33mPENDING\x1b[0m';
    const pamStr = h.pamSudoConfigured ? '\x1b[32mACTIVE    \x1b[0m' : '\x1b[33mPENDING   \x1b[0m';
    console.log(
      `│ ${h.host.padEnd(8)} │ ${h.ip.padEnd(12)} │ ${statusStr} │ ${caStr}     │ ${pamStr} │ ${(h.latencyMs + 'ms').padStart(11)} │`
    );
  }
  console.log('└──────────┴──────────────┴─────────┴──────────────┴────────────┴─────────────┘\n');
}
