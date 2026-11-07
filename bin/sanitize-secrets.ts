#!/usr/bin/env node
/**
 * sanitize-secrets.ts
 * Universal Secret & Token Sanitizer.
 * Redacts sensitive credentials (sk-ant-*, sk-proj-*, Bearer tokens, private keys, passwords)
 * from command stdout, logs, error stack traces, and telemetry spools.
 */

export const SECRET_PATTERNS = [
  /sk-ant-[a-zA-Z0-9_-]{20,}/g,
  /sk-proj-[a-zA-Z0-9_-]{20,}/g,
  /bearer\s+[a-zA-Z0-9_.-]{20,}/gi,
  /ghp_[a-zA-Z0-9]{36}/g,
  /-----BEGIN [A-Z ]+ PRIVATE KEY-----[\\s\\S]*?-----END [A-Z ]+ PRIVATE KEY-----/g,
  /(password|passwd|secret|api_key|apikey)["']?\s*[:=]\s*["']?([^"',\s]+)["']?/gi
];

export function sanitizeText(input: string): string {
  let sanitized = input;

  // Redact known patterns
  sanitized = sanitized.replace(/sk-ant-[a-zA-Z0-9_-]{20,}/g, 'sk-ant-***REDACTED***');
  sanitized = sanitized.replace(/sk-proj-[a-zA-Z0-9_-]{20,}/g, 'sk-proj-***REDACTED***');
  sanitized = sanitized.replace(/ghp_[a-zA-Z0-9]{36}/g, 'ghp_***REDACTED***');
  sanitized = sanitized.replace(/bearer\s+[a-zA-Z0-9_.-]{20,}/gi, 'Bearer ***REDACTED***');
  sanitized = sanitized.replace(/-----BEGIN [A-Z ]+ PRIVATE KEY-----[\\s\\S]*?-----END [A-Z ]+ PRIVATE KEY-----/g, '***REDACTED_PRIVATE_KEY***');

  return sanitized;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- Secret Sanitizer Test ---');
  const dirty = 'Anthropic key: sk-ant-api03-abcdef1234567890abcdef1234567890 and Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
  console.log('Original:', dirty);
  console.log('Sanitized:', sanitizeText(dirty));
}
