import { describe, expect, it } from 'vitest';
import {
  AUTH_URLS,
  PROVIDER_IDS,
  detectProviders,
  providerById,
  type GetSecretExists,
} from '../src/providers';

/**
 * Build a presence probe from an explicit set of "present" keys. Everything
 * else is treated as absent. ZERO child processes, ZERO network — pure.
 */
function probe(presentKeys: readonly string[]): GetSecretExists {
  const set = new Set(presentKeys);
  return (key: string) => set.has(key);
}

/** Every secret key the suite references. */
const ALL = [
  'DATAFORSEO_LOGIN',
  'DATAFORSEO_PASSWORD',
  'EXA_API_KEY',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_API_KEY',
  'CLOUDFLARE_EMAIL',
];

describe('detectProviders — all credentials present', () => {
  const statuses = detectProviders({ getSecretExists: probe(ALL) });

  it('returns all four providers in canonical order', () => {
    expect(statuses.map((s) => s.id)).toEqual([...PROVIDER_IDS]);
  });

  it('marks DataForSEO present when BOTH login and password exist', () => {
    const d = providerById(statuses, 'dataforseo')!;
    expect(d.status).toBe('present');
    expect(d.missingKeys).toEqual([]);
    expect(d.authUrl).toBeNull();
  });

  it('marks Exa present when EXA_API_KEY exists', () => {
    expect(providerById(statuses, 'exa')!.status).toBe('present');
  });

  it('marks Google needs_consent even when BOTH OAuth client creds exist', () => {
    // A configured OAuth client is NOT an authorized token — consent still pending.
    const g = providerById(statuses, 'google')!;
    expect(g.status).toBe('needs_consent');
    expect(g.authUrl).toBe(AUTH_URLS.google);
  });

  it('marks Cloudflare present when the API token exists', () => {
    expect(providerById(statuses, 'cloudflare')!.status).toBe('present');
  });
});

describe('detectProviders — DataForSEO absent', () => {
  it('is absent when the password is missing (needs BOTH)', () => {
    const statuses = detectProviders({
      getSecretExists: probe(['DATAFORSEO_LOGIN']), // password missing
    });
    const d = providerById(statuses, 'dataforseo')!;
    expect(d.status).toBe('absent');
    expect(d.missingKeys).toEqual(['DATAFORSEO_PASSWORD']);
    expect(d.authUrl).toBe(AUTH_URLS.dataforseo);
  });

  it('is absent when both halves are missing and lists both', () => {
    const statuses = detectProviders({ getSecretExists: probe([]) });
    const d = providerById(statuses, 'dataforseo')!;
    expect(d.status).toBe('absent');
    expect(d.missingKeys).toEqual(['DATAFORSEO_LOGIN', 'DATAFORSEO_PASSWORD']);
  });
});

describe('detectProviders — GSC needs consent vs absent', () => {
  it('needs_consent when BOTH OAuth client id + secret are present', () => {
    const statuses = detectProviders({
      getSecretExists: probe(['GOOGLE_OAUTH_CLIENT_ID', 'GOOGLE_OAUTH_CLIENT_SECRET']),
    });
    const g = providerById(statuses, 'google')!;
    expect(g.status).toBe('needs_consent');
    expect(g.missingKeys).toEqual([]);
    expect(g.authUrl).toContain('webmasters.readonly');
  });

  it('absent when only the client id is present (secret missing)', () => {
    const statuses = detectProviders({
      getSecretExists: probe(['GOOGLE_OAUTH_CLIENT_ID']),
    });
    const g = providerById(statuses, 'google')!;
    expect(g.status).toBe('absent');
    expect(g.missingKeys).toEqual(['GOOGLE_OAUTH_CLIENT_SECRET']);
  });
});

describe('detectProviders — Cloudflare OR-logic', () => {
  it('present via the legacy API key + email pair (no token)', () => {
    const statuses = detectProviders({
      getSecretExists: probe(['CLOUDFLARE_API_KEY', 'CLOUDFLARE_EMAIL']),
    });
    const c = providerById(statuses, 'cloudflare')!;
    expect(c.status).toBe('present');
    expect(c.detail).toContain('legacy');
  });

  it('absent when a key exists but the email does not', () => {
    const statuses = detectProviders({
      getSecretExists: probe(['CLOUDFLARE_API_KEY']), // email missing, no token
    });
    const c = providerById(statuses, 'cloudflare')!;
    expect(c.status).toBe('absent');
    expect(c.missingKeys).toContain('CLOUDFLARE_EMAIL');
    expect(c.authUrl).toBe(AUTH_URLS.cloudflare);
  });
});

describe('detectProviders — reality fixture (what the live CLI sees)', () => {
  it('DataForSEO absent, Exa present, GSC needs_consent, Cloudflare present', () => {
    // Mirrors the real sandbox: Exa + Cloudflare + Google OAuth client present;
    // DataForSEO creds absent. Deterministic, no child process.
    const statuses = detectProviders({
      getSecretExists: probe([
        'EXA_API_KEY',
        'GOOGLE_OAUTH_CLIENT_ID',
        'GOOGLE_OAUTH_CLIENT_SECRET',
        'CLOUDFLARE_API_TOKEN',
        'CLOUDFLARE_API_KEY',
        'CLOUDFLARE_EMAIL',
      ]),
    });
    expect(providerById(statuses, 'dataforseo')!.status).toBe('absent');
    expect(providerById(statuses, 'exa')!.status).toBe('present');
    expect(providerById(statuses, 'google')!.status).toBe('needs_consent');
    expect(providerById(statuses, 'cloudflare')!.status).toBe('present');
  });
});
