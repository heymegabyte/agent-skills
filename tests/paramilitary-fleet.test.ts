import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, lstatSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkRoe } from '../bin/roe-enforcer.ts';
import { formatSitrep, logSitrep } from '../bin/sitrep-logger.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = resolve(__dirname, '..', 'agents');

describe('Paramilitary Fleet Command Doctrine & Tools', () => {
  it('correctly classifies GREEN, AMBER, and RED ROE tiers', () => {
    // GREEN: safe autonomous implementation
    const greenRes = checkRoe('Implement user profile form component with Zod validation');
    assert.equal(greenRes.tier, 'GREEN');
    assert.equal(greenRes.approved, true);

    // AMBER: audited schema change
    const amberRes = checkRoe('Run database migration with ALTER TABLE users ADD COLUMN phone text;');
    assert.equal(amberRes.tier, 'AMBER');
    assert.equal(amberRes.approved, true);
    assert.ok(amberRes.recommendations.some(r => r.includes('two-man rule')));

    // RED: restricted destructive command
    const redRes = checkRoe('DROP TABLE users;');
    assert.equal(redRes.tier, 'RED');
    assert.equal(redRes.approved, false);
    assert.ok(redRes.violations.some(v => v.includes('RED TIER TRIGGER')));
  });

  it('generates standard military SITREP format with all 9 lines', () => {
    const sitrep = formatSitrep({
      unit: 'Full-Stack Engineer',
      callSign: 'COMBAT-01',
      sector: 'swarml.ink',
      status: 'GREEN',
      intent: 'Enforce type safety across API routes',
      action: 'Added Zod schema validation to /api/auth',
      proofOfLife: 'pnpm test:e2e pass (100%)',
      nextWaypoint: 'Ship to staging'
    });

    assert.ok(sitrep.includes('SITUATION REPORT (SITREP)'));
    assert.ok(sitrep.includes('1. DTG:'));
    assert.ok(sitrep.includes('2. UNIT:          Full-Stack Engineer [CALL SIGN: COMBAT-01]'));
    assert.ok(sitrep.includes('3. SECTOR:        swarml.ink'));
    assert.ok(sitrep.includes('4. READINESS:     [GREEN]'));
    assert.ok(sitrep.includes('5. INTENT:        Enforce type safety across API routes'));
    assert.ok(sitrep.includes('6. ACTION:        Added Zod schema validation to /api/auth'));
    assert.ok(sitrep.includes('7. PROOF OF LIFE: pnpm test:e2e pass (100%)'));
    assert.ok(sitrep.includes('8. CASUALTY/DEBT: NONE DETECTED (ZERO LOSSES)'));
    assert.ok(sitrep.includes('9. NEXT WAYPOINT: Ship to staging'));
  });

  it('validates that all 24 canonical paramilitary agent profiles contain military call signs, ROE, and converged tactical pillars', () => {
    const files = readdirSync(AGENTS_DIR).filter(f => {
      if (!f.endsWith('.md') || f.startsWith('.')) return false;
      const stat = lstatSync(resolve(AGENTS_DIR, f));
      return stat.isFile() && !stat.isSymbolicLink();
    });
    assert.ok(files.length >= 24, `Expected at least 24 agent profiles, found ${files.length}`);

    let paramilitaryCount = 0;
    for (const file of files) {
      const content = readFileSync(resolve(AGENTS_DIR, file), 'utf8');
      if (content.includes('Call Sign') || content.includes('CALL SIGN')) {
        paramilitaryCount++;
        assert.ok(content.includes('Commander\'s Intent'), `${file} missing Commander's Intent`);
        assert.ok(content.includes('Rules of Engagement'), `${file} missing Rules of Engagement`);
        assert.ok(
          content.includes('Converged Elite Tactical Mastery Pillars') || content.includes('Tactical Capabilities'),
          `${file} missing Tactical Mastery Pillars`
        );
        assert.ok(content.includes('PACE'), `${file} missing PACE`);
        assert.ok(content.includes('Self-Healing Error Recovery Runbook'), `${file} missing Self-Healing Error Recovery Runbook`);
        assert.ok(content.includes('Machine-Verifiable Definition of Done'), `${file} missing Definition of Done`);
      }
    }

    assert.equal(paramilitaryCount, 24, `Expected exactly 24 paramilitary profiles, found ${paramilitaryCount}`);
  });
});
