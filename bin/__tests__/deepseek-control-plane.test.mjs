import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('../..', import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), 'deepseek-plane-'));
const cache = join(dir, 'models.json');
writeFileSync(cache, JSON.stringify({ fetched_at: new Date().toISOString(), models: [
  { id:'deepseek-flash', input_modalities:['text','image'], context_window:100, max_output_tokens:50, effort:{supported_levels:['low','high','max'],default_level:'high'}, api_capabilities:{anthropic_messages:{system_prompt_update:'in-history'}} },
  { id:'deepseek-v4-pro', input_modalities:['text'], context_window:100, max_output_tokens:50, effort:{supported_levels:['low','high','max'],default_level:'high'}, api_capabilities:{anthropic_messages:{system_prompt_update:'leading-only'}} },
] }));
const run = (...args) => JSON.parse(execFileSync('node', [join(root, 'bin/deepseek-control-plane.mjs'), ...args], { encoding:'utf8', env:{...process.env,DEEPSEEK_MODEL_CACHE:cache} }));
assert.equal(run('route','--task','analyze this screenshot').wire_model, 'deepseek-flash');
assert.equal(run('route','--task','write parser tests').model, 'litellm/deepseek-flash');
assert.equal(run('route','--task','security architecture review').reasoning_effort, 'max');
assert.equal(run('route','--task','fix the parser').protocol, 'responses');
assert.equal(run('classify','--status','401').retryable, false);
assert.equal(run('classify','--status','503').failover, true);
console.log('deepseek-control-plane tests passed');
