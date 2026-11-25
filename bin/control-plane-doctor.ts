import { execFileSync } from 'node:child_process';
import { digest } from './control-plane-contracts.ts';
import { analyticsDoctor } from './operational-analytics.ts';

export type DoctorStatus = 'PASS' | 'FAIL' | 'SKIP' | 'BLOCKED' | 'UNVERIFIED';
export interface ProbeResult { id: string; status: DoctorStatus; observedAt: string; summary: string; evidenceRef?: string; findingKey?: string }
export type Probe = () => Promise<ProbeResult> | ProbeResult;

export async function runEstateDoctor(probes: Record<string, Probe>, now: string, freshnessMs = 900_000) {
  const results: ProbeResult[] = [];
  for (const [id, probe] of Object.entries(probes).sort(([a], [b]) => a.localeCompare(b))) {
    try { results.push({ ...(await probe()), id }); }
    catch (error) { results.push({ id, status: 'UNVERIFIED', observedAt: now, summary: `probe unavailable: ${error instanceof Error ? error.name : 'unknown'}` }); }
  }
  const findings = new Map<string, ProbeResult>();
  for (const result of results) {
    const key = result.findingKey ?? result.id;
    const prior = findings.get(key);
    if (!prior || (!prior.evidenceRef && result.evidenceRef)) findings.set(key, result);
  }
  const deduped = [...findings.values()];
  const normalized = deduped.map((result) => Date.parse(now) - Date.parse(result.observedAt) > freshnessMs && result.status === 'PASS' ? { ...result, status: 'UNVERIFIED' as const, summary: `stale: ${result.summary}` } : result);
  const status: DoctorStatus = normalized.some((r) => r.status === 'FAIL') ? 'FAIL' : normalized.some((r) => r.status === 'BLOCKED') ? 'BLOCKED' : normalized.some((r) => r.status === 'UNVERIFIED') ? 'UNVERIFIED' : 'PASS';
  const unsigned = { schemaVersion: '1.0.0', generatedAt: now, status, results: normalized };
  return { ...unsigned, integrityDigest: digest(unsigned), correctiveIssuePlan: normalized.filter((r) => ['FAIL', 'BLOCKED'].includes(r.status)).map((r) => ({ originKey: `estate-doctor:${r.findingKey ?? r.id}`, title: r.summary, action: 'plan-only' })) };
}

export function commandProbe(id: string, command: string, args: string[], now: string): Probe {
  return () => {
    try {
      execFileSync(command, args, { encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'] });
      return { id, status: 'PASS', observedAt: now, summary: `${id} completed read-only` };
    } catch (error) { return { id, status: 'FAIL', observedAt: now, summary: `${id} failed`, evidenceRef: error instanceof Error ? error.name : 'command-error' }; }
  };
}

export function boundedDriftProbe(now: string, options: { sourceRoot?: string; sourceRevision?: string; installedRoot?: string } = {}): Probe {
  return () => {
    const sourceRoot = options.sourceRoot ?? process.cwd();
    const sourceRevision = options.sourceRevision ?? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: sourceRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const args = ['--experimental-strip-types', 'bin/bounded-drift-detector.ts', '--source-root', sourceRoot, '--source-revision', sourceRevision, '--json'];
    if (options.installedRoot) args.push('--installed-root', options.installedRoot);
    try {
      const report = JSON.parse(execFileSync('node', args, { cwd: sourceRoot, encoding: 'utf8', timeout: 30_000, stdio: ['ignore', 'pipe', 'pipe'] })) as { status: 'PASS' | 'DRIFT' | 'UNVERIFIED'; findings: Array<{ status: string }> };
      return { id: 'bounded-instruction-drift', status: report.status === 'DRIFT' ? 'FAIL' : report.status, observedAt: now, summary: `bounded drift ${report.status}; findings=${report.findings.length}`, evidenceRef: `drift:${report.status.toLowerCase()}` };
    } catch (error) {
      return { id: 'bounded-instruction-drift', status: 'FAIL', observedAt: now, summary: 'bounded drift detector failed', evidenceRef: error instanceof Error ? error.name : 'command-error' };
    }
  };
}

export function fixtureProbes(now: string): Record<string, Probe> {
  return Object.fromEntries(['paperclip-api-version-accounting-budgets', 'openclaw-health-config', 'approved-secret-presence', 'runner-health', 'backup-evidence', 'synchronization-drift', 'event-dispatch', 'recovery-controls', 'provenance'].map((id) => [id, () => ({ id, status: 'PASS', observedAt: now, summary: `${id} fixture healthy` })]));
}

export function existingDoctorProbes(now: string): Record<string, Probe> {
  return {
    'skills-doctor': commandProbe('skills-doctor', 'python3', ['control-plane/skills-doctor.py', '--json'], now),
    'plugin-doctor': commandProbe('plugin-doctor', 'node', ['bin/doctor.mjs', '--json'], now),
    'portfolio-health': commandProbe('portfolio-health', 'python3', ['control-plane/portfolio-health.py', '--json'], now),
    'bounded-instruction-drift': boundedDriftProbe(now, { sourceRevision: process.env.AGENT_SKILLS_TRUTH_REVISION }),
  };
}

export function analyticsDoctorProbes(now: string, env: NodeJS.ProcessEnv = process.env): Record<string, Probe> {
  const report = analyticsDoctor(env);
  return Object.fromEntries(report.checks.map((check) => {
    const id = String(check.id);
    return [id, () => ({
      id,
      status: check.status as DoctorStatus,
      observedAt: now,
      summary: `${id} ${check.status}; retention=${check.retentionDays}d sample=${check.sampleRate} privacy=${check.privacy}`,
    })];
  }));
}
