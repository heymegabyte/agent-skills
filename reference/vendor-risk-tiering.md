# Vendor Risk Tiering — implementation reference

Sourced on demand by rules/vendor-risk-tiering.md.

---

## Abstraction layer example (Amazon SES / load-bearing vendor)

The abstraction layer is a thin service module, not a generic interface. It wraps
the vendor call into domain language so that if the vendor changes its API, there is
one place to fix.

```ts
// worker/services/email.ts  — wraps Amazon SES (load-bearing)
import { AwsClient } from 'aws4fetch'

export interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmail(env: Env, payload: EmailPayload): Promise<void> {
  const region = env.SES_REGION ?? 'us-east-1'
  const aws = new AwsClient({ accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY, region, service: 'ses' })
  const res = await aws.fetch(`https://email.${region}.amazonaws.com/v2/email/outbound-emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      FromEmailAddress: payload.from ?? env.EMAIL_FROM ?? 'noreply@megabyte.space',
      Destination: { ToAddresses: Array.isArray(payload.to) ? payload.to : [payload.to] },
      Content: { Simple: { Subject: { Data: payload.subject }, Body: { Html: { Data: payload.html } } } },
    }),
  })
  if (!res.ok) throw new Error(`SES send failed: ${res.status} ${await res.text()}`)
}
// Consumers call sendEmail(env, {...}) — never call SES directly elsewhere
```

---

## ARCHITECTURE.md vendor section template

Add this section to every project's `ARCHITECTURE.md` at integration time.

```md
## Vendor Inventory

| Vendor | Tier | Replacement plan |
|--------|------|-----------------|
| Cloudflare (Workers/D1/R2/DO) | Load-bearing (intentional) | N/A — lock-in by design |
| Better Auth | Load-bearing | Replace with CF Access + custom JWT in ~2 weeks; migrate user table, swap auth middleware |
| Stripe | Load-bearing | Replace with Square Billing if <$1K MRR; ~1 week migration, data export via Stripe API |
| Amazon SES | Load-bearing | Swap `worker/services/email.ts` internals to another SMTP/API rail in ~3 days; one module to change |
| PostHog | Replaceable | Swap analytics SDK; 1 day |
| Sentry | Replaceable | Swap error SDK; half day |
| Upstash | Replaceable | Replace with CF KV; 1 day |
```

---

## Secret rotation calendar entries (load-bearing vendors)

Add one entry per load-bearing vendor to `~/.claude/rules/secret-rotation-calendar.md`:

```sh
# Better Auth BETTER_AUTH_SECRET — rotate every 90 days — next: YYYY-MM-DD
# Stripe STRIPE_SECRET_KEY — rotate every 90 days — next: YYYY-MM-DD
# Amazon SES AWS_SECRET_ACCESS_KEY — rotate every 90 days — next: YYYY-MM-DD
```
