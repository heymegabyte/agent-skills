/**
 * tools.ts — the 3 meta-tool definitions, each with a Zod input schema.
 *
 * Keeping the definitions in one module lets the validator, the server, and the
 * token-budget measurement share a single source of truth for what a client pays
 * to call the gateway.
 *
 * @module
 */
import { z } from 'zod';
import type { EntryKind } from './index-builder.js';

const SearchSkillsInputSchema = z
  .object({
    query: z
      .string()
      .min(1)
      .describe('What capability you need, in words. Example: "stripe payments" or "deploy to workers".'),
    kind: z
      .enum(['skill', 'rule', 'agent', 'command'])
      .optional()
      .describe('Restrict results to one entry kind. Omit to search all.'),
    max_results: z
      .number()
      .int()
      .min(1)
      .max(25)
      .optional()
      .describe('Maximum results to return (1-25). Defaults to 8.'),
  })
  .strict();

const LoadSkillInputSchema = z
  .object({
    name: z.string().min(1).describe('Exact entry name from a search_skills result.'),
    sections: z
      .array(z.string().min(1))
      .max(20)
      .optional()
      .describe('Return only these heading sections (case-insensitive). Omit for the full file.'),
  })
  .strict();

const FindRuleInputSchema = z
  .object({
    topic: z
      .string()
      .min(1)
      .describe('Topic or scenario that needs an authoritative rule. Example: "feature flags".'),
    max_results: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe('Maximum rules to return (1-10). Defaults to 3.'),
  })
  .strict();

export { SearchSkillsInputSchema, LoadSkillInputSchema, FindRuleInputSchema };

export type SearchSkillsInput = z.infer<typeof SearchSkillsInputSchema>;
export type LoadSkillInput = z.infer<typeof LoadSkillInputSchema>;
export type FindRuleInput = z.infer<typeof FindRuleInputSchema>;

export const TOOL_DEFINITIONS = [
  {
    name: 'search_skills',
    description:
      'Search every skill, rule, agent, and command by rank. Start here to discover what exists. Each hit shows a short summary and the exact name to pass to load_skill.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What capability you need, in words.' },
        kind: { type: 'string', enum: ['skill', 'rule', 'agent', 'command'], description: 'Restrict to one entry kind.' },
        max_results: { type: 'number', description: 'Maximum results (1-25, default 8).' },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'load_skill',
    description:
      'Load the full markdown of one skill, rule, or agent by exact name. Use the name returned by search_skills. Pass sections to load only the headings you need.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Exact entry name from search_skills.' },
        sections: { type: 'array', items: { type: 'string' }, description: 'Optional headings to return.' },
      },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'find_rule',
    description:
      'Return the authoritative rule text for a topic. Use this when you need to know the rule for X. Results include the rule body (truncated when long).',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic or scenario that needs a rule.' },
        max_results: { type: 'number', description: 'Maximum rules (1-10, default 3).' },
      },
      required: ['topic'],
      additionalProperties: false,
    },
  },
] as const;

export const TOOL_KINDS: readonly EntryKind[] = ['skill', 'rule', 'agent', 'command'];
