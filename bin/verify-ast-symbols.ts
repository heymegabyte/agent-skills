#!/usr/bin/env node
/**
 * verify-ast-symbols.ts
 * Anti-Hallucination Symbol Verification Gate.
 * Scans TypeScript / JavaScript import statements and checks target files
 * to ensure that imported functions, types, and constants actually exist in the target exports.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

export interface SymbolCheckResult {
  sourceFile: string;
  targetModule: string;
  symbol: string;
  found: boolean;
  error?: string;
}

export function verifyImportedSymbols(sourceFilePath: string): SymbolCheckResult[] {
  if (!existsSync(sourceFilePath)) {
    throw new Error(`Source file does not exist: ${sourceFilePath}`);
  }

  const content = readFileSync(sourceFilePath, 'utf8');
  const sourceDir = dirname(sourceFilePath);
  const results: SymbolCheckResult[] = [];

  // Match: import { A, B as C } from './target.ts';
  const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(content)) !== null) {
    const rawSymbols = match[1];
    const moduleSpecifier = match[2];

    // Only verify relative file imports
    if (!moduleSpecifier.startsWith('.')) continue;

    let targetPath = resolve(sourceDir, moduleSpecifier);
    if (!existsSync(targetPath)) {
      if (existsSync(`${targetPath}.ts`)) targetPath = `${targetPath}.ts`;
      else if (existsSync(`${targetPath}.js`)) targetPath = `${targetPath}.js`;
      else if (existsSync(resolve(targetPath, 'index.ts'))) targetPath = resolve(targetPath, 'index.ts');
    }

    if (!existsSync(targetPath)) {
      results.push({
        sourceFile: sourceFilePath,
        targetModule: moduleSpecifier,
        symbol: '*',
        found: false,
        error: `Target module file not found: ${targetPath}`
      });
      continue;
    }

    const targetContent = readFileSync(targetPath, 'utf8');
    const symbols = rawSymbols.split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);

    for (const sym of symbols) {
      // Check if target file contains export ... sym
      const exportRegex = new RegExp(`export\\s+(const|let|var|function|class|interface|type|enum)\\s+${sym}\\b|export\\s+\\{[^}]*\\b${sym}\\b[^}]*\\}`, 'm');
      const found = exportRegex.test(targetContent);

      results.push({
        sourceFile: sourceFilePath,
        targetModule: moduleSpecifier,
        symbol: sym,
        found,
        error: found ? undefined : `Symbol '${sym}' is not exported by ${moduleSpecifier}`
      });
    }
  }

  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- AST Symbol Verification Gate Test ---');
  const selfPath = resolve(process.cwd(), 'bin', 'verify-ast-symbols.ts');
  const testPath = resolve(process.cwd(), 'tests', 'paramilitary-fleet.test.ts');

  if (existsSync(testPath)) {
    const check = verifyImportedSymbols(testPath);
    console.log(`Audited: ${testPath}`);
    console.log(`Total Relative Imports Checked: ${check.length}`);
    check.forEach(c => {
      const sym = c.found ? '✓' : '✗';
      console.log(`  ${sym} [${c.symbol}] from ${c.targetModule} ${c.error ? `(${c.error})` : ''}`);
    });
  } else {
    console.log('Test file not found for self-test');
  }
}
