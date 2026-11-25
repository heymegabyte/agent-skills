import { createHash } from "node:crypto";

export const CANONICAL_ANALYTICS_OWNER = "@theme.tools/telemetry/operational-analytics-contract" as const;
export type AnalyticsHealth = "PASS" | "FAIL" | "BLOCKED" | "SKIP" | "UNVERIFIED";
export type AnalyticsDestination = "sentry" | "posthog" | "ga4" | "gtm" | "langfuse";

export interface AnalyticsDestinationConfiguration {
  readonly destination: AnalyticsDestination;
  readonly configured: boolean;
  readonly credentialSource?: string;
  readonly retentionDays: number;
  readonly sampleRate: number;
  readonly browser: boolean;
}

const CREDENTIAL_ENV: Readonly<Record<AnalyticsDestination, readonly string[]>> = {
  sentry: ["SENTRY_DSN"], posthog: ["POSTHOG_PROJECT_API_KEY", "POSTHOG_KEY"],
  ga4: ["GA_MEASUREMENT_ID"], gtm: ["GTM_CONTAINER_ID"], langfuse: ["LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY"],
};

export function inspectAnalyticsConfiguration(env: NodeJS.ProcessEnv): readonly AnalyticsDestinationConfiguration[] {
  return (Object.keys(CREDENTIAL_ENV) as AnalyticsDestination[]).map((destination) => {
    const configured = CREDENTIAL_ENV[destination].some((key) => Boolean(env[key]?.trim()));
    return {
      destination, configured,
      credentialSource: configured ? "environment-or-approved-secret-provider" : undefined,
      retentionDays: destination === "sentry" || destination === "langfuse" ? 30 : 90,
      sampleRate: destination === "sentry" ? 0.2 : 1,
      browser: destination === "posthog" || destination === "ga4" || destination === "gtm",
    };
  });
}

export function analyticsDoctor(env: NodeJS.ProcessEnv): Readonly<{ status: AnalyticsHealth; checks: readonly Readonly<Record<string, unknown>>[] }> {
  const configurations = inspectAnalyticsConfiguration(env);
  const checks = configurations.map((config) => ({
    id: `analytics.${config.destination}.configuration`,
    status: config.configured ? "PASS" : "UNVERIFIED",
    configured: config.configured,
    credentialSource: config.credentialSource ?? "absent",
    retentionDays: config.retentionDays,
    sampleRate: config.sampleRate,
    privacy: config.browser ? "consent-required" : "redaction-required",
  }));
  return { status: checks.every((check) => check.status === "PASS") ? "PASS" : "UNVERIFIED", checks };
}

export interface FleetSloPolicy {
  readonly sloId: string;
  readonly target: number;
  readonly fastBurnThreshold: number;
  readonly slowBurnThreshold: number;
}
export interface SloObservation { readonly good: number; readonly total: number; readonly window: "fast" | "slow" }
export interface IncidentDirective {
  readonly status: "healthy" | "open" | "update";
  readonly incidentKey?: string;
  readonly commander?: "control-plane-incident-commander";
  readonly paperclipAction?: "create" | "update";
}

export function evaluateSloIncident(
  policy: FleetSloPolicy,
  observations: readonly SloObservation[],
  existingIncidentKeys: ReadonlySet<string> = new Set(),
): IncidentDirective {
  const errorBudget = 1 - policy.target;
  const breached = observations.some((observation) => {
    if (observation.total <= 0) return false;
    const burn = (1 - observation.good / observation.total) / errorBudget;
    return burn >= (observation.window === "fast" ? policy.fastBurnThreshold : policy.slowBurnThreshold);
  });
  if (!breached) return { status: "healthy" };
  const incidentKey = `slo:${policy.sloId}:${createHash("sha256").update(policy.sloId).digest("hex").slice(0, 12)}`;
  return { status: existingIncidentKeys.has(incidentKey) ? "update" : "open", incidentKey, commander: "control-plane-incident-commander", paperclipAction: existingIncidentKeys.has(incidentKey) ? "update" : "create" };
}
