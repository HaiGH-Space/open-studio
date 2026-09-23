# External Integrations & Boundary Contracts

## Overview
Open Studio is intentionally architected as a self-contained, 100% client-side web application. It requires zero cloud databases, zero external backend servers, and zero third-party telemetry at runtime.

---

## External Services & Cloud APIs

| Service | Status | Rationale |
| :--- | :--- | :--- |
| **Backend API / Server** | **None** | All prompt synthesis, token estimation, and XML AST parsing executes strictly client-side in the browser. |
| **Authentication & IAM** | **None** | No user accounts or login required. Configuration persists locally. |
| **Database** | **None** | No remote database. Data is loaded from static build assets and browser storage. |
| **Analytics & Telemetry** | **None** | Zero remote tracking to guarantee absolute user privacy and prompt confidentiality. |

---

## Submodule & Static Asset Integrations

### 1. Core Resources Git Submodule
- **Source**: [`open-design-core-resources`](https://github.com/HaiGH-Space/open-design-core-resources)
- **Path**: `open-design-core-resources/`
- **Submodule Config**: `.gitmodules`
- **Role**: Contains 152 design systems, 11 craft rules, 163 skills, and 114 design templates.
- **Build Integration**: Extracted at build time by `scripts/generate-catalog.ts` into static JSON and assets in `web/public/`.

### 2. Static Asset Lazy Loading
- **Endpoint**: `/catalog-index.json` and `/data/**`
- **Mechanism**: The web client uses standard browser `fetch()` inside `CatalogService` to lazily retrieve raw `DESIGN.md` and `tokens.css` files only when a design system or craft rule is activated.

---

## Browser API Integrations

### 1. `localStorage` Persistence
- **Implementation**: [`web/src/lib/composer/persistence.ts`](../../web/src/lib/composer/persistence.ts)
- **Keys**:
  - `open_studio_user_memory`: Stores Layer 8 persistent negative constraints and custom prompt directives across browser sessions.
  - `open_studio_active_preset`: Stores user-selected preset states.

### 2. Async Clipboard API
- **Implementation**: `navigator.clipboard.writeText(...)` in [`web/src/components/cockpit/AppHeader.tsx`](../../web/src/components/cockpit/AppHeader.tsx) and [`web/src/components/cockpit/PromptInspector.tsx`](../../web/src/components/cockpit/PromptInspector.tsx).
- **Fallbacks**: Graceful error catching when clipboard permissions are restricted in headless testing environments.

### 3. File System Downloads (Blob URLs)
- **Implementation**: Generates downloadable artifacts (`CLAUDE.md`, `.cursorrules`, `.cursor/rules/open-studio.mdc`) using `URL.createObjectURL(new Blob([...]))` with automatic anchor click and URL revocation.

---

## Evidence & Verification Sources

- Git submodule contract: [`.gitmodules`](../../.gitmodules)
- Persistence implementation: [`web/src/lib/composer/persistence.ts`](../../web/src/lib/composer/persistence.ts)
- Static fetch service: [`web/src/lib/catalog-service.ts`](../../web/src/lib/catalog-service.ts)
- Exporter file downloads: [`web/src/lib/composer/exporters.ts`](../../web/src/lib/composer/exporters.ts)
