#!/usr/bin/env node
// growth-policy.test.mjs — E2E-GROWTH assertions (directive Part XX): scoring, dedupe,
// Awesome-List cap + 90-day + rejected enforcement, qualified-channel ranking.
import { scoreOpportunity, dedupeOpportunities, awesomeListAllowed, rankChannels } from '../growth-policy.mjs';

let pass = 0, fail = 0;
const ok = (name, cond) => { (cond ? pass++ : fail++); console.log(`${cond ? '✓' : '✗'} ${name}`); };
const DAY = 86400000, NOW = 1_760_000_000_000;

// 1. scoring: strong compounding/low-cost opp outscores weak high-cost one
const strong = { reach: .8, intent: .9, value: .9, differentiation: .7, evidence: .8, distribution: .8, compounding: 1, confidence: .8, reuse: .9, verifiability: .9, complexity: .3, maintenance: .2, cost: .2, risk: .1 };
const weak = { reach: .3, intent: .3, value: .3, differentiation: .2, evidence: .2, distribution: .2, compounding: 0, confidence: .3, reuse: .1, verifiability: .3, complexity: .9, maintenance: .8, cost: .9, risk: .7 };
ok('strong opp scores high', scoreOpportunity(strong) >= 70);
ok('weak opp scores low', scoreOpportunity(weak) <= 20);

// 2. dedupe keeps the higher-scoring duplicate, sorts desc
const deduped = dedupeOpportunities([
  { strategy: 2, audience: 'Devs', asset: 'compare page', ...weak },
  { strategy: 2, audience: 'devs', asset: 'Compare Page', ...strong },
  { strategy: 21, audience: 'agents', asset: 'mcp listing', ...strong },
]);
ok('dedupe collapses case-insensitive dupes', deduped.length === 2);
ok('dedupe keeps the stronger variant', deduped[0]._score >= deduped[1]._score && deduped.find(d => d.strategy === 2)._score >= 70);

// 3. Awesome-List enforcement
ok('fresh submission allowed', awesomeListAllowed([], 'awesome-foo', NOW).allowed === true);
ok('monthly cap blocks 3rd', awesomeListAllowed(
  [{ dest: 'a', ts: NOW - 2 * DAY, status: 'open' }, { dest: 'b', ts: NOW - 5 * DAY, status: 'open' }], 'c', NOW).allowed === false);
ok('90-day no-resubmit to same dest', awesomeListAllowed([{ dest: 'awesome-foo', ts: NOW - 30 * DAY, status: 'open' }], 'awesome-foo', NOW).allowed === false);
ok('rejected dest blocked unless invited', awesomeListAllowed([{ dest: 'x', ts: NOW - 200 * DAY, status: 'rejected' }], 'x', NOW).allowed === false);
ok('rejected dest allowed when invited', awesomeListAllowed([{ dest: 'x', ts: NOW - 200 * DAY, status: 'rejected' }], 'x', NOW, { invited: true }).allowed === true);

// 4. channel ranking by CPA_q, compounding tiebreak
const ranked = rankChannels([
  { name: 'ads', qualified: 10, cost: 500, compounding: false },      // cpa 50
  { name: 'mcp-registry', qualified: 100, cost: 100, compounding: true }, // cpa 1
  { name: 'reddit', qualified: 50, cost: 50, compounding: false },    // cpa 1
]);
ok('lowest CPA_q + compounding ranks first', ranked[0].name === 'mcp-registry');
ok('worst channel ranks last', ranked[ranked.length - 1].name === 'ads');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
