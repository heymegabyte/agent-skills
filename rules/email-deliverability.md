---
last_reviewed: 2026-10-08
superseded_by: null
name: "email-deliverability"
priority: 3
pack: "infra"
triggers:
  - "email"
  - "ses"
  - "amazon ses"
  - "transactional email"
  - "magic link"
  - "smtp"
  - "bounce"
  - "deliverability"
  - "list-unsubscribe"
paths:
  - "concern:email"
---

# Email Deliverability

Email that bounces is a feature that silently doesn't work. Since Feb 2024 (Google + Yahoo) and May 2025 (Microsoft), any domain sending bulk mail to Gmail/Yahoo/Outlook MUST authenticate and offer one-click unsubscribe or messages get **rejected at SMTP** — not spam-foldered, bounced. Gmail's permanent 550 rejections fully enforced since Nov 2025; Microsoft hard-rejects since Apr 2026, fully active May 2026. A broken signup confirmation, receipt, or digest is invisible until a user reports it. This gate is non-negotiable on every project that sends mail.

## The rail — Amazon SES, always (NEVER Resend/SendGrid)

- **Amazon SES is the SOLE transactional email rail on every emdash project.** Do not use, suggest, or scaffold any other transactional email API. Bulk/marketing = Listmonk relaying through SES SMTP. (SendGrid exists only as a documented break-glass, never a default.)
- On Cloudflare Workers, send via the **SES v2 `SendEmail` API** SigV4-signed with `aws4fetch` (Workers-native, no Node SDK). Reference impl: `deskl.ink` `workers/api/src/email/ses.ts` — never throws, returns a structured result to log. Credentials (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) are platform secrets from `get-secret`; `SES_REGION` + `EMAIL_FROM` are vars.
- Send from the **project's own apex/subdomain** (`login@deskl.ink`), never a borrowed display-name sender on someone else's verified domain — alignment + brand trust both depend on it.

## Auto-provision the sending domain (do this without asking — the credentials are already available)

When a project needs to send mail, configure SES for its domain automatically using the AWS credentials from `get-secret` + the Cloudflare zone API — do not hand the user a manual checklist:

1. `aws sesv2 create-email-identity --email-identity <domain>` (EasyDKIM on) → returns **3 DKIM CNAME tokens**.
2. Write all 3 as **un-proxied CNAMEs** to the domain's Cloudflare DNS zone (zone API per `secret-provisioning`). Add SPF (`v=spf1 include:amazonses.com ~all`) + a DMARC record (`p=none` → tighten to `quarantine`/`reject`).
3. Poll `aws sesv2 get-email-identity --email-identity <domain>` until `VerifiedForSendingStatus: true` + `DkimAttributes.Status: SUCCESS` (DNS propagation is usually minutes).
4. Confirm the account has **production access** (not sandbox) before relying on sends to arbitrary recipients: `aws sesv2 get-account` → `ProductionAccessEnabled: true`.

## When this fires

- Any project that sends transactional OR marketing email
- Before first deploy of any send path (signup, receipt, reset, magic link, digest, newsletter)

## The bulk-sender bar (≥5,000 msgs/day to a provider)

- Gmail classifies a domain a **bulk sender permanently at ≥5,000/day** — it never un-classifies even if volume drops. Build to the bar from day one.
- The 5,000/day threshold counts **per provider family** — 5K to Outlook alone triggers it; 3K + 3K split across providers does not.
- Microsoft enforces the same three pillars since May 2025; Google + Yahoo since Feb 2024.

## Pillar 1 — Authentication (SPF + DKIM + DMARC)

- **All three required.** DMARC minimum policy `p=none` is accepted; `p=quarantine`/`p=reject` is stronger. Microsoft now penalizes domains that linger at `p=none` (inbox placement) — plan the move to `p=quarantine` → `p=reject`; stricter PTR checks in 2026.
- **Alignment** — the `From:` domain must align with SPF OR DKIM. Set up both; align at least one. Google has signaled full SPF+DKIM alignment will become required — align both now.
- **Yahoo** additionally requires **DKIM key ≥1024 bits**.
- Auto-provision sending-domain DNS via SES → push records to CF zone API per `secret-provisioning` (`sesv2 create-email-identity` returns the 3 EasyDKIM CNAME tokens; add SPF + DMARC alongside). See § Auto-provision above.

## Pillar 2 — One-click unsubscribe (RFC 8058) — marketing only

- Marketing/subscription mail MUST send **`List-Unsubscribe` AND `List-Unsubscribe-Post`** headers (RFC 8058). A link to a landing page does NOT comply.
- **Honor within 2 days.**
- **Transactional mail is exempt** — password reset, receipts, reservation/form confirmations don't need it. Tag every send `transactional | marketing` so the header logic is correct.

## Pillar 3 — Spam rate < 0.3%

- **0.3% is the enforcement line, not a target.** Keep Postmaster-reported spam rate **< 0.1%**.
- Yahoo's denominator is inbox-delivered only (stricter) — the same complaints read higher on Yahoo.
- Monitor via Google Postmaster Tools; alert before 0.1%.

## Failure mode (why this is a build gate, not a nicety)

- Non-compliant mail is **rejected at SMTP**: Google `550 5.7.26`, Yahoo `550 5.7.9`, Microsoft `550 5.7.515`. It never reaches inbox or spam.
- Once spam rate >0.3% or auth/unsubscribe is missing, provider remediation is unavailable — you're stuck until fixed.
- Enforcement is tightening, not relaxing — "good enough" partial setups that worked in 2024 bounce in 2026.

## Build gate

- `validate-email-auth.mjs` — pre-deploy: query DNS for SPF + DKIM selector + DMARC on the sending domain; fail if any missing or DMARC `p=` absent.
- Every marketing template asserts `List-Unsubscribe` + `List-Unsubscribe-Post` headers in test; every transactional send is tagged and exempt.
- iOS Safari push: pair with **Declarative Web Push** where in-app notification is the better channel per `notifications-email-webhooks-supervisor`.

## See

- `notifications-email-webhooks-supervisor` — psnotify backbone; Amazon SES as the sole email rail behind it
- `secret-provisioning` — sending-domain DNS auto-provision (provider API → CF zone)
- `website-page-and-site-gates` § Every form — Turnstile + Zod + Amazon SES; this rule gates the send path those forms trigger
- `13-observability-and-growth` — Listmonk-on-Coolify newsletters via SES SMTP relay
