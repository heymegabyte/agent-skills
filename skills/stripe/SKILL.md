---
name: stripe
description: "Stripe API API skill — auto-forged from OpenAPI 2026-05-27.dahlia. The Stripe REST API. Please see https://stripe.com/docs/api for more details."
triggers: ["stripe API", "working with Stripe API"]
version: 1.0.0
forged-from: openapi
api-title: Stripe API
api-version: 2026-05-27.dahlia
---

# Stripe API API Skill

<!-- commands-collapsed -->
> **Per-endpoint pages collapsed.** The 582 `commands/*.md` files (one per endpoint) were removed to cut file count — they were forge-generated, unrouted, and reproduce what Context7 (live API docs) and the typed `client.ts` already provide (some integrations also expose a live MCP server). The **Slash Commands** inventory below is retained.
> Restore full offline curl/param detail any time: `node bin/forge-skill-from-openapi.mjs <spec-url> skills/stripe --name stripe`.


> **NOTE: Pruning recommended.** This skill was forged from the full Stripe OpenAPI spec (587 endpoints, 414 paths, 1,422 schema types). The generated `commands/` directory and `client.ts` contain every Stripe endpoint including many rarely-used ones. Consider pruning to the ~50 endpoints most relevant to your use case (Charges, PaymentIntents, Customers, Subscriptions, Invoices, Products, Prices, Webhooks) to reduce context noise. Re-run forge with a filtered spec or delete unneeded command files.

Auto-forged from the Stripe API OpenAPI spec (v2026-05-27.dahlia).

## What this skill provides

- **587 slash commands** — one per API endpoint, with curl examples and typed guidance
- **`types.ts`** — TypeScript types auto-generated from OpenAPI schemas
- **`client.ts`** — Typed fetch-based API client (zero deps, Workers-compatible)

## Slash Commands

- `/get-v1-account` — Retrieve account
- `/post-v1-account-links` — Create an account link
- `/post-v1-account-sessions` — Create an Account Session
- `/get-v1-accounts` — List all connected accounts
- `/post-v1-accounts` — <p>With <a href="/docs/connect">Connect</a>, you can create Stripe accounts for your users.
To do this, you’ll first need to <a href="https://dashboard.stripe.com/account/applications/settings">register your platform</a>.</p>

<p>If you’ve already collected information for your connected accounts, you <a href="/docs/connect/best-practices#onboarding">can prefill that information</a> when
creating the account. Connect Onboarding won’t ask for the prefilled information during account onboarding.
You can prefill any information on the account.</p>
- `/get-v1-accounts-account` — Retrieve account
- `/post-v1-accounts-account` — Update an account
- `/delete-v1-accounts-account` — Delete an account
- `/post-v1-accounts-account-bank-accounts` — Create an external account
- `/get-v1-accounts-account-bank-accounts-id` — Retrieve an external account
- `/post-v1-accounts-account-bank-accounts-id` — <p>Updates the metadata, account holder name, account holder type of a bank account belonging to
a connected account and optionally sets it as the default for its currency. Other bank account
details are not editable by design.</p>

<p>You can only update bank accounts when <a href="/api/accounts/object#account_object-controller-requirement_collection">account.controller.requirement_collection</a> is <code>application</code>, which includes <a href="/connect/custom-accounts">Custom accounts</a>.</p>

<p>You can re-enable a disabled bank account by performing an update call without providing any
arguments or changes.</p>
- `/delete-v1-accounts-account-bank-accounts-id` — Delete an external account
- `/get-v1-accounts-account-capabilities` — List all account capabilities
- `/get-v1-accounts-account-capabilities-capability` — Retrieve an Account Capability
- `/post-v1-accounts-account-capabilities-capability` — Update an Account Capability
- `/get-v1-accounts-account-external-accounts` — List all external accounts
- `/post-v1-accounts-account-external-accounts` — Create an external account
- `/get-v1-accounts-account-external-accounts-id` — Retrieve an external account
- `/post-v1-accounts-account-external-accounts-id` — <p>Updates the metadata, account holder name, account holder type of a bank account belonging to
a connected account and optionally sets it as the default for its currency. Other bank account
details are not editable by design.</p>

<p>You can only update bank accounts when <a href="/api/accounts/object#account_object-controller-requirement_collection">account.controller.requirement_collection</a> is <code>application</code>, which includes <a href="/connect/custom-accounts">Custom accounts</a>.</p>

<p>You can re-enable a disabled bank account by performing an update call without providing any
arguments or changes.</p>
- `/delete-v1-accounts-account-external-accounts-id` — Delete an external account
- `/post-v1-accounts-account-login-links` — Create a login link
- `/get-v1-accounts-account-people` — List all persons
- `/post-v1-accounts-account-people` — Create a person
- `/get-v1-accounts-account-people-person` — Retrieve a person
- `/post-v1-accounts-account-people-person` — Update a person
- `/delete-v1-accounts-account-people-person` — Delete a person
- `/get-v1-accounts-account-persons` — List all persons
- `/post-v1-accounts-account-persons` — Create a person
- `/get-v1-accounts-account-persons-person` — Retrieve a person
- `/post-v1-accounts-account-persons-person` — Update a person
- `/delete-v1-accounts-account-persons-person` — Delete a person
- `/post-v1-accounts-account-reject` — Reject an account
- `/get-v1-apple-pay-domains` — <p>List apple pay domains.</p>
- `/post-v1-apple-pay-domains` — <p>Create an apple pay domain.</p>
- `/get-v1-apple-pay-domains-domain` — <p>Retrieve an apple pay domain.</p>
- `/delete-v1-apple-pay-domains-domain` — <p>Delete an apple pay domain.</p>
- `/get-v1-application-fees` — List all application fees
- `/get-v1-application-fees-fee-refunds-id` — Retrieve an application fee refund
- `/post-v1-application-fees-fee-refunds-id` — Update an application fee refund
- `/get-v1-application-fees-id` — Retrieve an application fee
- `/post-v1-application-fees-id-refund` — 
- `/get-v1-application-fees-id-refunds` — List all application fee refunds
- `/post-v1-application-fees-id-refunds` — Create an application fee refund
- `/get-v1-apps-secrets` — List secrets
- `/post-v1-apps-secrets` — Set a Secret
- `/post-v1-apps-secrets-delete` — Delete a Secret
- `/get-v1-apps-secrets-find` — Find a Secret
- `/get-v1-balance` — Retrieve balance
- `/get-v1-balance-history` — List all balance transactions
- `/get-v1-balance-history-id` — Retrieve a balance transaction
- `/get-v1-balance-settings` — Retrieve balance settings
- `/post-v1-balance-settings` — Update balance settings
- `/get-v1-balance-transactions` — List all balance transactions
- `/get-v1-balance-transactions-id` — Retrieve a balance transaction
- `/get-v1-billing-alerts` — List billing alerts
- `/post-v1-billing-alerts` — Create a billing alert
- `/get-v1-billing-alerts-id` — Retrieve a billing alert
- `/post-v1-billing-alerts-id-activate` — Activate a billing alert
- `/post-v1-billing-alerts-id-archive` — Archive a billing alert
- `/post-v1-billing-alerts-id-deactivate` — Deactivate a billing alert
- `/get-v1-billing-credit-balance-summary` — Retrieve the credit balance summary for a customer
- `/get-v1-billing-credit-balance-transactions` — List credit balance transactions
- `/get-v1-billing-credit-balance-transactions-id` — Retrieve a credit balance transaction
- `/get-v1-billing-credit-grants` — List credit grants
- `/post-v1-billing-credit-grants` — Create a credit grant
- `/get-v1-billing-credit-grants-id` — Retrieve a credit grant
- `/post-v1-billing-credit-grants-id` — Update a credit grant
- `/post-v1-billing-credit-grants-id-expire` — Expire a credit grant
- `/post-v1-billing-credit-grants-id-void` — Void a credit grant
- `/post-v1-billing-meter-event-adjustments` — Create a billing meter event adjustment
- `/post-v1-billing-meter-events` — Create a billing meter event
- `/get-v1-billing-meters` — List billing meters
- `/post-v1-billing-meters` — Create a billing meter
- `/get-v1-billing-meters-id` — Retrieve a billing meter
- `/post-v1-billing-meters-id` — Update a billing meter
- `/post-v1-billing-meters-id-deactivate` — Deactivate a billing meter
- `/get-v1-billing-meters-id-event-summaries` — List billing meter event summaries
- `/post-v1-billing-meters-id-reactivate` — Reactivate a billing meter
- `/get-v1-billing-portal-configurations` — List portal configurations
- `/post-v1-billing-portal-configurations` — Create a portal configuration
- `/get-v1-billing-portal-configurations-configuration` — Retrieve a portal configuration
- `/post-v1-billing-portal-configurations-configuration` — Update a portal configuration
- `/post-v1-billing-portal-sessions` — Create a portal session
- `/get-v1-charges` — List all charges
- `/post-v1-charges` — <p>This method is no longer recommended—use the <a href="/docs/api/payment_intents">Payment Intents API</a>
to initiate a new payment instead. Confirmation of the PaymentIntent creates the <code>Charge</code>
object used to request payment.</p>
- `/get-v1-charges-search` — Search charges
- `/get-v1-charges-charge` — Retrieve a charge
- `/post-v1-charges-charge` — Update a charge
- `/post-v1-charges-charge-capture` — Capture a payment
- `/get-v1-charges-charge-dispute` — <p>Retrieve a dispute for a specified charge.</p>
- `/post-v1-charges-charge-dispute` — 
- `/post-v1-charges-charge-dispute-close` — 
- `/post-v1-charges-charge-refund` — Create a refund
- `/get-v1-charges-charge-refunds` — List all refunds
- `/post-v1-charges-charge-refunds` — Create customer balance refund
- `/get-v1-charges-charge-refunds-refund` — <p>Retrieves the details of an existing refund.</p>
- `/post-v1-charges-charge-refunds-refund` — <p>Update a specified refund.</p>
- `/get-v1-checkout-sessions` — List all Checkout Sessions
- `/post-v1-checkout-sessions` — Create a Checkout Session
- `/get-v1-checkout-sessions-session` — Retrieve a Checkout Session
- `/post-v1-checkout-sessions-session` — Update a Checkout Session
- `/post-v1-checkout-sessions-session-expire` — Expire a Checkout Session
- `/get-v1-checkout-sessions-session-line-items` — Retrieve a Checkout Session's line items
- `/get-v1-climate-orders` — List orders
- `/post-v1-climate-orders` — Create an order
- `/get-v1-climate-orders-order` — Retrieve an order
- `/post-v1-climate-orders-order` — Update an order
- `/post-v1-climate-orders-order-cancel` — Cancel an order
- `/get-v1-climate-products` — List products
- `/get-v1-climate-products-product` — Retrieve a product
- `/get-v1-climate-suppliers` — List suppliers
- `/get-v1-climate-suppliers-supplier` — Retrieve a supplier
- `/get-v1-confirmation-tokens-confirmation-token` — Retrieve a ConfirmationToken
- `/get-v1-country-specs` — List Country Specs
- `/get-v1-country-specs-country` — Retrieve a Country Spec
- `/get-v1-coupons` — List all coupons
- `/post-v1-coupons` — Create a coupon
- `/get-v1-coupons-coupon` — Retrieve a coupon
- `/post-v1-coupons-coupon` — Update a coupon
- `/delete-v1-coupons-coupon` — Delete a coupon
- `/get-v1-credit-notes` — List all credit notes
- `/post-v1-credit-notes` — Create a credit note
- `/get-v1-credit-notes-preview` — Preview a credit note
- `/get-v1-credit-notes-preview-lines` — Retrieve a credit note preview's line items
- `/get-v1-credit-notes-credit-note-lines` — Retrieve a credit note's line items
- `/get-v1-credit-notes-id` — Retrieve a credit note
- `/post-v1-credit-notes-id` — Update a credit note
- `/post-v1-credit-notes-id-void` — Void a credit note
- `/post-v1-customer-sessions` — Create a Customer Session
- `/get-v1-customers` — List all customers
- `/post-v1-customers` — Create a customer
- `/get-v1-customers-search` — Search customers
- `/get-v1-customers-customer` — Retrieve a customer
- `/post-v1-customers-customer` — Update a customer
- `/delete-v1-customers-customer` — Delete a customer
- `/get-v1-customers-customer-balance-transactions` — List customer balance transactions
- `/post-v1-customers-customer-balance-transactions` — Create a customer balance transaction
- `/get-v1-customers-customer-balance-transactions-transaction` — Retrieve a customer balance transaction
- `/post-v1-customers-customer-balance-transactions-transaction` — Update a customer credit balance transaction
- `/get-v1-customers-customer-bank-accounts` — List all bank accounts
- `/post-v1-customers-customer-bank-accounts` — Create a card
- `/get-v1-customers-customer-bank-accounts-id` — Retrieve a bank account
- `/post-v1-customers-customer-bank-accounts-id` — <p>Update a specified source for a given customer.</p>
- `/delete-v1-customers-customer-bank-accounts-id` — Delete a customer source
- `/post-v1-customers-customer-bank-accounts-id-verify` — Verify a bank account
- `/get-v1-customers-customer-cards` — List all cards
- `/post-v1-customers-customer-cards` — Create a card
- `/get-v1-customers-customer-cards-id` — Retrieve a card
- `/post-v1-customers-customer-cards-id` — <p>Update a specified source for a given customer.</p>
- `/delete-v1-customers-customer-cards-id` — Delete a customer source
- `/get-v1-customers-customer-cash-balance` — Retrieve a cash balance
- `/post-v1-customers-customer-cash-balance` — Update a cash balance's settings
- `/get-v1-customers-customer-cash-balance-transactions` — List cash balance transactions
- `/get-v1-customers-customer-cash-balance-transactions-transaction` — Retrieve a cash balance transaction
- `/get-v1-customers-customer-discount` — 
- `/delete-v1-customers-customer-discount` — Delete a customer discount
- `/post-v1-customers-customer-funding-instructions` — Create or retrieve funding instructions for a customer cash balance
- `/get-v1-customers-customer-payment-methods` — List a Customer's PaymentMethods
- `/get-v1-customers-customer-payment-methods-payment-method` — Retrieve a Customer's PaymentMethod
- `/get-v1-customers-customer-sources` — <p>List sources for a specified customer.</p>
- `/post-v1-customers-customer-sources` — Create a card
- `/get-v1-customers-customer-sources-id` — <p>Retrieve a specified source for a given customer.</p>
- `/post-v1-customers-customer-sources-id` — <p>Update a specified source for a given customer.</p>
- `/delete-v1-customers-customer-sources-id` — Delete a customer source
- `/post-v1-customers-customer-sources-id-verify` — Verify a bank account
- `/get-v1-customers-customer-subscriptions` — List active subscriptions
- `/post-v1-customers-customer-subscriptions` — Create a subscription
- `/get-v1-customers-customer-subscriptions-subscription-exposed-id` — Retrieve a subscription
- `/post-v1-customers-customer-subscriptions-subscription-exposed-id` — Update a subscription on a customer
- `/delete-v1-customers-customer-subscriptions-subscription-exposed-id` — Cancel a subscription
- `/get-v1-customers-customer-subscriptions-subscription-exposed-id-` — 
- `/delete-v1-customers-customer-subscriptions-subscription-exposed-id-` — Delete a customer discount
- `/get-v1-customers-customer-tax-ids` — List all Customer tax IDs
- `/post-v1-customers-customer-tax-ids` — Create a Customer tax ID
- `/get-v1-customers-customer-tax-ids-id` — Retrieve a Customer tax ID
- `/delete-v1-customers-customer-tax-ids-id` — Delete a Customer tax ID
- `/get-v1-disputes` — List all disputes
- `/get-v1-disputes-dispute` — Retrieve a dispute
- `/post-v1-disputes-dispute` — Update a dispute
- `/post-v1-disputes-dispute-close` — Close a dispute
- `/get-v1-entitlements-active-entitlements` — List all active entitlements
- `/get-v1-entitlements-active-entitlements-id` — Retrieve an active entitlement
- `/get-v1-entitlements-features` — List all features
- `/post-v1-entitlements-features` — Create a feature
- `/get-v1-entitlements-features-id` — Retrieve a feature
- `/post-v1-entitlements-features-id` — Updates a feature
- `/post-v1-ephemeral-keys` — Create an ephemeral key
- `/delete-v1-ephemeral-keys-key` — Immediately invalidate an ephemeral key
- `/get-v1-events` — List all events
- `/get-v1-events-id` — Retrieve an event
- `/get-v1-exchange-rates` — List all exchange rates
- `/get-v1-exchange-rates-rate-id` — Retrieve an exchange rate
- `/post-v1-external-accounts-id` — <p>Updates the metadata, account holder name, account holder type of a bank account belonging to
a connected account and optionally sets it as the default for its currency. Other bank account
details are not editable by design.</p>

<p>You can only update bank accounts when <a href="/api/accounts/object#account_object-controller-requirement_collection">account.controller.requirement_collection</a> is <code>application</code>, which includes <a href="/connect/custom-accounts">Custom accounts</a>.</p>

<p>You can re-enable a disabled bank account by performing an update call without providing any
arguments or changes.</p>
- `/get-v1-file-links` — List all file links
- `/post-v1-file-links` — Create a file link
- `/get-v1-file-links-link` — Retrieve a file link
- `/post-v1-file-links-link` — Update a file link
- `/get-v1-files` — List all files
- `/post-v1-files` — Create a file
- `/get-v1-files-file` — Retrieve a file
- `/get-v1-financial-connections-accounts` — List Accounts
- `/get-v1-financial-connections-accounts-account` — Retrieve an Account
- `/post-v1-financial-connections-accounts-account-disconnect` — Disconnect an Account
- `/get-v1-financial-connections-accounts-account-owners` — List Account Owners
- `/post-v1-financial-connections-accounts-account-refresh` — Refresh Account data
- `/post-v1-financial-connections-accounts-account-subscribe` — Subscribe to data refreshes for an Account
- `/post-v1-financial-connections-accounts-account-unsubscribe` — Unsubscribe from data refreshes for an Account
- `/post-v1-financial-connections-sessions` — Create a Session
- `/get-v1-financial-connections-sessions-session` — Retrieve a Session
- `/get-v1-financial-connections-transactions` — List Transactions
- `/get-v1-financial-connections-transactions-transaction` — Retrieve a Transaction
- `/get-v1-forwarding-requests` — List all ForwardingRequests
- `/post-v1-forwarding-requests` — Create a ForwardingRequest
- `/get-v1-forwarding-requests-id` — Retrieve a ForwardingRequest
- `/get-v1-identity-verification-reports` — List VerificationReports
- `/get-v1-identity-verification-reports-report` — Retrieve a VerificationReport
- `/get-v1-identity-verification-sessions` — List VerificationSessions
- `/post-v1-identity-verification-sessions` — Create a VerificationSession
- `/get-v1-identity-verification-sessions-session` — Retrieve a VerificationSession
- `/post-v1-identity-verification-sessions-session` — Update a VerificationSession
- `/post-v1-identity-verification-sessions-session-cancel` — Cancel a VerificationSession
- `/post-v1-identity-verification-sessions-session-redact` — Redact a VerificationSession
- `/get-v1-invoice-payments` — List all payments for an invoice
- `/get-v1-invoice-payments-invoice-payment` — Retrieve an InvoicePayment
- `/get-v1-invoice-rendering-templates` — List all invoice rendering templates
- `/get-v1-invoice-rendering-templates-template` — Retrieve an invoice rendering template
- `/post-v1-invoice-rendering-templates-template-archive` — Archive an invoice rendering template
- `/post-v1-invoice-rendering-templates-template-unarchive` — Unarchive an invoice rendering template
- `/get-v1-invoiceitems` — List all invoice items
- `/post-v1-invoiceitems` — Create an invoice item
- `/get-v1-invoiceitems-invoiceitem` — Retrieve an invoice item
- `/post-v1-invoiceitems-invoiceitem` — Update an invoice item
- `/delete-v1-invoiceitems-invoiceitem` — Delete an invoice item
- `/get-v1-invoices` — List all invoices
- `/post-v1-invoices` — Create an invoice
- `/post-v1-invoices-create-preview` — Create a preview invoice
- `/get-v1-invoices-search` — Search invoices
- `/get-v1-invoices-invoice` — Retrieve an invoice
- `/post-v1-invoices-invoice` — Update an invoice
- `/delete-v1-invoices-invoice` — Delete a draft invoice
- `/post-v1-invoices-invoice-add-lines` — Bulk add invoice line items
- `/post-v1-invoices-invoice-attach-payment` — Attach a payment to an Invoice
- `/post-v1-invoices-invoice-finalize` — Finalize an invoice
- `/get-v1-invoices-invoice-lines` — Retrieve an invoice's line items
- `/post-v1-invoices-invoice-lines-line-item-id` — Update an invoice's line item
- `/post-v1-invoices-invoice-mark-uncollectible` — Mark an invoice as uncollectible
- `/post-v1-invoices-invoice-pay` — Pay an invoice
- `/post-v1-invoices-invoice-remove-lines` — Bulk remove invoice line items
- `/post-v1-invoices-invoice-send` — Send an invoice for manual payment
- `/post-v1-invoices-invoice-update-lines` — Bulk update invoice line items
- `/post-v1-invoices-invoice-void` — Void an invoice
- `/get-v1-issuing-authorizations` — List all authorizations
- `/get-v1-issuing-authorizations-authorization` — Retrieve an authorization
- `/post-v1-issuing-authorizations-authorization` — Update an authorization
- `/post-v1-issuing-authorizations-authorization-approve` — Approve an authorization
- `/post-v1-issuing-authorizations-authorization-decline` — Decline an authorization
- `/get-v1-issuing-cardholders` — List all cardholders
- `/post-v1-issuing-cardholders` — Create a cardholder
- `/get-v1-issuing-cardholders-cardholder` — Retrieve a cardholder
- `/post-v1-issuing-cardholders-cardholder` — Update a cardholder
- `/get-v1-issuing-cards` — List all cards
- `/post-v1-issuing-cards` — Create a card
- `/get-v1-issuing-cards-card` — Retrieve a card
- `/post-v1-issuing-cards-card` — Update a card
- `/get-v1-issuing-disputes` — List all disputes
- `/post-v1-issuing-disputes` — Create a dispute
- `/get-v1-issuing-disputes-dispute` — Retrieve a dispute
- `/post-v1-issuing-disputes-dispute` — Update a dispute
- `/post-v1-issuing-disputes-dispute-submit` — Submit a dispute
- `/get-v1-issuing-personalization-designs` — List all personalization designs
- `/post-v1-issuing-personalization-designs` — Create a personalization design
- `/get-v1-issuing-personalization-designs-personalization-design` — Retrieve a personalization design
- `/post-v1-issuing-personalization-designs-personalization-design` — Update a personalization design
- `/get-v1-issuing-physical-bundles` — List all physical bundles
- `/get-v1-issuing-physical-bundles-physical-bundle` — Retrieve a physical bundle
- `/get-v1-issuing-settlements-settlement` — Retrieve a settlement
- `/post-v1-issuing-settlements-settlement` — Update a settlement
- `/get-v1-issuing-tokens` — List all issuing tokens for card
- `/get-v1-issuing-tokens-token` — Retrieve an issuing token
- `/post-v1-issuing-tokens-token` — Update a token status
- `/get-v1-issuing-transactions` — List all transactions
- `/get-v1-issuing-transactions-transaction` — Retrieve a transaction
- `/post-v1-issuing-transactions-transaction` — Update a transaction
- `/post-v1-link-account-sessions` — Create a Session
- `/get-v1-link-account-sessions-session` — Retrieve a Session
- `/get-v1-linked-accounts` — List Accounts
- `/get-v1-linked-accounts-account` — Retrieve an Account
- `/post-v1-linked-accounts-account-disconnect` — Disconnect an Account
- `/get-v1-linked-accounts-account-owners` — List Account Owners
- `/post-v1-linked-accounts-account-refresh` — Refresh Account data
- `/get-v1-mandates-mandate` — Retrieve a Mandate
- `/get-v1-payment-attempt-records` — List Payment Attempt Records
- `/get-v1-payment-attempt-records-id` — Retrieve a Payment Attempt Record
- `/get-v1-payment-intents` — List all PaymentIntents
- `/post-v1-payment-intents` — Create a PaymentIntent
- `/get-v1-payment-intents-search` — Search PaymentIntents
- `/get-v1-payment-intents-intent` — Retrieve a PaymentIntent
- `/post-v1-payment-intents-intent` — Update a PaymentIntent
- `/get-v1-payment-intents-intent-amount-details-line-items` — List all PaymentIntent LineItems
- `/post-v1-payment-intents-intent-apply-customer-balance` — Reconcile a customer_balance PaymentIntent
- `/post-v1-payment-intents-intent-cancel` — Cancel a PaymentIntent
- `/post-v1-payment-intents-intent-capture` — Capture a PaymentIntent
- `/post-v1-payment-intents-intent-confirm` — Confirm a PaymentIntent
- `/post-v1-payment-intents-intent-increment-authorization` — Increment an authorization
- `/post-v1-payment-intents-intent-verify-microdeposits` — Verify microdeposits on a PaymentIntent
- `/get-v1-payment-links` — List all payment links
- `/post-v1-payment-links` — Create a payment link
- `/get-v1-payment-links-payment-link` — Retrieve payment link
- `/post-v1-payment-links-payment-link` — Update a payment link
- `/get-v1-payment-links-payment-link-line-items` — Retrieve a payment link's line items
- `/get-v1-payment-method-configurations` — List payment method configurations
- `/post-v1-payment-method-configurations` — Create a payment method configuration
- `/get-v1-payment-method-configurations-configuration` — Retrieve payment method configuration
- `/post-v1-payment-method-configurations-configuration` — Update payment method configuration
- `/get-v1-payment-method-domains` — List payment method domains
- `/post-v1-payment-method-domains` — Create a payment method domain
- `/get-v1-payment-method-domains-payment-method-domain` — Retrieve a payment method domain
- `/post-v1-payment-method-domains-payment-method-domain` — Update a payment method domain
- `/post-v1-payment-method-domains-payment-method-domain-validate` — Validate an existing payment method domain
- `/get-v1-payment-methods` — List PaymentMethods
- `/post-v1-payment-methods` — Shares a PaymentMethod
- `/get-v1-payment-methods-payment-method` — Retrieve a PaymentMethod
- `/post-v1-payment-methods-payment-method` — Update a PaymentMethod
- `/post-v1-payment-methods-payment-method-attach` — Attach a PaymentMethod to a Customer
- `/post-v1-payment-methods-payment-method-detach` — Detach a PaymentMethod from a Customer
- `/post-v1-payment-records-report-payment` — Report a payment
- `/get-v1-payment-records-id` — Retrieve a Payment Record
- `/post-v1-payment-records-id-report-payment-attempt` — Report a payment attempt
- `/post-v1-payment-records-id-report-payment-attempt-canceled` — Report payment attempt canceled
- `/post-v1-payment-records-id-report-payment-attempt-failed` — Report payment attempt failed
- `/post-v1-payment-records-id-report-payment-attempt-guaranteed` — Report payment attempt guaranteed
- `/post-v1-payment-records-id-report-payment-attempt-informational` — Report payment attempt informational
- `/post-v1-payment-records-id-report-refund` — Report a refund
- `/get-v1-payouts` — List all payouts
- `/post-v1-payouts` — Create a payout
- `/get-v1-payouts-payout` — Retrieve a payout
- `/post-v1-payouts-payout` — Update a payout
- `/post-v1-payouts-payout-cancel` — Cancel a payout
- `/post-v1-payouts-payout-reverse` — Reverse a payout
- `/get-v1-plans` — List all plans
- `/post-v1-plans` — Create a plan
- `/get-v1-plans-plan` — Retrieve a plan
- `/post-v1-plans-plan` — Update a plan
- `/delete-v1-plans-plan` — Delete a plan
- `/get-v1-prices` — List all prices
- `/post-v1-prices` — Create a price
- `/get-v1-prices-search` — Search prices
- `/get-v1-prices-price` — Retrieve a price
- `/post-v1-prices-price` — Update a price
- `/get-v1-products` — List all products
- `/post-v1-products` — Create a product
- `/get-v1-products-search` — Search products
- `/get-v1-products-id` — Retrieve a product
- `/post-v1-products-id` — Update a product
- `/delete-v1-products-id` — Delete a product
- `/get-v1-products-product-features` — List all features attached to a product
- `/post-v1-products-product-features` — Attach a feature to a product
- `/get-v1-products-product-features-id` — Retrieve a product_feature
- `/delete-v1-products-product-features-id` — Remove a feature from a product
- `/get-v1-promotion-codes` — List all promotion codes
- `/post-v1-promotion-codes` — Create a promotion code
- `/get-v1-promotion-codes-promotion-code` — Retrieve a promotion code
- `/post-v1-promotion-codes-promotion-code` — Update a promotion code
- `/get-v1-quotes` — List all quotes
- `/post-v1-quotes` — Create a quote
- `/get-v1-quotes-quote` — Retrieve a quote
- `/post-v1-quotes-quote` — Update a quote
- `/post-v1-quotes-quote-accept` — Accept a quote
- `/post-v1-quotes-quote-cancel` — Cancel a quote
- `/get-v1-quotes-quote-computed-upfront-line-items` — Retrieve a quote's upfront line items
- `/post-v1-quotes-quote-finalize` — Finalize a quote
- `/get-v1-quotes-quote-line-items` — Retrieve a quote's line items
- `/get-v1-quotes-quote-pdf` — Download quote PDF
- `/get-v1-radar-early-fraud-warnings` — List all early fraud warnings
- `/get-v1-radar-early-fraud-warnings-early-fraud-warning` — Retrieve an early fraud warning
- `/post-v1-radar-payment-evaluations` — Create a Payment Evaluation
- `/get-v1-radar-value-list-items` — List all value list items
- `/post-v1-radar-value-list-items` — Create a value list item
- `/get-v1-radar-value-list-items-item` — Retrieve a value list item
- `/delete-v1-radar-value-list-items-item` — Delete a value list item
- `/get-v1-radar-value-lists` — List all value lists
- `/post-v1-radar-value-lists` — Create a value list
- `/get-v1-radar-value-lists-value-list` — Retrieve a value list
- `/post-v1-radar-value-lists-value-list` — Update a value list
- `/delete-v1-radar-value-lists-value-list` — Delete a value list
- `/get-v1-refunds` — List all refunds
- `/post-v1-refunds` — Create customer balance refund
- `/get-v1-refunds-refund` — Retrieve a refund
- `/post-v1-refunds-refund` — Update a refund
- `/post-v1-refunds-refund-cancel` — Cancel a refund
- `/get-v1-reporting-report-runs` — List all Report Runs
- `/post-v1-reporting-report-runs` — Create a Report Run
- `/get-v1-reporting-report-runs-report-run` — Retrieve a Report Run
- `/get-v1-reporting-report-types` — List all Report Types
- `/get-v1-reporting-report-types-report-type` — Retrieve a Report Type
- `/get-v1-reviews` — List all open reviews
- `/get-v1-reviews-review` — Retrieve a review
- `/post-v1-reviews-review-approve` — Approve a review
- `/get-v1-setup-attempts` — List all SetupAttempts
- `/get-v1-setup-intents` — List all SetupIntents
- `/post-v1-setup-intents` — Create a SetupIntent
- `/get-v1-setup-intents-intent` — Retrieve a SetupIntent
- `/post-v1-setup-intents-intent` — Update a SetupIntent
- `/post-v1-setup-intents-intent-cancel` — Cancel a SetupIntent
- `/post-v1-setup-intents-intent-confirm` — Confirm a SetupIntent
- `/post-v1-setup-intents-intent-verify-microdeposits` — Verify microdeposits on a SetupIntent
- `/get-v1-shipping-rates` — List all shipping rates
- `/post-v1-shipping-rates` — Create a shipping rate
- `/get-v1-shipping-rates-shipping-rate-token` — Retrieve a shipping rate
- `/post-v1-shipping-rates-shipping-rate-token` — Update a shipping rate
- `/post-v1-sigma-saved-queries-id` — Update an existing Sigma Query
- `/get-v1-sigma-scheduled-query-runs` — List all scheduled query runs
- `/get-v1-sigma-scheduled-query-runs-scheduled-query-run` — Retrieve a scheduled query run
- `/post-v1-sources` — Shares a source
- `/get-v1-sources-source` — Retrieve a source
- `/post-v1-sources-source` — Update a source
- `/get-v1-sources-source-mandate-notifications-mandate-notification` — Retrieve a Source MandateNotification
- `/get-v1-sources-source-source-transactions` — <p>List source transactions for a given source.</p>
- `/get-v1-sources-source-source-transactions-source-transaction` — Retrieve a source transaction
- `/post-v1-sources-source-verify` — <p>Verify a given source.</p>
- `/get-v1-subscription-items` — List all subscription items
- `/post-v1-subscription-items` — Create a subscription item
- `/get-v1-subscription-items-item` — Retrieve a subscription item
- `/post-v1-subscription-items-item` — Update a subscription item
- `/delete-v1-subscription-items-item` — Delete a subscription item
- `/get-v1-subscription-schedules` — List all schedules
- `/post-v1-subscription-schedules` — Create a schedule
- `/get-v1-subscription-schedules-schedule` — Retrieve a schedule
- `/post-v1-subscription-schedules-schedule` — Update a schedule
- `/post-v1-subscription-schedules-schedule-cancel` — Cancel a schedule
- `/post-v1-subscription-schedules-schedule-release` — Release a schedule
- `/get-v1-subscriptions` — List subscriptions
- `/post-v1-subscriptions` — Create a subscription
- `/get-v1-subscriptions-search` — Search subscriptions
- `/get-v1-subscriptions-subscription-exposed-id` — Retrieve a subscription
- `/post-v1-subscriptions-subscription-exposed-id` — Update a subscription
- `/delete-v1-subscriptions-subscription-exposed-id` — Cancel a subscription
- `/delete-v1-subscriptions-subscription-exposed-id-discount` — Delete a subscription discount
- `/post-v1-subscriptions-subscription-migrate` — Migrate a subscription
- `/post-v1-subscriptions-subscription-resume` — Resume a subscription
- `/get-v1-tax-associations-find` — Find a Tax Association
- `/post-v1-tax-calculations` — Create a Calculation
- `/get-v1-tax-calculations-calculation` — Retrieve a Calculation
- `/get-v1-tax-calculations-calculation-line-items` — Retrieve a Calculation's line items
- `/get-v1-tax-registrations` — List registrations
- `/post-v1-tax-registrations` — Create a registration
- `/get-v1-tax-registrations-id` — Retrieve a registration
- `/post-v1-tax-registrations-id` — Update a registration
- `/get-v1-tax-settings` — Retrieve settings
- `/post-v1-tax-settings` — Update settings
- `/post-v1-tax-transactions-create-from-calculation` — Create a Transaction from a Calculation
- `/post-v1-tax-transactions-create-reversal` — Create a reversal Transaction
- `/get-v1-tax-transactions-transaction` — Retrieve a Transaction
- `/get-v1-tax-transactions-transaction-line-items` — Retrieve a Transaction's line items
- `/get-v1-tax-codes` — List all tax codes
- `/get-v1-tax-codes-id` — Retrieve a tax code
- `/get-v1-tax-ids` — List all tax IDs
- `/post-v1-tax-ids` — Create a tax ID
- `/get-v1-tax-ids-id` — Retrieve a tax ID
- `/delete-v1-tax-ids-id` — Delete a tax ID
- `/get-v1-tax-rates` — List all tax rates
- `/post-v1-tax-rates` — Create a tax rate
- `/get-v1-tax-rates-tax-rate` — Retrieve a tax rate
- `/post-v1-tax-rates-tax-rate` — Update a tax rate
- `/get-v1-terminal-configurations` — List all Configurations
- `/post-v1-terminal-configurations` — Create a Configuration
- `/get-v1-terminal-configurations-configuration` — Retrieve a Configuration
- `/post-v1-terminal-configurations-configuration` — Update a Configuration
- `/delete-v1-terminal-configurations-configuration` — Delete a Configuration
- `/post-v1-terminal-connection-tokens` — Create a Connection Token
- `/get-v1-terminal-locations` — List all Locations
- `/post-v1-terminal-locations` — Create a Location
- `/get-v1-terminal-locations-location` — Retrieve a Location
- `/post-v1-terminal-locations-location` — Update a Location
- `/delete-v1-terminal-locations-location` — Delete a Location
- `/post-v1-terminal-onboarding-links` — Create an Onboarding Link
- `/get-v1-terminal-readers` — List all Readers
- `/post-v1-terminal-readers` — Create a Reader
- `/get-v1-terminal-readers-reader` — Retrieve a Reader
- `/post-v1-terminal-readers-reader` — Update a Reader
- `/delete-v1-terminal-readers-reader` — Delete a Reader
- `/post-v1-terminal-readers-reader-cancel-action` — Cancel the current reader action
- `/post-v1-terminal-readers-reader-collect-inputs` — Collect inputs using a Reader
- `/post-v1-terminal-readers-reader-collect-payment-method` — Hand off a PaymentIntent to a Reader and collect card details
- `/post-v1-terminal-readers-reader-confirm-payment-intent` — Confirm a PaymentIntent on the Reader
- `/post-v1-terminal-readers-reader-process-payment-intent` — Hand-off a PaymentIntent to a Reader
- `/post-v1-terminal-readers-reader-process-setup-intent` — Hand-off a SetupIntent to a Reader
- `/post-v1-terminal-readers-reader-refund-payment` — Refund a Charge or a PaymentIntent in-person
- `/post-v1-terminal-readers-reader-set-reader-display` — Set reader display
- `/post-v1-terminal-refunds` — Create a refund using a Terminal-supported device.
- `/post-v1-test-helpers-confirmation-tokens` — Create a test Confirmation Token
- `/post-v1-test-helpers-customers-customer-fund-cash-balance` — Fund a test mode cash balance
- `/post-v1-test-helpers-issuing-authorizations` — Create a test-mode authorization
- `/post-v1-test-helpers-issuing-authorizations-authorization-capture` — Capture a test-mode authorization
- `/post-v1-test-helpers-issuing-authorizations-authorization-expire` — Expire a test-mode authorization
- `/post-v1-test-helpers-issuing-authorizations-authorization-finaliz` — Finalize a test-mode authorization's amount
- `/post-v1-test-helpers-issuing-authorizations-authorization-fraud-c` — Respond to fraud challenge
- `/post-v1-test-helpers-issuing-authorizations-authorization-increme` — Increment a test-mode authorization
- `/post-v1-test-helpers-issuing-authorizations-authorization-reverse` — Reverse a test-mode authorization
- `/post-v1-test-helpers-issuing-cards-card-shipping-deliver` — Deliver a testmode card
- `/post-v1-test-helpers-issuing-cards-card-shipping-fail` — Fail a testmode card
- `/post-v1-test-helpers-issuing-cards-card-shipping-return` — Return a testmode card
- `/post-v1-test-helpers-issuing-cards-card-shipping-ship` — Ship a testmode card
- `/post-v1-test-helpers-issuing-cards-card-shipping-submit` — Submit a testmode card
- `/post-v1-test-helpers-issuing-personalization-designs-personalizat` — Activate a testmode personalization design
- `/post-v1-test-helpers-issuing-personalization-designs-personalizat` — Deactivate a testmode personalization design
- `/post-v1-test-helpers-issuing-personalization-designs-personalizat` — Reject a testmode personalization design
- `/post-v1-test-helpers-issuing-settlements` — Create a test-mode settlement
- `/post-v1-test-helpers-issuing-settlements-settlement-complete` — Complete a test-mode settlement
- `/post-v1-test-helpers-issuing-transactions-create-force-capture` — Create a test-mode force capture
- `/post-v1-test-helpers-issuing-transactions-create-unlinked-refund` — Create a test-mode unlinked refund
- `/post-v1-test-helpers-issuing-transactions-transaction-refund` — Refund a test-mode transaction
- `/post-v1-test-helpers-refunds-refund-expire` — Expire a pending refund.
- `/post-v1-test-helpers-terminal-readers-reader-present-payment-meth` — Simulate presenting a payment method
- `/post-v1-test-helpers-terminal-readers-reader-succeed-input-collec` — Simulate a successful input collection
- `/post-v1-test-helpers-terminal-readers-reader-timeout-input-collec` — Simulate an input collection timeout
- `/get-v1-test-helpers-test-clocks` — List all test clocks
- `/post-v1-test-helpers-test-clocks` — Create a test clock
- `/get-v1-test-helpers-test-clocks-test-clock` — Retrieve a test clock
- `/delete-v1-test-helpers-test-clocks-test-clock` — Delete a test clock
- `/post-v1-test-helpers-test-clocks-test-clock-advance` — Advance a test clock
- `/post-v1-test-helpers-treasury-inbound-transfers-id-fail` — Test mode: Fail an InboundTransfer
- `/post-v1-test-helpers-treasury-inbound-transfers-id-return` — Test mode: Return an InboundTransfer
- `/post-v1-test-helpers-treasury-inbound-transfers-id-succeed` — Test mode: Succeed an InboundTransfer
- `/post-v1-test-helpers-treasury-outbound-payments-id` — Test mode: Update an OutboundPayment
- `/post-v1-test-helpers-treasury-outbound-payments-id-fail` — Test mode: Fail an OutboundPayment
- `/post-v1-test-helpers-treasury-outbound-payments-id-post` — Test mode: Post an OutboundPayment
- `/post-v1-test-helpers-treasury-outbound-payments-id-return` — Test mode: Return an OutboundPayment
- `/post-v1-test-helpers-treasury-outbound-transfers-outbound-transfe` — Test mode: Update an OutboundTransfer
- `/post-v1-test-helpers-treasury-outbound-transfers-outbound-transfe` — Test mode: Fail an OutboundTransfer
- `/post-v1-test-helpers-treasury-outbound-transfers-outbound-transfe` — Test mode: Post an OutboundTransfer
- `/post-v1-test-helpers-treasury-outbound-transfers-outbound-transfe` — Test mode: Return an OutboundTransfer
- `/post-v1-test-helpers-treasury-received-credits` — Test mode: Create a ReceivedCredit
- `/post-v1-test-helpers-treasury-received-debits` — Test mode: Create a ReceivedDebit
- `/post-v1-tokens` — Create a CVC update token
- `/get-v1-tokens-token` — Retrieve a token
- `/get-v1-topups` — List all top-ups
- `/post-v1-topups` — Create a top-up
- `/get-v1-topups-topup` — Retrieve a top-up
- `/post-v1-topups-topup` — Update a top-up
- `/post-v1-topups-topup-cancel` — Cancel a top-up
- `/get-v1-transfers` — List all transfers
- `/post-v1-transfers` — Create a transfer
- `/get-v1-transfers-id-reversals` — List all reversals
- `/post-v1-transfers-id-reversals` — Create a transfer reversal
- `/get-v1-transfers-transfer` — Retrieve a transfer
- `/post-v1-transfers-transfer` — Update a transfer
- `/get-v1-transfers-transfer-reversals-id` — Retrieve a reversal
- `/post-v1-transfers-transfer-reversals-id` — Update a reversal
- `/get-v1-treasury-credit-reversals` — List all CreditReversals
- `/post-v1-treasury-credit-reversals` — Create a CreditReversal
- `/get-v1-treasury-credit-reversals-credit-reversal` — Retrieve a CreditReversal
- `/get-v1-treasury-debit-reversals` — List all DebitReversals
- `/post-v1-treasury-debit-reversals` — Create a DebitReversal
- `/get-v1-treasury-debit-reversals-debit-reversal` — Retrieve a DebitReversal
- `/get-v1-treasury-financial-accounts` — List all FinancialAccounts
- `/post-v1-treasury-financial-accounts` — Create a FinancialAccount
- `/get-v1-treasury-financial-accounts-financial-account` — Retrieve a FinancialAccount
- `/post-v1-treasury-financial-accounts-financial-account` — Update a FinancialAccount
- `/post-v1-treasury-financial-accounts-financial-account-close` — Close a FinancialAccount
- `/get-v1-treasury-financial-accounts-financial-account-features` — Retrieve FinancialAccount Features
- `/post-v1-treasury-financial-accounts-financial-account-features` — Update FinancialAccount Features
- `/get-v1-treasury-inbound-transfers` — List all InboundTransfers
- `/post-v1-treasury-inbound-transfers` — Create an InboundTransfer
- `/get-v1-treasury-inbound-transfers-id` — Retrieve an InboundTransfer
- `/post-v1-treasury-inbound-transfers-inbound-transfer-cancel` — Cancel an InboundTransfer
- `/get-v1-treasury-outbound-payments` — List all OutboundPayments
- `/post-v1-treasury-outbound-payments` — Create an OutboundPayment
- `/get-v1-treasury-outbound-payments-id` — Retrieve an OutboundPayment
- `/post-v1-treasury-outbound-payments-id-cancel` — Cancel an OutboundPayment
- `/get-v1-treasury-outbound-transfers` — List all OutboundTransfers
- `/post-v1-treasury-outbound-transfers` — Create an OutboundTransfer
- `/get-v1-treasury-outbound-transfers-outbound-transfer` — Retrieve an OutboundTransfer
- `/post-v1-treasury-outbound-transfers-outbound-transfer-cancel` — Cancel an OutboundTransfer
- `/get-v1-treasury-received-credits` — List all ReceivedCredits
- `/get-v1-treasury-received-credits-id` — Retrieve a ReceivedCredit
- `/get-v1-treasury-received-debits` — List all ReceivedDebits
- `/get-v1-treasury-received-debits-id` — Retrieve a ReceivedDebit
- `/get-v1-treasury-transaction-entries` — List all TransactionEntries
- `/get-v1-treasury-transaction-entries-id` — Retrieve a TransactionEntry
- `/get-v1-treasury-transactions` — List all Transactions
- `/get-v1-treasury-transactions-id` — Retrieve a Transaction
- `/get-v1-webhook-endpoints` — List all webhook endpoints
- `/post-v1-webhook-endpoints` — Create a webhook endpoint
- `/get-v1-webhook-endpoints-webhook-endpoint` — Retrieve a webhook endpoint
- `/post-v1-webhook-endpoints-webhook-endpoint` — Update a webhook endpoint
- `/delete-v1-webhook-endpoints-webhook-endpoint` — Delete a webhook endpoint

## Usage

```ts
import { StripeClient } from './stripe/client.js';

const client = new StripeClient(process.env.STRIPE_API_TOKEN!);
```

## Auth pattern

Set `API_TOKEN` (or the env var specific to this API) before running any command.
All generated curl examples use `-H "Authorization: Bearer $API_TOKEN"`.

## Maintenance

- **Re-forge**: `node ~/.agentskills/bin/forge-skill-from-openapi.mjs <spec-url> skills/stripe --name stripe`
- **Hand-edit**: add examples, tweak descriptions, add business-context to commands.
- **Spec drift**: re-running forge overwrites generated files; custom edits in `commands/*.md` survive if you rename the file.

## Source

Generated 2026-06-18 by forge-skill-from-openapi.
Spec: https://api.stripe.com/
