# Concerns, Technical Debt & Known Issues

## Overview
This document records verified technical debt, linting warnings, build warnings, and intent-vs-reality divergences identified during codebase inspection and terminal verification.

---

## Intent vs. Reality Divergences

| Divergence | Stated Intent / Legacy Doc | Verified Codebase Reality | Impact |
| :--- | :--- | :--- | :--- |
| **Catalog System Counts** | Stated as 153 design systems and 13 craft rules in previous `README.md` | `web/public/catalog-index.json` indexes **152 design systems** and **11 craft rules** | Minor documentation discrepancy |
| **Documentation Assets Directory** | `README.md` listed `docs/images/` | The `docs/images/` directory does not currently exist on disk | Broken image links if referenced |

---

## Static Analysis & Linter Findings

Running `pnpm lint` (`eslint .` inside `web/`) identified 2 errors and 3 warnings:

### 1. Synchronous `setState` Inside Effects
- **File**: [`web/src/components/clarification/QuestionFormModal.tsx:58:7`](../../web/src/components/clarification/QuestionFormModal.tsx#L58)
  - **Rule**: `react-hooks/set-state-in-effect`
  - **Issue**: `setRawText(initialRawText)` is invoked synchronously inside a `useEffect` body.
- **File**: [`web/src/components/clarification/QuestionFormModal.tsx:70:7`](../../web/src/components/clarification/QuestionFormModal.tsx#L70)
  - **Rule**: `react-hooks/set-state-in-effect`
  - **Issue**: `setAnswers({})` is invoked synchronously inside a `useEffect` body when `parsedAst` is falsy.
  - **Fix Recommendation**: Derive state during render or use a `key` prop on the component to reset state when props change.

### 2. Fast Refresh Warnings
- **File**: [`web/src/components/cockpit/LayerTokenStackedBar.tsx:11:14`](../../web/src/components/cockpit/LayerTokenStackedBar.tsx#L11)
- **File**: [`web/src/components/cockpit/TokenGaugeBar.tsx:13:17`](../../web/src/components/cockpit/TokenGaugeBar.tsx#L13)
  - **Rule**: `react-refresh/only-export-components`
  - **Issue**: Exporting non-component constants alongside components triggers React Fast Refresh warnings.

---

## Test Environment Warnings

During `pnpm test`, multiple tests log `stderr` warnings from React 19:
```
An update to ScrollAreaRoot inside a test was not wrapped in act(...).
```
- **Files Affected**: [`web/tests/ui-components.test.tsx`](../../web/tests/ui-components.test.tsx), [`web/tests/resource-navigator.test.tsx`](../../web/tests/resource-navigator.test.tsx), [`web/tests/composer-manager.test.tsx`](../../web/tests/composer-manager.test.tsx)
- **Root Cause**: `@base-ui/react` `ScrollAreaRoot` performs asynchronous measurement updates when rendered inside the `happy-dom` test harness. All 303 tests pass cleanly, but console stderr output is noisy.

---

## Build & Production Bundle Optimization

Running `pnpm build` (`tsc -b && vite build`) emits the following warning:
```
(!) Some chunks are larger than 500 kB after minification.
dist/assets/index-C4709r5f.js  511.54 kB │ gzip: 151.68 kB
```
- **Analysis**: The initial JS bundle is slightly above the 500 kB threshold due to bundling all UI primitives and Base UI icons into a single chunk.
- **Recommendation**: Introduce Vite dynamic imports (`import()`) for dialogs (`BrandPreviewModal`, `QuestionFormModal`, `CommandMenuDialog`) to split modal code into secondary chunks.

---

## Submodule Dependency Prerequisite

The build-time script `pnpm catalog:generate` depends on local files inside the `open-design-core-resources` submodule. If developers clone without `--recurse-submodules`, the directory will be empty and `generate-catalog.ts` will fail until `git submodule update --init --recursive` is executed.

---

## Numbered [ASK USER] Items

1. **[ASK USER] #1**: Should we refactor `QuestionFormModal.tsx` in a follow-up task to eliminate the two `react-hooks/set-state-in-effect` ESLint errors?
2. **[ASK USER] #2**: Should we implement route or component-level dynamic imports (`React.lazy`) for the modal dialogs to bring the main production JS bundle under 500 kB?

---

## Evidence & Verification Sources

- Terminal ESLint output (`pnpm lint`)
- Terminal Vitest output (`pnpm test`)
- Terminal Vite build output (`pnpm build`)
- Catalog index verification: [`web/public/catalog-index.json`](../../web/public/catalog-index.json)
