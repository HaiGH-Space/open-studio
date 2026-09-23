# Codebase Structure & Directory Layout

## Overview
Open Studio is structured as a pnpm workspace monorepo. The core web client lives under `web/`, build-time indexing tools in `scripts/`, design resource assets in the `open-design-core-resources` git submodule, and project specifications in `docs/`.

---

## Directory Tree

```
open-studio/
├── .agents/                               # Agent skills & workflows
├── docs/                                  # Specifications, intent docs & codebase knowledge
│   ├── codebase/                          # Verifiable architecture & technical guides
│   │   ├── ARCHITECTURE.md
│   │   ├── CONCERNS.md
│   │   ├── CONVENTIONS.md
│   │   ├── INTEGRATIONS.md
│   │   ├── STACK.md
│   │   ├── STRUCTURE.md
│   │   └── TESTING.md
│   ├── intent/
│   │   └── open-studio.md                 # Statement of intent & non-goals
│   └── specs/
│       └── SPEC-open-studio.md            # Comprehensive formal specification
├── open-design-core-resources/            # Git submodule (HaiGH-Space/open-design-core-resources)
│   ├── craft/                             # Universal craft rules (typography, color, motion)
│   ├── design-systems/                    # Curated brand packages (manifests, DESIGN.md, tokens.css)
│   ├── design-templates/                  # Component and layout blueprints
│   ├── prompt-templates/                  # Video & image generation templates
│   ├── skills/                            # Agent execution skills
│   └── packages/contracts/                # Upstream TypeScript schemas
├── scripts/
│   └── generate-catalog.ts                # Catalog extraction, color swatch analysis & asset bundler
├── tasks/
│   ├── plan.md                            # High-level architecture plan & verification gates
│   └── todo.md                            # Checkpoint checklist (Tasks 1-16 complete)
├── web/                                   # Vite + React 19 Single Page Application
│   ├── public/
│   │   ├── catalog-index.json             # Generated searchable catalog metadata
│   │   ├── data/                          # On-demand static design assets (lazy fetch)
│   │   └── schemas/                       # JSON schemas
│   ├── src/
│   │   ├── assets/                        # Static bundled icons & SVGs
│   │   ├── components/                    # UI component tree
│   │   │   ├── clarification/             # <question-form> interactive modal & renderers
│   │   │   ├── cockpit/                   # 3-column cockpit layout & top bar
│   │   │   ├── layers/                    # 9 individual layer accordion editors
│   │   │   ├── preview/                   # Design system live preview modal
│   │   │   ├── theme-provider.tsx         # Dark/Light theme provider
│   │   │   └── ui/                        # Atomic Base UI primitives (buttons, dialogs, sliders)
│   │   ├── context/                       # React Context providers (CatalogContext, ComposerContext)
│   │   ├── hooks/                         # Custom React hooks (useCatalog, useComposer, useTokenCount)
│   │   ├── lib/                           # Pure domain logic, engines, and services
│   │   │   ├── catalog/                   # Catalog contracts and type definitions
│   │   │   ├── catalog-service.ts         # Async catalog fetcher & in-memory LRU cache
│   │   │   ├── clarification/             # AST parser and XML answer serializer
│   │   │   └── composer/                  # 9-layer composer engine, exporters, token counter
│   │   ├── App.tsx                        # Application root wiring providers & layout
│   │   ├── index.css                      # Tailwind v4 theme tokens & font declarations
│   │   └── main.tsx                       # Client DOM mounting entry point
│   ├── tests/                             # Vitest test suite (16 files, 303 tests)
│   │   └── fixtures/                      # Mock catalog and question XML fixtures
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── package.json                           # Root workspace configuration
└── SPEC.md                                # Root specification summary pointer
```

---

## Application Entry Points

1. **Client Mounting**:
   [`web/src/main.tsx`](../../web/src/main.tsx) mounts [`App.tsx`](../../web/src/App.tsx) into `#root`.

2. **Root Context Composition**:
   [`App.tsx`](../../web/src/App.tsx) wraps the app with `ThemeProvider`, `CatalogProvider`, and `ComposerProvider`.

3. **Cockpit View**:
   [`web/src/components/cockpit/StudioCockpit.tsx`](../../web/src/components/cockpit/StudioCockpit.tsx) coordinates the three interactive columns:
   - **Left Column (~25%)**: [`ResourceNavigator.tsx`](../../web/src/components/cockpit/ResourceNavigator.tsx)
   - **Center Column (~45%)**: [`ComposerManager.tsx`](../../web/src/components/cockpit/ComposerManager.tsx)
   - **Right Column (~30%)**: [`PromptInspector.tsx`](../../web/src/components/cockpit/PromptInspector.tsx)

4. **Catalog Indexing Script**:
   [`scripts/generate-catalog.ts`](../../scripts/generate-catalog.ts) is executed via `pnpm catalog:generate`. It crawls `open-design-core-resources/`, analyzes CSS variables, generates color swatches, and produces `web/public/catalog-index.json`.

---

## TypeScript Path Aliases

Vite and TypeScript are configured with the following root alias:
- `@/` maps to `web/src/` (configured in [`web/vite.config.ts`](../../web/vite.config.ts) and [`web/tsconfig.app.json`](../../web/tsconfig.app.json))

---

## Evidence & Verification Sources

- Monorepo directory verification: local filesystem scan
- Client mounting: [`web/src/main.tsx`](../../web/src/main.tsx)
- Application root: [`web/src/App.tsx`](../../web/src/App.tsx)
- Cockpit coordinator: [`web/src/components/cockpit/StudioCockpit.tsx`](../../web/src/components/cockpit/StudioCockpit.tsx)
- Catalog generator: [`scripts/generate-catalog.ts`](../../scripts/generate-catalog.ts)
- Alias configuration: [`web/vite.config.ts`](../../web/vite.config.ts)
