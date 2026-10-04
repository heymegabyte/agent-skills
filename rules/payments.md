---
name: "payments"
priority: 2
pack: "payments"
triggers:
  - "stripe"
  - "square"
  - "payment"
  - "billing"
  - "checkout"
  - "refund"
  - "dispute"
  - "chargeback"
  - "cancellation"
  - "charge.dispute"
  - "DISPUTE_CREATED"
  - "cancel_at_period_end"
paths:
  - "concern:stripe-billing"
  - "concern:square-payments"
last_reviewed: 2026-10-04
superseded_by: null
---

# Payments — Rail Routing + Refund/Dispute Automation

Two payment concerns that fire together on any money-handling build: which rail to use, and the automated refund/dispute paths every payment feature must ship with. (Consolidated 2026-09-26 from `payments-routing` + `refund-automation`.)

## Payments Routing

**Stripe is the DEFAULT payment provider for ALL money flows** — accept + send — with **Link enabled by default**. Square is used ONLY when the prompt explicitly requests it. (Brian directive 2026-10-04; supersedes the Square-default tree — Square's rate edge died in the 2026 fee raise, and Link owns the agentic-commerce rail.)

### Core rule

- **Accept money → Stripe** (Payment Element / Checkout / Payment Links) with **Link ON** everywhere.
- **Recurring SaaS → Stripe Billing** (seats, usage metering, entitlements, net-30, Stripe Tax, multi-currency).
- **Send money → Stripe Connect Express** (contractor/vendor payouts, 1099-NEC, marketplace splits, grant disbursement).
- **In-person (no Square ask) → Stripe Terminal / Tap to Pay** (2.7%+5¢).
- **Square → ONLY when the prompt names Square** (POS platform affinity, existing Square hardware/ledger). Record the request in `package.json#emdash.square_requested: true`.

### Link doctrine (link.com — verified 2026-10-04)

- **Enable Link in every integration**: Payment Element with `automatic_payment_methods`; Payment Links carry 1-click Link by default (2026 rollout). Email-first autofill; wallet spans web/iOS/Android; cards + bank + crypto + BNPL on file.
- **Instant Bank Payments via Link**: 2.6%+30¢ — cheaper than cards (2.9%+30¢), instant confirmation, T+2 settle, Stripe guarantees bank-return risk. Offer it on high-ticket + donation flows. Promo pricing 0.8% through 2027-01-01 (+0.2% after) per stripe.com/payments/link — re-verify at integration time.
- **Agentic commerce**: Link agent payments (2026-04 + 2026-09) — consumers authorize AI agents to pay WITHOUT exposing credentials; incremental authorization for price drift; next-action guidance on 3DS/declines; purchase protections on eligible agent transactions. Stripe is the ACP (Agentic Commerce Protocol) launch partner. Every generated site that sells SHOULD be agent-purchasable.
- **Reconciliation**: Link wallet card charges carry `funding_source_group` (`lfsg_`, 2026-08) on the Charge object — use it, don't regex statement descriptors.

### Mixed scenarios

- SaaS + donations → both flows stay on Stripe (Billing + Payment Element); one webhook endpoint, typed event router, never cross idempotency keys.
- Prompt requests Square POS + site sells online → Square owns in-person, Stripe+Link owns online; separate handlers + ledger reconciliation via D1.

### Square (on-request rail only)

- Fees (2026): online 3.3%+30¢ Free tier (raised) vs Stripe 2.9%+30¢; in-person 2.6%+15¢ vs Terminal 2.7%+5¢; chargeback $0 vs $15. Case: POS platform + hardware + $0 chargebacks — NOT rates.
- Nonprofits: NO Square 501(c)(3) discount exists (verified 2026-10) — custom rates only ≥$250K/yr. Cheapest verified-501(c)(3) online rails: PayPal/Braintree 1.99%+49¢.
- Built-in: Donate button + Online Checkout Link + Web Payments SDK + Apple/Google/Cash App Pay; recurring via Square Subscriptions.

### Nonprofit-specific guardrail

- Stripe Tax adds nothing for verified 501(c)(3) (already tax-exempt) — skip it.
- Donations run Stripe + Link by default (offer Instant Bank Payments — bank rail trims fees on large gifts); PayPal Giving Fund layered for fee-free large gifts (0% on PPGF-verified 501c3s, 30-45 day payout) — Stripe for instant operating cash, PPGF for patient money.

### Webhook architecture

- **Stripe**: `Stripe-Signature` (`t=`+`v1=`, 5-min replay window) → `/webhooks/stripe`; one endpoint, typed event router.
- **Square (when requested)**: `Square-Signature` HMAC-SHA256, notification-url-keyed secret, 6-hr replay window → `/webhooks/square`.
- **Idempotency**: Stripe `Idempotency-Key` header; Square `idempotency_key` UUID (both 24-hr dedupe).
- D1 dedupe table `payment_events(event_id, source, processed_at)` with UNIQUE constraint = bullet-proof double-charge prevention.

### Donation tier UX

- Preset buttons: $10/$25/$50/$100/$250/$1000 + custom amount
- "Make this monthly" toggle (Stripe Billing subscription $/mo)
- "In honor of" / "in memory of" toggle (memorial wall integration)
- "Anonymous" toggle (donor wall opt-out)
- Employer-match search box (Double the Donation API or Benevity API)
- Donor-Advised Fund button (DAFpay or Chariot.co → Fidelity/Schwab/Vanguard/National Christian Foundation routing)
- Tax receipt auto-issued via Amazon SES within 30 sec of webhook fire
- Cents-off displayed in tier copy ("$8.50 covers one hot meal — round up to $10")

### Build gate

- Any `package.json` containing `"square"` without `package.json#emdash.square_requested: true` (set only when the prompt asked for Square) = build fail.
- Validator `validate-payments-routing.mjs` (semantics INVERTED 2026-10-04): greps Square SDK usage (`client.paymentsApi`, `square.webhooks`) without the request marker = build fail. Stripe usage needs no marker — it is the default.
- Every Stripe integration asserts Link enabled: `automatic_payment_methods: {enabled: true}` present (or Payment Links used) = gate pass.

### Migration path (existing projects on Square without a standing Square ask)

1. Audit `client.paymentsApi` / Web Payments SDK usage + Square Subscriptions.
2. Migrate checkout to Stripe Payment Element with Link enabled (idempotency-keyed PaymentIntents); subscriptions → Stripe Billing.
3. Preserve customer-facing tier UX; map Square customer ids → Stripe Customers (email-keyed).
4. Swap webhook handler `/webhooks/square` → `/webhooks/stripe`; keep the D1 `payment_events` table (source column already disambiguates).
5. Keep Square ONLY where in-person hardware is live (that is a standing Square ask — record `square_requested: true`).

### E-commerce surfaces

- E-commerce sites (catalog + cart + checkout + inventory) route payments through the **Medusa.js** Stripe plugin (Square plugin when requested), NOT directly — Medusa owns the order state machine + idempotency. Full mandate: `ecommerce-stack`.
- Stripe-default applies in front of Medusa; Link rides through Stripe Checkout/Payment Element inside it.

## Refund + Dispute Automation

No payment feature merges without automated refund + dispute paths wired up. A solo builder cannot staff a refund queue; manual queues accrue chargebacks silently until the processor flags the account at 0.75%.

### Rules

- **Stripe Radar** — auto-refund charges with `risk_score > 75` before settlement.
- **Stripe `charge.dispute.created`** — auto-accept disputes ≤ $25 (2500 cents); fighting costs more.
- **Stripe subscription cancellation** — prorated refund for unused days when cancelled within 30 days; `cancel_at_period_end` outside that window.
- **Square `DISPUTE_CREATED`** — auto-accept disputes ≤ $25, same threshold.
- **Both rails** — D1 `payment_events` dedupe table prevents double-refund on webhook replay.
- **Both rails** — Amazon SES receipt issued within 30 seconds of webhook processing via `ctx.waitUntil()`.

### Handler requirements

#### Stripe dispute (`charge.dispute.created`)

- Zod-parse `event.data.object` before any DB write; reject malformed payloads.
- Idempotency check against `payment_events(event_id, source='stripe')` before calling any Stripe API.
- Auto-accept when `dispute.amount <= 2500` cents; submit evidence for larger disputes.
- Evidence fields: `customer_email_address`, `receipt` URL, `uncategorized_text`.

See `reference/refund-automation.md` for the full `handleStripeDispute` handler.

#### Stripe subscription cancellation

- Calculate `daysSinceBillingCycleStart = floor((now/1000 - sub.current_period_start) / 86400)`.
- Within 30 days: `stripe.subscriptions.cancel({ prorate: true })` then retrieve upcoming invoice credit balance and immediately create a refund against the original charge.
- Outside 30 days: `stripe.subscriptions.update({ cancel_at_period_end: true })`, no refund.

See `reference/refund-automation.md` for the full `cancelSubscription` implementation.

#### Square dispute (`DISPUTE_CREATED`)

- Same idempotency pattern against `payment_events(event_id, source='square')`.
- Auto-accept at ≤ 2500 cents via `client.disputesApi.acceptDispute(dispute.id)`.
- Submit evidence for larger disputes via `client.disputesApi.submitEvidenceDispute(dispute.id)`.

See `reference/refund-automation.md` for the full `handleSquareDispute` handler.

#### Refund receipt email

- Send via Amazon SES inside `ctx.waitUntil()` — never block the API response.
- Format amount with `Intl.NumberFormat` using the charge's currency.
- From address must pass `email-deliverability.md` gate (SPF+DKIM+DMARC).

See `reference/refund-automation.md` for the full `sendRefundReceipt` implementation.

### Anti-patterns (build-fail)

- **Stub dispute handler** — `charge.dispute.created` registered but returns early without action → 0.75% chargeback rate, processor suspension risk.
- **Manual refund queue** — inserting to a `pending_refunds` table for human processing → solo builder never drains it; chargebacks follow.
- **No idempotency guard** — calling `stripe.disputes.accept()` or `stripe.refunds.create()` without checking `payment_events` first → webhook replay fires twice.

See `reference/refund-automation.md` for code examples of each anti-pattern.

### Checklist

- `payment_events(event_id, source, processed_at)` D1 table with UNIQUE constraint on `(event_id, source)` exists before any webhook handler goes live.
- Stripe Radar rule configured: auto-refund `risk_score > 75` before settlement.
- `charge.dispute.created` webhook registered and routed to handler.
- Auto-accept threshold: $25 (2500 cents) — review annually against dispute volume.
- Subscription cancellation: prorated refund within 30 days, `cancel_at_period_end` outside.
- Square `DISPUTE_CREATED` webhook wired if Square is the accept-money rail.
- Refund receipt via Amazon SES in `ctx.waitUntil()` — never blocking the API response.
- Amazon SES from address passes `email-deliverability.md` gate (SPF+DKIM+DMARC).
- `charge.refunded` and `payment.refund.updated` logged to D1 for audit trail.

### D1 schema

```sql
-- migration: 0020_payment_events.sql
CREATE TABLE payment_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id    TEXT NOT NULL,
  source      TEXT NOT NULL CHECK(source IN ('stripe', 'square')),
  event_type  TEXT,
  amount      INTEGER,
  currency    TEXT,
  processed_at TEXT NOT NULL,
  UNIQUE(event_id, source)
);
```

### See

- The **Payments Routing** section above — Square vs Stripe rail selection; which handler belongs in which webhook route
- `[[hono-api]]` — webhook signature verification pattern (Square-Signature HMAC, Stripe-Signature t=+v1=)
- `[[solo-builder-doctrine]]` — no-staging, no manual queue; automation is the only viable ops model
- `[[stripe-billing]]` — subscription lifecycle, proration, credit balance behavior
- `[[square-payments]]` — Square Subscriptions recurring-donation cancellation flow
