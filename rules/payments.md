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
last_reviewed: 2026-09-26
superseded_by: null
---

# Payments — Rail Routing + Refund/Dispute Automation

Two payment concerns that fire together on any money-handling build: which rail to use, and the automated refund/dispute paths every payment feature must ship with. (Consolidated 2026-09-26 from `payments-routing` + `refund-automation`.)

## Payments Routing

Route payment integrations by project shape: Square for accepting money, Stripe Billing for SaaS recurring, Stripe Connect for contractor payouts.

### Core rule — decision tree, not absolutism

- **Square = default for accepting money.** Stripe = default for sending money (payouts).
- Pick the rail by matching project shape to the decision tree below — don't pattern-match on vendor preference.

#### When Stripe Billing IS the right rail (accept-money exception)

The project is genuinely SaaS-subscription with **≥2 of**:

- Seat-based billing
- Usage-based metering
- Entitlements feature gating
- Net-30 enterprise invoicing
- Tax-rate complexity (Stripe Tax across jurisdictions)
- Multi-currency

If ≥2 match → Stripe Billing owns the subscription rail. Square is not forced in.

#### When Square IS the right rail (every other accept-money path)

- Donations (one-time + recurring)
- POS (restaurant, retail, salon, medical, legal)
- E-commerce
- One-time charges
- Sub-$100 average tickets (Square beats Stripe's $0.30 fixed by 30-60%)
- Nonprofit recurring giving
- Hybrid in-person + online unified ledger

#### Mixed scenarios

- SaaS with donations layered on top → both rails, each owns its own webhook + DB tables, never cross idempotency keys

### Square notes (when Square is the chosen rail)

- Nonprofits: verified-501(c)(3) discount (2.6%+10¢ vs 3.5%+15¢ default)
- Built-in: Square Donate button + Square Online Checkout Link + Square Web Payments SDK card form + Apple Pay + Google Pay + Cash App Pay
- Recurring giving via Square Subscriptions

### Stripe Connect Express (payouts rail)

- Onboarding for paid contractors/vendors/freelancers/temp staff → ACH payout, 1099-NEC issuance automated
- Marketplace platforms with split payments to multiple recipients
- Charitable grant distribution from foundation to grantees
- Volunteer-reimbursement disbursements (mileage, supplies)

### Nonprofit-specific guardrail

- Stripe Tax adds nothing for verified 501(c)(3) (already tax-exempt) — skip it
- For straight donations (no SaaS layer), Square is the cleaner rail per the decision tree

### Agentic-commerce exception

- Stripe is the launch partner for ACP (Agentic Commerce Protocol) embedded checkout
- Use Stripe ONLY when explicitly building an AI-shopping agent flow that requires ACP
- Otherwise Square

### Webhook architecture

- **Square**: `Square-Signature` HMAC-SHA256 with notification-url-keyed secret + 6-hr replay window
- **Stripe**: `Stripe-Signature` with `t=`+`v1=` + 5-min replay window
- Each has its own handler: `/webhooks/square` and `/webhooks/stripe-payouts`
- **Idempotency**: Square `idempotency_key` UUID per request; Stripe `Idempotency-Key` header (both 24-hr dedupe)
- D1 dedupe table `payment_events(event_id, source, processed_at)` with UNIQUE constraint = bullet-proof double-charge prevention

### Donation tier UX

- Preset buttons: $10/$25/$50/$100/$250/$1000 + custom amount
- "Make this monthly" toggle (Square Subscriptions $/mo)
- "In honor of" / "in memory of" toggle (memorial wall integration)
- "Anonymous" toggle (donor wall opt-out)
- Employer-match search box (Double the Donation API or Benevity API)
- Donor-Advised Fund button (DAFpay or Chariot.co → Fidelity/Schwab/Vanguard/National Christian Foundation routing)
- Tax receipt auto-issued via Amazon SES within 30 sec of webhook fire
- Cents-off displayed in tier copy ("$8.50 covers one hot meal — round up to $10")

### PayPal Giving Fund

- Layered on top of Square for nonprofit-only sites
- 0% processing (PayPal absorbs the fee on PPGF-verified 501c3s)
- 30-45 day payout delay vs Square instant
- Use both: Square for instant operating cash + PayPal Giving Fund for fee-free large gifts
- Stripe still NOT involved in either rail

### Build gate

- Any `package.json` containing `"stripe"` without a matching `"stripe-purpose": "payouts" | "saas-billing" | "acp-checkout"` field in `package.json#emdash` block = build fail
- Validator `validate-payments-routing.mjs` greps for `stripe.checkout`, `stripe.paymentIntents`, `stripe.subscriptions.create` outside the SaaS-billing path = build fail

### Migration path (existing projects on Stripe for accept-money)

1. Audit current `stripe.charges` / `stripe.paymentIntents` / Stripe Checkout sessions
2. Migrate to Square Web Payments SDK with idempotency-keyed `POST /v2/payments`
3. Preserve customer-facing tier UX
4. Swap webhook handler `/webhooks/stripe` → `/webhooks/square`
5. Keep Stripe installed ONLY if vendor payouts already wired through Connect Express
6. Otherwise full Stripe removal: uninstall package + delete `STRIPE_*` env vars + remove all `import Stripe from 'stripe'` + remove webhook handler + drop `stripe_events` D1 table

### E-commerce surfaces

- E-commerce sites (product catalog + cart + checkout + inventory) route payments through the **Medusa.js** Square or Stripe plugin, NOT directly — Medusa owns the order state machine + idempotency. Full mandate: `ecommerce-stack`.
- The Square-vs-Stripe decision tree above still applies — Medusa just sits in front of it.

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
