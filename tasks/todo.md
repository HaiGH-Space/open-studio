# Task List: Open Studio

- **Implementation Plan:** [tasks/plan.md](file:///d:/Dev/JS/open-studio/tasks/plan.md)
- **Specification:** [SPEC.md](file:///d:/Dev/JS/open-studio/SPEC.md)

---

## Phase 1: Foundation & Project Scaffolding
- [ ] **Task 1: Project Scaffolding & Configuration**
  - Acceptance: Vite + React 18/19 + TypeScript + Tailwind CSS configured, dev server runs, static build succeeds.
  - Verify: `npm run build` succeeds without type errors.
  - Files: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `src/index.css`, `src/main.tsx`, `src/App.tsx`
- [ ] **Task 2: Build-Time Catalog Generator (`scripts/build-catalog.mjs`)**
  - Acceptance: Scans `open-design-core-resources/`, extracts 151+ brand metadata with 4-color preview swatches, 13 craft rules, and 114+ templates into `src/data/catalog.json`.
  - Verify: `node scripts/build-catalog.mjs` generates valid JSON (<120KB).
  - Files: `scripts/build-catalog.mjs`, `src/types/catalog.ts`, `package.json`
- [ ] **Task 3: Test Suite Setup & Lazy Asset Loader**
  - Acceptance: Vitest configured with jsdom; `engine/loader.ts` implements on-demand raw asset loading with in-memory caching and cross-platform path normalization.
  - Verify: `npm test` passes unit tests for asset loader.
  - Files: `vite.config.ts`, `src/engine/loader.ts`, `tests/engine/loader.test.ts`

### Checkpoint: Foundation
- [ ] All tests pass
- [ ] Catalog build generates metadata for 151+ brands
- [ ] Dev server and build succeed clean

---

## Phase 2: Core Engine & Tokenization
- [ ] **Task 4: Model-Agnostic Prompt Demarcators & Formatters**
  - Acceptance: Implements XML and Markdown wrapping helpers with closing tag validation and user brief escaping.
  - Verify: `npm test tests/engine/demarcators.test.ts` passes.
  - Files: `src/engine/demarcators.ts`, `tests/engine/demarcators.test.ts`
- [ ] **Task 5: Strict 8-Layer Prompt Stacking Engine**
  - Acceptance: Implements strict 8-layer assembly pipeline (USAGE → DESIGN.md → tokens.css → Components → Craft → Template → Guardrails → Brief), layer toggles, overrides, and default Open Design Guardrails.
  - Verify: `npm test tests/engine/stacker.test.ts` passes.
  - Files: `src/engine/stacker.ts`, `src/types/composer.ts`, `tests/engine/stacker.test.ts`
- [ ] **Task 6: Web Worker Tokenizer & Debounce Hook**
  - Acceptance: Off-thread BPE calculation using `gpt-tokenizer` inside `engine/tokenizer.worker.ts`, 300ms input debounce, instant heuristic fallback, and base layer token caching.
  - Verify: `npm test tests/engine/tokenizer.test.ts` passes.
  - Files: `src/engine/tokenizer.ts`, `src/engine/tokenizer.worker.ts`, `tests/engine/tokenizer.test.ts`

### Checkpoint: Core Engine
- [ ] 8-layer sequential assembly verified by unit tests
- [ ] Tokenizer runs off-thread without freezing UI on 40k token fixtures
- [ ] Guardrails enforce single-file HTML and `data-od-id` tagging

---

## Phase 3: State Management & Persistence
- [ ] **Task 7: LocalStorage State & Custom Hooks**
  - Acceptance: Implements `useComposerState`, `useFavorites`, and `usePresets` sandboxed under `open_studio_v1_*` with safe storage quota error handling.
  - Verify: `npm test tests/storage/persistence.test.ts` passes.
  - Files: `src/hooks/useComposerState.ts`, `src/hooks/useFavorites.ts`, `src/hooks/usePresets.ts`, `src/utils/storage.ts`, `tests/storage/persistence.test.ts`
- [ ] **Task 8: Presets Export & Import Validation**
  - Acceptance: Preset snapshot saving, loading, renaming, deletion, and JSON export/import with runtime schema validation.
  - Verify: `npm test tests/storage/presets.test.ts` passes.
  - Files: `src/utils/presetValidator.ts`, `src/hooks/usePresets.ts`, `tests/storage/presets.test.ts`

### Checkpoint: Persistence
- [ ] Favorites and draft state persist across page refreshes
- [ ] Preset snapshots restore complete composer state
- [ ] JSON export/import works with validation

---

## Phase 4: UI Components & Studio Workspace Layout
- [ ] **Task 9: Catalog Column (Column 1) & Brand Cards**
  - Acceptance: Instant fuzzy search, category filter pills, Favorites tab, and `BrandCard` with 4-swatch color bars and favorite stars.
  - Verify: Component renders in browser; search filters brands smoothly with sub-16ms latency.
  - Files: `src/components/catalog/CatalogColumn.tsx`, `src/components/catalog/BrandCard.tsx`, `src/components/catalog/CategoryFilters.tsx`
- [ ] **Task 10: Composer Column (Column 2) & Layer Accordion**
  - Acceptance: 8-layer accordion with toggle switches, raw override drawer, 13 craft rule chips, 114+ template selector, and user brief textarea.
  - Verify: Toggling layers and editing brief updates state and preview in real time.
  - Files: `src/components/composer/ComposerColumn.tsx`, `src/components/composer/LayerItem.tsx`, `src/components/composer/CraftSelector.tsx`, `src/components/composer/TemplateSelector.tsx`
- [ ] **Task 11: Preview & Action Hub (Column 3)**
  - Acceptance: Live syntax-highlighted prompt preview, off-thread token gauge, 1-click copy with toast, and export dropdown (.md/.txt).
  - Verify: Copying to clipboard and file downloads function properly.
  - Files: `src/components/preview/PreviewColumn.tsx`, `src/components/preview/TokenGauge.tsx`, `src/components/preview/ExportDropdown.tsx`
- [ ] **Task 12: Presets Modal & Starred Favorites Drawer**
  - Acceptance: Modal dialogs for saving, loading, and importing/exporting preset snapshots; quick access to starred items.
  - Verify: Preset lifecycle flows seamlessly in the UI.
  - Files: `src/components/presets/PresetModal.tsx`, `src/components/presets/PresetList.tsx`, `src/components/common/Header.tsx`

### Checkpoint: Studio Workspace Complete
- [ ] 3-column workspace fully interactive and responsive
- [ ] Zero UI stutter when typing with large loaded prompt layers
- [ ] Preset snapshot management and starred favorites operational

---

## Phase 5: Integration, End-to-End Verification & Polish
- [ ] **Task 13: End-to-End Integration & Edge Case Verification**
  - Acceptance: Verified across 5+ diverse brand flows (Linear, Apple, Cyberpunk, Stripe, Minimal), handling edge cases (missing optional files, ultra-long briefs).
  - Verify: All tests pass, zero console errors.
  - Files: `src/App.tsx`, `tests/e2e-workflow.test.ts`
- [ ] **Task 14: Production Bundle Audit & Final Documentation**
  - Acceptance: Production build produces <200KB gzip initial bundle; 100% offline functionality verified; README updated.
  - Verify: `npm run build` completes cleanly with verified bundle size.
  - Files: `README.md`, `package.json`

### Checkpoint: Complete
- [ ] All 14 tasks verified
- [ ] Zero external telemetry confirmed
- [ ] Ready for deployment
