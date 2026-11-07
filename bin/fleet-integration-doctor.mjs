#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(new URL('..',import.meta.url).pathname);
const has = (cmd) => spawnSync('sh',['-lc',`command -v ${cmd}`],{encoding:'utf8'}).status===0;
const secret = (name) => spawnSync('get-secret',['--exists',name],{stdio:'ignore'}).status===0;
const config = JSON.parse(await readFile(resolve(root,'config/agent-fleet-routing.json'),'utf8'));
const checks = {config:Boolean(config.team?.frontier_judgment?.length && config.team?.throughput?.length),claude:has('claude'),codex:has('codex'),gemini:has('gemini'),opencode:has('opencode'),paperclip:has('paperclip'),openclaw:has('openclaw'),cua:has('cua'),openspec:has('openspec') || has('/Users/Apple/.local/share/npm/bin/openspec'),deepseek_secret:secret('DEEPSEEK_API_KEY'),langfuse:secret('LANGFUSE_PUBLIC_KEY')&&secret('LANGFUSE_SECRET_KEY')};
try { await access(resolve(root,'bin/opencode-task.sh'),constants.X_OK); checks.opencode_router=true } catch { checks.opencode_router=false }
console.log(JSON.stringify({ready:Object.entries(checks).filter(([k])=>!['cua','paperclip','openclaw'].includes(k)).every(([,v])=>v),optional_missing:Object.entries(checks).filter(([k,v])=>!v&&['cua','paperclip','openclaw'].includes(k)).map(([k])=>k),checks},null,2));
process.exitCode = checks.config && checks.opencode && checks.deepseek_secret ? 0 : 1;
