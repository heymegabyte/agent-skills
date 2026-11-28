## ADDED Requirements

### Requirement: Verify redirect denial in the deployed runtime

Cloudflare Workers integrations SHALL use manual redirect handling and validate the response status for a fixed outbound destination. Qualification SHALL exercise a valid response and redirect denial in Workerd.

#### Scenario: Workerd receives a redirect from a fixed outbound destination

- **GIVEN** an outbound connector request whose destination is approved
- **WHEN** the provider responds with a redirect
- **THEN** the Worker treats it as an unsuccessful response without reaching the redirect destination.
