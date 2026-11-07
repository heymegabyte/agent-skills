#!/usr/bin/env node
/** Local-only multimodal prompt intake gateway. Raw payloads never leave this process. */
import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { appendFile, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const host = process.env.PROMPT_INTAKE_HOST || '127.0.0.1';
const port = Number(process.env.PROMPT_INTAKE_PORT || 4319);
const inbox = process.env.PROMPT_INTAKE_FILE || join(homedir(), '.agentskills/.agent/prompt-inbox.ndjson');
const maxBytes = Number(process.env.PROMPT_INTAKE_MAX_BYTES || 1_000_000);
const patterns = [
  /\b(?:sk|pk|rk|ghp|github_pat|xox[baprs]|AKIA|AIza)[-_A-Za-z0-9]{16,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*[^\s]{12,}/i,
];
const hash = (value) => createHash('sha256').update(value).digest('hex');

createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') return void res.end(JSON.stringify({ok:true}));
  if (req.method !== 'POST' || req.url !== '/v1/intake') { res.statusCode = 404; return void res.end(); }
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > maxBytes) { res.statusCode = 413; return void res.end(); }
  }
  try {
    const input = JSON.parse(body);
    const content = String(input.content || '');
    const secret = patterns.some((pattern) => pattern.test(content));
    const looksActionable = /\b(?:build|fix|implement|change|create|research|investigate|deploy)\b/i.test(content);
    const decision = secret ? 'discard-secret' : looksActionable ? 'action' : content.trim() ? 'note' : 'discard-empty';
    const record = {
      id: randomUUID(), ts: new Date().toISOString(), state: secret ? 'discarded' : 'classified', decision,
      source: input.source || 'unknown', app: input.app || null, modality: input.modality || 'text',
      content_sha256: hash(content), consent_id: input.consent_id || null,
      content: secret || !content.trim() ? null : content,
    };
    await mkdir(dirname(inbox), {recursive:true,mode:0o700});
    await appendFile(inbox, `${JSON.stringify(record)}\n`, {mode:0o600});
    res.setHeader('content-type','application/json');
    res.end(JSON.stringify({id:record.id,decision,stored_content:Boolean(record.content)}));
  } catch (error) {
    res.statusCode = 400;
    res.end(JSON.stringify({error:'invalid_request'}));
  }
}).listen(port, host, () => console.error(`prompt-intake listening on http://${host}:${port}`));
