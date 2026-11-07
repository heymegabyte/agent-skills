#!/usr/bin/env node
/**
 * DeepSeek/OpenCode capability control plane.
 *
 * Commands:
 *   models [--refresh]          live discovery with a last-known-good cache
 *   route --task TEXT [flags]   choose model/protocol/effort from capabilities
 *   classify --status N         stable error/retry/failover decision
 *
 * Never prints or persists credentials. The model cache contains public metadata only.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';

const API = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const CACHE = process.env.DEEPSEEK_MODEL_CACHE || join(homedir(), '.cache', 'emdash', 'deepseek-models.json');
const MAX_AGE_MS = Number(process.env.DEEPSEEK_MODEL_CACHE_MAX_AGE_MS || 86_400_000);

async function secret() {
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY;
  try {
    const auth = JSON.parse(await readFile(process.env.OPENCODE_AUTH_FILE || join(homedir(), '.local/share/opencode/auth.json'), 'utf8'));
    if (auth?.deepseek?.type === 'api' && auth.deepseek.key) return auth.deepseek.key;
  } catch {}
  return '';
}

async function readCache() {
  try {
    const data = JSON.parse(await readFile(CACHE, 'utf8'));
    if (!Array.isArray(data.models)) throw new Error('invalid model cache');
    return data;
  } catch { return null; }
}

async function writeCache(models) {
  await mkdir(dirname(CACHE), { recursive: true, mode: 0o700 });
  const tmp = `${CACHE}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify({ fetched_at: new Date().toISOString(), models }, null, 2)}\n`, { mode: 0o600 });
  await rename(tmp, CACHE);
}

async function discover(refresh = false) {
  const cached = await readCache();
  const age = cached ? Date.now() - Date.parse(cached.fetched_at) : Infinity;
  if (!refresh && cached && age < MAX_AGE_MS) return { ...cached, source: 'cache', stale: false };
  const key = await secret();
  if (key) {
    try {
      const response = await fetch(`${API}/models`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw Object.assign(new Error(`model discovery returned ${response.status}`), { status: response.status });
      const body = await response.json();
      await writeCache(body.data);
      return { fetched_at: new Date().toISOString(), models: body.data, source: 'live', stale: false };
    } catch (error) {
      if (!cached) throw error;
    }
  }
  if (cached) return { ...cached, source: 'stale-cache', stale: true };
  throw new Error('DeepSeek model discovery unavailable: synchronize OpenCode auth or set DEEPSEEK_API_KEY');
}

function classify(status) {
  const table = {
    400: ['invalid_request', false, false], 401: ['authentication', false, false],
    402: ['insufficient_balance', false, false], 404: ['not_found', false, false],
    422: ['invalid_parameters', false, false], 429: ['rate_limited', true, true],
    500: ['provider_fault', true, true], 503: ['provider_overloaded', true, true],
  };
  const [category, retryable, failover] = table[status] || (status >= 500 ? ['provider_fault', true, true] : ['unknown', false, false]);
  return { status, category, retryable, failover, retry: retryable ? { max_attempts: 4, base_delay_ms: 750, max_delay_ms: 12_000, jitter: true } : null };
}

function route(task, flags, models) {
  const text = task.toLowerCase();
  const needsImage = flags.image || /image|screenshot|vision|diagram|photo/.test(text);
  const needsSearch = flags.search || /research|current|latest|web search|browse/.test(text);
  const needsPatch = flags.patch || /implement|edit|patch|refactor|fix|migrate/.test(text);
  const highRisk = flags.highRisk || /security|architecture|auth|payment|migration|incident|firewall|crypt/.test(text);
  const trivial = /format|rename|typo|lint|summarize|changelog|lookup/.test(text) && !highRisk;
  const byId = new Map(models.map((model) => [model.id, model]));
  let model = needsImage ? byId.get('deepseek-flash') : byId.get(highRisk ? 'deepseek-v4-pro' : 'deepseek-flash');
  model ||= byId.get('deepseek-v4-pro') || models[0];
  if (!model) throw new Error('no DeepSeek models discovered');
  if (needsImage && !model.input_modalities?.includes('image')) throw new Error('no discovered DeepSeek model supports image input');
  const protocol = (needsSearch || needsPatch) ? 'responses' : flags.dynamicSystem ? 'anthropic' : 'chat-completions';
  const supported = model.effort?.supported_levels || ['low', 'high', 'max'];
  const wanted = highRisk ? 'max' : trivial ? 'low' : 'high';
  const effort = supported.includes(wanted) ? wanted : model.effort?.default_level || supported[0];
  return {
    model: `${process.env.OPENCODE_DEEPSEEK_RAIL === 'direct' ? 'deepseek' : 'litellm'}/${model.id}`, wire_model: model.id, protocol, reasoning_effort: effort,
    system_prompt_update: model.api_capabilities?.anthropic_messages?.system_prompt_update || 'leading-only',
    context_window: model.context_window, max_output_tokens: model.max_output_tokens,
    reasons: { needs_image: needsImage, needs_search: needsSearch, needs_patch: needsPatch, high_risk: highRisk, trivial },
  };
}

const command = process.argv[2] || 'models';
const { values } = parseArgs({ args: process.argv.slice(3), options: {
  refresh: { type: 'boolean' }, task: { type: 'string' }, status: { type: 'string' },
  image: { type: 'boolean' }, search: { type: 'boolean' }, patch: { type: 'boolean' },
  'dynamic-system': { type: 'boolean' }, 'high-risk': { type: 'boolean' },
}, strict: true });

try {
  if (command === 'classify') console.log(JSON.stringify(classify(Number(values.status || 0))));
  else {
    const catalog = await discover(Boolean(values.refresh));
    if (command === 'models') console.log(JSON.stringify(catalog, null, 2));
    else if (command === 'route') console.log(JSON.stringify(route(values.task || '', {
      image: values.image, search: values.search, patch: values.patch,
      dynamicSystem: values['dynamic-system'], highRisk: values['high-risk'],
    }, catalog.models), null, 2));
    else throw new Error(`unknown command: ${command}`);
  }
} catch (error) {
  console.error(`deepseek-control-plane: ${error.message}`);
  process.exitCode = 1;
}
