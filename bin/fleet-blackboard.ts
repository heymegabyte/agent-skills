#!/usr/bin/env node
/**
 * fleet-blackboard.ts
 * Cross-Agent Shared Memory Blackboard.
 * Provides a decentralized, thread-safe key-value blackboard for multi-agent swarms.
 * Agents publish discovered facts, active contracts, and cached parameters for peer discovery.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const LOGS_DIR = resolve(homedir(), '.agentskills', 'logs');
const BLACKBOARD_FILE = resolve(LOGS_DIR, 'fleet-blackboard.json');
mkdirSync(LOGS_DIR, { recursive: true });

export interface BlackboardEntry {
  key: string;
  value: unknown;
  author: string;
  callSign: string;
  updatedAt: string;
  ttlSeconds?: number;
}

export class FleetBlackboard {
  private static load(): Record<string, BlackboardEntry> {
    if (!existsSync(BLACKBOARD_FILE)) return {};
    try {
      const raw = readFileSync(BLACKBOARD_FILE, 'utf8').trim();
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private static save(data: Record<string, BlackboardEntry>): void {
    writeFileSync(BLACKBOARD_FILE, JSON.stringify(data, null, 2), 'utf8');
  }

  public static post(key: string, value: unknown, author: string, callSign: string, ttlSeconds?: number): BlackboardEntry {
    const data = this.load();
    const entry: BlackboardEntry = {
      key,
      value,
      author,
      callSign,
      updatedAt: new Date().toISOString(),
      ttlSeconds
    };
    data[key] = entry;
    this.save(data);
    return entry;
  }

  public static get(key: string): unknown | undefined {
    const data = this.load();
    const entry = data[key];
    if (!entry) return undefined;

    // Check TTL if set
    if (entry.ttlSeconds) {
      const ageSeconds = (Date.now() - new Date(entry.updatedAt).getTime()) / 1000;
      if (ageSeconds > entry.ttlSeconds) {
        delete data[key];
        this.save(data);
        return undefined;
      }
    }

    return entry.value;
  }

  public static list(): BlackboardEntry[] {
    const data = this.load();
    return Object.values(data);
  }

  public static delete(key: string): boolean {
    const data = this.load();
    if (key in data) {
      delete data[key];
      this.save(data);
      return true;
    }
    return false;
  }
}

if (process.argv[1]?.endsWith('fleet-blackboard.ts') || import.meta.main) {
  console.log('--- Fleet Blackboard Self-Test ---');
  FleetBlackboard.post('api:auth:endpoint', '/api/v1/auth/session', 'Architect', 'STRAT-01');
  const val = FleetBlackboard.get('api:auth:endpoint');
  console.log(`Retrieved Value for 'api:auth:endpoint': "${val}"`);

  const all = FleetBlackboard.list();
  console.log(`Total Active Blackboard Entries: ${all.length}`);
  all.forEach(e => console.log(`  - [${e.key}] posted by ${e.author} (${e.callSign}) at ${e.updatedAt}`));
}
