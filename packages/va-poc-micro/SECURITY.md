# Security Overview

## Identity and Session Management

- The application authenticates users exclusively through the Agency-managed Microsoft identity platform (MSAL) using the SPA authorization code flow with PKCE.
- MSAL is configured to require HTTPS redirects, enforce tenant restrictions, and validate issuer/audience claims for every token.
- Only authenticated users obtain an application session; all privileged actions (saving data, calling Agency services) are hidden until a valid MSAL account is present.
- Allowed origins are restricted to the ERA GitHub Pages deployment and the approved localhost HTTPS ports documented for secure fallback testing.

## Authorization Boundaries

- Access to Agency resources is controlled via MSAL scopes that map to specific back-end APIs; the baseline scope set enables SRMO and can be extended safely for additional services.
- Incremental consent is used so that each new endpoint requires explicit administrator approval before the SPA can request its scopes.
- Role and claim information returned by MSAL is re-validated against SRMO before enabling sensitive UI features.

## Token Handling & Storage

- Access and refresh tokens are stored in memory with sessionStorage fallbacks to avoid persistence beyond the browser session.
- Tokens are retrieved using `acquireTokenSilent`; interactive re-authentication is triggered only when silent acquisition fails.
- Token lifetimes and refresh policies follow Agency defaults; tokens are wiped immediately on logout, tab close events, or when idle-timeout thresholds are reached.

## SRMO Integration

- After login, the client requests an SRMO-specific access token and invokes the SRMO validation endpoint over HTTPS.
- SRMO responses provide the authoritative user profile (roles, organisation unit, clearance). This profile is cached in-memory and refreshed on scope changes or after a configurable TTL.
- Any mismatch between MSAL claims and SRMO records results in the UI revoking access to protected actions and prompting the user to re-validate with SRMO.

## Extending to Additional Agency Endpoints

- New endpoints are onboarded by registering an API scope within MSAL, documenting the required claims, and updating the SPA configuration to request the new scope.
- The client maintains an endpoint registry describing required scopes, throttling rules, and data classification so that future integrations inherit the same security controls.
- All outbound calls reuse the MSAL token cache, enforce per-endpoint CORS settings, and log token usage for audit purposes without exposing sensitive payloads.

## Transport & Network Security

- All traffic is served over HTTPS with TLS 1.2+; HSTS headers are set when hosting the static assets.
- The primary distribution channel is the ERA GitHub Pages host, which provides managed TLS certificates; local fallback hosting must present a trusted certificate before MSAL is enabled.
- Strict CORS policies allow Agency domains only; preflight failures fall back to user-visible error messages without leaking diagnostics.
- Requests include standard security headers (CSP, Referrer-Policy, X-Content-Type-Options, Permissions-Policy) to harden the browser environment.

## Client Hardening

- Code is bundled with Subresource Integrity hashes for all third-party CDN dependencies (HTMX, Petite-Vue, shacl-form).
- Content Security Policy defaults to `default-src 'self'` with explicit allow-lists for the MSAL endpoints and registered Agency APIs.
- Dependency scanning (pnpm audit, OSS review tooling) runs in CI; critical findings block release until patched.

## Data Protection & Logging

- The SPA stores business data inside IndexedDB via QuadStore; access to the store is guarded by the authenticated session and cleared on logout.
- Logs avoid writing personal data or tokens. Diagnostic information is routed through a redact/filter layer before being sent to monitoring services.
- Downloaded datasets (e.g., RDF exports) are tagged with the user principal name to support auditing without embedding tokens.

## Incident Response & Revocation

- Central auth teams can revoke access by disabling the user in Azure AD or removing scopes; the SPA reacts to `invalid_grant` errors by forcing logout.
- Emergency disablement of a downstream API is supported by toggling its entry in the endpoint registry, preventing new calls while displaying maintenance notices.
- Security advisories are tracked via the repository issue workflow; patches trigger automatic dependency rebuilds and redeployment of static assets.
