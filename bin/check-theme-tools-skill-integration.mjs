#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const contractMarker = "Theme.tools ecosystem contract (required)";
const mapping = JSON.parse(readFileSync(join(root, "config/theme-tools-skill-map.json"), "utf8"));
const failures = [];

if (mapping.version !== 1 || mapping.defaultContract !== "rules/theme-tools-skill-integration.md" || !mapping.skills || Array.isArray(mapping.skills)) {
  failures.push("config/theme-tools-skill-map.json: does not satisfy the required top-level schema contract");
}

const numbered = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d{2}-/.test(entry.name) && existsSync(join(root, entry.name, "SKILL.md")))
  .map((entry) => ({ id: entry.name, file: join(root, entry.name, "SKILL.md") }));

const canonical = [...numbered, { id: "openclaw-integration", file: join(root, "openclaw-integration/SKILL.md") }];
for (const skill of canonical) {
  const body = readFileSync(skill.file, "utf8");
  if (!body.includes(contractMarker)) failures.push(`${skill.id}: missing required ecosystem contract reference`);
  const route = mapping.skills[skill.id];
  if (!route) failures.push(`${skill.id}: missing config/theme-tools-skill-map.json entry`);
  if (!route?.packages?.some((value) => value.startsWith("@theme.tools/") || value.startsWith("@theme-tools/"))) {
    failures.push(`${skill.id}: package route is empty or noncanonical`);
  }
  if (!route?.consumerOwns?.length || !route?.contributeWhen?.length) failures.push(`${skill.id}: thin-consumer or contribution mapping is empty`);
  for (const field of ["packages", "consumerOwns", "contributeWhen"]) {
    if (!Array.isArray(route?.[field]) || route[field].some((value) => typeof value !== "string" || value.trim() === "")) {
      failures.push(`${skill.id}: ${field} must be a non-empty string array`);
    }
  }
}

const providerTemplate = readFileSync(join(root, "forge-templates/SKILL.md.tpl"), "utf8");
if (!providerTemplate.includes(contractMarker)) failures.push("forge-templates/SKILL.md.tpl: generated provider skills do not inherit contract");
if (!mapping.skills["provider-api-skill"]) failures.push("provider-api-skill: missing generated-skill mapping");

const stalePolicyFiles = [
  "13-observability-and-growth/SKILL.md",
  "_kernel/standards.md",
  "rules/observability-ops-supervisor.md",
  "rules/website-build-manifest.md",
  "13-observability-and-growth/workers-tracing-otlp.md",
];
const stalePatterns = [
  /solo(?: tier|\)|:)?.{0,35}PostHog \+ Workers Tracing(?!.*Sentry)/i,
  /Sentry \(Tier 2\)/i,
  /New projects can go PostHog-only/i,
];
for (const relative of stalePolicyFiles) {
  const body = readFileSync(join(root, relative), "utf8");
  for (const pattern of stalePatterns) if (pattern.test(body)) failures.push(`${relative}: stale observability policy matches ${pattern}`);
}

const contract = readFileSync(join(root, "rules/theme-tools-skill-integration.md"), "utf8");
for (const term of ["@theme.tools/telemetry", "Sentry", "PostHog", "GA4", "GTM", "Langfuse", "ui.theme.tools", "thin configuration", "explicit approval of the current Figma artifact", "Without current Figma approval", "record the visual layer as blocked"]) {
  if (!contract.includes(term)) failures.push(`shared contract: missing ${term}`);
}

if (failures.length) {
  console.error(failures.map((failure) => `FAIL ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`PASS theme.tools skill integration: ${canonical.length} canonical skills + provider template`);
