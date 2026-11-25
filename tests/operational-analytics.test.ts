import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyticsDoctor, evaluateSloIncident, inspectAnalyticsConfiguration } from "../bin/operational-analytics.ts";

describe("operational analytics integration", () => {
  it("reports absent credentials as UNVERIFIED without placeholders", () => {
    const report = analyticsDoctor({});
    assert.equal(report.status, "UNVERIFIED");
    assert.equal(JSON.stringify(report).includes("changeme"), false);
    assert.equal(report.checks.every((check) => check.status === "UNVERIFIED"), true);
  });

  it("discovers approved configuration without returning secret values", () => {
    const configs = inspectAnalyticsConfiguration({ SENTRY_DSN: "secret-dsn" });
    assert.equal(configs.find((item) => item.destination === "sentry")?.configured, true);
    assert.equal(JSON.stringify(configs).includes("secret-dsn"), false);
  });

  it("opens one incident and updates rather than duplicates subsequent repair work", () => {
    const policy = { sloId: "queue-latency", target: 0.99, fastBurnThreshold: 14, slowBurnThreshold: 6 };
    const observations = [{ good: 70, total: 100, window: "fast" as const }];
    const first = evaluateSloIncident(policy, observations);
    assert.equal(first.paperclipAction, "create");
    const repeated = evaluateSloIncident(policy, observations, new Set([first.incidentKey!]));
    assert.equal(repeated.paperclipAction, "update");
    assert.equal(repeated.incidentKey, first.incidentKey);
  });
});
