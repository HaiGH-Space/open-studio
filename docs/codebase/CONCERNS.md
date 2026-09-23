# Concerns, Technical Debt & Known Issues

## Overview
This document records technical debt, linting warnings, build warnings, and intent-vs-reality divergences identified during codebase inspection and terminal verification, along with their resolution history.

---

## Intent vs. Reality Divergences [RESOLVED]

| Divergence | Stated Intent / Legacy Doc | Verified Codebase Reality | Status |
| :--- | :--- | :--- | :--- |
| **Catalog System Counts** | Stated as 153 design systems and 13 craft rules in previous `README.md` | `web/public/catalog-index.json` indexes **152 design systems** and **11 craft rules** | **Resolved**: Updated `README.md` to reflect verified counts (152 systems, 11 craft rules, 163 skills, 114 templates). |
| **Documentation Assets Directory** | `README.md` listed `docs/images/` | The `docs/images/` directory does not currently exist on disk | **Resolved**: Removed dead links from `README.md`. |

---

## Static Analysis & Linter Findings [RESOLVED]

Previously, `pnpm lint` (`eslint .` inside `web/`) failed with 2 errors and 3 warnings. All have been resolved:

### 1. Synchronous `setState` Inside Effects
- **File**: [`web/src/components/clarification/QuestionFormModal.tsx`](../../web/src/components/clarification/QuestionFormModal.tsx)
- **Previous Rule**: `react-hooks/set-state-in-effect`
- **Resolution**: Eliminated synchronous `setState` inside `useEffect` by introducing the pure `getInitialAnswers()` helper and adjusting state during render when props or AST change, following React's recommended state-adjustment pattern.
- **Verification**: `pnpm lint` passes with 0 errors.

### 2. Fast Refresh Warnings
- **File**: [`web/src/components/cockpit/LayerTokenStackedBar.tsx`](../../web/src/components/cockpit/LayerTokenStackedBar.tsx)
- **File**: [`web/src/components/cockpit/TokenGaugeBar.tsx`](../../web/src/components/cockpit/TokenGaugeBar.tsx)
- **Previous Rule**: `react-refresh/only-export-components`
- **Resolution**: Removed unnecessary `export` keywords from file-internal constants and helpers (`LAYER_COLOR_MAP`, `getTokenGaugeStatus`, `STATUS_STYLE_MAP`).
- **Verification**: `pnpm lint` passes with 0 warnings.

---

## Test Environment Warnings [INFORMATIONAL / LOW PRIORITY]

During `pnpm test`, tests log `stderr` warnings from React 19:
```
An update to ScrollAreaRoot inside a test was not wrapped in act(...).
```
- **Files Affected**: [`web/tests/ui-components.test.tsx`](../../web/tests/ui-components.test.tsx), [`web/tests/resource-navigator.test.tsx`](../../web/tests/resource-navigator.test.tsx), [`web/tests/composer-manager.test.tsx`](../../web/tests/composer-manager.test.tsx)
- **Root Cause**: `@base-ui/react` `ScrollAreaRoot` performs asynchronous measurement updates when rendered inside the `happy-dom` test harness.
- **Impact**: Zero impact on test correctness. All 303 tests pass cleanly (16 test files).

---

## Build & Production Bundle Optimization [RESOLVED]

Previously, `pnpm build` emitted:
```
(!) Some chunks are larger than 500 kB after minification.
dist/assets/index-C4709r5f.js  511.54 kB │ gzip: 151.68 kB
```
- **Resolution**: Configured `manualChunks` in [`web/vite.config.ts`](../../web/vite.config.ts) to separate vendor libraries:
  - `vendor-react` (React, React-DOM): ~218 kB
  - `vendor-ui` (Base UI, Lucide icons): ~113 kB
  - Main app bundle (`index.js`): ~179 kB
- **Verification**: Chunk sizes are well below the 500 kB threshold. Zero build warnings.

---

## Submodule Dependency Prerequisite [DOCUMENTED]

The build-time script `pnpm catalog:generate` depends on local files inside the `open-design-core-resources` submodule. If developers clone without `--recurse-submodules`, the directory will be empty and `generate-catalog.ts` will fail until `git submodule update --init --recursive` is executed. Documented in `README.md`.

---

## Resolution Status of [ASK USER] Items

1. **[ASK USER] #1** (*Refactor `QuestionFormModal.tsx`*): **Completed**. Refactored to pure state initialization and render-time sync; 0 ESLint errors.
2. **[ASK USER] #2** (*Bring production bundle under 500 kB*): **Completed**. Configured vendor code splitting in `vite.config.ts`; main chunk reduced from 511 kB to 179 kB.

---

## Evidence & Verification Sources

- Terminal ESLint output (`pnpm lint`): **0 errors, 0 warnings (Exit code 0)**
- Terminal Vitest output (`pnpm test`): **16 test files passed, 303 tests passed (Exit code 0)**
- Terminal TypeScript check (`pnpm typecheck`): **0 type errors (Exit code 0)**
- Terminal Vite build output (`pnpm build`): **Clean build, 0 chunk warnings (Exit code 0)**
- Catalog index verification: [`web/public/catalog-index.json`](../../web/public/catalog-index.json)

