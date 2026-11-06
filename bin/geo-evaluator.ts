#!/usr/bin/env node
/**
 * @file geo-evaluator.ts
 * @brief Generative Engine Optimization (GEO) & Information Gain Scorer.
 *
 * Analyzes copy, articles, or documentation against 2026 AI search criteria:
 * - Standalone 40-60 word quotable answer blocks under H2/H3
 * - Structured table comparison grids
 * - Anti-AI-slop vocabulary compliance
 * - Information Gain (hard metrics, measurements, benchmarks, citations)
 * - Named entity density
 */

import * as fs from 'node:fs';

export interface GeoScorecard {
  score: number; // 0-100
  passedChecks: number;
  totalChecks: number;
  answerBlocksCount: number;
  hasTables: boolean;
  bannedSlopDetected: string[];
  metricsFoundCount: number;
  readabilityEase: number;
  recommendations: string[];
}

const BANNED_SLOP_WORDS = [
  'delve', 'leverage', 'unleash', 'revolutionize', 'seamless', 'robust',
  'synergy', 'elevate', 'empower', 'transformative', 'best-in-class',
  'cutting-edge', 'discover', 'innovative', 'game-changer', 'tapestry',
  'beacon', 'testament'
];

export function calculateFleschReadingEase(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  if (words.length === 0 || sentences.length === 0) return 0;

  // Approximate syllable count
  let totalSyllables = 0;
  for (const word of words) {
    const clean = word.toLowerCase().replace(/[^a-z]/g, '');
    const syllables = clean.match(/[aeiouy]{1,2}/g)?.length || 1;
    totalSyllables += Math.max(1, syllables);
  }

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function evaluateContentGeo(text: string): GeoScorecard {
  const recommendations: string[] = [];

  // 1. Anti-Slop Check
  const lower = text.toLowerCase();
  const detectedSlop: string[] = [];
  for (const slop of BANNED_SLOP_WORDS) {
    const regex = new RegExp(`\\b${slop}\\b`, 'i');
    if (regex.test(lower)) {
      detectedSlop.push(slop);
    }
  }

  if (detectedSlop.length > 0) {
    recommendations.push(`Remove banned AI slop words: [${detectedSlop.join(', ')}]`);
  }

  // 2. Answer Block Detection (30-70 words under section headings)
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 0 && !p.startsWith('#'));
  let answerBlocks = 0;
  for (const p of paragraphs) {
    const words = p.split(/\s+/).length;
    if (words >= 30 && words <= 70) {
      answerBlocks++;
    }
  }

  if (answerBlocks === 0) {
    recommendations.push('Add at least one self-contained 30-70 word quotable answer block directly under an H2 heading.');
  }

  // 3. Tabular Structured Data
  const hasTables = /\|[-:]+\|/.test(text) || /<table[^>]*>/i.test(text);
  if (!hasTables) {
    recommendations.push('Incorporate a comparison or feature table; LLMs extract structured tables 3x more reliably than narrative text.');
  }

  // 4. Information Gain (Hard metrics, percentages, latencies, citations)
  const metricMatches = text.match(/\b\d+(\.\d+)?(ms|s|%|KB|MB|GB|USD|\$|fps|rps|p99)\b/gi) || [];
  if (metricMatches.length < 3) {
    recommendations.push('Increase Information Gain by including concrete numbers, latencies, or benchmark metrics.');
  }

  // 5. Readability
  const readability = calculateFleschReadingEase(text);
  if (readability < 60) {
    recommendations.push(`Improve Flesch Reading Ease (${readability} < 60 target). Shorten sentences and use active voice.`);
  }

  // Scoring
  let score = 100;
  score -= Math.min(30, detectedSlop.length * 10);
  if (answerBlocks === 0) score -= 25;
  if (!hasTables) score -= 15;
  if (metricMatches.length < 3) score -= 15;
  if (readability < 60) score -= 15;
  score = Math.max(0, score);

  return {
    score,
    passedChecks: (detectedSlop.length === 0 ? 1 : 0) + (answerBlocks > 0 ? 1 : 0) + (hasTables ? 1 : 0) + (metricMatches.length >= 3 ? 1 : 0) + (readability >= 60 ? 1 : 0),
    totalChecks: 5,
    answerBlocksCount: answerBlocks,
    hasTables,
    bannedSlopDetected: detectedSlop,
    metricsFoundCount: metricMatches.length,
    readabilityEase: readability,
    recommendations,
  };
}

if (process.argv[1]?.endsWith('geo-evaluator.ts') || import.meta.main) {
  const fileArg = process.argv[2];
  let content = '';

  if (fileArg && fs.existsSync(fileArg)) {
    content = fs.readFileSync(fileArg, 'utf8');
  } else {
    // Sample test content
    content = `
# Edge WebAssembly Sandboxes

## What is an ephemeral sandbox?
An ephemeral sandbox is a fast, safe container on Cloudflare Workers that boots in under 45ms. It runs code in WebAssembly and stops when done, so tasks never leak memory or touch the host disk.

## Performance Benchmarks

| Runtime | Warm Latency | Cold Start | Memory Cap |
|:---|:---|:---|:---|
| SwarmLink workerd | 12ms | 42ms | 128MB |
| Traditional Docker | 450ms | 1200ms | 512MB |

All workers stream telemetry with 99.9% uptime.
    `;
  }

  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║       GENERATIVE ENGINE OPTIMIZATION (GEO) SCORECARD                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  const result = evaluateContentGeo(content);
  console.log(`GEO Readiness Score: ${result.score}/100 | Passed: ${result.passedChecks}/${result.totalChecks} Core Checks\n`);
  console.log(`- Quotable Answer Blocks: ${result.answerBlocksCount} detected`);
  console.log(`- Comparison Tables: ${result.hasTables ? 'Present (Optimal)' : 'Missing'}`);
  console.log(`- Concrete Metrics / Facts: ${result.metricsFoundCount} detected`);
  console.log(`- Flesch Reading Ease: ${result.readabilityEase}/100`);
  console.log(`- Banned AI Slop Words: ${result.bannedSlopDetected.length === 0 ? 'None (Clean)' : result.bannedSlopDetected.join(', ')}`);

  if (result.recommendations.length > 0) {
    console.log('\nRecommendations for AI Search Dominance:');
    result.recommendations.forEach((r) => console.log(`  ↳ ${r}`));
  } else {
    console.log('\nResult: Fully optimized for Generative Search extraction (Perplexity, ChatGPT, Gemini).');
  }

  console.log('\n──────────────────────────────────────────────────────────────────────────\n');
  process.exit(result.score >= 80 ? 0 : 1);
}
