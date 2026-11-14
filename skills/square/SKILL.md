---
name: square
description: "Square API skill — auto-forged from OpenAPI 2.0. Use Square APIs to manage and run business including payment, customer, product, inventory, and employee management."
triggers: ["square API", "working with Square"]
version: 1.0.0
forged-from: openapi
api-title: Square
api-version: 2.0
---

# Square API Skill

<!-- commands-collapsed -->
> **Per-endpoint pages collapsed.** The 328 `commands/*.md` files (one per endpoint) were removed to cut file count — they were forge-generated, unrouted, and reproduce what Context7 (live API docs) and the typed `client.ts` already provide (some integrations also expose a live MCP server). The **Slash Commands** inventory below is retained.
> Restore full offline curl/param detail any time: `node bin/forge-skill-from-openapi.mjs <spec-url> skills/square --name square`.


Auto-forged from the Square OpenAPI spec (v2.0).

## What this skill provides

- **328 slash commands** — one per API endpoint, with curl examples and typed guidance
- **`types.ts`** — TypeScript types auto-generated from OpenAPI schemas
- **`client.ts`** — Typed fetch-based API client (zero deps, Workers-compatible)

## Slash Commands

- `/post-oauth2-revoke` — RevokeToken
- `/post-oauth2-token` — ObtainToken
- `/post-oauth2-token-status` — RetrieveTokenStatus
- `/get-v1-location-id-orders` — V1ListOrders
- `/get-v1-location-id-orders-order-id` — V1RetrieveOrder
- `/put-v1-location-id-orders-order-id` — V1UpdateOrder
- `/post-v2-apple-pay-domains` — RegisterDomain
- `/get-v2-bank-accounts` — ListBankAccounts
- `/post-v2-bank-accounts` — CreateBankAccount
- `/get-v2-bank-accounts-by-v1-id-v1-bank-account-id` — GetBankAccountByV1Id
- `/get-v2-bank-accounts-bank-account-id` — GetBankAccount
- `/post-v2-bank-accounts-bank-account-id-disable` — DisableBankAccount
- `/get-v2-bookings` — ListBookings
- `/post-v2-bookings` — CreateBooking
- `/post-v2-bookings-availability-search` — SearchAvailability
- `/post-v2-bookings-bulk-retrieve` — BulkRetrieveBookings
- `/get-v2-bookings-business-booking-profile` — RetrieveBusinessBookingProfile
- `/get-v2-bookings-custom-attribute-definitions` — ListBookingCustomAttributeDefinitions
- `/post-v2-bookings-custom-attribute-definitions` — CreateBookingCustomAttributeDefinition
- `/get-v2-bookings-custom-attribute-definitions-key` — RetrieveBookingCustomAttributeDefinition
- `/put-v2-bookings-custom-attribute-definitions-key` — UpdateBookingCustomAttributeDefinition
- `/delete-v2-bookings-custom-attribute-definitions-key` — DeleteBookingCustomAttributeDefinition
- `/post-v2-bookings-custom-attributes-bulk-delete` — BulkDeleteBookingCustomAttributes
- `/post-v2-bookings-custom-attributes-bulk-upsert` — BulkUpsertBookingCustomAttributes
- `/get-v2-bookings-location-booking-profiles` — ListLocationBookingProfiles
- `/get-v2-bookings-location-booking-profiles-location-id` — RetrieveLocationBookingProfile
- `/get-v2-bookings-team-member-booking-profiles` — ListTeamMemberBookingProfiles
- `/post-v2-bookings-team-member-booking-profiles-bulk-retrieve` — BulkRetrieveTeamMemberBookingProfiles
- `/get-v2-bookings-team-member-booking-profiles-team-member-id` — RetrieveTeamMemberBookingProfile
- `/get-v2-bookings-booking-id` — RetrieveBooking
- `/put-v2-bookings-booking-id` — UpdateBooking
- `/post-v2-bookings-booking-id-cancel` — CancelBooking
- `/get-v2-bookings-booking-id-custom-attributes` — ListBookingCustomAttributes
- `/get-v2-bookings-booking-id-custom-attributes-key` — RetrieveBookingCustomAttribute
- `/put-v2-bookings-booking-id-custom-attributes-key` — UpsertBookingCustomAttribute
- `/delete-v2-bookings-booking-id-custom-attributes-key` — DeleteBookingCustomAttribute
- `/get-v2-cards` — ListCards
- `/post-v2-cards` — CreateCard
- `/get-v2-cards-card-id` — RetrieveCard
- `/post-v2-cards-card-id-disable` — DisableCard
- `/get-v2-cash-drawers-shifts` — ListCashDrawerShifts
- `/get-v2-cash-drawers-shifts-shift-id` — RetrieveCashDrawerShift
- `/get-v2-cash-drawers-shifts-shift-id-events` — ListCashDrawerShiftEvents
- `/post-v2-catalog-batch-delete` — BatchDeleteCatalogObjects
- `/post-v2-catalog-batch-retrieve` — BatchRetrieveCatalogObjects
- `/post-v2-catalog-batch-upsert` — BatchUpsertCatalogObjects
- `/post-v2-catalog-images` — CreateCatalogImage
- `/put-v2-catalog-images-image-id` — UpdateCatalogImage
- `/get-v2-catalog-info` — CatalogInfo
- `/get-v2-catalog-list` — ListCatalog
- `/post-v2-catalog-object` — UpsertCatalogObject
- `/get-v2-catalog-object-object-id` — RetrieveCatalogObject
- `/delete-v2-catalog-object-object-id` — DeleteCatalogObject
- `/post-v2-catalog-search` — SearchCatalogObjects
- `/post-v2-catalog-search-catalog-items` — SearchCatalogItems
- `/post-v2-catalog-update-item-modifier-lists` — UpdateItemModifierLists
- `/post-v2-catalog-update-item-taxes` — UpdateItemTaxes
- `/get-v2-channels` — ListChannels
- `/post-v2-channels-bulk-retrieve` — BulkRetrieveChannels
- `/get-v2-channels-channel-id` — RetrieveChannel
- `/get-v2-customers` — ListCustomers
- `/post-v2-customers` — CreateCustomer
- `/post-v2-customers-bulk-create` — BulkCreateCustomers
- `/post-v2-customers-bulk-delete` — BulkDeleteCustomers
- `/post-v2-customers-bulk-retrieve` — BulkRetrieveCustomers
- `/post-v2-customers-bulk-update` — BulkUpdateCustomers
- `/get-v2-customers-custom-attribute-definitions` — ListCustomerCustomAttributeDefinitions
- `/post-v2-customers-custom-attribute-definitions` — CreateCustomerCustomAttributeDefinition
- `/get-v2-customers-custom-attribute-definitions-key` — RetrieveCustomerCustomAttributeDefinition
- `/put-v2-customers-custom-attribute-definitions-key` — UpdateCustomerCustomAttributeDefinition
- `/delete-v2-customers-custom-attribute-definitions-key` — DeleteCustomerCustomAttributeDefinition
- `/post-v2-customers-custom-attributes-bulk-upsert` — BulkUpsertCustomerCustomAttributes
- `/get-v2-customers-groups` — ListCustomerGroups
- `/post-v2-customers-groups` — CreateCustomerGroup
- `/get-v2-customers-groups-group-id` — RetrieveCustomerGroup
- `/put-v2-customers-groups-group-id` — UpdateCustomerGroup
- `/delete-v2-customers-groups-group-id` — DeleteCustomerGroup
- `/post-v2-customers-search` — SearchCustomers
- `/get-v2-customers-segments` — ListCustomerSegments
- `/get-v2-customers-segments-segment-id` — RetrieveCustomerSegment
- `/get-v2-customers-customer-id` — RetrieveCustomer
- `/put-v2-customers-customer-id` — UpdateCustomer
- `/delete-v2-customers-customer-id` — DeleteCustomer
- `/post-v2-customers-customer-id-cards` — CreateCustomerCard
- `/delete-v2-customers-customer-id-cards-card-id` — DeleteCustomerCard
- `/get-v2-customers-customer-id-custom-attributes` — ListCustomerCustomAttributes
- `/get-v2-customers-customer-id-custom-attributes-key` — RetrieveCustomerCustomAttribute
- `/post-v2-customers-customer-id-custom-attributes-key` — UpsertCustomerCustomAttribute
- `/delete-v2-customers-customer-id-custom-attributes-key` — DeleteCustomerCustomAttribute
- `/put-v2-customers-customer-id-groups-group-id` — AddGroupToCustomer
- `/delete-v2-customers-customer-id-groups-group-id` — RemoveGroupFromCustomer
- `/get-v2-devices` — ListDevices
- `/get-v2-devices-codes` — ListDeviceCodes
- `/post-v2-devices-codes` — CreateDeviceCode
- `/get-v2-devices-codes-id` — GetDeviceCode
- `/get-v2-devices-device-id` — GetDevice
- `/get-v2-disputes` — ListDisputes
- `/get-v2-disputes-dispute-id` — RetrieveDispute
- `/post-v2-disputes-dispute-id-accept` — AcceptDispute
- `/get-v2-disputes-dispute-id-evidence` — ListDisputeEvidence
- `/post-v2-disputes-dispute-id-evidence-files` — CreateDisputeEvidenceFile
- `/post-v2-disputes-dispute-id-evidence-text` — CreateDisputeEvidenceText
- `/get-v2-disputes-dispute-id-evidence-evidence-id` — RetrieveDisputeEvidence
- `/delete-v2-disputes-dispute-id-evidence-evidence-id` — DeleteDisputeEvidence
- `/post-v2-disputes-dispute-id-submit-evidence` — SubmitEvidence
- `/get-v2-employees` — ListEmployees
- `/get-v2-employees-id` — RetrieveEmployee
- `/post-v2-events` — SearchEvents
- `/put-v2-events-disable` — DisableEvents
- `/put-v2-events-enable` — EnableEvents
- `/get-v2-events-types` — ListEventTypes
- `/get-v2-gift-cards` — ListGiftCards
- `/post-v2-gift-cards` — CreateGiftCard
- `/get-v2-gift-cards-activities` — ListGiftCardActivities
- `/post-v2-gift-cards-activities` — CreateGiftCardActivity
- `/post-v2-gift-cards-from-gan` — RetrieveGiftCardFromGAN
- `/post-v2-gift-cards-from-nonce` — RetrieveGiftCardFromNonce
- `/post-v2-gift-cards-gift-card-id-link-customer` — LinkCustomerToGiftCard
- `/post-v2-gift-cards-gift-card-id-unlink-customer` — UnlinkCustomerFromGiftCard
- `/get-v2-gift-cards-id` — RetrieveGiftCard
- `/get-v2-inventory-adjustment-adjustment-id` — DeprecatedRetrieveInventoryAdjustment
- `/get-v2-inventory-adjustments-adjustment-id` — RetrieveInventoryAdjustment
- `/post-v2-inventory-batch-change` — DeprecatedBatchChangeInventory
- `/post-v2-inventory-batch-retrieve-changes` — DeprecatedBatchRetrieveInventoryChanges
- `/post-v2-inventory-batch-retrieve-counts` — DeprecatedBatchRetrieveInventoryCounts
- `/post-v2-inventory-changes-batch-create` — BatchChangeInventory
- `/post-v2-inventory-changes-batch-retrieve` — BatchRetrieveInventoryChanges
- `/post-v2-inventory-counts-batch-retrieve` — BatchRetrieveInventoryCounts
- `/get-v2-inventory-physical-count-physical-count-id` — DeprecatedRetrieveInventoryPhysicalCount
- `/get-v2-inventory-physical-counts-physical-count-id` — RetrieveInventoryPhysicalCount
- `/get-v2-inventory-transfers-transfer-id` — RetrieveInventoryTransfer
- `/get-v2-inventory-catalog-object-id` — RetrieveInventoryCount
- `/get-v2-inventory-catalog-object-id-changes` — RetrieveInventoryChanges
- `/get-v2-invoices` — ListInvoices
- `/post-v2-invoices` — CreateInvoice
- `/post-v2-invoices-search` — SearchInvoices
- `/get-v2-invoices-invoice-id` — GetInvoice
- `/put-v2-invoices-invoice-id` — UpdateInvoice
- `/delete-v2-invoices-invoice-id` — DeleteInvoice
- `/post-v2-invoices-invoice-id-attachments` — CreateInvoiceAttachment
- `/delete-v2-invoices-invoice-id-attachments-attachment-id` — DeleteInvoiceAttachment
- `/post-v2-invoices-invoice-id-cancel` — CancelInvoice
- `/post-v2-invoices-invoice-id-publish` — PublishInvoice
- `/get-v2-labor-break-types` — ListBreakTypes
- `/post-v2-labor-break-types` — CreateBreakType
- `/get-v2-labor-break-types-id` — GetBreakType
- `/put-v2-labor-break-types-id` — UpdateBreakType
- `/delete-v2-labor-break-types-id` — DeleteBreakType
- `/get-v2-labor-employee-wages` — ListEmployeeWages
- `/get-v2-labor-employee-wages-id` — GetEmployeeWage
- `/post-v2-labor-scheduled-shifts` — CreateScheduledShift
- `/post-v2-labor-scheduled-shifts-bulk-publish` — BulkPublishScheduledShifts
- `/post-v2-labor-scheduled-shifts-search` — SearchScheduledShifts
- `/get-v2-labor-scheduled-shifts-id` — RetrieveScheduledShift
- `/put-v2-labor-scheduled-shifts-id` — UpdateScheduledShift
- `/post-v2-labor-scheduled-shifts-id-publish` — PublishScheduledShift
- `/post-v2-labor-shifts` — CreateShift
- `/post-v2-labor-shifts-search` — SearchShifts
- `/get-v2-labor-shifts-id` — GetShift
- `/put-v2-labor-shifts-id` — UpdateShift
- `/delete-v2-labor-shifts-id` — DeleteShift
- `/get-v2-labor-team-member-wages` — ListTeamMemberWages
- `/get-v2-labor-team-member-wages-id` — GetTeamMemberWage
- `/post-v2-labor-timecards` — CreateTimecard
- `/post-v2-labor-timecards-search` — SearchTimecards
- `/get-v2-labor-timecards-id` — RetrieveTimecard
- `/put-v2-labor-timecards-id` — UpdateTimecard
- `/delete-v2-labor-timecards-id` — DeleteTimecard
- `/get-v2-labor-workweek-configs` — ListWorkweekConfigs
- `/put-v2-labor-workweek-configs-id` — UpdateWorkweekConfig
- `/get-v2-locations` — ListLocations
- `/post-v2-locations` — CreateLocation
- `/get-v2-locations-custom-attribute-definitions` — ListLocationCustomAttributeDefinitions
- `/post-v2-locations-custom-attribute-definitions` — CreateLocationCustomAttributeDefinition
- `/get-v2-locations-custom-attribute-definitions-key` — RetrieveLocationCustomAttributeDefinition
- `/put-v2-locations-custom-attribute-definitions-key` — UpdateLocationCustomAttributeDefinition
- `/delete-v2-locations-custom-attribute-definitions-key` — DeleteLocationCustomAttributeDefinition
- `/post-v2-locations-custom-attributes-bulk-delete` — BulkDeleteLocationCustomAttributes
- `/post-v2-locations-custom-attributes-bulk-upsert` — BulkUpsertLocationCustomAttributes
- `/get-v2-locations-location-id` — RetrieveLocation
- `/put-v2-locations-location-id` — UpdateLocation
- `/post-v2-locations-location-id-checkouts` — CreateCheckout
- `/get-v2-locations-location-id-custom-attributes` — ListLocationCustomAttributes
- `/get-v2-locations-location-id-custom-attributes-key` — RetrieveLocationCustomAttribute
- `/post-v2-locations-location-id-custom-attributes-key` — UpsertLocationCustomAttribute
- `/delete-v2-locations-location-id-custom-attributes-key` — DeleteLocationCustomAttribute
- `/get-v2-locations-location-id-transactions` — ListTransactions
- `/get-v2-locations-location-id-transactions-transaction-id` — RetrieveTransaction
- `/post-v2-locations-location-id-transactions-transaction-id-capture` — CaptureTransaction
- `/post-v2-locations-location-id-transactions-transaction-id-void` — VoidTransaction
- `/post-v2-loyalty-accounts` — CreateLoyaltyAccount
- `/post-v2-loyalty-accounts-search` — SearchLoyaltyAccounts
- `/get-v2-loyalty-accounts-account-id` — RetrieveLoyaltyAccount
- `/post-v2-loyalty-accounts-account-id-accumulate` — AccumulateLoyaltyPoints
- `/post-v2-loyalty-accounts-account-id-adjust` — AdjustLoyaltyPoints
- `/post-v2-loyalty-events-search` — SearchLoyaltyEvents
- `/get-v2-loyalty-programs` — ListLoyaltyPrograms
- `/get-v2-loyalty-programs-program-id` — RetrieveLoyaltyProgram
- `/post-v2-loyalty-programs-program-id-calculate` — CalculateLoyaltyPoints
- `/get-v2-loyalty-programs-program-id-promotions` — ListLoyaltyPromotions
- `/post-v2-loyalty-programs-program-id-promotions` — CreateLoyaltyPromotion
- `/get-v2-loyalty-programs-program-id-promotions-promotion-id` — RetrieveLoyaltyPromotion
- `/post-v2-loyalty-programs-program-id-promotions-promotion-id-cance` — CancelLoyaltyPromotion
- `/post-v2-loyalty-rewards` — CreateLoyaltyReward
- `/post-v2-loyalty-rewards-search` — SearchLoyaltyRewards
- `/get-v2-loyalty-rewards-reward-id` — RetrieveLoyaltyReward
- `/delete-v2-loyalty-rewards-reward-id` — DeleteLoyaltyReward
- `/post-v2-loyalty-rewards-reward-id-redeem` — RedeemLoyaltyReward
- `/get-v2-merchants` — ListMerchants
- `/get-v2-merchants-custom-attribute-definitions` — ListMerchantCustomAttributeDefinitions
- `/post-v2-merchants-custom-attribute-definitions` — CreateMerchantCustomAttributeDefinition
- `/get-v2-merchants-custom-attribute-definitions-key` — RetrieveMerchantCustomAttributeDefinition
- `/put-v2-merchants-custom-attribute-definitions-key` — UpdateMerchantCustomAttributeDefinition
- `/delete-v2-merchants-custom-attribute-definitions-key` — DeleteMerchantCustomAttributeDefinition
- `/post-v2-merchants-custom-attributes-bulk-delete` — BulkDeleteMerchantCustomAttributes
- `/post-v2-merchants-custom-attributes-bulk-upsert` — BulkUpsertMerchantCustomAttributes
- `/get-v2-merchants-merchant-id` — RetrieveMerchant
- `/get-v2-merchants-merchant-id-custom-attributes` — ListMerchantCustomAttributes
- `/get-v2-merchants-merchant-id-custom-attributes-key` — RetrieveMerchantCustomAttribute
- `/post-v2-merchants-merchant-id-custom-attributes-key` — UpsertMerchantCustomAttribute
- `/delete-v2-merchants-merchant-id-custom-attributes-key` — DeleteMerchantCustomAttribute
- `/get-v2-online-checkout-location-settings-location-id` — RetrieveLocationSettings
- `/put-v2-online-checkout-location-settings-location-id` — UpdateLocationSettings
- `/get-v2-online-checkout-merchant-settings` — RetrieveMerchantSettings
- `/put-v2-online-checkout-merchant-settings` — UpdateMerchantSettings
- `/get-v2-online-checkout-payment-links` — ListPaymentLinks
- `/post-v2-online-checkout-payment-links` — CreatePaymentLink
- `/get-v2-online-checkout-payment-links-id` — RetrievePaymentLink
- `/put-v2-online-checkout-payment-links-id` — UpdatePaymentLink
- `/delete-v2-online-checkout-payment-links-id` — DeletePaymentLink
- `/post-v2-orders` — CreateOrder
- `/post-v2-orders-batch-retrieve` — BatchRetrieveOrders
- `/post-v2-orders-calculate` — CalculateOrder
- `/post-v2-orders-clone` — CloneOrder
- `/get-v2-orders-custom-attribute-definitions` — ListOrderCustomAttributeDefinitions
- `/post-v2-orders-custom-attribute-definitions` — CreateOrderCustomAttributeDefinition
- `/get-v2-orders-custom-attribute-definitions-key` — RetrieveOrderCustomAttributeDefinition
- `/put-v2-orders-custom-attribute-definitions-key` — UpdateOrderCustomAttributeDefinition
- `/delete-v2-orders-custom-attribute-definitions-key` — DeleteOrderCustomAttributeDefinition
- `/post-v2-orders-custom-attributes-bulk-delete` — BulkDeleteOrderCustomAttributes
- `/post-v2-orders-custom-attributes-bulk-upsert` — BulkUpsertOrderCustomAttributes
- `/post-v2-orders-search` — SearchOrders
- `/get-v2-orders-order-id` — RetrieveOrder
- `/put-v2-orders-order-id` — UpdateOrder
- `/get-v2-orders-order-id-custom-attributes` — ListOrderCustomAttributes
- `/get-v2-orders-order-id-custom-attributes-custom-attribute-key` — RetrieveOrderCustomAttribute
- `/post-v2-orders-order-id-custom-attributes-custom-attribute-key` — UpsertOrderCustomAttribute
- `/delete-v2-orders-order-id-custom-attributes-custom-attribute-key` — DeleteOrderCustomAttribute
- `/post-v2-orders-order-id-pay` — PayOrder
- `/get-v2-payments` — ListPayments
- `/post-v2-payments` — CreatePayment
- `/post-v2-payments-cancel` — CancelPaymentByIdempotencyKey
- `/get-v2-payments-payment-id` — GetPayment
- `/put-v2-payments-payment-id` — UpdatePayment
- `/post-v2-payments-payment-id-cancel` — CancelPayment
- `/post-v2-payments-payment-id-complete` — CompletePayment
- `/get-v2-payouts` — ListPayouts
- `/get-v2-payouts-payout-id` — GetPayout
- `/get-v2-payouts-payout-id-payout-entries` — ListPayoutEntries
- `/get-v2-refunds` — ListPaymentRefunds
- `/post-v2-refunds` — RefundPayment
- `/get-v2-refunds-refund-id` — GetPaymentRefund
- `/get-v2-sites` — ListSites
- `/get-v2-sites-site-id-snippet` — RetrieveSnippet
- `/post-v2-sites-site-id-snippet` — UpsertSnippet
- `/delete-v2-sites-site-id-snippet` — DeleteSnippet
- `/post-v2-subscriptions` — CreateSubscription
- `/post-v2-subscriptions-bulk-swap-plan` — BulkSwapPlan
- `/post-v2-subscriptions-search` — SearchSubscriptions
- `/get-v2-subscriptions-subscription-id` — RetrieveSubscription
- `/put-v2-subscriptions-subscription-id` — UpdateSubscription
- `/delete-v2-subscriptions-subscription-id-actions-action-id` — DeleteSubscriptionAction
- `/post-v2-subscriptions-subscription-id-billing-anchor` — ChangeBillingAnchorDate
- `/post-v2-subscriptions-subscription-id-cancel` — CancelSubscription
- `/get-v2-subscriptions-subscription-id-events` — ListSubscriptionEvents
- `/post-v2-subscriptions-subscription-id-pause` — PauseSubscription
- `/post-v2-subscriptions-subscription-id-resume` — ResumeSubscription
- `/post-v2-subscriptions-subscription-id-swap-plan` — SwapPlan
- `/post-v2-team-members` — CreateTeamMember
- `/post-v2-team-members-bulk-create` — BulkCreateTeamMembers
- `/post-v2-team-members-bulk-update` — BulkUpdateTeamMembers
- `/get-v2-team-members-jobs` — ListJobs
- `/post-v2-team-members-jobs` — CreateJob
- `/get-v2-team-members-jobs-job-id` — RetrieveJob
- `/put-v2-team-members-jobs-job-id` — UpdateJob
- `/post-v2-team-members-search` — SearchTeamMembers
- `/get-v2-team-members-team-member-id` — RetrieveTeamMember
- `/put-v2-team-members-team-member-id` — UpdateTeamMember
- `/get-v2-team-members-team-member-id-wage-setting` — RetrieveWageSetting
- `/put-v2-team-members-team-member-id-wage-setting` — UpdateWageSetting
- `/post-v2-terminals-actions` — CreateTerminalAction
- `/post-v2-terminals-actions-search` — SearchTerminalActions
- `/get-v2-terminals-actions-action-id` — GetTerminalAction
- `/post-v2-terminals-actions-action-id-cancel` — CancelTerminalAction
- `/post-v2-terminals-actions-action-id-dismiss` — DismissTerminalAction
- `/post-v2-terminals-checkouts` — CreateTerminalCheckout
- `/post-v2-terminals-checkouts-search` — SearchTerminalCheckouts
- `/get-v2-terminals-checkouts-checkout-id` — GetTerminalCheckout
- `/post-v2-terminals-checkouts-checkout-id-cancel` — CancelTerminalCheckout
- `/post-v2-terminals-checkouts-checkout-id-dismiss` — DismissTerminalCheckout
- `/post-v2-terminals-refunds` — CreateTerminalRefund
- `/post-v2-terminals-refunds-search` — SearchTerminalRefunds
- `/get-v2-terminals-refunds-terminal-refund-id` — GetTerminalRefund
- `/post-v2-terminals-refunds-terminal-refund-id-cancel` — CancelTerminalRefund
- `/post-v2-terminals-refunds-terminal-refund-id-dismiss` — DismissTerminalRefund
- `/post-v2-transfer-orders` — CreateTransferOrder
- `/post-v2-transfer-orders-search` — SearchTransferOrders
- `/get-v2-transfer-orders-transfer-order-id` — RetrieveTransferOrder
- `/put-v2-transfer-orders-transfer-order-id` — UpdateTransferOrder
- `/delete-v2-transfer-orders-transfer-order-id` — DeleteTransferOrder
- `/post-v2-transfer-orders-transfer-order-id-cancel` — CancelTransferOrder
- `/post-v2-transfer-orders-transfer-order-id-receive` — ReceiveTransferOrder
- `/post-v2-transfer-orders-transfer-order-id-start` — StartTransferOrder
- `/post-v2-vendors-bulk-create` — BulkCreateVendors
- `/post-v2-vendors-bulk-retrieve` — BulkRetrieveVendors
- `/put-v2-vendors-bulk-update` — BulkUpdateVendors
- `/post-v2-vendors-create` — CreateVendor
- `/post-v2-vendors-search` — SearchVendors
- `/get-v2-vendors-vendor-id` — RetrieveVendor
- `/put-v2-vendors-vendor-id` — UpdateVendor
- `/get-v2-webhooks-event-types` — ListWebhookEventTypes
- `/get-v2-webhooks-subscriptions` — ListWebhookSubscriptions
- `/post-v2-webhooks-subscriptions` — CreateWebhookSubscription
- `/get-v2-webhooks-subscriptions-subscription-id` — RetrieveWebhookSubscription
- `/put-v2-webhooks-subscriptions-subscription-id` — UpdateWebhookSubscription
- `/delete-v2-webhooks-subscriptions-subscription-id` — DeleteWebhookSubscription
- `/post-v2-webhooks-subscriptions-subscription-id-signature-key` — UpdateWebhookSubscriptionSignatureKey
- `/post-v2-webhooks-subscriptions-subscription-id-test` — TestWebhookSubscription

## Usage

```ts
import { SquareClient } from './square/client.js';

const client = new SquareClient(process.env.SQUARE_API_TOKEN!);
```

## Auth pattern

Set `API_TOKEN` (or the env var specific to this API) before running any command.
All generated curl examples use `-H "Authorization: Bearer $API_TOKEN"`.

## Maintenance

- **Re-forge**: `node ~/.agentskills/bin/forge-skill-from-openapi.mjs <spec-url> skills/square --name square`
- **Hand-edit**: add examples, tweak descriptions, add business-context to commands.
- **Spec drift**: re-running forge overwrites generated files; custom edits in `commands/*.md` survive if you rename the file.

## Source

Generated 2026-06-18 by forge-skill-from-openapi.
Spec: https://connect.squareup.com
