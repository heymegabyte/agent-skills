#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const failures = [];

const requireText = (name, body, pattern, expectation) => {
  if (!pattern.test(body)) failures.push(`${name}: ${expectation}`);
};

const policy = read('rules/agent-provider-policy.md');
requireText('provider policy', policy, /Gemini[\s\S]{0,160}Claude[\s\S]{0,160}(OpenAI|Codex)/i, 'must bind Gemini, Claude, and OpenAI/Codex');
requireText('provider policy', policy, /(every|any|all) (other )?premium (AI )?(model )?(service|provider|harness)/i, 'must bind every other premium model service');
requireText('provider policy', policy, /can (complete|perform|execute)[\s\S]{0,80}effectively/i, 'must use an effectiveness-based offload boundary');
requireText('provider policy', policy, /LiteLLM[\s\S]{0,160}DeepSeek[\s\S]{0,160}(local )?Ollama/i, 'must route DeepSeek and local Ollama through LiteLLM');
requireText('provider policy', policy, /every OpenCode delegation[\s\S]{0,160}(assess|consider)[\s\S]{0,100}(swarm|fan-out|parallel)/i, 'must assess swarm fan-out for every OpenCode delegation');

const entrypoints = ['AGENTS.md', 'CLAUDE.md', 'CODEX.md', 'GEMINI.md'];
for (const path of entrypoints) {
  const body = read(path);
  requireText(path, body, /OpenCode/i, 'must activate OpenCode delegation');
  requireText(path, body, /(DeepSeek|Ollama)/i, 'must name a gateway-backed throughput route');
  requireText(path, body, /(effectively|acceptance criteria|capable)/i, 'must use a capability/effectiveness boundary');
  requireText(path, body, /(swarm|fan-out|parallel)/i, 'must require swarm assessment');
}

const routing = read('rules/model-routing.md');
if (/OpenCode harness\s*[—-]\s*direct DeepSeek by default/i.test(routing)) {
  failures.push('model routing: still declares direct DeepSeek as the OpenCode default');
}

for (const path of ['bin/gen-opencode-harness.mjs', 'bin/opencode-task.sh']) {
  const body = read(path);
  if (/['"]deepseek\/deepseek-v4-(?:pro|flash)['"]/.test(body)) {
    failures.push(`${path}: still hardcodes a direct DeepSeek execution route`);
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `✗ ${failure}`).join('\n'));
  process.exit(1);
}

console.log(`✓ premium OpenCode offload policy validated across ${entrypoints.length} harness entrypoints`);
