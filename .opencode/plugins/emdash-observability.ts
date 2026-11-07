// Privacy-minimal OpenCode lifecycle telemetry for Langfuse Cloud via OTLP/HTTP.
// No prompt, tool arguments, file contents, stdout or secrets are captured.
import type { Plugin } from "@opencode-ai/plugin"
import { randomBytes } from "node:crypto"

const hex = (n: number) => randomBytes(n).toString("hex")
const endpoint = () => `${(process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com").replace(/\/$/, "")}/api/public/otel/v1/traces`
const auth = () => process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY
  ? `Basic ${Buffer.from(`${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`).toString("base64")}` : ""

async function span(name: string, attributes: Record<string,string> = {}) {
  if (!auth()) return
  const now = BigInt(Date.now()) * 1_000_000n
  const payload = {resourceSpans:[{resource:{attributes:[
    {key:"service.name",value:{stringValue:"opencode-agent-skills"}},
    {key:"langfuse.environment",value:{stringValue:process.env.LANGFUSE_TRACING_ENVIRONMENT || "development"}},
  ]},scopeSpans:[{scope:{name:"emdash-opencode",version:"1"},spans:[{
    traceId:hex(16),spanId:hex(8),name,kind:1,startTimeUnixNano:String(now),endTimeUnixNano:String(now+1n),
    attributes:Object.entries(attributes).map(([key,value])=>({key,value:{stringValue:String(value)}})),status:{code:1},
  }]}]}]}
  await fetch(endpoint(), {method:"POST",headers:{"content-type":"application/json","authorization":auth(),"x-langfuse-ingestion-version":"4"},body:JSON.stringify(payload)}).catch(()=>{})
}

export const EmdashObservability: Plugin = async ({ directory, worktree }) => ({
  event: async ({ event }) => {
    const type = String((event as any)?.type || "unknown")
    if (/session\.(created|idle|error)|permission\.|tool\.execute/.test(type))
      await span(`opencode.${type}`, {directory,worktree,event_type:type,model:process.env.OPENCODE_MODEL || "dynamic",effort:process.env.OPENCODE_DEEPSEEK_EFFORT || "dynamic"})
  },
})
