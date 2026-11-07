#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
const run = (command,args=[]) => spawnSync(command,args,{encoding:'utf8',timeout:15_000});
const has = (command) => run('sh',['-lc',`command -v ${command}`]).status===0;
const bw = has('bw') ? run('bw',['status']) : null;
let bwStatus='missing'; try { bwStatus=JSON.parse(bw?.stdout||'{}').status||'unknown' } catch {}
const browse = has('browse') ? run('browse',['doctor','--json']) : null;
const checks={browse:has('browse')&&browse?.status===0,cua:has('cua-driver')||has('cua'),desktop_lock:has('flock')||process.platform==='darwin',bitwarden:has('bw'),bitwarden_unlocked:bwStatus==='unlocked',openclaw:has('openclaw'),paperclip:has('paperclip')||has('paperclipai'),codex:has('codex'),claude:has('claude'),opencode:has('opencode'),gemini:has('gemini')};
console.log(JSON.stringify({desktop_ready:checks.browse&&checks.cua&&checks.desktop_lock,secret_broker_ready:checks.bitwarden_unlocked,checks},null,2));
process.exitCode=checks.browse&&checks.desktop_lock?0:1;
