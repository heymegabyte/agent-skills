---
name: google-maps-panels
description: When a page shows a physical address/place, prefer embedding a stylized keyless Google Maps panel next to it — full-width banner or appropriately sized
triggers:
  - google maps
  - map embed
  - address panel
  - location map
  - place iframe
  - show the address on a map
  - contact page map
  - confirm page address
---

# Google Maps Stylized Panels (prefer on every address surface)

When a page shows a physical address / place, prefer embedding a **stylized Google Maps panel** next to it — full-width banner or appropriately sized. A bare address string is a missed trust + polish signal; a framed map removes "is this the right place?" ambiguity and reads premium.

## The rule

- **Any surface with an address in consideration** — booking confirm, order/track pages, contact, location / service-area pages, business listings, dispatch tickets — gets an embedded Google Maps panel showing that address.
- **Keyless by default:** use the classic iframe embed `https://maps.google.com/maps?q=<url-encoded address>&z=15&output=embed` — **NO API key required** (works even when the project runs keyless for Google). Reserve the keyed Embed API (`google.com/maps/embed/v1/place?key=…`) for when a key is provisioned AND advanced styling/markers are needed.
- **Style it on-brand — never a raw iframe:** rounded brand border, a gradient top-accent hairline, a muted `filter: grayscale(.3) contrast(1.05) brightness(.92)` that colorises on hover, and a bottom scrim with a pin badge + the address. Reference impl: brickcitylabor `src/web/components/AddressMap.tsx` (`<AddressMap address={…} heightClass="h-40" />`).
- **CSP:** allow the embed host in `frame-src` — `https://www.google.com https://maps.google.com` — in BOTH the worker CSP builder AND `public/_headers`; keep them in sync or the iframe is silently blocked.
- **A11y + resilience:** `loading="lazy"` + a `title`; the address is ALWAYS also present as real text (the map is enhancement, never the only source). Guard empty/blank addresses (render nothing).

## Anti-patterns

- Showing an address as text only when a map would remove doubt.
- A raw, unstyled Google Maps iframe — off-brand + jarring in a dark theme.
- Adding a keyed Embed API dependency when the keyless `output=embed` works.
- Forgetting the `frame-src` CSP entry → the map renders blank with a console CSP violation.

## Cross-links

- `[[image-quality]]` · `[[gorgeous-by-default]]` · `[[quality-metrics]]` (frame-src / CSP) · `[[cloudflare-native-provisioning]]` (keyless-first).
