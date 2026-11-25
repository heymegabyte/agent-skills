import type { AnalyticsHealth } from "./operational-analytics.ts";

/** Thin consumer projection; rendering remains owned by canonical theme.tools packages. */
export const THEME_TOOLS_CONTROL_PLANE_OWNER = "@theme.tools/agent-ui/control-plane-primitives" as const;

export interface ControlPlanePrimitiveProjection {
  readonly schemaVersion: "1.0.0";
  readonly correlationId: string;
  readonly observedAt: string;
  readonly state: "healthy" | "degraded" | "failed" | "unverified";
  readonly data: Readonly<Record<string, unknown>>;
}

export function projectDoctorResultToThemeTools(input: Readonly<{ status: AnalyticsHealth; integrityDigest: string; generatedAt: string }>): ControlPlanePrimitiveProjection {
  const states = { PASS: "healthy", FAIL: "failed", BLOCKED: "degraded", SKIP: "unverified", UNVERIFIED: "unverified" } as const;
  return { schemaVersion: "1.0.0", correlationId: input.integrityDigest, observedAt: input.generatedAt, state: states[input.status], data: { outcome: input.status, digest: input.integrityDigest } };
}
