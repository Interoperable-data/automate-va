# VA-POC Micro Migration Plan

## Mission

Transform the existing Vue-powered VA-POC micro front-end into a distributable HTML + TypeScript application that runs entirely in the browser, while preserving the RDF-driven workflows described in `README.md`.

## Architecture & Constraints

- **Runtime**: Pure browser execution (no Node.js requirement at runtime).
- **UI layer**: HTML templates enhanced with [HTMX](https://htmx.org/) for partial updates and [Petite-Vue](https://github.com/vuejs/petite-vue) for lightweight reactivity.
- **Data handling**: RDF processing with [`n3`](https://github.com/rdfjs/N3.js) and graph persistence via [`quadstore`](https://github.com/beautifulinteractions/quadstore) + [`browser-level`](https://github.com/Level/browser-level) for IndexedDB storage.
- **Interop**: Continue using existing RDF helpers (local/remote fetch, conversions) rewritten for framework-free usage.
- **Form rendering**: All HTML5 forms that display or capture RDF **must** be generated via [`@ulb-darmstadt/shacl-form`](https://www.npmjs.com/package/@ulb-darmstadt/shacl-form), bound directly to the shared RDFJS Store implementation; plain HTML forms are permitted only for non-RDF interactions. SHACL shapes powering these forms will be supplied as JSON-LD documents bundled with the app or fetched on demand from remote endpoints.
- **Auth gating**: Defer persistence to ERA endpoints until MSAL login succeeds (via [`@azure/msal-browser`](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser)).
- **Tooling**: Keep Vite + TypeScript + Vitest; remove Vue-specific plugins. Build output must emit a static `dist/` bundle ready for distribution.
- **Hosting**: Primary delivery is through the ERA-managed GitHub Pages site, with a documented local HTTPS fallback (`TECHNICAL-SETUP.md`) for offline or restricted environments.
- **No-go**: Avoid large SPA frameworks (Vue/React/Angular), server-side rendering, Mocha, or Node-only dependencies in the shipped bundle.

## Workstreams & Task Checklist

### 1. Tooling & Build Pipeline

- [ ] Remove Vue plugin and dependencies (`vue`, `@vitejs/plugin-vue`, `.vue` SFC usage).
- [ ] Reconfigure `vite.config.ts` for a vanilla TypeScript entry point and static asset copy.
- [ ] Ensure `pnpm build` outputs a self-contained `dist/` folder with hashed assets and HTML shell ready for publication on GitHub Pages.
- [ ] Add a smoke test that loads the built `index.html` in headless Chromium (e.g., via Playwright or Vitest + happy-dom) to confirm runtime availability of required globals.
- [ ] Provide documentation for consuming the hosted build and the secure local fallback (see `TECHNICAL-SETUP.md`).

### 2. Application Shell & Navigation

- [ ] Replace the Vue root mount with a static `index.html` layout featuring:
  - Left navigation bar occupying 20% width, collapsible via CSS/JS toggle.
  - Main content area for page modules (Organisation data, Objects of Assessment, EVA, Raw RDF, Endpoints).
  - Top-right MSAL login status + action button.
- [ ] Implement nav state using Petite-Vue stores or plain TS modules to keep bundle minimal.
- [ ] Ensure responsive behaviour (collapse below tablet widths, keyboard accessible toggle button).

### 3. RDF Data Layer

- [ ] Port existing helper logic into framework-agnostic modules (`/src/data/`):
  - Fetch/parsing of Turtle (local files, remote URLs, SPARQL queries).
  - Conversion utilities between RDFJS Dataset, SolidDataset, and serialized Turtle/N-Triples.
- [ ] Wrap an IndexedDB-backed QuadStore instance for persistent graph storage (`browser-level` backend).
- [ ] Provide a `GraphSession` façade exposing CRUD, import/export, and query operations for UI modules.
- [ ] Guarantee browser compatibility by running bundles in latest Chrome/Firefox/Safari during development.

### 4. Feature Modules

- [ ] **Organisation Manager**: CRUD forms for organisations/units/sites, using Petite-Vue for local state, HTMX for partial table refresh, and `shacl-form` widgets bound to the QuadStore.
- [ ] **Objects of Assessment**: Manage subsystem declarations, CLDs, and linked documents; support linking to reused resources.
- [ ] **EVA Pre-Assessment**: Compose vehicle authorisation cases, integrate SHACL validation pipeline, render human-readable reports.
- [ ] **Raw RDF**: Read-only view of the active dataset; allow Turtle/N-Triples export using `n3.Writer`.
- [ ] **Endpoints Manager**: Maintain list of SPARQL endpoints + auth credentials, test connections, and bind to data sync routines.
- [ ] Establish lazy-loading or route-like switching between modules without full page reloads.

> ⚠️ Any feature module that surfaces RDF data entry must wrap `shacl-form`; alternative form builders are out of scope for RDF persistence.

### 5. Authentication & Persistence Flow

- [ ] Integrate `@azure/msal-browser` for MSAL authentication against the Agency tenant.
- [ ] Block outbound writes (e.g., POST to ERA endpoints) until an active MSAL session is detected.
- [ ] Store tokens securely in session storage; expose MSAL status to UI header.

### 6. Testing & Quality Gates

- [ ] **Unit tests (Vitest)** for RDF utilities, QuadStore wrapper, endpoint configuration manager, and auth gating logic.
- [ ] **Component behaviour tests** using `@testing-library/dom` or native DOM assertions to cover nav toggling, module switching, and HTMX flows.
- [ ] **Integration tests** simulating data import-export cycles and endpoint sync in a mocked environment.
- [ ] Maintain >85% statement coverage across modules.
- [ ] Wire tests into CI and ensure `pnpm test` runs headless-only suites (no Mocha).

## Module-to-Library Mapping & Browser Guarantee

| Module                  | Purpose                                            | Browser-Safe Libraries                                              |
| ----------------------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| Graph ingestion/export  | Parse Turtle, generate RDF                         | `n3` (ESM builds for browsers)                                      |
| Graph storage           | Persistent RDF store via IndexedDB                 | `quadstore` + `browser-level` (documented browser support)          |
| UI state & interactions | Declarative bindings, event-driven partial refresh | `Petite-Vue` (≈6KB, CDN-ready), `HTMX` (works via `<script>` tag)   |
| Form rendering          | Generate & persist RDF via HTML5 forms             | `@ulb-darmstadt/shacl-form` (uses RDFJS Store to talk to QuadStore) |
| Authentication          | MSAL login for ERA endpoints                       | `@azure/msal-browser` (official SPA SDK)                            |
| Networking              | Fetch remote Turtle/SPARQL, handle auth headers    | Native `fetch`, optional `ky` (if needed, browser-first)            |

All listed libraries ship browser-ready bundles. During implementation we will:

1. Load each library via ESM import in dev mode to confirm tree-shaking.
2. Verify no Node polyfills are required (Vite’s `optimizeDeps` will flag issues early).
3. Exercise critical paths (QuadStore init, MSAL login, RDF parsing) in Chromium/Firefox/Safari using manual smoke tests + automated checks.

## Test Coverage Plan

- **GraphSession tests**: Validate import from Turtle, storage, retrieval, and SPARQL endpoint sync; mock fetch and IndexedDB.
- **UI behaviour tests**: Use Vitest + happy-dom to ensure nav collapse, module activation, HTMX request triggers, and login gating signals.
- **Auth flow tests**: Mock MSAL client to assert save actions remain disabled while logged out.
- **Regression suite**: Replay sample CLDs (from `TTL/examples`) to confirm RDF outputs match snapshots.

## Deliverables

- Updated tooling configuration, package manifest, and TypeScript modules.
- New static HTML/CSS/JS assets satisfying layout requirements.
- Automated tests and coverage reports integrated into existing CI.
- `dist/` artefact verified to run in offline browser context (file:// or local server).

## Acceptance Gates

1. `pnpm build` -> `dist/` loads without dev server.
2. `pnpm test` -> all suites pass with required coverage.
3. Manual smoke test checklist completed on Chrome/Firefox/Safari.
4. Stakeholder sign-off on module functionality and MSAL-gated persistence.
