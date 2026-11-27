# Design

Extend the canonical fleet secret-handling rule rather than adding a competing skill. The policy uses store-qualified source identity, provider-specific live validation, exact capability routing, machine-identity denial, destination round trips, and drift-bound source retirement.

WARP enrollment credentials are bootstrap credentials, not proof of MCP authorization. Administrative account credentials have a separate human-only vault boundary. Provider-derived metadata is not migrated merely because it was encrypted.
