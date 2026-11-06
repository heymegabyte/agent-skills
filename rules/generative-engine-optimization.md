---
last_reviewed: 2026-11-05
superseded_by: null
name: "generative-engine-optimization"
priority: 1
pack: "website-build"
triggers:
  - "geo"
  - "generative engine optimization"
  - "ai search"
  - "perplexity"
  - "chatgpt search"
  - "google ai overviews"
  - "llms.txt"
  - "answer engine"
  - "citation share"
paths:
  - "org:website_build"
  - "concern:content"
  - "concern:seo"
---

# Generative Engine Optimization (GEO) & AI Search Doctrine

Optimizing for modern conversational search engines (Perplexity, ChatGPT Search, Claude, Google AI Overviews, Gemini) requires shifting from pure keyword-frequency ranking to **unambiguous entity citation, extractable answer architecture, and Information Gain**.

---

## 1. The Zero-Click & Citation Imperative

Traditional search seeks to win a blue link click. Conversational AI search synthesizes direct answers and quotes verified sources. To dominate generative engine results:
- **Quotable Answer Blocks**: Every major informational heading (`<h2>` / `<h3>`) must immediately be followed by a self-contained, 40–60 word declarative answer block that can be directly extracted into an LLM response without loss of context.
- **Extractable Format Over Prose Flow**: Generative engines heavily prioritize structured data representations:
  - Numbered sequential workflows (`1. Step One... 2. Step Two...`).
  - Bulleted specifications with explicit units.
  - Comparative feature tables with column headers and binary `✓`/`✗` indicators.
  - Key-value definition lists.

---

## 2. Information Gain & Anti-Paraphrasing

Google Core Updates and LLM retrieval-augmented generation (RAG) penalize content that merely summarizes consensus search results.
- **Proprietary Data Mandate**: Every technical guide, review, or service page must contribute *net-new information* to the web:
  - Firsthand benchmarking results with measurable latencies and throughputs.
  - Original case studies or production failure retrospectives.
  - Concrete code implementations rather than pseudo-code abstractions.
  - Architectural trade-off matrices.
- **Banned AI Hallmarks**: Do not use rhetorical flourishes ("In this article, we delve into...", "It's important to remember that..."). Start immediately with the answer.

---

## 3. Machine-Readable Knowledge Surface: `llms.txt` Standard

Every domain must expose clean Markdown manifests at the root to serve AI agents and LLM crawlers without HTML boilerplate overhead:

1. **`/llms.txt`**:
   - Clean, lightweight Markdown roadmap.
   - Title H1 and concise project summary blockquote.
   - Curated sections linking to core documentation and product pages.
2. **`/llms-full.txt`**:
   - Single-file aggregated Markdown compilation of core system documentation.
   - Enables single-fetch context hydration for autonomous coding agents and deep LLM research bots.

---

## 4. AI Crawler Access Control & Bot Policies

Do not blindly block automated agents. Distinguish between generative search engines (which drive citations and traffic) and uncredited data scrapers:

```txt
# Permitted Generative Search Crawlers
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /
```

---

## 5. Entity Disambiguation via Linked Schema.org

Generative models rely on knowledge graphs to resolve ambiguities. Every public route must supply explicit JSON-LD:
- Provide `sameAs` links to official Wikidata, Crunchbase, GitHub, and social entity profiles.
- Link authors to verifiable `Person` entities with real credentials.
- Ensure 100% parity between JSON-LD schema values and visible on-page HTML text. Discrepancies trigger trust downgrades.

---

## 6. Generative Citation Analytics

Monitor AI search visibility beyond traditional impressions:
- Track referral traffic from `chatgpt.com`, `perplexity.ai`, `claude.ai`, and `gemini.google.com`.
- Periodically sample core domain queries on Perplexity and ChatGPT to audit brand citation share and sentiment.
