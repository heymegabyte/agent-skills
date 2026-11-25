import assert from "node:assert/strict";
import test from "node:test";
import { projectDoctorResultToThemeTools, THEME_TOOLS_CONTROL_PLANE_OWNER } from "../bin/theme-tools-control-plane-adapter.ts";

test("control plane consumes canonical theme.tools through a thin versioned projection", () => {
  assert.equal(THEME_TOOLS_CONTROL_PLANE_OWNER, "@theme.tools/agent-ui/control-plane-primitives");
  assert.deepEqual(projectDoctorResultToThemeTools({ status: "UNVERIFIED", integrityDigest: "sha256:test", generatedAt: "2026-11-23T00:00:00Z" }), {
    schemaVersion: "1.0.0", correlationId: "sha256:test", observedAt: "2026-11-23T00:00:00Z", state: "unverified", data: { outcome: "UNVERIFIED", digest: "sha256:test" },
  });
});
