#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";

const root = resolve(process.argv.find(x=>x.startsWith("--root="))?.slice(7) || ".");
const instance = process.argv.find(x=>x.startsWith("--instance="))?.slice(11) || "agent-skills";
const namespace = process.argv.find(x=>x.startsWith("--namespace="))?.slice(12) || "default";
const dry = !process.argv.includes("--apply");

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;
if (!accountId || !token) throw new Error("Missing Cloudflare account/token.");

const includeRoots = ["rules","commands"];
const explicit = ["CLAUDE.md","CONVENTIONS.md","README.md"];
const files=[];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p=join(dir,name);
    const st=statSync(p);
    if(st.isDirectory()) walk(p);
    else if(/\.md$/i.test(name)) files.push(p);
  }
}
for(const d of includeRoots) {
  const p=join(root,d);
  try { walk(p); } catch {}
}
for(const f of explicit) {
  const p=join(root,f);
  try { if(statSync(p).isFile()) files.push(p); } catch {}
}
for(const d of readdirSync(root).filter(x=>/^\d{2}-/.test(x))) {
  const p=join(root,d,"SKILL.md");
  try { if(statSync(p).isFile()) files.push(p); } catch {}
}

const unique=[...new Set(files)].sort();
if(dry) {
  console.log(JSON.stringify({mode:"dry-run",instance,namespace,count:unique.length,files:unique.map(x=>relative(root,x))},null,2));
  process.exit(0);
}

const endpoint=`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai-search/namespaces/${namespace}/instances/${instance}/items`;
let uploaded=0;
for(const path of unique) {
  const rel=relative(root,path);
  const body=new FormData();
  const content=readFileSync(path);
  body.append("file", new Blob([content], {type:"text/markdown"}), rel.replaceAll("/","__"));
  const res=await fetch(endpoint,{method:"POST",headers:{Authorization:`Bearer ${token}`},body});
  if(!res.ok) throw new Error(`Upload failed ${rel}: ${res.status} ${await res.text()}`);
  uploaded++;
}
console.log(JSON.stringify({mode:"apply",instance,namespace,uploaded},null,2));
