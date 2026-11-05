#!/usr/bin/env node
/**
 * Upstream Template Drift Synchronizer
 * Diffs local project conventions against install.doctor, theme.tools, and template.projectsites.dev.
 */

export interface DriftCheckResult {
  hasDrift: boolean;
  driftItems: {
    category: "RULES" | "DEPENDENCIES" | "TOOLING" | "SCRIPTS";
    expected: string;
    actual: string;
    autoFixable: boolean;
  }[];
  summary: string;
}

export function detectConfigurationDrift(
  localConfig: { nodeVersion?: string; hasThemeTools?: boolean; hasLangfuseTimeout?: boolean },
  upstreamStandard: { minNodeVersion: string; requireThemeTools: boolean; requireLangfuseTimeout: boolean }
): DriftCheckResult {
  const drifts: DriftCheckResult["driftItems"] = [];

  if (localConfig.nodeVersion && parseInt(localConfig.nodeVersion, 10) < parseInt(upstreamStandard.minNodeVersion, 10)) {
    drifts.push({
      category: "TOOLING",
      expected: `>= ${upstreamStandard.minNodeVersion}`,
      actual: localConfig.nodeVersion,
      autoFixable: false,
    });
  }

  if (upstreamStandard.requireThemeTools && !localConfig.hasThemeTools) {
    drifts.push({
      category: "DEPENDENCIES",
      expected: "@theme.tools canonical packages registered",
      actual: "missing @theme.tools references",
      autoFixable: true,
    });
  }

  if (upstreamStandard.requireLangfuseTimeout && !localConfig.hasLangfuseTimeout) {
    drifts.push({
      category: "RULES",
      expected: "Langfuse 2500ms timeout circuit breaker active",
      actual: "unbounded telemetry call",
      autoFixable: true,
    });
  }

  const hasDrift = drifts.length > 0;
  return {
    hasDrift,
    driftItems: drifts,
    summary: hasDrift
      ? `Detected ${drifts.length} upstream drift items needing synchronization.`
      : "Workspace is 100% in sync with upstream platform standards.",
  };
}

if (process.argv[1]?.endsWith("upstream-drift-sync.ts")) {
  console.log("Upstream Drift Sync ready.");
}
