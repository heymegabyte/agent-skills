#!/usr/bin/env node
// growth-policy.mjs — scoring + distribution-integrity enforcement for the Autonomous Growth Orchestrator.
// Governed by rules/autonomous-growth-orchestrator.md (§10 scoring, Awesome-List caps) +
// rules/qualified-traffic-attribution.md (channel ranking). Pure functions; no I/O.

// §10 opportunity score → 0..100. Positive factors reward; cost/complexity/maintenance/risk penalize.
const W = {
  reach: 12, intent: 14, value: 14, differentiation: 8, evidence: 8, distribution: 10,
  compounding: 12, confidence: 6, reuse: 8, verifiability: 6,            // + (sum 98)
  complexity: 8, maintenance: 6, cost: 6, risk: 8,                       // - (sum 28)
};
export function scoreOpportunity(o) {
  let pos = 0, posMax = 0, pen = 0;
  for (const [k, w] of Object.entries(W)) {
    const v = Math.max(0, Math.min(1, o[k] ?? 0));
    if (['complexity', 'maintenance', 'cost', 'risk'].includes(k)) pen += v * w;
    else { pos += v * w; posMax += w; }
  }
  return Math.round(Math.max(0, (pos - pen) / posMax * 100));
}

const oppKey = (o) => `${o.strategy}|${(o.audience || '').toLowerCase()}|${(o.asset || '').toLowerCase()}`;
export function dedupeOpportunities(list) {
  const best = new Map();
  for (const o of list) {
    const k = oppKey(o), s = scoreOpportunity(o);
    if (!best.has(k) || s > best.get(k)._score) best.set(k, { ...o, _score: s });
  }
  return [...best.values()].sort((a, b) => b._score - a._score);
}

// Awesome-List policy: <=2 external listing PRs / product / 30d; no repeat to same dest within 90d;
// never resubmit a rejected dest unless invited.
const DAY = 86400000;
export function awesomeListAllowed(history, dest, now, { invited = false } = {}) {
  const last30 = history.filter((h) => now - h.ts <= 30 * DAY).length;
  if (last30 >= 2) return { allowed: false, reason: 'monthly cap (2) reached' };
  const prior = history.filter((h) => h.dest === dest).sort((a, b) => b.ts - a.ts)[0];
  if (prior) {
    if (prior.status === 'rejected' && !invited) return { allowed: false, reason: 'rejected; await invitation' };
    if (now - prior.ts < 90 * DAY) return { allowed: false, reason: '90-day no-resubmit to same destination' };
  }
  return { allowed: true, reason: 'ok' };
}

// Channel ranking: lower cost-per-qualified-activation first; compounding breaks ties.
export function rankChannels(channels) {
  return channels
    .map((c) => ({ ...c, cpa_q: c.qualified > 0 ? c.cost / c.qualified : Infinity }))
    .sort((a, b) => a.cpa_q - b.cpa_q || Number(b.compounding) - Number(a.compounding));
}
