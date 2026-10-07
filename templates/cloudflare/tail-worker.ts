export interface TailEventSummary {
  project?: string;
  skill?: string;
  agent?: string;
  run_id?: string;
  phase?: string;
  trace_id?: string;
  model_route?: string;
  duration_ms?: number;
  cost?: number;
  result?: string;
  rollback_id?: string;
}

export default {
  async tail(events: TraceItem[], env: Env): Promise<void> {
    for (const event of events) {
      // Extract only approved structured metadata. Never forward headers,
      // cookies, secrets, full prompts, or raw customer payloads.
      const summary: TailEventSummary = extractApprovedSummary(event);
      await env.TELEMETRY.writeDataPoint({
        blobs: [
          summary.project ?? "",
          summary.skill ?? "",
          summary.agent ?? "",
          summary.run_id ?? "",
          summary.phase ?? "",
          summary.trace_id ?? "",
          summary.model_route ?? "",
          summary.result ?? "",
          summary.rollback_id ?? ""
        ],
        doubles: [summary.duration_ms ?? 0, summary.cost ?? 0],
        indexes: [summary.project ?? "unknown"]
      });
    }
  }
};

function extractApprovedSummary(event: TraceItem): TailEventSummary {
  // Project code should map its own structured log fields here.
  // Keep this intentionally conservative: unknown/raw payloads are dropped.
  const logs = (event as any).logs ?? [];
  const structured = logs.find((x: any) => x?.message?.[0]?.agent_telemetry)?.message?.[0]?.agent_telemetry ?? {};
  return {
    project: structured.project,
    skill: structured.skill,
    agent: structured.agent,
    run_id: structured.run_id,
    phase: structured.phase,
    trace_id: structured.trace_id,
    model_route: structured.model_route,
    duration_ms: Number(structured.duration_ms || 0),
    cost: Number(structured.cost || 0),
    result: structured.result,
    rollback_id: structured.rollback_id
  };
}
