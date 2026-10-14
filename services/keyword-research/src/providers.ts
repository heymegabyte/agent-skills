/// <reference types="node" />
/**
 * Provider detection for the keyword-research control plane.
 *
 * This module answers ONE question per provider: "do we have the credentials to
 * use it, and if not, what's the exact next step to unblock it?" — WITHOUT ever
 * reading, logging, or returning a secret's VALUE. Presence is checked purely by
 * the exit code of `get-secret -e <KEY>`:
 *
 *   exit 0  → the secret exists (in env or the chezmoi secret store)
 *   exit ≠0 → the secret is absent
 *
 * The value never crosses this boundary. `get-secret -e` prints nothing to
 * stdout on success, and we discard all of its stdio regardless; the sole signal
 * we consume is the process exit status.
 *
 * `getSecretExists` is INJECTED so tests drive detection deterministically with
 * ZERO child processes and ZERO network calls. The default implementation shells
 * out to the real helper.
 */
import { spawnSync } from 'node:child_process';

/** Absolute path to the presence-only secret helper. */
export const GET_SECRET_BIN = '/Users/Apple/.local/bin/get-secret';

/** The providers the control plane knows how to detect. */
export const PROVIDER_IDS = ['dataforseo', 'exa', 'google', 'cloudflare'] as const;
export type ProviderId = (typeof PROVIDER_IDS)[number];

/**
 * Detection status for a single provider.
 *  - `present`      — all required credentials exist; the provider is usable.
 *  - `needs_consent`— credentials exist but an interactive/OAuth step remains
 *                     (e.g. a Google OAuth client is configured but no user has
 *                     granted the `webmasters.readonly` scope yet).
 *  - `absent`       — one or more required credentials are missing.
 */
export type ProviderStatusKind = 'present' | 'needs_consent' | 'absent';

/** A fully-resolved status row for one provider. */
export interface ProviderStatus {
  id: ProviderId;
  /** Human-facing provider label, e.g. "DataForSEO". */
  label: string;
  status: ProviderStatusKind;
  /** Short note explaining WHY the status is what it is (never a secret value). */
  detail: string;
  /** Which required secret keys were checked (names only — never values). */
  requiredKeys: string[];
  /** The exact keys that were found missing (empty when fully present). */
  missingKeys: string[];
  /**
   * The exact URL a human visits to obtain/authorize the missing credentials.
   * `null` when nothing is needed (status === 'present').
   */
  authUrl: string | null;
  /**
   * A FREE validation endpoint that WOULD confirm the credentials if they were
   * present. Informational only — detection NEVER calls it. `null` when the
   * provider exposes no free self-test.
   */
  freeValidationEndpoint: string | null;
}

/** Presence-only secret probe. Returns `true` iff the key exists. */
export type GetSecretExists = (key: string) => boolean;

/**
 * Secret VALUE reader. Returns the key's value, or `null` if absent. UNLIKE the
 * presence probe this DOES cross the value boundary, so it is used ONLY on the
 * live (non-dry-run, creds-present) harvest path — never in `setup`/`health`/
 * dry-run, and never logged. Injected so tests can drive the live path with
 * fakes and ZERO child processes.
 */
export type GetSecretValue = (key: string) => string | null;

/**
 * Default value reader: shell `get-secret <KEY>` and capture stdout. A clean
 * exit 0 with non-empty stdout is the value; anything else is `null` (absent).
 * The value is returned to the caller but NEVER printed by this module.
 */
export const defaultGetSecretValue: GetSecretValue = (key) => {
  const res = spawnSync(GET_SECRET_BIN, [key], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    shell: false,
  });
  if (res.error || res.status !== 0) return null;
  const value = (res.stdout ?? '').trim();
  return value === '' ? null : value;
};

/** Options for {@link detectProviders}. */
export interface DetectProvidersOptions {
  /** Injectable presence probe. Defaults to {@link defaultGetSecretExists}. */
  getSecretExists?: GetSecretExists;
}

/**
 * Default presence probe: shell `get-secret -e <KEY>` and read ONLY its exit
 * code. All stdio is discarded so a value can never leak into our process.
 *
 * `spawnSync` with `stdio: 'ignore'` means nothing is captured or printed; a
 * `status` of 0 is presence, anything else (including a spawn error, surfaced as
 * a non-zero/`null` status) is treated as absence — fail CLOSED, never pretend a
 * secret exists.
 */
export const defaultGetSecretExists: GetSecretExists = (key) => {
  const res = spawnSync(GET_SECRET_BIN, ['-e', key], {
    stdio: 'ignore',
    // Never inherit a shell; invoke the binary directly.
    shell: false,
  });
  // A clean exit 0 == present. A spawn failure (`res.error`) or any non-zero
  // status == absent.
  if (res.error) return false;
  return res.status === 0;
};

/** The canonical auth / provisioning URLs (surfaced verbatim to the user). */
export const AUTH_URLS = {
  dataforseo: 'https://app.dataforseo.com/api-access',
  exa: 'https://dashboard.exa.ai/api-keys',
  /** Google OAuth consent screen for the Search Console read scope. */
  google:
    'https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/webmasters.readonly',
  cloudflare: 'https://dash.cloudflare.com/profile/api-tokens',
} as const satisfies Record<ProviderId, string>;

/**
 * FREE self-test endpoints (NEVER called during detection; shown so `health`
 * can say what it WOULD do once creds exist).
 */
export const FREE_VALIDATION_ENDPOINTS: Partial<Record<ProviderId, string>> = {
  // Appendix/user_data is DataForSEO's free "who am I + balance" endpoint.
  dataforseo: 'https://api.dataforseo.com/v3/appendix/user_data',
  // Cloudflare's token self-verify is free.
  cloudflare: 'https://api.cloudflare.com/client/v4/user/tokens/verify',
};

/** Detect the DataForSEO provider — needs BOTH login AND password. */
function detectDataForSeo(exists: GetSecretExists): ProviderStatus {
  const requiredKeys = ['DATAFORSEO_LOGIN', 'DATAFORSEO_PASSWORD'];
  const missingKeys = requiredKeys.filter((k) => !exists(k));
  const present = missingKeys.length === 0;
  return {
    id: 'dataforseo',
    label: 'DataForSEO',
    status: present ? 'present' : 'absent',
    detail: present
      ? 'Both DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD present.'
      : `Missing ${missingKeys.join(' + ')}. DataForSEO is the primary demand/difficulty source.`,
    requiredKeys,
    missingKeys,
    authUrl: present ? null : AUTH_URLS.dataforseo,
    freeValidationEndpoint: FREE_VALIDATION_ENDPOINTS.dataforseo ?? null,
  };
}

/** Detect the Exa provider — needs a single API key. */
function detectExa(exists: GetSecretExists): ProviderStatus {
  const requiredKeys = ['EXA_API_KEY'];
  const missingKeys = requiredKeys.filter((k) => !exists(k));
  const present = missingKeys.length === 0;
  return {
    id: 'exa',
    label: 'Exa',
    status: present ? 'present' : 'absent',
    detail: present
      ? 'EXA_API_KEY present.'
      : 'Missing EXA_API_KEY. Exa supplies citation evidence only (never metrics).',
    requiredKeys,
    missingKeys,
    authUrl: present ? null : AUTH_URLS.exa,
    freeValidationEndpoint: FREE_VALIDATION_ENDPOINTS.exa ?? null,
  };
}

/**
 * Detect Google / Search Console.
 *  - Both OAuth client id AND secret present → `needs_consent` (the app is
 *    configured, but a user still has to grant the webmasters.readonly scope
 *    before any first-party data can be read).
 *  - Otherwise → `absent`.
 * We never claim `present`, because a configured OAuth client is NOT the same as
 * an authorized token — that only exists after the interactive consent step.
 */
function detectGoogle(exists: GetSecretExists): ProviderStatus {
  const requiredKeys = ['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET'];
  const missingKeys = requiredKeys.filter((k) => !exists(k));
  const configured = missingKeys.length === 0;
  return {
    id: 'google',
    label: 'Google / Search Console',
    status: configured ? 'needs_consent' : 'absent',
    detail: configured
      ? 'OAuth client configured; a user must grant the webmasters.readonly scope before Search Console data can be read.'
      : `Missing ${missingKeys.join(' + ')}. Configure a Google OAuth client to enable first-party Search Console data.`,
    requiredKeys,
    missingKeys,
    // Either way the human's next step is the consent screen URL.
    authUrl: AUTH_URLS.google,
    freeValidationEndpoint: null,
  };
}

/**
 * Detect Cloudflare — satisfied by EITHER a scoped API token OR the legacy
 * global-key + account-email pair.
 */
function detectCloudflare(exists: GetSecretExists): ProviderStatus {
  const hasToken = exists('CLOUDFLARE_API_TOKEN');
  const hasKey = exists('CLOUDFLARE_API_KEY');
  const hasEmail = exists('CLOUDFLARE_EMAIL');
  const hasLegacyPair = hasKey && hasEmail;
  const present = hasToken || hasLegacyPair;

  // Report what's missing in a way that reflects the OR relationship.
  const missingKeys: string[] = [];
  if (!present) {
    missingKeys.push('CLOUDFLARE_API_TOKEN');
    if (!hasKey) missingKeys.push('CLOUDFLARE_API_KEY');
    if (!hasEmail) missingKeys.push('CLOUDFLARE_EMAIL');
  }

  let detail: string;
  if (hasToken) {
    detail = 'CLOUDFLARE_API_TOKEN present.';
  } else if (hasLegacyPair) {
    detail = 'CLOUDFLARE_API_KEY + CLOUDFLARE_EMAIL present (legacy global-key auth).';
  } else {
    detail =
      'Missing Cloudflare auth: supply CLOUDFLARE_API_TOKEN (preferred) OR CLOUDFLARE_API_KEY + CLOUDFLARE_EMAIL.';
  }

  return {
    id: 'cloudflare',
    label: 'Cloudflare',
    status: present ? 'present' : 'absent',
    detail,
    // Document both accepted shapes for the user.
    requiredKeys: ['CLOUDFLARE_API_TOKEN | (CLOUDFLARE_API_KEY + CLOUDFLARE_EMAIL)'],
    missingKeys,
    authUrl: present ? null : AUTH_URLS.cloudflare,
    freeValidationEndpoint: FREE_VALIDATION_ENDPOINTS.cloudflare ?? null,
  };
}

/**
 * Detect every provider's credential status. PURE with respect to its injected
 * `getSecretExists` probe — no network, no value ever read. Returns statuses in
 * the canonical {@link PROVIDER_IDS} order.
 */
export function detectProviders(
  options: DetectProvidersOptions = {},
): ProviderStatus[] {
  const exists = options.getSecretExists ?? defaultGetSecretExists;
  return [
    detectDataForSeo(exists),
    detectExa(exists),
    detectGoogle(exists),
    detectCloudflare(exists),
  ];
}

/** Convenience: find a single provider's status by id. */
export function providerById(
  statuses: readonly ProviderStatus[],
  id: ProviderId,
): ProviderStatus | undefined {
  return statuses.find((s) => s.id === id);
}
