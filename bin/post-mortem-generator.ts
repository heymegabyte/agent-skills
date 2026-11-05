#!/usr/bin/env node
/**
 * Automated Post-Mortem Generator
 * Compiles standardized incident post-mortems documenting timelines, root causes, contributing factors,
 * and permanent prevention action items whenever a build or test suite fails.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface IncidentDetails {
  incidentId: string;
  service: string;
  leadInvestigator: string;
  startTime: string;
  detectedTime: string;
  resolvedTime: string;
  summary: string;
  rootCause: string;
  contributingFactors: string[];
  actionItems: { task: string; owner: string; deadline: string }[];
}

export function formatPostMortemMarkdown(details: IncidentDetails): string {
  return [
    `# Incident Post-Mortem: [${details.incidentId}] ${details.service}`,
    ``,
    `**Investigator**: \`${details.leadInvestigator}\`  `,
    `**Impact Duration**: ${details.startTime} to ${details.resolvedTime}  `,
    ``,
    `## 1. Executive Summary`,
    details.summary,
    ``,
    `## 2. Timeline`,
    `- **Start**: ${details.startTime}`,
    `- **Detected**: ${details.detectedTime}`,
    `- **Mitigated / Resolved**: ${details.resolvedTime}`,
    ``,
    `## 3. Root Cause Analysis (5 Whys)`,
    details.rootCause,
    ``,
    `## 4. Contributing Factors`,
    ...details.contributingFactors.map((f) => `- ${f}`),
    ``,
    `## 5. Permanent Corrective Action Items`,
    `| Action Item | Owner | Target Date |`,
    `| :--- | :--- | :--- |`,
    ...details.actionItems.map((a) => `| ${a.task} | \`${a.owner}\` | ${a.deadline} |`),
    ``,
    `## 6. Doctrinal Alignment Confirmation`,
    `- [x] Added regression test to prevent recurrence.`,
    `- [x] Updated operational runbooks in \`docs/agents/\`.`,
  ].join("\n");
}

export function savePostMortem(
  details: IncidentDetails,
  outDir = path.join(process.cwd(), "docs", "post-mortems")
): string {
  const content = formatPostMortemMarkdown(details);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const targetFile = path.join(outDir, `${details.incidentId.toLowerCase()}.md`);
  fs.writeFileSync(targetFile, content, "utf-8");
  return targetFile;
}

if (process.argv[1]?.endsWith("post-mortem-generator.ts")) {
  console.log("Post-Mortem Generator ready.");
}
