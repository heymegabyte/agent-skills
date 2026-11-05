/**
 * format.ts — the response formatters shared by the server and the measurement CLI.
 *
 * Keeping formatting here lets `measure.ts` produce exactly the bytes the server
 * would return, so the reported token budget is measured, not estimated.
 *
 * @module
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { IndexEntry } from './index-builder.js';
import { formatHits, searchEntries } from './search.js';

export const RULE_BODY_CAP = 4000;

/** `find_rule` result text for a topic. */
export function findRuleForMeasure(root: string, entries: readonly IndexEntry[], topic: string, limit = 3): string {
  const hits = searchEntries(entries, topic, { kind: 'rule', limit });
  if (hits.length === 0) return `No rule matches "${topic}".`;
  const blocks = hits.map((hit) => {
    let body = '';
    try {
      body = readFileSync(join(root, hit.entry.path), 'utf-8').replace(/^---[\s\S]*?\n---\n*/, '');
    } catch {
      body = hit.entry.summary;
    }
    const clipped =
      body.length > RULE_BODY_CAP
        ? `${body.slice(0, RULE_BODY_CAP)}\n\n…(truncated — load_skill({ name: "${hit.entry.name}" }) for the rest)`
        : body;
    return `## ${hit.entry.name}\npath: ${hit.entry.path}\n\n${clipped.trimEnd()}`;
  });
  return `${hits.length} rule(s) for "${topic}":\n\n${blocks.join('\n\n---\n\n')}`;
}

/** `load_skill` result text for an exact entry name (full body, no sections). */
export function loadSkillForMeasure(root: string, entries: readonly IndexEntry[], name: string): string {
  const entry = entries.find((e) => e.name === name);
  if (!entry) return `No entry named "${name}".`;
  let content = readFileSync(join(root, entry.path), 'utf-8').replace(/^---[\s\S]*?\n---\n*/, '');
  return `# ${entry.name} (${entry.kind})\npath: ${entry.path}\n\n${content}`;
}

export { formatHits, searchEntries };
