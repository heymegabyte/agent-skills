#!/usr/bin/env node
/**
 * Semantic AST Prompt Cache Warmer
 * Pre-computes and structures repository symbol tables and interfaces into cache-friendly chunks for frontier LLMs.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface CachedSymbolBlock {
  filePath: string;
  interfaces: string[];
  exportedFunctions: string[];
  exportedConstants: string[];
  contentDigest: string;
}

export function extractSymbolsFromSource(source: string, filePath: string): CachedSymbolBlock {
  const interfaces: string[] = [];
  const exportedFunctions: string[] = [];
  const exportedConstants: string[] = [];

  const interfaceRegex = /export\s+interface\s+([A-Za-z0-9_]+)/g;
  let match: RegExpExecArray | null;
  while ((match = interfaceRegex.exec(source)) !== null) {
    interfaces.push(match[1]);
  }

  const funcRegex = /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g;
  while ((match = funcRegex.exec(source)) !== null) {
    exportedFunctions.push(match[1]);
  }

  const constRegex = /export\s+const\s+([A-Za-z0-9_]+)/g;
  while ((match = constRegex.exec(source)) !== null) {
    exportedConstants.push(match[1]);
  }

  return {
    filePath,
    interfaces,
    exportedFunctions,
    exportedConstants,
    contentDigest: `${source.length}:${interfaces.length + exportedFunctions.length + exportedConstants.length}`,
  };
}

export function generatePromptCachePayload(files: { path: string; content: string }[]): string {
  const blocks = files.map((f) => extractSymbolsFromSource(f.content, f.path));
  const payloadLines: string[] = [
    `<!-- CACHE_BLOCK_START: AST_SYMBOL_INDEX -->`,
    `// Pre-indexed repository symbols for fast cached lookups`,
  ];

  for (const block of blocks) {
    payloadLines.push(`// File: ${block.filePath}`);
    if (block.interfaces.length > 0) payloadLines.push(`  interfaces: ${block.interfaces.join(", ")}`);
    if (block.exportedFunctions.length > 0) payloadLines.push(`  functions: ${block.exportedFunctions.join(", ")}`);
    if (block.exportedConstants.length > 0) payloadLines.push(`  constants: ${block.exportedConstants.join(", ")}`);
  }

  payloadLines.push(`<!-- CACHE_BLOCK_END: AST_SYMBOL_INDEX -->`);
  return payloadLines.join("\n");
}

if (process.argv[1]?.endsWith("ast-cache-warmer.ts")) {
  console.log("AST Cache Warmer ready.");
}
