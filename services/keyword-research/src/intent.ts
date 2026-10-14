/**
 * Pure, deterministic search-intent classifier.
 *
 * `classifyIntent(keyword)` reads the dominant intent of a query from lexical
 * signals ONLY — no network, no clock, no RNG. Identical input always yields
 * identical output.
 *
 * Signal precedence (a query may trip several cues; the ranking below decides
 * the winner, and conflicting *high-confidence* cues produce `mixed`):
 *   transactional  buy | price | pricing | cost | cheap | deal | coupon | …
 *   comparison     best | top | review | vs | versus | alternative | compare | …
 *   informational  how | what | why | guide | tutorial | examples | …
 *   local          "near me" | an explicit city/state | a US ZIP
 *   navigational   login | signin | a known brand token | a bare domain
 *   commercial     (fallback) software | tool | service | platform | api modifiers
 *   informational  (ultimate fallback)
 *
 * `mixed` is emitted when two *different* strong intents both fire (e.g.
 * "buy vs rent"): transactional AND comparison cues together are genuinely
 * ambiguous, so we refuse to over-commit and hand the scorer a neutral value.
 */
import type { SearchIntent } from './types';

/** The classification result. `confidence` is 0..1. */
export interface IntentResult {
  intent: SearchIntent;
  /** 0..1 confidence in the classified intent. */
  confidence: number;
}

/** A matched intent "channel" with the weight we give its strongest cue. */
type Channel =
  | 'transactional'
  | 'comparison'
  | 'informational'
  | 'local'
  | 'navigational'
  | 'commercial';

/**
 * Lowercase, collapse internal whitespace, strip surrounding punctuation. Kept
 * deliberately simple + ASCII-lenient so it's predictable across locales.
 */
function normalizeKeyword(keyword: string): string {
  return keyword.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Word-boundary test for a single token against a normalized phrase. */
function hasWord(haystack: string, word: string): boolean {
  // Build a boundary-anchored matcher. `word` is a literal from our own tables
  // (never user input routed into a RegExp), so escaping is belt-and-braces.
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(haystack);
}

/** True if ANY of the words appears as a whole token. */
function hasAnyWord(haystack: string, words: readonly string[]): boolean {
  return words.some((w) => hasWord(haystack, w));
}

/* ------------------------------------------------------------------ */
/* Cue tables (single-token unless noted). Order within a table is     */
/* irrelevant; presence is all that matters.                           */
/* ------------------------------------------------------------------ */

const TRANSACTIONAL = [
  'buy',
  'price',
  'pricing',
  'cost',
  'cheap',
  'deal',
  'deals',
  'coupon',
  'coupons',
  'discount',
  'order',
  'purchase',
  'subscription',
] as const;

const COMPARISON = [
  'best',
  'top',
  'review',
  'reviews',
  'vs',
  'versus',
  'alternative',
  'alternatives',
  'compare',
  'comparison',
] as const;

const INFORMATIONAL = [
  'how',
  'what',
  'why',
  'when',
  'where',
  'guide',
  'tutorial',
  'tutorials',
  'examples',
  'example',
  'learn',
  'tips',
  'ideas',
] as const;

const NAVIGATIONAL = [
  'login',
  'log',
  'signin',
  'sign',
  'account',
  'dashboard',
  'portal',
] as const;

/** Commercial-investigation modifiers — the "software/tool/service" fallback. */
const COMMERCIAL_MODIFIERS = [
  'software',
  'tool',
  'tools',
  'service',
  'services',
  'platform',
  'api',
  'app',
  'solution',
  'solutions',
  'provider',
  'vendor',
  'saas',
] as const;

/**
 * A small set of well-known brand tokens. A bare brand query ("stripe",
 * "shopify login") reads as navigational. Deliberately tiny + explicit — we do
 * NOT guess brands, we only recognize a curated list.
 */
const KNOWN_BRANDS = [
  'stripe',
  'shopify',
  'hubspot',
  'salesforce',
  'notion',
  'figma',
  'slack',
  'zoom',
  'github',
  'cloudflare',
] as const;

/** US two-letter state codes — a trailing one is a strong `local` cue. */
const US_STATES = [
  'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia',
  'ks','ky','la','me','md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj',
  'nm','ny','nc','nd','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','vt',
  'va','wa','wv','wi','wy',
] as const;

/** Matches a US ZIP as a standalone token (5-digit or ZIP+4). */
const ZIP_RE = /(^|[^0-9])\d{5}(-\d{4})?([^0-9]|$)/;

/**
 * Detect a local signal: the explicit phrase "near me", a trailing US state
 * code, or a ZIP anywhere in the query. (A city name isn't reliably detectable
 * from lexicon alone, so we key off the structured cues we CAN trust.)
 */
function hasLocalCue(normalized: string): boolean {
  if (normalized.includes('near me')) return true;
  if (ZIP_RE.test(normalized)) return true;
  // Trailing state code, e.g. "plumber austin tx".
  const tokens = normalized.split(' ');
  const last = tokens[tokens.length - 1];
  if (last && (US_STATES as readonly string[]).includes(last)) return true;
  return false;
}

/** Detect a navigational signal: brand token, auth word, or a bare domain. */
function hasNavigationalCue(normalized: string): boolean {
  if (hasAnyWord(normalized, NAVIGATIONAL)) return true;
  if (hasAnyWord(normalized, KNOWN_BRANDS)) return true;
  // A bare domain like "projectsites.dev" or "www.example.com".
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(normalized.replace(/\s+/g, ''))) return true;
  return false;
}

/**
 * Classify the dominant intent of a keyword with a 0..1 confidence.
 *
 * Confidence reflects how cleanly the signals resolved:
 *  - a single strong channel firing → high (0.8)
 *  - a fallback (commercial modifier / ultimate informational) → lower (0.55 / 0.4)
 *  - two strong channels conflicting → `mixed` at moderate confidence (0.5)
 */
export function classifyIntent(keyword: string): IntentResult {
  const normalized = normalizeKeyword(keyword);
  if (normalized === '') {
    // Nothing to read — neutral, low confidence.
    return { intent: 'informational', confidence: 0.3 };
  }

  // Which strong channels fired?
  const fired: Channel[] = [];
  if (hasAnyWord(normalized, TRANSACTIONAL)) fired.push('transactional');
  if (hasAnyWord(normalized, COMPARISON)) fired.push('comparison');
  if (hasAnyWord(normalized, INFORMATIONAL)) fired.push('informational');
  if (hasLocalCue(normalized)) fired.push('local');
  if (hasNavigationalCue(normalized)) fired.push('navigational');

  // --- Conflict → mixed. Two DIFFERENT strong intents is genuine ambiguity. ---
  // Informational cues are weak signposts (question words), so they don't, on
  // their own, make a transactional/comparison query "mixed". But two primary
  // commercial-ish channels together (e.g. transactional + comparison) do.
  const strong = fired.filter((c) => c === 'transactional' || c === 'comparison' || c === 'local');
  const distinctStrong = new Set(strong);
  if (distinctStrong.size >= 2) {
    return { intent: 'mixed', confidence: 0.5 };
  }

  // --- Single strong channel, by precedence. ---
  if (fired.includes('transactional')) return { intent: 'transactional', confidence: 0.8 };
  if (fired.includes('comparison')) return { intent: 'comparison', confidence: 0.8 };
  if (fired.includes('local')) return { intent: 'local', confidence: 0.75 };
  if (fired.includes('informational')) return { intent: 'informational', confidence: 0.75 };
  if (fired.includes('navigational')) return { intent: 'navigational', confidence: 0.7 };

  // --- Fallbacks. ---
  // Commercial investigation: a "software/tool/service/platform/api" modifier
  // with no stronger cue reads as commercial-intent research.
  if (hasAnyWord(normalized, COMMERCIAL_MODIFIERS)) {
    return { intent: 'commercial', confidence: 0.55 };
  }

  // Ultimate fallback: treat as informational at low confidence.
  return { intent: 'informational', confidence: 0.4 };
}
