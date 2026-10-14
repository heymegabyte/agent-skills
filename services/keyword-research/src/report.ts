/**
 * Report generation — turn a {@link ResearchResult} into the three deliverable
 * formats a human (or another tool) consumes:
 *
 *   toJsonReport(...)      → a structured, machine-readable report object.
 *   toMarkdownReport(...)  → the human-facing briefing document (§16 layout).
 *   toCsv(opportunities)   → a flat spreadsheet, one row per opportunity.
 *
 * Every section of the §16 report is covered: site/audience summary; provider +
 * freshness statuses; top opportunities; intent + scores; demand + source
 * attribution; difficulty + competitive context; GSC opportunities; trend /
 * seasonality; clusters + destination pages; content-gap analysis; top actions;
 * READY BRIEFS (page type, primary topic, related queries, audience, intent,
 * outline, UVP, sources, internal links, evidence-based checklist); sources +
 * timestamps; actual cost + remaining budget; and an EXPLICIT missing-data
 * limitations section.
 *
 * The iron rule, enforced structurally: we NEVER fabricate a metric, competitor,
 * citation, or ranking. A `null` metric renders as "n/a (unknown)" — it is NEVER
 * printed as 0. A section with no real data says so. Citations come only from
 * the evidence/competitor rows the pipeline actually gathered.
 *
 * PURE: output is a deterministic function of the inputs (the pipeline already
 * injected the clock, so timestamps are baked into the result).
 */
import type { ResearchResult, EvidenceRow } from './pipeline';
import type { KeywordOpportunity } from './types';

/* ------------------------------------------------------------------ */
/* Shared report context (site + budget the run was configured with).  */
/* ------------------------------------------------------------------ */

export interface ReportContext {
  domain: string;
  locale: string;
  geography: string;
  language: string;
  /** Audience description, if the caller supplied one (else a neutral default). */
  audience?: string;
  /** The budget cap this run was given (for "remaining budget"). */
  budgetUsd: number;
  /** ISO timestamp the report was generated (from the pipeline's clock). */
  generatedAt: string;
}

/** How many opportunities get a full "ready brief" in the Markdown report. */
export const DEFAULT_BRIEF_COUNT = 5;
/** How many rows the "top opportunities" table shows. */
export const DEFAULT_TOP_COUNT = 25;

/* ------------------------------------------------------------------ */
/* Null-safe formatting helpers — a missing metric is NEVER 0.         */
/* ------------------------------------------------------------------ */

/** Render a nullable number; `null` becomes an explicit unknown marker. */
function num(n: number | null, opts: { suffix?: string; decimals?: number } = {}): string {
  if (n === null) return 'n/a (unknown)';
  const v = opts.decimals !== undefined ? n.toFixed(opts.decimals) : String(n);
  return `${v}${opts.suffix ?? ''}`;
}

/** Render a nullable string; `null`/'' become an explicit unknown marker. */
function str(s: string | null | undefined): string {
  return s && s.trim() !== '' ? s : 'n/a (unknown)';
}

/** CSV-escape a single cell (RFC 4180: quote if it has comma/quote/newline). */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/* ------------------------------------------------------------------ */
/* JSON report.                                                        */
/* ------------------------------------------------------------------ */

/** The §16 keys a JSON report MUST carry (also asserted by the tests). */
export interface JsonReport {
  schema_version: number;
  site: {
    domain: string;
    locale: string;
    geography: string;
    language: string;
    audience: string;
  };
  generated_at: string;
  provider_statuses: ResearchResult['providerStatuses'];
  data_freshness: { records: number; average_freshness: number | null };
  summary: {
    total_opportunities: number;
    clusters: number;
    actions: Record<string, number>;
  };
  top_opportunities: TopOpportunityRow[];
  clusters: ClusterReportRow[];
  content_gaps: ContentGapRow[];
  top_actions: ActionRow[];
  briefs: ContentBrief[];
  sources: SourceRow[];
  budget: { cap_usd: number; spent_usd: number; remaining_usd: number };
  limitations: string[];
}

export interface TopOpportunityRow {
  keyword: string;
  intent: string;
  intent_confidence: number;
  score: number;
  monthly_search_volume: number | null;
  volume_source: string | null;
  organic_keyword_difficulty: number | null;
  cpc: number | null;
  paid_competition: number | null;
  gsc_impressions: number | null;
  gsc_average_position: number | null;
  trend_direction: string | null;
  recommended_action: string;
  existing_matching_page: string | null;
  recommended_url: string | null;
  confidence: number;
}

export interface ClusterReportRow {
  id: string;
  intent: string;
  destination: string;
  primary_keyword: string;
  members: { keyword: string; role: string; score: number }[];
}

export interface ContentGapRow {
  keyword: string;
  intent: string;
  score: number;
  recommended_url: string | null;
  rationale: string;
}

export interface ActionRow {
  keyword: string;
  action: string;
  score: number;
  rationale: string;
}

export interface SourceRow {
  source: string;
  field: string;
  observed_at: string;
  confidence: number;
  note?: string;
}

/** A content brief — everything a writer needs, grounded in gathered evidence. */
export interface ContentBrief {
  primary_keyword: string;
  page_type: string;
  primary_topic: string;
  related_queries: string[];
  audience: string;
  intent: string;
  outline: string[];
  unique_value_proposition: string;
  /** Citation sources (evidence/competitor URLs) — NEVER invented. */
  sources: { url: string; title: string }[];
  /** Internal links to sibling cluster pages. */
  internal_links: string[];
  /** Evidence-based checklist — each item tied to real, gathered data. */
  checklist: string[];
}

/** Map an opportunity to a flat top-opportunity row. */
function toTopRow(o: KeywordOpportunity): TopOpportunityRow {
  return {
    keyword: o.keyword,
    intent: o.search_intent,
    intent_confidence: o.intent_confidence,
    score: o.opportunity_score,
    monthly_search_volume: o.monthly_search_volume,
    volume_source: o.volume_source,
    organic_keyword_difficulty: o.organic_keyword_difficulty,
    cpc: o.cpc,
    paid_competition: o.paid_competition,
    gsc_impressions: o.gsc_impressions,
    gsc_average_position: o.gsc_average_position,
    trend_direction: o.trend_direction,
    recommended_action: o.recommended_action,
    existing_matching_page: o.existing_matching_page,
    recommended_url: o.recommended_url,
    confidence: o.confidence,
  };
}

/** Average freshness across opportunities, or `null` when there are none. */
function averageFreshness(opps: readonly KeywordOpportunity[]): number | null {
  if (opps.length === 0) return null;
  const sum = opps.reduce((acc, o) => acc + o.data_freshness, 0);
  return Number((sum / opps.length).toFixed(4));
}

/** Count opportunities by recommended action. */
function actionCounts(opps: readonly KeywordOpportunity[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const o of opps) counts[o.recommended_action] = (counts[o.recommended_action] ?? 0) + 1;
  return counts;
}

/** Collect unique evidence/competitor citations for a keyword (deduped by URL). */
function citationsFor(
  keyword: string,
  evidence: readonly EvidenceRow[],
  opp: KeywordOpportunity | undefined,
): { url: string; title: string }[] {
  const seen = new Map<string, { url: string; title: string }>();
  for (const e of evidence) {
    if (e.keyword === keyword && e.url) seen.set(e.url, { url: e.url, title: e.title || e.url });
  }
  // Competitor URLs are also citations (evidence that the topic is contested).
  for (const c of opp?.competitor_evidence ?? []) {
    if (c.url) seen.set(c.url, { url: c.url, title: `${c.domain} (competitor)` });
  }
  return [...seen.values()];
}

/** Build an outline from the intent (deterministic skeleton, not fabricated facts). */
function outlineForIntent(intent: string, topic: string): string[] {
  switch (intent) {
    case 'transactional':
      return [`What ${topic} costs`, 'Plans / pricing comparison', 'How to buy', 'FAQ'];
    case 'comparison':
      return [`${topic}: the shortlist`, 'Head-to-head comparison table', 'How we evaluated', 'Our pick + why'];
    case 'informational':
      return [`What is ${topic}?`, 'Why it matters', 'How it works (step by step)', 'Common mistakes', 'Next steps'];
    case 'local':
      return [`${topic} in your area`, 'What to look for locally', 'Service area + contact', 'Reviews'];
    case 'commercial':
      return [`${topic} overview`, 'Key capabilities', 'Who it is for', 'How to evaluate', 'CTA'];
    default:
      return [`${topic} overview`, 'Key points', 'Details', 'Summary'];
  }
}

/** Map a recommended action to the page type a brief targets. */
function pageTypeForAction(action: string, intent: string): string {
  switch (action) {
    case 'comparison_content':
      return 'Comparison page';
    case 'supporting_blog':
      return 'Supporting blog article';
    case 'improve_existing':
      return 'Existing page (improve in place)';
    case 'consolidate':
      return 'Consolidated page (merge duplicates)';
    case 'create_new':
      return intent === 'transactional' ? 'Money / landing page' : 'New content page';
    default:
      return 'Content page';
  }
}

/** Build ready briefs for the top-N page-owning opportunities. */
function buildBriefs(result: ResearchResult, ctx: ReportContext, count: number): ContentBrief[] {
  const byKeyword = new Map(result.opportunities.map((o) => [o.keyword, o]));
  // Brief the primaries of the top clusters (one brief per destination page).
  const briefs: ContentBrief[] = [];
  for (const cluster of result.clusters) {
    if (briefs.length >= count) break;
    const primary = byKeyword.get(cluster.primaryKeyword);
    if (!primary) continue;
    // Don't brief rejected/monitored work — those aren't pages to build.
    if (primary.recommended_action === 'reject' || primary.recommended_action === 'monitor') continue;

    const related = cluster.members.filter((m) => m.role !== 'primary').map((m) => m.keyword);
    const internalLinks = result.clusters
      .filter((c) => c.id !== cluster.id)
      .slice(0, 3)
      .map((c) => c.destination);

    const sources = citationsFor(primary.keyword, result.evidence, primary);
    const topic = primary.topic_cluster || primary.keyword;

    // Evidence-based checklist — each item is grounded in data we actually have.
    const checklist: string[] = [
      `Target the primary keyword "${primary.keyword}" (${primary.search_intent} intent, score ${primary.opportunity_score}).`,
    ];
    if (primary.monthly_search_volume !== null) {
      checklist.push(`Demand: ~${primary.monthly_search_volume}/mo (source: ${str(primary.volume_source)}).`);
    } else {
      checklist.push('Demand unknown (no volume source) — validate before heavy investment.');
    }
    if (primary.organic_keyword_difficulty !== null) {
      checklist.push(`Plan for KD ${primary.organic_keyword_difficulty}/100 — match or exceed the depth of ranking pages.`);
    }
    if (sources.length > 0) {
      checklist.push(`Cite ${sources.length} gathered source(s); do not invent statistics.`);
    } else {
      checklist.push('No citations gathered yet — source claims before publishing.');
    }
    if (related.length > 0) {
      checklist.push(`Cover the ${related.length} supporting quer${related.length === 1 ? 'y' : 'ies'} on this one page (avoid cannibalization).`);
    }

    briefs.push({
      primary_keyword: primary.keyword,
      page_type: pageTypeForAction(primary.recommended_action, primary.search_intent),
      primary_topic: topic,
      related_queries: related,
      audience: ctx.audience ?? `${ctx.domain} prospects searching in ${ctx.geography}`,
      intent: primary.search_intent,
      outline: outlineForIntent(primary.search_intent, topic),
      unique_value_proposition: `A ${primary.search_intent}-intent page that out-depths ranking competitors for "${primary.keyword}".`,
      sources,
      internal_links: internalLinks,
      checklist,
    });
  }
  return briefs;
}

/** Assemble the structured JSON report. */
export function toJsonReport(
  result: ResearchResult,
  ctx: ReportContext,
  opts: { topCount?: number; briefCount?: number } = {},
): JsonReport {
  const topCount = opts.topCount ?? DEFAULT_TOP_COUNT;
  const briefCount = opts.briefCount ?? DEFAULT_BRIEF_COUNT;

  const top = result.opportunities.slice(0, topCount).map(toTopRow);

  const clusters: ClusterReportRow[] = result.clusters.map((c) => ({
    id: c.id,
    intent: c.intent,
    destination: c.destination,
    primary_keyword: c.primaryKeyword,
    members: c.members.map((m) => ({ keyword: m.keyword, role: m.role, score: m.score })),
  }));

  const content_gaps: ContentGapRow[] = result.opportunities
    .filter((o) => o.recommended_action === 'create_new' || o.recommended_action === 'comparison_content')
    .map((o) => ({
      keyword: o.keyword,
      intent: o.search_intent,
      score: o.opportunity_score,
      recommended_url: o.recommended_url,
      rationale: o.scoring_explanation,
    }));

  const top_actions: ActionRow[] = result.opportunities.slice(0, topCount).map((o) => ({
    keyword: o.keyword,
    action: o.recommended_action,
    score: o.opportunity_score,
    rationale: o.scoring_explanation,
  }));

  // Sources: every provenance row across all opportunities, deduped.
  const sourceSeen = new Map<string, SourceRow>();
  for (const o of result.opportunities) {
    for (const p of o.source_provenance) {
      const key = `${p.source}::${p.field}::${p.observed_at}`;
      if (!sourceSeen.has(key)) {
        sourceSeen.set(key, {
          source: p.source,
          field: p.field,
          observed_at: p.observed_at,
          confidence: p.confidence,
          ...(p.note ? { note: p.note } : {}),
        });
      }
    }
  }

  return {
    schema_version: 1,
    site: {
      domain: ctx.domain,
      locale: ctx.locale,
      geography: ctx.geography,
      language: ctx.language,
      audience: ctx.audience ?? `${ctx.domain} prospects searching in ${ctx.geography}`,
    },
    generated_at: ctx.generatedAt,
    provider_statuses: result.providerStatuses,
    data_freshness: {
      records: result.opportunities.length,
      average_freshness: averageFreshness(result.opportunities),
    },
    summary: {
      total_opportunities: result.opportunities.length,
      clusters: result.clusters.length,
      actions: actionCounts(result.opportunities),
    },
    top_opportunities: top,
    clusters,
    content_gaps,
    top_actions,
    briefs: buildBriefs(result, ctx, briefCount),
    sources: [...sourceSeen.values()],
    budget: {
      cap_usd: ctx.budgetUsd,
      spent_usd: result.costActual,
      remaining_usd: Number((ctx.budgetUsd - result.costActual).toFixed(4)),
    },
    limitations: result.limitations,
  };
}

/* ------------------------------------------------------------------ */
/* Markdown report (§16 layout).                                       */
/* ------------------------------------------------------------------ */

/** Render the full human-facing Markdown briefing. */
export function toMarkdownReport(
  result: ResearchResult,
  ctx: ReportContext,
  opts: { topCount?: number; briefCount?: number } = {},
): string {
  const json = toJsonReport(result, ctx, opts);
  const L: string[] = [];
  const p = (s = '') => L.push(s);

  // --- Title + site / audience summary ---
  p(`# Keyword Research — ${ctx.domain}`);
  p();
  p(`_Generated ${ctx.generatedAt}_`);
  p();
  p('## Site & Audience');
  p(`- **Domain:** ${ctx.domain}`);
  p(`- **Locale / geography / language:** ${ctx.locale} / ${ctx.geography} / ${ctx.language}`);
  p(`- **Audience:** ${json.site.audience}`);
  p(`- **Opportunities found:** ${json.summary.total_opportunities} across ${json.summary.clusters} cluster(s).`);
  p();

  // --- Provider + freshness statuses ---
  p('## Providers & Data Freshness');
  p('| Provider | Called | Rows | Cost (USD) | Note |');
  p('| --- | --- | --- | --- | --- |');
  for (const s of result.providerStatuses) {
    p(`| ${s.provider} | ${s.called ? 'yes' : 'no'} | ${s.rows} | ${s.cost.toFixed(2)} | ${s.note ?? ''} |`);
  }
  p();
  p(`- **Records:** ${json.data_freshness.records} · **Average freshness:** ${num(json.data_freshness.average_freshness, { decimals: 2 })}`);
  p();

  // --- Top opportunities (intent + scores + demand + difficulty + GSC + trend) ---
  p('## Top Opportunities');
  p('| Keyword | Intent | Score | Volume | Source | KD | CPC | Paid | GSC impr. | GSC pos. | Trend | Action |');
  p('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const o of json.top_opportunities) {
    p(
      `| ${o.keyword} | ${o.intent} (${o.intent_confidence.toFixed(2)}) | ${o.score} | ` +
        `${num(o.monthly_search_volume)} | ${str(o.volume_source)} | ${num(o.organic_keyword_difficulty)} | ` +
        `${num(o.cpc)} | ${num(o.paid_competition)} | ${num(o.gsc_impressions)} | ${num(o.gsc_average_position)} | ` +
        `${str(o.trend_direction)} | ${o.recommended_action} |`,
    );
  }
  p();

  // --- Demand + source attribution ---
  p('## Demand & Source Attribution');
  p('Every volume below is attributed to its source; unknown demand is shown as `n/a (unknown)`, never 0.');
  for (const o of json.top_opportunities) {
    p(`- **${o.keyword}** — volume ${num(o.monthly_search_volume)} (source: ${str(o.volume_source)}).`);
  }
  p();

  // --- Difficulty + competitive context ---
  p('## Difficulty & Competitive Context');
  for (const o of result.opportunities.slice(0, opts.topCount ?? DEFAULT_TOP_COUNT)) {
    const comps = o.competitor_evidence;
    if (comps.length === 0) {
      p(`- **${o.keyword}** — KD ${num(o.organic_keyword_difficulty)}; no competitor evidence gathered.`);
    } else {
      const names = comps
        .map((c) => `${c.domain}${c.organic_position !== null ? ` (#${c.organic_position})` : ''}`)
        .join(', ');
      p(`- **${o.keyword}** — KD ${num(o.organic_keyword_difficulty)}; competitors: ${names}.`);
    }
  }
  p();

  // --- GSC opportunities ---
  p('## Search Console Opportunities');
  const gscOpps = result.opportunities.filter((o) => o.gsc_impressions !== null);
  if (gscOpps.length === 0) {
    p('No first-party Search Console data was available for this run (see Limitations).');
  } else {
    for (const o of gscOpps) {
      p(
        `- **${o.keyword}** — ${num(o.gsc_impressions)} impressions, avg position ${num(o.gsc_average_position)}, CTR ${num(o.gsc_ctr)}.`,
      );
    }
  }
  p();

  // --- Trend / seasonality ---
  p('## Trend & Seasonality');
  const trendOpps = result.opportunities.filter((o) => o.trend_direction !== null);
  if (trendOpps.length === 0) {
    p('No trend data was available for this run.');
  } else {
    for (const o of trendOpps) {
      const seasonal = o.seasonality && o.seasonality.length > 0 ? ` · ${o.seasonality.length}-point seasonality curve` : '';
      p(`- **${o.keyword}** — ${str(o.trend_direction)} (momentum ${num(o.trend_momentum)})${seasonal}.`);
    }
  }
  p();

  // --- Clusters + destination pages ---
  p('## Clusters & Destination Pages');
  for (const c of json.clusters) {
    p(`### ${c.primary_keyword} → \`${c.destination}\` (${c.intent})`);
    for (const m of c.members) {
      p(`- ${m.role === 'primary' ? '**primary**' : 'supporting'}: ${m.keyword} (score ${m.score})`);
    }
    p();
  }

  // --- Content-gap analysis ---
  p('## Content-Gap Analysis');
  if (json.content_gaps.length === 0) {
    p('No net-new content gaps — existing pages cover the scored opportunities.');
  } else {
    for (const g of json.content_gaps) {
      p(`- **${g.keyword}** (${g.intent}, score ${g.score}) → create \`${str(g.recommended_url)}\`.`);
    }
  }
  p();

  // --- Top actions ---
  p('## Top Actions');
  p('| Keyword | Action | Score |');
  p('| --- | --- | --- |');
  for (const a of json.top_actions) {
    p(`| ${a.keyword} | ${a.action} | ${a.score} |`);
  }
  p();

  // --- Ready briefs ---
  p('## Content Briefs');
  if (json.briefs.length === 0) {
    p('No briefs generated — no page-owning opportunities cleared the threshold.');
  }
  for (const b of json.briefs) {
    p(`### Brief: ${b.primary_keyword}`);
    p(`- **Page type:** ${b.page_type}`);
    p(`- **Primary topic:** ${b.primary_topic}`);
    p(`- **Intent:** ${b.intent}`);
    p(`- **Audience:** ${b.audience}`);
    p(`- **Related queries:** ${b.related_queries.length > 0 ? b.related_queries.join(', ') : 'none'}`);
    p(`- **Unique value proposition:** ${b.unique_value_proposition}`);
    p('- **Outline:**');
    for (const h of b.outline) p(`  1. ${h}`);
    p('- **Internal links:**');
    if (b.internal_links.length === 0) p('  - (none yet)');
    for (const link of b.internal_links) p(`  - \`${link}\``);
    p('- **Sources (gathered — never invented):**');
    if (b.sources.length === 0) p('  - (none gathered; source claims before publishing)');
    for (const s of b.sources) p(`  - [${s.title}](${s.url})`);
    p('- **Evidence-based checklist:**');
    for (const item of b.checklist) p(`  - [ ] ${item}`);
    p();
  }

  // --- Sources + timestamps ---
  p('## Sources & Timestamps');
  if (json.sources.length === 0) {
    p('No source provenance recorded.');
  } else {
    for (const s of json.sources) {
      p(`- \`${s.field}\` from **${s.source}** at ${s.observed_at} (confidence ${s.confidence.toFixed(2)})${s.note ? ` — ${s.note}` : ''}`);
    }
  }
  p();

  // --- Cost + remaining budget ---
  p('## Cost & Budget');
  p(`- **Cap:** $${json.budget.cap_usd.toFixed(2)}`);
  p(`- **Spent:** $${json.budget.spent_usd.toFixed(2)}`);
  p(`- **Remaining:** $${json.budget.remaining_usd.toFixed(2)}`);
  p();

  // --- Limitations (explicit missing data) ---
  p('## Limitations & Missing Data');
  if (json.limitations.length === 0) {
    p('No limitations recorded — every configured provider returned data.');
  } else {
    for (const lim of json.limitations) p(`- ${lim}`);
  }
  p();

  return L.join('\n');
}

/* ------------------------------------------------------------------ */
/* CSV export.                                                         */
/* ------------------------------------------------------------------ */

/** The CSV column order (stable; the header row mirrors it exactly). */
export const CSV_COLUMNS = [
  'keyword',
  'locale',
  'geography',
  'language',
  'search_intent',
  'intent_confidence',
  'opportunity_score',
  'monthly_search_volume',
  'volume_source',
  'organic_keyword_difficulty',
  'paid_competition',
  'cpc',
  'gsc_impressions',
  'gsc_clicks',
  'gsc_ctr',
  'gsc_average_position',
  'trend_direction',
  'trend_momentum',
  'recommended_action',
  'existing_matching_page',
  'recommended_url',
  'confidence',
  'data_freshness',
  'collected_at',
] as const;

/**
 * Flatten opportunities into CSV: a header row + one row per opportunity. A null
 * metric renders as an EMPTY cell (not 0) — the spreadsheet reader must not
 * mistake "unknown" for "zero".
 */
export function toCsv(opportunities: readonly KeywordOpportunity[]): string {
  const header = CSV_COLUMNS.join(',');
  const rows = opportunities.map((o) => {
    const cells: Record<(typeof CSV_COLUMNS)[number], unknown> = {
      keyword: o.keyword,
      locale: o.locale,
      geography: o.geography,
      language: o.language,
      search_intent: o.search_intent,
      intent_confidence: o.intent_confidence,
      opportunity_score: o.opportunity_score,
      monthly_search_volume: o.monthly_search_volume,
      volume_source: o.volume_source,
      organic_keyword_difficulty: o.organic_keyword_difficulty,
      paid_competition: o.paid_competition,
      cpc: o.cpc,
      gsc_impressions: o.gsc_impressions,
      gsc_clicks: o.gsc_clicks,
      gsc_ctr: o.gsc_ctr,
      gsc_average_position: o.gsc_average_position,
      trend_direction: o.trend_direction,
      trend_momentum: o.trend_momentum,
      recommended_action: o.recommended_action,
      existing_matching_page: o.existing_matching_page,
      recommended_url: o.recommended_url,
      confidence: o.confidence,
      data_freshness: o.data_freshness,
      collected_at: o.collected_at,
    };
    return CSV_COLUMNS.map((c) => csvCell(cells[c])).join(',');
  });
  return [header, ...rows].join('\n');
}
