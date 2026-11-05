# Email Deliverability — implementation reference

Sourced on demand by rules/email-deliverability-implementation.md.

## SPF — DNS record examples

```dns
; Minimal SES-only sender (1 lookup)
megabyte.space.  TXT  "v=spf1 include:amazonses.com ~all"

; Multi-vendor chain (common SaaS stack — count your lookups)
megabyte.space.  TXT  "v=spf1
  include:amazonses.com            ; 1 — transactional (Amazon SES)
  include:sendgrid.net             ; 2 — marketing (SendGrid fallback)
  include:_spf.google.com          ; 3 — G Suite / Workspace
  ip4:104.18.0.0/16                ; 0 — CF IP, counts as ip4 (not a lookup)
  ~all"
; Total: 3 lookups. Budget: 7 remaining.
```

## SPF — SES domain provision + CF DNS push

```ts
// scripts/provision-ses-dns.ts
import { AwsClient } from 'aws4fetch'

const region = SES_REGION ?? 'us-east-1'
const aws = new AwsClient({ accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY, region, service: 'ses' })

// Create the SES email identity — returns 3 EasyDKIM CNAME tokens
const identity = await aws.fetch(`https://email.${region}.amazonaws.com/v2/email/identities`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ EmailIdentity: 'megabyte.space' }),
}).then(r => r.json())

// identity.DkimAttributes.Tokens = 3 tokens → each is a CNAME:
//   <token>._domainkey.megabyte.space  CNAME  <token>.dkim.amazonses.com
// plus SPF (include:amazonses.com) → push all to CF Zones API
const records = [
  { type: 'TXT', name: 'megabyte.space', value: 'v=spf1 include:amazonses.com ~all' },
  ...identity.DkimAttributes.Tokens.map((t: string) => ({
    type: 'CNAME',
    name: `${t}._domainkey.megabyte.space`,
    value: `${t}.dkim.amazonses.com`,
  })),
]
for (const record of records) {
  await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/dns_records`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: record.type, name: record.name, content: record.value, ttl: 1 }),
  })
}
```

## DKIM — SES EasyDKIM (3 CNAME tokens, SES-managed keys)

```bash
# SES EasyDKIM mints + rotates the 2048-bit keys for you — no local openssl.
# create-email-identity returns 3 DKIM tokens; each becomes a CNAME delegation.
aws sesv2 create-email-identity --email-identity megabyte.space \
  --query 'DkimAttributes.Tokens' --output text
# → token1  token2  token3
```

DNS records for the 3 EasyDKIM tokens (CNAME delegation, not a published TXT key):

```dns
token1._domainkey.megabyte.space.  CNAME  token1.dkim.amazonses.com.
token2._domainkey.megabyte.space.  CNAME  token2.dkim.amazonses.com.
token3._domainkey.megabyte.space.  CNAME  token3.dkim.amazonses.com.
```

SES key rotation (SES-managed — no manual selector swap):

```ts
// EasyDKIM rotates keys on SES's schedule; force the next signing key manually:
await aws.fetch(`https://email.${region}.amazonaws.com/v2/email/identities/megabyte.space/dkim`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ SigningAttributes: { NextSigningKeyLength: 'RSA_2048_BIT' } }),
})
// The 3 CNAMEs stay valid — SES rotates the key behind them, no DNS change needed.
```

## DMARC — DNS records for each phase

### Phase 1 — Monitoring

```dns
_dmarc.megabyte.space.  TXT  "v=DMARC1; p=none; rua=mailto:dmarc-rua@megabyte.space; ruf=mailto:dmarc-ruf@megabyte.space; fo=1; adkim=r; aspf=r; ri=86400"
```

### Phase 2 — Quarantine (start pct=25, ramp to 100)

```dns
_dmarc.megabyte.space.  TXT  "v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc-rua@megabyte.space; adkim=s; aspf=s"
```

### Phase 3 — Reject (final state, prerequisite for BIMI)

```dns
_dmarc.megabyte.space.  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc-rua@megabyte.space; adkim=s; aspf=s"
```

## DMARC policy gate check

```ts
const dmarc = await resolveTxt(`_dmarc.${domain}`)
const policy = dmarc[0]?.join('').match(/p=(\w+)/)?.[1]
if (!policy) throw new Error('DMARC record missing')
if (policy === 'none') console.warn('DMARC in monitoring mode — not enforced')
if (!['quarantine', 'reject'].includes(policy)) throw new Error(`DMARC policy too weak: ${policy}`)
```

## BIMI — DNS record

Add AFTER `p=reject` has been stable for ≥2 weeks and VMC is issued:

```dns
default._bimi.megabyte.space.  TXT  "v=BIMI1; l=https://megabyte.space/.well-known/logo.svg; a=https://megabyte.space/.well-known/bimi.pem"
```

`a=` is the hosted VMC PEM (certificate chain from Entrust/DigiCert). Without `a=`, only Yahoo shows the logo; Gmail requires VMC.

## One-click unsubscribe — SES v2 send headers

```ts
// SES v2 SendEmail with unsubscribe headers (marketing sends only)
import { AwsClient } from 'aws4fetch'
const region = env.SES_REGION ?? 'us-east-1'
const aws = new AwsClient({ accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY, region, service: 'ses' })

await aws.fetch(`https://email.${region}.amazonaws.com/v2/email/outbound-emails`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    FromEmailAddress: 'Brian <brian@megabyte.space>',
    Destination: { ToAddresses: [recipientEmail] },
    Content: {
      Simple: {
        Subject: { Data: 'Your weekly digest' },
        Body: { Html: { Data: emailHtml } },
        Headers: [
          { Name: 'List-Unsubscribe', Value: `<https://${DOMAIN}/api/unsubscribe?token=${hmacToken}>` },
          { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
          { Name: 'X-Category', Value: 'marketing' }, // internal classification; not shown to recipient
        ],
      },
    },
  }),
})
```

## HMAC token — construction + verification

```ts
// src/worker/lib/unsubscribe-token.ts
export async function createUnsubscribeToken(email: string, audienceId: string, env: Env): Promise<string> {
  const payload = `${email}:${audienceId}:${Math.floor(Date.now() / 86400000)}` // daily rotation
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(env.UNSUBSCRIBE_HMAC_KEY),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '')
    + '.' + btoa(payload).replace(/=/g, '')
}

export async function verifyUnsubscribeToken(token: string, env: Env): Promise<{ email: string, audienceId: string } | null> {
  const [sig, encodedPayload] = token.split('.')
  if (!sig || !encodedPayload) return null
  const payload = atob(encodedPayload)
  const [email, audienceId, day] = payload.split(':')
  // Allow current day + previous day (handles timezone edge at midnight)
  const today = Math.floor(Date.now() / 86400000)
  if (Number(day) < today - 1) return null // expired
  // Re-sign and compare
  const expected = await createUnsubscribeToken(email, audienceId, env)
  return expected.startsWith(sig) ? { email, audienceId } : null
}
```

## One-click unsubscribe — Hono endpoint

```ts
// src/worker/routes/unsubscribe.ts
app.post('/api/unsubscribe', async (c) => {
  const body = await c.req.text()
  if (!body.includes('List-Unsubscribe=One-Click')) return c.text('Bad request', 400)

  const token = new URL(c.req.url).searchParams.get('token')
  if (!token) return c.text('Missing token', 400)

  const parsed = await verifyUnsubscribeToken(token, c.env)
  if (!parsed) return c.text('Invalid or expired token', 400)

  // Remove from the Listmonk/suppression list
  await fetch(
    `${c.env.LISTMONK_URL}/api/subscribers/${encodeURIComponent(parsed.email)}/lists/${parsed.audienceId}`,
    { method: 'DELETE', headers: { Authorization: `Basic ${c.env.LISTMONK_AUTH}` } }
  )

  // Record in D1 suppression list (avoid re-adding on list import)
  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO email_suppressions (email, reason, created_at)
     VALUES (?, 'one_click_unsubscribe', ?)`
  ).bind(parsed.email, new Date().toISOString()).run()

  return c.text('Unsubscribed', 200)
})
```

## Build gate — `validate-email-auth.mjs`

```ts
// scripts/validate-email-auth.mjs
import { resolveTxt } from 'node:dns/promises'

const domain = process.env.SENDING_DOMAIN ?? 'megabyte.space'

// SPF
const spf = await resolveTxt(domain)
const spfRecord = spf.flat().find(r => r.startsWith('v=spf1'))
if (!spfRecord) throw new Error('SPF record missing')
if (!spfRecord.includes('include:amazonses.com')) console.warn('Amazon SES SPF include missing')

// DKIM — SES EasyDKIM delegates via 3 CNAMEs (<token>._domainkey → <token>.dkim.amazonses.com),
// so resolve the CNAME target rather than a published TXT key.
import { resolveCname } from 'node:dns/promises'
for (const token of (process.env.SES_DKIM_TOKENS ?? '').split(',').filter(Boolean)) {
  try {
    const target = await resolveCname(`${token}._domainkey.${domain}`)
    if (!target.some(t => t.endsWith('.dkim.amazonses.com'))) throw new Error()
    console.log(`✓ SES DKIM CNAME ${token} delegated`)
  } catch {
    console.warn(`SES DKIM CNAME ${token} not found (re-run create-email-identity + push CNAMEs)`)
  }
}

// DMARC
const dmarc = await resolveTxt(`_dmarc.${domain}`)
const dmarcRecord = dmarc.flat().find(r => r.startsWith('v=DMARC1'))
if (!dmarcRecord) throw new Error('DMARC record missing')
const policy = dmarcRecord.match(/p=(\w+)/)?.[1]
if (!policy || policy === 'none') {
  console.warn('DMARC policy=none — monitoring only, not enforced')
} else {
  console.log(`✓ DMARC policy=${policy}`)
}
console.log('Email auth validation complete')
```
