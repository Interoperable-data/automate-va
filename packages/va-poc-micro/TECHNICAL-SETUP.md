# Technical Requirements & Setup

## Hosted Access (Recommended)

- The Agency publishes the current VA-POC micro build on its GitHub Pages environment.
- Stakeholders receive the canonical HTTPS URL via official ERA communication channels.
- Use a modern Chromium, Firefox, or WebKit browser with IndexedDB enabled; no plug-ins are required.

## Local Secure Fallback

1. Install Node.js 18+ and pnpm.
2. Clone this repository (or unpack the distributed `dist/` archive) on your workstation.
3. Run `pnpm install && pnpm build` to generate a fresh `dist/` folder if you cloned the sources.
4. Serve the static assets over HTTPS using a local dev server (for example `npx http-server dist --ssl --cert <cert>.pem --key <key>.pem`).
5. Trust the self-signed certificate in your browser if prompted, then browse to `https://localhost:<port>/`.
6. Ensure the MSAL app registration contains the `https://localhost:<port>/` redirect URI before attempting to sign in.
7. Clear the QuadStore/IndexedDB data and revoke tokens when you finish testing on shared machines.

## Browser Capabilities

- IndexedDB, Web Crypto, and Fetch APIs must be available (standard in evergreen browsers).
- Third-party cookies can remain disabled; MSAL operates with first-party storage.
- Allow pop-ups for the site if your organisation blocks login redirects.

## Network Permissions

- Permit outbound HTTPS calls to the ERA GitHub Pages domain, SRMO API, EC Testbed, and any additional Agency endpoints configured for the POC.
- If a corporate proxy intercepts HTTPS, ensure it whitelists the MSAL endpoints to avoid token acquisition failures.

## Support

- Report access issues through the project issue tracker, including browser version, operating system, and whether you are using the hosted or local setup.
