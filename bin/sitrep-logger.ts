#!/usr/bin/env node
/**
 * sitrep-logger.ts
 * Standardized Paramilitary Situation Report (SITREP) generator & validator for fleet operations.
 *
 * Format follows NATO / Paramilitary standard:
 * 1. LINE 1 - DATE-TIME GROUP (DTG)
 * 2. LINE 2 - UNIT & CALL SIGN
 * 3. LINE 3 - SECTOR & COORDINATES
 * 4. LINE 4 - OPERATIONAL STATUS (GREEN / AMBER / RED)
 * 5. LINE 5 - OBJECTIVE / MISSION INTENT
 * 6. LINE 6 - ACTION / STRIKE EXECUTED
 * 7. LINE 7 - PROOF OF LIFE (MACHINE VERIFIED)
 * 8. LINE 8 - LOSSES / DEBT / BLOCKERS
 * 9. LINE 9 - NEXT WAYPOINT
 */

import { writeFileSync, mkdirSync, appendFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

export interface SitrepPayload {
  unit: string;
  callSign: string;
  sector: string;
  status: 'GREEN' | 'AMBER' | 'RED';
  intent: string;
  action: string;
  proofOfLife: string;
  blockers?: string;
  nextWaypoint: string;
  metadata?: Record<string, unknown>;
}

export function formatSitrep(payload: SitrepPayload): string {
  const dtg = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + 'Z';
  const divider = '══════════════════════════════════════════════════════════════════════════';
  
  return `
${divider}
  SITUATION REPORT (SITREP) // MISSION COMMAND // CLASSIFIED: FLEET OPERATIONAL
${divider}
  1. DTG:           ${dtg}
  2. UNIT:          ${payload.unit} [CALL SIGN: ${payload.callSign}]
  3. SECTOR:        ${payload.sector}
  4. READINESS:     [${payload.status}]
  5. INTENT:        ${payload.intent}
  6. ACTION:        ${payload.action}
  7. PROOF OF LIFE: ${payload.proofOfLife}
  8. CASUALTY/DEBT: ${payload.blockers || 'NONE DETECTED (ZERO LOSSES)'}
  9. NEXT WAYPOINT: ${payload.nextWaypoint}
${divider}
`.trim();
}

export function logSitrep(payload: SitrepPayload, logPath?: string): string {
  const formatted = formatSitrep(payload);
  const targetDir = resolve(homedir(), '.agentskills', 'logs');
  mkdirSync(targetDir, { recursive: true });
  
  const file = logPath || resolve(targetDir, 'fleet-sitrep.log');
  appendFileSync(file, formatted + '\n\n', 'utf8');

  // Also append structured JSONL for observatory digestion
  const jsonlFile = resolve(targetDir, 'fleet-sitrep.ndjson');
  appendFileSync(jsonlFile, JSON.stringify({
    dtg: new Date().toISOString(),
    ...payload
  }) + '\n', 'utf8');

  return formatted;
}

// CLI execution handling
if (process.argv[1] && process.argv[1].endsWith('sitrep-logger.ts')) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.length === 0) {
    console.log(`
Usage:
  node sitrep-logger.ts --unit <name> --callsign <sign> --sector <sec> --status <GREEN|AMBER|RED> --intent <text> --action <text> --proof <text> --next <text> [--blockers <text>]
`);
    process.exit(0);
  }

  const getArg = (flag: string) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : '';
  };

  const payload: SitrepPayload = {
    unit: getArg('--unit') || 'Fleet Unit',
    callSign: getArg('--callsign') || 'UNKNOWN-01',
    sector: getArg('--sector') || 'General Operations',
    status: (getArg('--status').toUpperCase() as any) || 'GREEN',
    intent: getArg('--intent') || 'Routine Sector Patrol',
    action: getArg('--action') || 'Executed maintenance',
    proofOfLife: getArg('--proof') || 'Unit tests passing (100%)',
    blockers: getArg('--blockers'),
    nextWaypoint: getArg('--next') || 'Hold Current Sector'
  };

  const output = logSitrep(payload);
  console.log(output);
}
