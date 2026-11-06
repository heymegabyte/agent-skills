#!/usr/bin/env node
/**
 * @file blog-scaffold.ts
 * @brief Standards-Compliant Editorial Blog Post Scaffolding Generator.
 *
 * Scaffolds gorgeous, SEO/GEO-optimized blog posts leveraging `@theme.tools/blog`
 * components, Schema.org JSON-LD, Cloudflare Stream embeds, and semantic HTML5.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ScaffoldOptions {
  title: string;
  category?: string;
  authorName?: string;
  authorJobTitle?: string;
  isTechArticle?: boolean;
  slug?: string;
  outPath?: string;
}

export function generateScaffoldedArticle(opts: ScaffoldOptions): string {
  const title = opts.title || 'Architecting High-Throughput Edge Workflows';
  const category = opts.category || 'Architecture & Systems';
  const authorName = opts.authorName || 'Alex Vance';
  const authorTitle = opts.authorJobTitle || 'Distinguished Systems Architect';
  const schemaType = opts.isTechArticle ? 'TechArticle' : 'BlogPosting';
  const slug = opts.slug || title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
  const nowIso = new Date().toISOString();
  const dateStr = nowIso.split('T')[0];

  return `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "${schemaType}",
  "headline": "${escapeJson(title)}",
  "description": "Learn how to build, deploy, and scale high-throughput edge architectures with zero layout shift and sub-50ms execution.",
  "url": "https://theme.tools/blog/${slug}",
  "image": "https://theme.tools/images/blog/${slug}-hero.png",
  "datePublished": "${nowIso}",
  "dateModified": "${nowIso}",
  "author": {
    "@type": "Person",
    "name": "${escapeJson(authorName)}",
    "jobTitle": "${escapeJson(authorTitle)}",
    "url": "https://theme.tools/authors/${slugify(authorName)}",
    "sameAs": [
      "https://github.com/heymegabyte",
      "https://linkedin.com/in/heymegabyte"
    ]
  },
  "publisher": {
    "@type": "Organization",
    "name": "Megabyte Labs",
    "logo": {
      "@type": "ImageObject",
      "url": "https://theme.tools/logo.png"
    }
  },
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".tt-lead-paragraph", ".tt-key-takeaways"]
  },
  "citation": [
    "https://developers.cloudflare.com/workers/",
    "https://schema.org/BlogPosting"
  ]
}
</script>

<article class="tt-blog-article" style="max-width: 768px; margin: 0 auto; color: oklch(0.9 0.02 240); font-family: system-ui, -apple-system, sans-serif; line-height: 1.7;">
  <header class="tt-article-header" style="margin-bottom: 2rem;">
    <div class="tt-category-badge" style="display: inline-block; padding: 0.25rem 0.75rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: oklch(0.2 0.05 200); color: oklch(0.7 0.2 200); border-radius: 9999px; margin-bottom: 1rem;">
      ${escapeHtml(category)}
    </div>
    <h1 style="font-size: 2.25rem; font-weight: 800; line-height: 1.2; color: #FFFFFF; margin: 0 0 1rem 0;">
      ${escapeHtml(title)}
    </h1>
    <div class="tt-article-meta" style="display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; font-size: 0.875rem; color: oklch(0.7 0.02 240); margin-bottom: 1.5rem;">
      <span>By <strong style="color: #FFFFFF;">${escapeHtml(authorName)}</strong>, ${escapeHtml(authorTitle)}</span>
      <span>•</span>
      <time datetime="${dateStr}">${dateStr}</time>
      <span>•</span>
      <span>5 min read (1,250 words)</span>
    </div>
    <div class="tt-hero-image-wrapper" style="margin: 1.5rem 0; border-radius: 8px; overflow: hidden; aspect-ratio: 1200 / 630; background: #060610; border: 1px solid oklch(0.25 0.02 240);">
      <picture>
        <source type="image/avif" srcset="/images/blog/${slug}-hero.avif" />
        <source type="image/webp" srcset="/images/blog/${slug}-hero.webp" />
        <img
          src="/images/blog/${slug}-hero.png"
          alt="${escapeHtml(title)} architecture overview"
          width="1200"
          height="630"
          fetchpriority="high"
          style="width: 100%; height: auto; object-fit: cover; aspect-ratio: 1200 / 630;"
        />
      </picture>
    </div>
  </header>

  <!-- Lead direct answer block: 30-70 words answering core query for Generative Search (GEO) -->
  <p class="tt-lead-paragraph" style="font-size: 1.1875rem; font-weight: 500; line-height: 1.6; color: #FFFFFF; margin-bottom: 1.5rem;">
    High-throughput edge workflows run compute directly at Cloudflare point-of-presence nodes to cut round-trip latency under 45ms. By pairing WebAssembly sandboxing with durable state locks, distributed engineering systems eliminate centralized queuing bottlenecks while keeping runtime isolation strictly airtight.
  </p>

  <!-- Key Takeaways Callout -->
  <aside class="tt-callout tt-callout-key-takeaways" style="border-left: 4px solid oklch(0.7 0.2 290); background: oklch(0.15 0.02 240); padding: 1rem 1.25rem; border-radius: 0 8px 8px 0; margin: 1.5rem 0;">
    <div style="font-weight: 700; font-size: 0.9375rem; color: oklch(0.7 0.2 290); margin-bottom: 0.5rem;">Executive Summary &amp; Key Takeaways</div>
    <ul style="margin: 0; padding-left: 1.25rem; line-height: 1.6; color: oklch(0.9 0.02 240);">
      <li>Sub-45ms execution speeds achieved across 300+ edge locations worldwide.</li>
      <li>Zero Cumulative Layout Shift (CLS = 0) guaranteed through explicit media bounding boxes.</li>
      <li>Complete Schema.org TechArticle structured data enables instant rich results.</li>
    </ul>
  </aside>

  <!-- Table of Contents Navigation -->
  <nav class="tt-toc" aria-label="Table of Contents" style="margin: 2rem 0; padding: 1.25rem; background: oklch(0.14 0.02 240); border: 1px solid oklch(0.25 0.02 240); border-radius: 8px;">
    <div style="font-weight: 700; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em; color: oklch(0.7 0.2 200); margin-bottom: 0.75rem;">Table of Contents</div>
    <ul style="list-style: none; padding: 0; margin: 0; line-height: 1.8;">
      <li><a href="#core-architecture" style="color: oklch(0.85 0.02 240); text-decoration: none;">1. Core Edge Architecture</a></li>
      <li><a href="#performance-benchmarks" style="color: oklch(0.85 0.02 240); text-decoration: none;">2. Performance &amp; Latency Benchmarks</a></li>
      <li><a href="#code-implementation" style="color: oklch(0.85 0.02 240); text-decoration: none;">3. TypeScript Code Implementation</a></li>
      <li><a href="#video-walkthrough" style="color: oklch(0.85 0.02 240); text-decoration: none;">4. Interactive Video Walkthrough</a></li>
      <li><a href="#frequently-asked-questions" style="color: oklch(0.85 0.02 240); text-decoration: none;">5. Frequently Asked Questions</a></li>
    </ul>
  </nav>

  <main class="tt-article-body" style="font-size: 1.0625rem;">
    <h2 id="core-architecture" style="font-size: 1.625rem; font-weight: 700; color: #FFFFFF; margin-top: 2.5rem; margin-bottom: 1rem;">
      1. Core Edge Architecture
    </h2>
    <p>
      Modern applications require compute to run adjacent to user traffic. Rather than routing events back to origin database servers, edge workers process state mutations directly within memory-isolated WebAssembly instances.
    </p>

    <h2 id="performance-benchmarks" style="font-size: 1.625rem; font-weight: 700; color: #FFFFFF; margin-top: 2.5rem; margin-bottom: 1rem;">
      2. Performance &amp; Latency Benchmarks
    </h2>
    <p>
      We measured cold-start times, execution latencies, and memory footprints across three distinct workload configurations:
    </p>

    <!-- Structured comparison table for Information Gain & AI extraction -->
    <div style="overflow-x: auto; margin: 1.5rem 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.9375rem; text-align: left;">
        <thead>
          <tr style="border-bottom: 2px solid oklch(0.3 0.02 240); background: oklch(0.16 0.02 240);">
            <th style="padding: 0.75rem 1rem; color: #FFFFFF;">Workload Architecture</th>
            <th style="padding: 0.75rem 1rem; color: #FFFFFF;">Warm Latency</th>
            <th style="padding: 0.75rem 1rem; color: #FFFFFF;">Cold Start</th>
            <th style="padding: 0.75rem 1rem; color: #FFFFFF;">Zero CLS</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid oklch(0.2 0.02 240);">
            <td style="padding: 0.75rem 1rem; font-weight: 600; color: #FFFFFF;">SwarmLink Edge Worker</td>
            <td style="padding: 0.75rem 1rem; color: oklch(0.7 0.2 140);">14ms</td>
            <td style="padding: 0.75rem 1rem; color: oklch(0.7 0.2 140);">42ms</td>
            <td style="padding: 0.75rem 1rem; color: oklch(0.7 0.2 140);">✓ Yes</td>
          </tr>
          <tr style="border-bottom: 1px solid oklch(0.2 0.02 240);">
            <td style="padding: 0.75rem 1rem; font-weight: 600; color: #FFFFFF;">Standard Serverless</td>
            <td style="padding: 0.75rem 1rem;">125ms</td>
            <td style="padding: 0.75rem 1rem;">480ms</td>
            <td style="padding: 0.75rem 1rem; color: oklch(0.7 0.2 80);">Partial</td>
          </tr>
          <tr>
            <td style="padding: 0.75rem 1rem; font-weight: 600; color: #FFFFFF;">Centralized Node VM</td>
            <td style="padding: 0.75rem 1rem; color: oklch(0.65 0.25 30);">380ms</td>
            <td style="padding: 0.75rem 1rem; color: oklch(0.65 0.25 30);">1,450ms</td>
            <td style="padding: 0.75rem 1rem; color: oklch(0.65 0.25 30);">✗ No</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2 id="code-implementation" style="font-size: 1.625rem; font-weight: 700; color: #FFFFFF; margin-top: 2.5rem; margin-bottom: 1rem;">
      3. TypeScript Code Implementation
    </h2>
    <p>
      The following handler executes atomic locks with automatic timeout release:
    </p>

    <!-- Interactive code block with filename header -->
    <div class="tt-code-container" style="border: 1px solid oklch(0.25 0.02 240); border-radius: 8px; overflow: hidden; margin: 1.5rem 0; background: oklch(0.12 0.02 240);">
      <div class="tt-code-header" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem; background: oklch(0.18 0.02 240); border-bottom: 1px solid oklch(0.25 0.02 240); font-family: ui-monospace, monospace; font-size: 0.8125rem; color: oklch(0.8 0.02 240);">
        <span class="tt-code-filename">src/coordinator.ts</span>
        <span class="tt-code-lang" style="text-transform: uppercase; font-size: 0.75rem; color: oklch(0.7 0.2 200);">TypeScript</span>
      </div>
      <pre style="margin: 0; padding: 1rem; overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.875rem; line-height: 1.6; color: #FFFFFF;"><code class="language-typescript">import { DurableObject } from "cloudflare:workers";

export class DistributedCoordinator extends DurableObject {
  private activeLocks = new Map&lt;string, number&gt;();

  async acquireLock(resourceId: string, ttlMs = 5000): Promise&lt;boolean&gt; {
    const now = Date.now();
    const expiry = this.activeLocks.get(resourceId);
    if (expiry &amp;&amp; expiry &gt; now) return false;

    this.activeLocks.set(resourceId, now + ttlMs);
    return true;
  }
}</code></pre>
    </div>

    <h2 id="video-walkthrough" style="font-size: 1.625rem; font-weight: 700; color: #FFFFFF; margin-top: 2.5rem; margin-bottom: 1rem;">
      4. Interactive Video Walkthrough
    </h2>
    <p>
      Watch the three-minute architecture walkthrough demonstrating deployment to Cloudflare:
    </p>

    <!-- Cloudflare Stream responsive 16:9 video embed -->
    <div class="tt-video-wrapper" style="aspect-ratio: 16 / 9; width: 100%; position: relative; border-radius: 8px; overflow: hidden; background: #060610; border: 1px solid oklch(0.3 0.02 240); margin: 1.5rem 0;">
      <iframe
        src="https://iframe.videodelivery.net/demo-stream-uid?preload=true"
        title="${escapeHtml(title)} Video Walkthrough"
        style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowfullscreen="true"
        loading="lazy"
      ></iframe>
    </div>
  </main>

  <!-- Native FAQ section (<details name="blog-faq">) -->
  <section class="tt-faq-section" style="margin-top: 3rem; border-top: 1px solid oklch(0.25 0.02 240); padding-top: 2rem;">
    <h2 id="frequently-asked-questions" style="font-size: 1.5rem; font-weight: 700; color: #FFFFFF; margin-bottom: 1.5rem;">
      5. Frequently Asked Questions
    </h2>
    <details name="blog-faq" style="border: 1px solid oklch(0.25 0.02 240); border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 0.75rem; background: oklch(0.13 0.02 240);">
      <summary style="font-weight: 600; cursor: pointer; color: oklch(0.9 0.02 240); font-size: 1rem;">What is the latency difference between edge workers and centralized VMs?</summary>
      <div style="margin-top: 0.75rem; line-height: 1.6; color: oklch(0.8 0.02 240); font-size: 0.9375rem;">
        Edge workers execute in under 15ms by terminating TLS and running logic in the user's nearest metro datacenter, compared to 120ms to 400ms across origin backhaul hops.
      </div>
    </details>
    <details name="blog-faq" style="border: 1px solid oklch(0.25 0.02 240); border-radius: 6px; padding: 0.75rem 1rem; margin-bottom: 0.75rem; background: oklch(0.13 0.02 240);">
      <summary style="font-weight: 600; cursor: pointer; color: oklch(0.9 0.02 240); font-size: 1rem;">How does this architecture eliminate layout shift?</summary>
      <div style="margin-top: 0.75rem; line-height: 1.6; color: oklch(0.8 0.02 240); font-size: 0.9375rem;">
        Every media asset reserves its exact layout box using CSS aspect-ratio properties and explicit width/height tags, ensuring CLS remains strictly 0.00.
      </div>
    </details>
  </section>

  <!-- Numbered Primary Citations Footer -->
  <footer class="tt-citations-footer" style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px dashed oklch(0.25 0.02 240); font-size: 0.8125rem; color: oklch(0.7 0.02 240);">
    <div style="font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem; letter-spacing: 0.05em;">References &amp; Citations</div>
    <ol style="margin: 0; padding-left: 1.25rem; line-height: 1.6;">
      <li><a href="https://developers.cloudflare.com/workers/" target="_blank" rel="noopener noreferrer" style="color: oklch(0.7 0.2 200); text-decoration: underline;">Cloudflare Workers Documentation &amp; Runtime Architecture</a></li>
      <li><a href="https://schema.org/BlogPosting" target="_blank" rel="noopener noreferrer" style="color: oklch(0.7 0.2 200); text-decoration: underline;">Schema.org BlogPosting &amp; TechArticle Specification (2026)</a></li>
    </ol>
  </footer>
</article>`.trim();
}

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeJson(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

if (process.argv[1]?.endsWith('blog-scaffold.ts') || import.meta.main) {
  const title = process.argv[2] || 'Architecting High-Throughput Edge Workflows';
  const outPath = process.argv[3];

  const html = generateScaffoldedArticle({
    title,
    isTechArticle: true,
  });

  if (outPath) {
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`[Blog-Scaffold] Successfully generated blog post to: ${outPath}`);
  } else {
    console.log(html);
  }
}
