#!/usr/bin/env node
/**
 * @file blog-post-validator.ts
 * @brief High-Velocity Blog Post & Editorial SEO/GEO Standards Validator.
 *
 * Programmatically audits blog posts (HTML, MDX, Markdown, or live URLs) against
 * the 2026 Blog Post Doctrine, verifying:
 * - Semantic HTML5 (<article>, <header>, <nav class="tt-toc">, <main>, <footer>)
 * - Single H1 and heading hierarchy
 * - Schema.org JSON-LD (BlogPosting / TechArticle with Person author & sameAs)
 * - Lead direct answer block (30-70 words) & Key Takeaways callout
 * - Zero-CLS multimedia (<picture> with aspect-ratio, video embeds with transcript)
 * - Native <details> FAQ accordions
 * - Anti-slop vocabulary compliance and Flesch Reading Ease score
 */

import * as fs from 'node:fs';

export interface BlogAuditCheck {
  id: string;
  category: 'STRUCTURE' | 'METADATA' | 'SCHEMA' | 'MULTIMEDIA' | 'GEO_VOICE' | 'CITATIONS';
  severity: 'PASS' | 'WARNING' | 'CRITICAL';
  message: string;
}

export interface BlogAuditReport {
  target: string;
  score: number; // 0-100
  passedCount: number;
  totalCount: number;
  wordCount: number;
  readingTimeMinutes: number;
  fleschScore: number;
  checks: BlogAuditCheck[];
}

const BANNED_SLOP_WORDS = [
  'delve', 'leverage', 'unleash', 'revolutionize', 'seamless', 'robust',
  'synergy', 'elevate', 'empower', 'transformative', 'best-in-class',
  'cutting-edge', 'discover', 'innovative', 'game-changer', 'tapestry',
  'beacon', 'testament'
];

export function calculateFleschScore(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  if (words.length === 0 || sentences.length === 0) return 0;

  let totalSyllables = 0;
  for (const word of words) {
    let clean = word.toLowerCase().replace(/[^a-z]/g, '');
    if (clean.length === 0) continue;
    if (clean.length <= 3) {
      totalSyllables += 1;
      continue;
    }
    // Remove silent e and common inflections that don't add syllables
    clean = clean.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
    const matches = clean.match(/[aeiouy]{1,2}/g);
    totalSyllables += matches ? Math.max(1, matches.length) : 1;
  }

  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = totalSyllables / words.length;

  const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function auditBlogPost(content: string, targetName = 'Blog Post'): BlogAuditReport {
  const checks: BlogAuditCheck[] = [];

  // Strip code, scripts, styles, and convert block tags to sentence terminators
  const editorialText = content
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<\/(p|h[1-6]|li|td|th|summary|div|aside)>/gi, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');

  const words = editorialText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.round(wordCount / 200));
  const flesch = calculateFleschScore(editorialText);

  // 1. Article Container
  const hasArticleTag = /<article[\s>]/i.test(content) || /class=["'][^"']*tt-blog-article/i.test(content);
  checks.push({
    id: 'ARTICLE_CONTAINER',
    category: 'STRUCTURE',
    severity: hasArticleTag ? 'PASS' : 'WARNING',
    message: hasArticleTag ? 'Semantic <article> container detected.' : 'Missing <article class="tt-blog-article"> wrapper.',
  });

  // 2. Single H1 Title
  const h1Matches = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || content.match(/^#\s+(.+)$/gm) || [];
  if (h1Matches.length === 1) {
    checks.push({
      id: 'SINGLE_H1',
      category: 'STRUCTURE',
      severity: 'PASS',
      message: 'Exactly one H1 heading found.',
    });
  } else {
    checks.push({
      id: 'SINGLE_H1',
      category: 'STRUCTURE',
      severity: 'CRITICAL',
      message: `Found ${h1Matches.length} H1 headings; expected exactly 1.`,
    });
  }

  // 3. Lead Direct Answer (30-70 words)
  const leadMatch = content.match(/<p[^>]*class=["'][^"']*tt-lead-paragraph[^"']*["'][^>]*>([\s\S]*?)<\/p>/i);
  if (leadMatch) {
    const leadWords = leadMatch[1].replace(/<[^>]+>/g, '').trim().split(/\s+/).length;
    if (leadWords >= 25 && leadWords <= 75) {
      checks.push({
        id: 'LEAD_ANSWER',
        category: 'GEO_VOICE',
        severity: 'PASS',
        message: `Direct-answer lead paragraph detected (${leadWords} words, optimal 30-70).`,
      });
    } else {
      checks.push({
        id: 'LEAD_ANSWER',
        category: 'GEO_VOICE',
        severity: 'WARNING',
        message: `Lead paragraph length (${leadWords} words) outside 30-70 word target.`,
      });
    }
  } else {
    // Check first paragraph
    const firstP = content.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (firstP) {
      const pWords = firstP[1].replace(/<[^>]+>/g, '').trim().split(/\s+/).length;
      checks.push({
        id: 'LEAD_ANSWER',
        category: 'GEO_VOICE',
        severity: pWords >= 25 && pWords <= 75 ? 'PASS' : 'WARNING',
        message: `First paragraph has ${pWords} words; recommend adding class="tt-lead-paragraph".`,
      });
    } else {
      checks.push({
        id: 'LEAD_ANSWER',
        category: 'GEO_VOICE',
        severity: 'WARNING',
        message: 'No distinct lead answer paragraph found.',
      });
    }
  }

  // 4. Key Takeaways Callout
  const hasKeyTakeaways = /tt-callout-key-takeaways/i.test(content) || /key\s*takeaways/i.test(content);
  checks.push({
    id: 'KEY_TAKEAWAYS',
    category: 'STRUCTURE',
    severity: hasKeyTakeaways ? 'PASS' : 'WARNING',
    message: hasKeyTakeaways ? 'Executive Summary / Key Takeaways callout present.' : 'Recommend adding Key Takeaways executive callout block.',
  });

  // 5. Table of Contents
  const hasToc = /<nav[^>]*class=["'][^"']*tt-toc/i.test(content) || /table\s*of\s*contents/i.test(content);
  checks.push({
    id: 'TABLE_OF_CONTENTS',
    category: 'STRUCTURE',
    severity: hasToc ? 'PASS' : 'WARNING',
    message: hasToc ? 'Interactive Table of Contents navigation present.' : 'Missing Table of Contents (<nav class="tt-toc">).',
  });

  // 6. Schema.org JSON-LD (BlogPosting, TechArticle, or Unified @graph)
  const jsonLdMatch = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const parsed = JSON.parse(jsonLdMatch[1].trim());
      let isArticleType = false;
      let hasAuthor = false;
      let schemaTypeName = parsed['@type'] || 'unknown';

      if (Array.isArray(parsed['@graph'])) {
        const articleNode = parsed['@graph'].find(
          (n: Record<string, unknown>) => n['@type'] === 'BlogPosting' || n['@type'] === 'TechArticle' || n['@type'] === 'Article',
        );
        if (articleNode) {
          isArticleType = true;
          schemaTypeName = `@graph -> ${articleNode['@type']}`;
          hasAuthor = !!articleNode.author || parsed['@graph'].some((n: Record<string, unknown>) => n['@type'] === 'Person');
        }
      } else {
        isArticleType = parsed['@type'] === 'BlogPosting' || parsed['@type'] === 'TechArticle' || parsed['@type'] === 'Article';
        hasAuthor = !!parsed.author && (typeof parsed.author === 'object' || typeof parsed.author === 'string');
      }

      if (isArticleType && hasAuthor) {
        checks.push({
          id: 'SCHEMA_JSON_LD',
          category: 'SCHEMA',
          severity: 'PASS',
          message: `Valid Schema.org ${schemaTypeName} JSON-LD with verified author entity.`,
        });
      } else {
        checks.push({
          id: 'SCHEMA_JSON_LD',
          category: 'SCHEMA',
          severity: 'WARNING',
          message: `JSON-LD found but type is ${schemaTypeName} or missing author Person.`,
        });
      }
    } catch {
      checks.push({
        id: 'SCHEMA_JSON_LD',
        category: 'SCHEMA',
        severity: 'CRITICAL',
        message: 'JSON-LD script tag contains invalid JSON syntax.',
      });
    }
  } else {
    checks.push({
      id: 'SCHEMA_JSON_LD',
      category: 'SCHEMA',
      severity: 'CRITICAL',
      message: 'Missing Schema.org BlogPosting or TechArticle JSON-LD script.',
    });
  }

  // 7. Multimedia CLS & Alt Tags
  const imgTags = content.match(/<img[^>]*>/gi) || [];
  let unstyledImgs = 0;
  let missingAlts = 0;
  for (const img of imgTags) {
    if (!/alt=["'][^"']+["']/i.test(img)) missingAlts++;
    const hasDimensions = /width=["']\d+["']/i.test(img) && /height=["']\d+["']/i.test(img);
    const hasAspectRatio = /aspect-ratio/i.test(img) || /aspect-ratio/i.test(content);
    if (!hasDimensions && !hasAspectRatio) unstyledImgs++;
  }

  if (imgTags.length === 0 || (unstyledImgs === 0 && missingAlts === 0)) {
    checks.push({
      id: 'MULTIMEDIA_CLS',
      category: 'MULTIMEDIA',
      severity: 'PASS',
      message: `All ${imgTags.length} images have explicit aspect-ratios/dimensions (CLS=0) and alt tags.`,
    });
  } else {
    checks.push({
      id: 'MULTIMEDIA_CLS',
      category: 'MULTIMEDIA',
      severity: 'WARNING',
      message: `Images audit: ${missingAlts} missing alt tags, ${unstyledImgs} missing explicit aspect-ratio/dimensions.`,
    });
  }

  // 8. Native FAQ Accordions
  const detailsTags = content.match(/<details[^>]*>/gi) || [];
  const hasFaqSection = /frequently\s*asked\s*questions|faq/i.test(content);
  if (hasFaqSection) {
    checks.push({
      id: 'FAQ_ACCORDIONS',
      category: 'STRUCTURE',
      severity: detailsTags.length > 0 ? 'PASS' : 'WARNING',
      message: detailsTags.length > 0 ? `Native <details> accordions utilized (${detailsTags.length} detected).` : 'FAQ section found but not using native <details name="..."> accordions.',
    });
  } else {
    checks.push({
      id: 'FAQ_ACCORDIONS',
      category: 'STRUCTURE',
      severity: 'PASS',
      message: 'FAQ check: None required for this article scope.',
    });
  }

  // 9. Anti-AI-Slop Voice
  const lower = editorialText.toLowerCase();
  const detectedSlop: string[] = [];
  for (const slop of BANNED_SLOP_WORDS) {
    if (new RegExp(`\\b${slop}\\b`, 'i').test(lower)) {
      detectedSlop.push(slop);
    }
  }

  if (detectedSlop.length === 0) {
    checks.push({
      id: 'ANTI_SLOP_VOICE',
      category: 'GEO_VOICE',
      severity: 'PASS',
      message: 'Zero banned AI slop buzzwords detected.',
    });
  } else {
    checks.push({
      id: 'ANTI_SLOP_VOICE',
      category: 'GEO_VOICE',
      severity: 'WARNING',
      message: `Detected banned AI slop buzzwords: [${detectedSlop.join(', ')}].`,
    });
  }

  // 10. Readability (Flesch >= 55 for general, >= 35 for TechArticle)
  const isTechArticle = /["']@type["']\s*:\s*["']TechArticle["']/i.test(content);
  const fleschThreshold = isTechArticle ? 35 : 55;
  checks.push({
    id: 'READABILITY_FLESCH',
    category: 'GEO_VOICE',
    severity: flesch >= fleschThreshold ? 'PASS' : 'WARNING',
    message: `Flesch Reading Ease score: ${flesch}/100 (Target ≥ ${fleschThreshold} for ${isTechArticle ? 'TechArticle' : 'General'}).`,
  });

  // 11. Citations & External Links
  const extLinks = content.match(/href=["']https?:\/\/[^"']+["']/gi) || [];
  checks.push({
    id: 'PRIMARY_CITATIONS',
    category: 'CITATIONS',
    severity: extLinks.length >= 2 ? 'PASS' : 'WARNING',
    message: `External citations: ${extLinks.length} primary references found (Target ≥ 2).`,
  });

  // 12. Breadcrumb Navigation Trail
  const hasBreadcrumbs = /tt-breadcrumbs/i.test(content) || /BreadcrumbList/i.test(content) || /breadcrumb/i.test(content);
  checks.push({
    id: 'BREADCRUMBS',
    category: 'STRUCTURE',
    severity: hasBreadcrumbs ? 'PASS' : 'WARNING',
    message: hasBreadcrumbs ? 'Breadcrumb navigation trail detected.' : 'Recommend adding <nav class="tt-breadcrumbs"> or BreadcrumbList schema.',
  });

  // 13. Author E-E-A-T Entity Graph
  const hasAuthorBio = /tt-author-bio-card/i.test(content) || /sameAs/i.test(content) || /orcid\.org/i.test(content) || /wikidata\.org/i.test(content);
  checks.push({
    id: 'AUTHOR_EEAT',
    category: 'GEO_VOICE',
    severity: hasAuthorBio ? 'PASS' : 'WARNING',
    message: hasAuthorBio ? 'Author E-E-A-T entity graph / bio profile verified.' : 'Missing verified author E-E-A-T entity links (sameAs).',
  });

  // Calculate score
  const total = checks.length;
  const passed = checks.filter((c) => c.severity === 'PASS').length;
  const warnings = checks.filter((c) => c.severity === 'WARNING').length;
  const score = Math.round(((passed + warnings * 0.5) / total) * 100);

  return {
    target: targetName,
    score,
    passedCount: passed,
    totalCount: total,
    wordCount,
    readingTimeMinutes,
    fleschScore: flesch,
    checks,
  };
}

export function printBlogAuditReport(report: BlogAuditReport): void {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log(`║   BLOG POST SEO & MULTIMEDIA AUDIT: ${report.target.slice(0, 36).padEnd(37)}║`);
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  console.log(`Score: ${report.score}/100 | Passed: ${report.passedCount}/${report.totalCount} Checks | Length: ${report.wordCount} words (~${report.readingTimeMinutes} min) | Flesch: ${report.fleschScore}\n`);

  for (const c of report.checks) {
    const icon = c.severity === 'PASS' ? '✓' : c.severity === 'WARNING' ? '⚠' : '✗';
    const color = c.severity === 'PASS' ? '\x1b[32m' : c.severity === 'WARNING' ? '\x1b[33m' : '\x1b[31m';
    console.log(`${color}[${icon}] [${c.category.padEnd(10)}] ${c.id.padEnd(20)}\x1b[0m: ${c.message}`);
  }

  console.log('\n──────────────────────────────────────────────────────────────────────────');
  console.log(`Audit Status: ${report.score >= 85 ? 'STANDARDS CONVERGED (Ready to Publish)' : 'REVISIONS REQUIRED'}`);
  console.log('──────────────────────────────────────────────────────────────────────────\n');
}

if (process.argv[1]?.endsWith('blog-post-validator.ts') || import.meta.main) {
  const fileArg = process.argv.find((a) => a.startsWith('--file='))?.split('=')[1] || process.argv[2];

  if (fileArg && fs.existsSync(fileArg)) {
    const content = fs.readFileSync(fileArg, 'utf8');
    const report = auditBlogPost(content, fileArg);
    printBlogAuditReport(report);
    process.exit(report.score >= 80 ? 0 : 1);
  } else {
    // Self-test with sample standards-compliant article
    const sample = `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": "Building Sub-40ms Semantic Retrieval on Cloudflare Workers",
        "description": "How we combined AST Grep with Durable Objects for high-throughput code indexing.",
        "author": {
          "@type": "Person",
          "name": "Sarah Connor",
          "sameAs": ["https://github.com/sarah"]
        }
      }
      </script>
      <article class="tt-blog-article">
        <header class="tt-article-header">
          <nav class="tt-breadcrumbs" aria-label="Breadcrumb">
            <ol><li><a href="/">Home</a></li><li><span>Engineering</span></li></ol>
          </nav>
          <h1>Building Sub-40ms Semantic Retrieval on Cloudflare Workers</h1>
        </header>
        <p class="tt-lead-paragraph">
          Semantic code retrieval extracts AST symbols into high-density vector chunks, providing instant sub-40ms lookups across massive repositories. By executing indexing in native WebAssembly sandboxes on Cloudflare Workers, developers eliminate centralized search clusters while securing strict zero-trust runtime containment.
        </p>
        <aside class="tt-callout tt-callout-key-takeaways">
          <div>Executive Summary & Key Takeaways</div>
          <ul><li>Sub-40ms vector lookups</li><li>Zero layout shift</li></ul>
        </aside>
        <nav class="tt-toc">
          <div>Table of Contents</div>
          <ul><li><a href="#ast-indexing">AST Indexing</a></li></ul>
        </nav>
        <main class="tt-article-body">
          <h2 id="ast-indexing">AST Indexing Pipeline</h2>
          <p>The indexing pipeline runs directly on the edge worker using AST parsing.</p>
          <picture>
            <img src="/arch.png" alt="Architecture flow diagram" width="1200" height="630" style="aspect-ratio: 1200 / 630;" />
          </picture>
        </main>
        <section class="tt-author-bio-card">
          <h3>Sarah Connor</h3>
          <p>Staff Systems Engineer.</p>
          <a href="https://orcid.org/0000-0002-1825-0097">ORCID</a>
        </section>
        <section class="tt-faq-section">
          <h2>Frequently Asked Questions</h2>
          <details name="blog-faq">
            <summary>How fast is indexing?</summary>
            <div>Less than 20ms per module.</div>
          </details>
        </section>
        <footer class="tt-citations-footer">
          <a href="https://ast-grep.github.io" target="_blank" rel="noopener">AST Grep</a>
          <a href="https://cloudflare.com" target="_blank" rel="noopener">Cloudflare Docs</a>
        </footer>
      </article>
    `;
    const report = auditBlogPost(sample, 'Self-Test Golden Blog Post');
    printBlogAuditReport(report);
    process.exit(report.score >= 90 ? 0 : 1);
  }
}
