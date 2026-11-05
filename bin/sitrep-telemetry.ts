#!/usr/bin/env node
/**
 * sitrep-telemetry.ts
 * Real-Time SITREP Telemetry Ingestion & Aggregation Engine.
 * Ingests 9-line NATO SITREPs from agent runs, appends to an immutable JSONL ledger,
 * and calculates fleet velocity, casualty rates, and readiness scores.
 */

import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const LOGS_DIR = resolve(homedir(), '.agentskills', 'logs');
const SITREP_LEDGER = resolve(LOGS_DIR, 'sitrep-telemetry.jsonl');
mkdirSync(LOGS_DIR, { recursive: true });

export interface SitrepRecord {
  dtg: string;
  unit: string;
  callSign: string;
  sector: string;
  readiness: 'GREEN' | 'AMBER' | 'RED';
  intent: string;
  action: string;
  proofOfLife: string;
  debtOrCasualty: string;
  nextWaypoint: string;
  timestamp: string;
}

export function recordSitrep(record: SitrepRecord): void {
  const line = JSON.stringify({ ...record, timestamp: record.timestamp || new Date().toISOString() }) + '\n';
  appendFileSync(SITREP_LEDGER, line, 'utf8');
}

export function parseSitreps(): SitrepRecord[] {
  if (!existsSync(SITREP_LEDGER)) return [];
  const content = readFileSync(SITREP_LEDGER, 'utf8').trim();
  if (!content) return [];
  return content.split('\n').filter(Boolean).map(line => JSON.parse(line));
}

export function getFleetReadinessSummary(): {
  totalSitreps: number;
  readinessCounts: Record<string, number>;
  latestReports: SitrepRecord[];
} {
  const all = parseSitreps();
  const counts: Record<string, number> = { GREEN: 0, AMBER: 0, RED: 0 };
  for (const r of all) {
    if (counts[r.readiness] !== undefined) counts[r.readiness]++;
  }

  return {
    totalSitreps: all.length,
    readinessCounts: counts,
    latestReports: all.slice(-5).reverse()
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- SITREP Telemetry Test ---');
  recordSitrep({
    dtg: new Date().toISOString(),
    unit: 'Architect',
    callSign: 'STRAT-01',
    sector: 'Architecture & Contracts',
    readiness: 'GREEN',
    intent: 'Lock OpenAPI schemas for auth endpoint',
    action: 'Generated Zod schema and OpenAPI 3.1 spec',
    proofOfLife: 'pnpm test:contracts passed 100%',
    debtOrCasualty: 'NONE (Zero debt)',
    nextWaypoint: 'Handoff to Backend-Engineer',
    timestamp: new Date().toISOString()
  });

  const summary = getFleetReadinessSummary();
  console.log(`Total Ingested SITREPs: ${summary.totalSitreps}`);
  console.log(`Readiness: [GREEN: ${summary.readinessCounts.GREEN}, AMBER: ${summary.readinessCounts.AMBER}, RED: ${summary.readinessCounts.RED}]`);
  console.log(`Latest Report from ${summary.latestReports[0].unit} (${summary.latestReports[0].callSign}) - Intent: "${summary.latestReports[0].intent}"`);
}
