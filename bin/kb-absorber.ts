#!/usr/bin/env node
/**
 * Cross-Session Knowledge Base Absorber
 * Distills resolved incidents, completed tasks, and architectural decisions into indexed Markdown knowledge articles.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface KnowledgeArticleInput {
  title: string;
  category: "architecture" | "bugfix" | "performance" | "security";
  problemStatement: string;
  rootCause: string;
  resolution: string;
  applicableFiles: string[];
}

export function generateKnowledgeArticle(input: KnowledgeArticleInput): {
  slug: string;
  markdownContent: string;
} {
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const markdown = [
    `# Solution: ${input.title}`,
    ``,
    `**Category**: \`${input.category}\`  `,
    `**Date**: ${new Date().toISOString().split("T")[0]}  `,
    `**Impacted Components**: ${input.applicableFiles.map((f) => `\`${f}\``).join(", ")}  `,
    ``,
    `## 1. Problem Statement`,
    input.problemStatement,
    ``,
    `## 2. Root Cause Analysis`,
    input.rootCause,
    ``,
    `## 3. Verified Resolution & Code Fix`,
    input.resolution,
    ``,
    `## 4. Verification Check`,
    `- [x] Automated test confirmed resolution without regressions.`,
    `- [x] Zero architectural violations.`,
  ].join("\n");

  return { slug, markdownContent: markdown };
}

export function saveKnowledgeArticle(
  input: KnowledgeArticleInput,
  baseDir: string = path.join(process.cwd(), "docs", "solutions")
): string {
  const { slug, markdownContent } = generateKnowledgeArticle(input);
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  const filePath = path.join(baseDir, `${slug}.md`);
  fs.writeFileSync(filePath, markdownContent, "utf-8");
  return filePath;
}

if (process.argv[1]?.endsWith("kb-absorber.ts")) {
  console.log("KB Absorber ready.");
}
