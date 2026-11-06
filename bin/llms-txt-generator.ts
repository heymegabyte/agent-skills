#!/usr/bin/env node
/**
 * @file llms-txt-generator.ts
 * @brief Automated Generator for `llms.txt` and `llms-full.txt` per Answer.AI Specification.
 *
 * Scans documentation trees, markdown guides, and routes to construct clean,
 * machine-readable roadmaps for LLMs and autonomous coding agents.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface LlmsDocEntry {
  title: string;
  path: string;
  description: string;
  category: string;
  content?: string;
}

export interface LlmsTxtManifest {
  projectName: string;
  summary: string;
  sections: Record<string, LlmsDocEntry[]>;
}

export function scanDocs(rootDir: string): LlmsDocEntry[] {
  const docs: LlmsDocEntry[] = [];

  function walk(dir: string) {
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist') continue;
      const full = path.join(dir, entry);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(full);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        walk(full);
      } else if (stat.isFile() && (entry.endsWith('.md') || entry.endsWith('.mdx'))) {
        try {
          const content = fs.readFileSync(full, 'utf8');
          const lines = content.split('\n');

          // Extract title from H1 or frontmatter
          let title = entry.replace(/\.mdx?$/, '');
          const h1Line = lines.find((l) => l.startsWith('# '));
          if (h1Line) {
            title = h1Line.replace(/^#\s+/, '').trim();
          }

          // Extract description from frontmatter or first paragraph
          let description = 'Technical documentation and system reference.';
          const descMatch = content.match(/description:\s*["']?([^"'\n]+)["']?/i);
          if (descMatch) {
            description = descMatch[1].trim();
          } else {
            const firstPara = lines.find((l) => l.trim().length > 20 && !l.startsWith('#') && !l.startsWith('---'));
            if (firstPara) {
              description = firstPara.trim().slice(0, 120);
            }
          }

          const relativePath = path.relative(rootDir, full);
          const category = path.dirname(relativePath) === '.' ? 'Core Guides' : path.dirname(relativePath);

          docs.push({
            title,
            path: `/${relativePath}`,
            description,
            category,
            content,
          });
        } catch {
          // ignore unreadable
        }
      }
    }
  }

  walk(rootDir);
  return docs;
}

export function generateLlmsTxt(manifest: LlmsTxtManifest): string {
  const lines: string[] = [];
  lines.push(`# ${manifest.projectName}`);
  lines.push(`> ${manifest.summary}\n`);

  for (const [sectionName, entries] of Object.entries(manifest.sections)) {
    lines.push(`## ${sectionName}`);
    for (const e of entries) {
      lines.push(`- [${e.title}](${e.path}): ${e.description}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim() + '\n';
}

export function generateLlmsFullTxt(manifest: LlmsTxtManifest): string {
  const lines: string[] = [];
  lines.push(`# ${manifest.projectName} — Complete Documentation Bundle`);
  lines.push(`> ${manifest.summary}\n`);

  for (const [sectionName, entries] of Object.entries(manifest.sections)) {
    lines.push(`\n# Section: ${sectionName}\n`);
    for (const e of entries) {
      lines.push(`\n## Document: ${e.title} (${e.path})\n`);
      if (e.content) {
        lines.push(e.content);
      }
      lines.push('\n---\n');
    }
  }

  return lines.join('\n').trim() + '\n';
}

if (process.argv[1]?.endsWith('llms-txt-generator.ts') || import.meta.main) {
  const targetDir = process.argv[2] || process.cwd();
  console.log(`[LLMS-TXT] Scanning documentation in: ${targetDir}`);
  const docs = scanDocs(targetDir);

  const sections: Record<string, LlmsDocEntry[]> = {};
  for (const doc of docs.slice(0, 30)) {
    if (!sections[doc.category]) sections[doc.category] = [];
    sections[doc.category].push(doc);
  }

  const manifest: LlmsTxtManifest = {
    projectName: path.basename(targetDir),
    summary: 'Autonomous system architecture, APIs, and engineering operational guides.',
    sections,
  };

  const llmsTxt = generateLlmsTxt(manifest);
  console.log('--- Generated llms.txt Sample ---');
  console.log(llmsTxt.slice(0, 400) + '...\n');
  console.log(`[LLMS-TXT] Successfully cataloged ${docs.length} documentation assets.`);
}
